import { useHLS } from '../hooks/useHLS';
import './VideoPlayer.css';

interface VideoPlayerProps {
  streamId: number;
  src: string;
  onReady?: (video: HTMLVideoElement) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamId, src, onReady }) => {
  const { videoRef } = useHLS({ src, autoPlay: false, onReady });

  return (
    <div className="video-player">
      <div className="video-header">
        <span className="stream-label">Stream {streamId}</span>
        <span className="stream-status">●</span>
      </div>
      <video
        ref={videoRef}
        className="video-element"
        muted
        playsInline
        controls={false}
      />
    </div>
  );
};
