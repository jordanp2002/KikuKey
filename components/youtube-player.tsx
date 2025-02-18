import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import "video.js/dist/video-js.css";
import { Button } from "./ui/button";

import { insertVideoLog } from "@/app/actions";
import { toast } from "sonner";
import { Input } from "./ui/input";

export default function YouTubePlayer() {
  const playerRef = useRef<any>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const watchTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      hl: 'ja',
    },
  };

  const handleVideoReady = (event: any) => {
    playerRef.current = event.target;
    setDuration(playerRef.current.getDuration());
    setIsVideoLoaded(true);

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!playerRef.current) return;

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        if (playerRef.current.getPlayerState() === 1) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
        break;
      case 'arrowleft':
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5);
        break;
      case 'arrowright':
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5);
        break;
      case 'j':
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
        break;
      case 'l':
        e.preventDefault();
        playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
        break;
      case 'k':
        e.preventDefault();
        if (playerRef.current.getPlayerState() === 1) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
        break;
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch) {
      const wasTimerPaused = isPaused;
      const currentWatchTime = watchTime;
      
      const newVideoId = videoIdMatch[1];
      setVideoId(newVideoId);
      setIsVideoLoaded(false);

      if (startTimeRef.current !== null) {
        watchTimeRef.current = currentWatchTime;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Only set isPaused if it wasn't already paused
        if (!wasTimerPaused) {
          setIsPaused(false);
        }
      }
    } else {
      toast.error('Invalid YouTube URL');
    }
  };

  const handleStateChange = (event: any) => {
    const playerState = event.data;
    // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (playerState === 1) { 
      setIsPlaying(true);
      if (startTimeRef.current === null) {
        const now = Date.now();
        startTimeRef.current = now;
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
          setWatchTime(elapsed);
        }, 1000);
        setIsPaused(false);
      } 
      else if (isPaused) {
        handlePauseImmersion();
      }
      else if (!timerRef.current && watchTimeRef.current !== undefined) {
        startTimeRef.current = Date.now() - (watchTimeRef.current * 1000);
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
          setWatchTime(elapsed);
        }, 1000);
        setIsPaused(false);
      }
    } else if (playerState === 2) { 
      setIsPlaying(false);
    } else if (playerState === 0) { 
      handleVideoEnd();
    }
  };

  const handleVideoEnd = () => {
    if (!isPaused && timerRef.current) {
      watchTimeRef.current = watchTime;
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPaused(true);
    }
    setIsPlaying(false);
  };

  const saveImmersionTime = async () => {
    if (startTimeRef.current === null) return;
    
    const now = new Date();
    const startDate = new Date(startTimeRef.current);
    
    try {
      const result = await insertVideoLog(
        startDate.toISOString(),
        now.toISOString()
      );
      if (result.error) {
        if (result.error.message?.includes('auth')) {
          toast.error('Please sign in to track your video progress');
        } else {
          toast.error('Failed to save video progress');
        }
      } else {
        toast.success('Video progress saved');
      }
    } catch (error) {
      console.error('Failed to log video session:', error);
      toast.error('Failed to save video progress');
    }
  };

  useEffect(() => {
    if (!playerRef.current) return;

    const handleTimeUpdate = () => {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        setCurrentTime(currentTime);
      } catch (error) {
        console.error('Error in time update:', error);
      }
    };

    // Set up interval for time tracking
    const timeUpdateInterval = setInterval(handleTimeUpdate, 100);
    return () => {
      clearInterval(timeUpdateInterval);
    };
  }, [playerRef.current]);

  const handlePauseImmersion = () => {
    if (!isPaused) {
      // Pause both timer and video
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Store the elapsed time
      watchTimeRef.current = watchTime;
      setIsPaused(true);
      // Pause the video
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    } else {
      // Resume both timer and video
      startTimeRef.current = Date.now() - (watchTimeRef.current * 1000);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setWatchTime(elapsed);
      }, 1000);
      setIsPaused(false);
      // Play the video
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    }
  };

  const handleManualSubmit = async () => {
    if (startTimeRef.current !== null) {
      await saveImmersionTime();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      setWatchTime(0);
      setIsPaused(false);
      setIsPlaying(false);

      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <Input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="w-64 focus-visible:ring-[#F87171]"
            />
            <Button 
              type="submit" 
              variant="ghost"
              size="sm" 
              className="hover:bg-[#F87171] hover:text-white transition-colors"
              disabled={!videoUrl}
            >
              Load Video
            </Button>
          </form>
        </div>

        {/* Time tracker with pause and submit buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Immersion time: {formatDuration(watchTime)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePauseImmersion}
                  disabled={startTimeRef.current === null}
                  className={`p-1 hover:bg-[#F87171] hover:text-white transition-colors ${
                    isPaused ? 'text-[#F87171]' : ''
                  }`}
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSubmit}
                  disabled={startTimeRef.current === null}
                  className="p-1 hover:bg-[#F87171] hover:text-white transition-colors"
                  title="Submit and reset timer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </Button>
              </div>
            </div>

            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 min-h-0 bg-black/5 rounded-lg overflow-hidden">
        {videoId ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full max-h-[calc(100vh-12rem)] relative" style={{ aspectRatio: '16/9' }}>
              <YouTube
                videoId={videoId}
                opts={{
                  ...opts,
                  height: '100%',
                  width: '100%',
                }}
                onReady={handleVideoReady}
                onStateChange={handleStateChange}
                className="absolute inset-0"
                iframeClassName="w-full h-full rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-6 rounded-lg">
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                No video loaded
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter a YouTube URL above or select a video from the playlist
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
} 