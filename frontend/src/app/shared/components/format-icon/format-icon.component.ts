import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-format-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-icon-box" [ngClass]="[getBgClass(), size]">
      <svg class="file-svg" viewBox="0 0 24 24" [attr.width]="size === 'large' ? '24' : '18'" [attr.height]="size === 'large' ? '24' : '18'" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span class="file-label">{{ format.toUpperCase().substring(0, 4) }}</span>
    </div>
  `,
  styles: [`
    .file-icon-box {
      position: relative;
      width: 28px;
      height: 34px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);
      margin-right: 8px;
    }
    
    .file-svg {
      opacity: 0.35;
      color: currentColor;
    }
    
    .file-label {
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.45rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      padding: 0 1px;
      background: rgba(255, 255, 255, 0.95);
      color: #1e293b;
      border-radius: 2px;
      margin: 0 2px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      text-overflow: clip;
      overflow: hidden;
      white-space: nowrap;
    }

    /* Colors based on families */
    .bg-blue { background-color: #eff6ff; color: #2563eb; border-color: rgba(37, 99, 235, 0.15); }
    .bg-green { background-color: #ecfdf5; color: #16a34a; border-color: rgba(22, 163, 74, 0.15); }
    .bg-red { background-color: #fef2f2; color: #dc2626; border-color: rgba(220, 38, 38, 0.15); }
    .bg-orange { background-color: #fff7ed; color: #ea580c; border-color: rgba(234, 88, 12, 0.15); }
    .bg-slate { background-color: #f8fafc; color: #475569; border-color: rgba(71, 85, 105, 0.15); }
    .bg-purple { background-color: #faf5ff; color: #7c3aed; border-color: rgba(124, 58, 237, 0.15); }
    .bg-yellow { background-color: #fef9c3; color: #ca8a04; border-color: rgba(202, 138, 4, 0.15); }
    .bg-teal { background-color: #f0fdfa; color: #0d9488; border-color: rgba(13, 148, 136, 0.15); }
    .bg-pink { background-color: #fdf2f8; color: #db2777; border-color: rgba(219, 39, 119, 0.15); }

    /* Large file icon configuration */
    .file-icon-box.large {
      width: 42px;
      height: 50px;
      border-radius: 8px;
      margin-right: 0px;
    }
    
    .file-icon-box.large .file-label {
      font-size: 0.65rem;
      font-weight: 800;
      border-radius: 3px;
      margin: 0 4px;
      bottom: 4px;
      padding: 1px 2px;
    }
  `]
})
export class FormatIconComponent {
  @Input() public format: string = 'doc';
  @Input() public size: 'small' | 'large' = 'small';

  public getBgClass(): string {
    const ext = this.format.toLowerCase();
    
    // Documents
    if (['doc', 'docx', 'rtf'].includes(ext)) return 'bg-blue';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-green';
    if (['pdf'].includes(ext)) return 'bg-red';
    if (['html'].includes(ext)) return 'bg-orange';
    if (['txt'].includes(ext)) return 'bg-slate';
    
    // Images
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'bg-purple';
    
    // Audio / Video
    if (['mp3', 'wav', 'ogg', 'aac', 'mp4', 'avi', 'mov', 'mkv'].includes(ext)) return 'bg-pink';
    
    // Compressed
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'bg-teal';
    
    // eBook
    if (['epub', 'mobi', 'azw3'].includes(ext)) return 'bg-yellow';
    
    return 'bg-slate';
  }
}
