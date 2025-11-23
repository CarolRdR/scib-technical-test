import { ANIMATION_MODULE_TYPE, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  let translate: TranslateService;

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
    translate = TestBed.inject(TranslateService);
    translate.use('es');
    translate.setTranslation(
      'es',
      {
        CANDIDATE_TABLE: {
          EMPTY: 'Sin resultados',
          AVAILABILITY: {
            TRUE: 'Disponible',
            FALSE: 'No disponible'
          }
        }
      },
      true
    );
    fixture.detectChanges();
  });

  it('should show empty state when there are no candidates', () => {
    const text = fixture.nativeElement.querySelector('.empty-state p')?.textContent?.trim();
    expect(text).toBe('Sin resultados');
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
    const filtered = (component as unknown as { filteredCandidates: () => Candidate[] | null }).filteredCandidates();
    expect(filtered?.length).toBe(1);
    expect(filtered?.[0].name).toBe('Jane');

    component.clearSearch();
    const cleared = (component as unknown as { filteredCandidates: () => Candidate[] | null }).filteredCandidates();
    expect(cleared).toBeNull();
  });

  it('should allow filtering by translated availability label', () => {
    storageStub.setCandidates([
      { name: 'Jane', surname: 'Doe', seniority: 'senior', years: 6, availability: true },
      { name: 'John', surname: 'Smith', seniority: 'junior', years: 3, availability: false }
    ]);

    component.applyFilter('disponible');
    let filtered = (component as unknown as { filteredCandidates: () => Candidate[] | null }).filteredCandidates();
    expect(filtered?.length).toBe(1);
    expect(filtered?.[0].availability).toBeTrue();

    component.applyFilter('No disponible');
    filtered = (component as unknown as { filteredCandidates: () => Candidate[] | null }).filteredCandidates();
    expect(filtered?.length).toBe(1);
    expect(filtered?.[0].availability).toBeFalse();
  });
});
