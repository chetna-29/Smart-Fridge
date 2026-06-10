const fs = require('fs');

const filePath = 'C:/Users/uslrm/Downloads/foodkeeper.json';

try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  const productSheet = data.sheets.find(s => s.name === 'Product');

  if (!productSheet) throw new Error('Product sheet not found');

  const metricFields = [
    'Pantry_Metric',
    'DOP_Pantry_Metric',
    'Pantry_After_Opening_Metric',
    'Refrigerate_Metric',
    'DOP_Refrigerate_Metric',
    'Refrigerate_After_Opening_Metric',
    'Refrigerate_After_Thawing_Metric',
    'Freeze_Metric',
    'DOP_Freeze_Metric'
  ];

  const uniqueMetrics = {};
  metricFields.forEach(f => { uniqueMetrics[f] = new Set(); });

  productSheet.data.forEach(row => {
    row.forEach(cell => {
      const key = Object.keys(cell)[0];
      if (metricFields.includes(key)) {
        if (cell[key] !== null && cell[key] !== undefined) {
          uniqueMetrics[key].add(cell[key]);
        }
      }
    });
  });

  console.log('--- UNIQUE METRIC VALUES BY FIELD ---');
  for (const [field, values] of Object.entries(uniqueMetrics)) {
    console.log(`${field}:`, Array.from(values));
  }

} catch (err) {
  console.error(err);
}
