import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConverterService } from '../../services/converter.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-modal.component.html',
  styleUrl: './password-modal.component.css'
})
export class PasswordModalComponent {
  public converterService = inject(ConverterService);
  public password = '';

  public submit() {
    const prompt = this.converterService.passwordPrompt();
    if (prompt) {
      prompt.resolve(this.password);
      this.password = ''; // Reset input
    }
  }

  public cancel() {
    const prompt = this.converterService.passwordPrompt();
    if (prompt) {
      prompt.reject(new Error("Password decryption cancelled by user"));
      this.password = ''; // Reset input
    }
  }
}
