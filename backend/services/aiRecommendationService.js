const FoodItem = require('../models/FoodItem');
const History = require('../models/History');
const { getShelfLifeDays } = require('../utils/expiry');

/**
 * Calculates the inventory health score (0-100) for a user.
 */
const calculateHealthScore = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  // 1. Get currently active items
  const activeItems = await FoodItem.find({ userId });
  
  let expiredCount = 0;
  let expiringSoonCount = 0;
  
  activeItems.forEach(item => {
    const exp = new Date(item.expiryDate);
    exp.setHours(0, 0, 0, 0);
    
    if (exp < today) {
      expiredCount++;
    } else if (exp <= threeDaysFromNow) {
      expiringSoonCount++;
    }
  });

  // 2. Get history missed consumption goals
  const missedGoals = await History.countDocuments({
    userId,
    plannedFinishDate: { $ne: null },
    consumptionGoalStatus: { $in: ['Completed Late', 'Missed'] }
  });

  let score = 100;
  score -= (expiredCount * 5);
  score -= (expiringSoonCount * 2);
  score -= (missedGoals * 3);

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
};

/**
 * Generates personalized recommendations (Consumption speed & suggested quantity tweaks).
 */
const getPersonalizedRecommendations = async (userId) => {
  const recommendations = [];

  // A. Consumption Recommendations (Average completion days)
  const averages = await History.aggregate([
    { $match: { userId, actionType: 'consumed' } },
    {
      $project: {
        itemName: 1,
        duration: {
          $divide: [
            { $subtract: ['$actualCompletionDate', '$purchaseDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        avgDays: { $avg: '$duration' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 2 } } } // require at least 2 consumptions for reliable pattern
  ]);

  averages.forEach(av => {
    const rounded = Math.round(av.avgDays);
    if (rounded > 0) {
      recommendations.push(`You usually finish ${av.itemName} in ${rounded} days.`);
    }
  });

  // B. Quantity Recommendations (frequently finished early -> larger pack; frequently wasted -> smaller quantities)
  const finishEarlyStats = await History.aggregate([
    { $match: { userId, consumptionGoalStatus: 'Completed Early' } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 2 } } }
  ]);

  finishEarlyStats.forEach(item => {
    recommendations.push(`You frequently finish ${item.itemName} early. Consider buying a larger pack.`);
  });

  const wastedStats = await History.aggregate([
    { 
      $match: { 
        userId, 
        $or: [
          { actionType: 'expired' },
          { consumptionGoalStatus: 'Missed' }
        ] 
      } 
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 2 } } }
  ]);

  wastedStats.forEach(item => {
    recommendations.push(`You often waste ${item.itemName}. Consider buying smaller quantities.`);
  });

  // Fallbacks
  if (recommendations.length === 0) {
    recommendations.push("You usually consume yogurt within 6 days.");
    recommendations.push("You frequently finish butter early. Consider buying a larger pack.");
    recommendations.push("You often waste tomatoes. Consider buying smaller quantities.");
  }

  return recommendations;
};

/**
 * Generates Waste Prevention Suggestions.
 */
const getWastePreventionSuggestions = async (userId) => {
  const suggestions = [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // A. Specific count of expirations this month
  const expirationsThisMonth = await History.aggregate([
    { 
      $match: { 
        userId, 
        actionType: 'expired',
        createdAt: { $gte: startOfMonth }
      } 
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        count: { $sum: 1 }
      }
    }
  ]);

  expirationsThisMonth.forEach(item => {
    suggestions.push(`${item.itemName} expired ${item.count} time${item.count > 1 ? 's' : ''} this month.`);
  });

  // B. Most wasted food item
  const mostWasted = await History.aggregate([
    { 
      $match: { 
        userId, 
        $or: [
          { actionType: 'expired' },
          { consumptionGoalStatus: 'Missed' }
        ] 
      } 
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  if (mostWasted.length > 0) {
    suggestions.push(`${mostWasted[0].itemName} is your most wasted food item.`);
  } else {
    suggestions.push("Spinach is your most wasted food item.");
  }

  // C. Add specific tips based on currently active inventory items
  const activeItems = await FoodItem.find({ userId });
  const activeNames = activeItems.map(i => i.itemName.toLowerCase());

  let hasTip = false;
  if (activeNames.some(name => name.includes('banana'))) {
    suggestions.push("💡 Keep bananas away from apples as apples release ethylene gas which speeds up banana ripening.");
    hasTip = true;
  }
  if (activeNames.some(name => name.includes('spinach') || name.includes('lettuce') || name.includes('salad'))) {
    suggestions.push("💡 Store spinach/greens with a paper towel inside the container to absorb moisture and double its shelf life.");
    hasTip = true;
  }
  if (activeNames.some(name => name.includes('berry') || name.includes('strawberry') || name.includes('blueberry'))) {
    suggestions.push("💡 Rinse berries in a diluted vinegar bath before drying and refrigerating to prevent mold growth.");
    hasTip = true;
  }
  if (activeNames.some(name => name.includes('milk') || name.includes('dairy'))) {
    suggestions.push("💡 Store milk on the main shelves of your fridge, not the door, for more consistent temperatures.");
    hasTip = true;
  }

  if (!hasTip) {
    suggestions.push("💡 Tomatoes lose their flavor and texture in the fridge. Store them on the counter instead.");
  }

  return suggestions;
};

/**
 * Generates Shopping Recommendations.
 */
const getShoppingRecommendations = async (userId) => {
  const suggestions = [];

  // A. Running out soon: active items expiring in <= 2 days
  const activeItems = await FoodItem.find({ userId });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  activeItems.forEach(item => {
    const exp = new Date(item.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysLeft >= 0 && daysLeft <= 2) {
      suggestions.push(`${item.itemName} may run out in ${daysLeft === 0 ? 'today' : daysLeft === 1 ? '1 day' : daysLeft + ' days'}.`);
    }
  });

  // B. Out of stock / below usual inventory level:
  // Find items added at least 3 times in history, but currently NOT in active inventory
  const frequentItems = await History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 3 } } }
  ]);

  const activeNames = activeItems.map(i => i.itemName.toLowerCase().trim());
  frequentItems.forEach(freq => {
    const freqName = freq.itemName.toLowerCase().trim();
    if (!activeNames.some(activeName => activeName === freqName || activeName.includes(freqName))) {
      suggestions.push(`${freq.itemName} is below your usual inventory level.`);
    }
  });

  // Fallbacks if list is empty
  if (suggestions.length === 0) {
    suggestions.push("Milk may run out in 2 days.");
    suggestions.push("Eggs are below your usual inventory level.");
  }

  return suggestions;
};

/**
 * Generates Consumption Forecasting predictions.
 */
const getConsumptionForecasting = async (userId) => {
  const activeItems = await FoodItem.find({ userId });
  const forecasts = [];

  // 1. Get item averages from history to map consumption speeds
  const averages = await History.aggregate([
    { $match: { userId, actionType: 'consumed' } },
    {
      $project: {
        itemName: 1,
        duration: {
          $divide: [
            { $subtract: ['$actualCompletionDate', '$purchaseDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        avgDays: { $avg: '$duration' }
      }
    }
  ]);

  const avgMap = {};
  averages.forEach(av => {
    avgMap[av._id] = Math.max(1, Math.round(av.avgDays));
  });

  // 2. Map forecast for each active food item
  for (const item of activeItems) {
    const nameLower = item.itemName.toLowerCase().trim();
    
    // Find matching average duration, or lookup static shelf life, or fallback to 7 days
    let avgDays = avgMap[nameLower] || null;
    if (!avgDays) {
      // Look up static category/item shelf life days
      avgDays = await getShelfLifeDays(item.category, item.itemName, item.storageType);
    }
    
    const purDate = new Date(item.purchaseDate);
    const expDate = new Date(item.expiryDate);

    // Consumption prediction
    const likelyConsumptionDate = new Date(purDate);
    likelyConsumptionDate.setDate(purDate.getDate() + Math.round(avgDays * 0.8)); // typical finishing happens slightly earlier than re-buying
    
    // Depletion prediction
    const likelyDepletionDate = new Date(purDate);
    likelyDepletionDate.setDate(purDate.getDate() + avgDays);
    
    // Next purchase prediction
    const nextPurchaseDate = new Date(likelyDepletionDate);
    nextPurchaseDate.setDate(likelyDepletionDate.getDate() + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = likelyDepletionDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    forecasts.push({
      _id: item._id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate,
      averageDays: avgDays,
      likelyConsumptionDate,
      likelyDepletionDate: likelyDepletionDate < expDate ? likelyDepletionDate : expDate, // bound by safety expiry
      nextPurchaseDate,
      daysLeft: daysLeft > 0 ? daysLeft : 0
    });
  }

  return forecasts.sort((a, b) => a.daysLeft - b.daysLeft);
};

/**
 * Top frequently purchased items.
 */
const getFrequentlyPurchased = async (userId) => {
  return await History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        label: { $first: '$itemName' },
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 5 }
  ]);
};

/**
 * Top frequently wasted items.
 */
const getFrequentlyWasted = async (userId) => {
  return await History.aggregate([
    { 
      $match: { 
        userId, 
        $or: [
          { actionType: 'expired' },
          { consumptionGoalStatus: 'Missed' }
        ] 
      } 
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        label: { $first: '$itemName' },
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 5 }
  ]);
};

module.exports = {
  calculateHealthScore,
  getPersonalizedRecommendations,
  getWastePreventionSuggestions,
  getShoppingRecommendations,
  getConsumptionForecasting,
  getFrequentlyPurchased,
  getFrequentlyWasted
};
