import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'convert/:from-to', 
    loadComponent: () => import('./pages/specialized/specialized.component').then(m => m.SpecializedComponent) 
  },
  { 
    path: 'terms', 
    loadComponent: () => import('./pages/terms/terms.component').then(m => m.TermsComponent) 
  },
  { path: '**', redirectTo: '' }
];
