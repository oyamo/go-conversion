import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-decoration"></div>

    <div class="terms-card">
      <h1 class="terms-title">Terms & Conditions</h1>
      <p class="terms-meta">Last Updated: July 6, 2026</p>

      <div class="terms-content">
        <section class="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using FileConverter, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the application.</p>
        </section>

        <section class="terms-section">
          <h2>2. Local Processing Guarantee (WebAssembly)</h2>
          <p class="highlight-box">
            <strong>🔒 Absolute Privacy:</strong> FileConverter operates entirely in your browser using WebAssembly. All file conversions are processed locally on your device. Your files are never uploaded, stored, or processed on any remote server.
          </p>
        </section>

        <section class="terms-section">
          <h2>3. Description of Service</h2>
          <p>We provide a client-side file conversion utility supporting documents, images, video, audio, and archives. The conversion capacity and performance depend entirely on your local machine's processor and system memory.</p>
        </section>

        <section class="terms-section">
          <h2>4. User Obligations</h2>
          <p>You agree not to use the service for any illegal purposes or to convert files that contain malicious code, viruses, or trojans designed to disrupt local browser operations.</p>
        </section>

        <section class="terms-section">
          <h2>5. Intellectual Property</h2>
          <p>All converted files and their original content remain the exclusive property of their respective owners. FileConverter does not claim ownership or rights of any kind over your files.</p>
        </section>

        <section class="terms-section">
          <h2>6. Limitation of Liability</h2>
          <p>The conversion tool is provided "as is" without warranty of any kind. FileConverter is not liable for data loss, corrupted files, or system crashes resulting from local processing errors or hardware limits.</p>
        </section>

        <section class="terms-section">
          <h2>7. Contact & Open Source</h2>
          <p>FileConverter is an open-source project. If you have questions, feedback, or wish to contribute, please visit our GitHub repository.</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .terms-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: var(--card-border);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      width: 100%;
      max-width: 800px;
      padding: 3rem;
      z-index: 10;
    }

    .terms-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 0.25rem;
      text-align: center;
    }

    .terms-meta {
      font-size: 0.8125rem;
      color: var(--text-light);
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .terms-content {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      text-align: left;
    }

    .terms-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.5rem;
    }

    .terms-section p {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-medium);
    }

    .highlight-box {
      background-color: var(--success-light);
      border-left: 4px solid var(--success);
      padding: 1rem;
      border-radius: 0 8px 8px 0;
      color: var(--success-hover) !important;
    }

    @media (max-width: 600px) {
      .terms-card {
        padding: 2rem 1.5rem;
      }
    }
  `]
})
export class TermsComponent {}
