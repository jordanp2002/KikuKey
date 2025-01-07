import { useState, useEffect } from 'react';

interface ReaderGuideProps {
  onHideGuide: (hide: boolean) => void;
}

export function ReaderGuide({ onHideGuide }: ReaderGuideProps) {
  const [hideGuide, setHideGuide] = useState(false);

  // Load hideGuide preference from localStorage on client side
  useEffect(() => {
    const savedHideGuide = window.localStorage.getItem('hideReaderGuide');
    if (savedHideGuide !== null) {
      setHideGuide(savedHideGuide === 'true');
      onHideGuide(savedHideGuide === 'true');
    }
  }, [onHideGuide]);

  const handleHideGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shouldHide = e.target.checked;
    setHideGuide(shouldHide);
    window.localStorage.setItem('hideReaderGuide', shouldHide.toString());
    onHideGuide(shouldHide);
  };

  if (hideGuide) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-muted-foreground">How to Use</h2>
        <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#F87171] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={hideGuide}
            onChange={handleHideGuideChange}
            className="rounded border-gray-300 text-[#F87171] focus:ring-[#F87171]"
          />
          Never show again
        </label>
      </div>
      <div className="p-6 rounded-xl border-2 bg-background hover:border-[#F87171] transition-all duration-300 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Getting Started with Mokuro OCR</h3>
        <div className="space-y-4">
          <div className="text-muted-foreground bg-red-50/50 p-4 rounded-lg border border-[#F87171]/20">
            <p>We can't lie, this part may be a bit technical but once you do it once you can do it for all your manga! It's simple if you just follow the steps below. We promise it's worth the hassle to be able to read what you want! Even if you're not technically inclined, the process is pretty straight forward.</p>
            <p className="mt-2 text-[#F87171]">Thanks to the developer of mokuro - your tool is amazing! 🙌</p>
          </div>
          <p className="text-muted-foreground">Follow these steps to prepare your manga for reading:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Install Python from <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="text-[#F87171] hover:underline">python.org</a></li>
            <li>During installation, check the box that says: "Add Python to PATH"</li>
            <li>Open a terminal/command prompt</li>
            <li>Install Mokuro by running: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">pip install mokuro</code></li>
            <li>Take your raw manga images and put them in a folder</li>
            <li>Copy the path to the folder</li>
            <li>Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">mokuro /path/to/manga/vol1</code></li>
            <li>Wait for the OCR process to complete</li>
            <li>Upload the folder containing both the images and the .mokuro file here</li>
          </ol>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">For more detailed instructions, visit the <a href="https://github.com/kha-white/mokuro" target="_blank" rel="noopener noreferrer" className="text-[#F87171] hover:underline">Mokuro GitHub page</a></p>
          </div>
        </div>
      </div>
    </section>
  );
} 