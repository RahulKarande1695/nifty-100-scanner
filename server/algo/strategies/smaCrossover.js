/**
 * Pure strategy logic - kiteconnect chi kalpana nasते ithe.
 * Input: candle array [{ close, open, high, low, date, volume }, ...]
 * Output: "BUY" | "SELL" | "HOLD"
 */

function calculateSMA(candles, period) {
  if (candles.length < period) return null;
  const lastN = candles.slice(-period);
  const sum = lastN.reduce((acc, c) => acc + c.close, 0);
  return sum / period;
}

/**
 * fastPeriod, slowPeriod: SMA windows (e.g. 9, 21)
 * Golden cross (fast > slow) -> BUY
 * Death cross (fast < slow) -> SELL
 */
function smaCrossoverSignal(candles, fastPeriod = 9, slowPeriod = 21) {
  if (candles.length < slowPeriod + 1) {
    return { signal: "HOLD", reason: "Not enough candles yet" };
  }

  // Current SMA values
  const fastSMA = calculateSMA(candles, fastPeriod);
  const slowSMA = calculateSMA(candles, slowPeriod);

  // Previous candle sMA values (crossover detect karnyasathi)
  const prevCandles = candles.slice(0, -1);
  const prevFastSMA = calculateSMA(prevCandles, fastPeriod);
  const prevSlowSMA = calculateSMA(prevCandles, slowPeriod);

  if (fastSMA === null || slowSMA === null || prevFastSMA === null || prevSlowSMA === null) {
    return { signal: "HOLD", reason: "Insufficient data" };
  }

  const crossedAbove = prevFastSMA <= prevSlowSMA && fastSMA > slowSMA;
  const crossedBelow = prevFastSMA >= prevSlowSMA && fastSMA < slowSMA;

  if (crossedAbove) {
    return { signal: "BUY", reason: `Golden cross: fastSMA(${fastSMA.toFixed(2)}) > slowSMA(${slowSMA.toFixed(2)})`, fastSMA, slowSMA };
  }
  if (crossedBelow) {
    return { signal: "SELL", reason: `Death cross: fastSMA(${fastSMA.toFixed(2)}) < slowSMA(${slowSMA.toFixed(2)})`, fastSMA, slowSMA };
  }
  return { signal: "HOLD", reason: "No crossover", fastSMA, slowSMA };
}

module.exports = { smaCrossoverSignal, calculateSMA };