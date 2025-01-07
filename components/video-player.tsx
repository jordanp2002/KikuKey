"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Button } from "./ui/button";
import { Upload, Settings, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { insertVideoLog } from "@/app/actions";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { createMediaExtractor } from '@/lib/media-extractor';
import { useAnkiSettings } from '@/lib/stores/anki-settings';
import { usePlayerSettings, defaultSettings } from '@/lib/stores/player-settings';
import AnkiCardModal from './anki-card-modal';
import { PlayerSettings } from './player-settings';
import Link from "next/link";

// Cookie names for subtitle settings
const COOKIE_NAMES = {
  fontSize: 'subtitle_font_size',
  color: 'subtitle_color',
  position: 'subtitle_position',
  strokeColor: 'subtitle_stroke_color',
  strokeWidth: 'subtitle_stroke_width',
  hoverPause: 'subtitle_hover_pause',
  fontFamily: 'subtitle_font_family',
  fontWeight: 'subtitle_font_weight',
  fontStyle: 'subtitle_font_style',
  letterSpacing: 'subtitle_letter_spacing',
} as const;

// Cookie options
const COOKIE_OPTIONS = {
  expires: 365, 
  sameSite: 'strict',
} as const;

// Available font options
const FONT_OPTIONS = [
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Noto Sans JP', value: '"Noto Sans JP", sans-serif' },
  { label: 'Yu Gothic', value: '"Yu Gothic", sans-serif' },
  { label: 'Meiryo', value: 'Meiryo, sans-serif' },
  { label: 'MS Gothic', value: '"MS Gothic", monospace' },
  { label: 'Hiragino Kaku Gothic', value: '"Hiragino Kaku Gothic ProN", sans-serif' },
] as const;

// Font weight options
const FONT_WEIGHT_OPTIONS = [
  { label: 'Thin', value: '100' },
  { label: 'Extra Light', value: '200' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
] as const;

// Font style options
const FONT_STYLE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
] as const;

interface VideoSource {
  src: string;
  type: string;
}

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [customOffset, setCustomOffset] = useState<string>("");
  const [subtitles, setSubtitles] = useState<Array<{id: number, startTime: number, endTime: number, text: string}>>([]);
  const [currentSubtitleId, setCurrentSubtitleId] = useState<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingSubs, setIsDraggingSubs] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const watchTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hoverPause, setHoverPause] = useState(() => {
    return Cookies.get(COOKIE_NAMES.hoverPause) === 'true';
  });
  const [isAnkiModalOpen, setIsAnkiModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedAudio, setCapturedAudio] = useState<Blob | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');
  const ankiSettings = useAnkiSettings();
  const mediaExtractor = useMemo(
    () => createMediaExtractor(ankiSettings.getMediaExtractorConfig()),
    [ankiSettings]
  );
  const playerSettings = usePlayerSettings();

  // Initialize subtitle settings from cookies or defaults
  const [subtitleFontSize, setSubtitleFontSize] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.fontSize);
    return saved ? parseInt(saved) : 22;
  });
  const [subtitleColor, setSubtitleColor] = useState(() => {
    return Cookies.get(COOKIE_NAMES.color) || '#FFFFFF';
  });
  const [subtitlePosition, setSubtitlePosition] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.position);
    return saved ? parseInt(saved) : 80;
  });
  const [subtitleStrokeColor, setSubtitleStrokeColor] = useState(() => {
    return Cookies.get(COOKIE_NAMES.strokeColor) || '#000000';
  });
  const [subtitleStrokeWidth, setSubtitleStrokeWidth] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.strokeWidth);
    return saved ? parseInt(saved) : 2;
  });
  const [subtitleFontFamily, setSubtitleFontFamily] = useState(() => {
    return Cookies.get(COOKIE_NAMES.fontFamily) || FONT_OPTIONS[0].value;
  });
  const [subtitleFontWeight, setSubtitleFontWeight] = useState(() => {
    return Cookies.get(COOKIE_NAMES.fontWeight) || FONT_WEIGHT_OPTIONS[3].value;
  });
  const [subtitleFontStyle, setSubtitleFontStyle] = useState(() => {
    return Cookies.get(COOKIE_NAMES.fontStyle) || FONT_STYLE_OPTIONS[0].value;
  });
  const [subtitleLetterSpacing, setSubtitleLetterSpacing] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.letterSpacing);
    return saved ? parseFloat(saved) : 0;
  });

  // Update cookies when settings change
  useEffect(() => {
    Cookies.set(COOKIE_NAMES.fontSize, subtitleFontSize.toString(), COOKIE_OPTIONS);
  }, [subtitleFontSize]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.color, subtitleColor, COOKIE_OPTIONS);
  }, [subtitleColor]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.position, subtitlePosition.toString(), COOKIE_OPTIONS);
  }, [subtitlePosition]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.strokeColor, subtitleStrokeColor, COOKIE_OPTIONS);
  }, [subtitleStrokeColor]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.strokeWidth, subtitleStrokeWidth.toString(), COOKIE_OPTIONS);
  }, [subtitleStrokeWidth]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.fontFamily, subtitleFontFamily, COOKIE_OPTIONS);
  }, [subtitleFontFamily]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.fontWeight, subtitleFontWeight, COOKIE_OPTIONS);
  }, [subtitleFontWeight]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.fontStyle, subtitleFontStyle, COOKIE_OPTIONS);
  }, [subtitleFontStyle]);

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.letterSpacing, subtitleLetterSpacing.toString(), COOKIE_OPTIONS);
  }, [subtitleLetterSpacing]);

  // Add effect to save hover-pause setting
  useEffect(() => {
    Cookies.set(COOKIE_NAMES.hoverPause, hoverPause.toString(), COOKIE_OPTIONS);
  }, [hoverPause]);

  // Create subtitle styles string
  const subtitleStyles = `
.video-js .vjs-text-track-display {
  pointer-events: auto !important;
}

.video-js .vjs-text-track-cue {
  background-color: transparent !important;
  text-shadow: ${subtitleStrokeWidth}px ${subtitleStrokeWidth}px ${subtitleStrokeWidth}px ${subtitleStrokeColor} !important;
  font-size: ${subtitleFontSize}px !important;
  font-family: ${subtitleFontFamily} !important;
  font-weight: ${subtitleFontWeight} !important;
  font-style: ${subtitleFontStyle} !important;
  letter-spacing: ${subtitleLetterSpacing}em !important;
  user-select: text !important;
  pointer-events: auto !important;
  cursor: text !important;
  color: ${subtitleColor} !important;
}

.video-js .vjs-text-track-cue > * {
  background-color: transparent !important;
  user-select: text !important;
  pointer-events: auto !important;
  color: ${subtitleColor} !important;
  font-family: ${subtitleFontFamily} !important;
  font-weight: ${subtitleFontWeight} !important;
  font-style: ${subtitleFontStyle} !important;
  letter-spacing: ${subtitleLetterSpacing}em !important;
}

.video-js .vjs-text-track-cue:hover {
  opacity: 1 !important;
}

.video-js {
  border-radius: 0.75rem;
  overflow: hidden;
  height: 100% !important;
}

.video-js video {
  height: 100% !important;
  object-fit: contain !important;
}

.video-js .vjs-tech {
  height: 100% !important;
}

/* Control bar */
.video-js .vjs-control-bar {
  background: rgba(17, 24, 39, 0.9) !important;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 8px !important;
}

/* Play/Pause button */
.video-js .vjs-play-control {
  color: white !important;
  height: 32px !important;
  line-height: 32px !important;
  margin-top: -8px !important;
}

.video-js .vjs-play-control:hover {
  color: #F87171 !important;
}

/* Volume control */
.video-js .vjs-volume-panel {
  color: white !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  margin-top: -8px !important;
}

.video-js .vjs-volume-panel:hover {
  color: #F87171 !important;
}

.video-js .vjs-volume-panel .vjs-volume-control {
  width: 8em !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
}

.video-js .vjs-volume-bar.vjs-slider-horizontal {
  height: 4px !important;
  margin: 0 10px !important;
}

.video-js .vjs-slider-horizontal .vjs-volume-level {
  height: 4px !important;
  background-color: #F87171 !important;
}

/* Progress bar */
.video-js .vjs-progress-control {
  position: relative !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  flex: 1 !important;
  margin: 0 10px !important;
  margin-top: -8px !important;
}

.video-js .vjs-progress-holder {
  height: 4px !important;
  width: 100% !important;
  margin: 0 !important;
  background: rgba(255, 255, 255, 0.2) !important;
  transition: height 0.2s !important;
}

.video-js .vjs-progress-control:hover .vjs-progress-holder {
  height: 8px !important;
}

.video-js .vjs-play-progress {
  background-color: #F87171 !important;
}

.video-js .vjs-play-progress:before {
  display: none !important;
}

/* Time display */
.video-js .vjs-time-control {
  font-size: 13px !important;
  padding: 0 4px !important;
  min-width: auto !important;
  height: 32px !important;
  line-height: 32px !important;
  margin-top: -8px !important;
}

/* Playback rate */
.video-js .vjs-playback-rate {
  height: 32px !important;
  line-height: 32px !important;
  margin-top: -8px !important;
}

.video-js .vjs-playback-rate .vjs-playback-rate-value {
  font-size: 13px !important;
  line-height: 32px !important;
}

/* Fullscreen and other buttons */
.video-js .vjs-fullscreen-control,
.video-js .vjs-subs-caps-button {
  height: 32px !important;
  line-height: 32px !important;
  margin-top: -8px !important;
}

/* Menu positioning */
.video-js .vjs-menu-button-popup .vjs-menu {
  bottom: 2em !important;
}

.video-js .vjs-menu-content {
  background: rgba(17, 24, 39, 0.9) !important;
  border-radius: 0.5rem !important;
}

.video-js .vjs-menu-content .vjs-menu-item:hover {
  background: rgba(248, 113, 113, 0.2) !important;
  color: #F87171 !important;
}

.video-js .vjs-menu-content .vjs-selected {
  background: #F87171 !important;
  color: white !important;
}

/* Big play button */
.video-js .vjs-big-play-button {
  background-color: #F87171 !important;
  border: none !important;
  border-radius: 9999px !important;
  width: 80px !important;
  height: 80px !important;
  line-height: 80px !important;
  font-size: 40px !important;
}

.video-js .vjs-big-play-button:hover {
  background-color: #EF4444 !important;
}

.video-js.no-video .vjs-big-play-button {
  display: none !important;
}

.video-js.no-video .vjs-control-bar {
  display: none !important;
}
`;
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = subtitleStyles;
    document.head.appendChild(styleSheet);

    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      width: 1920,
      height: 1080,
      html5: {
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        nativeTextTracks: false,
        vhs: {
          overrideNative: true
        }
      },
      tracks: [],
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      controlBar: {
        children: [
          "playToggle",
          "volumePanel",
          "currentTimeDisplay",
          "timeDivider",
          "durationDisplay",
          "progressControl",
          "playbackRateMenuButton",
          {
            name: 'SubsCapsButton',
            kind: 'subtitles'
          },
          "fullscreenToggle",
        ],
      },
    });

    playerRef.current.addClass('no-video');

    playerRef.current.textTrackSettings.setValues({
      backgroundColor: 'transparent',
      backgroundOpacity: '0',
      edgeStyle: 'none',
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current) return;

    const handleTimeUpdate = () => {
      setCurrentTime(playerRef.current.currentTime());
    };

    const handleDurationChange = () => {
      setDuration(playerRef.current.duration());
    };

    const handlePlay = () => {
      // Start new session if no timer has ever run
      if (startTimeRef.current === null) {
        const now = Date.now();
        startTimeRef.current = now;
        setVideoStartTime(new Date(now).toLocaleTimeString());
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
          setWatchTime(elapsed);
        }, 1000);
        setIsPaused(false);
      } 
      // Resume timer if it was manually paused
      else if (isPaused) {
        handlePauseImmersion();
      }
      // If timer was temporarily paused due to video change or end, resume it
      else if (!timerRef.current && watchTimeRef.current !== undefined) {
        startTimeRef.current = Date.now() - (watchTimeRef.current * 1000);
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
          setWatchTime(elapsed);
        }, 1000);
        setIsPaused(false);
      }
    };

    const handleEnded = () => {
      // Just pause the timer if it's running
      if (!isPaused && timerRef.current) {
        watchTimeRef.current = watchTime;
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsPaused(true);
      }
    };

    // Add event listeners for video events
    playerRef.current.on('timeupdate', handleTimeUpdate);
    playerRef.current.on('durationchange', handleDurationChange);
    playerRef.current.on('ended', handleEnded);
    playerRef.current.on('play', handlePlay);

    return () => {
      if (playerRef.current) {
        playerRef.current.off('timeupdate', handleTimeUpdate);
        playerRef.current.off('durationchange', handleDurationChange);
        playerRef.current.off('ended', handleEnded);
        playerRef.current.off('play', handlePlay);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || !videoSource) return;
    
    // Store current timer state
    const wasTimerPaused = isPaused;
    const currentWatchTime = watchTime;
    
    // Reset the player source
    playerRef.current.src({
      src: videoSource.src,
      type: videoSource.type || 'video/mp4'
    });
    
    playerRef.current.load();
    playerRef.current.removeClass('no-video');

    // Store the current watch time if timer was running or paused
    if (startTimeRef.current !== null) {
      watchTimeRef.current = currentWatchTime;
      // Clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Only set isPaused if it wasn't already paused
      if (!wasTimerPaused) {
        setIsPaused(false);
      }
    }

  }, [videoSource]);

  const adjustSubtitleTiming = (offsetMs: number) => {
    const newOffset = subtitleOffset + offsetMs;
    setSubtitleOffset(newOffset);
    setCustomOffset(newOffset.toString());

    // Update video subtitles
    const track = playerRef.current.textTracks()[0];
    if (track && track.cues) {
      const wasShowing = track.mode === 'showing';
      track.mode = 'disabled';
      for (let i = 0; i < track.cues.length; i++) {
        const cue = track.cues[i];
        if (cue) {
          const originalStart = (cue as any).originalStartTime || cue.startTime;
          const originalEnd = (cue as any).originalEndTime || cue.endTime;
          if (!(cue as any).originalStartTime) {
            (cue as any).originalStartTime = originalStart;
          }
          if (!(cue as any).originalEndTime) {
            (cue as any).originalEndTime = originalEnd;
          }
          cue.startTime = originalStart + (newOffset / 1000);
          cue.endTime = originalEnd + (newOffset / 1000);
        }
      }
      if (wasShowing) {
        track.mode = 'showing';
      }
      playerRef.current.textTrackDisplay.updateDisplay();
    }
    const currentTime = playerRef.current.currentTime();
    const adjustedTime = currentTime - (newOffset / 1000);
    const currentSub = subtitles.find(
      sub => adjustedTime >= sub.startTime && adjustedTime <= sub.endTime
    );
    if (currentSub) {
      setCurrentSubtitleId(currentSub.id);
    } else {
      setCurrentSubtitleId(null);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoSource({
      src: url,
      type: file.type || 'video/mp4'
    });
  };

  const handleSubtitleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const tracks = playerRef.current.textTracks();
        if (tracks) {
          for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.cues) {
              while (track.cues.length > 0) {
                track.removeCue(track.cues[0]);
              }
            }
            track.mode = 'disabled';
          }
          for (let i = tracks.length - 1; i >= 0; i--) {
            playerRef.current.removeRemoteTextTrack(tracks[i]);
          }
        }
        const content = e.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase();
        let parsedSubs: Array<{id: number, startTime: number, endTime: number, text: string}> = [];

        if (extension === 'srt') {
          parsedSubs = parseSRT(content);
        } else if (extension === 'vtt') {
          parsedSubs = parseVTT(content);
        } else if (extension === 'ass') {
          parsedSubs = parseAssSubtitles(content);
        }

        if (!Array.isArray(parsedSubs) || parsedSubs.length === 0) {
          throw new Error('No valid subtitles found in file');
        }

        const validSubs = parsedSubs.filter(sub => 
          typeof sub.startTime === 'number' && 
          isFinite(sub.startTime) && 
          typeof sub.endTime === 'number' && 
          isFinite(sub.endTime) && 
          sub.startTime >= 0 && 
          sub.endTime > sub.startTime && 
          typeof sub.text === 'string' && 
          sub.text.trim() !== ''
        );

        if (validSubs.length === 0) {
          throw new Error('No valid subtitles found after filtering');
        }

        setSubtitles(validSubs);

        // Create a new text track
        const track = playerRef.current.addTextTrack("subtitles", "Japanese", "ja");

        // Add cues to the track
        validSubs.forEach((sub) => {
          try {
            const cue = new VTTCue(sub.startTime, sub.endTime, sub.text);
            (cue as any).originalStartTime = sub.startTime;
            (cue as any).originalEndTime = sub.endTime;
            cue.line = subtitlePosition;
            track.addCue(cue);
          } catch (error) {
            console.error('Error adding cue:', error, sub);
          }
        });

        track.mode = "showing";

        playerRef.current.textTrackDisplay.updateDisplay();

        setTimeout(() => {
          if (track.mode !== "showing") {
            track.mode = "showing";
            playerRef.current.textTrackDisplay.updateDisplay();
          }
        }, 100);

        setSubtitleOffset(0);
        setCustomOffset('');

        toast.success('Subtitles loaded successfully');
      } catch (error) {
        console.error('Error loading subtitles:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load subtitles');
      }
    };

    reader.readAsText(file);
  };

  const timeToSeconds = (timeStr: string) => {
    try {
      
      const [timestamp, fraction = '0'] = timeStr.trim().split(/[,\.]/);
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      
      if (!isFinite(hours) || !isFinite(minutes) || !isFinite(seconds) || !isFinite(Number(fraction))) {
        console.error('Invalid timestamp format (non-finite values):', timeStr);
        return 0;
      }
      
      if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60 || Number(fraction) < 0) {
        console.error('Invalid timestamp values (out of range):', timeStr);
        return 0;
      }
      
      const totalSeconds = hours * 3600 + minutes * 60 + seconds + Number(fraction) / 1000;
      
      if (!isFinite(totalSeconds)) {
        console.error('Invalid total seconds calculation:', timeStr, totalSeconds);
        return 0;
      }
      
      return totalSeconds;
    } catch (error) {
      console.error('Error parsing timestamp:', timeStr, error);
      return 0;
    }
  };

  const parseSubtitles = (content: string) => {
    try {
      if (content.includes('[Script Info]')) {
        return parseAssSubtitles(content);
      }

      const normalizedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n'); 

      const chunks = normalizedContent.split('\n\n').filter(chunk => chunk.trim());

      return chunks.map((chunk) => {
        const lines = chunk.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) return null;
        
        const timeLine = lines.find(line => line.includes('-->'));
        if (!timeLine) {
          console.error('No timestamp found in chunk:', chunk);
          return null;
        }

        const [startTime, endTime] = timeLine.split('-->').map(time => timeToSeconds(time));
        
        const textLines = lines.slice(lines.indexOf(timeLine) + 1);
        
        // Clean and join the text lines
        const text = textLines
          .join('\n')
          .replace(/♪/g, '') // Remove music note symbols
          .replace(/\{[^\}]*\}/g, '') // Remove any formatting tags
          .replace(/\([^)]*\)/g, '') // Remove parenthetical text
          .replace(/\[[^\]]*\]/g, '') // Remove bracketed text
          .replace(/[<>]/g, '') // Remove HTML-like tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        if (typeof startTime !== 'number' || typeof endTime !== 'number' || isNaN(startTime) || isNaN(endTime)) {
          console.error('Invalid time values:', { startTime, endTime });
          return null;
        }

        return { startTime, endTime, text };
      }).filter(cue => cue !== null);
    } catch (error) {
      console.error('Error parsing subtitles:', error);
      return [];
    }
  };

  const parseAssTime = (timestamp: string): number => {
    try {
      const cleanTimestamp = timestamp.trim();
      
      // ASS format: H:MM:SS.CC (hours:minutes:seconds.centiseconds)
      const [time, centiseconds = '0'] = cleanTimestamp.split('.');
      const [hours, minutes, seconds] = time.split(':').map(num => {
        const parsed = parseFloat(num);
        return isFinite(parsed) ? parsed : 0;
      });
      if (!isFinite(hours) || !isFinite(minutes) || !isFinite(seconds) || !isFinite(Number(centiseconds))) {
        console.error('Invalid ASS timestamp format (non-finite values):', timestamp);
        return 0;
      }
      if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60 || Number(centiseconds) < 0) {
        console.error('Invalid ASS timestamp values (out of range):', timestamp);
        return 0;
      }

      const totalSeconds = hours * 3600 + minutes * 60 + seconds + Number(centiseconds) / 100;

      if (!isFinite(totalSeconds)) {
        console.error('Invalid ASS total seconds calculation:', timestamp, totalSeconds);
        return 0;
      }

      return totalSeconds;
    } catch (error) {
      console.error('Error parsing ASS timestamp:', timestamp, error);
      return 0;
    }
  };

  const parseAssSubtitles = (content: string) => {
    try {
      const lines = content.split(/\r?\n/);
      let isInEvents = false;
      let formatLine: string[] = [];
      const subtitles: Array<{id: number, startTime: number, endTime: number, text: string}> = [];
      let index = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line || line.startsWith(';')) continue;

        // Look for [Events] section
        if (line === '[Events]') {
          isInEvents = true;
          continue;
        }

        if (isInEvents) {
          if (line.startsWith('Format:')) {
            // Parse format line
            formatLine = line
              .substring(7)
              .split(',')
              .map(field => field.trim());
            continue;
          }

          if (line.startsWith('Dialogue:')) {
            try {
              // Get the text after 'Dialogue:'
              const dialogueContent = line.substring(9).trim();
              
              const parts: string[] = [];
              let currentPart = '';
              let inBraces = false;
              
              for (let char of dialogueContent) {
                if (char === '{') inBraces = true;
                else if (char === '}') inBraces = false;
                else if (char === ',' && !inBraces && parts.length < formatLine.length - 1) {
                  parts.push(currentPart.trim());
                  currentPart = '';
                  continue;
                }
                currentPart += char;
              }

              if (currentPart) {
                parts.push(currentPart.trim());
              }


              const fields = Object.fromEntries(
                formatLine.map((field, index) => [field.toLowerCase(), parts[index] || ''])
              );


              const startTime = parseAssTime(fields.start || fields['start time'] || '0:00:00.00');
              const endTime = parseAssTime(fields.end || fields['end time'] || '0:00:00.00');

              let text = fields.text || '';
              text = text
                .replace(/\{[^\}]*\}/g, '') // Remove style codes
                .replace(/\\N/g, ' ') // Convert ASS line breaks to spaces
                .replace(/\\n/g, ' ') // Convert alternate line breaks
                .replace(/\\h/g, ' ') // Convert hard spaces
                .replace(/[｟｠]/g, '') // Remove Japanese quotation marks
                .replace(/[（）]/g, '') // Remove Japanese parentheses
                .replace(/[\\][a-zA-Z0-9&H]*[\\]?/g, '') // Remove ASS tags
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();

              if (startTime >= 0 && endTime > startTime && text) {
                subtitles.push({ id: index++, startTime, endTime, text });
              }
            } catch (error) {
              console.error('Error parsing dialogue line:', line, error);
              continue;
            }
          }
        }
      }

      // Sort subtitles by start time and return
      return subtitles.sort((a, b) => a.startTime - b.startTime);
    } catch (error) {
      console.error('Error parsing ASS subtitles:', error);
      return [];
    }
  };

  const handleCustomOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomOffset(e.target.value);
  };

  const handleCustomOffsetApply = () => {
    const offsetMs = parseInt(customOffset);
    if (!isNaN(offsetMs)) {
      adjustSubtitleTiming(offsetMs - subtitleOffset);
    }
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
      const currentTime = playerRef.current.currentTime();
      const adjustedCurrentTime = currentTime - (subtitleOffset / 1000);
      const currentSub = subtitles.find(
        sub => adjustedCurrentTime >= sub.startTime && adjustedCurrentTime <= sub.endTime
      );
      
      if (currentSub) {
        setCurrentSubtitleId(currentSub.id);
        const element = document.getElementById(`subtitle-${currentSub.id}`);
        if (element && transcriptRef.current) {
          const container = transcriptRef.current;
          const elementTop = element.offsetTop;
          const containerScrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const elementHeight = element.clientHeight;

          if (elementTop < containerScrollTop || elementTop > containerScrollTop + containerHeight - elementHeight) {
            container.scrollTo({
              top: elementTop - containerHeight / 2 + elementHeight / 2,
              behavior: 'smooth'
            });
          }
        }
      } else {
        setCurrentSubtitleId(null);
      }
    };

    playerRef.current.on('timeupdate', handleTimeUpdate);

    return () => {
      if (playerRef.current) {
        playerRef.current.off('timeupdate', handleTimeUpdate);
      }
    };
  }, [subtitles, subtitleOffset]);

  useEffect(() => {
    const transcriptElement = transcriptRef.current;
    if (!transcriptElement) return;

    const handleWheel = (e: WheelEvent) => {
      const container = transcriptElement;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const height = container.clientHeight;
      const delta = e.deltaY;

      // Check if scroll is at boundaries
      if ((scrollTop <= 0 && delta < 0) || (scrollTop + height >= scrollHeight && delta > 0)) {
        return; 
      }

      e.stopPropagation();
      e.preventDefault();
      
      container.scrollTop += delta;
    };

    transcriptElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      transcriptElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  function getAdjustedTime(time: number): number {
    return time + (subtitleOffset / 1000);
  }

  const handleDrag = (e: React.DragEvent, isDragging: boolean, setIsDragging: (value: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(isDragging);
    }
  };

  const handleDrop = async (e: React.DragEvent, type: 'video' | 'subtitle') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
    setIsDraggingSubs(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    if (type === 'video') {
      if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mkv')) {
        const event = { target: { files: [file] } } as any;
        handleVideoUpload(event);
      } else {
        alert('Please upload a valid video file');
      }
    } else {
      if (file.name.toLowerCase().endsWith('.srt') || 
          file.name.toLowerCase().endsWith('.vtt') || 
          file.name.toLowerCase().endsWith('.ass')) {
        const event = { target: { files: [file] } } as any;
        handleSubtitleUpload(event);
      } else {
        alert('Please upload a valid subtitle file (.srt, .vtt, or .ass)');
      }
    }
  };

  // Add pause/resume functions
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
        playerRef.current.pause();
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
        playerRef.current.play();
      }
    }
  };

  // Add manual submit function
  const handleManualSubmit = async () => {
    if (startTimeRef.current !== null) {
      await saveImmersionTime();
      // Reset all timers and states
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      setWatchTime(0);
      setVideoStartTime(null);
      setIsPaused(false);

      // Pause the video
      if (playerRef.current) {
        playerRef.current.pause();
      }
    }
  };

  // Add functions for subtitle navigation
  const findNextSubtitle = (currentTime: number) => {
    const adjustedCurrentTime = currentTime - (subtitleOffset / 1000);
    return subtitles.find(sub => sub.startTime > adjustedCurrentTime);
  };

  const findPreviousSubtitle = (currentTime: number) => {
    const adjustedCurrentTime = currentTime - (subtitleOffset / 1000);
    const currentSub = subtitles.find(
      sub => 
        sub.startTime <= adjustedCurrentTime && 
        sub.endTime >= adjustedCurrentTime
    );
    if (currentSub) {
      return [...subtitles].reverse().find(
        sub => sub.startTime < currentSub.startTime
      );
    }

    return [...subtitles].reverse().find(
      sub => sub.startTime < adjustedCurrentTime
    );
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current || subtitles.length === 0) return;

      const currentTime = playerRef.current.currentTime();
      const keyBindings = playerSettings?.settings?.keyBindings ?? defaultSettings.keyBindings;

      switch (e.key) {
        case keyBindings.seekNextSubtitle:
          e.preventDefault();
          const nextSub = findNextSubtitle(currentTime);
          if (nextSub) {
            playerRef.current.currentTime(getAdjustedTime(nextSub.startTime));
          }
          break;
        case keyBindings.seekPreviousSubtitle:
          e.preventDefault();
          const prevSub = findPreviousSubtitle(currentTime);
          if (prevSub) {
            playerRef.current.currentTime(getAdjustedTime(prevSub.startTime));
          }
          break;
        case keyBindings.mineSentence:
          e.preventDefault();
          handleMineSentence();
          break;
        case keyBindings.adjustSubtitleOffsetForward:
          e.preventDefault();
          adjustSubtitleTiming(100);
          break;
        case keyBindings.adjustSubtitleOffsetBackward:
          e.preventDefault();
          adjustSubtitleTiming(-100);
          break;
        case keyBindings.resetSubtitleOffset:
          e.preventDefault();
          setSubtitleOffset(0);
          const track = playerRef.current.textTracks()[0];
          if (track && track.cues) {
            for (let i = 0; i < track.cues.length; i++) {
              const cue = track.cues[i];
              cue.startTime = (cue as any).originalStartTime;
              cue.endTime = (cue as any).originalEndTime;
            }
          }
          break;
        case ' ': // Space bar
          e.preventDefault();
          e.stopPropagation(); 
          if (playerRef.current.paused()) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }
          break;
        case keyBindings.toggleAutoPause:
          e.preventDefault();
          const newEnabled = !playerSettings?.settings?.autoPause?.enabled;
          playerSettings.setAutoPause({ 
            enabled: newEnabled,
            pauseAt: playerSettings?.settings?.autoPause?.pauseAt ?? 'start'
          });
          toast.success(
            newEnabled ? 'Auto-pause enabled' : 'Auto-pause disabled'
          );
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); 
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [subtitles, subtitleOffset, playerSettings?.settings?.keyBindings]);

  useEffect(() => {
    if (!playerRef.current || !playerSettings?.settings?.autoPause?.enabled) return;

    let lastPausedTime = -1;

    const handleTimeUpdate = () => {
      if (!playerRef.current || playerRef.current.paused()) return;

      const currentTime = playerRef.current.currentTime();
      const { pauseAt = 'start' } = playerSettings?.settings?.autoPause ?? {};
      if (Math.abs(currentTime - lastPausedTime) < 0.2) {
        return;
      }

      if (pauseAt === 'start') {
        const upcomingSub = subtitles.find(sub => {
          const adjustedStartTime = getAdjustedTime(sub.startTime);
          return currentTime >= adjustedStartTime - 0.1 && currentTime <= adjustedStartTime + 0.1;
        });

        if (upcomingSub) {
          playerRef.current.pause();
          playerRef.current.currentTime(getAdjustedTime(upcomingSub.startTime));
          lastPausedTime = currentTime;
        }
      } else {
        const endingSub = subtitles.find(sub => {
          const adjustedEndTime = getAdjustedTime(sub.endTime);
          return currentTime >= adjustedEndTime - 0.1 && currentTime <= adjustedEndTime + 0.1;
        });

        if (endingSub) {
          playerRef.current.pause();
          playerRef.current.currentTime(getAdjustedTime(endingSub.endTime));
          lastPausedTime = currentTime;
        }
      }
    };
    const checkInterval = setInterval(handleTimeUpdate, 50); 
    playerRef.current.on('timeupdate', handleTimeUpdate);

    return () => {
      clearInterval(checkInterval);
      if (playerRef.current) {
        playerRef.current.off('timeupdate', handleTimeUpdate);
      }
    };
  }, [subtitles, playerSettings?.settings?.autoPause, subtitleOffset]);
  useEffect(() => {
    if (!playerRef.current) return;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = subtitleStyles;
    document.head.appendChild(styleSheet);
    const track = playerRef.current.textTracks()[0];
    if (track && track.cues) {
      for (let i = 0; i < track.cues.length; i++) {
        track.cues[i].line = subtitlePosition;
      }
    }

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [subtitleFontSize, subtitleColor, subtitlePosition, subtitleStrokeColor, subtitleStrokeWidth, subtitleStyles]);

  useEffect(() => {
    if (!playerRef.current) return;

    const handleSubtitleHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('vjs-text-track-cue') || target.parentElement?.classList.contains('vjs-text-track-cue')) {
        if (hoverPause && !playerRef.current.paused()) {
          playerRef.current.pause();
        }
      }
    };

    const handleSubtitleLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('vjs-text-track-cue') || target.parentElement?.classList.contains('vjs-text-track-cue')) {
        if (hoverPause && playerRef.current.paused()) {
          playerRef.current.play();
        }
      }
    };

    const textTrackDisplay = playerRef.current.el().querySelector('.vjs-text-track-display');
    if (textTrackDisplay) {
      textTrackDisplay.addEventListener('mouseenter', handleSubtitleHover, true);
      textTrackDisplay.addEventListener('mouseleave', handleSubtitleLeave, true);
    }

    return () => {
      if (textTrackDisplay) {
        textTrackDisplay.removeEventListener('mouseenter', handleSubtitleHover, true);
        textTrackDisplay.removeEventListener('mouseleave', handleSubtitleLeave, true);
      }
    };
  }, [hoverPause]);

  const handleSubtitleClick = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  };

  const [wasPlayingBeforeModal, setWasPlayingBeforeModal] = useState(false);

  const handleMineSentence = async () => {
    if (!playerRef.current || !videoRef.current) {
      toast.error('No video loaded');
      return;
    }

    try {
      const wasPlaying = !playerRef.current.paused();
      setWasPlayingBeforeModal(wasPlaying);
      
      playerRef.current.pause();

      // Get the current time directly from the player
      const currentPlayerTime = playerRef.current.currentTime();

      // Get the current subtitle
      const currentSub = subtitles.find(
        sub => 
          currentPlayerTime >= getAdjustedTime(sub.startTime) && 
          currentPlayerTime <= getAdjustedTime(sub.endTime)
      );

      if (!currentSub) {
        toast.error('No subtitle at current timestamp');
        if (wasPlaying) {
          playerRef.current.play().catch((error: unknown) => {
            console.error('Error resuming video:', error);
          });
        }
        return;
      }

      // Capture screenshot
      const imageData = await mediaExtractor.captureVideoFrame(videoRef.current);

      // Extract audio
      const audioBlob = await mediaExtractor.extractAudioClip(
        videoRef.current,
        currentSub.startTime,
        currentSub.endTime
      );
      setCapturedImage(imageData);
      setCapturedAudio(audioBlob);
      setSelectedSubtitle(currentSub.text);
      setIsAnkiModalOpen(true);
    } catch (error) {
      console.error('Failed to mine sentence:', error);
      toast.error('Failed to capture media');
      if (playerRef.current && wasPlayingBeforeModal) {
        playerRef.current.play().catch((error: unknown) => {
          console.error('Error resuming video:', error);
        });
      }
    }
  };

  const handleAnkiModalClose = () => {
    setIsAnkiModalOpen(false);
    setCapturedImage(null);
    setCapturedAudio(null);
    setSelectedSubtitle('');
    
    // Resume video playback if it was playing before
    if (playerRef.current && wasPlayingBeforeModal) {
      playerRef.current.play().catch((error: unknown) => {
        console.error('Failed to resume video:', error);
      });
    }
    setWasPlayingBeforeModal(false);
  };

  // Subtitle parsing functions
  const parseSRT = (content: string) => {
    const subs: Array<{id: number, startTime: number, endTime: number, text: string}> = [];
    const blocks = content.trim().split(/\n\s*\n/);
    
    blocks.forEach((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 3) return;
      
      const times = lines[1].split(' --> ');
      if (times.length !== 2) return;
      
      const startTime = timeStringToSeconds(times[0]);
      const endTime = timeStringToSeconds(times[1]);
      const text = lines.slice(2).join('\n');
      
      subs.push({ id: index, startTime, endTime, text });
    });
    
    return subs;
  };

  const parseVTT = (content: string) => {
    const cleanContent = content.replace(/^WEBVTT\n\n/i, '');
    return parseSRT(cleanContent); 
  };

  const timeStringToSeconds = (timeStr: string): number => {
    const [time, ms] = timeStr.trim().split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  };

  return (
    <div className="grid grid-rows-[auto_1fr] gap-6 h-full">
      <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('video-upload')?.click()}
              className="hover:bg-[#F87171] hover:text-white transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Video
            </Button>
            <input
              id="video-upload"
              type="file"
              accept="video/*,.mkv"
              className="hidden"
              onChange={handleVideoUpload}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('subtitle-upload')?.click()}
              className="hover:bg-[#F87171] hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                <line x1="9" y1="9" x2="19" y2="9"></line>
                <line x1="9" y1="15" x2="19" y2="15"></line>
                <line x1="5" y1="9" x2="5" y2="9"></line>
                <line x1="5" y1="15" x2="5" y2="15"></line>
              </svg>
              Subtitles
            </Button>
            <input
              id="subtitle-upload"
              type="file"
              accept=".srt,.vtt,.ass"
              className="hidden"
              onChange={handleSubtitleUpload}
            />
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMineSentence}
            disabled={!videoSource || subtitles.length === 0}
            className="hover:bg-[#F87171] hover:text-white transition-colors"
          >
            <Brain className="w-4 h-4 mr-2" />
            Mine Sentence
          </Button>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

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

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Offset:</span>
            <input
              type="number"
              value={customOffset}
              onChange={handleCustomOffsetChange}
              placeholder="ms"
              className="w-16 bg-transparent text-sm focus:outline-none focus:ring-0 text-right"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomOffsetApply();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCustomOffsetApply}
              className="px-2 hover:bg-[#F87171] hover:text-white transition-colors"
            >
              Apply
            </Button>
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-3">
            <PlayerSettings />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-[#F87171] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    <line x1="9" y1="9" x2="19" y2="9"></line>
                    <line x1="9" y1="15" x2="19" y2="15"></line>
                    <line x1="5" y1="9" x2="5" y2="9"></line>
                    <line x1="5" y1="15" x2="5" y2="15"></line>
                  </svg>
                  Subtitle Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-72 max-h-[80vh] overflow-y-auto" 
                align="end" 
                side="left"
                sideOffset={8}
              >
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      <line x1="9" y1="9" x2="19" y2="9"></line>
                      <line x1="9" y1="15" x2="19" y2="15"></line>
                      <line x1="5" y1="9" x2="5" y2="9"></line>
                      <line x1="5" y1="15" x2="5" y2="15"></line>
                    </svg>
                    Subtitle Settings
                  </DropdownMenuLabel>
                </div>

                {/* Auto-Pause Settings */}
                <div className="p-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Auto-Pause</Label>
                    <div 
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                        playerSettings?.settings?.autoPause?.enabled ? 'bg-[#F87171]' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      onClick={() => playerSettings.setAutoPause({ 
                        enabled: !playerSettings?.settings?.autoPause?.enabled 
                      })}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          playerSettings?.settings?.autoPause?.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {playerSettings?.settings?.autoPause?.enabled && (
                    <div>
                      <Label className="text-sm font-medium block mb-1">Pause At</Label>
                      <select
                        value={playerSettings?.settings?.autoPause?.pauseAt ?? 'start'}
                        onChange={(e) => playerSettings.setAutoPause({ 
                          pauseAt: e.target.value as 'start' | 'end' 
                        })}
                        className="w-full px-2 py-1 text-sm border rounded-md bg-transparent hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                      >
                        <option value="start">Start of Subtitle</option>
                        <option value="end">End of Subtitle</option>
                      </select>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Font Settings Group */}
                <div className="p-2 space-y-3">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Font Settings</Label>
                  
                  {/* Font Family */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Font Family</Label>
                    <select
                      value={subtitleFontFamily}
                      onChange={(e) => setSubtitleFontFamily(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-transparent hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Font Weight</Label>
                    <select
                      value={subtitleFontWeight}
                      onChange={(e) => setSubtitleFontWeight(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-transparent hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                    >
                      {FONT_WEIGHT_OPTIONS.map((weight) => (
                        <option key={weight.value} value={weight.value}>
                          {weight.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Style */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Font Style</Label>
                    <select
                      value={subtitleFontStyle}
                      onChange={(e) => setSubtitleFontStyle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-transparent hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                    >
                      {FONT_STYLE_OPTIONS.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Letter Spacing: {subtitleLetterSpacing}em</Label>
                    <Slider
                      value={[subtitleLetterSpacing]}
                      onValueChange={(values: number[]) => setSubtitleLetterSpacing(values[0])}
                      min={-0.5}
                      max={1}
                      step={0.1}
                      className="my-1"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />
                <div className="p-2 space-y-3">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Appearance</Label>

                  {/* Font Size */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Font Size: {subtitleFontSize}px</Label>
                    <Slider
                      value={[subtitleFontSize]}
                      onValueChange={(values: number[]) => setSubtitleFontSize(values[0])}
                      min={12}
                      max={48}
                      step={1}
                      className="my-1"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <Label className="text-sm font-medium block mb-1">Position: {subtitlePosition}%</Label>
                    <Slider
                      value={[subtitlePosition]}
                      onValueChange={(values: number[]) => {
                        setSubtitlePosition(values[0]);
                        if (playerRef.current) {
                          const track = playerRef.current.textTracks()[0];
                          if (track && track.cues) {
                            for (let i = 0; i < track.cues.length; i++) {
                              track.cues[i].line = values[0];
                            }
                          }
                        }
                      }}
                      min={0}
                      max={100}
                      step={1}
                      className="my-1"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium block mb-1">Text Color</Label>
                      <input
                        type="color"
                        value={subtitleColor}
                        onChange={(e) => setSubtitleColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium block mb-1">Outline Color</Label>
                      <input
                        type="color"
                        value={subtitleStrokeColor}
                        onChange={(e) => setSubtitleStrokeColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium block mb-1">Outline Width: {subtitleStrokeWidth}px</Label>
                    <Slider
                      value={[subtitleStrokeWidth]}
                      onValueChange={(values: number[]) => setSubtitleStrokeWidth(values[0])}
                      min={0}
                      max={4}
                      step={0.5}
                      className="my-1"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />
                <div className="p-2">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Behavior</Label>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Label className="text-sm font-medium">Pause on Hover</Label>
                    <div 
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                        hoverPause ? 'bg-[#F87171]' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      onClick={() => {
                        setHoverPause(!hoverPause);
                        Cookies.set(COOKIE_NAMES.hoverPause, (!hoverPause).toString(), COOKIE_OPTIONS);
                      }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          hoverPause ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Video and transcript container */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6 flex-1 min-h-0">
        {/* Video player container */}
        <div className="w-full h-full">
          <div 
            className="relative w-full h-full rounded-lg overflow-hidden shadow-lg group"
            onDragEnter={(e) => handleDrag(e, true, setIsDraggingVideo)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDrag(e, true, setIsDraggingVideo);
            }}
            onDragLeave={(e) => handleDrag(e, false, setIsDraggingVideo)}
            onDrop={(e) => handleDrop(e, 'video')}
            data-vjs-player
          >
            <video
              ref={videoRef}
              className="video-js vjs-big-play-centered w-full h-full"
              playsInline
            >
              <p className="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a
                web browser that supports HTML5 video
              </p>
            </video>
            {/* Drag overlay */}
            {isDraggingVideo && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">Drop video here</p>
                </div>
              </div>
            )}
            {/* Empty state overlay - only show when no video is loaded */}
            {!videoSource && !isDraggingVideo && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="text-center p-6 rounded-lg">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    No video loaded
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop a video file here or use the upload button above
                  </p>
                </div>
              </div>
            )}
            {/* Hover overlay - only show when no video is loaded */}
            {!videoSource && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-white text-center">
                  <Upload className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-sm">Drag and drop video here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="w-full h-[300px] lg:h-full bg-white dark:bg-gray-900 rounded-[30px] shadow-lg relative group overflow-hidden">
          <div 
            className="absolute inset-0 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:transparent hover:[&::-webkit-scrollbar-thumb]:bg-black/10"
            onDragEnter={(e) => handleDrag(e, true, setIsDraggingSubs)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDrag(e, true, setIsDraggingSubs);
            }}
            onDragLeave={(e) => handleDrag(e, false, setIsDraggingSubs)}
            onDrop={(e) => handleDrop(e, 'subtitle')}
            ref={transcriptRef}
          >
            {isDraggingSubs && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-white text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">Drop subtitles here</p>
                </div>
              </div>
            )}
            {/* Hover overlay - only show when no subtitles are loaded */}
            {subtitles.length === 0 && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-white text-center">
                  <Upload className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-sm">Drag and drop subtitles here</p>
                </div>
              </div>
            )}
            {/* Empty state message when no subtitles */}
            {subtitles.length === 0 && !isDraggingSubs && (
              <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No subtitles loaded</p>
                <p className="text-sm">Upload or drag a subtitle file here</p>
              </div>
            )}
            {subtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                id={`subtitle-${subtitle.id}`}
                className={`py-2 px-3 rounded-md transition-all hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                  currentSubtitleId === subtitle.id
                    ? 'bg-red-50 dark:bg-red-900/30 border-l-4 border-[#F87171]'
                    : ''
                }`}
                onClick={() => handleSubtitleClick(getAdjustedTime(subtitle.startTime))}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {`${formatTime(getAdjustedTime(subtitle.startTime))} → ${formatTime(getAdjustedTime(subtitle.endTime))}`}
                </div>
                <div className="text-sm hover:text-[#F87171] transition-colors">
                  {subtitle.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add the Anki modal */}
      {isAnkiModalOpen && capturedImage && capturedAudio && (
        <AnkiCardModal
          isOpen={isAnkiModalOpen}
          onClose={handleAnkiModalClose}
          subtitle={selectedSubtitle}
          imageData={capturedImage}
          audioBlob={capturedAudio}
          currentTime={playerRef.current?.currentTime() || 0}
        />
      )}
    </div>
  );

  function formatTime(seconds: number): string {
    const pad = (num: number): string => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${ms.toString().padStart(3, '0')}`;
  }

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