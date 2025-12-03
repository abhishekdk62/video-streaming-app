import { useState, useRef, useCallback, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import './Dashboard.css';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const STREAMS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  url: `${BACKEND_URL}/streams/stream${i + 1}/output.m3u8`
}));

export const Dashboard: React.FC = () => {
  const [readyPlayers, setReadyPlayers] = useState<HTMLVideoElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamStatuses, setStreamStatuses] = useState<any[]>([]);
  const playersRef = useRef<HTMLVideoElement[]>([]);

  // Fetch stream statuses
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/streams/status`);
        const data = await response.json();
        if (data.success) {
          setStreamStatuses(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stream status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayerReady = useCallback((video: HTMLVideoElement) => {
    playersRef.current.push(video);
    setReadyPlayers(prev => [...prev, video]);
    console.log(`Player ready. Total: ${playersRef.current.length}/6`);
  }, []);

  const syncAndPlayAll = useCallback(async () => {
    if (playersRef.current.length !== 6) {
      alert('Wait for all streams to load!');
      return;
    }

    try {
      // Pause all first
      playersRef.current.forEach(video => video.pause());

      // Seek all to same position (0)
      await Promise.all(
        playersRef.current.map(video => {
          video.currentTime = 0;
          return new Promise(resolve => {
            video.onseeked = () => resolve(true);
          });
        })
      );

      // Play all simultaneously
      await Promise.all(
        playersRef.current.map(video => video.play())
      );

      setIsPlaying(true);
      console.log('All streams synchronized and playing!');

      // Continuous sync check
      const syncInterval = setInterval(() => {
        const times = playersRef.current.map(v => v.currentTime);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxDiff = Math.max(...times) - Math.min(...times);

        if (maxDiff > 0.5) {
          console.log('Drift detected, re-syncing...');
          playersRef.current.forEach(video => {
            if (Math.abs(video.currentTime - avgTime) > 0.3) {
              video.currentTime = avgTime;
            }
          });
        }
      }, 2000);

      return () => clearInterval(syncInterval);
    } catch (error) {
      console.error('Error syncing streams:', error);
    }
  }, []);

  const pauseAll = useCallback(() => {
    playersRef.current.forEach(video => video.pause());
    setIsPlaying(false);
  }, []);

  const runningStreams = streamStatuses.filter(s => s.status === 'running').length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📺 Video Streaming Dashboard</h1>
          <div className="stream-info">
            <span className="status-badge">
              {runningStreams}/6 Streams Running
            </span>
          </div>
        </div>
        <div className="controls">
          <button 
            onClick={syncAndPlayAll} 
            disabled={readyPlayers.length !== 6 || isPlaying}
            className="btn btn-primary"
          >
            ▶ Sync & Play All ({readyPlayers.length}/6 Ready)
          </button>
          <button 
            onClick={pauseAll} 
            disabled={!isPlaying}
            className="btn btn-secondary"
          >
            ⏸ Pause All
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {STREAMS.map(stream => (
          <VideoPlayer
            key={stream.id}
            streamId={stream.id}
            src={stream.url}
            onReady={handlePlayerReady}
          />
        ))}
      </main>

      <footer className="dashboard-footer">
        <p>Synchronized HLS Streaming • RTSP to HLS Conversion</p>
      </footer>
    </div>
  );
};
