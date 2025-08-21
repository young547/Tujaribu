
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

let gameRounds = []; // stores recent multipliers (max 100)

// Add a new round multiplier, keep max 100 rounds
function addRound(multiplier) {
  gameRounds.push({ multiplier, timestamp: Date.now() });
  if (gameRounds.length > 100) gameRounds.shift();
}

// Predict next multiplier using moving average of last N rounds
function predictNext(n = 5) {
  if (!gameRounds.length) return 1;
  const lastRounds = gameRounds.slice(-n);
  const avg = lastRounds.reduce((acc, r) => acc + r.multiplier, 0) / lastRounds.length;
  return Number(avg.toFixed(2));
}

// Start Puppeteer to scrape live multipliers
async function startScraper() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2' });
  // Wait for multiplier element to load
  await page.waitForSelector('div[class*="multiplier"]');

  // Expose a function to be called from page context with new multiplier
  await page.exposeFunction('onMultiplierUpdate', multiplier => {
    const num = parseFloat(multiplier);
    if (!isNaN(num)) {
      console.log('New multiplier:', num);
      addRound(num);
    }
  });

  // Inject MutationObserver to detect multiplier changes
  await page.evaluate(() => {
    const target = document.querySelector('div[class*="multiplier"]');
    if (!target) return;

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const text = mutation.target.textContent;
          const match = text.match(/(\d+(\.\d+)?)/);
          if (match) {
            window.onMultiplierUpdate(match[1]);
          }
        }
      }
    });

    observer.observe(target, { childList: true, subtree: true });
  });

  console.log('Scraper started...');
}

app.use(express.static('public')); // serve static UI files

// API to get current prediction
app.get('/api/predict', (req, res) => {
  res.json({
    prediction: predictNext(),
    rounds: gameRounds.slice(-10).map(r => r.multiplier),
  });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScraper().catch(console.error);
