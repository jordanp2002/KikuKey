"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAnkiSettings, APP_FIELDS } from '@/lib/stores/anki-settings';
import { AnkiConnect } from '@/lib/anki-connect';
import { createMediaExtractor } from '@/lib/media-extractor';
import { toast } from 'sonner';

interface AnkiCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitle: string;
  imageData: string;
  audioBlob: Blob;
  currentTime: number;
}

export default function AnkiCardModal({
  isOpen,
  onClose,
  subtitle,
  imageData,
  audioBlob,
  currentTime
}: AnkiCardModalProps) {
  const ankiSettings = useAnkiSettings();
  const [selectedDeck, setSelectedDeck] = useState(ankiSettings.settings.defaultDeck);
  const [selectedModel, setSelectedModel] = useState(ankiSettings.settings.defaultModel);
  const [tags, setTags] = useState<string[]>(ankiSettings.settings.defaultTags);
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaExtractor = createMediaExtractor(ankiSettings.getMediaExtractorConfig());

  useEffect(() => {
    loadAnkiData();
  }, []);

  const loadAnkiData = async () => {
    try {
      const anki = new AnkiConnect({ url: ankiSettings.settings.ankiConnectUrl });
      const [deckList, modelList] = await Promise.all([
        anki.getDecks(),
        anki.getModels()
      ]);
      setDecks(deckList);
      setModels(modelList);
    } catch (error) {
      console.error('Failed to load Anki data:', error);
      toast.error('Failed to connect to Anki');
    }
  };

  const formatTime = (seconds: number): string => {
    const pad = (num: number): string => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  };

  const handleSubmit = async () => {
    if (!selectedDeck || !selectedModel) {
      toast.error('Please select a deck and note type');
      return;
    }

    setIsSubmitting(true);

    try {
      const anki = new AnkiConnect({ url: ankiSettings.settings.ankiConnectUrl });
      
      const fieldMappings = ankiSettings.getFieldMapping(selectedModel);
      
      const modelFields = await anki.getModelFieldNames(selectedModel);

      const needsAudio = Object.entries(fieldMappings).some(([appField, noteTypeField]) => 
        appField === APP_FIELDS.AUDIO && noteTypeField
      );
      const needsImage = Object.entries(fieldMappings).some(([appField, noteTypeField]) => 
        appField === APP_FIELDS.IMAGE && noteTypeField
      );
      const audioFilename = needsAudio ? mediaExtractor.generateUniqueFilename('audio', 'mp3') : '';
      const imageFilename = needsImage ? mediaExtractor.generateUniqueFilename('image', 'jpg') : '';
      
      const fields: Record<string, string> = {};
      let hasAnyMapping = false;
      
      Object.entries(fieldMappings).forEach(([appField, noteTypeField]) => {
        if (!noteTypeField) return;
        hasAnyMapping = true;

        switch (appField) {
          case APP_FIELDS.SENTENCE:
            fields[noteTypeField] = subtitle;
            break;
          case APP_FIELDS.AUDIO:
            fields[noteTypeField] = needsAudio ? `[sound:${audioFilename}]` : '';
            break;
          case APP_FIELDS.IMAGE:
            fields[noteTypeField] = needsImage ? `<img src="${imageFilename}">` : '';
            break;
          case APP_FIELDS.SOURCE:
            fields[noteTypeField] = `Video timestamp: ${formatTime(currentTime)}`;
            break;
        }
      });

      if (!hasAnyMapping) {
        toast.error('Please map at least one field in Anki settings');
        setIsSubmitting(false);
        return;
      }

      // Store media files first
      try {
        const mediaPromises: Promise<void>[] = [];
        
        if (needsAudio) {
          const audioBase64 = await mediaExtractor.blobToBase64(audioBlob);
          mediaPromises.push(anki.storeMediaFile(audioFilename, audioBase64));
        }
        
        if (needsImage) {
          const imageBase64 = mediaExtractor.cleanBase64(imageData);
          mediaPromises.push(anki.storeMediaFile(imageFilename, imageBase64));
        }

        if (mediaPromises.length > 0) {
          await Promise.all(mediaPromises);
        }
      } catch (mediaError) {
        console.error('Failed to store media files:', mediaError);
        toast.error('Failed to store media files in Anki');
        setIsSubmitting(false);
        return;
      }

      try {
        // Find the most recent note in the selected deck
        const recentNote = await anki.findMostRecentNote(selectedDeck);
        
        if (!recentNote) {
          // If no recent note found, create a new one
          const canAdd = await anki.canAddNotes([{
            deckName: selectedDeck,
            modelName: selectedModel,
            fields,
            tags: tags.length > 0 ? [...tags] : []
          }]);

          if (!canAdd[0]) {
            toast.error('Cannot add note: It might be a duplicate or missing required fields');
            setIsSubmitting(false);
            return;
          }

          await anki.addNote({
            deckName: selectedDeck,
            modelName: selectedModel,
            fields,
            tags: tags.length > 0 ? [...tags] : []
          });
          
          toast.success('New card added successfully');
        } else {
          // Update the existing note
          await anki.updateNoteFields(recentNote.noteId, fields);
          toast.success('Updated most recent card successfully');
        }

        onClose();
      } catch (noteError) {
        console.error('Failed to update/add note:', noteError);
        if (noteError instanceof Error) {
          toast.error(`Failed to update/add card: ${noteError.message}`);
        } else {
          toast.error('Failed to update/add card to Anki');
        }
      }
    } catch (error) {
      console.error('Failed to process card:', error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Failed to process card');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900 border border-[#F87171]">
        <DialogHeader>
          <DialogTitle className="text-white">Create Anki Card</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-white">Deck</Label>
            <Select value={selectedDeck} onValueChange={setSelectedDeck}>
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

          <div className="grid gap-2">
            <Label className="text-white">Note Type</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:ring-[#F87171]">
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

          <div className="grid gap-2">
            <Label className="text-white">Tags</Label>
            <Input
              value={tags.join(' ')}
              onChange={(e) => setTags(e.target.value.split(/\s+/).filter(Boolean))}
              placeholder="Enter tags separated by spaces"
              className="bg-slate-900 text-white border-slate-700 hover:border-[#F87171] focus:ring-[#F87171] placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-white">Preview</Label>
            <div className="p-4 border border-slate-700 rounded-lg bg-slate-900">
              <p className="mb-2 text-white">{subtitle}</p>
              <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden mb-2">
                <img src={imageData} alt="Screenshot" className="w-full h-full object-contain" />
              </div>
              {audioBlob && (
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(audioBlob)} type="audio/mpeg" />
                </audio>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-700 text-white hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-[#F87171] text-white hover:bg-[#F87171]/90 border-none"
          >
            {isSubmitting ? 'Adding...' : 'Add to Anki'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 