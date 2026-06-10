const fs = require('fs');

const filePath = 'C:/Users/uslrm/Downloads/foodkeeper.json';

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const categories = data.sheets.find(s => s.name === 'Category').data;
  const products = data.sheets.find(s => s.name === 'Product').data;

  // Map Category ID to Category Object
  const categoryMap = {};
  categories.forEach(cat => {
    let catId, catName, subcatName;
    cat.forEach(cell => {
      const key = Object.keys(cell)[0];
      if (key === 'ID') catId = cell[key];
      if (key === 'Category_Name') catName = cell[key];
      if (key === 'Subcategory_Name') subcatName = cell[key];
    });
    categoryMap[catId] = { catName, subcatName };
  });

  let totalRecords = products.length;
  let pantryCount = 0;
  let refrigerateCount = 0;
  let freezeCount = 0;
  let dopPantryCount = 0;
  let dopRefrigerateCount = 0;
  let dopFreezeCount = 0;
  let openedPantryCount = 0;
  let openedRefrigerateCount = 0;

  const distinctCategories = new Set();
  const distinctSubcategories = new Set();

  products.forEach(row => {
    let hasPantry = false, hasRefrigerate = false, hasFreeze = false;
    let hasDopPantry = false, hasDopRefrigerate = false, hasDopFreeze = false;
    let hasOpenedPantry = false, hasOpenedRefrigerate = false;
    let categoryId = null;

    row.forEach(cell => {
      const key = Object.keys(cell)[0];
      const val = cell[key];
      if (val !== null && val !== undefined) {
        if (key === 'Category_ID') categoryId = val;
        if (key.startsWith('Pantry_Min') || key.startsWith('Pantry_Max')) hasPantry = true;
        if (key.startsWith('Refrigerate_Min') || key.startsWith('Refrigerate_Max')) hasRefrigerate = true;
        if (key.startsWith('Freeze_Min') || key.startsWith('Freeze_Max')) hasFreeze = true;
        if (key.startsWith('DOP_Pantry_Min') || key.startsWith('DOP_Pantry_Max')) hasDopPantry = true;
        if (key.startsWith('DOP_Refrigerate_Min') || key.startsWith('DOP_Refrigerate_Max')) hasDopRefrigerate = true;
        if (key.startsWith('DOP_Freeze_Min') || key.startsWith('DOP_Freeze_Max')) hasDopFreeze = true;
        if (key.startsWith('Pantry_After_Opening_Min') || key.startsWith('Pantry_After_Opening_Max')) hasOpenedPantry = true;
        if (key.startsWith('Refrigerate_After_Opening_Min') || key.startsWith('Refrigerate_After_Opening_Max')) hasOpenedRefrigerate = true;
      }
    });

    if (hasPantry) pantryCount++;
    if (hasRefrigerate) refrigerateCount++;
    if (hasFreeze) freezeCount++;
    if (hasDopPantry) dopPantryCount++;
    if (hasDopRefrigerate) dopRefrigerateCount++;
    if (hasDopFreeze) dopFreezeCount++;
    if (hasOpenedPantry) openedPantryCount++;
    if (hasOpenedRefrigerate) openedRefrigerateCount++;

    if (categoryId && categoryMap[categoryId]) {
      distinctCategories.add(categoryMap[categoryId].catName);
      if (categoryMap[categoryId].subcatName) {
        distinctSubcategories.add(categoryMap[categoryId].subcatName);
      }
    }
  });

  console.log('--- DATA ANALYSIS ---');
  console.log('Total number of products:', totalRecords);
  console.log('Unique Categories:', Array.from(distinctCategories));
  console.log('Unique Subcategories count:', distinctSubcategories.size);
  console.log('Storage Field Prevalence:');
  console.log(`  Pantry Storage Data: ${pantryCount} items`);
  console.log(`  Refrigerate Storage Data: ${refrigerateCount} items`);
  console.log(`  Freeze Storage Data: ${freezeCount} items`);
  console.log(`  DOP Pantry Storage Data: ${dopPantryCount} items`);
  console.log(`  DOP Refrigerate Storage Data: ${dopRefrigerateCount} items`);
  console.log(`  DOP Freeze Storage Data: ${dopFreezeCount} items`);
  console.log(`  Pantry After Opening Data: ${openedPantryCount} items`);
  console.log(`  Refrigerate After Opening Data: ${openedRefrigerateCount} items`);

} catch (err) {
  console.error(err);
}
