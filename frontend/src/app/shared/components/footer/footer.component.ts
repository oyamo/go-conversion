import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <span class="copyright">© 2026 FileConverter. All rights reserved.</span>
        <div class="footer-links">
          <a routerLink="/terms" class="footer-link">Terms & Conditions</a>
          <span class="separator">•</span>
          <a routerLink="/privacy" class="footer-link">Privacy Policy</a>
          <span class="separator">•</span>
          <a routerLink="/about" class="footer-link">About Us</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid rgba(226, 232, 240, 0.6);
      background: rgba(255, 255, 255, 0.4);
      padding: 1.5rem 0;
      width: 100%;
      z-index: 10;
      margin-top: auto;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .copyright {
      font-size: 0.8125rem;
      color: var(--text-light);
    }
    .footer-links {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .footer-link {
      font-size: 0.8125rem;
      color: var(--text-medium);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .footer-link:hover {
      color: var(--primary);
    }
    .separator {
      font-size: 0.8125rem;
      color: var(--text-light);
    }
    @media (max-width: 600px) {
      .footer-container {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {}
