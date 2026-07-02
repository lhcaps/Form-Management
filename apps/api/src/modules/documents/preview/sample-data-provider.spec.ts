/**
 * Sample Data Provider — unit tests
 *
 * Tests the JSON-based sample data provider that loads from:
 *   apps/api/resources/preview-sample-data/vks-khu-vuc-7.json
 *
 * @module documents/preview
 */

import { SampleDataProvider } from './sample-data-provider';

describe('SampleDataProvider', () => {
  let provider: SampleDataProvider;

  beforeEach(() => {
    // Create a fresh instance for each test
    provider = new SampleDataProvider();
  });

  describe('get', () => {
    it('returns the sample value for a known key', () => {
      expect(provider.get('person.fullName')).toBeTruthy();
      expect(provider.get('agency.name')).toBeTruthy();
    });

    it('returns undefined for an unknown key', () => {
      expect(provider.get('unknown.field')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all sample values', () => {
      const all = provider.getAll();
      expect(all.length).toBeGreaterThan(50);
      expect(all.every((v) => v.persisted === false)).toBe(true);
    });

    it('marks all values as non-persisted', () => {
      const all = provider.getAll();
      for (const value of all) {
        expect(value.persisted).toBe(false);
      }
    });
  });

  describe('toObject', () => {
    it('returns a flat key-value object', () => {
      const obj = provider.toObject();
      expect(typeof obj).toBe('object');
      expect(obj['person.fullName']).toBeTruthy();
    });
  });

  describe('byCategory', () => {
    it('filters by category', () => {
      const person = provider.byCategory('person');
      const agency = provider.byCategory('agency');

      expect(person.length).toBeGreaterThan(0);
      expect(person.every((v) => v.category === 'person')).toBe(true);

      expect(agency.length).toBeGreaterThan(0);
      expect(agency.every((v) => v.category === 'agency')).toBe(true);
    });
  });

  describe('sample data determinism', () => {
    it('returns the same value across multiple calls', () => {
      const first = provider.get('person.fullName');
      const second = provider.get('person.fullName');
      expect(first).toBe(second);
    });

    it('uses a fixed date (not Date.now)', () => {
      const date = provider.get('document.date');
      expect(date).toBe('15/07/2026');
      // The date must not contain dynamic values like the current date
      const today = new Date().toLocaleDateString('vi-VN');
      // We intentionally use a fixed date, not today's date
      expect(date).not.toBe(today);
    });
  });

  describe('sample data categories', () => {
    it('has person fields', () => {
      expect(provider.get('person.fullName')).toBeTruthy();
      expect(provider.get('person.dateOfBirth')).toBeTruthy();
      expect(provider.get('person.address')).toBeTruthy();
    });

    it('has agency fields', () => {
      expect(provider.get('agency.name')).toBeTruthy();
      expect(provider.get('agency.parentName')).toBeTruthy();
      expect(provider.get('agency.procuratorTitle')).toBeTruthy();
    });

    it('has offense fields', () => {
      expect(provider.get('offense.name')).toBeTruthy();
      expect(provider.get('offense.article')).toBeTruthy();
      expect(provider.get('offense.law')).toBeTruthy();
    });

    it('has case fields', () => {
      expect(provider.get('case.caseCode')).toBeTruthy();
      expect(provider.get('case.caseTitle')).toBeTruthy();
    });
  });

  describe('resource loading', () => {
    it('reports availability when resource is found', () => {
      const p = new SampleDataProvider();
      // The actual resource file should be available in test/dev/prod environments
      expect(p.isAvailable()).toBe(true);
    });

    it('reports null error when resource is found', () => {
      const p = new SampleDataProvider();
      expect(p.getLoadError()).toBeNull();
    });

    it('each instance shares the same cached values', () => {
      // After first load, subsequent instances should get the same cached data
      const p1 = new SampleDataProvider();
      const p2 = new SampleDataProvider();
      const all1 = p1.getAll();
      const all2 = p2.getAll();
      // Both should return the same values
      expect(all1.length).toBe(all2.length);
    });
  });

  describe('category mapping', () => {
    it('maps person category correctly', () => {
      const person = provider.byCategory('person');
      expect(person.length).toBeGreaterThan(0);
      expect(person.every((v) => v.category === 'person')).toBe(true);
    });

    it('maps agency category correctly', () => {
      const agency = provider.byCategory('agency');
      expect(agency.length).toBeGreaterThan(0);
      expect(agency.every((v) => v.category === 'agency')).toBe(true);
    });

    it('maps case category correctly', () => {
      const caseItems = provider.byCategory('case');
      expect(caseItems.length).toBeGreaterThan(0);
      expect(caseItems.every((v) => v.category === 'case')).toBe(true);
    });

    it('maps offense category correctly', () => {
      const offense = provider.byCategory('offense');
      expect(offense.length).toBeGreaterThan(0);
      expect(offense.every((v) => v.category === 'offense')).toBe(true);
    });

    it('maps general category correctly', () => {
      const general = provider.byCategory('general');
      expect(general.length).toBeGreaterThan(0);
      expect(general.every((v) => v.category === 'general')).toBe(true);
    });
  });

  describe('value shape', () => {
    it('all values have string type', () => {
      const all = provider.getAll();
      for (const value of all) {
        expect(typeof value.key).toBe('string');
        expect(typeof value.value).toBe('string');
      }
    });

    it('all values have a non-empty key', () => {
      const all = provider.getAll();
      for (const value of all) {
        expect(value.key.length).toBeGreaterThan(0);
      }
    });
  });
});
