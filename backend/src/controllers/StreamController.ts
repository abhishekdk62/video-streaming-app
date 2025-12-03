import { Request, Response } from 'express';
import { StreamManager } from '../services/StreamManager';
import { logger } from '../utils/logger';

export class StreamController {
  constructor(private streamManager: StreamManager) {}

  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const statuses = this.streamManager.getStreamStatuses();
      res.json({
        success: true,
        data: statuses
      });
    } catch (error) {
      logger.error('Failed to get stream statuses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stream statuses'
      });
    }
  };

  restartStream = async (req: Request, res: Response): Promise<void> => {
    try {
      const streamId = parseInt(req.params.id);
      
      if (isNaN(streamId) || streamId < 1 || streamId > 6) {
        res.status(400).json({
          success: false,
          error: 'Invalid stream ID'
        });
        return;
      }
      
      const success = this.streamManager.restartStream(streamId);
      
      if (success) {
        res.json({
          success: true,
          message: `Stream ${streamId} restart initiated`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }
    } catch (error) {
      logger.error('Failed to restart stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restart stream'
      });
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  };
}
