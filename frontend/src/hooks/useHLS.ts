import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface UseHLSProps {
  src: string;
  autoPlay?: boolean;
  onReady?: (video: HTMLVideoElement) => void;
}

export const useHLS = ({ src, autoPlay = false, onReady }: UseHLSProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      const handleReady = () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
        onReady?.(video);
      };

      hls.on(Hls.Events.MANIFEST_PARSED, handleReady);
      const metaHandler = () => {
        onReady?.(video);
      };
      video.addEventListener("loadedmetadata", metaHandler);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy();
        }
      });

      return () => {
        video.removeEventListener("loadedmetadata", metaHandler);
        hls.destroy();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const handler = () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
        onReady?.(video);
      };
      video.addEventListener("loadedmetadata", handler);
      return () => video.removeEventListener("loadedmetadata", handler);
    }
  }, [src, autoPlay, onReady]);

  return { videoRef };
};
