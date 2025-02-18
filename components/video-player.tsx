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
import AnkiSettingsModal from './anki-settings-modal';

 
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

 
const COOKIE_OPTIONS = {
  expires: 365, 
  sameSite: 'strict',
} as const;

 
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

const FONT_STYLE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
] as const;

interface VideoSource {
  src: string;
  type: string;
}
const getSupportedCodecs = () => {
  if (typeof window === 'undefined') {
    return { video: [], audio: [] };
  }

  const codecs = {
    video: [] as string[],
    audio: [] as string[]
  };

  const videoTypes = [
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="avc1.4D401E"', 
    'video/mp4; codecs="avc1.64001E"', 
    'video/mp4; codecs="vp8"',
    'video/mp4; codecs="vp9"',
    'video/mp4; codecs="av01"',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/mp4; codecs="hevc"',
  ];

  const audioTypes = [
    'audio/mp4; codecs="mp4a.40.2"', 
    'audio/mpeg',
    'audio/webm; codecs="opus"',
    'audio/webm; codecs="vorbis"',
    'audio/wav; codecs="1"',
    'audio/flac',
  ];

  const testCodec = (type: string) => {
    const video = document.createElement('video');
    return video.canPlayType(type) !== '';
  };

  videoTypes.forEach(codec => {
    if (testCodec(codec)) {
      codecs.video.push(codec);
    }
  });

  audioTypes.forEach(codec => {
    if (testCodec(codec)) {
      codecs.audio.push(codec);
    }
  });

  return codecs;
};

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
  const [supportedCodecs] = useState(getSupportedCodecs());

  const [subtitleFontSize, setSubtitleFontSize] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.fontSize);
    return saved ? parseInt(saved) : 22;
  });
  const [subtitleColor, setSubtitleColor] = useState(() => {
    return Cookies.get(COOKIE_NAMES.color) || '#FFFFFF';
  });
  const [subtitlePosition, setSubtitlePosition] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.position);
    return saved ? parseInt(saved) : 500; 
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
    const saved = Cookies.get(COOKIE_NAMES.fontWeight);
    return saved || '400';
  });
  const [subtitleFontStyle, setSubtitleFontStyle] = useState(() => {
    return Cookies.get(COOKIE_NAMES.fontStyle) || FONT_STYLE_OPTIONS[0].value;
  });
  const [subtitleLetterSpacing, setSubtitleLetterSpacing] = useState(() => {
    const saved = Cookies.get(COOKIE_NAMES.letterSpacing);
    return saved ? parseFloat(saved) : 0;
  });

  const [isAnkiSettingsOpen, setIsAnkiSettingsOpen] = useState(false);
  const [isFullscreenTranscriptVisible, setIsFullscreenTranscriptVisible] = useState(false);
  const fullscreenTranscriptRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    Cookies.set(COOKIE_NAMES.hoverPause, hoverPause.toString(), COOKIE_OPTIONS);
  }, [hoverPause]);

  const subtitleStyles = `
.video-js .vjs-text-track-display {
  pointer-events: auto !important;
}

.video-js .vjs-text-track-cue {
  background-color: transparent !important;
  font-size: ${subtitleFontSize}px !important;
  font-family: ${subtitleFontFamily} !important;
  font-weight: ${subtitleFontWeight} !important;
  font-style: ${subtitleFontStyle} !important;
  letter-spacing: ${subtitleLetterSpacing}em !important;
  user-select: text !important;
  pointer-events: auto !important;
  cursor: text !important;
  color: ${subtitleColor} !important;
  -webkit-text-stroke: ${subtitleStrokeWidth}px ${subtitleStrokeColor} !important;
  text-stroke: ${subtitleStrokeWidth}px ${subtitleStrokeColor} !important;
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
  font-size: ${subtitleFontSize}px !important;
  -webkit-text-stroke: ${subtitleStrokeWidth}px ${subtitleStrokeColor} !important;
  text-stroke: ${subtitleStrokeWidth}px ${subtitleStrokeColor} !important;
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
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 16px !important;
  backdrop-filter: blur(8px) !important;
}

/* Play/Pause button */
.video-js .vjs-play-control {
  color: white !important;
  height: 32px !important;
  width: 32px !important;
  margin-right: 8px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.video-js .vjs-play-control:hover {
  color: white !important;
  background-color: rgba(248, 113, 113, 0.9) !important;
}

/* Volume control */
.video-js .vjs-volume-panel {
  color: white !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  margin-right: 8px !important;
}

.video-js .vjs-volume-panel:hover {
  color: white !important;
}

.video-js .vjs-volume-panel:hover .vjs-volume-control {
  background-color: rgba(248, 113, 113, 0.1) !important;
}

.video-js .vjs-volume-panel .vjs-volume-control {
  width: 8em !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
  padding: 0 8px !important;
}

.video-js .vjs-volume-bar.vjs-slider-horizontal {
  height: 4px !important;
  margin: 0 !important;
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-radius: 2px !important;
}

.video-js .vjs-slider-horizontal .vjs-volume-level {
  height: 4px !important;
  background-color: #F87171 !important;
  border-radius: 2px !important;
}

.video-js .vjs-volume-level:before {
  color: #F87171 !important;
  font-size: 1em !important;
}

/* Progress bar */
.video-js .vjs-progress-control {
  position: relative !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  flex: 1 !important;
  margin: 0 16px !important;
  cursor: pointer !important;
}

.video-js .vjs-progress-holder {
  height: 4px !important;
  width: 100% !important;
  margin: 0 !important;
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 2px !important;
  transition: all 0.2s !important;
}

.video-js .vjs-progress-control:hover .vjs-progress-holder {
  height: 6px !important;
}

.video-js .vjs-play-progress {
  background-color: #F87171 !important;
  border-radius: 2px !important;
  transition: all 0.2s !important;
}

.video-js .vjs-play-progress:before {
  content: '' !important;
  width: 12px !important;
  height: 12px !important;
  border-radius: 50% !important;
  background-color: #F87171 !important;
  position: absolute !important;
  right: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) scale(0) !important;
  transition: transform 0.2s !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

.video-js .vjs-progress-control:hover .vjs-play-progress:before {
  transform: translateY(-50%) scale(1) !important;
}

.video-js .vjs-load-progress {
  background: rgba(255, 255, 255, 0.3) !important;
  border-radius: 2px !important;
}

.video-js .vjs-load-progress div {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Time display */
.video-js .vjs-time-control {
  font-size: 13px !important;
  padding: 0 4px !important;
  min-width: auto !important;
  height: 32px !important;
  line-height: 32px !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500 !important;
}

.video-js .vjs-current-time {
  margin-right: 0 !important;
  padding-right: 0 !important;
}

.video-js .vjs-duration {
  margin-left: 0 !important;
  padding-left: 0 !important;
}

.video-js .vjs-time-divider {
  color: rgba(255, 255, 255, 0.6) !important;
  padding: 0 4px !important;
}

/* Playback rate */
.video-js .vjs-playback-rate {
  height: 32px !important;
  width: 32px !important;
  margin-left: 8px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.video-js .vjs-playback-rate:hover {
  background-color: rgba(248, 113, 113, 0.9) !important;
}

.video-js .vjs-playback-rate .vjs-playback-rate-value {
  font-size: 13px !important;
  line-height: 32px !important;
  font-weight: 500 !important;
}

/* Fullscreen and other buttons */
.video-js .vjs-fullscreen-control,
.video-js .vjs-subs-caps-button {
  height: 32px !important;
  width: 32px !important;
  margin-left: 8px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.video-js .vjs-fullscreen-control:hover,
.video-js .vjs-subs-caps-button:hover {
  background-color: rgba(248, 113, 113, 0.9) !important;
}

/* Menu positioning */
.video-js .vjs-menu-button-popup .vjs-menu {
  bottom: 40px !important;
}

.video-js .vjs-menu-content {
  background: rgba(17, 24, 39, 0.95) !important;
  border-radius: 8px !important;
  padding: 4px !important;
  backdrop-filter: blur(8px) !important;
}

.video-js .vjs-menu-content .vjs-menu-item {
  border-radius: 4px !important;
  transition: all 0.2s !important;
  margin: 2px 0 !important;
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
  background-color: rgba(248, 113, 113, 0.9) !important;
  border: none !important;
  border-radius: 50% !important;
  width: 80px !important;
  height: 80px !important;
  line-height: 80px !important;
  font-size: 40px !important;
  transition: all 0.2s !important;
  backdrop-filter: blur(8px) !important;
}

.video-js .vjs-big-play-button:hover {
  background-color: #F87171 !important;
  transform: scale(1.05) !important;
}

.video-js.no-video .vjs-big-play-button {
  display: none !important;
}

.video-js.no-video .vjs-control-bar {
  display: none !important;
}

/* Time tooltip */
.video-js .vjs-time-tooltip {
  background-color: rgba(17, 24, 39, 0.95) !important;
  border-radius: 4px !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
  backdrop-filter: blur(8px) !important;
}

/* Mouse display */
.video-js .vjs-mouse-display {
  background-color: rgba(17, 24, 39, 0.95) !important;
  border-radius: 4px !important;
  backdrop-filter: blur(8px) !important;
}

/* Fullscreen transcript panel */
.fullscreen-transcript {
  display: none;  /* Hide by default */
}

.video-js.vjs-fullscreen .fullscreen-transcript {
  display: block;  /* Only show in fullscreen */
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 25%;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  transform: translateX(100%);
  z-index: 2;
}

.video-js.vjs-fullscreen .fullscreen-transcript.visible {
  transform: translateX(0);
}

/* Adjust transcript padding when control bar is visible */
.video-js.vjs-fullscreen.vjs-user-active .fullscreen-transcript-content {
  padding-bottom: 48px;
}

/* Adjust video container when transcript is visible */
.video-js.vjs-fullscreen.transcript-visible {
  display: flex !important;
  flex-direction: row !important;
}

.video-js.vjs-fullscreen.transcript-visible .vjs-tech {
  width: 75% !important;
  height: 100% !important;
  max-width: 75% !important;
}

.video-js.vjs-fullscreen.transcript-visible .vjs-text-track-display {
  width: 75% !important;
}

.video-js.vjs-fullscreen .fullscreen-transcript-content {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  color: white;
  transition: padding-bottom 0.3s ease;
}

.video-js.vjs-fullscreen .fullscreen-transcript-content::-webkit-scrollbar {
  width: 4px;
}

.video-js.vjs-fullscreen .fullscreen-transcript-content::-webkit-scrollbar-track {
  background: transparent;
}

.video-js.vjs-fullscreen .fullscreen-transcript-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.video-js.vjs-fullscreen .fullscreen-transcript-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Transcript toggle button */
.vjs-transcript-control {
  cursor: pointer;
  display: none;
}

.video-js.vjs-fullscreen .vjs-transcript-control {
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-js.vjs-fullscreen .vjs-transcript-control:hover {
  text-shadow: 0 0 1em #fff;
}

/* Control bar adjustments for fullscreen with transcript */
.video-js.vjs-fullscreen.transcript-visible .vjs-control-bar {
  width: 75% !important;
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
          overrideNative: true,
          cacheEncryptionKeys: true
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
          {
            name: 'Button',
            text: 'T',
            className: 'vjs-transcript-control',
            onclick: () => {
              setIsFullscreenTranscriptVisible(!isFullscreenTranscriptVisible);
              const player = playerRef.current;
              if (player) {
                player.el().classList.toggle('transcript-visible');
              }
            }
          },
          "fullscreenToggle",
        ],
      },
    });

    if (supportedCodecs.video.length > 0) {
      playerRef.current.options_.techOrder = ['html5'];
      playerRef.current.options_.sourceTypes = supportedCodecs.video;
    }

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
  }, [supportedCodecs]);

  
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
        
        
        const fullscreenElement = document.getElementById(`subtitle-fullscreen-${currentSub.id}`);
        if (fullscreenElement && fullscreenTranscriptRef.current) {
          const container = fullscreenTranscriptRef.current;
          const elementTop = fullscreenElement.offsetTop;
          const containerScrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const elementHeight = fullscreenElement.clientHeight;

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
    if (!playerRef.current) return;

    const handleTimeUpdate = () => {
      setCurrentTime(playerRef.current.currentTime());
    };

    const handleDurationChange = () => {
      setDuration(playerRef.current.duration());
    };

    const handlePlay = () => {
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
    };

    const handleEnded = () => {
      
      if (!isPaused && timerRef.current) {
        watchTimeRef.current = watchTime;
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsPaused(true);
      }
    };

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
    
    const wasTimerPaused = isPaused;
    const currentWatchTime = watchTime;
  
    let source = {
      src: videoSource.src,
      type: videoSource.type
    };

    if (videoSource.type === 'video/x-matroska' || !supportedCodecs.video.includes(videoSource.type)) {
      const preferredCodecs = [
        'video/mp4; codecs="avc1.64001E"',  
        'video/webm; codecs="vp9"',         
        'video/mp4; codecs="avc1.4D401E"',  
        'video/mp4; codecs="avc1.42E01E"', 
      ];
      
      const supportedCodec = preferredCodecs.find(codec => supportedCodecs.video.includes(codec));
      if (supportedCodec) {
        source.type = supportedCodec.split(';')[0]; 
      }
    }

    playerRef.current.src(source);
    playerRef.current.load();
    playerRef.current.removeClass('no-video');

    if (startTimeRef.current !== null) {
      watchTimeRef.current = currentWatchTime;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!wasTimerPaused) {
        setIsPaused(false);
      }
    }

  }, [videoSource, supportedCodecs]);

  const adjustSubtitleTiming = (offsetMs: number) => {
    const newOffset = subtitleOffset + offsetMs;
    setSubtitleOffset(newOffset);
    setCustomOffset(newOffset.toString());
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

    let mimeType = file.type;
    if (file.name.toLowerCase().endsWith('.mkv')) {
      mimeType = 'video/x-matroska';
    }

    const url = URL.createObjectURL(file);
    setVideoSource({
      src: url,
      type: mimeType
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
        const track = playerRef.current.addTextTrack("subtitles", "Japanese", "ja");
        validSubs.forEach((sub) => {
          try {
            const cue = new VTTCue(sub.startTime, sub.endTime, sub.text);
            cue.line = subtitlePosition;
            cue.snapToLines = false;
            cue.vertical = '';
            cue.align = 'center';
            cue.position = 50;
            cue.positionAlign = 'center';
            track.addCue(cue);
          } catch (error) {
            console.error('Error adding cue:', error, sub);
          }
        });

        track.mode = "showing";
        playerRef.current.textTrackDisplay.updateDisplay();

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
        
        
        const text = textLines
          .join('\n')
          .replace(/♪/g, '') 
          .replace(/\{[^\}]*\}/g, '') 
          .replace(/\([^)]*\)/g, '') 
          .replace(/\[[^\]]*\]/g, '') 
          .replace(/[<>]/g, '') 
          .replace(/\s+/g, ' ') 
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

        
        if (line === '[Events]') {
          isInEvents = true;
          continue;
        }

        if (isInEvents) {
          if (line.startsWith('Format:')) {
            
            formatLine = line
              .substring(7)
              .split(',')
              .map(field => field.trim());
            continue;
          }

          if (line.startsWith('Dialogue:')) {
            try {
              
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
                .replace(/\{[^\}]*\}/g, '') 
                .replace(/\\N/g, ' ') 
                .replace(/\\n/g, ' ') 
                .replace(/\\h/g, ' ') 
                .replace(/[｟｠]/g, '') 
                .replace(/[（）]/g, '') 
                .replace(/[\\][a-zA-Z0-9&H]*[\\]?/g, '') 
                .replace(/\s+/g, ' ') 
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
      if (result?.error) {
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

  
  const handlePauseImmersion = () => {
    if (!isPaused) {
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      watchTimeRef.current = watchTime;
      setIsPaused(true);
      
      if (playerRef.current) {
        playerRef.current.pause();
      }
    } else {
      
      startTimeRef.current = Date.now() - (watchTimeRef.current * 1000);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setWatchTime(elapsed);
      }, 1000);
      setIsPaused(false);
      
      if (playerRef.current) {
        playerRef.current.play();
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
      setVideoStartTime(null);
      setIsPaused(false);

      
      if (playerRef.current) {
        playerRef.current.pause();
      }
    }
  };

  
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
        case ' ': 
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
        case keyBindings.toggleTranscript:
          e.preventDefault();
          setIsFullscreenTranscriptVisible(!isFullscreenTranscriptVisible);
          playerRef.current.el().classList.toggle('transcript-visible');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); 
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [subtitles, subtitleOffset, playerSettings?.settings?.keyBindings, isFullscreenTranscriptVisible]);

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

      const currentPlayerTime = playerRef.current.currentTime();
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

      const cleanSubtitle = currentSub.text
        .replace(/To view this video.*?video/g, '') 
        .replace(/Loaded:?\s*\d*\.?\d*%?.*$/gi, '') 
        .replace(/Loading\.{1,3}.*$/gi, '') 
        .replace(/\b(Loaded|Loading)\b.*$/gi, '') 
        .replace(/<[^>]*>/g, '') 
        .replace(/\s+/g, ' ') 
        .replace(/^\s*[.…]+\s*|\s*[.…]+\s*$/g, '') 
        .replace(/.*?(Loaded:?\s*\d*\.?\d*%?)$/gi, '') 
        .trim();

      
      if (!cleanSubtitle) {
        console.warn('Subtitle was empty after cleaning:', currentSub.text);
        setSelectedSubtitle(currentSub.text);
      } else {
        setSelectedSubtitle(cleanSubtitle);
      }

      
      const imageData = await mediaExtractor.captureVideoFrame(videoRef.current);

      
      const audioBlob = await mediaExtractor.extractAudioClip(
        videoRef.current,
        currentSub.startTime,
        currentSub.endTime
      );
      setCapturedImage(imageData);
      setCapturedAudio(audioBlob);
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
    
    
    if (playerRef.current && wasPlayingBeforeModal) {
      playerRef.current.play().catch((error: unknown) => {
        console.error('Failed to resume video:', error);
      });
    }
    setWasPlayingBeforeModal(false);
  };

  
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
    <div className="grid grid-rows-[auto_1fr] gap-4 h-full">
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
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

          <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnkiSettingsOpen(true)}
              className="hover:bg-[#F87171] hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Anki Settings
            </Button>
          </div>

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
          <div className="flex items-center gap-3 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700 hover:border-[#F87171] transition-colors">
            <span className="text-sm font-medium text-white">Offset:</span>
            <input
              type="number"
              value={customOffset}
              onChange={handleCustomOffsetChange}
              placeholder="ms"
              className="w-16 bg-transparent text-sm focus:outline-none focus:ring-0 text-right text-white"
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

          <div className="h-4 w-px bg-slate-700" />

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
                className="w-72 max-h-[80vh] overflow-y-auto bg-slate-900 border border-[#F87171]" 
                align="end" 
                side="bottom"
                sideOffset={8}
              >
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 z-10">
                  <DropdownMenuLabel className="flex items-center gap-2 text-white">
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
                    <Label className="text-sm font-medium text-white">Auto-Pause</Label>
                    <div 
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                        playerSettings?.settings?.autoPause?.enabled ? 'bg-[#F87171]' : 'bg-slate-700'
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
                      <Label className="text-sm font-medium block mb-1 text-white">Pause At</Label>
                      <select
                        value={playerSettings?.settings?.autoPause?.pauseAt ?? 'start'}
                        onChange={(e) => playerSettings.setAutoPause({ 
                          pauseAt: e.target.value as 'start' | 'end' 
                        })}
                        className="w-full px-2 py-1 text-sm border rounded-md bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                      >
                        <option value="start">Start of Subtitle</option>
                        <option value="end">End of Subtitle</option>
                      </select>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator className="bg-[#2a3142]" />

                {/* Font Settings Group */}
                <div className="p-2 space-y-3">
                  <Label className="text-xs font-medium text-gray-400">Font Settings</Label>
                  
                  {/* Font Family */}
                  <div>
                    <Label className="text-sm font-medium block mb-1 text-white">Font Family</Label>
                    <select
                      value={subtitleFontFamily}
                      onChange={(e) => setSubtitleFontFamily(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
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
                    <Label className="text-sm font-medium block mb-1 text-white">Font Weight: {subtitleFontWeight}</Label>
                    <Slider
                      value={[parseInt(subtitleFontWeight)]}
                      onValueChange={(values: number[]) => setSubtitleFontWeight(values[0].toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="my-1 [&_[role=slider]]:bg-[#F87171] [&_[role=slider]]:border-[#F87171] [&_[role=slider]]:hover:bg-[#F87171]/90 [&_[role=slider]]:focus:ring-[#F87171]/30 [&_[role=track]]:bg-[#F87171]"
                    />
                  </div>

                  {/* Font Style */}
                  <div>
                    <Label className="text-sm font-medium block mb-1 text-white">Font Style</Label>
                    <select
                      value={subtitleFontStyle}
                      onChange={(e) => setSubtitleFontStyle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
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
                    <Label className="text-sm font-medium block mb-1 text-white">Letter Spacing: {subtitleLetterSpacing}em</Label>
                    <Slider
                      value={[subtitleLetterSpacing]}
                      onValueChange={(values: number[]) => setSubtitleLetterSpacing(values[0])}
                      min={-0.5}
                      max={1}
                      step={0.1}
                      className="my-1 [&_[role=slider]]:bg-[#F87171] [&_[role=slider]]:border-[#F87171] [&_[role=slider]]:hover:bg-[#F87171]/90 [&_[role=slider]]:focus:ring-[#F87171]/30 [&_[role=track]]:bg-[#F87171]"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-[#2a3142]" />
                <div className="p-2 space-y-3">
                  <Label className="text-xs font-medium text-gray-400">Appearance</Label>

                  {/* Font Size */}
                  <div>
                    <Label className="text-sm font-medium block mb-1 text-white">Font Size: {subtitleFontSize}px</Label>
                    <input
                      type="text"
                      value={subtitleFontSize}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setSubtitleFontSize(0);
                        } else {
                          const newSize = parseInt(value);
                          if (!isNaN(newSize)) {
                            setSubtitleFontSize(newSize);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || isNaN(parseInt(value))) {
                          setSubtitleFontSize(22); 
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-[#1a1f2e] text-white border-[#2a3142] hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <Label className="text-sm font-medium block mb-1 text-white">Position (px from top)</Label>
                    <input
                      type="text"
                      value={subtitlePosition}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setSubtitlePosition(0);
                        } else {
                          const newPosition = parseInt(value);
                          if (!isNaN(newPosition)) {
                            setSubtitlePosition(newPosition);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || isNaN(parseInt(value))) {
                          setSubtitlePosition(0);
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border rounded-md bg-[#1a1f2e] text-white border-[#2a3142] hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium block mb-1 text-white">Text Color</Label>
                      <input
                        type="color"
                        value={subtitleColor}
                        onChange={(e) => setSubtitleColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer border border-[#2a3142] hover:border-[#F87171] transition-colors"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium block mb-1 text-white">Outline Color</Label>
                      <input
                        type="color"
                        value={subtitleStrokeColor}
                        onChange={(e) => setSubtitleStrokeColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer border border-[#2a3142] hover:border-[#F87171] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium block mb-1 text-white">Outline Width: {subtitleStrokeWidth}px</Label>
                    <Slider
                      value={[subtitleStrokeWidth]}
                      onValueChange={(values: number[]) => setSubtitleStrokeWidth(values[0])}
                      min={0}
                      max={10}
                      step={0.1}
                      className="my-1 [&_[role=slider]]:bg-[#F87171] [&_[role=slider]]:border-[#F87171] [&_[role=slider]]:hover:bg-[#F87171]/90 [&_[role=slider]]:focus:ring-[#F87171]/30 [&_[role=track]]:bg-[#F87171]"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-[#2a3142]" />
                <div className="p-2">
                  <Label className="text-xs font-medium text-gray-400">Behavior</Label>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Label className="text-sm font-medium text-white">Pause on Hover</Label>
                    <div 
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${
                        hoverPause ? 'bg-[#F87171]' : 'bg-slate-700'
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
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-4 flex-1 min-h-0">
        {/* Video player container */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <div 
            className="absolute inset-0 rounded-lg overflow-hidden shadow-lg group"
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
            {/* Add fullscreen transcript panel */}
            <div className={`fullscreen-transcript ${isFullscreenTranscriptVisible ? 'visible' : ''}`}>
              <div className="fullscreen-transcript-content" ref={fullscreenTranscriptRef}>
                {subtitles.map((subtitle) => (
                  <div
                    key={subtitle.id}
                    id={`subtitle-fullscreen-${subtitle.id}`}
                    className={`py-2 px-3 rounded-md transition-all hover:bg-gray-800/50 cursor-pointer ${
                      currentSubtitleId === subtitle.id
                        ? 'bg-red-900/30 border-l-4 border-[#F87171]'
                        : ''
                    }`}
                    onClick={() => handleSubtitleClick(getAdjustedTime(subtitle.startTime))}
                  >
                    <div className="text-xs text-gray-400 mb-1">
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
        </div>

        {/* Transcript */}
        <div 
          className="w-full h-[300px] lg:h-full bg-white dark:bg-gray-900 rounded-[30px] shadow-lg relative group overflow-hidden"
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrag(e, true, setIsDraggingSubs);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrag(e, true, setIsDraggingSubs);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.currentTarget === e.target) {
              handleDrag(e, false, setIsDraggingSubs);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(e, 'subtitle');
          }}
        >
          <div 
            className="absolute inset-0 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:transparent hover:[&::-webkit-scrollbar-thumb]:bg-black/10"
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
          imageData={capturedImage as string}
          audioBlob={capturedAudio as Blob}
          currentTime={playerRef.current?.currentTime() || 0}
        />
      )}
      <AnkiSettingsModal 
        isOpen={isAnkiSettingsOpen}
        onClose={() => setIsAnkiSettingsOpen(false)}
      />
    </div>
  );

  function formatTime(seconds: number): string {
    const pad = (num: number): string => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
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

  
  useEffect(() => {
    if (!playerRef.current) return;

    const handleFullscreenChange = () => {
      if (!playerRef.current.isFullscreen()) {
        setIsFullscreenTranscriptVisible(false);
        playerRef.current.el().classList.remove('transcript-visible');
      }
    };

    playerRef.current.on('fullscreenchange', handleFullscreenChange);
    return () => {
      if (playerRef.current) {
        playerRef.current.off('fullscreenchange', handleFullscreenChange);
      }
    };
  }, []);
} 