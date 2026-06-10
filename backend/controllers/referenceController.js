const referenceService = require('../services/referenceService');

/**
 * Maps USDA FoodKeeper category string onto client standard categories:
 * ['Fruit', 'Vegetable', 'Dairy', 'Meat/Seafood', 'Packaged Food', 'Beverage', 'Bakery', 'Other']
 */
const mapCategory = (usdaCategory) => {
  if (!usdaCategory) return 'Other';
  const cat = usdaCategory.toLowerCase().trim();
  
  if (cat.includes('dairy') || cat.includes('egg') || cat.includes('milk') || cat.includes('cheese') || cat.includes('butter') || cat.includes('yogurt')) {
    return 'Dairy';
  }
  if (cat.includes('fruit')) {
    return 'Fruit';
  }
  if (cat.includes('vegetable') || cat.includes('greens') || cat.includes('salad') || cat.includes('herbs') || cat.includes('garlic') || cat.includes('onion')) {
    return 'Vegetable';
  }
  if (cat.includes('meat') || cat.includes('poultry') || cat.includes('seafood') || cat.includes('fish') || cat.includes('beef') || cat.includes('chicken') || cat.includes('pork') || cat.includes('turkey') || cat.includes('lamb') || cat.includes('game')) {
    return 'Meat/Seafood';
  }
  if (cat.includes('bakery') || cat.includes('bread') || cat.includes('grain') || cat.includes('cereal') || cat.includes('dough') || cat.includes('flour') || cat.includes('tortilla') || cat.includes('pasta')) {
    return 'Bakery';
  }
  if (cat.includes('beverage') || cat.includes('juice') || cat.includes('soda') || cat.includes('drink') || cat.includes('water') || cat.includes('coffee') || cat.includes('tea')) {
    return 'Beverage';
  }
  if (cat.includes('packaged') || cat.includes('canned') || cat.includes('shelf-stable') || cat.includes('condiment') || cat.includes('sauce') || cat.includes('snack') || cat.includes('deli') || cat.includes('soup') || cat.includes('cookie') || cat.includes('nut') || cat.includes('seed') || cat.includes('bean') || cat.includes('oil') || cat.includes('sweet') || cat.includes('spice') || cat.includes('baking')) {
    return 'Packaged Food';
  }
  
  return 'Other';
};

/**
 * @route   GET /api/reference/search
 * @desc    Search FoodKeeper reference items by query and optional category filter
 * @access  Private/Public (Authenticated depending on middleware, we will use authenticated to match frontend requirement or public reference)
 */
exports.search = async (req, res) => {
  try {
    const { q = '', category = '' } = req.query;
    
    const results = await referenceService.searchReference(q, category);
    
    // Map categories for frontend consumption
    const mappedResults = results.map(item => {
      const itemObj = item.toObject();
      itemObj.mappedCategory = mapCategory(item.category);
      return itemObj;
    });
    
    res.status(200).json({
      success: true,
      count: mappedResults.length,
      data: mappedResults
    });
  } catch (err) {
    console.error('Reference search error:', err);
    res.status(500).json({ error: 'Server error searching food reference database' });
  }
};

/**
 * @route   GET /api/reference/category/:category
 * @desc    Get FoodKeeper reference items by category
 * @access  Private
 */
exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }

    const results = await referenceService.getByCategory(category);
    
    // Map categories for frontend consumption
    const mappedResults = results.map(item => {
      const itemObj = item.toObject();
      itemObj.mappedCategory = mapCategory(item.category);
      return itemObj;
    });

    res.status(200).json({
      success: true,
      count: mappedResults.length,
      data: mappedResults
    });
  } catch (err) {
    console.error('Reference getByCategory error:', err);
    res.status(500).json({ error: 'Server error retrieving category reference data' });
  }
};

/**
 * @route   GET /api/reference/:id
 * @desc    Get specific FoodKeeper reference item by ID
 * @access  Private
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await referenceService.getById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Reference item not found' });
    }
    
    const itemObj = item.toObject();
    itemObj.mappedCategory = mapCategory(item.category);
    
    res.status(200).json({
      success: true,
      data: itemObj
    });
  } catch (err) {
    console.error('Reference getById error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid reference item ID format' });
    }
    res.status(500).json({ error: 'Server error retrieving reference item' });
  }
};

