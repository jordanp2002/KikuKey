import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface MangaEntry {
  id: string;
  title: string;
  type: 'manga' | 'epub';
  mokuroData?: any;
  epubFile?: File;
  images?: File[];
  coverImage?: string;
  lastRead: number;
  dateAdded: number;
  progress: number;
}

interface LibraryGridProps {
  entries: MangaEntry[];
  onEntrySelect: (entry: MangaEntry) => void;
  onEntryDelete: (id: string, event: React.MouseEvent) => void;
}

export function LibraryGrid({ entries, onEntrySelect, onEntryDelete }: LibraryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group relative flex flex-col rounded-xl border bg-background hover:bg-background/80 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
          onClick={() => onEntrySelect(entry)}
        >
          {/* Cover Image Container */}
          <div className="relative w-full aspect-[2/3] overflow-hidden">
            {entry.coverImage ? (
              <img
                src={entry.coverImage}
                alt={`Cover of ${entry.title}`}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center transition-colors duration-300">
                <span className="text-muted-foreground font-medium text-lg">{entry.type === 'epub' ? 'EPUB' : 'MANGA'}</span>
              </div>
            )}
            {/* Progress Bar Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700">
              <div 
                className="h-full bg-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.5)] transition-all duration-300"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
          </div>

          {/* Content Container */}
          <div className="flex flex-col flex-grow p-4 gap-3">
            <div className="flex-grow">
              <h3 className="font-medium text-base group-hover:text-[#F87171] line-clamp-2 transition-colors duration-300">
                {entry.title}
              </h3>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{new Date(entry.lastRead).toLocaleDateString()}</span>
              <span className="font-medium text-[#F87171]">{entry.progress}% Complete</span>
            </div>
          </div>

          {/* Delete Button - Absolute positioned */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 bg-black/50 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={(e) => onEntryDelete(entry.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
} 