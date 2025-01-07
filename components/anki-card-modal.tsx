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
      
      // Get field mappings for the selected model
      const fieldMappings = ankiSettings.getFieldMapping(selectedModel);
      
      // Get all required fields for the note type
      const modelFields = await anki.getModelFieldNames(selectedModel);

      // Check which media files we need
      const needsAudio = Object.entries(fieldMappings).some(([appField, noteTypeField]) => 
        appField === APP_FIELDS.AUDIO && noteTypeField
      );
      const needsImage = Object.entries(fieldMappings).some(([appField, noteTypeField]) => 
        appField === APP_FIELDS.IMAGE && noteTypeField
      );

      // Generate filenames and convert media only if needed
      const audioFilename = needsAudio ? mediaExtractor.generateUniqueFilename('audio', 'mp3') : '';
      const imageFilename = needsImage ? mediaExtractor.generateUniqueFilename('image', 'jpg') : '';
      
      // Create fields object based on mappings
      const fields: Record<string, string> = {};
      let hasAnyMapping = false;
      
      // Map each app field to the corresponding note type field
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

      // Initialize unmapped required fields with empty strings
      modelFields.forEach(field => {
        if (!Object.values(fieldMappings).includes(field)) {
          fields[field] = '';
        }
      });

      try {
        // Store media files first (only if they are mapped)
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
        // Check if we can add the note
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

        // Add note
        await anki.addNote({
          deckName: selectedDeck,
          modelName: selectedModel,
          fields,
          tags: tags.length > 0 ? [...tags] : []
        });

        toast.success('Card added successfully');
        onClose();
      } catch (noteError) {
        console.error('Failed to add note:', noteError);
        if (noteError instanceof Error) {
          toast.error(`Failed to add card: ${noteError.message}`);
        } else {
          toast.error('Failed to add card to Anki');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Anki Card</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Deck</Label>
            <Select value={selectedDeck} onValueChange={setSelectedDeck}>
              <SelectTrigger>
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck} value={deck}>{deck}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Note Type</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a note type" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <Input
              value={tags.join(' ')}
              onChange={(e) => setTags(e.target.value.split(/\s+/).filter(Boolean))}
              placeholder="Enter tags separated by spaces"
            />
          </div>

          <div className="grid gap-2">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg">
              <p className="mb-2">{subtitle}</p>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to Anki'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 