import { FFmpegService } from './FFmpegService';
import { getStreamConfigs } from '../config/stream.config';
import { StreamStatus } from '../types/stream.types';
import { logger } from '../utils/logger';

export class StreamManager {
  private ffmpegService: FFmpegService;

  constructor() {
    this.ffmpegService = new FFmpegService();
  }

  initializeStreams(): void {
    const configs = getStreamConfigs();
    
    logger.info(`Initializing ${configs.length} streams...`);
    
    configs.forEach((config) => {
      try {
        this.ffmpegService.startStream(config);
        logger.info(`Initialized stream ${config.id}`);
      } catch (error) {
        logger.error(`Failed to start stream ${config.id}:`, error);
      }
    });
  }

  getStreamStatuses(): StreamStatus[] {
    const statuses = this.ffmpegService.getAllStatuses();
    
    return statuses.map((status) => ({
      streamId: status.streamId,
      status: status.status,
      uptime: status.startTime 
        ? Math.floor((Date.now() - status.startTime.getTime()) / 1000)
        : undefined,
      outputUrl: `/streams/stream${status.streamId}/output.m3u8`
    }));
  }

  restartStream(streamId: number): boolean {
    logger.info(`Restarting stream ${streamId}`);
    this.ffmpegService.stopStream(streamId);
    setTimeout(() => {
      const configs = getStreamConfigs();
      const config = configs.find(c => c.id === streamId);
      
      if (config) {
        this.ffmpegService.startStream(config);
      }
    }, 1000);
    
    return true;
  }

  shutdown(): void {
    logger.info('Shutting down stream manager...');
    this.ffmpegService.stopAllStreams();
  }
}
