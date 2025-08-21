
const express = require('express');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Multiplier calculation based on the hash
function hashToMultiplier(hash) {
  const hex = parseInt(hash.substring(0, 13), 16);
  if (hex % 33 === 0) return 1.00;
  const h = parseInt(hash.substring(0, 52), 16);
  return Math.floor((100 * (2 * 52) / (2 * 52 - h)) * 100) / 100;
}

app.get('/predict', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2' });

    await page.waitForTimeout(3000); // Allow content to load

    const getText = async (selectors) => {
      for (let sel of selectors) {
        try {
          await page.waitForSelector(sel, { timeout: 1000 });
          const txt = await page.$eval(sel, el => el.textContent.trim());
          if (txt) return txt;
          catch (err) 
      return null;
    ;

    const serverSeed = await getText(['.server-seed', '#serverSeed', 'div[class*="server"]']);
    const clientSeed = await getText(['.client-seed', '#clientSeed', 'div[class*="client"]']);
    const nonce = await getText(['.round-number', '.round-id', 'div[class*="round"]']);
    const actualMultiplier = await getText(['div[class*="multiplier"]', '.multiplier', 'span[class*="multiplier"]']);

    if (!serverSeed || !clientSeed || !nonce) 
      return res.status(404).json( error: 'Missing seed or round data' );
    

    const message = `{serverSeed}:clientSeed:{nonce}`;
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    const predictedMultiplier = hashToMultiplier(hash);

    await browser.close();

    res.json({
      serverSeed,
      clientSeed,
      nonce,
      hash,
      predictedMultiplier,
      actualMultiplier
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);});
