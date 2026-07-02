/**
 * DOCX Preview Service — unit tests
 *
 * @module documents/preview
 */

import {
  SAMPLE_DATA_PROVIDER,
  SampleDataProvider,
} from './sample-data-provider';

describe('SampleDataProvider', () => {
  describe('get', () => {
    it('returns the sample value for a known key', () => {
      expect(SAMPLE_DATA_PROVIDER.get('person.fullName')).toBe('Nguyễn Văn A');
      expect(SAMPLE_DATA_PROVIDER.get('agency.name')).toBe(
        'Viện Kiểm sát nhân dân khu vực 7',
      );
    });

    it('returns undefined for an unknown key', () => {
      expect(SAMPLE_DATA_PROVIDER.get('unknown.field')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all sample values', () => {
      const all = SAMPLE_DATA_PROVIDER.getAll();
      expect(all.length).toBeGreaterThan(50);
      expect(all.every((v) => v.persisted === false)).toBe(true);
    });

    it('marks all values as non-persisted', () => {
      const all = SAMPLE_DATA_PROVIDER.getAll();
      for (const value of all) {
        expect(value.persisted).toBe(false);
      }
    });
  });

  describe('toObject', () => {
    it('returns a flat key-value object', () => {
      const obj = SAMPLE_DATA_PROVIDER.toObject();
      expect(typeof obj).toBe('object');
      expect(obj['person.fullName']).toBe('Nguyễn Văn A');
      expect(obj['document.date']).toBe('15/07/2026');
    });
  });

  describe('byCategory', () => {
    it('filters by category', () => {
      const person = SAMPLE_DATA_PROVIDER.byCategory('person');
      const agency = SAMPLE_DATA_PROVIDER.byCategory('agency');

      expect(person.length).toBeGreaterThan(0);
      expect(person.every((v) => v.category === 'person')).toBe(true);

      expect(agency.length).toBeGreaterThan(0);
      expect(agency.every((v) => v.category === 'agency')).toBe(true);
    });
  });
});

describe('Sample data determinism', () => {
  it('returns the same value across multiple calls', () => {
    const first = SAMPLE_DATA_PROVIDER.get('person.fullName');
    const second = SAMPLE_DATA_PROVIDER.get('person.fullName');
    expect(first).toBe(second);
  });

  it('uses a fixed date (not Date.now)', () => {
    const date = SAMPLE_DATA_PROVIDER.get('document.date');
    expect(date).toBe('15/07/2026');
    // The date must not contain dynamic values like the current date
    const today = new Date().toLocaleDateString('vi-VN');
    // We intentionally use a fixed date, not today's date
    expect(date).not.toBe(today);
  });
});

describe('Sample data categories', () => {
  it('has person fields', () => {
    expect(SAMPLE_DATA_PROVIDER.get('person.fullName')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('person.dateOfBirth')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('person.address')).toBeTruthy();
  });

  it('has agency fields', () => {
    expect(SAMPLE_DATA_PROVIDER.get('agency.name')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('agency.parentName')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('agency.procuratorTitle')).toBeTruthy();
  });

  it('has offense fields', () => {
    expect(SAMPLE_DATA_PROVIDER.get('offense.name')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('offense.article')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('offense.law')).toBeTruthy();
  });

  it('has case fields', () => {
    expect(SAMPLE_DATA_PROVIDER.get('case.caseCode')).toBeTruthy();
    expect(SAMPLE_DATA_PROVIDER.get('case.caseTitle')).toBeTruthy();
  });
});

describe('SampleDataProvider constructor', () => {
  it('can be instantiated with custom values', () => {
    const custom = new SampleDataProvider([
      {
        key: 'test.field',
        value: 'test-value',
        category: 'general',
        persisted: false,
      },
    ]);
    expect(custom.get('test.field')).toBe('test-value');
    expect(custom.get('person.fullName')).toBeUndefined();
  });
});
