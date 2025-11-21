import { Routes } from '@angular/router';
import { UploadCandidateComponent } from './private/candidates/containers/upload-candidate/upload-candidate.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'candidates'
  },
  {
    path: 'candidates',
    component: UploadCandidateComponent
  },
  {
    path: '**',
    redirectTo: 'candidates'
  }
];
