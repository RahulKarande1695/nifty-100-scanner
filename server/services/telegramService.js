const axios = require("axios");
const logger = require("../utils/logger");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.warn("Telegram BOT_TOKEN ki CHAT_ID .env madhe missing - notification skip");
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await axios.post(url, { chat_id: CHAT_ID, text, parse_mode: "Markdown" });
  } catch (err) {
    logger.error(`Telegram notification failed: ${err.message}`);
  }
}

/**
 * checks object la readable labels madhe convert karto (confluence sathi)
 */
function formatChecks(checks) {
  if (!checks) return "";
  const labels = {
    priceAboveVWAP: "Price > VWAP",
    priceBelowVWAP: "Price < VWAP",
    emaBullish: "EMA9 > EMA21",
    emaBearish: "EMA9 < EMA21",
    superTrendGreen: "SuperTrend GREEN",
    superTrendRed: "SuperTrend RED",
    pivotBreakout: "Price > R1 (Pivot)",
    pivotBreakdown: "Price < S1 (Pivot)",
    volumeSpike: "Volume Spike",
  };
  return Object.entries(checks)
    .map(([key, val]) => `  ${val ? "✅" : "❌"} ${labels[key] || key}`)
    .join("\n");
}

/**
 * BUY/SELL signal sathi formatted alert pathवतo - confluence (5) ani simpleTrend (3) donhi sathi
 */
async function notifySignal({ tradingsymbol, strategy, signal, reason, score, checks, price, lastClose, vwap, ema9, ema21, superTrend }) {
  const emoji = signal === "BUY" ? "🟢" : "🔴";
  const strategyLabel = strategy === "confluence" ? "Confluence (5 conditions)" : "Simple Trend (3 conditions)";
  const closePrice = price ?? lastClose;

  let text =
    `${emoji} *${signal} SIGNAL* — _${strategyLabel}_\n` +
    `Stock: *${tradingsymbol}*\n`;

  if (strategy === "confluence") {
    text += `Score: *${score}/5*\n${formatChecks(checks)}\n`;
  } else {
    text += `Matched: Price/VWAP, EMA9/21, SuperTrend (3/3)\n`;
  }

  text +=
    `\nPrice: ₹${closePrice?.toFixed(2)}\n` +
    `VWAP: ${vwap?.toFixed(2)} | EMA9: ${ema9?.toFixed(2)} | EMA21: ${ema21?.toFixed(2)}\n` +
    `SuperTrend: ${superTrend}\n` +
    `Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

  await sendTelegramMessage(text);
}

module.exports = { sendTelegramMessage, notifySignal };