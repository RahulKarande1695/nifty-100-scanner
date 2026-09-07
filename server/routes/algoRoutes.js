const express = require("express");
const router = express.Router();

const kiteService = require("../services/kiteService");
const { runForInstrument, runForWatchlist } = require("../algo/algoEngine");
const { setAccessToken } = require("../config/kiteConfig");
const { saveSession } = require("../services/sessionService");
const logger = require("../utils/logger");

const fs = require("fs");
const path = require("path");
// --- Auth ---

// Login URL de - frontend ithe redirect karel
router.get("/kite/login-url", (req, res) => {
  res.json({ url: kiteService.getLoginURL() });
});

// Zerodha redirect back karel ithe request_token sobat
router.get("/kite/callback", async (req, res) => {
  const { request_token } = req.query;
  try {
    const session = await kiteService.generateSession(request_token);

    // Access token DB madhe save karto (daily expire hoto, roj navin login lagel)
    await saveSession({
      access_token: session.access_token,
      public_token: session.public_token,
      login_time: session.login_time,
    });

    logger.info("Kite session generated ani save झाली successfully");
    res.json({ success: true, access_token: session.access_token });
  } catch (err) {
    logger.error(`Kite callback error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- Algo ---

// Ek stock sathi manually algo run karo (testing sathi)
router.post("/algo/run", async (req, res) => {
  try {
    const result = await runForInstrument(req.body);
    res.json(result);
  } catch (err) {
    logger.error(`Algo run error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Nifty-100 watchlist var scan+algo run karo
router.post("/algo/run-watchlist", async (req, res) => {
  try {
    const { watchlist, dryRun = true } = req.body;
    const results = await runForWatchlist(watchlist, { dryRun });
    res.json({ results });
  } catch (err) {
    logger.error(`Watchlist run error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// NSE che sagle instruments fetch karun ek JSON file madhe save karto
// (tradingsymbol -> instrument_token mapping, algo run karnyasathi lagto)
router.get("/instruments/refresh", async (req, res) => {
  try {
    const instruments = await kiteService.getInstruments("NSE");
 
    // Fakt useful fields ठेवतो (pura data khup motha asto - 80k+ rows)
    const simplified = instruments.map((i) => ({
      tradingsymbol: i.tradingsymbol,
      instrument_token: i.instrument_token,
      name: i.name,
      segment: i.segment,
      instrument_type: i.instrument_type,
    }));
 
    // File madhe save karto - data/ folder madhe
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, "nse-instruments.json");
    fs.writeFileSync(filePath, JSON.stringify(simplified, null, 2));
 
    res.json({
      success: true,
      count: simplified.length,
      message: `${simplified.length} instruments saved to data/nse-instruments.json`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Ek stock cha instrument_token dhundhto (tradingsymbol dyaycha, e.g. INFY)
router.get("/instruments/lookup/:symbol", (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "data", "nse-instruments.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Instruments file nahi mila - aधी /api/instruments/refresh call karा",
      });
    }
    const instruments = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const symbol = req.params.symbol.toUpperCase();
    const match = instruments.find((i) => i.tradingsymbol === symbol);
 
    if (!match) {
      return res.status(404).json({ error: `${symbol} sathi instrument nahi mila` });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// ============================================
// He algoRoutes.js madhe ADD karaycha aahe
// (fs, path already added asतील magच्या step made)
// ============================================

// Nifty-100 symbols (NSE tradingsymbol format) - approx list, verify NSE site var
const NIFTY_100_SYMBOLS = [
  "RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "BHARTIARTL", "ITC",
  "SBIN", "LICI", "HINDUNILVR", "LT", "BAJFINANCE", "HCLTECH", "KOTAKBANK",
  "SUNPHARMA", "MARUTI", "AXISBANK", "M&M", "ULTRACEMCO", "NTPC", "TITAN",
  "ONGC", "TATAMOTORS", "ADANIENT", "BAJAJFINSV", "ASIANPAINT", "POWERGRID",
  "COALINDIA", "WIPRO", "NESTLEIND", "ADANIPORTS", "JSWSTEEL", "TATASTEEL",
  "BAJAJ-AUTO", "GRASIM", "TECHM", "HINDALCO", "SBILIFE", "DRREDDY",
  "HDFCLIFE", "CIPLA", "EICHERMOT", "APOLLOHOSP", "BRITANNIA", "DIVISLAB",
  "INDUSINDBK", "TATACONSUM", "HEROMOTOCO", "BPCL", "SHREECEM", "PIDILITIND",
  "DABUR", "GODREJCP", "SIEMENS", "AMBUJACEM", "DLF", "VEDANTA", "BANKBARODA",
  "ZOMATO", "TRENT", "PNB", "GAIL", "HAL", "BEL", "IOC", "SRF", "MOTHERSON",
  "TVSMOTOR", "CHOLAFIN", "HAVELLS", "TORNTPHARM", "LTIM", "ICICIPRULI",
  "ICICIGI", "INDIGO", "CANBK", "MARICO", "COLPAL", "PIIND", "ABB",
  "BOSCHLTD", "MCDOWELL-N", "GODREJPROP", "PAGEIND", "NAUKRI", "IRCTC",
  "JINDALSTEL", "TATAPOWER", "ADANIGREEN", "ADANIENSOL", "LODHA", "ATGL",
  "ZYDUSLIFE", "BANKINDIA", "UNITDSPR", "LUPIN", "ALKEM", "AUROPHARMA",
  "POLYCAB", "MUTHOOTFIN", "SHRIRAMFIN", "OFSS", "PFC", "RECLTD",
];

// Nifty-100 symbols cha bulk lookup - saglya tokens ek array madhe deto
router.post("/instruments/nifty100-tokens", (req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "data", "nse-instruments.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Instruments file nahi mila - aधी /api/instruments/refresh call karа",
      });
    }
    const instruments = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const found = [];
    const notFound = [];

    NIFTY_100_SYMBOLS.forEach((symbol) => {
      // EQ series wala match dhundhto (duplicate symbols astat, BE/BZ series war pan)
      const match = instruments.find(
        (i) => i.tradingsymbol === symbol && i.instrument_type === "EQ"
      );
      if (match) {
        found.push({
          instrumentToken: match.instrument_token,
          tradingsymbol: match.tradingsymbol,
        });
      } else {
        notFound.push(symbol);
      }
    });

    res.json({
      count: found.length,
      watchlist: found,
      notFound, // he symbols nahi milale - manually check karaव lagतील
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;