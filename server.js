
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Possible selectors
const selectors = {
  multiplier: [
    'div[class*="multiplier"]',
    '.multiplier-text',
    '.multiplier-value',
    '#multiplier',
    'span.multiplier',
  ],
  roundId: [
    'div.round-number',
    '.round-id',
    '#round',
  ],
  serverSeed: [
    'div.server-seed',
    '.server-seed',
    '#serverSeed',
  ],
  clientSeed: [
    'div.client-seed',
    '.client-seed',
    '#clientSeed',
  ],
  combinedHash: [
    'div.combined-hash',
    '.combined-sha512',
    '#combinedHash',
  ],
};

// Helper to find valid selector
async function findText(page, keys) {
  for (const selector of keys) {
    try {
      await page.waitForSelector(selector, { timeout: 1500 });
      const text = await page.$eval(selector, el => el.textContent.trim());
      if (text) return text;
    } catch (e) {
      // Try next
    }
  }
  return null;
}

app.get('/prediction', async (req, res) => {
  let browser;
  try {
  browser = await puppeteer.launch(
      headless: true,
      args: ['–no-sandbox', '–disable-setuid-sandbox'],
    );

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
   catch (err) 
    if (browser) await browser.close();
    console.error('Scraping error:', err);
    res.status(500).json( error: 'Failed to fetch prediction' );
  );

app.listen(PORT, () => 
  console.log(`Server running on port{PORT}`);
});
