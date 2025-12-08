import { useState, useRef, useCallback } from "react";
import { VideoPlayer } from "./VideoPlayer";

const BACKEND_URL = import.meta.env.VITE_API_URL;
const STREAMS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  url: `${BACKEND_URL}/demo/index.m3u8`,
}));

export const Dashboard: React.FC = () => {
  const playersRef = useRef<HTMLVideoElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, forceRerender] = useState(0); // used only so readyCount updates in UI

  const handlePlayerReady = useCallback((video: HTMLVideoElement) => {
    if (!playersRef.current.includes(video)) {
      playersRef.current.push(video);
      console.log(
        "[Dashboard] player ready, total:",
        playersRef.current.length
      );
      // trigger re-render so readyCount and button state update
      forceRerender((x) => x + 1);
    }
  }, []);

  const syncAndPlayAll = useCallback(async () => {
    const players = playersRef.current;
    console.log("[Dashboard] syncAndPlayAll, ready:", players.length);

    if (players.length !== 6) {
      alert("Wait for all streams to load!");
      return;
    }

    try {
      players.forEach((v) => v.pause());

      await Promise.all(
        players.map(
          (v) =>
            new Promise<void>((resolve) => {
              const handler = () => {
                v.removeEventListener("seeked", handler);
                resolve();
              };
              v.addEventListener("seeked", handler);
              v.currentTime = 0;
            })
        )
      );

      await Promise.all(players.map((v) => v.play()));
      setIsPlaying(true);
    } catch (err) {
      console.error("Error syncing streams:", err);
    }
  }, []);

  const pauseAll = useCallback(() => {
    playersRef.current.forEach((v) => v.pause());
    setIsPlaying(false);
  }, []);

  const readyCount = playersRef.current.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-6 lg:p-8">
      <header className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            📺 Video Streaming Dashboard
          </h1>
          <span className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white text-sm md:text-base font-semibold rounded-full shadow-md">
            {readyCount}/6 Streams Ready
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={syncAndPlayAll}
            disabled={readyCount !== 6 || isPlaying}
            className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-300 text-sm md:text-base"
          >
            ▶ Sync & Play All ({readyCount}/6)
          </button>
          <button
            onClick={pauseAll}
            disabled={!isPlaying}
            className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-300 text-sm md:text-base"
          >
            ⏸ Pause All
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-6">
        {STREAMS.map((stream) => (
          <VideoPlayer
            key={stream.id}
            streamId={stream.id}
            src={stream.url}
            onReady={handlePlayerReady}
          />
        ))}
      </main>

      <footer className="text-center text-white text-sm md:text-base opacity-90">
        <p>Synchronized HLS Streaming • RTSP to HLS Conversion</p>
      </footer>
    </div>
  );
};
