'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MangaViewer } from '@/components/manga-viewer';
import { EpubViewer } from '@/components/epub-viewer';
import { BackButton } from '@/components/ui/back-button';
import { ContentUploader } from '@/components/content-uploader';
import { LibraryGrid } from '@/components/library-grid';
import { ReaderGuide } from '@/components/reader-guide';

interface MangaEntry {
  id: string;
  title: string;
  type: 'manga' | 'epub';
  mokuroData?: {
    version: string;
    pages: Array<{
      blocks: Array<{
        text: string;
        box: [number, number, number, number];
        vertical: boolean;
        font_size: number;
        lines: string[];
      }>;
      img_width: number;
      img_height: number;
    }>;
  };
  epubFile?: File;
  images?: File[];
  coverImage?: string;
  lastRead: number;
  dateAdded: number;
  progress: number;
}
const DB_NAME = 'MangaLibraryDB';
let DB_VERSION = 2;
const getCurrentDBVersion = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const version = request.result.version;
      request.result.close();
      resolve(version);
    };
  });
};

export default function ReaderPage() {
  const [library, setLibrary] = useState<MangaEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MangaEntry | null>(null);
  const [hideGuide, setHideGuide] = useState(false);
  const handleProgressUpdate = useCallback((progress: number) => {
    if (selectedEntry) {
      setLibrary(prevLibrary => 
        prevLibrary.map(entry => 
          entry.id === selectedEntry.id
            ? { ...entry, progress, lastRead: Date.now() }
            : entry
        )
      );
    }
  }, [selectedEntry]);

  const loadLibrary = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['manga'], 'readonly');
      const store = transaction.objectStore('manga');
      const request = store.getAll();

      request.onsuccess = () => {
        library.forEach(entry => {
          if (entry.coverImage) {
            URL.revokeObjectURL(entry.coverImage);
          }
          if (entry.type === 'manga' && entry.images) {
            entry.images.forEach(image => {
              if ('imageUrl' in image) {
                URL.revokeObjectURL((image as any).imageUrl);
              }
            });
          }
        });
        const loadedEntries = request.result.map((entry: MangaEntry) => {
          if (entry.type === 'manga' && entry.images && entry.images.length > 0) {
            entry.coverImage = URL.createObjectURL(entry.images[0]);
          }
          return entry;
        });

        setLibrary(loadedEntries);
      };
    } catch (error) {
      console.error('Error loading library:', error);
      toast.error('Failed to load library');
    }
  }, [library]);

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('manga')) {
          db.close();
          reject(new Error('Manga store not found'));
          return;
        }
        resolve(db);
      };
    });
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await loadLibrary();
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error closing viewer:', error);
      toast.error('Failed to update progress');
    }
  }, [loadLibrary]);

  useEffect(() => {
    const init = async () => {
      try {
        DB_VERSION = await getCurrentDBVersion();
        await initializeDB();
        await loadLibrary();
      } catch (error) {
        console.error('Failed to initialize:', error);
        toast.error('Failed to initialize manga library');
      }
    };
    init();
  }, []);

  const initializeDB = async () => {
    return new Promise<void>((resolve, reject) => {
      const checkRequest = indexedDB.open(DB_NAME);
      
      checkRequest.onsuccess = () => {
        const db = checkRequest.result;
        DB_VERSION = Math.max(db.version, 1);
        db.close();
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.error('Database error:', event);
          toast.error('Failed to initialize database');
          reject(new Error('Failed to initialize database'));
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('manga')) {
            db.createObjectStore('manga', { keyPath: 'id' });
          }
          if (event.oldVersion < 2) {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
              const store = transaction.objectStore('manga');
              store.openCursor().onsuccess = function(e) {
                const cursor = (e.target as IDBRequest).result;
                if (cursor) {
                  const manga = cursor.value;
                  if (manga.mokuroData && typeof manga.mokuroData === 'object') {
                    const structuredMokuroData = {
                      version: manga.mokuroData.version || '1.0',
                      pages: (manga.mokuroData.pages || []).map((page: any) => ({
                        blocks: (page.blocks || []).map((block: any) => ({
                          text: block.text || '',
                          box: block.box || [0, 0, 0, 0],
                          vertical: block.vertical || false,
                          font_size: block.font_size || 12,
                          lines: block.lines || []
                        })),
                        img_width: page.img_width || 0,
                        img_height: page.img_height || 0
                      }))
                    };
                    manga.mokuroData = structuredMokuroData;
                    cursor.update(manga);
                  }
                  cursor.continue();
                }
              };
            }
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('manga')) {
            db.close();
            const reopenRequest = indexedDB.open(DB_NAME, db.version + 1);
            reopenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
              const newDb = (event.target as IDBOpenDBRequest).result;
              newDb.createObjectStore('manga', { keyPath: 'id' });
            };
            reopenRequest.onsuccess = () => {
              DB_VERSION = reopenRequest.result.version;
              reopenRequest.result.close();
              resolve();
            };
            reopenRequest.onerror = () => {
              reject(new Error('Failed to create manga store'));
            };
          } else {
            db.close();
            resolve();
          }
        };
      };

      checkRequest.onerror = () => {
        reject(new Error('Failed to check database version'));
      };
    });
  };

  const handleDeleteManga = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const mangaToDelete = library.find(manga => manga.id === id);
      if (mangaToDelete?.type === 'manga') {
        if (mangaToDelete.coverImage) {
          URL.revokeObjectURL(mangaToDelete.coverImage);
        }
        if (mangaToDelete.images) {
          mangaToDelete.images.forEach(image => {
            if ('imageUrl' in image) {
              URL.revokeObjectURL((image as any).imageUrl);
            }
          });
        }
      }
      const db = await openDB();
      const transaction = db.transaction(['manga'], 'readwrite');
      const store = transaction.objectStore('manga');
      await store.delete(id);
      setLibrary(prevLibrary => prevLibrary.filter(manga => manga.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }

      toast.success('Item removed from library');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };
  useEffect(() => {
    return () => {
      library.forEach(entry => {
        if (entry.type === 'manga') {
          if (entry.coverImage) {
            URL.revokeObjectURL(entry.coverImage);
          }
          if (entry.images) {
            entry.images.forEach(image => {
              if ('imageUrl' in image) {
                URL.revokeObjectURL((image as any).imageUrl);
              }
            });
          }
        }
      });
    };
  }, [library]);

  return (
    <div className="flex-1 w-full flex flex-col gap-4 max-w-7xl mx-auto p-4">
      <BackButton />
      
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-4xl font-bold tracking-tight">Reader</h1>
        <div className="h-1 w-12 rounded-full bg-[#F87171]" />
      </div>
      
      <div className="space-y-4">
        {/* Guide Section */}
        <ReaderGuide onHideGuide={setHideGuide} />

        {/* Library Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-muted-foreground">Your Library</h2>
            <ContentUploader onUploadComplete={loadLibrary} openDB={openDB} />
          </div>
          <LibraryGrid 
            entries={library}
            onEntrySelect={setSelectedEntry}
            onEntryDelete={handleDeleteManga}
          />
        </section>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl w-full max-w-6xl h-[90vh] border-2 border-[#F87171]">
            {selectedEntry.type === 'manga' && selectedEntry.mokuroData && selectedEntry.images ? (
              <MangaViewer
                mokuroData={selectedEntry.mokuroData}
                images={selectedEntry.images}
                onClose={handleClose}
                entryId={selectedEntry.id}
                onProgressUpdate={handleProgressUpdate}
              />
            ) : selectedEntry.type === 'epub' && selectedEntry.epubFile ? (
              <EpubViewer
                file={selectedEntry.epubFile}
                onClose={handleClose}
                openDB={openDB}
                entryId={selectedEntry.id}
                onProgressUpdate={handleProgressUpdate}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
