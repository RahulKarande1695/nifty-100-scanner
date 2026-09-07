const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  tradingsymbol: { type: String, required: true },
  strategy: { type: String, enum: ["confluence", "simpleTrend"], required: true }, // नवीन field
  signal: { type: String, enum: ["BUY", "SELL"], required: true },
  fastSMA: Number,
  slowSMA: Number,
  score: Number,
  vwap: Number,
  ema9: Number,
  ema21: Number,
  superTrend: String,
  quantity: Number,
  dryRun: { type: Boolean, default: true },
  orderId: String,
  executedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Trade", tradeSchema);