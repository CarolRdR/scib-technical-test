import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'candidates'
  },
  {
    path: 'candidates',
    loadComponent: () => import('./private/candidates/containers/upload-candidate/upload-candidate.component').then(m => m.UploadCandidateComponent)
  },
  {
    path: '**',
    redirectTo: 'candidates'
  }
];
