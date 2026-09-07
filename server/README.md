# Nifty-100 Scanner — Kite Connect Algo Trading Bot

Node.js/Express backend that connects to Zerodha Kite Connect, scans Nifty-100 stocks using two trading strategies, and sends BUY/SELL signals to Telegram automatically every 5 minutes during market hours.

## Tech Stack

- **Backend**: Express.js
- **Database**: MongoDB (Mongoose)
- **Broker API**: Zerodha KiteConnect SDK
- **Scheduling**: node-cron
- **Notifications**: Telegram Bot API (via axios)

## Project Structure

```
nifty-100-scanner/
├── server.js                      # Entry point — connects DB, loads session, starts server + scheduler
├── config/
│   └── kiteConfig.js              # KiteConnect client instance (kc)
├── routes/
│   └── algoRoutes.js              # All API routes
├── services/
│   ├── kiteService.js             # Kite API wrapper (login URL, session, historical data, orders)
│   ├── sessionService.js          # Save/load access_token to/from DB
│   └── telegramService.js         # Formats and sends Telegram notifications
├── algo/
│   ├── algoEngine.js              # Runs strategies for a single stock / whole watchlist
│   └── strategies/
│       ├── indicators.js          # EMA, ATR, SuperTrend, VWAP, Pivot Points, Volume spike
│       ├── confluence.js          # 5-indicator confluence strategy
│       └── simpleTrend.js         # 3-condition simple trend strategy
├── scheduler/
│   └── scanScheduler.js           # Cron job — auto-scans watchlist every 5 min in market hours
├── models/
│   ├── Trade.js                   # Signal/trade log
│   └── KiteSession.js             # Stored access_token
└── data/
    └── nse-instruments.json       # Generated via /api/instruments/refresh
```

## Setup

### 1. Install dependencies

```bash
npm install express cors mongoose kiteconnect axios node-cron dotenv
```

### 2. Environment variables (`.env`)

```
PORT=5000
MONGO_URI=<your MongoDB connection string>
KITE_API_KEY=<from developers.kite.trade>
KITE_API_SECRET=<from developers.kite.trade>
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_CHAT_ID=<your Telegram chat id>
```

### 3. Zerodha Kite Connect app setup

1. Go to [developers.kite.trade](https://developers.kite.trade), create/select your app.
2. Set **Redirect URL** to exactly: `http://localhost:5000/api/kite/callback`
3. Copy the API Key and Secret into `.env`.

### 4. Telegram bot setup

1. Message `@BotFather` on Telegram → `/newbot` → follow prompts → copy the token into `TELEGRAM_BOT_TOKEN`.
2. Send any message to your new bot, then open:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Copy the `chat.id` value into `TELEGRAM_CHAT_ID`.

### 5. Start the server

```bash
node server.js
```

## Daily Login Flow (required every trading day)

Kite access tokens expire daily. Before market open each day:

1. Open `http://localhost:5000/api/kite/login-url` in a browser, copy the returned URL.
2. Open that URL, log in to Zerodha (User ID → Password → TOTP/PIN).
3. You'll be redirected to `/api/kite/callback`, which generates and saves the `access_token` to MongoDB automatically.
4. The scheduler and algo routes will now work with the fresh token until it expires.

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/kite/login-url` | Returns Zerodha login URL |
| GET | `/api/kite/callback` | Handles redirect, generates & saves session |
| POST | `/api/algo/run` | Run both strategies on a single stock |
| POST | `/api/algo/run-watchlist` | Run both strategies on a list of stocks |
| GET | `/api/instruments/refresh` | Fetch & cache all NSE instruments (run once, or after re-deploy) |
| GET | `/api/instruments/lookup/:symbol` | Look up instrument_token for a symbol |
| POST | `/api/instruments/nifty100-tokens` | Get instrument tokens for all Nifty-100 symbols |

### Example: run a single stock

```json
POST /api/algo/run
{
  "instrumentToken": 738561,
  "tradingsymbol": "RELIANCE",
  "dryRun": true
}
```

## Strategies

Both strategies run together on every scan, and both log to the `Trade` collection with a `strategy` field so they can be compared.

### 1. Confluence Strategy (5 indicators)

BUY/SELL triggers when at least 4 of 5 conditions agree:

- Price vs VWAP
- EMA9 vs EMA21 crossover
- SuperTrend (GREEN/RED)
- Price vs Pivot R1/S1
- Volume spike (vs 20-candle average)

### 2. Simple Trend Strategy (3 conditions)

BUY only when **all 3** agree (no partial score):

- Price > VWAP
- EMA9 > EMA21
- SuperTrend = GREEN

(Mirrored logic for SELL.)

## Automated Scheduler

`scheduler/scanScheduler.js` runs every 5 minutes, Mon–Fri, 9:15 AM – 3:30 PM IST:

1. Loads the Nifty-100 watchlist from `data/nse-instruments.json`.
2. Runs both strategies on every stock via `runForWatchlist`.
3. Each non-HOLD signal automatically triggers a Telegram notification (handled inside `algoEngine.js`, not the scheduler itself).
4. Started automatically from `server.js` once the server begins listening.

> Currently runs with `dryRun: true` — no real orders are placed, only signals/notifications/DB logs.

## Telegram Notifications

Each BUY/SELL message includes:
- Strategy name (Confluence or Simple Trend)
- Score (e.g. `4/5` for confluence)
- Which individual conditions matched (✅/❌)
- Price, VWAP, EMA9, EMA21, SuperTrend values
- IST timestamp

## Going Live (real order placement)

To let the bot place real orders instead of just notifying:

1. Change `dryRun: false` where `startScheduler()` is called in `server.js`.
2. Double-check position sizing (`quantity`) and risk limits before doing this.
3. Consider whether both strategies should be allowed to place independent orders on the same stock, or whether they should require agreement first — right now they act independently.

## Notes / Known Considerations

- `/api/instruments/refresh` must be run at least once (and periodically re-run) to keep `nse-instruments.json` up to date — the scheduler depends on this file.
- The Nifty-100 symbol list is a static, approximate list — verify against the official NSE index periodically.
- Confluence and Simple Trend can disagree; both are logged independently for comparison.
