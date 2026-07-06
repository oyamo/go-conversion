import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConverterService } from '../../../../core/services/converter.service';
import { FileCardComponent } from '../../../../shared/components/file-card/file-card.component';

@Component({
  selector: 'app-specialized-converter',
  standalone: true,
  imports: [CommonModule, RouterModule, FileCardComponent],
  template: `
    <div class="bg-decoration"></div>

    <!-- Title Section -->
    <div class="title-section">
      <h1 class="page-title">{{ fromFormat().toUpperCase() }} to {{ toFormat().toUpperCase() }}</h1>
      <p class="page-subtitle">Convert your {{ fromFormat().toUpperCase() }} files to {{ toFormat().toUpperCase() }} format securely in the browser.</p>
    </div>

    <!-- Main Workspace Card -->
    <div class="workspace-card" [class.compact]="files().length > 0">
      <!-- Specialized Upload Interface (if no files are active) -->
      <div *ngIf="files().length === 0" class="specialized-upload-area">
        
        <!-- Icons Display (Shows source format converting to destination format) -->
        <div class="icons-comparison">
          <!-- From Icon -->
          <div class="format-large-icon" [ngClass]="getIconClass(fromFormat())">
            <span class="ext-badge">{{ fromFormat().toUpperCase() }}</span>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>

          <!-- Arrow -->
          <div class="arrow-indicator">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>

          <!-- To Icon -->
          <div class="format-large-icon" [ngClass]="getIconClass(toFormat())">
            <span class="ext-badge">{{ toFormat().toUpperCase() }}</span>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
        </div>

        <div class="action-description">
          <h3>Select a {{ fromFormat().toUpperCase() }} file to convert</h3>
          <p>The file will be automatically set to convert to {{ toFormat().toUpperCase() }}.</p>
        </div>

        <!-- Hidden input for file selection -->
        <input 
          #fileInput 
          type="file" 
          [accept]="'.' + fromFormat()"
          multiple
          class="hidden-input" 
          (change)="onFileSelected($event)"
        />

        <button class="btn btn-primary btn-large" (click)="fileInput.click()">
          Select {{ fromFormat().toUpperCase() }} File
        </button>
      </div>

      <!-- File Conversion list (redirects workflow through ConverterService) -->
      <div *ngIf="files().length > 0" class="active-workspace">
        <div class="file-list-container">
          <app-file-card 
            *ngFor="let file of files()" 
            [file]="file"
            (targetFormatChanged)="onTargetFormatChanged($event)"
            (removeFile)="onRemoveFile($event)">
          </app-file-card>
        </div>

        <div class="workspace-footer">
          <input 
            #addMoreInput 
            type="file" 
            [accept]="'.' + fromFormat()"
            multiple 
            class="hidden-input" 
            (change)="onAddMoreFiles($event)"
          />

          <div class="control-panel" [ngSwitch]="state()">
            <div *ngSwitchCase="'selected'" class="btn-group">
              <button class="btn btn-outline" (click)="addMoreInput.click()">
                Add More {{ fromFormat().toUpperCase() }} Files
              </button>
              <button class="btn btn-primary" (click)="onConvertClick()">
                Convert to {{ toFormat().toUpperCase() }}
              </button>
            </div>

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

            <div *ngSwitchCase="'completed'" class="btn-group center-group">
              <button class="btn btn-primary" (click)="onConvertMoreClick()">
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
      justify-content: center;
      align-items: center;
    }

    .workspace-card.compact {
      padding: 2rem;
      min-height: auto;
      align-items: stretch;
    }

    .specialized-upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      text-align: center;
    }

    .icons-comparison {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .arrow-indicator {
      color: var(--text-light);
    }

    /* Icon styling mapping from FileCard */
    .format-large-icon {
      position: relative;
      width: 96px;
      height: 96px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .ext-badge {
      position: absolute;
      bottom: 12px;
      font-size: 0.875rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .icon-pdf { background-color: #fef2f2; color: #ef4444; }
    .icon-doc { background-color: #eff6ff; color: #3b82f6; }
    .icon-xls { background-color: #ecfdf5; color: #10b981; }
    .icon-img { background-color: #faf5ff; color: #a855f7; }
    .icon-generic { background-color: #f8fafc; color: #64748b; }

    .action-description {
      margin-bottom: 2rem;
    }

    .action-description h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.5rem;
    }

    .action-description p {
      font-size: 0.9rem;
      color: var(--text-medium);
    }

    .hidden-input {
      display: none;
    }

    .btn-large {
      padding: 0.85rem 2rem;
      font-size: 0.95rem;
    }

    /* Active workspace structures */
    .active-workspace {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .file-list-container {
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .workspace-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
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

    .disabled-state {
      opacity: 0.7;
      pointer-events: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SpecializedConverterComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private converterService = inject(ConverterService);

  public fromFormat = signal<string>('pdf');
  public toFormat = signal<string>('csv');
  
  public files = this.converterService.files;
  public state = this.converterService.appState;

  private routeSub: Subscription | null = null;

  public ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((params: any) => {
      const fromTo = params.get('from-to') || 'pdf-to-csv';
      const parts = fromTo.toLowerCase().split('-to-');
      
      if (parts.length === 2) {
        this.fromFormat.set(parts[0]);
        this.toFormat.set(parts[1]);
      } else {
        // Fallback to home if parameters are invalid
        this.router.navigate(['/']);
      }
      
      // Clear previous files on route change
      this.converterService.clearQueue();
    });
  }

  public ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    this.converterService.clearQueue();
  }

  public getIconClass(format: string): string {
    const ext = format.toLowerCase();
    if (ext === 'pdf') return 'icon-pdf';
    if (['docx', 'doc', 'txt'].includes(ext)) return 'icon-doc';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'icon-xls';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'icon-img';
    return 'icon-generic';
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.converterService.addFiles(input.files, this.toFormat());
    }
  }

  public onAddMoreFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.converterService.addFiles(input.files, this.toFormat());
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
