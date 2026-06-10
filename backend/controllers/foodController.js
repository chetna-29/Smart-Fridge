const FoodItem = require("../models/FoodItem");
const History = require("../models/History");
const {
  getShelfLifeDays,
  calculateExpiryDate,
  calculateDaysLeft,
} = require("../utils/expiry");

const recordHistory = async (foodItem, actionType, overrides = {}) => {
  try {
    await History.fromFoodItem(foodItem, actionType, overrides);
  } catch (err) {
    console.error(`History record failed for ${actionType}:`, err.message);
  }
};

/**
 * @route   POST /api/foods/add
 * @desc    Add a new food item
 * @access  Private
 */
exports.addFood = async (req, res) => {
  try {
    const { itemName, category, quantity, purchaseDate, expiryDate, storageType, status, notes, finishByDate, consumptionGoalDays } = req.body;

    if (!itemName || !category || !quantity) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
    
    let expDate;
    if (expiryDate) {
      expDate = new Date(expiryDate);
    } else {
      const shelfLifeDays = await getShelfLifeDays(category, itemName, storageType || "Fridge", status || "Unopened");
      expDate = calculateExpiryDate(pDate, shelfLifeDays);
    }

    const foodItem = new FoodItem({
      userId: req.userId,
      itemName,
      category,
      quantity,
      purchaseDate: pDate,
      expiryDate: expDate,
      storageType: storageType || "Fridge",
      status: status || "Unopened",
      notes,
      finishByDate: finishByDate ? new Date(finishByDate) : undefined,
      consumptionGoalDays: consumptionGoalDays || undefined,
    });

    foodItem.calculateDaysLeft();
    await foodItem.save();
    await recordHistory(foodItem, "added");

    res.status(201).json({
      success: true,
      message: "Food item added successfully",
      data: foodItem,
    });
  } catch (err) {
    console.error("Add food error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   GET /api/foods
 * @desc    Get all food items for a user
 * @access  Private
 */
exports.getAllFoods = async (req, res) => {
  try {
    const { search, category, expiryStatus, status } = req.query;
    const query = { userId: req.userId };

    if (search) query.itemName = { $regex: search, $options: "i" };
    if (category && category !== "All") query.category = category;
    if (expiryStatus && expiryStatus !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      if (expiryStatus === 'expired') {
        query.expiryDate = { $lt: today };
      } else if (expiryStatus === 'expiring' || expiryStatus === 'expiring_soon') {
        query.expiryDate = { $gte: today, $lte: threeDaysFromNow };
      } else if (expiryStatus === 'fresh') {
        query.expiryDate = { $gt: threeDaysFromNow };
      }
    }
    if (status && status !== "All") query.status = status;

    const foodItems = await FoodItem.find(query).sort({ expiryDate: 1 });
    foodItems.forEach((item) => item.calculateDaysLeft());

    res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems,
    });
  } catch (err) {
    console.error("Get foods error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   GET /api/foods/:id
 * @desc    Get a specific food item
 * @access  Private
 */
exports.getFood = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (foodItem.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    foodItem.calculateDaysLeft();
    res.status(200).json({ success: true, data: foodItem });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   PUT /api/foods/:id
 * @desc    Update a food item
 * @access  Private
 */
exports.updateFood = async (req, res) => {
  try {
    let foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (foodItem.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { itemName, category, quantity, purchaseDate, expiryDate, storageType, status, notes, finishByDate, consumptionGoalDays } = req.body;

    if (itemName) foodItem.itemName = itemName;
    if (category) foodItem.category = category;
    if (quantity) foodItem.quantity = quantity;
    if (storageType) foodItem.storageType = storageType;
    if (status) foodItem.status = status;
    if (notes) foodItem.notes = notes;
    if (purchaseDate) foodItem.purchaseDate = new Date(purchaseDate);
    if (finishByDate !== undefined) foodItem.finishByDate = finishByDate ? new Date(finishByDate) : null;
    if (consumptionGoalDays !== undefined) foodItem.consumptionGoalDays = consumptionGoalDays;

    if (expiryDate) {
      foodItem.expiryDate = new Date(expiryDate);
    } else if (purchaseDate || category || itemName || status || storageType || finishByDate || consumptionGoalDays) {
      const pDate = foodItem.purchaseDate;
      const cat = foodItem.category;
      const shelfLifeDays = await getShelfLifeDays(
        cat, 
        foodItem.itemName, 
        storageType || foodItem.storageType || "Fridge", 
        status || foodItem.status || "Unopened"
      );
      foodItem.expiryDate = calculateExpiryDate(pDate, shelfLifeDays);
    }

    foodItem.calculateDaysLeft();
    await foodItem.save();

    res.status(200).json({
      success: true,
      message: "Food item updated successfully",
      data: foodItem,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   DELETE /api/foods/:id
 * @desc    Delete a food item
 * @access  Private
 */
exports.deleteFood = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (foodItem.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await recordHistory(foodItem, "deleted");
    await FoodItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Food item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   GET /api/foods/expiring/soon
 * @desc    Get foods expiring soon (1-3 days)
 * @access  Private
 */
exports.getExpiringFood = async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ userId: req.userId });

    const expiringFood = foodItems.filter((item) => {
      const daysLeft = calculateDaysLeft(item.expiryDate);
      return daysLeft >= 1 && daysLeft <= 3;
    });

    expiringFood.forEach((item) => item.calculateDaysLeft());

    res.status(200).json({
      success: true,
      count: expiringFood.length,
      message: `${expiringFood.length} items expiring soon`,
      data: expiringFood,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   GET /api/foods/expired/list
 * @desc    Get expired foods
 * @access  Private
 */
exports.getExpiredFood = async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ userId: req.userId });

    const expiredFood = foodItems.filter((item) => {
      const daysLeft = calculateDaysLeft(item.expiryDate);
      return daysLeft < 0;
    });

    expiredFood.forEach((item) => item.calculateDaysLeft());

    res.status(200).json({
      success: true,
      count: expiredFood.length,
      message: `${expiredFood.length} items expired`,
      data: expiredFood,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * @route   GET /api/foods/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const foodItems = await FoodItem.find({ userId: req.userId });

    const stats = {
      totalItems: foodItems.length,
      fresh: 0,
      expiringsSoon: 0,
      expired: 0,
      byCategory: {},
    };

    foodItems.forEach((item) => {
      item.calculateDaysLeft();

      if (item.status === "fresh") stats.fresh++;
      else if (item.status === "expiring_soon") stats.expiringsSoon++;
      else if (item.status === "expired") stats.expired++;

      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = 0;
      }
      stats.byCategory[item.category]++;
    });

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
};

exports.suggestExpiry = async (req, res) => {
  try {
    const { itemName = "", category = "other", storageType = "Fridge", status = "Unopened" } = req.query;
    const days = await getShelfLifeDays(category, itemName, storageType, status);
    res.status(200).json({
      success: true,
      shelfLifeDays: days,
    });
  } catch (err) {
    console.error("Expiry suggestion error:", err);
    res.status(500).json({ error: "Failed to predict expiry" });
  }
};

exports.consumeFood = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (foodItem.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await recordHistory(foodItem, "consumed");
    await foodItem.deleteOne();

    res.status(200).json({ success: true, message: "Food item marked as consumed" });
  } catch (err) {
    console.error("Consume food error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
