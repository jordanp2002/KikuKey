import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnkiConnectConfig } from '../anki-connect';
import { MediaExtractorConfig } from '../media-extractor';

interface AnkiSettings {
  ankiConnectUrl: string;
  defaultDeck: string;
  defaultModel: string;
  defaultTags: string[];
  audioPaddingMs: number;
  imageQuality: number;
  imageFormat: 'image/jpeg' | 'image/png';
  audioFormat: 'audio/mp3' | 'audio/wav';
  fieldMappings: {
    [modelName: string]: {
      [appField: string]: string; // maps app fields to note type fields
    };
  };
}

const defaultSettings: AnkiSettings = {
  ankiConnectUrl: 'http://127.0.0.1:8765',
  defaultDeck: '',
  defaultModel: '',
  defaultTags: [],
  audioPaddingMs: 150,
  imageQuality: 0.95,
  imageFormat: 'image/jpeg',
  audioFormat: 'audio/mp3',
  fieldMappings: {}
};

// App field definitions
export const APP_FIELDS = {
  SENTENCE: 'sentence',
  DEFINITION: 'definition',
  WORD: 'word',
  AUDIO: 'audio',
  IMAGE: 'image',
  SOURCE: 'source'
} as const;

export type AppField = typeof APP_FIELDS[keyof typeof APP_FIELDS];

export const useAnkiSettings = create<{
  settings: AnkiSettings;
  setSettings: (settings: Partial<AnkiSettings>) => void;
  getMediaExtractorConfig: () => MediaExtractorConfig;
  getFieldMapping: (modelName: string) => { [key in AppField]?: string };
  setFieldMapping: (modelName: string, appField: AppField, noteTypeField: string) => void;
  resetFieldMapping: (modelName: string) => void;
}>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      getMediaExtractorConfig: () => {
        const { audioPaddingMs, imageQuality, imageFormat, audioFormat } = get().settings;
        return {
          audioPaddingMs,
          imageQuality,
          imageFormat,
          audioFormat,
        };
      },
      getFieldMapping: (modelName: string) => {
        const { fieldMappings } = get().settings;
        return fieldMappings[modelName] || {};
      },
      setFieldMapping: (modelName: string, appField: AppField, noteTypeField: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            fieldMappings: {
              ...state.settings.fieldMappings,
              [modelName]: {
                ...state.settings.fieldMappings[modelName],
                [appField]: noteTypeField
              }
            }
          }
        })),
      resetFieldMapping: (modelName: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            fieldMappings: {
              ...state.settings.fieldMappings,
              [modelName]: {}
            }
          }
        }))
    }),
    {
      name: 'anki-settings',
    }
  )
); 