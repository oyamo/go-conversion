import { Injectable, signal, computed } from '@angular/core';
import { ConvertedFile, AppState } from '../models/converted-file.model';
import { WasmService } from './wasm.service';

@Injectable({
  providedIn: 'root'
})
export class ConverterService {
  // State signal: list of files
  public files = signal<ConvertedFile[]>([]);
  
  public passwordPrompt = signal<{
    show: boolean;
    error: boolean;
    resolve: (password: string) => void;
    reject: (err: Error) => void;
  } | null>(null);
  
  // App state computed based on files and their current status
  public appState = computed<AppState>(() => {
    const list = this.files();
    if (list.length === 0) {
      return 'idle';
    }
    
    const statuses = list.map(f => f.status);
    
    if (statuses.includes('uploading')) {
      return 'uploading';
    }
    if (statuses.includes('converting')) {
      return 'converting';
    }
    if (statuses.every(s => s === 'completed' || s === 'failed')) {
      return 'completed';
    }
    
    return 'selected';
  });

  constructor(private wasmService: WasmService) {}

  /**
   * Adds files to the conversion queue.
   */
  public addFiles(fileList: FileList | File[], defaultToFormat: string = 'pdf') {
    const currentFiles = this.files();
    const newFiles: ConvertedFile[] = Array.from(fileList).map(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        fromFormat: ext,
        toFormat: defaultToFormat === ext ? (ext === 'pdf' ? 'docx' : 'pdf') : defaultToFormat,
        progress: 0,
        status: 'idle',
        originalFile: file
      };
    });

    this.files.set([...currentFiles, ...newFiles]);
  }

  /**
   * Updates the target format for a specific file in the queue.
   */
  public updateTargetFormat(id: string, toFormat: string) {
    this.files.update(list => 
      list.map(f => f.id === id ? { ...f, toFormat } : f)
    );
  }

  /**
   * Removes a file from the conversion queue.
   */
  public removeFile(id: string) {
    this.files.update(list => list.filter(f => f.id !== id));
  }

  /**
   * Clears the entire queue, resetting to idle state.
   */
  public clearQueue() {
    this.files.set([]);
  }

  /**
   * Triggers the conversion pipeline for all files currently in 'idle' status.
   */
  public async convertAll() {
    const list = this.files();
    const idleFiles = list.filter(f => f.status === 'idle');
    if (idleFiles.length === 0) return;

    // First step: Upload simulation for all idle files concurrently
    await Promise.all(idleFiles.map(f => this.simulateUpload(f.id)));

    // Second step: Convert simulation for uploaded files
    const uploadedFiles = this.files().filter(f => f.status === 'converting' || f.progress === 100);
    
    await Promise.all(uploadedFiles.map(f => this.processConversion(f.id)));
  }

  /**
   * Simulates the file uploading progress.
   */
  private simulateUpload(id: string): Promise<void> {
    return new Promise((resolve) => {
      // Set status to uploading
      this.updateFileStatus(id, 'uploading', 0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          // Set to converting next (which means ready for conversion)
          this.updateFileStatus(id, 'converting', 0);
          resolve();
        } else {
          this.updateFileStatus(id, 'uploading', currentProgress);
        }
      }, 150);
    });
  }

  /**
   * Processes the actual file conversion using WASM (or fallback simulation).
   */
  private async processConversion(id: string) {
    const file = this.files().find(f => f.id === id);
    if (!file) return;

    try {
      // Simulate conversion progress UI updates
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 10;
        if (currentProgress >= 90) {
          currentProgress = 90; // hold at 90% until WASM compiles/finishes
          clearInterval(progressInterval);
        } else {
          this.updateFileStatus(id, 'converting', currentProgress);
        }
      }, 100);

      // Perform conversion
      let outputData: Uint8Array = new Uint8Array();
      if (file.originalFile) {
        const fileBuffer = await file.originalFile.arrayBuffer();
        const inputData = new Uint8Array(fileBuffer);
        
        let attempts = 0;
        let password = '';
        while (attempts < 3) {
          try {
            outputData = await this.wasmService.convertFile(inputData, file.fromFormat, file.toFormat, password);
            break; // Success!
          } catch (err: any) {
            const errMsg = err.message || '';
            if (errMsg.includes('password-required') || errMsg.includes('password-incorrect')) {
              attempts++;
              const getPasswordFromModal = (isError: boolean): Promise<string> => {
                return new Promise<string>((resolveModal, rejectModal) => {
                  this.passwordPrompt.set({
                    show: true,
                    error: isError,
                    resolve: (pass: string) => {
                      this.passwordPrompt.set(null);
                      resolveModal(pass);
                    },
                    reject: (err: Error) => {
                      this.passwordPrompt.set(null);
                      rejectModal(err);
                    }
                  });
                });
              };
              const inputPass = await getPasswordFromModal(errMsg.includes('password-incorrect'));
              password = inputPass;
            } else {
              throw err; // Other conversion error
            }
          }
        }
        if (attempts >= 3) {
          throw new Error("Too many incorrect password attempts");
        }
      }

      clearInterval(progressInterval);
      
      // Generate a mock download URL for the resulting file
      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: this.getMimeType(file.toFormat) });
      const downloadUrl = URL.createObjectURL(blob);
      const outputName = this.getConvertedFileName(file.name, file.toFormat);

      // Finalize status
      this.files.update(list => 
        list.map(f => f.id === id ? { 
          ...f, 
          status: 'completed', 
          progress: 100, 
          name: outputName, 
          downloadUrl 
        } : f)
      );

    } catch (error: any) {
      console.error(`Conversion failed for file ${file.name}:`, error);
      this.files.update(list => 
        list.map(f => f.id === id ? { 
          ...f, 
          status: 'failed', 
          progress: 100, 
          errorMsg: error?.message || 'Conversion failed' 
        } : f)
      );
    }
  }

  private updateFileStatus(id: string, status: ConvertedFile['status'], progress: number) {
    this.files.update(list => 
      list.map(f => f.id === id ? { ...f, status, progress } : f)
    );
  }

  private getConvertedFileName(originalName: string, toFormat: string): string {
    const parts = originalName.split('.');
    if (parts.length > 1) {
      parts.pop();
    }
    return `${parts.join('.')}.${toFormat}`;
  }

  private getMimeType(format: string): string {
    const mimes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      csv: 'text/csv',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp'
    };
    return mimes[format.toLowerCase()] || 'application/octet-stream';
  }
}
