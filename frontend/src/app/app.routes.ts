import { Routes } from '@angular/router';
import { ConverterHomeComponent } from './features/converter/pages/converter-home/converter-home.component';
import { SpecializedConverterComponent } from './features/converter/pages/specialized-converter/specialized-converter.component';
import { TermsComponent } from './features/terms/pages/terms/terms.component';

export const routes: Routes = [
  { path: '', component: ConverterHomeComponent },
  { path: 'convert/:from-to', component: SpecializedConverterComponent },
  { path: 'terms', component: TermsComponent },
  { path: '**', redirectTo: '' }
];
