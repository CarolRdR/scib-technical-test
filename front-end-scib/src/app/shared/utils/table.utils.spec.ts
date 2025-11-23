import { Sort } from '@angular/material/sort';
import { entityContainsTerm, filterEntitiesByTerm, sortEntities } from './table.utils';

interface MockEntity extends Record<string, unknown> {
  name: string;
  years: number;
  meta?: {
    keyword: string;
  };
}

describe('table utils', () => {
  const entities: MockEntity[] = [
    { name: 'Carol', years: 5 },
    { name: 'Alice', years: 3 },
    { name: 'Bob', years: 10 }
  ];

  describe('sortEntities', () => {
    it('sorts entities ascending by the provided field', () => {
      const sort: Sort = { active: 'name', direction: 'asc' };
      const sorted = sortEntities(entities, sort);

      expect(sorted.map((item) => item.name)).toEqual(['Alice', 'Bob', 'Carol']);
      expect(sorted).not.toBe(entities);
      expect(entities[0].name).toBe('Carol');
    });

    it('sorts entities descending by number fields', () => {
      const sort: Sort = { active: 'years', direction: 'desc' };
      const sorted = sortEntities(entities, sort);

      expect(sorted.map((item) => item.years)).toEqual([10, 5, 3]);
    });

    it('uses the resolver for derived sort values', () => {
      const extended: MockEntity[] = entities.map((item, index) => ({
        ...item,
        meta: { keyword: ['zoo', 'alpha', 'moon'][index] }
      }));

      const sort: Sort = { active: 'meta', direction: 'asc' };
      const sorted = sortEntities(
        extended,
        sort,
        (item, _active) => item.meta?.keyword ?? ''
      );

      expect(sorted[0].meta?.keyword).toBe('alpha');
      expect(sorted[1].meta?.keyword).toBe('moon');
      expect(sorted[2].meta?.keyword).toBe('zoo');
    });
  });

  describe('entityContainsTerm', () => {
    it('returns true when the term is empty', () => {
      expect(entityContainsTerm(entities[0], '')).toBeTrue();
    });

    it('matches values case-insensitively using the default projector', () => {
      expect(entityContainsTerm(entities[0], 'carol')).toBeTrue();
      expect(entityContainsTerm(entities[0], 'CAROL')).toBeTrue();
      expect(entityContainsTerm(entities[0], 'unknown')).toBeFalse();
    });

    it('supports custom projectors to match derived text', () => {
      const projector = (item: MockEntity) => item.meta?.keyword ?? '';
      const entity: MockEntity = { name: 'Test', years: 1, meta: { keyword: 'Disponible' } };

      expect(entityContainsTerm(entity, 'disponible', projector)).toBeTrue();
      expect(entityContainsTerm(entity, 'ocupado', projector)).toBeFalse();
    });
  });

  describe('filterEntitiesByTerm', () => {
    it('returns the original list when term is empty', () => {
      const filtered = filterEntitiesByTerm(entities, '', (item) => item.name);
      expect(filtered).toEqual(entities);
    });

    it('delegates to the projector when no alias matches', () => {
      const filtered = filterEntitiesByTerm(entities, 'alice', (item) => item.name.toLowerCase());
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Alice');
    });

    it('uses alias predicates when provided', () => {
      const aliases = {
        senior: (item: MockEntity & { senior?: boolean }) => Boolean(item.senior),
        junior: (item: MockEntity & { senior?: boolean }) => !item.senior
      };

      const extended = [
        { ...entities[0], senior: true },
        { ...entities[1], senior: false },
        { ...entities[2], senior: true }
      ];

      const filtered = filterEntitiesByTerm(extended, 'junior', (item) => item.name, aliases);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Alice');
    });
  });
});
