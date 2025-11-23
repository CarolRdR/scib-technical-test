import { Sort } from '@angular/material/sort';

export type SortValueResolver<T extends Record<string, unknown>> = (item: T, active: string) => unknown;
export type SearchProjector<T> = (item: T) => string;
type EntityPredicate<T> = (item: T) => boolean;

// Default resolver grabs the raw property value based on the column key.
const defaultSortResolver = <T extends Record<string, unknown>>(item: T, active: string): unknown =>
  item[active as keyof T];

// Sorts any record-based list using Angular Material Sort metadata.
export function sortEntities<T extends Record<string, unknown>>(
  list: T[],
  sort: Sort,
  resolver: SortValueResolver<T> = defaultSortResolver
): T[] {
  const { active, direction } = sort;
  if (!active || !direction) {
    return list;
  }

  const factor = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => compareValues(resolver(a, active), resolver(b, active)) * factor);
}

// Checks if an entity's projected string contains a normalized search term.
export function entityContainsTerm<T extends Record<string, unknown>>(
  item: T,
  term: string,
  projector: SearchProjector<T> = defaultSearchProjector
): boolean {
  if (!term) {
    return true;
  }

  const normalizedTerm = term.toLowerCase();
  return projector(item).toLowerCase().includes(normalizedTerm);
}

// Filters entities by search term and optional alias predicates.
export function filterEntitiesByTerm<T extends Record<string, unknown>>(
  list: T[],
  term: string,
  projector: SearchProjector<T>,
  aliasPredicates: Record<string, EntityPredicate<T>> = {}
): T[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return list;
  }

  const aliasPredicate = aliasPredicates[normalized];
  if (aliasPredicate) {
    return list.filter(aliasPredicate);
  }

  return list.filter((item) => entityContainsTerm(item, normalized, projector));
}

// Builds a normalized search string by concatenating every property value.
const defaultSearchProjector = <T extends Record<string, unknown>>(item: T): string =>
  Object.values(item)
    .map((value) => String(value).toLowerCase())
    .join(' ');

// Coerces values to a comparable form supporting numbers and strings.
function compareValues(valueA: unknown, valueB: unknown): number {
  if (valueA == null && valueB == null) {
    return 0;
  }
  if (valueA == null) {
    return -1;
  }
  if (valueB == null) {
    return 1;
  }

  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }

  return String(valueA).localeCompare(String(valueB), undefined, { sensitivity: 'base' });
}
