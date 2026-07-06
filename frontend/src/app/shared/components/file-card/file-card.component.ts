import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertedFile } from '../../../core/services/converter.service';
import { FormatIconComponent } from '../format-icon/format-icon.component';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule, FormatIconComponent, FormatSelectorComponent],
  template: `
    <div class="file-card" [class.completed]="file.status === 'completed'" [class.failed]="file.status === 'failed'">
      <div class="file-info-row">
        <!-- File Type Icon -->
        <app-format-icon [format]="file.fromFormat" size="large"></app-format-icon>

        <!-- File Details -->
        <div class="file-details">
          <span class="file-name" [title]="file.name">{{ file.name }}</span>
          <span class="file-size">{{ formatBytes(file.size) }}</span>
        </div>

        <!-- Dynamic Controls -->
        <div class="file-controls">
          <!-- IDLE STATE: Format Dropdown -->
          <div *ngIf="file.status === 'idle'" class="format-select-wrapper">
            <span class="to-label">Convert to:</span>
            <div class="dropdown-select-container">
              <button class="dropdown-select-btn" (click)="toggleDropdown($event)">
                {{ file.toFormat.toUpperCase() }}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              <app-format-selector 
                *ngIf="dropdownOpen()" 
                (formatSelected)="selectFormat($event)"
              ></app-format-selector>
            </div>
          </div>

          <!-- UPLOADING / CONVERTING STATE: Status text -->
          <div *ngIf="file.status === 'uploading' || file.status === 'converting'" class="status-indicator">
            <span class="status-text animate-pulse">
              {{ file.status === 'uploading' ? 'Uploading...' : 'Converting...' }}
            </span>
          </div>

          <!-- COMPLETED STATE: Download Button -->
          <div *ngIf="file.status === 'completed'" class="completed-badge-area">
            <span class="success-badge">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Ready
            </span>
            <a [href]="file.downloadUrl" [download]="file.name" class="btn btn-success download-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </a>
          </div>

          <!-- FAILED STATE: Error Message -->
          <div *ngIf="file.status === 'failed'" class="failed-badge-area">
            <span class="error-badge" [title]="file.errorMsg || 'Failed'">
              Error
            </span>
          </div>

          <!-- Delete/Remove button (only visible if not converting/uploading) -->
          <button *ngIf="file.status === 'idle' || file.status === 'completed' || file.status === 'failed'" 
            class="remove-btn" 
            (click)="onRemoveClick()"
            aria-label="Remove file"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- PROGRESS BAR (only for uploading and converting) -->
      <div *ngIf="file.status === 'uploading' || file.status === 'converting'" class="progress-bar-container">
        <div class="progress-bar" 
          [style.width.%]="file.progress" 
          [ngClass]="file.status === 'uploading' ? 'bg-uploading' : 'bg-converting'">
        </div>
        <span class="progress-percent">{{ file.progress }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .file-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      width: 100%;
      margin-bottom: 1rem;
      transition: all var(--transition-fast);
      position: relative;
    }

    .file-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      border-color: #cbd5e1;
    }

    .file-card.completed {
      border-left: 4px solid var(--success);
    }

    .file-card.failed {
      border-left: 4px solid var(--error);
      background-color: var(--error-light);
    }

    .file-info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    /* Icon styles */
    .file-icon-container {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .file-icon-svg {
      opacity: 0.85;
    }

    .file-ext-badge {
      position: absolute;
      bottom: 4px;
      font-size: 0.55rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      padding: 1px 3px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    /* Extension Specific Colors */
    .icon-pdf {
      background-color: #fef2f2;
      color: #ef4444;
    }
    .icon-doc {
      background-color: #eff6ff;
      color: #3b82f6;
    }
    .icon-xls {
      background-color: #ecfdf5;
      color: #10b981;
    }
    .icon-img {
      background-color: #faf5ff;
      color: #a855f7;
    }
    .icon-generic {
      background-color: #f8fafc;
      color: #64748b;
    }

    /* File Details */
    .file-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.8125rem;
      color: var(--text-light);
    }

    /* File Controls */
    .file-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .to-label {
      font-size: 0.8125rem;
      color: var(--text-medium);
      font-weight: 500;
    }

    .format-select-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Custom Dropdown Select */
    .dropdown-select-container {
      position: relative;
    }

    .dropdown-select-btn {
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.4rem 0.75rem;
      font-family: var(--font-family);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all var(--transition-fast);
    }

    .dropdown-select-btn:hover {
      background: #e2e8f0;
      color: var(--text-dark);
    }

    .dropdown-select-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      z-index: 20;
      padding: 0.35rem;
      display: none;
      min-width: 120px;
    }

    .dropdown-select-menu.show {
      display: block;
    }

    .dropdown-group-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-light);
      padding: 0.25rem 0.5rem;
    }

    .dropdown-select-menu button {
      width: 100%;
      background: none;
      border: none;
      padding: 0.4rem 0.75rem;
      text-align: left;
      font-family: var(--font-family);
      font-size: 0.8125rem;
      color: var(--text-dark);
      border-radius: 4px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .dropdown-select-menu button:hover:not(:disabled) {
      background-color: var(--primary-light);
      color: var(--primary);
    }

    .dropdown-select-menu button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .dropdown-select-menu button.active {
      background-color: var(--primary);
      color: white;
    }

    /* Badges */
    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background-color: var(--success-light);
      color: var(--success);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .error-badge {
      background-color: var(--error-light);
      color: var(--error);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: help;
    }

    .download-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.8125rem;
    }

    .remove-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #fee2e2;
      border: none;
      color: #ef4444;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      transition: all var(--transition-fast);
      z-index: 10;
    }

    .remove-btn:hover {
      background-color: #ef4444;
      color: white;
      transform: scale(1.08);
    }

    /* Status indicators */
    .status-indicator {
      display: flex;
      align-items: center;
    }

    .status-text {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--primary);
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }

    /* Progress bar layout */
    .progress-bar-container {
      margin-top: 0.75rem;
      width: 100%;
      height: 6px;
      background-color: #f1f5f9;
      border-radius: 3px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .progress-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.1s ease;
    }

    .bg-uploading {
      background-color: var(--primary);
    }

    .bg-converting {
      background-color: #a855f7; /* Purple for converting */
    }

    .progress-percent {
      position: absolute;
      right: 0;
      top: -18px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-medium);
    }
  `]
})
export class FileCardComponent {
  @Input({ required: true }) public file!: ConvertedFile;
  @Output() public targetFormatChanged = new EventEmitter<{ id: string; format: string }>();
  @Output() public removeFile = new EventEmitter<string>();

  public dropdownOpen = signal<boolean>(false);

  public documentFormats = ['pdf', 'docx', 'xlsx', 'txt', 'csv'];
  public imageFormats = ['png', 'jpg', 'gif', 'svg', 'webp'];

  public getFileIconClass(ext: string): string {
    const format = ext.toLowerCase();
    if (format === 'pdf') return 'icon-pdf';
    if (['docx', 'doc', 'txt'].includes(format)) return 'icon-doc';
    if (['xlsx', 'xls', 'csv'].includes(format)) return 'icon-xls';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(format)) return 'icon-img';
    return 'icon-generic';
  }

  public formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  public toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  public selectFormat(format: string) {
    this.targetFormatChanged.emit({ id: this.file.id, format });
    this.dropdownOpen.set(false);
  }

  public onRemoveClick() {
    this.removeFile.emit(this.file.id);
  }

  // Close dropdown on window click
  constructor() {
    window.addEventListener('click', () => {
      this.dropdownOpen.set(false);
    });
  }
}
