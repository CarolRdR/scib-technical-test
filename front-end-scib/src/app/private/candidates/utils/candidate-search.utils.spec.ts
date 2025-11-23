import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TestBed } from '@angular/core/testing';
import { buildCandidateSearchConfig } from './candidate-search.utils';
import { Candidate } from '../../../core/interfaces/candidate.interface';

describe('candidate search utils', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()]
    });

    translate = TestBed.inject(TranslateService);
    translate.setTranslation(
      'es',
      {
        CANDIDATE_TABLE: {
          AVAILABILITY: {
            TRUE: 'Disponible',
            FALSE: 'No disponible'
          }
        }
      },
      true
    );
    translate.use('es');
  });

  it('creates projector and aliases with translated availability labels', () => {
    const config = buildCandidateSearchConfig(translate);
    const candidate: Candidate = {
      name: 'Jane',
      surname: 'Doe',
      seniority: 'senior',
      years: 5,
      availability: true
    };

    const projected = config.projector(candidate);
    expect(projected).toContain('jane');
    expect(projected).toContain('disponible');

    const aliasKeys = Object.keys(config.aliases);
    expect(aliasKeys).toContain('disponible');
    expect(aliasKeys).toContain('no disponible');
    expect(config.aliases['disponible'](candidate)).toBeTrue();
    expect(config.aliases['no disponible'](candidate)).toBeFalse();
  });
});
