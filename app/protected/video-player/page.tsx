"use client";

import VideoPlayer from "@/components/video-player";
import YouTubePlayer from "@/components/youtube-player";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AnkiSettingsModal from "@/components/anki-settings-modal";
import { Sidebar } from "@/components/sidebar";

export default function VideoPlayerPage() {
  const [isYouTube, setIsYouTube] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [showToggle, setShowToggle] = useState(true);
  const [isAnkiSettingsOpen, setIsAnkiSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showPlaylist');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  useEffect(() => {
    const hideGuides = localStorage.getItem("hideVideoPlayerGuides");
    if (hideGuides === "true") {
      setShowGuides(false);
      setShowToggle(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('showPlaylist', showPlaylist.toString());
  }, [showPlaylist]);

  const handleHideGuides = (checked: boolean) => {
    setShowGuides(!checked);
    if (checked) {
      setShowToggle(false);
    }
    localStorage.setItem("hideVideoPlayerGuides", checked.toString());
  };

  return (
    <div className="flex min-h-screen">
      <style>{`
        @keyframes content-show {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(1rem);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes header-show {
          0% {
            opacity: 0;
            transform: translateY(-1rem);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-4 max-w-[95%] mx-auto p-4 h-[calc(100vh-2rem)]">
          <div 
            className="flex flex-col items-center gap-1"
            style={{
              animation: 'header-show 1000ms ease-out forwards'
            }}
          >
            <h1 className="text-4xl font-bold tracking-tight">Video Player</h1>
            <div className="h-1 w-12 rounded-full bg-[#F87171]" />
          </div>

          <div 
            className="flex-1 min-h-0 flex flex-col gap-4"
            style={{
              animation: 'content-show 1000ms ease-out forwards',
              animationDelay: '300ms',
              opacity: 0
            }}
          >
            <div className="flex justify-end items-center gap-3">
              {isYouTube && (
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#F87171]/20 hover:bg-[#F87171]/5 transition-colors"
                >
                  {showPlaylist ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                      </svg>
                      Hide Playlist
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <path d="M13 8l5 4-5 4V8z"></path>
                      </svg>
                      Show Playlist
                    </>
                  )}
                </button>
              )}
              <div className="flex rounded-lg overflow-hidden border border-[#F87171]/20">
                <button
                  onClick={() => setIsYouTube(false)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    !isYouTube
                      ? 'bg-[#F87171] text-white'
                      : 'hover:text-[#F87171] hover:bg-[#F87171]/5'
                  }`}
                >
                  Local Video
                </button>
                <div className="w-[1px] bg-[#F87171]/20" />
                <button
                  onClick={() => setIsYouTube(true)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isYouTube
                      ? 'bg-[#F87171] text-white'
                      : 'hover:text-[#F87171] hover:bg-[#F87171]/5'
                  }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {showToggle && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hideGuides" 
                  checked={!showGuides}
                  onCheckedChange={handleHideGuides}
                  className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-[#F87171] data-[state=checked]:border-[#F87171]"
                />
                <Label 
                  htmlFor="hideGuides" 
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#F87171] dark:hover:text-[#F87171] cursor-pointer"
                >
                  Don't show guides
                </Label>
              </div>
            )}

            {showGuides && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-[#F87171] dark:hover:border-[#F87171]">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    Video Player Guide
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-3">
                    Learn the basics and advanced features of the video player
                  </p>
                  <a 
                    href="/protected/video-player/guide" 
                    className="inline-flex items-center text-[#F87171] hover:text-[#F87171]/80 dark:text-[#F87171] dark:hover:text-[#F87171]/80 font-medium group-hover:translate-x-1 transition-transform"
                  >
                    Read Guide
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>

                <div className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-[#F87171] dark:hover:border-[#F87171]">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    Subtitle Features
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-3">
                    Discover how to use subtitles with pop-up dictionaries
                  </p>
                  <a 
                    href="/protected/video-player/pop-up" 
                    className="inline-flex items-center text-[#F87171] hover:text-[#F87171]/80 dark:text-[#F87171] dark:hover:text-[#F87171]/80 font-medium group-hover:translate-x-1 transition-transform"
                  >
                    Learn More
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0">
              {isYouTube ? (
                <div className={`grid grid-cols-1 ${showPlaylist ? 'lg:grid-cols-[1fr_300px]' : ''} gap-4 h-full`}>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg transform-gpu transition-all duration-500 hover:shadow-lg"
                    style={{
                      animation: 'content-show 1000ms ease-out forwards',
                      animationDelay: '600ms',
                      opacity: 0
                    }}
                  >
                    <YouTubePlayer />
                  </div>
                  {showPlaylist && (
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-hidden transform-gpu transition-all duration-500 hover:shadow-lg"
                      style={{
                        animation: 'content-show 1000ms ease-out forwards',
                        animationDelay: '800ms',
                        opacity: 0
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                          Beginner Playlist
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          <BeginnerPlaylist />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg h-full transform-gpu transition-all duration-500 hover:shadow-lg"
                  style={{
                    animation: 'content-show 1000ms ease-out forwards',
                    animationDelay: '600ms',
                    opacity: 0
                  }}
                >
                  <VideoPlayer />
                </div>
              )}
            </div>
          </div>

          <AnkiSettingsModal 
            isOpen={isAnkiSettingsOpen}
            onClose={() => setIsAnkiSettingsOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

function BeginnerPlaylist() {
  const playlist = [
    {
      id: 'RsrakukF396',
      title: 'Japanese From Zero! Book 1 | Learning Japanese for Beginners',
      thumbnail: 'https://img.youtube.com/vi/RsrakukF396/mqdefault.jpg',
      duration: '27:31',
      channel: 'Japanese From Zero!'
    }
  ];

  return (
    <>
      {playlist.map((video) => (
        <button
          key={video.id}
          onClick={() => {
            const url = `https://youtube.com/watch?v=${video.id}`;
            const urlInput = document.querySelector('input[placeholder="Enter YouTube URL"]') as HTMLInputElement;
            if (urlInput) {
              urlInput.value = url;
              const inputEvent = new Event('input', { bubbles: true });
              urlInput.dispatchEvent(inputEvent);
              const changeEvent = new Event('change', { bubbles: true });
              urlInput.dispatchEvent(changeEvent);
              const form = urlInput.closest('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }
          }}
          className="w-full flex gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left group"
        >
          <div className="relative flex-shrink-0">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-32 h-24 object-cover rounded-md"
            />
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
              {video.duration}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-[#F87171] transition-colors">
              {video.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {video.channel}
            </p>
          </div>
        </button>
      ))}
    </>
  );
}
