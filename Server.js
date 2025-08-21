
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static('public'));

let lastMultiplier = '--';

// Puppeteer scraper function
async function scrapeMultiplier() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://www.betika.com/en-ke/aviator', { waitUntil: 'networkidle2' });

    // Wait for the multiplier element (adjust selector if needed)
    await page.waitForSelector('div[class*="multiplier"]', { timeout: 15000 });

    // Scrape multiplier repeatedly every 5s
    setInterval(async () => {
      try {
        const multiplier = await page.evaluate(() => {
          const el = document.querySelector('div[class*="multiplier"]');
          return el ? el.textContent.trim() : '--';
        });

        lastMultiplier = multiplier;
        console.log('Multiplier updated:', multiplier);
      } catch (e) {
        console.error('Error scraping multiplier:', e.message);
      }
    }, 5000);
  } catch (err) {
    console.error('Failed to launch scraper:', err.message);
  }
}

// API endpoint to get current multiplier prediction
app.get('/predict', (req, res) => {
  res.json({ predictedMultiplier: lastMultiplier });
});

// Start server and scraper
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scrapeMultiplier();
});
