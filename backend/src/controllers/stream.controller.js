export class StreamController {
    constructor(ffmpegService) {
      this.ffmpegService = ffmpegService;
      this.getStatus = this.getStatus.bind(this);
    }
  
    getStatus(req, res) {
      const statuses = this.ffmpegService.getStatuses();
      res.json({ success: true, data: statuses });
    }
  }
  