const kiteService = require("../services/kiteService");
const { confluenceSignal } = require("./strategies/confluence");
const { simpleTrendSignal } = require("./strategies/simpleTrend");
const Trade = require("../models/Trade");
const logger = require("../utils/logger");
const { notifySignal } = require("../services/telegramService");

async function runForInstrument({
  instrumentToken,
  tradingsymbol,
  exchange = "NSE",
  interval = "5minute",
  quantity = 1,
  dryRun = true,
  minScore = 4,
}) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 5);
  const candles = await kiteService.getHistoricalData(instrumentToken, interval, fromDate, toDate);

  const dailyFrom = new Date(toDate);
  dailyFrom.setDate(dailyFrom.getDate() - 10);
  const dailyCandles = await kiteService.getHistoricalData(instrumentToken, "day", dailyFrom, toDate);

  // Donhi strategies run karto
  const confluence = confluenceSignal(candles, dailyCandles, { minScore });
  const simpleTrend = simpleTrendSignal(candles);

  logger.info(`[${tradingsymbol}] Confluence: ${confluence.signal} (${confluence.score}/5) | SimpleTrend: ${simpleTrend.signal}`);

  const output = { tradingsymbol, confluence, simpleTrend };

  // Prateyek strategy sathi swतंत्र handle karto - jya jya signal HOLD nahi tyala process karto
  for (const [strategyName, result] of [["confluence", confluence], ["simpleTrend", simpleTrend]]) {
    if (result.signal === "HOLD") continue;

    await notifySignal({ tradingsymbol, strategy: strategyName, ...result });

    await Trade.create({
      tradingsymbol,
      strategy: strategyName,
      signal: result.signal,
      score: result.score,
      vwap: result.vwap,
      ema9: result.ema9,
      ema21: result.ema21,
      superTrend: result.superTrend,
      quantity,
      dryRun,
      executedAt: new Date(),
    });

    if (!dryRun) {
      const orderResponse = await kiteService.placeOrder({
        exchange, tradingsymbol, transaction_type: result.signal, quantity, product: "MIS", order_type: "MARKET",
      });
      logger.info(`Order placed (${strategyName}) for ${tradingsymbol}: ${JSON.stringify(orderResponse)}`);
      output[strategyName].orderResponse = orderResponse;
    } else {
      logger.info(`[DRY RUN] Order NOT placed (${strategyName}) for ${tradingsymbol}`);
    }
  }

  return output;
}

/**
 * Multiple stocks sathi loop karun run karto (scanner sathi useful)
 */
async function runForWatchlist(watchlist, options = {}) {
  const results = [];
  for (const stock of watchlist) {
    try {
      const result = await runForInstrument({ ...stock, ...options });
      results.push({ tradingsymbol: stock.tradingsymbol, ...result });
    } catch (err) {
      logger.error(`Error running algo for ${stock.tradingsymbol}: ${err.message}`);
      results.push({ tradingsymbol: stock.tradingsymbol, error: err.message });
    }
  }
  return results;
}

module.exports = { runForInstrument, runForWatchlist };