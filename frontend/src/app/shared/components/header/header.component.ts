import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormatSelectorComponent } from '../format-selector/format-selector.component';

interface NavCategory {
  name: string;
  iconPath: string;
  items: { label: string; route: string }[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormatSelectorComponent],
  template: `
    <header class="header">
      <div class="header-container">
        <!-- Logo -->
        <a routerLink="/" class="logo-area" (click)="closeMenus()">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
              <line x1="12" y1="12" x2="12" y2="18"></line>
            </svg>
          </div>
          <span class="logo-text">FileConverter</span>
        </a>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle menu">
          <svg *ngIf="!mobileMenuOpen()" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg *ngIf="mobileMenuOpen()" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Navigation Links -->
        <nav class="nav-menu" [class.open]="mobileMenuOpen()">
          <ul class="nav-list">
            <li *ngFor="let cat of categories; let i = index" class="nav-item dropdown"
                (mouseenter)="setDropdown(i, true)" 
                (mouseleave)="setDropdown(i, false)">
              <button class="dropdown-trigger" (click)="toggleDropdownMobile(i)">
                <span class="nav-icon">
                  <svg *ngIf="cat.name === 'Document'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <svg *ngIf="cat.name === 'Image'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <svg *ngIf="cat.name === 'Video'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  <svg *ngIf="cat.name === 'Audio'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                  <svg *ngIf="cat.name === 'Archive'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
                  <svg *ngIf="cat.name === 'Other'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 2.24a2 2 0 0 0-1.78 0L3.5 6.41a2 2 0 0 0-1 1.73v8.52a2 2 0 0 0 1 1.73l7.61 4.17a2 2 0 0 0 1.78 0l7.61-4.17a2 2 0 0 0 1-1.73V8.14a2 2 0 0 0-1-1.73z"></path></svg>
                </span>
                {{ cat.name }}
                <svg class="chevron" [class.rotated]="activeDropdown() === i" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              <!-- Dropdown Panel containing Format Selector -->
              <div class="dropdown-panel" [class.show]="activeDropdown() === i">
                <app-format-selector 
                  [inline]="true"
                  [defaultCategory]="cat.name"
                  (formatSelected)="onNavbarFormatSelected($event)"
                ></app-format-selector>
              </div>
            </li>
          </ul>
        </nav>

        <!-- CTA Action -->
        <div class="header-actions" [class.open]="mobileMenuOpen()">
          <a href="https://github.com" target="_blank" class="github-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);
      position: sticky;
      top: 0;
      width: 100%;
      z-index: 100;
      height: 70px;
      display: flex;
      align-items: center;
    }
    .header-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      color: var(--text-dark);
    }
    .logo-icon {
      background-color: var(--primary-light);
      color: var(--primary);
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(59, 130, 246, 0.1);
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--text-medium);
      cursor: pointer;
    }

    .nav-list {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
    }
    
    .dropdown {
      position: relative;
    }
    
    .dropdown-trigger {
      background: none;
      border: none;
      font-family: var(--font-family);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-medium);
      padding: 0.625rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all var(--transition-fast);
    }
    
    .nav-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-medium);
      transition: color var(--transition-fast);
    }
    
    .dropdown-trigger:hover,
    .dropdown:hover .dropdown-trigger {
      background-color: #f1f5f9;
      color: var(--text-dark);
    }

    .dropdown-trigger:hover .nav-icon,
    .dropdown:hover .dropdown-trigger .nav-icon {
      color: var(--primary);
    }
    
    .chevron {
      transition: transform var(--transition-fast);
    }
    
    .dropdown:hover .chevron {
      transform: translateY(1px);
    }

    .dropdown-panel {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      opacity: 0;
      visibility: hidden;
      transition: all var(--transition-fast);
      z-index: 150;
    }

    .dropdown:hover .dropdown-panel,
    .dropdown-panel.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(2px);
    }

    .dropdown-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .dropdown-link {
      display: block;
      font-size: 0.875rem;
      color: var(--text-medium);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .dropdown-link:hover {
      background-color: var(--primary-light);
      color: var(--primary);
    }

    .github-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
      background-color: var(--primary);
      padding: 0.5rem 1.125rem;
      border-radius: 8px;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .github-btn:hover {
      background-color: var(--primary-hover);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .mobile-toggle {
        display: block;
      }
      .nav-menu {
        position: absolute;
        top: 70px;
        left: 0;
        width: 100%;
        background: white;
        border-bottom: 1px solid var(--border-color);
        max-height: 0;
        overflow: hidden;
        transition: max-height var(--transition-normal);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      }
      .nav-menu.open {
        max-height: 400px;
      }
      .nav-list {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;
        gap: 0.25rem;
      }
      .dropdown-trigger {
        width: 100%;
        justify-content: space-between;
        padding: 0.75rem 1rem;
      }
      .dropdown-panel {
        position: static;
        transform: none;
        box-shadow: none;
        border: none;
        border-left: 2px solid var(--border-color);
        border-radius: 0;
        padding: 0 0 0 1.5rem;
        margin-top: 0.25rem;
        min-width: 0;
        display: none;
      }
      .dropdown-panel.show {
        display: block;
        opacity: 1;
        visibility: visible;
      }
      .header-actions {
        display: none;
      }
      .header-actions.open {
        display: block;
        padding: 0 1rem 1.5rem 1rem;
        position: absolute;
        top: 250px; /* Offset below mobile nav list */
        left: 0;
        width: 100%;
        background: white;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      }
      .github-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class HeaderComponent {
  private router = inject(Router);

  public mobileMenuOpen = signal<boolean>(false);
  public activeDropdown = signal<number | null>(null);

  public categories: NavCategory[] = [
    {
      name: 'Document',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
      items: [
        { label: 'PDF to CSV', route: '/convert/pdf-to-csv' },
        { label: 'XLS to PDF', route: '/convert/xls-to-pdf' },
        { label: 'DOCX to PDF', route: '/convert/docx-to-pdf' },
        { label: 'TXT to PDF', route: '/convert/txt-to-pdf' }
      ]
    },
    {
      name: 'Image',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
      items: [
        { label: 'PNG to JPG', route: '/convert/png-to-jpg' },
        { label: 'JPG to PNG', route: '/convert/jpg-to-png' },
        { label: 'SVG to PNG', route: '/convert/svg-to-png' }
      ]
    },
    {
      name: 'Video',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
      items: [
        { label: 'MP4 to GIF', route: '/convert/mp4-to-gif' },
        { label: 'MOV to MP4', route: '/convert/mov-to-mp4' }
      ]
    },
    {
      name: 'Audio',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
      items: [
        { label: 'WAV to MP3', route: '/convert/wav-to-mp3' },
        { label: 'MP3 to WAV', route: '/convert/mp3-to-wav' }
      ]
    },
    {
      name: 'Archive',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>',
      items: [
        { label: 'ZIP to TAR', route: '/convert/zip-to-tar' },
        { label: 'TAR to ZIP', route: '/convert/tar-to-zip' }
      ]
    },
    {
      name: 'Other',
      iconPath: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 2.24a2 2 0 0 0-1.78 0L3.5 6.41a2 2 0 0 0-1 1.73v8.52a2 2 0 0 0 1 1.73l7.61 4.17a2 2 0 0 0 1.78 0l7.61-4.17a2 2 0 0 0 1-1.73V8.14a2 2 0 0 0-1-1.73z"></path></svg>',
      items: [
        { label: 'CSV to JSON', route: '/convert/csv-to-json' },
        { label: 'JSON to CSV', route: '/convert/json-to-csv' }
      ]
    }
  ];
  public onNavbarFormatSelected(format: string) {
    this.closeMenus();
    const fmt = format.toLowerCase();
    
    // Default routing map
    const routeMap: Record<string, string> = {
      pdf: 'docx-to-pdf',
      csv: 'pdf-to-csv',
      xls: 'xls-to-pdf',
      xlsx: 'xlsx-to-pdf',
      docx: 'pdf-to-docx',
      png: 'jpg-to-png',
      jpg: 'png-to-jpg',
      mp3: 'wav-to-mp3',
      wav: 'mp3-to-wav',
      zip: 'tar-to-zip',
      tar: 'zip-to-tar'
    };
    
    const targetRoute = routeMap[fmt];
    if (targetRoute) {
      this.router.navigate(['/convert', targetRoute]);
    } else {
      this.router.navigate(['/']);
    }
  }
  public toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
    if (!this.mobileMenuOpen()) {
      this.activeDropdown.set(null);
    }
  }

  public setDropdown(index: number, state: boolean) {
    // Only apply on hover for desktop
    if (window.innerWidth > 768) {
      this.activeDropdown.set(state ? index : null);
    }
  }

  public toggleDropdownMobile(index: number) {
    if (window.innerWidth <= 768) {
      this.activeDropdown.update(curr => curr === index ? null : index);
    }
  }

  public closeMenus() {
    this.mobileMenuOpen.set(false);
    this.activeDropdown.set(null);
  }
}
