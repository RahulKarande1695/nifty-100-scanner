server/
├── config/
│   └── kiteConfig.js       # KiteConnect instance + env vars
├── services/
│   └── kiteService.js      # Kite API calls (login, historical data, orders)
├── algo/
│   ├── strategies/
│   │   └── smaCrossover.js # Pure strategy logic (SMA fast/slow)
│   └── algoEngine.js       # Orchestrator: runs strategy, decides buy/sell
├── models/
│   └── Trade.js            # Mongoose schema — trade log DB madhe
├── routes/
│   └── algoRoutes.js       # Express endpoints
└── utils/
    └── logger.js           # Simple logger