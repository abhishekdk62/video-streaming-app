import { StreamConfig } from '../types/stream.types';
import { config } from './index';
import path from 'path';

export const getStreamConfigs = (): StreamConfig[] => {
  return Array.from({ length: config.streamCount }, (_, i) => ({
    id: i + 1,
    rtspUrl: config.rtspUrl,
    outputPath: path.join(config.hls.outputDir, `stream${i + 1}`, 'output.m3u8'),
    segmentDuration: config.hls.segmentDuration,
    playlistSize: config.hls.playlistSize
  }));
};
