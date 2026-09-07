const cron = require("node-cron");
const { runForWatchlist } = require("../algo/algoEngine");
const { getNifty100Watchlist } = require("../utils/getNifty100Watchlist");
const logger = require("../utils/logger");

function isMarketHours() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketStart = 9 * 60 + 15;  // 9:15 AM
  const marketEnd = 15 * 60 + 30;   // 3:30 PM

  return totalMinutes >= marketStart && totalMinutes <= marketEnd;
}

function startScheduler({ dryRun = true } = {}) {
  // Dar 5 minitanni run karto ("*/5 * * * *"), pan andar market-hours check aahe
  cron.schedule("*/5 * * * *", async () => {
    if (!isMarketHours()) {
      logger.info("Market band aahe - scheduler skip");
      return;
    }

    try {
      const watchlist = getNifty100Watchlist();
      logger.info(`Scheduler run suru - ${watchlist.length} stocks scan hotayat`);
      await runForWatchlist(watchlist, { dryRun });
      logger.info("Scheduler run pura झाला");
    } catch (err) {
      logger.error(`Scheduler error: ${err.message}`);
    }
  }, { timezone: "Asia/Kolkata" });

  logger.info("Scheduler chalu झाला - दर 5 minitanni market hours madhe watchlist scan hoईल");
}

module.exports = { startScheduler, isMarketHours };