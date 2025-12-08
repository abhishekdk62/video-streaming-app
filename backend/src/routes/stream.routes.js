import { Router } from "express";
import { StreamController } from "../controllers/stream.controller.js";

export function createStreamRouter(ffmpegService) {
  const router = Router();
  const controller = new StreamController(ffmpegService);

  router.get("/status", controller.getStatus);

  return router;
}
