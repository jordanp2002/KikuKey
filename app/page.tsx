import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="w-full">
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">Enhance Your Japanese Learning<br /> with <span className="text-[#F87171]">KikuKey</span></h1>
        <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Immerse yourself in the Japanese language through our easy to use platform. Track your immersion time and watch local content with subtitles.
        </p>
        <Button asChild size="lg" className="bg-[#F87171] text-white hover:bg-[#EF4444] px-8 rounded-full">
          <Link href="/sign-up">Start Learning Now</Link>
        </Button>
      </section>

      {/* Immersion Learning Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 dark:text-white">Why Immersion Learning Works</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#F87171]">Natural Acquisition</h3>
                  <p className="text-gray-600 dark:text-gray-300">Learn Japanese the same way native speakers do - through natural exposure and context, rather than memorizing rules and vocabulary lists.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#F87171]">Better Retention</h3>
                  <p className="text-gray-600 dark:text-gray-300">When you learn through real-world content, your brain creates stronger neural connections, leading to better long-term memory retention.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#F87171]">Cultural Understanding</h3>
                  <p className="text-gray-600 dark:text-gray-300">Immersion exposes you to authentic Japanese culture, helping you understand not just the language, but the context in which it's used.</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-6 dark:text-white">Traditional vs. Immersion</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <h4 className="font-semibold mb-2 dark:text-white">Traditional Learning</h4>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                    <li>• Memorization of rules and vocabulary</li>
                    <li>• Limited exposure to real Japanese</li>
                    <li>• Focus on textbook examples</li>
                    <li>• More likely to quit (in our experience)</li>
                  </ul>
                </div>
                <div className="p-4 bg-[#FEE2E2] dark:bg-[#F87171]/20 rounded-lg">
                  <h4 className="font-semibold mb-2 dark:text-white">Immersion Learning</h4>
                  <ul className="text-gray-700 dark:text-gray-200 space-y-2">
                    <li>• Natural language acquisition</li>
                    <li>• Constant exposure to authentic content</li>
                    <li>• Real-world context and usage</li>
                    <li>• Slower progress at the beginning, but faster progress in the long run</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 dark:text-white">Our Approach to Language Learning</h2>
          <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg space-y-8">
            <div className="space-y-4">
              <p className="text-xl text-gray-600 dark:text-gray-300 text-center">
                At KikuKey, we believe in being transparent about the language learning journey
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-red-50 dark:bg-[#F87171]/10 p-6 rounded-xl">
                  <h3 className="text-2xl font-semibold mb-4 text-[#F87171]">Our Philosophy</h3>
                  <ul className="space-y-4 text-gray-700 dark:text-gray-200">
                    <li className="flex items-start gap-2">
                      <span className="text-[#F87171] dark:text-red-400 font-bold">•</span>
                      <span>While immersion isn't the only path to Japanese fluency, it's a crucial component of the learning process</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F87171] dark:text-red-400 font-bold">•</span>
                      <span>We focus on providing tools and resources that make immersion learning more accessible and effective</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F87171] dark:text-red-400 font-bold">•</span>
                      <span>Unlike others, we won't promise fluency in X days - we know from experience that mastery takes time</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-600 p-6 rounded-xl">
                  <h3 className="text-2xl font-semibold mb-4 dark:text-white">The Reality of Language Learning</h3>
                  <ul className="space-y-4 text-gray-700 dark:text-gray-200">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Success depends on your dedication and consistent practice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>There are no shortcuts to fluency - it's about the journey, not just the destination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">•</span>
                      <span>Progress comes from the time and effort you invest in your learning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t dark:border-gray-600">
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                As Japanese learners ourselves, we understand the journey. Our role is to provide you with effective tools
                and support to make your learning process as smooth and enjoyable as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <h2 className="text-4xl font-bold text-center mb-16 dark:text-white">Why Learn With Us?</h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto px-6">
          <div className="p-6 rounded-lg">
            <div className="text-[#F87171] text-3xl mb-4">📚</div>
            <h3 className="text-2xl font-semibold mb-3 dark:text-white">Immersion-Based Learning</h3>
            <p className="text-gray-600 dark:text-gray-300">Immerse yourself in the Japanese language through our easy to use platform. Track your immersion time and watch local content with subtitles.</p>
          </div>
          
          <div className="p-6 rounded-lg">
            <div className="text-[#F87171] text-3xl mb-4">💬</div>
            <h3 className="text-2xl font-semibold mb-3 dark:text-white">Track Your Progress</h3>
            <p className="text-gray-600 dark:text-gray-300">Our platform tracks your immersion time and progress, so you can see how much you've improved.</p>
          </div>
          
          <div className="p-6 rounded-lg">
            <div className="text-[#F87171] text-3xl mb-4">🚀</div>
            <h3 className="text-2xl font-semibold mb-3 dark:text-white">Beginner Friendly</h3>
            <p className="text-gray-600 dark:text-gray-300">Our provided Hiragana and Katakana quizzes are designed to help you learn the basics of the Japanese language.</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="text-center max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 dark:text-white">Ready to Begin Your Japanese Journey?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
            Join thousands of successful learners who have mastered Japanese with our platform.
          </p>
          <Button asChild size="lg" className="bg-[#F87171] text-white hover:bg-[#EF4444] px-8 rounded-full">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
