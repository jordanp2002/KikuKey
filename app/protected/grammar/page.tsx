"use client";

import { BookOpen, Video, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export default function GrammarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto p-6">
          <h1 className="text-4xl font-bold text-center">Grammar Through Immersion</h1>
          
          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">The Immersion Approach to Grammar</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  Just like children naturally acquire their first language's grammar through exposure,
                  you can learn Japanese grammar through <Link href="/protected/comprehensible-input" className="text-[#F87171] hover:underline">comprehensible input</Link> rather than memorizing rules.
                  This natural approach leads to deeper understanding and more natural production.
                </p>
                <div className="bg-[#FEE2E2] dark:bg-[#451717] p-4 rounded-lg">
                  <p className="font-medium text-[#F87171]">Key Principle:</p>
                  <p className="dark:text-gray-200">Grammar patterns become intuitive through repeated exposure in meaningful contexts,
                    rather than through mechanical drills.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">Recognize Patterns, Don't Memorize Rules</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  Instead of studying grammar rules in isolation, focus on noticing patterns in native content.
                  Your brain will naturally start to recognize these patterns and understand their meaning through context.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <p className="font-medium">Example Pattern: ～ている</p>
                  <p className="dark:text-gray-200">Rather than memorizing "～ている = present progressive," notice how it's used in real contexts:</p>
                  <ul className="list-disc pl-5 space-y-1 dark:text-gray-200">
                    <li>映画を見ている (Watching a movie)</li>
                    <li>音楽を聴いている (Listening to music)</li>
                    <li>本を読んでいる (Reading a book)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">Shadowing and Sentence Mining</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  Use our video player to practice shadowing - repeat sentences you hear to internalize grammar patterns.
                  Save interesting sentences that contain new patterns you want to remember.
                </p>
                <div className="bg-[#FEE2E2] dark:bg-[#451717] p-4 rounded-lg">
                  <p className="font-medium text-[#F87171]">Practice Tip:</p>
                  <p className="dark:text-gray-200">When shadowing, focus on mimicking the entire sentence pattern rather than individual words.
                    This helps your brain naturally acquire the grammar structure.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">How to Use Grammar Resources</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  The most effective way to use grammar resources is to treat them as reference tools, not textbooks.
                  Here's the recommended approach:
                </p>
                <div className="bg-[#FEE2E2] dark:bg-[#451717] p-4 rounded-lg space-y-4">
                  <div>
                    <p className="font-medium text-[#F87171]">1. Initial Reading</p>
                    <p className="dark:text-gray-200">Do a quick read-through of the grammar guide once or twice. Don't worry if you don't understand everything
                      - this is just to familiarize yourself with what's available.</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#F87171]">2. Focus on Immersion</p>
                    <p className="dark:text-gray-200">Start watching Japanese content through our video player. This is where real learning happens.</p>
                  </div>
                  <div>
                    <p className="font-medium text-[#F87171]">3. Look Up as Needed</p>
                    <p className="dark:text-gray-200">When you encounter an unfamiliar grammar pattern in your immersion, refer back to these resources
                      to understand that specific point. This way, you'll learn grammar in context when it's relevant to you.</p>
                  </div>
                </div>
                <p className="text-sm italic dark:text-gray-300">Remember: It's normal not to understand everything in the guides at first.
                  Your understanding will grow naturally as you combine immersion with selective reference checking.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">Recommended Resources</h2>
              </div>
              <div className="pl-9">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Online Resources */}
                  <a
                    href="https://guidetojapanese.org/learn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:border-[#F87171] transition-colors dark:border-gray-700"
                  >
                    <h3 className="font-semibold">Tae Kim's Guide</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">Comprehensive, free grammar guide with natural examples</p>
                  </a>
                  
                  <a
                    href="https://www.imabi.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:border-[#F87171] transition-colors dark:border-gray-700"
                  >
                    <h3 className="font-semibold">Imabi</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">In-depth explanations for all levels</p>
                  </a>
                </div>
              </div>
            </section>
          </div>
          <div className="mt-8 text-center space-y-4">
            <Link
              href="/protected/video-player"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F87171] text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Video className="w-5 h-5" />
              Try our Video Player
            </Link>
            <div>
              <Link
                href="/protected/comprehensible-input"
                className="text-sm text-muted-foreground hover:text-[#F87171] hover:underline"
              >
                What is comprehensible input? Find out here →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
