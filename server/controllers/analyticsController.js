const FoodItem = require('../models/FoodItem');
const History = require('../models/History');

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getCategoryStats = (userId) =>
  History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        quantityEntries: { $push: '$quantity' },
      },
    },
    { $sort: { total: -1 } },
    { $project: { _id: 0, category: '$_id', total: 1, quantityEntries: 1 } },
  ]);

const getTopItems = (userId, limit = 5) =>
  History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        category: { $first: '$category' },
        count: { $sum: 1 },
        lastAddedAt: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1, lastAddedAt: -1 } },
    { $limit: limit },
    { $project: { _id: 0, itemName: 1, category: 1, count: 1, lastAddedAt: 1 } },
  ]);

const getMonthlyAdditions = (userId) =>
  History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: {
          year: { $year: '$purchaseDate' },
          month: { $month: '$purchaseDate' },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        label: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        total: 1,
      },
    },
  ]);

const getWeeklyAdditions = (userId) =>
  History.aggregate([
    { $match: { userId, actionType: 'added' } },
    {
      $group: {
        _id: {
          isoWeekYear: { $isoWeekYear: '$purchaseDate' },
          isoWeek: { $isoWeek: '$purchaseDate' },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.isoWeekYear': 1, '_id.isoWeek': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.isoWeekYear',
        week: '$_id.isoWeek',
        label: {
          $concat: [
            { $toString: '$_id.isoWeekYear' },
            '-W',
            { $toString: '$_id.isoWeek' },
          ],
        },
        total: 1,
      },
    },
  ]);

const getFrequentlyWastedItems = (userId, limit = 5) =>
  History.aggregate([
    {
      $match: {
        userId,
        $or: [
          { actionType: 'expired' },
          { actionType: 'deleted', expiryDate: { $lt: startOfToday() } },
        ],
      },
    },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        category: { $first: '$category' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, itemName: 1, category: 1, count: 1 } },
  ]);

const getAnalyticsSummary = async (userId) => {
  const today = startOfToday();
  const nextThreeDays = new Date(today);
  nextThreeDays.setDate(today.getDate() + 3);

  const [
    totalItemsEverAdded,
    totalActiveItems,
    totalExpiredActiveItems,
    consumedItems,
    deletedItems,
    expiredEvents,
    topItems,
    monthlyTrends,
    weeklyTrends,
    categoryStats,
    frequentlyWastedItems,
    recentlyAddedFoods,
    expiringFoods,
    expiredFoods,
  ] = await Promise.all([
    History.countDocuments({ userId, actionType: 'added' }),
    FoodItem.countDocuments({ userId }),
    FoodItem.countDocuments({ userId, expiryDate: { $lt: today } }),
    History.countDocuments({ userId, actionType: 'consumed' }),
    History.countDocuments({ userId, actionType: 'deleted' }),
    History.countDocuments({ userId, actionType: 'expired' }),
    getTopItems(userId, 5),
    getMonthlyAdditions(userId),
    getWeeklyAdditions(userId),
    getCategoryStats(userId),
    getFrequentlyWastedItems(userId, 5),
    History.find({ userId, actionType: 'added' }).sort({ createdAt: -1 }).limit(8),
    FoodItem.find({ userId, expiryDate: { $gte: today, $lte: nextThreeDays } })
      .sort({ expiryDate: 1 })
      .limit(8),
    FoodItem.find({ userId, expiryDate: { $lt: today } }).sort({ expiryDate: 1 }).limit(8),
  ]);

  return {
    totalItemsEverAdded,
    totalActiveItems,
    totalExpiredItems: totalExpiredActiveItems + expiredEvents,
    totalConsumedItems: consumedItems,
    totalDeletedItems: deletedItems,
    totalInventoryValue: null,
    mostPurchasedItems: topItems,
    monthlyPurchaseTrends: monthlyTrends,
    weeklyPurchaseTrends: weeklyTrends,
    categoryWiseStatistics: categoryStats,
    frequentlyWastedItems,
    dashboardWidgets: {
      totalItemsPurchased: totalItemsEverAdded,
      totalInventoryValue: null,
      topFiveMostAddedItems: topItems,
      recentlyAddedFoods,
      expiringFoods,
      expiredFoods,
    },
    futureAiReadiness: {
      consumptionPrediction: {
        availableFields: ['userId', 'itemName', 'category', 'quantity', 'purchaseDate', 'expiryDate', 'storageType', 'status', 'actionType'],
      },
      shoppingRecommendationEngine: {
        availableSignals: ['purchase frequency', 'category trends', 'recent additions', 'consumed events'],
      },
      wastePrediction: {
        availableSignals: ['expired events', 'deleted-after-expiry records', 'expiry date patterns'],
      },
      smartGroceryPlanning: {
        availableSignals: ['top items', 'monthly trends', 'weekly trends', 'category mix'],
      },
    },
  };
};

module.exports = {
  getAnalyticsSummary,
  getCategoryStats,
  getFrequentlyWastedItems,
  getMonthlyAdditions,
  getTopItems,
  getWeeklyAdditions,
};
