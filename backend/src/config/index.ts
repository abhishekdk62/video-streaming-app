import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  rtspUrl: process.env.RTSP_URL || 'rtsp://13.60.76.79:8554/live',
  streamCount: 6,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  hls: {
    segmentDuration: 2,
    playlistSize: 10,
    outputDir: 'public/streams'
  }
};
