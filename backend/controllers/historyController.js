const mongoose = require('mongoose');
const History = require('../models/History');
const FoodItem = require('../models/FoodItem');

const buildHistoryQuery = (req) => {
  const {
    itemName,
    search,
    category,
    status,
    storageType,
    actionType,
    startDate,
    endDate,
  } = req.query;

  const query = { userId: req.userId };
  const nameFilter = itemName || search;

  if (nameFilter) query.itemName = { $regex: nameFilter, $options: 'i' };
  if (category && category !== 'All') query.category = category;
  if (status && status !== 'All') query.status = status;
  if (storageType && storageType !== 'All') query.storageType = storageType;
  if (actionType && actionType !== 'All') query.actionType = actionType;

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.purchaseDate.$lte = end;
    }
  }

  return query;
};

const toCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const historyToRows = (records) =>
  records.map((record) => ({
    id: record._id,
    itemName: record.itemName,
    category: record.category,
    quantity: record.quantity,
    purchaseDate: record.purchaseDate,
    expiryDate: record.expiryDate,
    storageType: record.storageType,
    status: record.status,
    actionType: record.actionType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

const buildCsv = (records) => {
  const rows = historyToRows(records);
  const headers = [
    'id',
    'itemName',
    'category',
    'quantity',
    'purchaseDate',
    'expiryDate',
    'storageType',
    'status',
    'actionType',
    'createdAt',
    'updatedAt',
  ];

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(',')),
  ].join('\n');
};

const buildExcelHtml = (records) => {
  const rows = historyToRows(records);
  const headers = Object.keys(rows[0] || {
    id: '',
    itemName: '',
    category: '',
    quantity: '',
    purchaseDate: '',
    expiryDate: '',
    storageType: '',
    status: '',
    actionType: '',
    createdAt: '',
    updatedAt: '',
  });

  const escapeCell = (value) =>
    `<td>${String(value || '').replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]))}</td>`;

  return `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers
    .map((header) => `<th>${header}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => escapeCell(row[header])).join('')}</tr>`)
    .join('')}</tbody></table></body></html>`;
};

const buildSimplePdf = (records) => {
  const lines = [
    'Smart Fridge AI - Food Inventory History',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...records.slice(0, 200).map((record) =>
      `${record.createdAt.toISOString().slice(0, 10)} | ${record.itemName} | ${record.category} | ${record.quantity} | ${record.actionType}`
    ),
  ];
  const text = lines.join('\n').replace(/[()\\]/g, '\\$&');
  const stream = `BT /F1 10 Tf 40 780 Td 12 TL (${text}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

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

const getConsumptionGoalStats = async (userId) => {
  const stats = await History.aggregate([
    { $match: { userId, plannedFinishDate: { $ne: null } } },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        completedOnTime: {
          $sum: {
            $cond: [
              { $in: ['$consumptionGoalStatus', ['Completed Early', 'Completed On Time']] },
              1,
              0
            ]
          }
        },
        missed: {
          $sum: {
            $cond: [
              { $in: ['$consumptionGoalStatus', ['Completed Late', 'Missed']] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalGoals: 0,
      goalsCompletedOnTime: 0,
      goalsMissed: 0,
      consumptionSuccessRate: 0
    };
  }

  const { totalGoals, completedOnTime, missed } = stats[0];
  const successRate = totalGoals > 0 ? Math.round((completedOnTime / totalGoals) * 100) : 0;

  return {
    totalGoals,
    goalsCompletedOnTime: completedOnTime,
    goalsMissed: missed,
    consumptionSuccessRate: successRate
  };
};

const getGoalCompletionRate = (userId) =>
  History.aggregate([
    { $match: { userId, plannedFinishDate: { $ne: null } } },
    {
      $group: {
        _id: '$consumptionGoalStatus',
        count: { $sum: 1 }
      }
    },
    { $project: { _id: 0, status: '$_id', count: 1 } }
  ]);

const getMostMissedFoods = (userId, limit = 5) =>
  History.aggregate([
    {
      $match: {
        userId,
        plannedFinishDate: { $ne: null },
        consumptionGoalStatus: { $in: ['Completed Late', 'Missed'] }
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
    { $limit: limit },
    { $project: { _id: 0, itemName: 1, count: 1 } }
  ]);

const getMostOnTimeFoods = (userId, limit = 5) =>
  History.aggregate([
    {
      $match: {
        userId,
        plannedFinishDate: { $ne: null },
        consumptionGoalStatus: { $in: ['Completed Early', 'Completed On Time'] }
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
    { $limit: limit },
    { $project: { _id: 0, itemName: 1, count: 1 } }
  ]);

const getConsumptionTrends = (userId) =>
  History.aggregate([
    { $match: { userId, plannedFinishDate: { $ne: null } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        success: {
          $sum: {
            $cond: [
              { $in: ['$consumptionGoalStatus', ['Completed Early', 'Completed On Time']] },
              1,
              0
            ]
          }
        },
        missed: {
          $sum: {
            $cond: [
              { $in: ['$consumptionGoalStatus', ['Completed Late', 'Missed']] },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        label: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]
            }
          ]
        },
        success: 1,
        missed: 1
      }
    }
  ]);

const getAIInsights = async (userId) => {
  const insights = [];

  // 1. Average completion days by item
  const averages = await History.aggregate([
    { $match: { userId, actionType: 'consumed', plannedFinishDate: { $ne: null } } },
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
    { $match: { count: { $gte: 1 } } }
  ]);

  averages.forEach(av => {
    const rounded = Math.round(av.avgDays);
    if (rounded > 0 && rounded <= 10) {
      insights.push(`💡 You usually finish ${av.itemName} within ${rounded} days.`);
    }
  });

  // 2. Frequently missed foods
  const missedStats = await History.aggregate([
    { $match: { userId, plannedFinishDate: { $ne: null } } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        total: { $sum: 1 },
        missedCount: {
          $sum: {
            $cond: [
              { $in: ['$consumptionGoalStatus', ['Completed Late', 'Missed']] },
              1,
              0
            ]
          }
        }
      }
    },
    { $match: { missedCount: { $gte: 1 } } }
  ]);

  missedStats.forEach(ms => {
    if (ms.missedCount >= 2) {
      insights.push(`⚠ You frequently miss ${ms.itemName} consumption goals.`);
      insights.push(`💡 Consider buying smaller quantities of ${ms.itemName}.`);
    }
  });

  // 3. Consumed faster than expected
  const speedStats = await History.aggregate([
    { $match: { userId, actionType: 'consumed', plannedFinishDate: { $ne: null } } },
    {
      $group: {
        _id: { $toLower: '$itemName' },
        itemName: { $first: '$itemName' },
        avgDiff: { $avg: '$daysDifference' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gte: 1 }, avgDiff: { $lt: -1 } } }
  ]);

  speedStats.forEach(ss => {
    insights.push(`⚡ You consume ${ss.itemName} faster than expected.`);
  });

  // Default insights fallback
  if (insights.length === 0) {
    insights.push("💡 Tip: Set consumption duration targets on high-waste items like produce to receive reminders.");
    insights.push("💡 Buying milk or butter? Freezer storage can preserve them if consumption goals are missed.");
  }

  return Array.from(new Set(insights)).slice(0, 4);
};

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
    consumptionGoalStats,
    goalCompletionRate,
    mostMissedFoods,
    mostOnTimeFoods,
    consumptionTrends,
    aiInsights
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
    getConsumptionGoalStats(userId),
    getGoalCompletionRate(userId),
    getMostMissedFoods(userId, 5),
    getMostOnTimeFoods(userId, 5),
    getConsumptionTrends(userId),
    getAIInsights(userId)
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
    consumptionGoalStats,
    goalCompletionRate,
    mostMissedFoods,
    mostOnTimeFoods,
    consumptionTrends,
    aiInsights,
    dashboardWidgets: {
      totalItemsPurchased: totalItemsEverAdded,
      totalInventoryValue: null,
      topFiveMostAddedItems: topItems,
      recentlyAddedFoods,
      expiringFoods,
      expiredFoods,
    },
    futureAiReadiness: {
      consumptionGoalTracking: {
        totalGoals: consumptionGoalStats.totalGoals,
        successRate: consumptionGoalStats.consumptionSuccessRate
      },
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

exports.getHistory = async (req, res) => {
  try {
    const query = buildHistoryQuery(req);
    const records = await History.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};

exports.getHistoryRecord = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid history record id' });
    }

    const record = await History.findOne({ _id: req.params.id, userId: req.userId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'History record not found' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history record' });
  }
};

exports.getRecentHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const records = await History.find({ userId: req.userId, actionType: 'added' })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching recent history' });
  }
};

exports.getHistoryStats = async (req, res) => {
  try {
    const stats = await getAnalyticsSummary(req.userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history stats' });
  }
};

exports.getMonthlyHistory = async (req, res) => {
  try {
    const data = await getMonthlyAdditions(req.userId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly additions' });
  }
};

exports.getTopHistoryItems = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await getTopItems(req.userId, limit);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching top history items' });
  }
};

exports.exportHistory = async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const records = await History.find(buildHistoryQuery(req)).sort({ createdAt: -1 });
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'excel' || format === 'xlsx' || format === 'xls') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.xls"`);
      return res.send(buildExcelHtml(records));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.pdf"`);
      return res.send(buildSimplePdf(records));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.csv"`);
    return res.send(buildCsv(records));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error exporting history' });
  }
};
