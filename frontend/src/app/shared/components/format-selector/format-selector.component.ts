import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatIconComponent } from '../format-icon/format-icon.component';

interface Category {
  id: string;
  name: string;
  iconPath: string; // inline SVG path or icon symbol identifier
  formats: string[];
}

@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [CommonModule, FormatIconComponent],
  template: `
    <div [ngClass]="inline ? 'format-selector-inline' : 'format-selector-popover'" (click)="$event.stopPropagation()">
      <!-- Search Input -->
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Search format" 
          [value]="searchQuery()" 
          (input)="onSearchInput($event)"
          #searchInput
        />
      </div>

      <!-- Split Layout -->
      <div class="split-layout">
        <!-- Sidebar Categories (Only shown when not searching) -->
        <div *ngIf="!isSearching()" class="categories-sidebar">
          <button 
            *ngFor="let cat of categories" 
            class="category-btn" 
            [class.active]="activeCategoryId() === cat.id"
            (click)="selectCategory(cat.id)"
          >
            <!-- Category Icon -->
            <span class="category-icon">
              <svg *ngIf="cat.id === 'document'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <svg *ngIf="cat.id === 'image'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <svg *ngIf="cat.id === 'audio'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
              <svg *ngIf="cat.id === 'ebook'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"></path></svg>
              <svg *ngIf="cat.id === 'cad'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <svg *ngIf="cat.id === 'compressed'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
              <svg *ngIf="cat.id === 'other'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </span>
            <span class="category-name">{{ cat.name }}</span>
            <svg class="chevron-right" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- Format Grid (Shows filtered formats if searching, else active category formats) -->
        <div class="formats-pane" [class.full-width]="isSearching()">
          <div *ngIf="isSearching()" class="search-header">
            Search Results for "{{ searchQuery() }}"
          </div>
          
          <div class="formats-grid">
            <button 
              *ngFor="let fmt of displayedFormats()" 
              class="format-grid-btn"
              (click)="onSelectFormat(fmt)"
            >
              <app-format-icon [format]="fmt"></app-format-icon>
              <span class="format-name">{{ fmt.toUpperCase() }}</span>
            </button>
          </div>

          <div *ngIf="displayedFormats().length === 0" class="no-results">
            No formats match your search.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .format-selector-popover {
      width: 480px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.02);
      padding: 1.25rem;
      z-index: 90;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform-origin: top right;
    }

    .format-selector-inline {
      width: 480px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.02);
      padding: 1.25rem;
      z-index: 90;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95) translateY(-5px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Search Bar */
    .search-container {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
    }

    .search-container input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.5rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-family: var(--font-family);
      font-size: 0.875rem;
      background-color: #f8fafc;
      color: var(--text-dark);
      outline: none;
      transition: all var(--transition-fast);
    }

    .search-container input:focus {
      border-color: var(--primary);
      background-color: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    /* Split layout */
    .split-layout {
      display: flex;
      min-height: 250px;
      gap: 1.25rem;
      border-top: 1px solid rgba(226, 232, 240, 0.6);
      padding-top: 1rem;
    }

    .categories-sidebar {
      width: 160px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .category-btn {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: none;
      background: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-medium);
      text-align: left;
      transition: all var(--transition-fast);
      gap: 0.5rem;
    }

    .category-btn:hover {
      background-color: #f1f5f9;
      color: var(--text-dark);
    }

    .category-btn.active {
      background-color: var(--primary);
      color: white;
    }

    .category-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: currentColor;
    }

    .category-name {
      flex: 1;
    }

    .chevron-right {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .category-btn:hover .chevron-right,
    .category-btn.active .chevron-right {
      opacity: 1;
    }

    /* Formats grid */
    .formats-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .formats-pane.full-width {
      width: 100%;
    }

    .search-header {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .formats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .format-grid-btn {
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.4rem;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-dark);
      transition: all var(--transition-fast);
      text-align: left;
    }

    .format-grid-btn:hover {
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      background-color: rgba(59, 130, 246, 0.02);
    }

    .format-name {
      margin-left: 2px;
    }

    .no-results {
      padding: 2rem 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-light);
    }

    @media (max-width: 540px) {
      .format-selector-popover {
        width: 320px;
        position: fixed;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        transform-origin: center;
        max-height: 80vh;
        overflow: hidden;
      }
      .split-layout {
        flex-direction: column;
        max-height: 320px;
        overflow-y: auto;
      }
      .categories-sidebar {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }
      .category-btn {
        width: auto;
        white-space: nowrap;
      }
      .chevron-right {
        display: none;
      }
      .formats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class FormatSelectorComponent {
  @Output() public formatSelected = new EventEmitter<string>();
  
  @Input() public inline: boolean = false;
  
  @Input() public set defaultCategory(catName: string) {
    if (catName) {
      this.activeCategoryId.set(catName.toLowerCase());
    }
  }

  public searchQuery = signal<string>('');
  public activeCategoryId = signal<string>('document');

  // Categories definition
  public categories: Category[] = [
    {
      id: 'document',
      name: 'Document',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
      formats: ['doc', 'docx', 'csv', 'xls', 'xlsx', 'html', 'pdf', 'rtf', 'txt']
    },
    {
      id: 'image',
      name: 'Image',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
      formats: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
    },
    {
      id: 'audio',
      name: 'Audio',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`,
      formats: ['mp3', 'wav', 'ogg', 'aac']
    },
    {
      id: 'ebook',
      name: 'eBook',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"></path></svg>`,
      formats: ['epub', 'mobi', 'azw3']
    },
    {
      id: 'cad',
      name: 'CAD',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      formats: ['dwg', 'dxf']
    },
    {
      id: 'compressed',
      name: 'Compressed',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>`,
      formats: ['zip', 'rar', 'tar', 'gz', '7z']
    },
    {
      id: 'other',
      name: 'Other',
      iconPath: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
      formats: ['json', 'xml', 'yaml']
    }
  ];

  // Helper flags
  public isSearching = computed<boolean>(() => this.searchQuery().trim() !== '');

  // Computed displayed formats list based on search/category selection
  public displayedFormats = computed<string[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    
    if (query === '') {
      // Find current active category formats
      const currentCat = this.categories.find(c => c.id === this.activeCategoryId());
      return currentCat ? currentCat.formats : [];
    } else {
      // Filter formats across all categories
      const allFormats = new Set<string>();
      this.categories.forEach(cat => {
        cat.formats.forEach(f => {
          if (f.toLowerCase().includes(query)) {
            allFormats.add(f);
          }
        });
      });
      return Array.from(allFormats);
    }
  });

  public selectCategory(id: string) {
    this.activeCategoryId.set(id);
  }

  public onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  public onSelectFormat(format: string) {
    this.formatSelected.emit(format);
  }
}
