import express from 'express';
import path from 'path';
import fs from 'fs';
import { config } from './src/config';
import { corsMiddleware } from './src/middleware/cors.middleware';
import { streamRoutes, streamManager } from './src/routes/stream.routes';
import {logger} from './src/utils/logger'

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Static file serving for HLS streams with proper headers
// Use __dirname to get correct path in production (when compiled to dist/server.js)
const streamsPath = path.join(__dirname, '..', 'public', 'streams');
console.log('Serving streams from:', streamsPath);
console.log('Streams path exists:', fs.existsSync(streamsPath));

app.use('/streams', express.static(streamsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Routes
app.use('/api/streams', streamRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({
    message: 'Video Streaming Backend',
    status: 'running',
    endpoints: {
      health: '/api/streams/health',
      status: '/api/streams/status',
      restart: '/api/streams/restart/:id'
    }
  });
});

// Debug endpoint to check file paths
app.get('/debug/files', (req, res) => {
  const stream1Path = path.join(streamsPath, 'stream1');
  
  res.json({
    dirname: __dirname,
    cwd: process.cwd(),
    streamsPath: streamsPath,
    streamsExists: fs.existsSync(streamsPath),
    stream1Exists: fs.existsSync(stream1Path),
    stream1Files: fs.existsSync(stream1Path) ? fs.readdirSync(stream1Path) : []
  });
});

// Initialize streams on startup
streamManager.initializeStreams();

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  streamManager.shutdown();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📺 Streaming ${config.streamCount} channels`);
  logger.info(`📡 RTSP Source: ${config.rtspUrl}`);
});

export default app;
