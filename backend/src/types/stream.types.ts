export interface StreamConfig {
    id: number;
    rtspUrl: string;
    outputPath: string;
    segmentDuration: number;
    playlistSize: number;
  }
  
  export interface FFmpegProcess {
    streamId: number;
    process: any;
    status: 'starting' | 'running' | 'stopped' | 'error';
    startTime?: Date;
  }
  
  export interface StreamStatus {
    streamId: number;
    status: string;
    uptime?: number;
    outputUrl: string;
  }
  