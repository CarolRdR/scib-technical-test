import {
  findAvailabilityRawValue,
  findValueByAliases,
  findYearsValue,
  isFalseAvailabilityToken,
  isTrueAvailabilityToken,
  normalizeAliasToken
} from './excel-alias.utils';

describe('excel-alias.utils', () => {
  const row = {
    years: 3,
    disponibilidad: 'sí',
    availability: '',
    foo: undefined
  };

  it('should find first non-empty value by aliases', () => {
    expect(findValueByAliases(row, ['foo', 'years'])).toBe(3);
  });

  it('should find years value using predefined aliases', () => {
    expect(findYearsValue(row)).toBe(3);
  });

  it('should find availability value using predefined aliases', () => {
    expect(findAvailabilityRawValue(row)).toBe('sí');
  });

  it('should normalize alias tokens removing accents and casing', () => {
    expect(normalizeAliasToken(' Sí ')).toBe('si');
  });

  it('should detect true availability tokens', () => {
    expect(isTrueAvailabilityToken('si')).toBeTrue();
    expect(isTrueAvailabilityToken('yes')).toBeTrue();
    expect(isTrueAvailabilityToken('maybe')).toBeFalse();
  });

  it('should detect false availability tokens', () => {
    expect(isFalseAvailabilityToken('no')).toBeTrue();
    expect(isFalseAvailabilityToken('false')).toBeTrue();
    expect(isFalseAvailabilityToken('yes')).toBeFalse();
  });
});
