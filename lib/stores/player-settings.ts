import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyBindings {
  mineSentence: string;
  adjustSubtitleOffsetForward: string;
  adjustSubtitleOffsetBackward: string;
  resetSubtitleOffset: string;
  seekNextSubtitle: string;
  seekPreviousSubtitle: string;
  toggleAutoPause: string;
}

interface PlayerSettings {
  keyBindings: KeyBindings;
  autoPause: {
    enabled: boolean;
    pauseAt: 'start' | 'end';
  };
}

export const defaultSettings: PlayerSettings = {
  keyBindings: {
    mineSentence: 'm',
    adjustSubtitleOffsetForward: ']',
    adjustSubtitleOffsetBackward: '[',
    resetSubtitleOffset: '\\',
    seekNextSubtitle: 'ArrowRight',
    seekPreviousSubtitle: 'ArrowLeft',
    toggleAutoPause: 'p',
  },
  autoPause: {
    enabled: false,
    pauseAt: 'start',
  },
};

export const usePlayerSettings = create<{
  settings: PlayerSettings;
  setKeyBinding: (key: keyof KeyBindings, value: string) => void;
  resetKeyBindings: () => void;
  setAutoPause: (settings: Partial<PlayerSettings['autoPause']>) => void;
}>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setKeyBinding: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            keyBindings: {
              ...state.settings.keyBindings,
              [key]: value,
            },
          },
        })),
      resetKeyBindings: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            keyBindings: defaultSettings.keyBindings,
          },
        })),
      setAutoPause: (autoPauseSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            autoPause: {
              ...state.settings.autoPause,
              ...autoPauseSettings,
            },
          },
        })),
    }),
    {
      name: 'player-settings',
    }
  )
); 