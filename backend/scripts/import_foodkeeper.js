const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const FoodReference = require('../models/FoodReference');

const filePath = 'C:/Users/uslrm/Downloads/foodkeeper.json';

function convertToDays(val, metric) {
  if (val === null || val === undefined) return null;
  if (!metric) return null;

  const m = String(metric).toLowerCase().trim();
  if (m.includes('not recommended')) return null;
  if (m.includes('indefinitely')) return 9999;
  if (m.includes('package use-by date') || m.includes('when ripe')) return 0;

  if (m.includes('day')) return val * 1;
  if (m.includes('week')) return val * 7;
  if (m.includes('month')) return val * 30;
  if (m.includes('year')) return val * 365;
  if (m.includes('hour')) return Math.ceil(val / 24);

  return null;
}

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected!');

    console.log(`Reading foodkeeper data from ${filePath}...`);
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const categoriesList = rawData.sheets.find(s => s.name === 'Category').data;
    const productsList = rawData.sheets.find(s => s.name === 'Product').data;

    // Map Category ID
    const categoryMap = {};
    categoriesList.forEach(catRow => {
      let id, name, subcat;
      catRow.forEach(cell => {
        const key = Object.keys(cell)[0];
        if (key === 'ID') id = cell[key];
        if (key === 'Category_Name') name = cell[key];
        if (key === 'Subcategory_Name') subcat = cell[key];
      });
      categoryMap[id] = { name, subcat };
    });

    console.log('Flattening and normalizing products...');
    const normalizedProducts = [];
    const seenNames = new Set();

    productsList.forEach(prodRow => {
      const flat = {};
      prodRow.forEach(cell => {
        const key = Object.keys(cell)[0];
        flat[key] = cell[key];
      });

      // Name standardization
      let foodName = (flat.Name || '').trim();
      if (flat.Name_subtitle) {
        foodName += ` - ${flat.Name_subtitle.trim()}`;
      }

      // Skip empty names
      if (!foodName) return;

      const categoryId = flat.Category_ID;
      const categoryInfo = categoryMap[categoryId] || { name: 'Other', subcat: null };

      // Deduplication check
      const dedupKey = `${foodName.toLowerCase()}|${categoryInfo.name.toLowerCase()}`;
      if (seenNames.has(dedupKey)) {
        return;
      }
      seenNames.add(dedupKey);

      // Keywords processing
      const keywords = [];
      if (flat.Keywords) {
        flat.Keywords.split(',').forEach(k => {
          const trimmed = k.trim().toLowerCase();
          if (trimmed) keywords.push(trimmed);
        });
      }

      // Pantry Storage Unopened
      const isPantryRecommended = !(flat.Pantry_Metric && String(flat.Pantry_Metric).toLowerCase().includes('not recommended'));
      const pantryMaxVal = flat.DOP_Pantry_Max !== null ? flat.DOP_Pantry_Max : flat.Pantry_Max;
      const pantryMinVal = flat.DOP_Pantry_Min !== null ? flat.DOP_Pantry_Min : flat.Pantry_Min;
      const pantryMetric = flat.DOP_Pantry_Metric || flat.Pantry_Metric;
      const pantryVal = pantryMaxVal !== null ? pantryMaxVal : pantryMinVal;
      const pantryStorageTime = convertToDays(pantryVal, pantryMetric);
      const pantryTips = flat.DOP_Pantry_tips || flat.Pantry_tips || null;

      // Fridge Storage Unopened
      const isFridgeRecommended = !(flat.Refrigerate_Metric && String(flat.Refrigerate_Metric).toLowerCase().includes('not recommended'));
      const fridgeMaxVal = flat.DOP_Refrigerate_Max !== null ? flat.DOP_Refrigerate_Max : flat.Refrigerate_Max;
      const fridgeMinVal = flat.DOP_Refrigerate_Min !== null ? flat.DOP_Refrigerate_Min : flat.Refrigerate_Min;
      const fridgeMetric = flat.DOP_Refrigerate_Metric || flat.Refrigerate_Metric;
      const fridgeVal = fridgeMaxVal !== null ? fridgeMaxVal : fridgeMinVal;
      const fridgeStorageTime = convertToDays(fridgeVal, fridgeMetric);
      const fridgeTips = flat.DOP_Refrigerate_tips || flat.Refrigerate_tips || null;

      // Freezer Storage Unopened
      const isFreezerRecommended = !(flat.Freeze_Metric && String(flat.Freeze_Metric).toLowerCase().includes('not recommended'));
      const freezerMaxVal = flat.DOP_Freeze_Max !== null ? flat.DOP_Freeze_Max : flat.Freeze_Max;
      const freezerMinVal = flat.DOP_Freeze_Min !== null ? flat.DOP_Freeze_Min : flat.Freeze_Min;
      const freezerMetric = flat.DOP_Freeze_Metric || flat.Freeze_Metric;
      const freezerVal = freezerMaxVal !== null ? freezerMaxVal : freezerMinVal;
      const freezerStorageTime = convertToDays(freezerVal, freezerMetric);
      const freezerTips = flat.DOP_Freeze_Tips || flat.Freeze_Tips || null;

      // Opened Storage
      const openedPantryVal = flat.Pantry_After_Opening_Max !== null ? flat.Pantry_After_Opening_Max : flat.Pantry_After_Opening_Min;
      const openedPantryStorageTime = convertToDays(openedPantryVal, flat.Pantry_After_Opening_Metric);

      const openedFridgeVal = flat.Refrigerate_After_Opening_Max !== null ? flat.Refrigerate_After_Opening_Max : flat.Refrigerate_After_Opening_Min;
      const openedFridgeStorageTime = convertToDays(openedFridgeVal, flat.Refrigerate_After_Opening_Metric);

      normalizedProducts.push({
        foodkeeperId: flat.ID,
        foodName,
        category: categoryInfo.name,
        subCategory: categoryInfo.subcat || null,
        keywords,
        pantryStorageTime,
        isPantryRecommended,
        pantryTips: pantryTips ? pantryTips.trim() : null,
        fridgeStorageTime,
        isFridgeRecommended,
        fridgeTips: fridgeTips ? fridgeTips.trim() : null,
        freezerStorageTime,
        isFreezerRecommended,
        freezerTips: freezerTips ? freezerTips.trim() : null,
        openedPantryStorageTime,
        openedFridgeStorageTime,
        source: 'USDA FoodKeeper'
      });
    });

    console.log(`Clearing existing FoodReference data...`);
    await FoodReference.deleteMany({});
    console.log('Collection cleared.');

    console.log(`Inserting ${normalizedProducts.length} normalized items...`);
    await FoodReference.insertMany(normalizedProducts);
    console.log('Data imported successfully!');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed.');

  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

run();
