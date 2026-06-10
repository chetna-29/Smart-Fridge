const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const History = require('../models/History');
const { protect } = require('../middleware/auth');
const { getPredictedShelfLife } = require('../data/shelfLife');

/**
 * @desc    Get all food items for the logged-in user
 * @route   GET /api/food
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, status, storageType, expiryStatus } = req.query;
    
    // Build query object
    let query = { userId: req.user._id };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by opened/unopened status
    if (status) {
      query.status = status;
    }

    // Filter by storage type
    if (storageType) {
      query.storageType = storageType;
    }

    // Filter by name (case-insensitive search)
    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }

    let items = await FoodItem.find(query).sort({ expiryDate: 1 }); // Sort by earliest expiry first

    // Optional: Filter by expiry status in memory (fresh, expiring, expired)
    if (expiryStatus) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      items = items.filter((item) => {
        const expDate = new Date(item.expiryDate);
        expDate.setHours(0, 0, 0, 0);

        if (expiryStatus === 'expired') {
          return expDate < today;
        } else if (expiryStatus === 'expiring') {
          return expDate >= today && expDate <= threeDaysFromNow;
        } else if (expiryStatus === 'fresh') {
          return expDate > threeDaysFromNow;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching food items' });
  }
});

/**
 * @desc    Suggest expiry date / shelf life days
 * @route   GET /api/food/suggest-expiry
 * @access  Private
 */
router.get('/suggest-expiry', protect, (req, res) => {
  try {
    const { itemName, category } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Please provide a category for prediction' });
    }

    const shelfLifeDays = getPredictedShelfLife(itemName, category);
    
    res.status(200).json({
      success: true,
      shelfLifeDays,
      message: `Suggested shelf life for ${itemName || 'category default'} is ${shelfLifeDays} days`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error predicting expiry' });
  }
});

/**
 * @desc    Add a new food item
 * @route   POST /api/food
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { itemName, category, quantity, purchaseDate, expiryDate, storageType, status } = req.body;

    if (!itemName || !category || !quantity) {
      return res.status(400).json({ success: false, message: 'Please provide item name, category, and quantity' });
    }

    // Determine purchase date
    const pDate = purchaseDate ? new Date(purchaseDate) : new Date();

    // Determine or calculate expiry date
    let expDate;
    if (expiryDate) {
      expDate = new Date(expiryDate);
    } else {
      // Predict shelf life based on data
      const shelfLifeDays = getPredictedShelfLife(itemName, category);
      expDate = new Date(pDate);
      expDate.setDate(expDate.getDate() + shelfLifeDays);
    }

    const foodItem = await FoodItem.create({
      userId: req.user._id,
      itemName,
      category,
      quantity,
      purchaseDate: pDate,
      expiryDate: expDate,
      storageType: storageType || 'Fridge',
      status: status || 'Unopened',
    });

    await History.fromFoodItem(foodItem, 'added');

    res.status(201).json({
      success: true,
      data: foodItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error adding food item' });
  }
});

/**
 * @desc    Mark a food item as consumed and remove it from active inventory
 * @route   PATCH /api/food/:id/consume
 * @access  Private
 */
router.patch('/:id/consume', protect, async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to consume this item' });
    }

    const historyRecord = await History.fromFoodItem(foodItem, 'consumed', {
      status: 'Consumed',
      metadata: {
        recommendationSignals: ['consumed'],
        groceryPlanningTags: ['restock-candidate'],
      },
    });

    await FoodItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Food item marked as consumed',
      data: historyRecord,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error consuming food item' });
  }
});

/**
 * @desc    Update a food item
 * @route   PUT /api/food/:id
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    // Ensure item belongs to user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this item' });
    }

    if (req.body.actionType === 'consumed' || req.body.status === 'Consumed') {
      const historyRecord = await History.fromFoodItem(foodItem, 'consumed', {
        status: 'Consumed',
        metadata: {
          recommendationSignals: ['consumed'],
          groceryPlanningTags: ['restock-candidate'],
        },
      });

      await FoodItem.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Food item marked as consumed',
        data: historyRecord,
      });
    }

    // If purchaseDate or itemName or category changed, and expiryDate is NOT explicitly updated in body, re-calculate it?
    // Usually better to let user manage, but if they provide specific values we update them.
    const updates = req.body;
    
    // Check if dates are changing
    if (updates.purchaseDate) updates.purchaseDate = new Date(updates.purchaseDate);
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);

    foodItem = await FoodItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: foodItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating food item' });
  }
});

/**
 * @desc    Delete a food item
 * @route   DELETE /api/food/:id
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    // Ensure item belongs to user
    if (foodItem.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this item' });
    }

    const isExpired = new Date(foodItem.expiryDate) < new Date(new Date().setHours(0, 0, 0, 0));
    const actionType = req.query.actionType === 'expired' || isExpired ? 'expired' : 'deleted';

    await History.fromFoodItem(foodItem, actionType, {
      status: actionType === 'expired' ? 'Expired' : 'Deleted',
      metadata: {
        wasteRiskScore: isExpired ? 1 : 0,
        recommendationSignals: [actionType],
        groceryPlanningTags: actionType === 'expired' ? ['waste-review'] : [],
      },
    });

    await FoodItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Food item removed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error deleting food item' });
  }
});

module.exports = router;
