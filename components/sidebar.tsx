import { BookOpen, Trophy, Video, Calendar, Brain, Book, Lightbulb, FileText, ChevronLeft, ChevronRight, Menu, Settings, LogOut, LayoutDashboard, GraduationCap, Folder, ArrowRight, LineChart, Info, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOutAction } from "@/app/actions";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'learning-tools': true,
    'progress': true,
    'resources': true,
    'documentation': true,
    'setup-guides': true
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isOpen ? '16rem' : '4rem');
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleItemClick = (sectionKey?: string, href?: string, onClick?: () => void) => {
    if (!isOpen && sectionKey) {
      onToggle();
      setOpenSections(prev => ({
        ...prev,
        [sectionKey]: true
      }));
    } else if (sectionKey) {
      toggleSection(sectionKey);
    } else if (!isOpen) {
      onToggle();
    } else if (onClick) {
      onClick();
    }
  };

  const NavItem = ({ 
    href, 
    icon: Icon, 
    label, 
    onClick, 
    isChild, 
    isFolder,
    sectionKey 
  }: { 
    href?: string; 
    icon?: any; 
    label: string; 
    onClick?: () => void; 
    isChild?: boolean;
    isFolder?: boolean;
    sectionKey?: string;
  }) => {
    const content = (
      <div
        onClick={(e) => {
          if (sectionKey) {
            e.preventDefault();
            handleItemClick(sectionKey);
          } else if (!isOpen) {
            e.preventDefault();
            handleItemClick(undefined, href, onClick);
          } else if (onClick) {
            onClick();
          }
        }}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-accent hover:text-white transition-colors group cursor-pointer relative",
          !isOpen && "justify-center",
          isChild && isOpen && "ml-6 pl-4",
          !isOpen && isChild && "hidden"
        )}
      >
        {isChild && isOpen && (
          <div className="absolute left-0 top-0 bottom-0 border-l-2 border-slate-200 dark:border-slate-700" />
        )}
        {Icon && !isChild && <Icon className={cn(
          "w-4 h-4 text-[#F87171] group-hover:text-white"
        )} />}
        {isOpen && (
          <div className="flex items-center gap-2 flex-1">
            <span>{label}</span>
            {isFolder && (
              <ArrowRight 
                className={cn(
                  "w-4 h-4 transition-transform text-muted-foreground",
                  openSections[sectionKey!] && "transform rotate-90"
                )} 
              />
            )}
          </div>
        )}
      </div>
    );

    if (href) {
      return (
        <Link href={href}>
          {!isOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {content}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ) : content}
        </Link>
      );
    }

    return !isOpen ? (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    ) : content;
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed left-0 top-0 h-full bg-background border-r-2 transition-all duration-300 z-50 pt-24 border-slate-200 dark:border-slate-700 flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}>
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

        <div className={cn(
          "flex-1 space-y-4 p-4 overflow-y-auto",
          !isOpen && "px-2"
        )}>
          <div className="space-y-4">
            

            <NavItem
              href="/protected/"
              icon={LayoutDashboard}
              label="Dashboard"
            />
          </div>

          <div className={cn("space-y-4", !isOpen && "space-y-6")}>
            <div className="space-y-1">
              <NavItem
                label="Learning Tools"
                isFolder
                sectionKey="learning-tools"
                icon={GraduationCap}
              />
              <div className="relative">
                {openSections['learning-tools'] && isOpen && (
                  <>
                    <NavItem
                      href="/protected/video-player"
                      label="Video Player"
                      isChild
                    />
                    <NavItem
                      href="/protected/reader"
                      label="Reader"
                      isChild
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                label="Progress"
                isFolder
                sectionKey="progress"
                icon={LineChart}
              />
              <div className="relative">
                {openSections['progress'] && isOpen && (
                  <>
                    
                    <NavItem
                      href="/protected/leaderboard"
                      label="Leaderboard"
                      isChild
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              
              <NavItem
                label="Study Resources"
                isFolder
                sectionKey="resources"
                icon={BookOpen}
              />
              <div className="relative">
                {openSections['resources'] && isOpen && (
                  <>
                    <NavItem
                      href="/protected/grammar"
                      label="Approach to Grammar"
                      isChild
                    />
                    <NavItem
                      href="/protected/quizzes"
                      label="Writing System Quiz"
                      isChild
                    />
                    <NavItem
                      href="/protected/writing-charts"
                      label="Writing Charts"
                      isChild
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                label="Getting Started"
                isFolder
                sectionKey="documentation"
                icon={Info}
              />
              <div className="relative">
                {openSections['documentation'] && isOpen && (
                  <>
                    <NavItem
                      href="/protected/comprehensible-input"
                      label="Comprehensible Input"
                      isChild
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                label="Setup Guides"
                isFolder
                sectionKey="setup-guides"
                icon={FileQuestion}
              />
              <div className="relative">
                {openSections['setup-guides'] && isOpen && (
                  <>
                    <NavItem
                      href="/protected/anki-guide"
                      label="Anki Setup"
                      isChild
                    />
                    <NavItem
                      href="/protected/video-player/guide"
                      label="Video Player Setup"
                      isChild
                    />
                    <NavItem
                      href="/protected/video-player/pop-up"
                      label="Yomitan Setup"
                      isChild
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-4 border-t border-slate-200 dark:border-slate-700 space-y-2",
          !isOpen && "px-2"
        )}>
          <NavItem
            href="/protected/settings"
            icon={Settings}
            label="Settings"
          />
          
          <form action={signOutAction}>
            <button type="submit" className="w-full">
              <NavItem
                icon={LogOut}
                label="Sign Out"
              />
            </button>
          </form>
        </div>
      </div>
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
    </TooltipProvider>
  );
} 