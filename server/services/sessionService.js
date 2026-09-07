const KiteSession = require("../models/KiteSession");
const { kc } = require("../config/kiteConfig");
const logger = require("../utils/logger");

/**
 * Access token DB madhe save karto (upsert - already असेल tar update)
 */
async function saveSession({ access_token, public_token, login_time }) {
  await KiteSession.findOneAndUpdate(
    { key: "current" },
    { access_token, public_token, login_time, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  logger.info("Kite session saved to DB");
}

/**
 * Server start honyachya vela DB madhun token load karto
 * ani kc (kiteconnect instance) var set karto
 */
async function loadSession() {
  const session = await KiteSession.findOne({ key: "current" });
  if (!session) {
    logger.warn("No saved Kite session found in DB - login karaव lagel");
    return null;
  }
  kc.setAccessToken(session.access_token);
  logger.info(`Kite session loaded from DB (saved on ${session.updatedAt})`);
  return session;
}

module.exports = { saveSession, loadSession };