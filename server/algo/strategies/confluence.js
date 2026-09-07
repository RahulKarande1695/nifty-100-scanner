const { calculateEMA, calculateSuperTrend, calculateVWAP, calculatePivotPoints, isVolumeSpike } = require("./indicators");

/**
 * Confluence Strategy: VWAP + EMA9/21 + SuperTrend + Pivot + Volume
 * Kiती indicators agree hotat (5 pैki) yavarun BUY/SELL/HOLD decide hoto
 */
function confluenceSignal(candles, dailyCandles, options = {}) {
  const { minScore = 4 } = options; // 5 pैki kiमान 4 match zale पाहिजेत

  if (!candles || candles.length < 30 || !dailyCandles || dailyCandles.length < 2) {
    return { signal: "HOLD", score: 0, reason: "Analysis sathi purese candles nahiyet" };
  }

  const i = candles.length - 1;
  const last = candles[i];

  const ema9 = calculateEMA(candles, 9)[i];
  const ema21 = calculateEMA(candles, 21)[i];
  const vwap = calculateVWAP(candles)[i];
  const superTrend = calculateSuperTrend(candles, 7, 3)[i];
  const prevDayCandle = dailyCandles[dailyCandles.length - 2];
  const pivots = calculatePivotPoints(prevDayCandle);
  const volumeSpike = isVolumeSpike(candles, i);

  const bullish = {
    priceAboveVWAP: last.close > vwap,
    emaBullish: ema9 > ema21,
    superTrendGreen: superTrend.trend === "GREEN",
    pivotBreakout: last.close > pivots.r1,
    volumeSpike,
  };
  const bearish = {
    priceBelowVWAP: last.close < vwap,
    emaBearish: ema9 < ema21,
    superTrendRed: superTrend.trend === "RED",
    pivotBreakdown: last.close < pivots.s1,
    volumeSpike,
  };

  const bullScore = Object.values(bullish).filter(Boolean).length;
  const bearScore = Object.values(bearish).filter(Boolean).length;

  let signal = "HOLD", score = 0, checks = {}, reason = "";

  if (bullScore >= minScore) {
    signal = "BUY"; score = bullScore; checks = bullish;
    reason = `Confluence BUY (${score}/5)`;
  } else if (bearScore >= minScore) {
    signal = "SELL"; score = bearScore; checks = bearish;
    reason = `Confluence SELL (${score}/5)`;
  } else {
    reason = `Score kami aahe (BUY ${bullScore}/5, SELL ${bearScore}/5) - HOLD`;
  }

  return { signal, score, checks, lastClose: last.close, vwap, ema9, ema21, superTrend: superTrend.trend, pivots, reason };
}

module.exports = { confluenceSignal };