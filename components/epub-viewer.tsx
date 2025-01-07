'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ePub, { Book, Rendition, Contents } from 'epubjs';
import { Maximize2, Minimize2 } from 'lucide-react';
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

  // Start immersion timer immediately
  useEffect(() => {
    console.log('Starting immersion timer');
    const now = Date.now();
    startTimeRef.current = now;
    setIsPaused(false);
    
    const startTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        if (startTimeRef.current !== null && !isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setWatchTime(elapsed);
        }
      }, 1000);
    };

    startTimer();

    return () => {
      if (startTimeRef.current !== null) {
        saveImmersionTime().catch(error => {
          console.error('Failed to save immersion time on unmount:', error);
        });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty dependency array to only run on mount/unmount

  // Helper function to format duration
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
            // Handle both relative and absolute paths
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

            // Update progress in IndexedDB
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

        // Generate locations for the entire book
        try {
          console.log('Generating locations...');
          await newBook.locations.generate(1024);
          console.log('Locations generated, total:', newBook.locations.total);
          setTotalPages(newBook.locations.total);
        } catch (error) {
          console.error('Error generating locations:', error);
          setTotalPages(100);
        }
        
        // Display first page and load saved progress after locations are generated
        try {
          const savedProgress = window.localStorage.getItem(`epub-progress-${file.name}`);
          if (savedProgress) {
            // Verify the saved location is valid before trying to display it
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

      } catch (error) {
        console.error('Error initializing EPUB reader:', error);
        toast.error('Failed to load EPUB file');
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
    
    // Load the section content
    const content = await section.load();
    const doc = content.ownerDocument;
    const body = doc.body;
    
    // Get the last element in the section
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
      const currentLocation = rendition.location?.start?.href;
      if (!currentLocation || !book.spine?.spineItems) return;

      const currentIndex = book.spine.spineItems.findIndex(item => item.href === currentLocation);
      if (currentIndex === -1) return;

      if (isRTL) {
        const atStartOfSection = rendition.location?.start?.displayed?.page === 1;
        
        if (atStartOfSection && currentIndex > 0) {
          // Get the previous section
          const prevSection = await book.spine.get(book.spine.spineItems[currentIndex - 1].href);
          const lastCfi = await getLastCfiOfSection(prevSection);
          
          if (lastCfi) {
            await rendition.display(lastCfi);
          } else {
            await rendition.display(book.spine.spineItems[currentIndex - 1].href);
          }
        } else {
          await rendition.prev();
        }
      } else {
        // Try to move to next page, if at end of section move to next section
        const atEndOfSection = rendition.location?.start?.displayed?.page === rendition.location?.start?.displayed?.total;
        
        if (atEndOfSection && currentIndex < book.spine.spineItems.length - 1) {
          await rendition.display(book.spine.spineItems[currentIndex + 1].href);
        } else {
          await rendition.next();
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [rendition, isRTL, book]);

  const handleNextPage = useCallback(async () => {
    if (!rendition || !book) return;

    try {
      const currentLocation = rendition.location?.start?.href;
      if (!currentLocation || !book.spine?.spineItems) return;

      const currentIndex = book.spine.spineItems.findIndex(item => item.href === currentLocation);
      if (currentIndex === -1) return;

      if (isRTL) {
        // Try to move to next page, if at end of section move to next section
        const atEndOfSection = rendition.location?.start?.displayed?.page === rendition.location?.start?.displayed?.total;
        
        if (atEndOfSection && currentIndex < book.spine.spineItems.length - 1) {
          await rendition.display(book.spine.spineItems[currentIndex + 1].href);
        } else {
          await rendition.next();
        }
      } else {
        // Try to move to previous page, if at start of section move to previous section
        const atStartOfSection = rendition.location?.start?.displayed?.page === 1;
        
        if (atStartOfSection && currentIndex > 0) {
          const prevSection = await book.spine.get(book.spine.spineItems[currentIndex - 1].href);
          const lastCfi = await getLastCfiOfSection(prevSection);
          
          if (lastCfi) {
            await rendition.display(lastCfi);
          } else {
            await rendition.display(book.spine.spineItems[currentIndex - 1].href);
          }
        } else {
          await rendition.prev();
        }
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
  const saveImmersionTime = async () => {
    if (startTimeRef.current === null) return;
    
    const now = new Date();
    const startDate = new Date(startTimeRef.current);
    
    try {
      const result = await insertMangaLog(
        startDate.toISOString(),
        now.toISOString()
      );

      if (result.error) {
        if (result.error.message?.includes('auth')) {
          toast.error('Please sign in to track your reading progress');
        } else {
          toast.error('Failed to save reading progress');
        }
      } else {
        toast.success('Reading progress saved');
      }
    } catch (error) {
      console.error('Failed to log reading session:', error);
      toast.error('Failed to save reading progress');
    }
  };

  const handlePauseImmersion = () => {
    if (!isPaused && startTimeRef.current !== null) {
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPaused(true);
    } else if (isPaused && startTimeRef.current !== null) {
      // Resume the timer
      startTimeRef.current = Date.now() - (watchTime * 1000);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setWatchTime(elapsed);
      }, 1000);
      setIsPaused(false);
    }
  };

  const handleManualSubmit = async () => {
    if (startTimeRef.current !== null) {
      await saveImmersionTime();
      // Reset all timers and states
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      setWatchTime(0);
      setIsPaused(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        // Cleanup book instance
        if (book) {
          book.destroy();
        }
        // Cleanup timers
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Cleanup data
        cleanupEpubData().catch(error => {
          console.error('Error cleaning up epub data on unmount:', error);
        });
      } catch (error) {
        console.error('Error during component cleanup:', error);
      }
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
  const handleClose = async () => {
    try {
      if (book) {
        book.destroy();
      }

      if (startTimeRef.current !== null) {
        try {
          await saveImmersionTime();
        } catch (error) {
          console.error('Failed to save immersion time on close:', error);
        }
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
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[90vh] w-full rounded-xl border-8 border-[#F87171]'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevPageClick}
            disabled={currentPage === 1 || isNavigating}
            className="flex items-center gap-2 min-w-[100px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Next
          </Button>
          <Button
            variant="outline"
            onClick={handleNextPageClick}
            disabled={currentPage >= totalPages || isNavigating}
            className="flex items-center gap-2 min-w-[100px]"
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
              className="text-sm hover:text-[#F87171] transition-colors"
            >
              Contents
            </Button>
            <span className="text-muted-foreground">
              Immersion time: {formatDuration(watchTime)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseImmersion}
                disabled={startTimeRef.current === null}
                className={`p-1 hover:text-[#F87171] transition-colors ${
                  isPaused ? 'text-[#F87171]' : ''
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
                className="p-1 hover:bg-[#F87171] hover:text-white transition-colors"
                title="Submit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'sepia' | 'dark')}
              className="bg-transparent border rounded px-2 py-1"
            >
              <option value="light">Light</option>
              <option value="sepia">Sepia</option>
              <option value="dark">Dark</option>
            </select>
            <div className="flex items-center gap-2">
              <Label>Font Size</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => setFontSize(value)}
                min={50}
                max={200}
                step={10}
                className="w-32"
              />
            </div>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-[120px] hover:text-[#F87171] transition-colors">
              {currentPage} / {totalPages}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
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
                onValueChange={([value]) => setCurrentPage(value)}
                className="[&>[role=slider]]:bg-[#F87171]"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            className="hover:text-[#F87171] transition-colors"
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
            className="hover:text-[#F87171] transition-colors"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <div ref={viewerRef} className="absolute inset-0" />
      </div>

      {/* Floating navigation buttons */}
      <div className="fixed inset-y-0 left-0 flex items-center px-4 pointer-events-none">
        <Button
          variant="outline"
          onClick={handlePrevPageClick}
          disabled={currentPage === 1 || isNavigating}
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
          onClick={handleNextPageClick}
          disabled={currentPage >= totalPages || isNavigating}
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