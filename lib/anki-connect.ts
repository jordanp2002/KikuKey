export interface AnkiConnectConfig {
  url: string;
  version: number;
}

export interface AnkiConnectRequest {
  action: string;
  version: number;
  params: Record<string, any>;
}

export interface AnkiDeckInfo {
  name: string;
  id: number;
}

export interface AnkiModelInfo {
  name: string;
  id: number;
}

export interface AnkiNoteData {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  audio?: {
    url: string;
    filename: string;
    fields: string[];
  }[];
  picture?: {
    url: string;
    filename: string;
    fields: string[];
  }[];
}

const defaultConfig: AnkiConnectConfig = {
  url: 'http://127.0.0.1:8765',
  version: 6,
};

class AnkiConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnkiConnectError';
  }
}

export class AnkiConnect {
  private config: AnkiConnectConfig;

  constructor(config: Partial<AnkiConnectConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async invoke<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    const response = await fetch(this.config.url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        version: 6,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`AnkiConnect error: ${result.error}`);
    }

    return result.result;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.invoke<string>('version');
      return parseInt(result) >= 6;
    } catch (error) {
      console.error('AnkiConnect test failed:', error);
      throw error;
    }
  }

  async getDecks(): Promise<string[]> {
    return this.invoke<string[]>('deckNames');
  }

  async getModels(): Promise<string[]> {
    return this.invoke<string[]>('modelNames');
  }

  async addNote(note: AnkiNoteData): Promise<number> {
    return this.invoke<number>('addNote', { note });
  }

  async storeMediaFile(filename: string, data: string): Promise<void> {
    await this.invoke('storeMediaFile', {
      filename,
      data,
    });
  }

  async canAddNotes(notes: AnkiNoteData[]): Promise<boolean[]> {
    return this.invoke<boolean[]>('canAddNotes', {
      notes: notes.map(note => ({
        deckName: note.deckName,
        modelName: note.modelName,
        fields: note.fields,
      })),
    });
  }

  async getDeckConfig(deckName: string): Promise<Record<string, any>> {
    return this.invoke<Record<string, any>>('getDeckConfig', {
      deck: deckName,
    });
  }

  async updateDeckConfig(
    deckName: string,
    config: Record<string, any>
  ): Promise<boolean> {
    return this.invoke<boolean>('saveDeckConfig', {
      deck: deckName,
      config,
    });
  }

  async getModelFieldNames(modelName: string): Promise<string[]> {
    return this.invoke<string[]>('modelFieldNames', { modelName });
  }

  async checkAndUpdateConfig(): Promise<void> {
    try {
      // First test the connection with a simple version check
      const version = await this.invoke<string>('version');
      if (parseInt(version) < 6) {
        throw new Error('AnkiConnect version 6 or higher is required');
      }

      try {
        await this.getDecks();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            throw new Error(
              'AnkiConnect permission denied. Please:\n' +
              '1. Watch for a permission popup in Anki\n' +
              '2. Click "Yes" to allow access\n' +
              '3. Try connecting again'
            );
          }
        }
        throw error;
      }

    } catch (error) {
      console.error('AnkiConnect configuration error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error(
            'Could not connect to Anki. Please make sure:\n' +
            '1. Anki is running\n' +
            '2. AnkiConnect add-on is installed (ID: 2055492159)\n' +
            '3. You\'ve restarted Anki after installing the add-on'
          );
        } else if (error.message.includes('permission')) {
          throw error; 
        } else {
          throw new Error('Failed to connect to AnkiConnect: ' + error.message);
        }
      } else {
        throw new Error('Unknown error while checking AnkiConnect configuration');
      }
    }
  }
}

export const createAnkiConnect = (config?: Partial<AnkiConnectConfig>): AnkiConnect => {
  return new AnkiConnect(config);
}; 