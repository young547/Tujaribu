
const express = require('express');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

let lastMultiplier = null;

async function scrapeMultiplier() {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  try {
    await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('div[class*="multiplier"]', { timeout: 15000 });
    const multiplier = await page.$eval('div[class*="multiplier"]', el => el.textContent.trim());

    lastMultiplier = multiplier;
    console.log('Latest multiplier:', multiplier);
   catch (err) 
    console.error('Scraping error:', err.message);
   finally 
    await browser.close();
  

app.get('/predict', async (req, res) => 
  await scrapeMultiplier();
  res.json( multiplier: lastMultiplier || 'Not available' );
);

app.listen(PORT, () => 
  console.log(`Server running on port{PORT}`);
});
