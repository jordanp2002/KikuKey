"use client";

import VideoPlayer from "@/components/video-player";
import YouTubePlayer from "@/components/youtube-player";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function VideoPlayerPage() {
  const [isYouTube, setIsYouTube] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [showToggle, setShowToggle] = useState(true);

  useEffect(() => {
    const hideGuides = localStorage.getItem("hideVideoPlayerGuides");
    if (hideGuides === "true") {
      setShowGuides(false);
      setShowToggle(false);
    }
  }, []);

  const handleHideGuides = (checked: boolean) => {
    setShowGuides(!checked);
    if (checked) {
      setShowToggle(false);
    }
    localStorage.setItem("hideVideoPlayerGuides", checked.toString());
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-4 max-w-7xl mx-auto p-4">
      <BackButton />
      
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-4xl font-bold tracking-tight">Video Player</h1>
        <div className="h-1 w-12 rounded-full bg-[#F87171]" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-end items-center">
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

        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          {isYouTube ? <YouTubePlayer /> : <VideoPlayer />}
        </div>
      </div>
    </div>
  );
}
