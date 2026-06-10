const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/uslrm/Downloads/foodkeeper.json';

try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);

  console.log('FileName:', data.fileName);
  console.log('Sheets:', data.sheets.map(s => s.name));

  const categorySheet = data.sheets.find(s => s.name === 'Category');
  const productSheet = data.sheets.find(s => s.name === 'Product');

  if (categorySheet) {
    console.log('\n--- CATEGORY SHEET INFO ---');
    console.log('Category Rows Count:', categorySheet.data.length);
    console.log('Sample Row 0:', JSON.stringify(categorySheet.data[0]));
    console.log('Sample Row 1:', JSON.stringify(categorySheet.data[1]));
  }

  if (productSheet) {
    console.log('\n--- PRODUCT SHEET INFO ---');
    console.log('Product Rows Count:', productSheet.data.length);
    // Flatten row keys to see columns
    const firstRow = productSheet.data[0];
    const columns = firstRow.map(cell => Object.keys(cell)[0]);
    console.log('Columns count:', columns.length);
    console.log('Columns list:', columns.join(', '));
    console.log('\nSample Product Row 0 detail:');
    firstRow.forEach(cell => {
      const key = Object.keys(cell)[0];
      console.log(`  ${key}: ${JSON.stringify(cell[key])}`);
    });
  }

} catch (err) {
  console.error('Error during inspection:', err);
}
