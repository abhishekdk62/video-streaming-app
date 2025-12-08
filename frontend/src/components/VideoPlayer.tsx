import { useHLS } from "../hooks/useHLS";

interface VideoPlayerProps {
  streamId: number;
  src: string;
  onReady?: (video: HTMLVideoElement) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamId,
  src,
  onReady,
}) => {
  const { videoRef } = useHLS({ src, autoPlay: false, onReady });

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 md:px-4 md:py-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs md:text-sm lg:text-base font-semibold drop-shadow-lg">
            Stream {streamId}
          </span>
          <span className="text-emerald-400 text-xs md:text-sm animate-pulse">
            ●
          </span>
        </div>
      </div>

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        controls={false}
      />
    </div>
  );
};
