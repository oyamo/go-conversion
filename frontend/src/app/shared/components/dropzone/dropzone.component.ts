import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropzone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="dropzone" 
      [class.drag-over]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <!-- Hidden file input -->
      <input 
        #fileInput 
        type="file" 
        multiple 
        class="hidden-input" 
        (change)="onFileSelected($event)"
      />

      <!-- Cloud Icon -->
      <div class="cloud-icon-wrapper">
        <svg class="cloud-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.3-2-2-3.6-4-3.9C17.3 4.8 15 3 12.3 3 9.4 3 7 4.8 6.2 7.4 3.7 8.1 2 10.3 2 13c0 3.3 2.7 6 6 6h11.3c2.2 0 4-1.8 4-4Z"></path>
          <polyline points="16 12 12 8 8 12"></polyline>
          <line x1="12" y1="8" x2="12" y2="18"></line>
        </svg>
      </div>

      <div class="dropzone-text">
        <h3>Drag & drop files here</h3>
        <p>or click to browse from your device</p>
      </div>

      <button class="btn btn-primary select-btn" (click)="$event.stopPropagation(); fileInput.click()">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Select File
      </button>
    </div>
  `,
  styles: [`
    .dropzone {
      width: 100%;
      border: 2px dashed rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(248, 250, 252, 0.5);
      cursor: pointer;
      transition: all var(--transition-normal);
    }
    
    .dropzone:hover, .dropzone.drag-over {
      border-color: var(--primary);
      background-color: rgba(59, 130, 246, 0.03);
      box-shadow: 0 4px 20px -5px rgba(59, 130, 246, 0.1);
      transform: translateY(-2px);
    }

    .hidden-input {
      display: none;
    }

    .cloud-icon-wrapper {
      background-color: var(--primary-light);
      color: var(--primary);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(59, 130, 246, 0.08);
      transition: transform var(--transition-normal);
    }

    .dropzone:hover .cloud-icon-wrapper {
      transform: scale(1.05);
    }

    .cloud-icon {
      color: var(--primary);
    }

    .dropzone-text {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .dropzone-text h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.25rem;
    }

    .dropzone-text p {
      font-size: 0.875rem;
      color: var(--text-light);
    }

    .select-btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.8125rem;
    }
  `]
})
export class DropzoneComponent {
  @Output() public filesSelected = new EventEmitter<FileList>();

  public isDragOver = signal<boolean>(false);

  public onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  public onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  public onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesSelected.emit(input.files);
    }
  }
}
