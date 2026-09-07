const { calculateEMA, calculateSuperTrend, calculateVWAP } = require("./indicators");

/**
 * Simple Trend Strategy: Price>VWAP + EMA9>EMA21 + SuperTrend GREEN (fakt 3 conditions)
 */
function simpleTrendSignal(candles) {
  const i = candles.length - 1;
  if (!candles || candles.length < 30) {
    return { signal: "HOLD", reason: "Purese candles nahiyet" };
  }

  const ema9 = calculateEMA(candles, 9)[i];
  const ema21 = calculateEMA(candles, 21)[i];
  const vwap = calculateVWAP(candles)[i];
  const superTrend = calculateSuperTrend(candles, 7, 3)[i];
  const price = candles[i].close;

  const bullish = price > vwap && ema9 > ema21 && superTrend.trend === "GREEN";
  const bearish = price < vwap && ema9 < ema21 && superTrend.trend === "RED";

  return {
    signal: bullish ? "BUY" : bearish ? "SELL" : "HOLD",
    reason: bullish
      ? "Price>VWAP, EMA9>EMA21, SuperTrend GREEN"
      : bearish
      ? "Price<VWAP, EMA9<EMA21, SuperTrend RED"
      : "3 conditions match nahi",
    price, vwap, ema9, ema21, superTrend: superTrend.trend,
  };
}

module.exports = { simpleTrendSignal };