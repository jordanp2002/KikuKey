"use client";

import { useEffect, useState } from 'react';
import { useAnkiSettings, APP_FIELDS, type AppField } from '@/lib/stores/anki-settings';
import { AnkiConnect } from '@/lib/anki-connect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/back-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NoteTypeFields {
  [modelName: string]: string[];
}

export default function AnkiSettingsPage() {
  const ankiSettings = useAnkiSettings();
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [noteTypeFields, setNoteTypeFields] = useState<NoteTypeFields>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnkiData();
  }, []);

  const loadAnkiData = async () => {
    setIsLoading(true);
    try {
      const anki = new AnkiConnect({ url: ankiSettings.settings.ankiConnectUrl });
      try {
        await anki.checkAndUpdateConfig();
        
        const connected = await anki.testConnection();
        if (!connected) {
          throw new Error('Connection test failed');
        }
        toast.success('Successfully connected to Anki');
      } catch (error) {
        console.error('Connection test failed:', error);
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            toast.error(
              'Failed to connect to Anki. Please make sure:\n' +
              '1. Anki is running\n' +
              '2. AnkiConnect add-on is installed (ID: 2055492159)\n' +
              '3. You\'ve restarted Anki after installing the add-on'
            );
          } else if (error.message.includes('CORS')) {
            toast.error(
              'CORS error. Please:\n' +
              '1. Close Anki completely\n' +
              '2. Reopen Anki\n' +
              '3. Try connecting again'
            );
          } else {
            toast.error('Failed to connect to Anki: ' + error.message);
          }
        } else {
          toast.error('Failed to connect to Anki: Unknown error');
        }
        setIsLoading(false);
        return;
      }
      
      // Get decks and models
      const [deckList, modelList] = await Promise.all([
        anki.getDecks(),
        anki.getModels()
      ]);
      
      setDecks(deckList);
      setModels(modelList);

      const fields: NoteTypeFields = {};
      await Promise.all(
        modelList.map(async (model) => {
          const modelFields = await anki.getModelFieldNames(model);
          fields[model] = modelFields;
        })
      );
      setNoteTypeFields(fields);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load Anki data:', error);
      toast.error('Failed to load Anki data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsLoading(false);
    }
  };

  const handleFieldMapping = (appField: AppField, noteTypeField: string) => {
    if (!ankiSettings.settings.defaultModel) return;
    ankiSettings.setFieldMapping(
      ankiSettings.settings.defaultModel,
      appField,
      noteTypeField
    );
  };

  const renderFieldMapping = () => {
    if (!ankiSettings.settings.defaultModel || !noteTypeFields[ankiSettings.settings.defaultModel]) {
      return null;
    }

    const currentMappings = ankiSettings.getFieldMapping(ankiSettings.settings.defaultModel);
    const availableFields = noteTypeFields[ankiSettings.settings.defaultModel];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Field Mappings</h3>
          <Button
            variant="outline"
            onClick={() => ankiSettings.resetFieldMapping(ankiSettings.settings.defaultModel)}
          >
            Reset Mappings
          </Button>
        </div>
        {Object.values(APP_FIELDS).map((appField) => (
          <div key={appField} className="grid grid-cols-2 gap-4 items-center">
            <Label>{appField.charAt(0).toUpperCase() + appField.slice(1)} Field</Label>
            <Select
              value={currentMappings[appField] || ''}
              onValueChange={(value) => handleFieldMapping(appField, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <BackButton />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-center">Anki Settings</h1>
        {/* Guide Section */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Guide</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. AnkiConnect Setup</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Install Anki on your computer</li>
                <li>Install AnkiConnect add-on (code: 2055492159)</li>
                <li>Restart Anki</li>
                <li>Test the connection using the button below</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-2">2. Field Mapping</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Select your preferred deck and note type</li>
                <li>Map each app field to the corresponding field in your note type</li>
                <li>You can leave fields unmapped if you don't want to use them</li>
                <li>At least one field must be mapped to create cards</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-2">3. Media Settings</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Audio padding adds extra time before/after the subtitle timing</li>
                <li>Image quality affects screenshot file size (higher = better quality but larger files)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-2">4. Sentence Mining (Advanced Feature)</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Sentence mining is an advanced language learning technique that involves collecting example sentences 
                  from native content. This app supports mining by:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Automatically capturing screenshots of the video</li>
                  <li>Extracting audio for the current subtitle</li>
                  <li>Creating Anki cards with the sentence, audio, and screenshot</li>
                </ol>
                <p className="mt-2">
                  To use this feature:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Load a video and subtitles</li>
                  <li>Click the "Mine Sentence" button when you find a useful sentence</li>
                  <li>Review and customize the card before adding it to Anki</li>
                </ol>
                <p className="mt-2">
                  Learn more about sentence mining in this{" "}
                  <a 
                    href="https://refold.la/roadmap/stage-2/a/basic-sentence-mining"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F87171] hover:underline"
                  >
                    comprehensive guide
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>AnkiConnect URL</Label>
              <Input
                value={ankiSettings.settings.ankiConnectUrl}
                onChange={(e) => ankiSettings.setSettings({ ankiConnectUrl: e.target.value })}
                placeholder="http://127.0.0.1:8765"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Deck</Label>
              <Select
                value={ankiSettings.settings.defaultDeck}
                onValueChange={(value) => ankiSettings.setSettings({ defaultDeck: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a deck" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {decks.map((deck) => (
                    <SelectItem key={deck} value={deck}>
                      {deck}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Note Type</Label>
              <Select
                value={ankiSettings.settings.defaultModel}
                onValueChange={(value) => ankiSettings.setSettings({ defaultModel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a note type" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderFieldMapping()}

            <div className="space-y-2">
              <Label>Audio Padding (ms): {ankiSettings.settings.audioPaddingMs}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[ankiSettings.settings.audioPaddingMs]}
                  onValueChange={([value]) => ankiSettings.setSettings({ audioPaddingMs: value })}
                  min={0}
                  max={500}
                  step={50}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-[4rem] text-right">
                  {ankiSettings.settings.audioPaddingMs}ms
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image Quality: {ankiSettings.settings.imageQuality}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[ankiSettings.settings.imageQuality]}
                  onValueChange={([value]) => ankiSettings.setSettings({ imageQuality: value })}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-[4rem] text-right">
                  {Math.round(ankiSettings.settings.imageQuality * 100)}%
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={loadAnkiData}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Test Connection'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 