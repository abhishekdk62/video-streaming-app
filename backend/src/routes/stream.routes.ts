import { Router } from 'express';
import { StreamController } from '../controllers/StreamController';
import { StreamManager } from '../services/StreamManager';

const router = Router();
const streamManager = new StreamManager();
const streamController = new StreamController(streamManager);

router.get('/status', streamController.getStatus);
router.post('/restart/:id', streamController.restartStream);
router.get('/health', streamController.healthCheck);

export { router as streamRoutes, streamManager };
