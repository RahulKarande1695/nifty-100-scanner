require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const algoRoutes = require("./routes/algoRoutes");
const { loadSession } = require("./services/sessionService");
const { startScheduler } = require("./scheduler/scanScheduler");
const logger = require("./utils/logger");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", algoRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");

    await loadSession();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      startScheduler({ dryRun: true }); // real trading sathi false kara, jara nantar
    });
  } catch (err) {
    logger.error(`Server start failed: ${err.message}`);
    process.exit(1);
  }
}

start();