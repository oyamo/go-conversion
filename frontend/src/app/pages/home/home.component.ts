import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConverterService } from '../../services/converter.service';
import { DropzoneComponent } from '../../components/dropzone/dropzone.component';
import { FileCardComponent } from '../../components/file-card/file-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DropzoneComponent, FileCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private converterService = inject(ConverterService);

  public files = this.converterService.files;
  public state = this.converterService.appState;

  public getTitle(): string {
    switch (this.state()) {
      case 'idle':
        return 'Convert Your Files Instantly';
      case 'selected':
        return 'Ready to Convert';
      case 'uploading':
        return 'Uploading Files';
      case 'converting':
        return 'Processing locally';
      case 'completed':
        return 'Conversions Complete';
      default:
        return 'File Converter';
    }
  }

  public getSubtitle(): string {
    switch (this.state()) {
      case 'idle':
        return 'Secure, local browser-based file conversion powered by WebAssembly. No files ever leave your device.';
      case 'selected':
        return 'Confirm your target format for each file and click "Convert Now" below.';
      case 'uploading':
        return 'Preparing your files for conversion in the browser context.';
      case 'converting':
        return 'Running high-performance Go WebAssembly modules locally on your processor.';
      case 'completed':
        return 'Your converted files are ready for download. Try converting more files!';
      default:
        return 'Secure in-browser conversion utility.';
    }
  }

  public onFilesSelected(fileList: FileList) {
    this.converterService.addFiles(fileList);
  }

  public onAddMoreFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.converterService.addFiles(input.files);
      input.value = ''; // Reset input element
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
