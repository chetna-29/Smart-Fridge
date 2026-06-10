require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FoodItem = require('./models/FoodItem');
const History = require('./models/History');
const aiRecommendationService = require('./services/aiRecommendationService');

const runTests = async () => {
  let testUser = null;
  const itemsCreated = [];
  const historyCreated = [];

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected');

    // 1. Create a test user
    const email = `test-ai-user-${Date.now()}@example.com`;
    testUser = await User.create({
      name: 'AI Test User',
      email,
      password: 'password123'
    });
    console.log(`✓ Created test user: ${testUser.email}`);
    const userId = testUser._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Seed active items:
    // A. 1 Expired item (-5 points)
    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() - 2);
    const expiredItem = await FoodItem.create({
      userId,
      itemName: 'Milk',
      category: 'Dairy',
      quantity: '1 carton',
      purchaseDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      expiryDate: expiredDate,
      storageType: 'Fridge',
      status: 'Unopened'
    });
    itemsCreated.push(expiredItem);

    // B. 1 Expiring Soon item (-2 points)
    const expiringSoonDate = new Date(today);
    expiringSoonDate.setDate(today.getDate() + 2);
    const expiringItem = await FoodItem.create({
      userId,
      itemName: 'Tomatoes',
      category: 'Vegetable',
      quantity: '4 units',
      purchaseDate: today,
      expiryDate: expiringSoonDate,
      storageType: 'Fridge',
      status: 'Unopened'
    });
    itemsCreated.push(expiringItem);

    // C. 1 Fresh item (0 point deduction)
    const freshDate = new Date(today);
    freshDate.setDate(today.getDate() + 10);
    const freshItem = await FoodItem.create({
      userId,
      itemName: 'Yogurt',
      category: 'Dairy',
      quantity: '2 packs',
      purchaseDate: today,
      expiryDate: freshDate,
      storageType: 'Fridge',
      status: 'Unopened'
    });
    itemsCreated.push(freshItem);

    // 3. Seed History records:
    // A. Consumed goals (Yogurt consumed within 6 days - consumed twice to build average)
    // First Yogurt consumption (took 5 days)
    const yogurtHistory1 = await History.create({
      userId,
      itemName: 'Yogurt',
      category: 'Dairy',
      quantity: '1 pack',
      purchaseDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'consumed',
      actionType: 'consumed',
      actualCompletionDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
    });
    historyCreated.push(yogurtHistory1);

    // Second Yogurt consumption (took 7 days)
    const yogurtHistory2 = await History.create({
      userId,
      itemName: 'Yogurt',
      category: 'Dairy',
      quantity: '1 pack',
      purchaseDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'consumed',
      actionType: 'consumed',
      actualCompletionDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
    });
    historyCreated.push(yogurtHistory2);

    // B. Consumed early twice (to check butter larger pack recommendation)
    const butter1 = await History.create({
      userId,
      itemName: 'Butter',
      category: 'Dairy',
      quantity: '250g',
      purchaseDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'consumed',
      actionType: 'consumed',
      plannedFinishDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      actualCompletionDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      consumptionGoalStatus: 'Completed Early'
    });
    historyCreated.push(butter1);

    const butter2 = await History.create({
      userId,
      itemName: 'Butter',
      category: 'Dairy',
      quantity: '250g',
      purchaseDate: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'consumed',
      actionType: 'consumed',
      plannedFinishDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      actualCompletionDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      consumptionGoalStatus: 'Completed Early'
    });
    historyCreated.push(butter2);

    // C. Missed goals/expired twice (to check spinach smaller quantities recommendation)
    // Missed goals subtract points (-3 each)
    const spinach1 = await History.create({
      userId,
      itemName: 'Spinach',
      category: 'Vegetable',
      quantity: '1 pack',
      purchaseDate: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'expired',
      actionType: 'expired',
      plannedFinishDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      consumptionGoalStatus: 'Missed'
    });
    historyCreated.push(spinach1);

    const spinach2 = await History.create({
      userId,
      itemName: 'Spinach',
      category: 'Vegetable',
      quantity: '1 pack',
      purchaseDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      storageType: 'Fridge',
      status: 'expired',
      actionType: 'expired',
      plannedFinishDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      consumptionGoalStatus: 'Missed'
    });
    historyCreated.push(spinach2);

    // 4. Test Health Score
    console.log('\n--- Test 1: Health Score ---');
    // Expected:
    // Starting score = 100
    // Expired item (Milk) = -5
    // Expiring soon item (Tomatoes) = -2
    // Missed goals (2 Spinach) = -6
    // Expected total: 100 - 5 - 2 - 6 = 87
    const score = await aiRecommendationService.calculateHealthScore(userId);
    console.log(`Calculated Health Score: ${score} (Expected: 87)`);
    if (score !== 87) {
      throw new Error(`Health score mismatch! Expected 87, got ${score}`);
    }
    console.log('✓ Health Score Test Passed');

    // 5. Test Personalized Recommendations
    console.log('\n--- Test 2: Personalized Recommendations ---');
    const recommendations = await aiRecommendationService.getPersonalizedRecommendations(userId);
    console.log('Recommendations:', recommendations);
    
    // Check if Yogurt consumption speed recommendation is generated (avg of 5 and 7 = 6 days)
    const hasYogurtSpeed = recommendations.some(rec => rec.includes('Yogurt') && rec.includes('6 days'));
    console.log(`Has Yogurt average consumption recommendation: ${hasYogurtSpeed}`);
    if (!hasYogurtSpeed) {
      throw new Error('Yogurt consumption speed recommendation missing!');
    }

    // Check if Butter larger pack recommendation is generated (Completed Early twice)
    const hasButterLarger = recommendations.some(rec => rec.toLowerCase().includes('butter') && rec.toLowerCase().includes('larger pack'));
    console.log(`Has Butter larger pack recommendation: ${hasButterLarger}`);
    if (!hasButterLarger) {
      throw new Error('Butter larger pack recommendation missing!');
    }

    // Check if Spinach smaller quantity recommendation is generated (Missed/expired twice)
    const hasSpinachSmaller = recommendations.some(rec => rec.toLowerCase().includes('spinach') && rec.toLowerCase().includes('smaller quantit'));
    console.log(`Has Spinach smaller quantities recommendation: ${hasSpinachSmaller}`);
    if (!hasSpinachSmaller) {
      throw new Error('Spinach smaller quantity recommendation missing!');
    }
    console.log('✓ Recommendations Test Passed');

    // 6. Test Waste Prevention Suggestions
    console.log('\n--- Test 3: Waste Prevention Suggestions ---');
    const suggestions = await aiRecommendationService.getWastePreventionSuggestions(userId);
    console.log('Waste Prevention Suggestions:', suggestions);
    
    // Check if it lists spinach as most wasted
    const hasMostWastedSpinach = suggestions.some(sug => sug.toLowerCase().includes('spinach') && sug.toLowerCase().includes('most wasted'));
    console.log(`Has Spinach most wasted suggestion: ${hasMostWastedSpinach}`);
    if (!hasMostWastedSpinach) {
      throw new Error('Spinach most wasted suggestion missing!');
    }
    console.log('✓ Waste Prevention Suggestions Test Passed');

    // 7. Test Shopping Suggestions
    console.log('\n--- Test 4: Shopping Recommendations ---');
    const shoppingRecs = await aiRecommendationService.getShoppingRecommendations(userId);
    console.log('Shopping Recommendations:', shoppingRecs);
    
    // Milk is expiring in <= 2 days (expired item has daysLeft <= 0, and tomatoes has daysLeft = 2)
    const hasMilkAlert = shoppingRecs.some(rec => rec.includes('Milk') && rec.includes('run out'));
    const hasTomatoAlert = shoppingRecs.some(rec => rec.includes('Tomatoes') && rec.includes('run out'));
    console.log(`Has Milk running out alert: ${hasMilkAlert}`);
    console.log(`Has Tomatoes running out alert: ${hasTomatoAlert}`);
    if (!hasMilkAlert && !hasTomatoAlert) {
      throw new Error('Running out alert missing for Milk/Tomatoes!');
    }
    console.log('✓ Shopping Recommendations Test Passed');

    // 8. Test Consumption Forecasting
    console.log('\n--- Test 5: Consumption Forecasting ---');
    const forecasts = await aiRecommendationService.getConsumptionForecasting(userId);
    console.log('Forecasts:', forecasts.map(f => ({
      item: f.itemName,
      likelyConsumptionDate: f.likelyConsumptionDate,
      likelyDepletionDate: f.likelyDepletionDate,
      daysLeft: f.daysLeft
    })));
    if (forecasts.length !== 3) {
      throw new Error(`Expected 3 forecasts, got ${forecasts.length}`);
    }
    console.log('✓ Consumption Forecasting Test Passed');

    console.log('\n=============================================');
    console.log('ALL SMART FRIDGE AI AGGREGATION TESTS PASSED!');
    console.log('=============================================');

  } catch (err) {
    console.error('\n✗ TEST RUN FAILED:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    console.log('\nCleaning up test data...');
    if (testUser) {
      const uRes = await User.deleteOne({ _id: testUser._id });
      console.log(`Deleted test user: ${uRes.deletedCount}`);
    }
    if (itemsCreated.length > 0) {
      const iRes = await FoodItem.deleteMany({ _id: { $in: itemsCreated.map(i => i._id) } });
      console.log(`Deleted test food items: ${iRes.deletedCount}`);
    }
    if (historyCreated.length > 0) {
      const hRes = await History.deleteMany({ _id: { $in: historyCreated.map(h => h._id) } });
      console.log(`Deleted test history logs: ${hRes.deletedCount}`);
    }

    await mongoose.connection.close();
    console.log('DB Connection closed.');
  }
};

runTests();
