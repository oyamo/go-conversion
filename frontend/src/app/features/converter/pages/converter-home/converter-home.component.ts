import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConverterService, AppState } from '../../../../core/services/converter.service';
import { DropzoneComponent } from '../../../../shared/components/dropzone/dropzone.component';
import { FileCardComponent } from '../../../../shared/components/file-card/file-card.component';

@Component({
  selector: 'app-converter-home',
  standalone: true,
  imports: [CommonModule, DropzoneComponent, FileCardComponent],
  template: `
    <div class="bg-decoration"></div>
    
    <!-- Title Section -->
    <div class="title-section">
      <h1 class="page-title">{{ getTitle() }}</h1>
      <p class="page-subtitle">{{ getSubtitle() }}</p>
    </div>

    <!-- Main Workspace Card -->
    <div class="workspace-card" [class.compact]="state() !== 'idle'">
      <!-- IDLE STATE -->
      <app-dropzone 
        *ngIf="state() === 'idle'" 
        (filesSelected)="onFilesSelected($event)">
      </app-dropzone>

      <!-- ACTIVE STATES (Selected, Uploading, Converting, Completed) -->
      <div *ngIf="state() !== 'idle'" class="active-workspace">
        <div class="file-list-container">
          <app-file-card 
            *ngFor="let file of files()" 
            [file]="file"
            (targetFormatChanged)="onTargetFormatChanged($event)"
            (removeFile)="onRemoveFile($event)">
          </app-file-card>
        </div>

        <!-- Footer Control Actions inside Card -->
        <div class="workspace-footer">
          <!-- Hidden file input for "Add More" -->
          <input 
            #addMoreInput 
            type="file" 
            multiple 
            class="hidden-input" 
            (change)="onAddMoreFiles($event)"
          />

          <!-- Control Panel based on State -->
          <div class="control-panel" [ngSwitch]="state()">
            <!-- Selected State Controls -->
            <div *ngSwitchCase="'selected'" class="btn-group">
              <button class="btn btn-outline" (click)="addMoreInput.click()">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add More Files
              </button>
              <button class="btn btn-primary btn-large" (click)="onConvertClick()">
                Convert Now
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <!-- Progress/Busy State Controls -->
            <div *ngSwitchCase="'uploading'" class="btn-group disabled-state">
              <button class="btn btn-outline" disabled>Add More Files</button>
              <button class="btn btn-primary" disabled>
                Uploading...
                <div class="spinner"></div>
              </button>
            </div>

            <div *ngSwitchCase="'converting'" class="btn-group disabled-state">
              <button class="btn btn-outline" disabled>Add More Files</button>
              <button class="btn btn-primary" disabled>
                Converting...
                <div class="spinner"></div>
              </button>
            </div>

            <!-- Completed State Controls -->
            <div *ngSwitchCase="'completed'" class="btn-group center-group">
              <button class="btn btn-primary btn-large" (click)="onConvertMoreClick()">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                Convert More Files
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .title-section {
      margin-bottom: 0.5rem;
      z-index: 10;
    }

    .workspace-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: var(--card-border);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      width: 100%;
      max-width: 800px;
      min-height: 400px;
      padding: 3rem;
      transition: all var(--transition-normal);
      z-index: 10;
      display: flex;
      flex-direction: column;
    }

    .workspace-card.compact {
      padding: 2rem;
      min-height: auto;
    }

    .active-workspace {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }

    .file-list-container {
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .workspace-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
      margin-top: auto;
    }

    .hidden-input {
      display: none;
    }

    .control-panel {
      width: 100%;
    }

    .btn-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .btn-group.center-group {
      justify-content: center;
    }

    .btn-large {
      padding: 0.85rem 2rem;
      font-size: 0.95rem;
    }

    .disabled-state {
      opacity: 0.7;
      pointer-events: none;
    }

    /* Spinner Animation */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ConverterHomeComponent {
  private converterService = inject(ConverterService);
  public files = this.converterService.files;
  public state = this.converterService.appState;

  public getTitle(): string {
    switch (this.state()) {
      case 'uploading':
        return 'Uploading';
      case 'converting':
        return 'Converting';
      case 'completed':
        return 'Conversion Completed!';
      default:
        return 'FileConverter';
    }
  }

  public getSubtitle(): string {
    switch (this.state()) {
      case 'uploading':
        return 'Please wait while we upload your files...';
      case 'converting':
        return 'WebAssembly is working magic to convert your files...';
      case 'completed':
        return 'Your files have been converted successfully.';
      default:
        return 'Convert files locally and securely using browser WebAssembly.';
    }
  }

  public onFilesSelected(fileList: FileList) {
    this.converterService.addFiles(fileList);
  }

  public onAddMoreFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.converterService.addFiles(input.files);
    }
  }

  public onTargetFormatChanged(event: { id: string; format: string }) {
    this.converterService.updateTargetFormat(event.id, event.format);
  }

  public onRemoveFile(id: string) {
    this.converterService.removeFile(id);
  }

  public onConvertClick() {
    this.converterService.convertAll();
  }

  public onConvertMoreClick() {
    this.converterService.clearQueue();
  }
}
