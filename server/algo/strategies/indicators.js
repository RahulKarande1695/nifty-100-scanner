/**
 * EMA calculate karto - array of closes var
 */
function calculateEMA(candles, period) {
  const k = 2 / (period + 1);
  const emaArray = [candles[0].close];
  for (let i = 1; i < candles.length; i++) {
    emaArray.push(candles[i].close * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

/**
 * ATR calculate karto (SuperTrend sathi lagto)
 */
function calculateATR(candles, period = 7) {
  const tr = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const atr = [];
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      atr.push(null);
      continue;
    }
    const slice = tr.slice(i - period + 1, i + 1);
    atr.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return atr; // note: index i mhanje candles[i+1] cha ATR
}

/**
 * SuperTrend calculate karto - GREEN(uptrend)/RED(downtrend)
 */
function calculateSuperTrend(candles, period = 7, multiplier = 3) {
  const atr = calculateATR(candles, period);
  const st = [{ value: null, trend: null }];
  let trend = 1;
  let finalUpperBand = 0;
  let finalLowerBand = 0;

  for (let i = 1; i < candles.length; i++) {
    const atrValue = atr[i - 1];
    if (atrValue == null) {
      st.push({ value: null, trend: null });
      continue;
    }
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpper = hl2 + multiplier * atrValue;
    const basicLower = hl2 - multiplier * atrValue;
    const prevClose = candles[i - 1].close;

    finalUpperBand = basicUpper < finalUpperBand || prevClose > finalUpperBand ? basicUpper : finalUpperBand;
    finalLowerBand = basicLower > finalLowerBand || prevClose < finalLowerBand ? basicLower : finalLowerBand;

    if (candles[i].close > finalUpperBand) trend = 1;
    else if (candles[i].close < finalLowerBand) trend = -1;

    st.push({ value: trend === 1 ? finalLowerBand : finalUpperBand, trend: trend === 1 ? "GREEN" : "RED" });
  }
  return st;
}

/**
 * VWAP calculate karto - roj reset hoto (intraday)
 */
function calculateVWAP(candles) {
  let cumTPV = 0, cumVol = 0, currentDay = null;
  const vwap = [];
  candles.forEach((c) => {
    const day = new Date(c.date).toDateString();
    if (day !== currentDay) {
      cumTPV = 0;
      cumVol = 0;
      currentDay = day;
    }
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumTPV += typicalPrice * c.volume;
    cumVol += c.volume;
    vwap.push(cumVol === 0 ? c.close : cumTPV / cumVol);
  });
  return vwap;
}

/**
 * Pivot points calculate karto - kalcha (previous day) daily candle vaparun
 */
function calculatePivotPoints(prevDayCandle) {
  const { high, low, close } = prevDayCandle;
  const pivot = (high + low + close) / 3;
  return {
    pivot,
    r1: 2 * pivot - low,
    s1: 2 * pivot - high,
    r2: pivot + (high - low),
    s2: pivot - (high - low),
  };
}

/**
 * Volume spike check karto - last N candles chya average peksha jast aahe ka
 */
function isVolumeSpike(candles, index, lookback = 20, multiplier = 1.5) {
  if (index < lookback) return false;
  const slice = candles.slice(index - lookback, index);
  const avgVol = slice.reduce((sum, c) => sum + c.volume, 0) / slice.length;
  return candles[index].volume > avgVol * multiplier;
}

module.exports = { calculateEMA, calculateATR, calculateSuperTrend, calculateVWAP, calculatePivotPoints, isVolumeSpike };