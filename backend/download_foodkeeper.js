const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://www.fsis.usda.gov/shared/data/EN/foodkeeper.json';
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }
};

const outputPath = path.join(__dirname, 'data', 'foodkeeper.json');
const file = fs.createWriteStream(outputPath);

https.get(url, options, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Request Failed. Status Code: ${response.statusCode}`);
    response.resume();
    return;
  }

  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed!');
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
