import { useState, useEffect, useCallback } from 'react';
import { Button } from "./ui/button";
import { Keyboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import { usePlayerSettings, type KeyBindings } from '@/lib/stores/player-settings';

const KEY_BINDING_LABELS: Record<keyof KeyBindings, string> = {
  mineSentence: 'Mine Sentence',
  adjustSubtitleOffsetForward: 'Adjust Subtitle Offset +100ms',
  adjustSubtitleOffsetBackward: 'Adjust Subtitle Offset -100ms',
  resetSubtitleOffset: 'Reset Subtitle Offset',
  seekNextSubtitle: 'Next Subtitle',
  seekPreviousSubtitle: 'Previous Subtitle',
  toggleAutoPause: 'Toggle Auto-Pause',
};

export function PlayerSettings() {
  const playerSettings = usePlayerSettings();
  const [activeBinding, setActiveBinding] = useState<keyof KeyBindings | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeBinding) {
      e.preventDefault();
      e.stopPropagation();

      // Get the key name, handling special cases
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      if (keyName === 'Escape') {
        setActiveBinding(null);
        return;
      }

      playerSettings.setKeyBinding(activeBinding, keyName);
      setActiveBinding(null);
    }
  }, [activeBinding, playerSettings]);

  useEffect(() => {
    if (activeBinding) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeBinding, handleKeyDown]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-[#F87171] hover:text-white transition-colors"
        >
          <Keyboard className="w-4 h-4 mr-2" />
          Keybinds
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 max-h-[80vh] overflow-y-auto" 
        align="end" 
        side="left"
        sideOffset={8}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </DropdownMenuLabel>
        </div>
        
        <div className="p-2 space-y-3">
          {Object.entries(KEY_BINDING_LABELS).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm font-medium">{label}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveBinding(key as keyof KeyBindings)}
                className={`w-full px-2 py-1 h-8 text-sm border font-mono rounded-md bg-transparent hover:border-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#F87171] focus:border-transparent transition-colors justify-start ${
                  activeBinding === key ? 'bg-[#F87171] text-white border-[#F87171]' : ''
                }`}
              >
                {activeBinding === key ? 'Press key...' : playerSettings.settings.keyBindings[key as keyof KeyBindings]}
              </Button>
            </div>
          ))}
          
          <DropdownMenuSeparator />
          
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => playerSettings.resetKeyBindings()}
              className="hover:bg-[#F87171] hover:text-white transition-colors"
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 