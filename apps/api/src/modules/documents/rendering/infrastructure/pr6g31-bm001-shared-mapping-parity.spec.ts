import {
  formatVietnamesePlaceDateLine,
  formatIdentityIssueDateLine,
  buildArchiveLine,
} from '@qllaw/form-contracts';

/**
 * PR6G.3.1 — cross-runtime parity contract for BM-001.
 *
 * These cases assert the exact BM-001 evidence strings that both
 * `apps/web` (templateDraft) and `apps/api` (generatedDocument) must
 * produce when consuming the shared toolkit. They are the single
 * source of parity truth for the BE/FE drift check.
 *
 * They run from inside `apps/api` so the BE side gets a hard
 * compile-time dependency on the shared toolkit — exactly the
 * structure PR6G.3.1 was created to enforce. If a future change to
 * the shared toolkit breaks any of these strings, the BE Jest run
 * fails before the BE / FE drift can ship.
 */

describe('PR6G.3.1 BM-001 cross-runtime parity', () => {
  it('BM-001 header date line still emits TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026', () => {
    expect(
      formatVietnamesePlaceDateLine({
        place: 'TP. Hồ Chí Minh',
        isoDate: '2026-07-04',
        defaultPlace: 'TP. Hồ Chí Minh',
      }),
    ).toBe('TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026');
  });

  it('BM-001 reception start date segment matches FE toolkit', () => {
    // The FE mapper composes: "ngày {day} tháng {month} năm {year}"
    // The BE shared adapter emits the same via formatVietnamesePlaceDateLine
    // with an empty place.
    expect(
      formatVietnamesePlaceDateLine({
        place: '',
        isoDate: '2025-12-26',
      }),
    ).toBe('ngày 26 tháng 12 năm 2025');
  });

  it('BM-001 identity issue date line still emits Cấp ngày 07 tháng 06 năm 2020', () => {
    expect(formatIdentityIssueDateLine('2020-06-07')).toBe(
      'Cấp ngày 07 tháng 06 năm 2020',
    );
  });

  it('BM-001 archive line falls back to Lưu: HSVA, HSKS, VP. when caller passes it (no leading dash; source DOCX renders the slot directly)', () => {
    // PR6G.3.1 follow-up — verified against the BM-001 normalized source
    // DOCX: `{{recipients.archiveLine}}` is rendered with no dash or
    // bullet outside the slot. The fallback is therefore the full line,
    // not a `- ` prefix.
    expect(
      buildArchiveLine('', 'Lưu: HSVA, HSKS, VP.'),
    ).toBe('Lưu: HSVA, HSKS, VP.');
  });

  it('BM-001 archive line does not force fallback globally when caller omits it', () => {
    expect(buildArchiveLine('', undefined)).toBe('');
  });

  it('Single-digit months preserve leading zero (PR6G.3 acceptance)', () => {
    expect(
      formatVietnamesePlaceDateLine({
        place: 'TP. Hồ Chí Minh',
        isoDate: '2026-07-04',
      }),
    ).toBe('TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026');
  });

  it('Identity issue date with single-digit day/month keeps leading zeros', () => {
    expect(formatIdentityIssueDateLine('2020-06-07')).toBe(
      'Cấp ngày 07 tháng 06 năm 2020',
    );
  });
});