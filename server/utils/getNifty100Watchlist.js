const fs = require("fs");
const path = require("path");

const NIFTY_100_SYMBOLS = [
  "RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "BHARTIARTL", "ITC",
  "SBIN", "LICI", "HINDUNILVR", "LT", "BAJFINANCE", "HCLTECH", "KOTAKBANK",
  "SUNPHARMA", "MARUTI", "AXISBANK", "M&M", "ULTRACEMCO", "NTPC", "TITAN",
  "ONGC", "TATAMOTORS", "ADANIENT", "BAJAJFINSV", "ASIANPAINT", "POWERGRID",
  "COALINDIA", "WIPRO", "NESTLEIND", "ADANIPORTS", "JSWSTEEL", "TATASTEEL",
  "BAJAJ-AUTO", "GRASIM", "TECHM", "HINDALCO", "SBILIFE", "DRREDDY",
  "HDFCLIFE", "CIPLA", "EICHERMOT", "APOLLOHOSP", "BRITANNIA", "DIVISLAB",
  "INDUSINDBK", "TATACONSUM", "HEROMOTOCO", "BPCL", "SHREECEM", "PIDILITIND",
  "DABUR", "GODREJCP", "SIEMENS", "AMBUJACEM", "DLF", "VEDANTA", "BANKBARODA",
  "ZOMATO", "TRENT", "PNB", "GAIL", "HAL", "BEL", "IOC", "SRF", "MOTHERSON",
  "TVSMOTOR", "CHOLAFIN", "HAVELLS", "TORNTPHARM", "LTIM", "ICICIPRULI",
  "ICICIGI", "INDIGO", "CANBK", "MARICO", "COLPAL", "PIIND", "ABB",
  "BOSCHLTD", "MCDOWELL-N", "GODREJPROP", "PAGEIND", "NAUKRI", "IRCTC",
  "JINDALSTEL", "TATAPOWER", "ADANIGREEN", "ADANIENSOL", "LODHA", "ATGL",
  "ZYDUSLIFE", "BANKINDIA", "UNITDSPR", "LUPIN", "ALKEM", "AUROPHARMA",
  "POLYCAB", "MUTHOOTFIN", "SHRIRAMFIN", "OFSS", "PFC", "RECLTD",
];

function getNifty100Watchlist() {
  const filePath = path.join(__dirname, "..", "data", "nse-instruments.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("Instruments file nahi mila - aधी /api/instruments/refresh call kara");
  }
  const instruments = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const found = [];
  NIFTY_100_SYMBOLS.forEach((symbol) => {
    const match = instruments.find((i) => i.tradingsymbol === symbol && i.instrument_type === "EQ");
    if (match) found.push({ instrumentToken: match.instrument_token, tradingsymbol: match.tradingsymbol });
  });
  return found;
}

module.exports = { getNifty100Watchlist, NIFTY_100_SYMBOLS };