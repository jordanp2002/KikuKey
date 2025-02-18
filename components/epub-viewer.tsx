'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ePub, { Book, Rendition, Contents } from 'epubjs';
import { Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { insertMangaLog } from '@/app/actions';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface NavItem {
  id: string;
  href: string;
  label: string;
  subitems?: NavItem[];
}

interface EpubViewerProps {
  file: File;
  onClose: () => void;
  openDB: () => Promise<IDBDatabase>;
  entryId: string;
  onProgressUpdate: (progress: number) => void;
}

export function EpubViewer({ file, onClose, openDB, entryId, onProgressUpdate }: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(100);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isRTL, setIsRTL] = useState<boolean>(true);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [navigation, setNavigation] = useState<NavItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locations, setLocations] = useState<any>(null);

  const [watchTime, setWatchTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isNavigating, setIsNavigating] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isClosing, setIsClosing] = useState(false);

  const saveImmersionTime = useCallback(async () => {
    if (startTimeRef.current === null) return;
    
    const now = new Date();
    const startDate = new Date(startTimeRef.current);
    
    try {
      const result = await insertMangaLog(
        startDate.toISOString(),
        now.toISOString()
      );

      if (result?.error) {
        if (result.error.message?.includes('auth')) {
          toast.error('Please sign in to track your reading progress');
        } else {
          toast.error('Failed to save reading progress');
        }
      } else if (!result) {
        toast.error('Failed to save reading progress');
      } else {
        toast.success('Reading progress saved');
      }
    } catch (error) {
      console.error('Failed to log reading session:', error);
      toast.error('Failed to save reading progress');
    }
  }, []);

  useEffect(() => {
    if (!startTimeRef.current) {
      console.log('Starting immersion timer');
      startTimeRef.current = Date.now();
    }
    
    const startTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (!isPaused) {
        timerRef.current = setInterval(() => {
          if (startTimeRef.current !== null) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setWatchTime(elapsed);
          }
        }, 1000);
      }
    };

    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  const cleanupEpubData = useCallback(async () => {
    try {
      localStorage.removeItem('pendingMangaLog');
    } catch (error) {
      console.error('Error cleaning up epub data:', error);
    }
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    const initializeReader = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const newBook = ePub(arrayBuffer);
        if (!newBook.isOpen) {
          await newBook.opened;
        }
        
        await newBook.loaded.package;
        
        setBook(newBook);
        await Promise.all([
          newBook.loaded.navigation,
          newBook.loaded.metadata,
          newBook.loaded.spine,
          newBook.loaded.resources,  
        ]);

        const newRendition = newBook.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          manager: 'default',
          allowScriptedContent: true
        });

        newRendition.hooks.content.register((contents: Contents) => {
          const body = contents.document.body;
          const images = body.querySelectorAll('img');
          
          images.forEach(img => {
            if (img.src && !img.src.startsWith('blob:')) {
              const originalSrc = img.src;
              const srcAttribute = img.getAttribute('src');
            
              const loadImage = async () => {
                try {
                  if (srcAttribute) {
                    let resolvedUrl = '';
                    try {
                      resolvedUrl = newBook.resolve(srcAttribute);
                    } catch (error) {
                      console.warn('Direct resolve failed:', error);
                    }
                    
                    if (!resolvedUrl && contents.baseUri) {
                      try {
                        const base = new URL(contents.baseUri);
                        resolvedUrl = new URL(srcAttribute, base).href;
                      } catch (error) {
                        console.warn('Base URL resolve failed:', error);
                      }
                    }

                    if (!resolvedUrl) {
                      const spineItem = book?.spine?.spineItems.find(item => 
                        item.href.includes(srcAttribute) || srcAttribute.includes(item.href)
                      );
                      if (spineItem) {
                        resolvedUrl = spineItem.url;
                      }
                    }
                    
                    if (resolvedUrl) {
                      img.src = resolvedUrl;
                      console.log('Image resolved successfully:', resolvedUrl);
                    } else {
                      console.error('Failed to resolve image:', srcAttribute);
                    }
                  }
                } catch (error) {
                  console.error('Error loading image:', error);
                }
              };

              img.onerror = () => {
                console.warn('Image failed to load:', originalSrc);
                loadImage();
              };
              loadImage();
            }
          });
        });

        newRendition.themes.register('light', { body: { background: '#ffffff', color: '#000000' }});
        newRendition.themes.register('sepia', { body: { background: '#f4ecd8', color: '#5f4b32' }});
        newRendition.themes.register('dark', { body: { background: '#2d2d2d', color: '#ffffff' }});
        newRendition.themes.select(theme);

        newRendition.themes.fontSize(`${fontSize}%`);

        setRendition(newRendition);

        const nav = await newBook.loaded.navigation;
        if (nav && nav.toc) {
          const toc = nav.toc.map((item: NavItem) => ({
            id: item.id,
            href: item.href,
            label: item.label,
            subitems: item.subitems?.map((subitem: NavItem) => ({
              id: subitem.id,
              href: subitem.href,
              label: subitem.label
            }))
          }));
          setNavigation(toc);
        }

        newRendition.on('relocated', (location: any) => {
          try {
            setCurrentLocation(location.start.cfi);
            const currentLoc = newBook.locations?.locationFromCfi(location.start.cfi) ?? 0;
            setCurrentPage(currentLoc + 1);
            const totalLocations = newBook.locations?.total ?? 100;
            const progress = Math.min(Math.round(((currentLoc + 1) / totalLocations) * 100), 100);
          
            window.localStorage.setItem(`epub-progress-${file.name}`, location.start.cfi);
            window.localStorage.setItem(`epub-progress-percent-${file.name}`, progress.toString());

            const updateProgress = async () => {
              try {
                const db = await openDB();
                const tx = db.transaction(['manga'], 'readwrite');
                const store = tx.objectStore('manga');
                const request = store.get(entryId);
                
                request.onsuccess = () => {
                  const entry = request.result;
                  if (entry) {
                    entry.progress = progress;
                    entry.lastRead = Date.now();
                    store.put(entry);
                    onProgressUpdate(progress);
                  }
                };
              } catch (error) {
                console.error('Error updating progress:', error);
              }
            };
            updateProgress();
          } catch (error) {
            console.error('Error handling location change:', error);
          }
        });

        try {
          console.log('Generating locations...');
          await newBook.locations.generate(1024);
          console.log('Locations generated, total:', newBook.locations.total);
          setTotalPages(newBook.locations.total);
        } catch (error) {
          console.error('Error generating locations:', error);
          setTotalPages(100);
        }
        
        
        try {
          const savedProgress = window.localStorage.getItem(`epub-progress-${file.name}`);
          if (savedProgress) {
            try {
              await newBook.spine.get(savedProgress);
              await newRendition.display(savedProgress);
            } catch (locationError) {
              console.warn('Invalid saved location, starting from beginning:', locationError);
              await newRendition.display();
            }
          } else {
            await newRendition.display();
          }
        } catch (error) {
          console.error('Error displaying page:', error);
          try {
            await newRendition.display();
          } catch (displayError) {
            console.error('Failed to display fallback page:', displayError);
            toast.error('Failed to load book content. Please try reopening the book.');
          }
        }

        if (isRTL) {
          newRendition.themes.default({
            body: {
              "writing-mode": "vertical-rl",
              "-webkit-writing-mode": "vertical-rl",
              "-epub-writing-mode": "vertical-rl",
              "text-orientation": "upright"
            }
          });
        } else {
          newRendition.themes.default({
            body: {
              "writing-mode": "horizontal-tb",
              "-webkit-writing-mode": "horizontal-tb",
              "-epub-writing-mode": "horizontal-tb"
            }
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing EPUB reader:', error);
        toast.error('Failed to load EPUB file');
        setIsLoading(false);
      }
    };

    initializeReader();

    return () => {
      if (book) {
        book.destroy();
      }
    };
  }, [file, isRTL, theme, fontSize, openDB, entryId, onProgressUpdate]);

  useEffect(() => {
    if (!rendition) return;

    if (isRTL) {
      rendition.themes.default({
        body: {
          "writing-mode": "vertical-rl",
          "-webkit-writing-mode": "vertical-rl",
          "-epub-writing-mode": "vertical-rl",
          "text-orientation": "upright"
        }
      });
    } else {
      rendition.themes.default({
        body: {
          "writing-mode": "horizontal-tb",
          "-webkit-writing-mode": "horizontal-tb",
          "-epub-writing-mode": "horizontal-tb"
        }
      });
    }
  }, [isRTL, rendition]);

  useEffect(() => {
    if (!rendition) return;

    rendition.themes.select(theme);
  }, [theme, rendition]);

  useEffect(() => {
    if (!rendition) return;

    rendition.themes.fontSize(`${fontSize}%`);
  }, [fontSize, rendition]);

  const getLastCfiOfSection = async (section: any) => {
    if (!rendition) return null;
    
    const content = await section.load();
    const doc = content.ownerDocument;
    const body = doc.body;
    
    let lastElement = body.lastChild;
    while (lastElement && lastElement.nodeType !== 1) {
      lastElement = lastElement.previousSibling;
    }
    
    if (lastElement) {
      return section.cfiFromElement(lastElement);
    }
    return null;
  };

  const handlePrevPage = useCallback(async () => {
    if (!rendition || !book) return;

    try {
      if (isRTL) {
        await rendition.prev();
      } else {
        await rendition.next();
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [rendition, isRTL, book]);

  const handleNextPage = useCallback(async () => {
    if (!rendition || !book) return;

    try {
      if (isRTL) {
        await rendition.next();
      } else {
        await rendition.prev();
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [rendition, isRTL, book]);

  const handleNavigate = useCallback((href: string) => {
    if (rendition) {
      rendition.display(href);
      setShowToc(false);
    }
  }, [rendition]);

  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (isNavigating) {
        return;
      }

      try {
        setIsNavigating(true);
        if (e.key === 'ArrowLeft') {
          await handleNextPage();
        } else if (e.key === 'ArrowRight') {
          await handlePrevPage();
        }
      } finally {
        setIsNavigating(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRTL, handlePrevPage, handleNextPage, isNavigating]);

  useEffect(() => {
    const handleResize = () => {
      if (rendition) {
        rendition.resize(
          viewerRef.current?.clientWidth || window.innerWidth,
          viewerRef.current?.clientHeight || window.innerHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [rendition]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (rendition) {
        setTimeout(() => {
          rendition.resize(
            viewerRef.current?.clientWidth || window.innerWidth,
            viewerRef.current?.clientHeight || window.innerHeight
          );
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [rendition]);

  const handlePauseImmersion = () => {
    if (!isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
    } else {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setWatchTime(0);
      } else {
        const elapsedSeconds = watchTime;
        startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      }
      setIsPaused(false);
    }
  };

  const handleManualSubmit = async () => {
    if (startTimeRef.current !== null) {
      await saveImmersionTime();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      setWatchTime(0);
      setIsPaused(true);
    }
  };

  useEffect(() => {
    return () => {
      if (book) {
        book.destroy();
      }
      cleanupEpubData().catch(error => {
        console.error('Error cleaning up epub data on unmount:', error);
      });
    };
  }, [book, cleanupEpubData]);

  const handlePrevPageClick = useCallback(async () => {
    if (isNavigating) return;
    try {
      setIsNavigating(true);
      await handlePrevPage();
    } finally {
      setIsNavigating(false);
    }
  }, [handlePrevPage, isNavigating]);

  const handleNextPageClick = useCallback(async () => {
    if (isNavigating) return;
    try {
      setIsNavigating(true);
      await handleNextPage();
    } finally {
      setIsNavigating(false);
    }
  }, [handleNextPage, isNavigating]);
  const handleClose = useCallback(async () => {
    setIsClosing(true);
    setTimeout(async () => {
      try {
        if (book) {
          book.destroy();
        }

        if (startTimeRef.current !== null) {
          await saveImmersionTime();
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          startTimeRef.current = null;
          setWatchTime(0);
          setIsPaused(false);
        }
        await cleanupEpubData();
        onClose();
      } catch (error) {
        console.error('Error during cleanup:', error);
        onClose();
      }
    }, 300); // Match the duration of the exit animation
  }, [book, cleanupEpubData, onClose, saveImmersionTime]);

  const handlePageChange = useCallback(async (newPage: number) => {
    if (!rendition || !book || !book.spine || newPage < 1 || newPage > totalPages) return;
    
    try {
      setIsNavigating(true);
      const spineIndex = Math.floor((newPage - 1) / totalPages * book.spine.spineItems.length);
      const spineItem = book.spine.spineItems[spineIndex];
      if (spineItem) {
        await rendition.display(spineItem.href);
        setCurrentPage(newPage);
      }
    } catch (error) {
      console.error('Error navigating to page:', error);
    } finally {
      setIsNavigating(false);
    }
  }, [rendition, book, totalPages]);

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-background fixed inset-0 transition-all duration-1000 ease-in-out z-50 transform-gpu ${
        isFullscreen 
          ? '' 
          : 'h-[95vh] max-w-[95vw] w-[95vw] m-auto inset-0 rounded-xl border-8 border-[#F87171] overflow-hidden'
      }`}
      style={{
        animation: isClosing 
          ? 'viewer-close 500ms ease-in-out forwards'
          : 'viewer-open 1000ms ease-in-out forwards'
      }}
    >
      <style>{`
        @keyframes viewer-open {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(2rem);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes viewer-close {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(2rem);
          }
        }
        @keyframes header-open {
          0% {
            opacity: 0;
            transform: translateY(-2rem);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes header-close {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-2rem);
          }
        }
      `}</style>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 bg-[#111827] border-b border-[#F87171]/20 shadow-lg transition-all duration-1000 ease-in-out transform-gpu`}
      style={{
        animation: isClosing 
          ? 'header-close 500ms ease-in-out forwards'
          : 'header-open 1000ms ease-in-out forwards'
      }}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleNextPageClick}
            disabled={isNavigating}
            className="flex items-center gap-2 min-w-[100px] bg-[#1f2937] hover:bg-[#374151] hover:text-[#F87171] hover:border-[#F87171] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Next
          </Button>
          <Button
            variant="outline"
            onClick={handlePrevPageClick}
            disabled={isNavigating}
            className="flex items-center gap-2 min-w-[100px] bg-[#1f2937] hover:bg-[#374151] hover:text-[#F87171] hover:border-[#F87171] transition-all"
          >
            Previous
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowToc(true)}
              className="text-sm bg-[#1f2937] hover:text-[#F87171] hover:bg-[#374151] transition-all"
            >
              Contents
            </Button>
            <span className="text-muted-foreground">
              Time: {formatDuration(watchTime)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseImmersion}
                disabled={startTimeRef.current === null}
                className={`p-1 hover:bg-[#374151] hover:text-[#F87171] transition-all ${
                  isPaused ? 'text-[#F87171] bg-[#1f2937]' : ''
                }`}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSubmit}
                disabled={startTimeRef.current === null}
                className="p-1 hover:bg-[#F87171] hover:text-white transition-all bg-[#1f2937]"
                title="Submit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </Button>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:text-[#FFFFFF] bg-[#1f2937] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="ml-2">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#111827]">
              <div className="flex flex-col gap-4 p-2">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'sepia' | 'dark')}
                    className="w-full bg-transparent border rounded px-2 py-1 focus:border-[#F87171] bg-[#1f2937] focus:ring-[#F87171] hover:border-[#F87171] transition-colors"
                  >
                    <option value="light">Light</option>
                    <option value="sepia">Sepia</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Font Size: {fontSize}%</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => setFontSize(value)}
                    min={50}
                    max={200}
                    step={10}
                    className="w-full [&>[role=slider]]:bg-[#F87171] [&>[role=slider]]:border-[#F87171] [&>[role=slider]]:hover:bg-[#F87171]/90 [&_[data-orientation=horizontal]]:bg-[#F87171]/20"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:text-[#FFFFFF] bg-[#1f2937] transition-colors">
              {currentPage} / {totalPages}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#111827]">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="focus:border-[#F87171] focus:ring-[#F87171] hover:border-[#F87171] transition-colors"
                />
                <span className="text-sm text-muted-foreground py-2">
                  of {totalPages}
                </span>
              </div>
              <Slider
                value={[currentPage]}
                min={1}
                max={totalPages}
                step={1}
                onValueChange={([value]) => handlePageChange(value)}
                className="[&>[role=slider]]:bg-[#F87171] [&>[role=slider]]:border-[#F87171] [&>[role=slider]]:hover:bg-[#F87171]/90 [&_[data-orientation=horizontal]]:bg-[#F87171]/20"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            className="bg-[#1f2937] hover:bg-[#374151] hover:text-[#F87171] hover:border-[#F87171] transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="bg-[#1f2937] hover:bg-[#374151] hover:text-[#F87171] transition-all"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 relative ${
        isClosing 
          ? 'animate-out zoom-out-95 duration-200' 
          : 'animate-in zoom-in-95 duration-500 delay-150'
      }`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/80 z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#F87171]" />
              <p className="text-sm text-muted-foreground">Loading book...</p>
            </div>
          </div>
        )}
        <div ref={viewerRef} className="absolute inset-0" />
      </div>

      {/* Floating navigation buttons */}
      <div className="fixed inset-y-0 left-0 flex items-center px-4 pointer-events-none">
        <Button
          variant="outline"
          onClick={handleNextPageClick}
          disabled={isNavigating}
          className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Button>
      </div>
      <div className="fixed inset-y-0 right-0 flex items-center px-4 pointer-events-none">
        <Button
          variant="outline"
          onClick={handlePrevPageClick}
          disabled={isNavigating}
          className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Button>
      </div>

      {/* Table of Contents Popup */}
      {showToc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowToc(false)}>
          <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Table of Contents</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowToc(false)}
                className="hover:bg-red-50 hover:text-red-500"
              >
                ×
              </Button>
            </div>
            <div className="space-y-2">
              {navigation.map((item) => (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className="text-left hover:text-[#F87171] transition-colors w-full py-1"
                  >
                    {item.label}
                  </button>
                  {item.subitems && (
                    <div className="pl-4 space-y-1">
                      {item.subitems.map((subitem) => (
                        <button
                          key={subitem.id}
                          onClick={() => handleNavigate(subitem.href)}
                          className="text-left text-sm text-muted-foreground hover:text-[#F87171] transition-colors w-full py-1"
                        >
                          {subitem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 