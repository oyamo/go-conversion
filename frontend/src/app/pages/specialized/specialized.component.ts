import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConverterService } from '../../services/converter.service';
import { FileCardComponent } from '../../components/file-card/file-card.component';

@Component({
  selector: 'app-specialized',
  standalone: true,
  imports: [CommonModule, RouterModule, FileCardComponent],
  templateUrl: './specialized.component.html',
  styleUrl: './specialized.component.css'
})
export class SpecializedComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private converterService = inject(ConverterService);

  private routeSub: Subscription | null = null;

  public fromFormat = signal<string>('');
  public toFormat = signal<string>('');

  public files = this.converterService.files;
  public state = this.converterService.appState;

  public ngOnInit() {
    // Clear queue when entering a specialized conversion page
    this.converterService.clearQueue();

    this.routeSub = this.route.paramMap.subscribe(params => {
      const fromTo = params.get('from-to') || ''; // e.g. "pdf-to-csv"
      const parts = fromTo.split('-to-');
      if (parts.length === 2) {
        this.fromFormat.set(parts[0].toLowerCase());
        this.toFormat.set(parts[1].toLowerCase());
      } else {
        // Fallback defaults
        this.fromFormat.set('pdf');
        this.toFormat.set('docx');
      }
    });
  }

  public ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
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
      input.value = '';
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

  public getIconClass(format: string): string {
    const fmt = format.toLowerCase();
    if (fmt === 'pdf') return 'icon-pdf';
    if (['doc', 'docx', 'rtf', 'txt'].includes(fmt)) return 'icon-doc';
    if (['xls', 'xlsx', 'csv'].includes(fmt)) return 'icon-xls';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fmt)) return 'icon-img';
    return 'icon-generic';
  }
}
