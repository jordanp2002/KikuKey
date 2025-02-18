"use client";

import Image from 'next/image'
import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";

export default function YomitanGuide() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold text-center">Pop-up Dictionary Guide</h1>
          <h1 className="text-3xl font-bold mb-8">Setting Up Yomitan</h1>
          
          <div className="w-full max-w-3xl space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Step 1: Install Yomitan Extension</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Visit the <a href="https://chromewebstore.google.com/detail/yomitan/likgccmbimhjbgkjambclfkhldnlhbnn" className="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener noreferrer">Yomitan Chrome Extension</a> page</li>
                <li>Click the &quot;Add to Chrome&quot; button</li>
                <li>Confirm the installation when prompted</li>
                <li>After installation, you&apos;ll see the Yomitan icon in your Chrome extensions bar</li>
              </ol>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Step 2: Import Dictionaries</h2>
              <p className="mb-4">Yomitan requires dictionary files to function. Here are the recommended dictionaries:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>JMdict (English) - General Japanese dictionary</li>
                <li>KANJIDIC - Kanji dictionary with meanings and readings</li>
                <li>JMnedict - Names dictionary</li>
                {/* TODO: Add direct download links when available */}
              </ul>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <h3 className="font-semibold mb-2">To import dictionaries:</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Download the dictionary files from the links above</li>
                  <li>Click the Yomitan extension icon in Chrome</li>
                  <li>Click the settings icon (⚙️)</li>
                  <li>Go to the &quot;Dictionaries&quot; tab</li>
                  <li>Click &quot;Import&quot; and select your downloaded dictionary files</li>
                  <li>Wait for the import to complete</li>
                </ol>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Step 3: Using Yomitan with Our Video Player</h2>
              <div className="space-y-2">
                <p>Once Yomitan is set up, you can use it with our video player:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Hover over any Japanese text in the video subtitles</li>
                  <li>A popup will appear with the word&apos;s definition and readings</li>
                  <li>Click on words to see more detailed information</li>
                  <li>Use the keyboard shortcut (default: Shift key) while hovering to search for multiple words at once</li>
                </ol>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Tips for Better Usage</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can customize Yomitan&apos;s appearance and behavior in its settings</li>
                <li>Right-click the extension icon and select &quot;Options&quot; for advanced settings</li>
                <li>Consider enabling automatic audio playback for pronunciation</li>
                <li>You can adjust the popup position and scanning mode in the settings</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Note: Yomitan is a third-party tool and is not affiliated with our platform. We recommend it for its excellent 
                features and reliability in the Japanese learning community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
