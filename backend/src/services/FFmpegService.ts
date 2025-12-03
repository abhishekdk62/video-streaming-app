import { spawn, ChildProcess } from 'child_process';
import { StreamConfig, FFmpegProcess } from '../types/stream.types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class FFmpegService {
  private processes: Map<number, FFmpegProcess> = new Map();

  startStream(config: StreamConfig): FFmpegProcess {
    // FIX: Use absolute path for production
    const streamDir = path.isAbsolute(config.outputPath) 
      ? path.dirname(config.outputPath)
      : path.join(process.cwd(), path.dirname(config.outputPath));
    
    // Create directory if not exists
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
      logger.info(`Created directory: ${streamDir}`);
    }
  
    const isRTSP = config.rtspUrl.startsWith('rtsp://');
    const isURL = config.rtspUrl.startsWith('http://') || config.rtspUrl.startsWith('https://');
    const inputPath = isRTSP || isURL ? config.rtspUrl : path.join(process.cwd(), config.rtspUrl);
  
    // Make sure output path is absolute
    const outputPath = path.isAbsolute(config.outputPath)
      ? config.outputPath
      : path.join(process.cwd(), config.outputPath);
  
    logger.info(`Stream ${config.id} - Output path: ${outputPath}`);
    logger.info(`Stream ${config.id} - Stream dir: ${streamDir}`);
  
    const args = [
      '-re',
      '-stream_loop', '-1',
      ...(isRTSP ? ['-rtsp_transport', 'tcp'] : []),
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', config.segmentDuration.toString(),
      '-hls_list_size', config.playlistSize.toString(),
      '-hls_flags', 'delete_segments+append_list',
      '-hls_segment_filename', path.join(streamDir, 'segment%03d.ts'),
      '-start_number', '0',
      outputPath  // Use absolute path here
    ];
  

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
