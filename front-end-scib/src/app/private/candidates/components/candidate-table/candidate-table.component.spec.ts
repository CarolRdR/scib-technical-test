import { ANIMATION_MODULE_TYPE, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';
import { CandidateTableComponent } from './candidate-table.component';

class CandidateStorageStub {
  private readonly candidatesSignal = signal<Candidate[]>([]);
  private readonly loadingSignal = signal(false);

  readonly candidates = this.candidatesSignal;
  readonly isLoading = this.loadingSignal;

  setCandidates(candidates: Candidate[]): void {
    this.candidatesSignal.set(candidates);
  }

  setLoading(isLoading: boolean): void {
    this.loadingSignal.set(isLoading);
  }
}

describe('CandidateTableComponent', () => {
  let component: CandidateTableComponent;
  let fixture: ComponentFixture<CandidateTableComponent>;
  let storageStub: CandidateStorageStub;

  beforeEach(async () => {
    storageStub = new CandidateStorageStub();

    await TestBed.configureTestingModule({
      imports: [CandidateTableComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
        { provide: CandidateStorageService, useValue: storageStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show empty state when there are no candidates', () => {
    const text = fixture.nativeElement.querySelector('.empty-state p')?.textContent?.trim();
    expect(text).toBe('CANDIDATE_TABLE.EMPTY');
  });

  it('should expose candidate data when available', () => {
    storageStub.setCandidates([
      { name: 'Jane', surname: 'Doe', seniority: 'senior', years: 6, availability: true }
    ]);

    expect(component['candidateStorage'].candidates()).toEqual([
      { name: 'Jane', surname: 'Doe', seniority: 'senior', years: 6, availability: true }
    ]);
  });

  it('should display spinner when loading', () => {
    storageStub.setLoading(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinner).not.toBeNull();
  });

  it('should filter candidates by search term', () => {
    storageStub.setCandidates([
      { name: 'Jane', surname: 'Doe', seniority: 'senior', years: 6, availability: true },
      { name: 'John', surname: 'Smith', seniority: 'junior', years: 3, availability: false }
    ]);

    component.applyFilter('jane');
    expect(component['filteredCandidates']?.length).toBe(1);
    expect(component['filteredCandidates']?.[0].name).toBe('Jane');

    component.clearSearch();
    expect(component['filteredCandidates']).toBeNull();
  });
});
