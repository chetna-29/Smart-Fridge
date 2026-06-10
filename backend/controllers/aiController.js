const aiRecommendationService = require('../services/aiRecommendationService');

/**
 * @route   GET /api/ai/dashboard
 * @desc    Retrieve all AI Dashboard insights, score, forecasts, and lists
 * @access  Private
 */
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.userId;

    const [
      healthScore,
      personalizedRecommendations,
      wastePreventionSuggestions,
      shoppingRecommendations,
      consumptionPredictions,
      frequentlyPurchased,
      frequentlyWasted
    ] = await Promise.all([
      aiRecommendationService.calculateHealthScore(userId),
      aiRecommendationService.getPersonalizedRecommendations(userId),
      aiRecommendationService.getWastePreventionSuggestions(userId),
      aiRecommendationService.getShoppingRecommendations(userId),
      aiRecommendationService.getConsumptionForecasting(userId),
      aiRecommendationService.getFrequentlyPurchased(userId),
      aiRecommendationService.getFrequentlyWasted(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        healthScore,
        personalizedRecommendations,
        wastePreventionSuggestions,
        shoppingRecommendations,
        consumptionPredictions,
        frequentlyPurchased,
        frequentlyWasted
      }
    });
  } catch (err) {
    console.error('AI Dashboard data retrieval error:', err);
    res.status(500).json({ error: 'Server error generating AI insights' });
  }
};

/**
 * @route   GET /api/ai/notifications
 * @desc    Retrieve AI-generated user warnings and shopping reminders
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const [shoppingRecommendations, wastePreventionSuggestions, consumptionPredictions] = await Promise.all([
      aiRecommendationService.getShoppingRecommendations(userId),
      aiRecommendationService.getWastePreventionSuggestions(userId),
      aiRecommendationService.getConsumptionForecasting(userId)
    ]);

    const notifications = [];
    let notifCounter = 1;

    // 1. Add running out / low inventory reminders
    shoppingRecommendations.forEach(rec => {
      // Avoid generic fallbacks in notifications if we want clean alerts
      if (rec) {
        notifications.push({
          id: `ai_notif_${notifCounter++}`,
          type: 'shopping',
          message: rec
        });
      }
    });

    // 2. Add high waste warnings
    wastePreventionSuggestions.forEach(sug => {
      if (sug && (sug.includes('expired') || sug.includes('wasted') || sug.includes('waste'))) {
        notifications.push({
          id: `ai_notif_${notifCounter++}`,
          type: 'warning',
          message: sug
        });
      }
    });

    // 3. Add predictions for items likely to finish tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    consumptionPredictions.forEach(pred => {
      const completionDate = new Date(pred.likelyConsumptionDate);
      completionDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === tomorrow.getTime()) {
        notifications.push({
          id: `ai_notif_${notifCounter++}`,
          type: 'info',
          message: `You are likely to finish ${pred.itemName} tomorrow.`
        });
      }
    });

    // Limit notifications list
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications.slice(0, 8)
    });
  } catch (err) {
    console.error('AI Notifications retrieval error:', err);
    res.status(500).json({ error: 'Server error generating AI notifications' });
  }
};
