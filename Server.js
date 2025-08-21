
import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

let gameRounds = [];

let clients = []; // connected SSE clients

function tryPaths(obj, paths) {
  for (const path of paths) {
    let val = obj;
    let valid = true;
    for (const key of path) {
      if (val && val[key] !== undefined) val = val[key];
      else {
        valid = false;
        break;
      }
    }
    if (valid) return val;
  }
  return undefined;
}

function weightedAverage(rounds) {
  let totalWeight = 0;
  let weightedSum = 0;
  rounds.forEach((round, i) => {
    const weight = i + 1;
    weightedSum += round.multiplier * weight;
    totalWeight += weight;
  });
  return weightedSum / totalWeight;
}

function sendEventsToAll(data) {
  const json = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.res.write(json));
}

async function startScraper() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://www.betika.com/en-ke/aviator', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  page.on('websocketframereceived', async ({ response }) => {
    try {
      const raw = response.payloadData;
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      const roundId = tryPaths(data, [
        ['data', 'round'],
        ['round'],
        ['id'],
        ['round_id'],
      ]);

      const multiplierRaw = tryPaths(data, [
        ['data', 'crash_point'],
        ['crashPoint'],
        ['multiplier'],
        ['data', 'multiplier'],
      ]);

      const rng = tryPaths(data, [
        ['data', 'rng'],
        ['rng'],
        ['server_seed'],
      ]);

      const status = tryPaths(data, [
        ['data', 'status'],
        ['status'],
      ]);

      if (roundId && multiplierRaw != null) {
        const multiplier = typeof multiplierRaw === 'string' ? parseFloat(multiplierRaw) : multiplierRaw;
        if (!status || status.toLowerCase() === 'ended' || status.toLowerCase() === 'crashed') 
          if (!gameRounds.find(r => r.roundId === roundId)) 
            gameRounds.push( roundId, multiplier, rng, timestamp: Date.now() );
            if (gameRounds.length > 100) gameRounds.shift();

            console.log(`Stored round{roundId} multiplier: multiplier RNG:{rng || 'N/A'}`);

            // Send prediction update to all SSE clients
            sendEventsToAll(predictNext());
          }
        }
      }
    } catch (e) {
      console.error('Error processing WS frame:', e);
    }
  });

  console.log('Scraper started on Betika Aviator...');
}

function predictNext() {
  if (gameRounds.length === 0) return { predictedMultiplier: 1, roundId: null, rng: null };

  const lastRounds = gameRounds.slice(-10);
  const avg = weightedAverage(lastRounds);
  const lastRound = lastRounds[lastRounds.length - 1];

  return {
    predictedMultiplier: avg.toFixed(2),
    roundId: lastRound.roundId,
    rng: lastRound.rng || 'N/A',
  };
}

app.use(express.static(path.join(process.cwd(), 'public')));

// SSE endpoint
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };

  clients.push(newClient);
  console.log(`Client connected: clientId, total:{clients.length}`);

  // Send initial data
  res.write(`data: JSON.stringify(predictNext())`);

  req.on('close', () => 
    console.log(`Client disconnected:{clientId}`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScraper().catch(err => {
    console.error('Scraper failed:', err);
  });
});
  
  
