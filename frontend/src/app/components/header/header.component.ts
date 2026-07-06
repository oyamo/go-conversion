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
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
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
