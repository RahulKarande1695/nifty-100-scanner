const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { runForWatchlist } = require("../algo/algoEngine");
const logger = require("../utils/logger");

// Nifty-100 tokens JSON madhun watchlist banवतो
function getNifty100Watchlist() {
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

  const filePath = path.join(__dirname, "..", "data", "nse-instruments.json");
  if (!fs.existsSync(filePath)) {
    logger.warn("nse-instruments.json nahi mila - scheduler skip karto ha run");
    return [];
  }
  const instruments = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return NIFTY_100_SYMBOLS.map((symbol) => {
    const match = instruments.find(
      (i) => i.tradingsymbol === symbol && i.instrument_type === "EQ"
    );
    return match
      ? { instrumentToken: match.instrument_token, tradingsymbol: match.tradingsymbol }
      : null;
  }).filter(Boolean);
}

/**
 * Market hours madhe (Mon-Fri, 9:15 AM - 3:30 PM IST) dar 5 minitani run karto.
 * Cron format: minute hour day month weekday
 * "* /5 9-15 * * 1-5" -> dar 5 min, 9 AM te 3:59 PM, Mon-Fri
 */
function startScheduler() {
  cron.schedule(
    "*/5 9-15 * * 1-5",
    async () => {
      logger.info("Scheduled watchlist scan suru hotoy...");
      const watchlist = getNifty100Watchlist();
      if (watchlist.length === 0) {
        logger.warn("Watchlist rikami aahe - scan skip");
        return;
      }
      try {
        const results = await runForWatchlist(watchlist, { dryRun: true });
        const actionable = results.filter(
          (r) => r.signal === "BUY" || r.signal === "SELL"
        );
        logger.info(
          `Scan complete: ${results.length} stocks checked, ${actionable.length} signals (BUY/SELL) mile`
        );
        actionable.forEach((r) => {
          logger.info(`  -> ${r.tradingsymbol}: ${r.signal} - ${r.reason}`);
        });
      } catch (err) {
        logger.error(`Scheduled scan failed: ${err.message}`);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  logger.info("Scheduler start झाला - dar 5 min (market hours, Mon-Fri) scan hoईल");
}

module.exports = { startScheduler };