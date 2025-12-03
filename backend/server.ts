import express from 'express';
import path from 'path';
import { config } from './src/config';
import { corsMiddleware } from './src/middleware/cors.middleware';
import { streamRoutes, streamManager } from './src/routes/stream.routes';
import {logger} from './src/utils/logger'
const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Static file serving for HLS streams with proper headers
app.use('/streams', express.static(path.join(__dirname, '../public/streams'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
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
