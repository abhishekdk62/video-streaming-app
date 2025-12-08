import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export class FFmpegService {
  constructor(config) {
    this.config = config;
    this.processes = new Map();
  }

  getStreamConfigs() {
    return Array.from({ length: this.config.streamCount }, (_, i) => ({
      id: i + 1,
      rtspUrl: this.config.rtspUrl,
      outputPath: path.join(
        this.config.hls.outputDir,
        `stream${i + 1}`,
        "output.m3u8"
      ),
      segmentDuration: this.config.hls.segmentDuration,
      playlistSize: this.config.hls.playlistSize,
    }));
  }

  startAll() {
    this.getStreamConfigs().forEach((c) => this.startStream(c));
  }

  startStream(config) {
    const streamDir = path.join(
      process.cwd(),
      path.dirname(config.outputPath)
    );

    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    const isRTSP = config.rtspUrl.startsWith("rtsp://");
    const inputPath = isRTSP
      ? config.rtspUrl
      : path.join(process.cwd(), config.rtspUrl);

    const outputPath = path.join(process.cwd(), config.outputPath);

    const args = [
      "-re",
      "-stream_loop",
      "-1",
      ...(isRTSP ? ["-rtsp_transport", "tcp"] : []),
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "zerolatency",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-f",
      "hls",
      "-hls_time",
      String(config.segmentDuration),
      "-hls_list_size",
      String(config.playlistSize),
      "-hls_flags",
      "delete_segments+append_list",
      "-hls_segment_filename",
      path.join(streamDir, "segment%03d.ts"),
      "-start_number",
      "0",
      outputPath,
    ];

    const proc = spawn("ffmpeg", args);
    const info = {
      streamId: config.id,
      process: proc,
      status: "starting",
      startTime: new Date(),
    };

    proc.stderr?.on("data", () => {
      if (info.status === "starting") info.status = "running";
    });

    proc.on("close", () => {
      info.status = "stopped";
      this.processes.delete(config.id);
    });

    this.processes.set(config.id, info);
  }

  getStatuses() {
    return Array.from(this.processes.values()).map((s) => ({
      streamId: s.streamId,
      status: s.status,
      uptime: s.startTime
        ? Math.floor((Date.now() - s.startTime.getTime()) / 1000)
        : undefined,
      outputUrl: `/streams/stream${s.streamId}/output.m3u8`,
    }));
  }

  stopAll() {
    this.processes.forEach((p) => p.process && p.process.kill("SIGTERM"));
    this.processes.clear();
  }
}
