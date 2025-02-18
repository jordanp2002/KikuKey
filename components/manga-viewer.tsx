'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { insertMangaLog } from '@/app/actions';
import { Maximize2, Minimize2 } from 'lucide-react';

interface TextBlock {
  text: string;
  box: [number, number, number, number];
  vertical: boolean;
  font_size: number;
  lines: string[];
}

interface Page {
  image: string;
  imageUrl?: string;
  blocks: TextBlock[];
  img_width: number;
  img_height: number;
}

interface MangaViewerProps {
  mokuroData: any;
  images: File[];
  onClose: () => void;
  entryId: string;
  onProgressUpdate: (progress: number) => void;
}

interface ViewerSettings {
  singlePageView: boolean;
  rightToLeft: boolean;
  hasCover: boolean;
  backgroundColor: string;
  invertColors: boolean;
  showPageNumbers: boolean;
  showCharCount: boolean;
}

const textBlockStyles = `
  .manga-text-block {
    color: black;
    padding: 0;
    line-height: 1.1em;
    white-space: nowrap;
    border: 1px solid rgba(0, 0, 0, 0);
    z-index: 11;
    pointer-events: auto;
  }

  .manga-text-block p {
    display: none;
    white-space: nowrap;
    letter-spacing: 0.1em;
    line-height: 1.1em;
    margin: 0;
    background-color: rgb(255, 255, 255);
    z-index: 11;
    user-select: text;
    -webkit-user-select: text;
  }

  .manga-text-block:hover p {
    display: block;
    position: relative;
  }
`;

export function MangaViewer({ mokuroData, images, onClose, entryId, onProgressUpdate }: MangaViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<Page[]>([]);
  const [scale, setScale] = useState(1);
  const [settings, setSettings] = useState<ViewerSettings>({
    singlePageView: false,
    rightToLeft: true,
    hasCover: true,
    backgroundColor: '#000000',
    invertColors: false,
    showPageNumbers: true,
    showCharCount: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<Date | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [watchTime, setWatchTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isContainerFullscreen, setIsContainerFullscreen] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const loadSavedPage = () => {
      if (mokuroData?.pages) {
        try {
          const savedPage = window.localStorage.getItem(`manga-progress-${entryId}`);
          if (savedPage) {
            setCurrentPage(parseInt(savedPage, 10));
          }
        } catch (error) {
          console.error('Error loading saved page:', error);
        }
      }
    };
    loadSavedPage();
  }, [mokuroData, entryId]);
  const saveImmersionTime = async () => {
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
  };

  const handleClose = useCallback(async () => {
    setIsClosing(true);
    setTimeout(async () => {
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

      if (mokuroData?.pages && currentPage > 0) {
        try {
          window.localStorage.setItem(`manga-progress-${entryId}`, currentPage.toString());
          
          const totalPages = mokuroData.pages.length;
          const progress = Math.min(Math.round((currentPage / totalPages) * 100), 100);
          await new Promise<void>((resolve, reject) => {
            const request = window.indexedDB.open('MangaLibraryDB');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction(['manga'], 'readwrite');
              const store = tx.objectStore('manga');
              const getRequest = store.get(entryId);
              
              getRequest.onsuccess = () => {
                const entry = getRequest.result;
                if (entry) {
                  entry.progress = progress;
                  entry.lastRead = Date.now();
                  const putRequest = store.put(entry);
                  putRequest.onsuccess = () => resolve();
                  putRequest.onerror = () => reject(putRequest.error);
                } else {
                  resolve();
                }
              };
              getRequest.onerror = () => reject(getRequest.error);
            };
          });
          
          onProgressUpdate(progress);
        } catch (error) {
          console.error('Error saving progress:', error);
        }
      }
      onClose();
    }, 300); // Match the duration of the exit animation
  }, [currentPage, mokuroData, entryId, onProgressUpdate, onClose, saveImmersionTime]);

  useEffect(() => {
    const savePage = () => {
      if (mokuroData?.pages && currentPage > 0) {
        try {
          window.localStorage.setItem(`manga-progress-${entryId}`, currentPage.toString());
        } catch (error) {
          console.error('Error saving page:', error);
        }
      }
    };
    savePage();
  }, [currentPage, mokuroData, entryId]);
  const toggleContainerFullscreen = () => {
    if (!viewerContainerRef.current) return;
    
    if (!isContainerFullscreen) {
      if (viewerContainerRef.current.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsContainerFullscreen(document.fullscreenElement === viewerContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {

    try {
      console.log('Mokuro Data:', mokuroData);
      console.log('Images:', images);

      if (!mokuroData?.pages || !Array.isArray(mokuroData.pages)) {
        console.error('Invalid mokuro data structure:', mokuroData);
        throw new Error('Invalid mokuro data format');
      }

      if (!images || !Array.isArray(images)) {
        console.error('Invalid images array:', images);
        throw new Error('No images provided');
      }

      pages.forEach(page => {
        if (page.imageUrl) {
          URL.revokeObjectURL(page.imageUrl);
        }
      });

      const processedPages = images.map((image: File, index: number) => {
        const mokuroPage = mokuroData.pages[index] || {};
        const blocks = mokuroPage.blocks || [];
        const processedBlocks = blocks.map((block: any) => ({
          text: block.text || '',
          box: block.box || [0, 0, 0, 0],
          vertical: block.vertical || false,
          font_size: block.font_size || 12,
          lines: block.lines || []
        }));

        return {
          image: image.name,
          blocks: processedBlocks,
          imageUrl: URL.createObjectURL(image),
          img_width: mokuroPage.img_width || 0,
          img_height: mokuroPage.img_height || 0
        };
      });

      if (processedPages.length === 0) {
        console.error('No pages processed');
        throw new Error('No pages found in mokuro data');
      }

      console.log('Processed pages:', processedPages);
      setPages(processedPages);
    } catch (error) {
      console.error('Error processing manga data:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing manga data');
    }
  }, [mokuroData, images]);

  useEffect(() => {
    return () => {
      pages.forEach(page => {
        if (page.imageUrl) {
          URL.revokeObjectURL(page.imageUrl);
        }
      });
    };
  }, [pages]);

  const navigatePage = useCallback((delta: number) => {
    const pageIncrement = settings.singlePageView ? 1 : 2;
    const newPage = currentPage + (delta * pageIncrement);
    if (newPage >= 1 && newPage <= pages.length) {
      setCurrentPage(newPage);
    }
  }, [currentPage, pages.length, settings.singlePageView]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'ArrowLeft':
        navigatePage(1);
        break;
      case 'ArrowRight':
        navigatePage(-1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        navigatePage(-1);
        break;
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        navigatePage(1);
        break;
      case 'Home':
        setCurrentPage(pages.length);
        break;
      case 'End':
        setCurrentPage(1);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  }, [pages.length, navigatePage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = new Date();
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const touchDuration = new Date().getTime() - touchStartRef.current.getTime();

    if (touchDuration < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0) {
        navigatePage(-1);
      } else {
        navigatePage(1);
      }
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = -event.deltaY / 500;
      const newZoom = Math.min(Math.max(1, zoom + delta), 3);
      if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      setZoom(newZoom);
    }
  };

  const getCharCount = (pageIndex: number) => {
    if (!pages[pageIndex]) return 0;
    return pages[pageIndex].blocks.reduce((sum, block) => sum + block.text.length, 0);
  };

  const currentPageIndex = currentPage - 1;
  const showSecondPage = !settings.singlePageView && 
                        currentPage < pages.length && 
                        !(currentPage === 1 && settings.hasCover);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
      startTimeRef.current = Date.now() - (watchTime * 1000); // Adjust start time to maintain elapsed time
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
    const now = Date.now();
    startTimeRef.current = now;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      setWatchTime(elapsed);
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startTimeRef.current !== null) {
        try {
          const now = new Date();
          const startDate = new Date(startTimeRef.current);
          
          const logData = {
            startTime: startDate.toISOString(),
            endTime: now.toISOString(),
            watchTime
          };
          
          localStorage.setItem('pendingMangaLog', JSON.stringify(logData));
          
          saveImmersionTime().then(() => {
            localStorage.removeItem('pendingMangaLog');
          }).catch(error => {
            console.error('Failed to save immersion time on unload:', error);
          });
        } catch (error) {
          console.error('Failed to save backup log:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [watchTime]);
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!pages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        <p className="text-gray-600 mb-4 text-center">
          Please wait while we process the manga data.
        </p>
      </div>
    );
  }

  const currentPageData = pages[currentPageIndex];
  if (!currentPageData?.imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-4">Error Loading Images</h2>
        <p className="text-gray-600 mb-4 text-center">
          Could not load the manga images. Please try reimporting the manga.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  const nextPageData = showSecondPage ? pages[currentPageIndex + 1] : null;

  return (
    <div 
      ref={viewerContainerRef}
      className={`flex flex-col bg-background fixed inset-0 transition-all duration-1000 ease-in-out z-50 transform-gpu ${
        isContainerFullscreen 
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
        ${textBlockStyles}
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
      <div className={`flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-1000 ease-in-out transform-gpu`}
      style={{
        animation: isClosing 
          ? 'header-close 500ms ease-in-out forwards'
          : 'header-open 1000ms ease-in-out forwards'
      }}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigatePage(1)}
            disabled={currentPage >= pages.length}
            className="flex items-center gap-2 min-w-[100px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Next
          </Button>
          <Button
            variant="outline"
            onClick={() => navigatePage(-1)}
            disabled={currentPage === 1}
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
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, singlePageView: !prev.singlePageView }))}
              className={`p-2 hover:text-[#F87171] transition-colors ${
                settings.singlePageView ? 'text-[#F87171]' : ''
              }`}
              title={settings.singlePageView ? "Switch to Double Page" : "Switch to Single Page"}
            >
              {settings.singlePageView ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="12" x="3" y="6" rx="2"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="12" x="3" y="6" rx="2"/>
                  <rect width="7" height="12" x="14" y="6" rx="2"/>
                </svg>
              )}
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
                className="p-1 hover:text-[#F87171] transition-colors"
                title="Submit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </Button>
            </div>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-[120px] hover:text-[#F87171] transition-colors">
              {currentPage} / {pages.length}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={pages.length}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground py-2">
                  of {pages.length}
                </span>
              </div>
              <Slider
                value={[currentPage]}
                min={1}
                max={pages.length}
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
            onClick={toggleContainerFullscreen}
            className="hover:bg-[#F87171] hover:text-white transition-colors"
            title={isContainerFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isContainerFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="hover:bg-[#F87171] hover:text-white transition-colors"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Add floating navigation buttons */}
      <div className="fixed inset-y-0 left-0 flex items-center px-4 pointer-events-none">
        <Button
          variant="outline"
          onClick={() => navigatePage(-1)}
          disabled={currentPage === 1}
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
          onClick={() => navigatePage(1)}
          disabled={currentPage >= pages.length}
          className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Button>
      </div>

      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden bg-black ${
          isClosing 
            ? 'animate-out zoom-out-95 duration-500' 
            : 'animate-in zoom-in-95 duration-1000 delay-300'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: settings.backgroundColor,
          cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <div
          className="flex h-full items-center justify-center select-none"
          style={{
            flexDirection: settings.rightToLeft ? 'row-reverse' : 'row',
            filter: settings.invertColors ? 'invert(1)' : 'none',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          }}
        >
          {/* Current page */}
          <div className="relative h-full select-none">
            <img
              ref={imageRef}
              src={currentPageData.imageUrl}
              alt={`Page ${currentPage}`}
              className="h-full w-auto object-contain select-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{
                pointerEvents: isDragging ? 'none' : 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {currentPageData.blocks.map((block, index) => {
                const blockId = `current-${index}`;
                return (
                  <div
                    key={blockId}
                    className="absolute pointer-events-auto"
                    style={{
                      position: 'absolute',
                      left: `${(block.box[0] / currentPageData.img_width) * 100}%`,
                      top: `${(block.box[1] / currentPageData.img_height) * 100}%`,
                      width: `${((block.box[2] - block.box[0]) / currentPageData.img_width) * 100}%`,
                      height: `${((block.box[3] - block.box[1]) / currentPageData.img_height) * 100}%`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div 
                      className="manga-text-block absolute inset-0"
                      style={{
                        fontSize: `${(block.font_size / currentPageData.img_height) * 100}vh`,
                        writingMode: block.vertical ? 'vertical-rl' : 'horizontal-tb',
                        textOrientation: block.vertical ? 'upright' : 'mixed',
                        pointerEvents: 'auto'
                      }}
                    >
                      {block.lines.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next page */}
          {showSecondPage && nextPageData?.imageUrl && (
            <div className="relative h-full select-none">
              <img
                src={nextPageData.imageUrl}
                alt={`Page ${currentPage + 1}`}
                className="h-full w-auto object-contain select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  pointerEvents: isDragging ? 'none' : 'auto',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              />
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {nextPageData.blocks.map((block, index) => {
                  const blockId = `next-${index}`;
                  return (
                    <div
                      key={blockId}
                      className="absolute pointer-events-auto cursor-pointer"
                      style={{
                        position: 'absolute',
                        left: `${(block.box[0] / nextPageData.img_width) * 100}%`,
                        top: `${(block.box[1] / nextPageData.img_height) * 100}%`,
                        width: `${((block.box[2] - block.box[0]) / nextPageData.img_width) * 100}%`,
                        height: `${((block.box[3] - block.box[1]) / nextPageData.img_height) * 100}%`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <div 
                        className="manga-text-block absolute inset-0"
                        style={{
                          fontSize: `${(block.font_size / nextPageData.img_height) * 100}vh`,
                          writingMode: block.vertical ? 'vertical-rl' : 'horizontal-tb',
                          textOrientation: block.vertical ? 'upright' : 'mixed',
                        }}
                      >
                        {block.lines.map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {settings.showCharCount && (
          <div className="absolute top-4 left-4 text-white text-sm mix-blend-difference">
            Characters: {getCharCount(currentPageIndex)}
            {showSecondPage && nextPageData && ` + ${getCharCount(currentPageIndex + 1)}`}
          </div>
        )}
      </div>
    </div>
  );
} 