export interface ConvertedFile {
  id: string;
  name: string;
  size: number;
  fromFormat: string;
  toFormat: string;
  progress: number;
  status: 'idle' | 'uploading' | 'converting' | 'completed' | 'failed';
  errorMsg?: string;
  originalFile?: File;
  downloadUrl?: string;
}

export type AppState = 'idle' | 'selected' | 'uploading' | 'converting' | 'completed';
