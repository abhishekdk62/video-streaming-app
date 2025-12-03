import { spawn, ChildProcess } from 'child_process';
import { StreamConfig, FFmpegProcess } from '../types/stream.types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class FFmpegService {
  private processes: Map<number, FFmpegProcess> = new Map();

  startStream(config: StreamConfig): FFmpegProcess {
    const streamDir = path.dirname(config.outputPath);
    
    // Create directory if not exists
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
      logger.info(`Created directory: ${streamDir}`);
    }

    const args = [
      '-rtsp_transport', 'tcp',
      '-i', config.rtspUrl,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', config.segmentDuration.toString(),
      '-hls_list_size', config.playlistSize.toString(),
      '-hls_flags', 'delete_segments+append_list',
      '-hls_segment_filename', path.join(streamDir, 'segment%03d.ts'),
      '-start_number', '0',
      config.outputPath
    ];

    logger.info(`Starting FFmpeg for stream ${config.id}`);
    const ffmpegProcess = spawn('ffmpeg', args, {
      detached: false
    });

    const processInfo: FFmpegProcess = {
      streamId: config.id,
      process: ffmpegProcess,
      status: 'starting',
      startTime: new Date()
    };

    ffmpegProcess.stdout?.on('data', (data) => {
      logger.debug(`Stream ${config.id} stdout: ${data}`);
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      if (message.includes('Opening') || message.includes('muxer')) {
        processInfo.status = 'running';
        logger.info(`Stream ${config.id} is now running`);
      }
    });

    ffmpegProcess.on('error', (error) => {
      processInfo.status = 'error';
      logger.error(`Stream ${config.id} error: ${error.message}`);
    });

    ffmpegProcess.on('close', (code) => {
      processInfo.status = 'stopped';
      logger.warn(`Stream ${config.id} exited with code ${code}`);
      this.processes.delete(config.id);
    });

    this.processes.set(config.id, processInfo);
    return processInfo;
  }

  stopStream(streamId: number): boolean {
    const processInfo = this.processes.get(streamId);
    if (processInfo && processInfo.process) {
      processInfo.process.kill('SIGTERM');
      this.processes.delete(streamId);
      logger.info(`Stopped stream ${streamId}`);
      return true;
    }
    return false;
  }

  getStreamStatus(streamId: number): FFmpegProcess | undefined {
    return this.processes.get(streamId);
  }

  getAllStatuses(): FFmpegProcess[] {
    return Array.from(this.processes.values());
  }

  stopAllStreams(): void {
    this.processes.forEach((processInfo) => {
      if (processInfo.process) {
        processInfo.process.kill('SIGTERM');
      }
    });
    this.processes.clear();
    logger.info('All streams stopped');
  }
}
