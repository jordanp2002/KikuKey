import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ePub from 'epubjs';
import { Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DownloadProgress {
  completed: number;
  total: number;
  message: string;
}

interface ContentUploaderProps {
  onUploadComplete: () => void;
  openDB: () => Promise<IDBDatabase>;
}

export function ContentUploader({ onUploadComplete, openDB }: ContentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [viewMode, setViewMode] = useState<'manga' | 'epub'>('manga');
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      toast.error('No files selected');
      return;
    }

    if (viewMode === 'manga') {
      await handleMangaUpload(files);
    } else {
      await handleEpubUpload(files);
    }
  };

  const handleMangaUpload = async (files: FileList) => {
    console.log('Files received:', Array.from(files).map(f => f.name));

    const mokuroFile = Array.from(files).find(file => file.name.endsWith('.mokuro'));
    if (!mokuroFile) {
      toast.error('Please upload a .mokuro file');
      return;
    }

    console.log('Found mokuro file:', mokuroFile.name);

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && !file.webkitRelativePath.includes('__MACOSX')
    );

    console.log('Found image files:', imageFiles.map(f => f.name));

    if (imageFiles.length === 0) {
      toast.error('Please include image files');
      return;
    }

    setIsUploading(true);
    setDownloadProgress({
      completed: 0,
      total: imageFiles.length + 1,
      message: 'Processing files...'
    });

    try {
      console.log('Reading mokuro file...');
      const mokuroData = await mokuroFile.text();
      console.log('Mokuro data received, parsing...');
      const parsedData = JSON.parse(mokuroData);
      console.log('Mokuro data parsed:', {
        version: parsedData.version,
        pageCount: parsedData.pages?.length
      });

      if (!parsedData.pages || !Array.isArray(parsedData.pages)) {
        throw new Error('Invalid mokuro file format: missing pages array');
      }

      // Extract page numbers from filenames
      const getPageNumber = (filename: string) => {
        const matches = filename.match(/\d+/g);
        return matches ? parseInt(matches[matches.length - 1]) : 0;
      };

      // Sort image files by page number
      const sortedImages = [...imageFiles].sort((a, b) => {
        const aNum = getPageNumber(a.name);
        const bNum = getPageNumber(b.name);
        return aNum - bNum;
      });

      console.log('Sorted images:', sortedImages.map(img => ({
        name: img.name,
        pageNum: getPageNumber(img.name)
      })));

      // Create cover image URL from the first image
      const coverImageUrl = URL.createObjectURL(sortedImages[0]);

      // Map images to mokuro pages in order
      const mappedImages = parsedData.pages.map((_: any, index: number) => {
        if (index >= sortedImages.length) {
          console.warn(`Missing image for page ${index + 1}`);
          return sortedImages[0]; // Fallback to first image
        }
        return sortedImages[index];
      });

      // Validate that we have all images
      if (mappedImages.some((img: File | undefined) => !img)) {
        throw new Error('Some pages are missing their corresponding images');
      }

      // Validate and structure mokuro data
      const structuredMokuroData = {
        version: parsedData.version || '1.0',
        pages: parsedData.pages.map((page: any) => ({
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

      setDownloadProgress(prev => prev ? {
        ...prev,
        completed: 1,
        message: 'Processing images...'
      } : null);

      const mangaEntry = {
        id: crypto.randomUUID(),
        title: mokuroFile.name.replace('.mokuro', ''),
        type: 'manga' as const,
        mokuroData: structuredMokuroData,
        images: mappedImages,
        coverImage: coverImageUrl,
        lastRead: Date.now(),
        dateAdded: Date.now(),
        progress: 0,
      };

      const db = await openDB();
      console.log('Database opened');
      const transaction = db.transaction(['manga'], 'readwrite');
      const store = transaction.objectStore('manga');
      await store.add(mangaEntry);
      console.log('Manga entry added to database');

      toast.success('Manga added to library');
      onUploadComplete();
    } catch (error) {
      console.error('Error processing files:', error);
      if (error instanceof Error) {
        toast.error(`Failed to process files: ${error.message}`);
      } else {
        toast.error('Failed to process files');
      }
    } finally {
      setIsUploading(false);
      setDownloadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEpubUpload = async (files: FileList) => {
    const epubFile = Array.from(files).find(file => file.name.endsWith('.epub'));
    if (!epubFile) {
      toast.error('Please upload an EPUB file');
      return;
    }

    setIsUploading(true);
    setDownloadProgress({
      completed: 0,
      total: 1,
      message: 'Processing EPUB file...'
    });

    let coverUrl = '';
    try {
      // Create a temporary URL for the EPUB file to extract cover
      const tempBook = ePub(await epubFile.arrayBuffer());
      try {
        const coverImage = await tempBook.loaded.cover;
        if (coverImage) {
          // Create a temporary rendition to get the cover
          const tempRendition = tempBook.renderTo(document.createElement('div'));
          // @ts-ignore
          const coverHref = await tempRendition.book.coverUrl();
          if (coverHref) {
            // Create a fetch request to get the cover as a blob
            const response = await fetch(coverHref);
            const blob = await response.blob();
            coverUrl = URL.createObjectURL(blob);
          }
          // @ts-ignore
          tempRendition.destroy();
        }
      } catch (error) {
        console.warn('No cover image found in EPUB:', error);
      }

      const mangaEntry = {
        id: crypto.randomUUID(),
        title: epubFile.name.replace('.epub', ''),
        type: 'epub' as const,
        epubFile: epubFile,
        coverImage: coverUrl,
        lastRead: Date.now(),
        dateAdded: Date.now(),
        progress: 0,
      };

      const db = await openDB();
      const transaction = db.transaction(['manga'], 'readwrite');
      const store = transaction.objectStore('manga');
      await store.add(mangaEntry);

      toast.success('EPUB added to library');
      onUploadComplete();
    } catch (error) {
      console.error('Error processing EPUB:', error);
      if (error instanceof Error) {
        toast.error(`Failed to process EPUB: ${error.message}`);
      } else {
        toast.error('Failed to process EPUB');
      }
      // Only revoke the cover URL if there was an error
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl);
      }
    } finally {
      setIsUploading(false);
      setDownloadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    // Handle folder drop for manga
    if (viewMode === 'manga') {
      const files: File[] = [];
      const queue = Array.from(items);

      const processEntry = async (entry: any) => {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve) => {
            entry.file((file: File) => resolve(file));
          });
          files.push(file);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = await new Promise<any[]>((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries));
          });
          for (const entry of entries) {
            await processEntry(entry);
          }
        }
      };

      for (const item of queue) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await processEntry(entry);
        }
      }

      await handleMangaUpload(files as any);
    } else {
      // Handle single file drop for epub
      const files = e.dataTransfer.files;
      await handleEpubUpload(files);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 border-muted-foreground/20 hover:bg-[#F87171] hover:text-white hover:border-[#F87171] transition-colors"
      >
        <Plus size={16} />
        Add Content
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tab Selector */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'manga'
                    ? 'bg-[#F87171] text-white'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setViewMode('manga')}
              >
                Manga
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'epub'
                    ? 'bg-[#F87171] text-white'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setViewMode('epub')}
              >
                EPUB
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                isDragging 
                  ? 'border-[#F87171] bg-[#F87171]/5' 
                  : 'border-muted-foreground/25 hover:border-[#F87171]/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <div className="text-sm font-medium">
                  Drag & drop {viewMode === 'manga' ? 'folder' : 'file'} here
                </div>
                <div className="text-xs text-muted-foreground">
                  or
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  {...(viewMode === 'manga' ? { webkitdirectory: "", directory: "", multiple: true } : { accept: '.epub' })}
                  onChange={handleFileUpload}
                  className="max-w-[250px]"
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {viewMode === 'manga' 
                    ? 'Select a folder containing both the .mokuro file and manga images'
                    : 'Select an EPUB file to upload'
                  }
                </p>
              </div>
            </div>

            {downloadProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{downloadProgress.message}</span>
                  <span>{downloadProgress.completed} / {downloadProgress.total}</span>
                </div>
                <Progress 
                  value={(downloadProgress.completed / downloadProgress.total) * 100} 
                  className="h-1 bg-red-100 [&>[role=progressbar]]:bg-[#F87171]" 
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 