export interface MediaExtractorConfig {
  audioPaddingMs: number;
  imageQuality: number;
  imageFormat: 'image/jpeg' | 'image/png';
  audioFormat: 'audio/mp3' | 'audio/wav';
}

const defaultConfig: MediaExtractorConfig = {
  audioPaddingMs: 150,
  imageQuality: 0.95,
  imageFormat: 'image/jpeg',
  audioFormat: 'audio/mp3',
};

export class MediaExtractor {
  private config: MediaExtractorConfig;

  constructor(config: Partial<MediaExtractorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async captureVideoFrame(video: HTMLVideoElement): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const dataUrl = canvas.toDataURL(this.config.imageFormat, this.config.imageQuality);
        resolve(dataUrl);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to capture video frame'));
      }
    });
  }

  async extractAudioClip(
    video: HTMLVideoElement,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary video element for audio extraction
        const tempVideo = document.createElement('video');
        tempVideo.src = video.src;
        tempVideo.crossOrigin = 'anonymous';
        
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(tempVideo);
        const destination = audioContext.createMediaStreamDestination();

        // Connect the source to the destination
        source.connect(destination);

        // Add padding to the start and end times
        const paddedStartTime = Math.max(0, startTime - this.config.audioPaddingMs / 1000);
        const paddedEndTime = endTime + this.config.audioPaddingMs / 1000;

        // Create a MediaRecorder to capture the audio
        const recorder = new MediaRecorder(destination.stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: this.config.audioFormat });
          resolve(blob);

          // Clean up
          source.disconnect();
          audioContext.close();
          tempVideo.remove();
        };

        // Start recording when the video is ready
        tempVideo.addEventListener('canplay', () => {
          // Start recording
          recorder.start();
          tempVideo.currentTime = paddedStartTime;

          const stopRecording = () => {
            if (tempVideo.currentTime >= paddedEndTime) {
              tempVideo.pause();
              recorder.stop();
              tempVideo.removeEventListener('timeupdate', stopRecording);
            }
          };

          tempVideo.addEventListener('timeupdate', stopRecording);
          tempVideo.play();
        }, { once: true });

        // Handle errors
        tempVideo.addEventListener('error', (error) => {
          reject(new Error('Failed to load video for audio extraction'));
          tempVideo.remove();
        }, { once: true });

      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to extract audio clip'));
      }
    });
  }

  // Helper method to properly handle base64 conversion
  cleanBase64(dataUrl: string): string {
    // Extract the base64 data from data URL
    const base64Data = dataUrl.split(',')[1];
    return base64Data.replace(/\s/g, '');
  }

  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(this.cleanBase64(reader.result));
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  generateUniqueFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}.${extension}`;
  }
}

export const createMediaExtractor = (config?: Partial<MediaExtractorConfig>): MediaExtractor => {
  return new MediaExtractor(config);
}; 