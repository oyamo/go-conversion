import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertedFile } from '../../models/converted-file.model';
import { FormatIconComponent } from '../format-icon/format-icon.component';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule, FormatIconComponent, FormatSelectorComponent],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.css'
})
export class FileCardComponent {
  @Input({ required: true }) public file!: ConvertedFile;
  @Output() public targetFormatChanged = new EventEmitter<{ id: string; format: string }>();
  @Output() public removeFile = new EventEmitter<string>();

  public dropdownOpen = signal<boolean>(false);

  public documentFormats = ['pdf', 'docx', 'xlsx', 'txt', 'csv', 'md', 'html'];
  public imageFormats = ['png', 'jpg', 'gif', 'svg', 'webp'];

  public getFileIconClass(ext: string): string {
    const format = ext.toLowerCase();
    if (format === 'pdf') return 'icon-pdf';
    if (['docx', 'doc', 'txt', 'md', 'html'].includes(format)) return 'icon-doc';
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
