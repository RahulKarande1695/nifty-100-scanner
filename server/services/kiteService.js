const { kc } = require("../config/kiteConfig");

/**
 * Login URL generate karto - frontend la redirect karaychi
 */
function getLoginURL() {
  return kc.getLoginURL();
}

/**
 * request_token ghewun session generate karto, access_token return karto
 */
async function generateSession(requestToken) {
  const session = await kc.generateSession(
    requestToken,
    process.env.KITE_API_SECRET
  );
  kc.setAccessToken(session.access_token);
  return session;
}

/**
 * Historical candle data fetch karto (strategy sathi lagto)
 * interval: minute, 3minute, 5minute, 15minute, day, etc.
 */
async function getHistoricalData(instrumentToken, interval, fromDate, toDate) {
  return kc.getHistoricalData(instrumentToken, interval, fromDate, toDate);
}

/**
 * Live quote / LTP (last traded price) fetch karto
 */
async function getLTP(instruments) {
  // instruments: ["NSE:INFY", "NSE:TCS"]
  return kc.getLTP(instruments);
}

/**
 * Order place karto
 */
async function placeOrder(orderParams) {
  // orderParams: { exchange, tradingsymbol, transaction_type, quantity, product, order_type }
  return kc.placeOrder("regular", orderParams);
}

/**
 * Instruments list fetch karto (NSE) - instrument_token map karayla lagto
 */
async function getInstruments(exchange = "NSE") {
  return kc.getInstruments(exchange);
}

module.exports = {
  getLoginURL,
  generateSession,
  getHistoricalData,
  getLTP,
  placeOrder,
  getInstruments,
};