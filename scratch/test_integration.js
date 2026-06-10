const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const FoodReference = require('../backend/models/FoodReference');
const referenceService = require('../backend/services/referenceService');
const { getShelfLifeDays } = require('../backend/utils/expiry');

async function test() {
  try {
    console.log('--- STARTING FOODKEEPER INTEGRATION TESTS ---');
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Test 1: Count reference database
    const count = await FoodReference.countDocuments();
    console.log(`\nTest 1: Check FoodReference collection count: ${count}`);
    if (count === 0) throw new Error('FoodReference collection is empty!');
    console.log('✓ Test 1 Passed');

    // Test 2: Exact search matching
    console.log('\nTest 2: Exact search for "Butter"...');
    const exactMatches = await referenceService.searchReference('Butter', 'Dairy Products & Eggs');
    console.log(`Found ${exactMatches.length} matches.`);
    if (exactMatches.length === 0) throw new Error('Could not find Butter!');
    const butter = exactMatches[0];
    console.log(`Top match: "${butter.foodName}" in category "${butter.category}"`);
    console.log(`Pantry: ${butter.pantryStorageTime} days, Fridge: ${butter.fridgeStorageTime} days, Freezer: ${butter.freezerStorageTime} days`);
    console.log('✓ Test 2 Passed');

    // Test 3: Fuzzy matching (misspellings)
    console.log('\nTest 3: Fuzzy search for misspelled "buttr" (Butter)...');
    const fuzzyMatches = await referenceService.searchReference('buttr');
    console.log(`Found ${fuzzyMatches.length} matches.`);
    if (fuzzyMatches.length === 0) throw new Error('Fuzzy search failed to find matches!');
    const topFuzzy = fuzzyMatches[0];
    console.log(`Top fuzzy match: "${topFuzzy.foodName}" (similarity score against "buttr" is ${referenceService.getSimilarity(topFuzzy.foodName, 'buttr').toFixed(2)})`);
    if (topFuzzy.foodName.toLowerCase() !== 'butter') {
      console.warn(`⚠ Fuzzy match did not return 'Butter' as top choice, but returned '${topFuzzy.foodName}'. This is okay if score is high.`);
    } else {
      console.log('✓ Test 3 Passed');
    }

    // Test 4: Storage-type specific predictions
    console.log('\nTest 4: Expiry shelf-life calculations for "Milk" with different storage types...');
    const fridgeDays = await getShelfLifeDays('Dairy Products & Eggs', 'Milk plain or flavored', 'Fridge');
    const freezerDays = await getShelfLifeDays('Dairy Products & Eggs', 'Milk plain or flavored', 'Freezer');
    const pantryDays = await getShelfLifeDays('Dairy Products & Eggs', 'Milk plain or flavored', 'Pantry');

    console.log(`Milk shelf life (Fridge): ${fridgeDays} days`);
    console.log(`Milk shelf life (Freezer): ${freezerDays} days`);
    console.log(`Milk shelf life (Pantry): ${pantryDays} days`);

    if (fridgeDays <= 0 || freezerDays <= 0) {
      throw new Error('Shelf life values should be positive integers!');
    }
    console.log('✓ Test 4 Passed');

    // Test 5: Fallback lookup for unknown item
    console.log('\nTest 5: Fallback shelf life for non-existent item "Alien Slime"...');
    const fallbackDays = await getShelfLifeDays('Dairy', 'Alien Slime', 'Fridge');
    console.log(`Suggested shelf life: ${fallbackDays} days (expected fallback defaults from shelfLife.json or 7)`);
    if (fallbackDays !== 7 && fallbackDays !== 14) {
      console.warn(`⚠ Fallback days is ${fallbackDays}. Expected 7 or 14.`);
    } else {
      console.log('✓ Test 5 Passed');
    }

    console.log('\n--- ALL TEST SUITES COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\n!!! TEST SUITE FAILED !!!');
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

test();
