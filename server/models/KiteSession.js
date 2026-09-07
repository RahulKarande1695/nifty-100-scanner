const mongoose = require("mongoose");

// Ek doc फक्त ठेवायचं (singleton pattern) - naव fixed "current" ठेवला
const kiteSessionSchema = new mongoose.Schema({
  key: { type: String, default: "current", unique: true },
  access_token: { type: String, required: true },
  public_token: String,
  login_time: Date,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("KiteSession", kiteSessionSchema);