
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

let gameRounds = [];

// Serve static files from 'public' folder
app.use(express.static('public'));

async function scrapeGameData() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2' });

  await page.waitForSelector('div[class*="multiplier"]');

  await page.exposeFunction('onRoundUpdate', (multiplier) => {
    console.log('New multiplier:', multiplier);
    gameRounds.push({ timestamp: Date.now(), multiplier });
    if (gameRounds.length > 100) gameRounds.shift();
  });

  await page.evaluate(() => {
    const multiplierElement = document.querySelector('div[class*="multiplier"]');
    if (!multiplierElement) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const text = multiplierElement.textContent.trim();
          const m = text.match(/(\d+(\.\d+)?)x/);
          if (m) {
            window.onRoundUpdate(parseFloat(m[1]));
          }
        }
      });
    });

    observer.observe(multiplierElement, { childList: true, characterData: true, subtree: true });
  });

  console.log('Scraper running...');
}

// Simple prediction: average of last 5 multipliers
function predictNext() {
  if (!gameRounds.length) return 1;
  const lastFive = gameRounds.slice(-5).map(r => r.multiplier);
  const avg = lastFive.reduce((a, b) => a + b, 0) / lastFive.length;
  return avg;
}

// API endpoint to get prediction
app.get('/predict', (req, res) => {
  const prediction = predictNext();
  res.json({ predictedMultiplier: prediction.toFixed(2) });
});

// Start server and scraper
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  scrapeGameData().catch(console.error);
