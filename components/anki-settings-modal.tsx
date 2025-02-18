"use client";

import { useState, useEffect } from 'react';
import { useAnkiSettings, APP_FIELDS, type AppField } from '@/lib/stores/anki-settings';
import { AnkiConnect } from '@/lib/anki-connect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';

interface NoteTypeFields {
  [modelName: string]: string[];
}

interface AnkiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnkiSettingsModal({ isOpen, onClose }: AnkiSettingsModalProps) {
  const ankiSettings = useAnkiSettings();
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [noteTypeFields, setNoteTypeFields] = useState<NoteTypeFields>({});
  const [isLoading, setIsLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnkiData();
    }
  }, [isOpen]);

  const loadAnkiData = async () => {
    setIsLoading(true);
    try {
      const anki = new AnkiConnect({ url: ankiSettings.settings.ankiConnectUrl });
      
      try {
        await anki.checkAndUpdateConfig();
        toast.success('Successfully connected to Anki');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to connect to Anki');
        }
        setIsLoading(false);
        return;
      }
      
      try {
        const [deckList, modelList] = await Promise.all([
          anki.getDecks(),
          anki.getModels()
        ]);
        
        setDecks(deckList);
        setModels(modelList);

        const currentModel = ankiSettings.settings.defaultModel;
        if (currentModel) {
          const modelFields = await anki.getModelFieldNames(currentModel);
          setNoteTypeFields(prev => ({
            ...prev,
            [currentModel]: modelFields
          }));
        }
      } catch (error) {
        console.error('Failed to fetch Anki data:', error);
        toast.error('Failed to fetch Anki data. Please check your connection.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load Anki data:', error);
      toast.error('Failed to load Anki data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadFields = async () => {
      if (!ankiSettings.settings.defaultModel) return;
      
      try {
        setIsLoading(true);
        const anki = new AnkiConnect({ url: ankiSettings.settings.ankiConnectUrl });
        const modelFields = await anki.getModelFieldNames(ankiSettings.settings.defaultModel);
        setNoteTypeFields(prev => ({
          ...prev,
          [ankiSettings.settings.defaultModel]: modelFields
        }));
      } catch (error) {
        console.error('Failed to fetch model fields:', error);
        toast.error('Failed to fetch note type fields. Please ensure Anki is still running.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, [ankiSettings.settings.defaultModel]);

  const handleModelChange = async (modelName: string) => {
    ankiSettings.setSettings({ defaultModel: modelName });
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-[#F87171]">
        <DialogHeader>
          <DialogTitle className="text-white">Anki Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Collapsible Guide Section */}
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
              <h2 className="text-lg font-semibold text-white">Quick Guide</h2>
              <ChevronDown className={`w-4 h-4 transition-transform text-white ${guideOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 p-4 bg-slate-800 rounded-lg mt-2">
              <div>
                <h3 className="font-medium mb-2 text-white">1. AnkiConnect Setup</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  <li>Install Anki on your computer</li>
                  <li>Install AnkiConnect add-on (code: 2055492159)</li>
                  <li>Restart Anki</li>
                  <li>Test the connection using the button below</li>
                </ol>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-white">2. Field Mapping</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  <li>Select your preferred deck and note type</li>
                  <li>Map each app field to the corresponding field in your note type</li>
                  <li>You can leave fields unmapped if you don't want to use them</li>
                  <li>At least one field must be mapped to create cards</li>
                </ol>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-white">3. Media Settings</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                  <li>Audio padding adds extra time before/after the subtitle timing</li>
                  <li>Image quality affects screenshot file size (higher = better quality but larger files)</li>
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Settings Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">AnkiConnect URL</Label>
              <Input
                value={ankiSettings.settings.ankiConnectUrl}
                onChange={(e) => ankiSettings.setSettings({ ankiConnectUrl: e.target.value })}
                placeholder="http://127.0.0.1:8765"
                className="bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:ring-[#F87171] placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Default Deck</Label>
              <Select
                value={ankiSettings.settings.defaultDeck}
                onValueChange={(value) => ankiSettings.setSettings({ defaultDeck: value })}
              >
                <SelectTrigger className="bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:ring-[#F87171]">
                  <SelectValue placeholder="Select a deck" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-slate-700">
                  {decks.map((deck) => (
                    <SelectItem 
                      key={deck} 
                      value={deck}
                      className="text-white hover:bg-[#F87171] focus:bg-[#F87171] focus:text-white"
                    >
                      {deck}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Default Note Type</Label>
              <Select
                value={ankiSettings.settings.defaultModel}
                onValueChange={handleModelChange}
              >
                <SelectTrigger 
                  disabled={isLoading}
                  className="bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:ring-[#F87171]"
                >
                  <SelectValue placeholder="Select a note type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-slate-700">
                  {models.map((model) => (
                    <SelectItem 
                      key={model} 
                      value={model}
                      className="text-white hover:bg-[#F87171] focus:bg-[#F87171] focus:text-white"
                    >
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Loading fields...</div>
            ) : (
              renderFieldMapping()
            )}

            <div className="space-y-2">
              <Label className="text-white">Audio Padding (ms): {ankiSettings.settings.audioPaddingMs}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[ankiSettings.settings.audioPaddingMs]}
                  onValueChange={([value]) => ankiSettings.setSettings({ audioPaddingMs: value })}
                  min={0}
                  max={500}
                  step={50}
                  className="flex-1 [&_[role=slider]]:bg-[#F87171] [&_[role=slider]]:border-[#F87171] [&_[role=slider]]:hover:bg-[#F87171]/90 [&_[role=slider]]:focus:ring-[#F87171]/30 [&_[role=track]]:bg-[#F87171]"
                />
                <span className="text-sm text-gray-300 min-w-[4rem] text-right">
                  {ankiSettings.settings.audioPaddingMs}ms
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Image Quality: {ankiSettings.settings.imageQuality}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[ankiSettings.settings.imageQuality]}
                  onValueChange={([value]) => ankiSettings.setSettings({ imageQuality: value })}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="flex-1 [&_[role=slider]]:bg-[#F87171] [&_[role=slider]]:border-[#F87171] [&_[role=slider]]:hover:bg-[#F87171]/90 [&_[role=slider]]:focus:ring-[#F87171]/30 [&_[role=track]]:bg-[#F87171]"
                />
                <span className="text-sm text-gray-300 min-w-[4rem] text-right">
                  {Math.round(ankiSettings.settings.imageQuality * 100)}%
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={loadAnkiData}
                disabled={isLoading}
                className="border-slate-700 text-white hover:bg-slate-800 hover:text-white"
              >
                {isLoading ? 'Loading...' : 'Test Connection'}
              </Button>
              <Button
                onClick={onClose}
                className="bg-[#F87171] text-white hover:bg-[#F87171]/90 border-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 