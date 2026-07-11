import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConverterService } from '../../services/converter.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-modal.component.html',
  styleUrl: './password-modal.component.css'
})
export class PasswordModalComponent {
  public converterService = inject(ConverterService);

  public submit(password: string) {
    const prompt = this.converterService.passwordPrompt();
    if (prompt) {
      prompt.resolve(password);
    }
  }

  public cancel() {
    const prompt = this.converterService.passwordPrompt();
    if (prompt) {
      prompt.reject(new Error("Password decryption cancelled by user"));
    }
  }
}
