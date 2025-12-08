import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./src/config.js";
import { FFmpegService } from "./src/services/FFmpegService.js";
import { createStreamRouter } from "./src/routes/stream.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

const streamsPath = path.join(__dirname, "public", "streams");

if (!fs.existsSync(streamsPath)) {
  fs.mkdirSync(streamsPath, { recursive: true });
}

app.use(
  "/streams",
  express.static(streamsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      } else if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/MP2T");
      }

      res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
      res.setHeader("Cache-Control", "no-cache");
    },
  })
);
const ffmpegService = new FFmpegService(config);
ffmpegService.startAll();
app.use("/api/streams", createStreamRouter(ffmpegService));

app.get("/", (req, res) => {
  res.json({ message: "Video Streaming Backend", status: "running" });
});

const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  ffmpegService.stopAll();
  server.close(() => process.exit(0));
});
