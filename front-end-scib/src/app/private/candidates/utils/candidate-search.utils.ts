import { TranslateService } from '@ngx-translate/core';
import { Candidate } from '../../../core/interfaces/candidate.interface';
import { SearchProjector } from '../../../shared/utils/table.utils';

export interface CandidateSearchConfig {
  projector: SearchProjector<Candidate>;
  aliases: Record<string, (candidate: Candidate) => boolean>;
}

// Builds the projector and alias predicates used to filter candidates by text or availability labels.
export function buildCandidateSearchConfig(translate: TranslateService): CandidateSearchConfig {
  const availabilityLabels = {
    available: translate.instant('CANDIDATE_TABLE.AVAILABILITY.TRUE').toLowerCase(),
    unavailable: translate.instant('CANDIDATE_TABLE.AVAILABILITY.FALSE').toLowerCase()
  };

  const projector: SearchProjector<Candidate> = (candidate: Candidate) =>
    createCandidateSearchString(candidate, availabilityLabels);

  return {
    projector,
    aliases: {
      [availabilityLabels.available]: (candidate) => candidate.availability,
      [availabilityLabels.unavailable]: (candidate) => !candidate.availability
    }
  };
}

// Produces a normalized string concatenating all searchable candidate fields.
function createCandidateSearchString(
  candidate: Candidate,
  availabilityLabels: { available: string; unavailable: string }
): string {
  const availabilityText = candidate.availability
    ? availabilityLabels.available
    : availabilityLabels.unavailable;

  return [candidate.name, candidate.surname, candidate.seniority, candidate.years, availabilityText]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase())
    .join(' ');
}
