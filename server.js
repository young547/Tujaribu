
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const selectors = {
  multiplier: [
    'div[class*="multiplier"]',
    '.multiplier-text',
    '.multiplier-value',
    '#multiplier',
    'span.multiplier',
  ],
  roundId: [
    '.round-id',
    'div.round-number',
    '#round',
  ],
  serverSeed: [
    '.server-seed',
    '#serverSeed',
    'div.server-seed',
  ],
  clientSeed: [
    '.client-seed',
    '#clientSeed',
    'div.client-seed',
  ],
  combinedHash: [
    '.combined-sha512',
    '#combinedHash',
    'div.combined-hash',
  ],
};

async function findText(page, keys) {
  for (const selector of keys) {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      const text = await page.$eval(selector, el => el.textContent.trim());
      if (text) return text;
    } catch (err) {
    // try next selector
    
  return null;


app.get('/prediction', async (req, res) => 
  let browser;
  try 
    browser = await puppeteer.launch( args: ['–no-sandbox'] );
    const page = await browser.newPage();
    await page.goto('https://www.betika.com/en-ke/aviator',  waitUntil: 'networkidle2' );

    const multiplier = await findText(page, selectors.multiplier);
    const roundId = await findText(page, selectors.roundId);
    const serverSeed = await findText(page, selectors.serverSeed);
    const clientSeed = await findText(page, selectors.clientSeed);
    const combinedHash = await findText(page, selectors.combinedHash);

    await browser.close();

    if (!multiplier) 
      return res.status(404).json( error: 'Multiplier not found' );
    

    res.json(
      roundId,
      multiplier,
      serverSeed,
      clientSeed,
      combinedHash,
    );
   catch (error) 
    if (browser) await browser.close();
    console.error('Scraping error:', error);
    res.status(500).json( error: 'Failed to fetch prediction' );
  );

app.listen(PORT, () => 
  console.log(`Server running on port{PORT}`);
});
