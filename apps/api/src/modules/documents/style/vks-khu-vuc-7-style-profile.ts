/**
 * VKS Khu vực 7 — DOCX Style Profile
 *
 * Canonical reference for legal document formatting in Vietnamese Prosecution Office
 * (Viện kiểm sát nhân dân khu vực / district-level prosecution office).
 *
 * This profile is a READ-ONLY reference used by the style audit engine.
 * It does NOT mutate DOCX files. It does NOT force-apply styles globally.
 *
 * Usage:
 *   import { VKS_KHU_VUC_7_STYLE_PROFILE } from './vks-khu-vuc-7-style-profile';
 *
 * @module documents/style
 */

export const VKS_KHU_VUC_7_STYLE_PROFILE = {
  /** Profile identity */
  profileId: 'vks-khu-vuc-7' as const,
  profileName: 'Viện Kiểm Sát Nhân Dân Khu Vực 7',
  version: '1.0.0' as const,

  /** Global font and size baseline */
  global: {
    fontFamily: 'Times New Roman',
    /** Half-points: 26 = 13pt */
    baseFontSizeHalfPoints: 26,
    baseFontSizeLabel: '13pt',
  },

  /** Left header block */
  headerLeft: {
    parentAgency: {
      text: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
      bold: false,
    },
    issuingAgency: {
      text: 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      bold: true,
      /** The underline should be constrained to "KHU VỰC 7" text only, not the full line. */
      underlineUnder: 'KHU VỰC 7',
    },
  },

  /** Right header block (national motto) */
  headerRight: {
    quocHieu: {
      text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
      bold: true,
      /** Half-points: 26 = 13pt */
      fontSizeHalfPoints: 26,
      fontSizeLabel: '13pt',
    },
    motto: {
      text: 'Độc lập - Tự do - Hạnh phúc',
      bold: true,
      /** Half-points: 28 = 14pt */
      fontSizeHalfPoints: 28,
      fontSizeLabel: '14pt',
      /** Underline width should match exact motto text width. */
      underlineUnder: 'Độc lập - Tự do - Hạnh phúc',
    },
    placeDate: {
      /** e.g., "Tp. Hồ Chí Minh, ngày ..." — italic size 14 */
      italic: true,
      /** Half-points: 28 = 14pt */
      fontSizeHalfPoints: 28,
      fontSizeLabel: '14pt',
    },
  },

  /** Template number / circular reference block */
  template: {
    sampleNumberLine: {
      /** e.g., "Mẫu số 01/HS" */
      pattern: /Mẫu\s+số\s+\S+/iu,
    },
    circularReference: {
      text: 'Ban hành theo Thông tư số 03/2026/TT-VKSTC ngày 09/02/2026',
      /** Half-points: 16 = 8pt */
      fontSizeHalfPoints: 16,
      fontSizeLabel: '8pt',
    },
  },

  /** Body section */
  body: {
    mainTitle: {
      /** e.g., "QUYẾT ĐỊNH", "LỆNH", "BIÊN BẢN" */
      bold: true,
      /** Half-points: 28 = 14pt */
      fontSizeHalfPoints: 28,
      fontSizeLabel: '14pt',
      examples: [
        'QUYẾT ĐỊNH',
        'LỆNH',
        'BIÊN BẢN',
        'CÁO TRẠNG',
        'THÔNG BÁO',
        'KẾ HOẠCH',
      ],
    },
    subtitle: {
      bold: true,
      /** Half-points: 28 = 14pt */
      fontSizeHalfPoints: 28,
      fontSizeLabel: '14pt',
      /** One blank line between main title and subtitle */
      spacingBefore: 'one-line',
    },
    articleHeadings: {
      /** "Điều 1", "Điều 2", "1.", "2." lines */
      bold: true,
      patterns: [
        /^Điều\s+\d+/iu,
        /^\d+\.\s/iu,
        /^I+[.)]\s/iu,
        /^II[.)]\s/iu,
        /^III[.)]\s/iu,
      ],
    },
  },

  /** Footer section */
  footer: {
    recipientLabel: {
      text: 'Nơi nhận:',
      bold: true,
      italic: true,
      /** Half-points: 24 = 12pt */
      fontSizeHalfPoints: 24,
      fontSizeLabel: '12pt',
    },
    recipientLines: {
      /** Half-points: 22 = 11pt */
      fontSizeHalfPoints: 22,
      fontSizeLabel: '11pt',
    },
    signatureTitle: {
      /** e.g., "VIỆN TRƯỞNG", "Kiểm sát viên" */
      bold: true,
      /** Half-points: 28 = 14pt */
      fontSizeHalfPoints: 28,
      fontSizeLabel: '14pt',
      examples: [
        'Viện trưởng',
        'Phó Viện trưởng',
        'Kiểm sát viên',
        'Kiểm sát viên trung ương',
      ],
      /** 2–3 blank lines between title and name */
      spacingAfterName: '2-3-lines',
    },
  },

  /** Page / section settings */
  page: {
    differentFirstPage: {
      required: true,
      description: 'First page header/footer differs from subsequent pages',
    },
    pageNumbering: {
      requiredWhenPageCountExceeds: 2,
      description: 'Page numbers required for documents longer than 2 pages',
    },
    margins: {
      /** Detected from existing documents; not enforced */
      note: 'Detect from existing document or leave as-is',
    },
  },
} as const;

/** Convenience: extract font size in half-points from size label like "13pt" */
export function parseFontSizeHalfPoints(sizeLabel: string): number {
  const match = sizeLabel.match(/^(\d+)(?:pt)?$/);
  if (!match) return 26; // default 13pt
  return Number(match[1]) * 2;
}

/** Convenience: human-readable size label from half-points */
export function halfPointsToLabel(hp: number): string {
  return `${hp / 2}pt`;
}

/** All required bold patterns for article/section headings */
export const ARTICLE_HEADING_PATTERNS = [
  /^Điều\s+\d+/iu,
  /^\d+\.\s/iu,
  /^I+[.)]\s/iu,
  /^II[.)]\s/iu,
  /^III[.)]\s/iu,
] as const;

/** All required body title keywords */
export const BODY_TITLE_KEYWORDS = [
  'BIÊN BẢN',
  'QUYẾT ĐỊNH',
  'CÁO TRẠNG',
  'THÔNG BÁO',
  'LỆNH',
  'KẾ HOẠCH',
] as const;

export type VksStyleProfile = typeof VKS_KHU_VUC_7_STYLE_PROFILE;
