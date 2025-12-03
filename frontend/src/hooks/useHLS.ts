import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface UseHLSProps {
  src: string;
  autoPlay?: boolean;
  onReady?: (video: HTMLVideoElement) => void;
}

export const useHLS = ({ src, autoPlay = false, onReady }: UseHLSProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`HLS manifest parsed for: ${src}`);
        if (autoPlay) {
          video.play().catch(err => console.warn('Autoplay prevented:', err));
        }
        if (onReady) {
          onReady(video);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Unrecoverable error, destroying HLS instance');
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) {
          video.play().catch(err => console.warn('Autoplay prevented:', err));
        }
        if (onReady) {
          onReady(video);
        }
      });
    }
  }, [src, autoPlay, onReady]);

  return { videoRef, hlsRef };
};
