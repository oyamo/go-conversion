import { Component, Output, EventEmitter, signal, computed, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatIconComponent } from '../format-icon/format-icon.component';

interface FormatCategory {
  id: string;
  name: string;
  formats: string[];
}

@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule, FormatIconComponent],
  templateUrl: './format-selector.component.html',
  styleUrl: './format-selector.component.css'
})
export class FormatSelectorComponent implements AfterViewInit {
  @Input() public inline: boolean = false;
  @Input() public defaultCategory: string = ''; // default filter category
  @Output() public formatSelected = new EventEmitter<string>();

  @ViewChild('searchInput') public searchInputEl!: ElementRef<HTMLInputElement>;

  public searchQuery = signal<string>('');
  public activeCategoryId = signal<string>('document');

  public categories: FormatCategory[] = [
    {
      id: 'document',
      name: 'Document',
      formats: ['pdf', 'docx', 'xlsx', 'txt', 'csv']
    },
    {
      id: 'image',
      name: 'Image',
      formats: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
    },
    {
      id: 'audio',
      name: 'Audio',
      formats: ['mp3', 'wav', 'ogg', 'aac']
    },
    {
      id: 'ebook',
      name: 'eBook',
      formats: ['epub', 'mobi', 'azw3']
    },
    {
      id: 'cad',
      name: 'CAD',
      formats: ['dwg', 'dxf']
    },
    {
      id: 'compressed',
      name: 'Compressed',
      formats: ['zip', 'rar', 'tar', 'gz', '7z']
    },
    {
      id: 'other',
      name: 'Other',
      formats: ['csv', 'json', 'xml']
    }
  ];

  public ngAfterViewInit() {
    // Focus search on load if popover
    if (!this.inline && this.searchInputEl) {
      setTimeout(() => {
        this.searchInputEl.nativeElement.focus();
      }, 50);
    }

    // Set default category if provided
    if (this.defaultCategory) {
      const match = this.categories.find(c => c.name.toLowerCase() === this.defaultCategory.toLowerCase());
      if (match) {
        this.activeCategoryId.set(match.id);
      }
    }
  }

  public isSearching = computed<boolean>(() => {
    return this.searchQuery().trim().length > 0;
  });

  public displayedFormats = computed<string[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (query.length > 0) {
      // Return flat search results
      const allFormats = new Set<string>();
      this.categories.forEach(c => c.formats.forEach(f => allFormats.add(f)));
      return Array.from(allFormats).filter(f => f.includes(query));
    } else {
      // Return current category formats
      const current = this.categories.find(c => c.id === this.activeCategoryId());
      return current ? current.formats : [];
    }
  });

  public selectCategory(id: string) {
    this.activeCategoryId.set(id);
  }

  public onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  public onSelectFormat(format: string) {
    this.formatSelected.emit(format);
  }
}
