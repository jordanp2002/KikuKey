"use client";

import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";

export default function VideoPlayerGuidePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold text-center">Video Player Guide</h1>
          
          <div className="w-full max-w-3xl space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Basic Usage</h2>
              <div className="space-y-2">
                <p>The video player supports various video formats and subtitle files to help with your Japanese immersion:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload videos using the "Upload Video" button or drag and drop</li>
                  <li>Add subtitles using the "Upload Subtitles" button or drag and drop</li>
                  <li>Supported video formats: MP4, MKV, and other common formats</li>
                  <li>Supported subtitle formats: SRT, VTT, ASS</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Immersion Timer</h2>
              <div className="space-y-2">
                <p>Track your immersion time with the built-in timer:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Timer starts automatically when you first play the video</li>
                  <li>Pausing the video will continue the timer, so you can time to look up words and sentences without losing your immersion time (as this is immerson)</li>
                  <li>Use the pause button (⏸️) near the immersion timer to pause both timer and video when taking breaks</li>
                  <li>Use the submit button (✓) to save your current session if you're taking a break/leaving the page, or start fresh when you're ready to continue</li>
                  <li>Timer automatically saves when:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Video ends</li>
                      <li>New video is loaded</li>
                      <li>Manual submission</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Subtitle Features</h2>
              <div className="space-y-2">
                <p>Manage and interact with subtitles:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Interactive transcript panel shows all subtitles</li>
                  <li>Click any subtitle to jump to that point in the video</li>
                  <li>Current subtitle is highlighted in red</li>
                  <li>Adjust subtitle timing with the offset controls:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Enter milliseconds in the input field</li>
                      <li>Positive values delay subtitles</li>
                      <li>Negative values advance subtitles</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Tips for Effective Use</h2>
              <div className="space-y-2">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the pause button on the VIDEO when looking up words to keep tracking your study time</li>
                  <li>Use the pause button on the IMMERSION TIMER when taking breaks to keep tracking your study time and video time</li>
                  <li>Submit your session when taking longer breaks to keep accurate records, or start fresh when you're ready to continue. There is automatic saving when the video ends, or when a new video is loaded but if you plan to leave the page, you should submit your session to keep accurate records</li>
                  <li>Adjust playback speed using the rate control (0.5x - 2x)</li>
                  <li>Use the transcript to review specific lines or practice shadowing</li>
                  <li>Your immersion time is automatically saved to track your progress</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                <ul className="list-disc pl-6 space-y-2">
                  <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Space</kbd> - Play/Pause video</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">←</kbd> / <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">→</kbd> - Seek backward/forward</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd> / <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd> - Adjust volume</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">F</kbd> - Toggle fullscreen</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
