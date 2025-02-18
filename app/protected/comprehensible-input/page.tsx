"use client";

import {Video, Brain, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export default function ComprehensibleInputPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto p-6">
          <h1 className="text-4xl font-bold text-center">Comprehensible Input</h1>
          
          <div className="space-y-12">
            {/* What is Comprehensible Input */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">What is Comprehensible Input?</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                Comprehensible input refers to language content that is mostly understandable—typically 50-90%—even if some words or grammar points are unfamiliar. It provides enough context through visuals, tone, and known vocabulary for learners to grasp the overall meaning while picking up new words and patterns naturally. 
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-medium text-[#F87171]">The Magic Zone:</p>
                  <p>When content is comprehensible, your brain can naturally acquire new language patterns
                    by connecting what you already know with the new elements you're exposed to.</p>
                </div>
              </div>
            </section>

            {/* How to Find Comprehensible Input */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">Finding Your Level of Comprehensible Input</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  The key is to start with content that matches your current level and gradually increase difficulty.
                  Here's how to identify good comprehensible input:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="font-medium">Beginner Level:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Children's shows with simple dialogue</li>
                      <li>Slice of life anime with everyday conversations</li>
                      <li>YouTube videos made for Japanese learners</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Intermediate Level:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Regular anime and dramas with clear context</li>
                      <li>Japanese YouTube vlogs</li>
                      <li>News articles with furigana</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Starting From Zero Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">What If I Don't Understand Anything Yet?</h2>
              </div>
              <div className="pl-9 space-y-4">
                <p className="text-muted-foreground">
                  Even if you're just starting and can't understand much, immersion is still incredibly valuable.
                  Early exposure helps your brain get used to Japanese sounds, rhythm, and intonation patterns.
                  This foundation makes it easier to learn words and grammar later.
                </p>
                <div className="bg-red-50 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="font-medium text-[#F87171]">Simple Steps to Start:</p>
                    <div className="space-y-2 mt-2">
                        <div>
                        <p className="font-medium">1. Learn Japanese Writing System <a href="/protected/quizzes" target="_blank" rel="noopener noreferrer" className="text-[#F87171] hover:underline text-sm">Here</a></p>
                        <p>Use our quizzes to learn the Japanese writing system. This will help you be able to read the words in your anki deck and immersion content.</p>
                        
                      </div>
                      <div>
                        <p className="font-medium">2. Start your first Anki deck 
                        <a
                          href="/protected/anki-guide"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F87171] hover:underline text-sm"
                        >
                          → Installation Guide
                        </a>
                        </p>
                        <p>Grab an Japanese vocabulary deck from the link below and start going through it. This will expose you to words which you will be seeing in immersion.This will help you understand the words you are seeing in immersion which will make input more comprehensible and the words you are seeing in immersion will be more familiar to you and stick in your memory</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>We recommend starting with the <a href="https://ankiweb.net/shared/info/1196762551" target="_blank" rel="noopener noreferrer" className="text-[#F87171] hover:underline text-sm">Kaishi 1.5K</a> deck.</li>
                            
                            <li>We also recommend starting with 5-10 new cards a day</li>
                        </ul>
                        <a
                          href="https://ankiweb.net/shared/decks/japanese"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F87171] hover:underline text-sm"
                        >
                          → Browse Japanese Anki Decks
                        </a>
                      </div>
                      <div>
                        <p className="font-medium">3. Yomitan (Browser Extension)</p>
                        <p>A powerful tool for looking up Japanese words while watching or reading. This will help you understand the words you are seeing in immersion which will make input more comprehensible and the words you are seeing in immersion will be more familiar to you and stick in your memory.</p>
                        <a
                          href="/protected/video-player/pop-up"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F87171] hover:underline text-sm"
                        >
                          → Yomitan Installation Guide
                        </a>
                      </div>
                      <div>
                        <p className="font-medium">4. Check out our grammar guide</p>
                        <p>Check out our grammar guide page to learn how to acquire grammar through immersion. </p>
                        <a
                          href="/protected/grammar-guide"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F87171] hover:underline text-sm"
                        >
                          → Grammar Guide
                        </a>
                      </div>
                      <div>
                        <p className="font-medium">5. Be patient!</p>
                        <p>Language acquisition is a slow process. Don't expect to understand everything right away. Just focus on enjoying the content and the process of learning. It may feel like you are not making progress but you are! Immersion is a long game and you will see progress over time. You may not notice progress in the short term but you will see it in the long term.</p>
                        
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-[#F87171]">Early Immersion Tips:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Start with content that has lots of visual context (anime, vlogs)</li>
                      <li>Use Japanese subtitles and look up words that appear frequently</li>
                      <li>Focus on enjoying the content rather than understanding everything</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm italic">
                  Remember: Every native Japanese speaker started from zero understanding. Your brain is designed to learn
                  languages through exposure - trust the process and stay consistent with your immersion.
                </p>
              </div>
            </section>

            {/* Recommended Sources */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-6 h-6 text-[#F87171]" />
                <h2 className="text-2xl font-semibold">Finding Content</h2>
              </div>
              <div className="pl-9">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-[#F87171]">About Content Sources</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      While we provide tools to help with your immersion learning, we cannot directly provide or link to copyrighted content. We encourage supporting content creators through official distribution channels whenever possible. We are sorry for the inconvenience.
                    </p>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold">Search Tips</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">When searching for content, try using these alongside related terms</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm mb-2">Search Terms:</p>
                          
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• For subtitles, many open-source repositories and subtitle-sharing platforms are available. Fans often discuss these resources in Japanese-focused enthusiast groups.</li>
                            <li>• Japanese-focused forums, Discord servers, and subreddits frequently share tips for finding and organizing both video files and subtitle files.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm">
                      Our video player supports various video and subtitle file formats. Remember to always respect copyright laws and support content creators when possible.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/protected/video-player"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F87171] text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Video className="w-5 h-5" />
              Try Our Video Player
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 