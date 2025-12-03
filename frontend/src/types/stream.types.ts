export interface StreamStatus {
    streamId: number;
    status: string;
    uptime?: number;
    outputUrl: string;
  }
  
  export interface StreamConfig {
    id: number;
    url: string;
  }
  