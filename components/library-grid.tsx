import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  isLoadingCover?: boolean;
}

interface LibraryGridProps {
  entries: MangaEntry[];
  onEntrySelect: (entry: MangaEntry) => void;
  onEntryDelete: (id: string, event: React.MouseEvent) => void;
}

export function LibraryGrid({ entries, onEntrySelect, onEntryDelete }: LibraryGridProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onEntrySelect(entry)}
            className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-border cursor-pointer hover:border-[#F87171] transition-colors"
          >
            {/* Cover Image or Loading State */}
            <div className="absolute inset-0 bg-muted">
              {entry.isLoadingCover ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F87171]" />
                </div>
              ) : entry.coverImage ? (
                <img
                  src={entry.coverImage}
                  alt={entry.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No Cover</span>
                </div>
              )}
            </div>

            {/* Overlay with title and metadata */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-white font-semibold truncate mb-1 cursor-pointer hover:text-[#F87171] transition-colors">
                    {entry.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-[300px] break-words bg-[#111827] border border-[#F87171]/20 text-white shadow-lg shadow-[#F87171]/5"
                >
                  <p className="py-1">{entry.title}</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex justify-between items-center text-xs text-white/80">
                <span>Progress: {entry.progress}%</span>
                <span>{formatDistanceToNow(entry.lastRead, { addSuffix: true })}</span>
              </div>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-500 text-white"
              onClick={(e) => onEntryDelete(entry.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
} 