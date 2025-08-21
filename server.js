
import express from 'express';
import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const app = express();
const PORT = process.env.PORT || 3000;

let lastMultiplier = null;

// Try common selectors until one works
const multiplierSelectors = [
  'div[class*="multiplier"]',
  '.c-multiplier',
  '.multiplier-text',
  '.multiplier',
  '.result',
];

async function launchBrowser() {
  return await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  });
}

async function scrapeMultiplier() {
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForTimeout(5000); // Wait for elements to load

    let multiplier;

    for (const selector of multiplierSelectors) {
      try {
        multiplier = await page.$eval(selector, el => el.textContent.trim());
        if (multiplier && multiplier.includes('x')) break;
        catch (err) 
        // Try next selector
      

    lastMultiplier = multiplier || 'Not found';
    await browser.close();
   catch (error) 
    console.error('Scraper error:', error.message);
    lastMultiplier = 'Error';
    if (browser) await browser.close();
  

app.get('/predict', async (req, res) => 
  await scrapeMultiplier();
  res.json( multiplier: lastMultiplier );
);

app.listen(PORT, () => 
  console.log(`Server running on port{PORT}`);
});
