import { BackButton } from '@/components/ui/back-button';

export default async function AnkiGuidePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center gap-8 px-4 py-16">
        <div className="w-full max-w-3xl">
          <BackButton />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">Anki Setup Guide</h1>
        
        <div className="w-full max-w-3xl space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Installing Anki</h2>
            <div className="space-y-2">
              <p>Follow these steps to install Anki on your computer:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Visit the official Anki website at <a href="https://apps.ankiweb.net" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">apps.ankiweb.net</a></li>
                <li>Download the version appropriate for your operating system:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Windows: Click the Windows download button</li>
                    <li>Mac: Click the Mac download button (M1/M2 users should use the Apple Silicon version)</li>
                    <li>Linux: Follow the Linux installation instructions for your distribution</li>
                  </ul>
                </li>
                <li>Run the installer and follow the installation prompts</li>
                <li>Launch Anki once installation is complete</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Installing Your First Deck</h2>
            <div className="space-y-2">
              <p>To get started with your first deck:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an AnkiWeb account at <a href="https://ankiweb.net/account/register" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">ankiweb.net</a> (recommended for syncing across devices)</li>
                <li>For Japanese learning, we recommend these starter decks:
                  <ul className="list-disc pl-6 mt-2">
                    <li><a href="https://ankiweb.net/shared/info/1557722832" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Core 2.3K</a> - A solid foundation of common vocabulary</li>
                    <li><a href="https://ankiweb.net/shared/info/2009196675" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Recognition RTK</a> - For learning kanji through recognition</li>
                  </ul>
                </li>
                <li>Click "Download" on your chosen deck</li>
                <li>Double-click the downloaded .apkg file to import it into Anki</li>
                <li>The deck will automatically appear in your Anki desktop app</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Enabling FSRS (Recommended)</h2>
            <div className="space-y-2">
              <p>FSRS (Free Spaced Repetition Scheduler) is built into Anki 23.10+ and can significantly improve your learning efficiency:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Click the gear icon ⚙️ next to your deck</li>
                <li>Select "Options"</li>
                <li>In the "Scheduling" tab, change "Scheduler" to "FSRS"</li>
                <li>We recommend these settings:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Desired retention: 85-90%</li>
                    <li>Leave the rest at default</li>
                  </ul>
                </li>
                <li>Click "Save"</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">Note: While FSRS is recommended for optimal learning, the standard scheduler is also perfectly fine for beginners. You can always enable it later.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Study Best Practices</h2>
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Daily Consistency:</strong> Study every day, even if just for 10 minutes</li>
                <li><strong>New Cards:</strong> Start with 5-10 new cards per day and adjust based on your comfort level</li>
                <li><strong>Review First:</strong> Always complete your reviews before learning new cards</li>
                <li><strong>Rating System:</strong> We recommend using only "Again" or "Easy" buttons:
                  <ul className="list-disc pl-6 mt-2">
                    <li>"Again" - If you got any part wrong or had to think too long</li>
                    <li>"Easy/Good" - If you recalled both meaning and reading quickly</li>
                    <li>This helps the algorithm work better.</li>
                  </ul>
                </li>
                <li><strong>Maximum Reviews Per Day:</strong>Set the maximum reviews per day in your anki deck to 9999, this will make sure you are getting all the cards due for that day.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Recommended Add-ons</h2>
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://ankiweb.net/shared/info/1463041493" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Review Heatmap</a> - Visualize your study streak and consistency</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">To install add-ons: Tools → Add-ons → Get Add-ons → Paste the add-on code</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Additional Resources</h2>
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://docs.ankiweb.net/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Official Anki Manual</a> - Complete documentation</li>
                <li><a href="https://refold.la/roadmap/stage-1/a/anki-setup" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Refold Anki Guide</a> - Detailed setup guide for language learning</li>
                <li><a href="https://www.reddit.com/r/LearnJapanese/wiki/index/resources/#wiki_anki" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">r/LearnJapanese Anki Resources</a> - Community curated decks and tips</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 