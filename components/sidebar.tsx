import { BookOpen, Trophy, Video, Calendar, Brain, Book, Lightbulb, FileText, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-50 pt-24",
        isOpen ? "w-64" : "w-0"
      )}>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute -right-10 top-16 p-0 hover:bg-transparent hover:text-[#F87171] transition-colors",
            !isOpen && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Navigation Links */}
        <div className={cn(
          "space-y-4 p-4 overflow-hidden",
          !isOpen && "hidden"
        )}>
          {/* Getting Started Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Getting Started</h3>
            <Link href="/protected/comprehensible-input" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Brain className="w-4 h-4 text-[#F87171]" />
              <span>What is Comprehensible Input?</span>
            </Link>
          </div>

          {/* Guides Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Guides</h3>
            <Link href="/protected/anki-guide" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Lightbulb className="w-4 h-4 text-[#F87171]" />
              <span>Anki Setup Guide</span>
            </Link>
            <Link href="/protected/video-player/guide" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <FileText className="w-4 h-4 text-[#F87171]" />
              <span>Video Player Guide</span>
            </Link>
            <Link href="/protected/video-player/pop-up" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Book className="w-4 h-4 text-[#F87171]" />
              <span>Yomitan Setup Guide</span>
            </Link>
          </div>

          {/* Learning Tools Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Learning Tools</h3>
            <Link href="/protected/video-player" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Video className="w-4 h-4 text-[#F87171]" />
              <span>Video Player</span>
            </Link>
            <Link href="/protected/reader" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Book className="w-4 h-4 text-[#F87171]" />
              <span>Reader</span>
            </Link>
          </div>

          {/* Study Resources Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2">Study Resources</h3>
            <Link href="/protected/grammar" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Trophy className="w-4 h-4 text-[#F87171]" />
              <span>Approach to Grammar</span>
            </Link>
            <Link href="/protected/quizzes" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <BookOpen className="w-4 h-4 text-[#F87171]" />
              <span>Writing System Quizzes</span>
            </Link>
            <Link href="/protected/writing-charts" className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
              <Book className="w-4 h-4 text-[#F87171]" />
              <span>Writing Charts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu Button (visible when sidebar is closed) */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed left-4 top-16 z-50 p-2 hover:bg-transparent hover:text-[#F87171] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  );
} 