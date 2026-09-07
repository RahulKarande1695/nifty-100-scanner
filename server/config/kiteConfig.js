const { KiteConnect } = require("kiteconnect");

if (!process.env.KITE_API_KEY) {
  throw new Error("KITE_API_KEY missing in .env");
}

const kc = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

// Access token daily expire hoto - DB madhun load karun set karaycha
function setAccessToken(token) {
  kc.setAccessToken(token);
}

module.exports = { kc, setAccessToken };

