import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-format-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './format-icon.component.html',
  styleUrl: './format-icon.component.css'
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
