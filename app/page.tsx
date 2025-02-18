import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="mb-6">
          <Image
            src="/kiku-key-logo.svg"
            alt="KikuKey Logo"
            width={40}
            height={40}
            className="mx-auto"
          />
        </div>
        <h1 className="text-5xl font-bold mb-6">
          Enhance Your Japanese Learning with <span className="text-[#F87171]">KikuKey</span>
        </h1>
        <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Immerse yourself in the Japanese language through our easy to use platform.
          Track your immersion time and watch local content with subtitles.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-[#F87171] text-white hover:bg-[#EF4444] px-8 rounded-full">
            <Link href="/sign-up">Start Learning Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 rounded-full">
            <Link href="/about">Watch Demo</Link>
          </Button>
        </div>
      </section>

      {/* Why Immersion Learning Works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Immersion Learning Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Traditional Learning</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span>
                  <span>Memorization of rules and vocabulary</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span>
                  <span>Limited exposure to real Japanese</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span>
                  <span>Focus on textbook examples</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span>
                  <span>More likely to quit from boredom</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Immersion Learning</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Natural language acquisition</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Constant exposure to authentic content</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Real-world context and usage</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Faster progress in the long run</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Learn With Us */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Learn With Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Immersion-Based Learning</h3>
              <p className="text-gray-600 dark:text-gray-300">Learn Japanese the same way native speakers do - through natural exposure and context, rather than memorization.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Your Progress</h3>
              <p className="text-gray-600 dark:text-gray-300">Our platform tracks your immersion time and progress, so you can see how much you've improved.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Beginner Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300">Start your journey with our carefully designed resources and tools that make immersion effective immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Approach to Language Learning</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
            At KikuKey, we believe in being transparent about the language learning journey
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-[#F87171]">Our Philosophy</h3>
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#F87171] mt-1">•</span>
                  <span>While immersion isn't the only path to Japanese fluency, it's a crucial component of the learning process</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F87171] mt-1">•</span>
                  <span>We focus on providing tools and resources that make immersion learning more accessible and effective</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F87171] mt-1">•</span>
                  <span>Unlike others, we won't promise fluency in X days - we know from experience that mastery takes time</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">The Reality of Language Learning</h3>
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>Success depends on your dedication and consistent practice</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>There are no shortcuts to fluency - it's about the journey, not just the destination</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>Progress comes from the time and effort you invest in your learning</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center mt-12 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            As Japanese learners ourselves, we understand the journey. Our role is to provide you with effective tools and support to make
            your learning process as smooth and enjoyable as possible.
          </p>
        </div>
      </section>
    </div>
  );
}
