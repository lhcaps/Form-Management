/**
 * Sample Data Provider
 *
 * Provides deterministic, non-persisted sample values for DOCX preview
 * without modifying any business data in the database.
 *
 * Usage:
 *   const sampleData = SAMPLE_DATA_PROVIDER.getForField('person.fullName');
 *   const allSamples = SAMPLE_DATA_PROVIDER.getAll();
 *
 * All sample data is marked as non-persisted. The preview API will
 * return `sample: true` in the response when sample data is used.
 *
 * @module documents/preview
 */

export type SampleDataKey = string;

/** A single sample value */
export interface SampleValue {
  key: SampleDataKey;
  value: string;
  category:
    | 'person'
    | 'agency'
    | 'case'
    | 'date'
    | 'offense'
    | 'address'
    | 'general';
  persisted: false;
}

/** Provider class */
export class SampleDataProvider {
  private readonly values: readonly SampleValue[];

  constructor(values: readonly SampleValue[]) {
    this.values = values;
  }

  /** Get all sample values */
  getAll(): readonly SampleValue[] {
    return this.values;
  }

  /** Get sample value by key */
  get(key: string): string | undefined {
    return this.values.find((v) => v.key === key)?.value;
  }

  /** Get all sample values as a flat object (for form input override) */
  toObject(): Record<string, string> {
    return Object.fromEntries(this.values.map((v) => [v.key, v.value]));
  }

  /** Get sample values filtered by category */
  byCategory(category: SampleValue['category']): readonly SampleValue[] {
    return this.values.filter((v) => v.category === category);
  }
}

/** Deterministic current date for sample preview */
const SAMPLE_DATE = '15/07/2026';
const SAMPLE_YEAR = '2026';

/** Core sample values for VKS Khu vực 7 legal documents */
const CORE_SAMPLES: readonly SampleValue[] = [
  // Person fields
  {
    key: 'person.fullName',
    value: 'Nguyễn Văn A',
    category: 'person',
    persisted: false,
  },
  {
    key: 'person.dateOfBirth',
    value: '01/01/1990',
    category: 'person',
    persisted: false,
  },
  {
    key: 'person.placeOfBirth',
    value: 'Tp. Hồ Chí Minh',
    category: 'person',
    persisted: false,
  },
  { key: 'person.gender', value: 'Nam', category: 'person', persisted: false },
  {
    key: 'person.nationality',
    value: 'Việt Nam',
    category: 'person',
    persisted: false,
  },
  {
    key: 'person.occupation',
    value: 'Công nhân',
    category: 'person',
    persisted: false,
  },
  {
    key: 'person.address',
    value: '123 Đường Lê Lợi, Quận 1, Tp. Hồ Chí Minh',
    category: 'address',
    persisted: false,
  },
  {
    key: 'person.idNumber',
    value: '012345678901',
    category: 'person',
    persisted: false,
  },
  {
    key: 'person.idNumberIssueDate',
    value: '15/03/2015',
    category: 'date',
    persisted: false,
  },
  {
    key: 'person.idNumberIssuePlace',
    value: 'Công an Tp. Hồ Chí Minh',
    category: 'person',
    persisted: false,
  },

  // Agency fields
  {
    key: 'agency.name',
    value: 'Viện Kiểm sát nhân dân khu vực 7',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.shortName',
    value: 'VKS Khu vực 7',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.parentName',
    value: 'Viện Kiểm sát nhân dân thành phố Hồ Chí Minh',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.procurator',
    value: 'Nguyễn Văn B',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.procuratorTitle',
    value: 'Viện trưởng',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.deputyProcurator',
    value: 'Trần Thị C',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'agency.deputyProcuratorTitle',
    value: 'Phó Viện trưởng',
    category: 'agency',
    persisted: false,
  },

  // Case fields
  {
    key: 'case.caseCode',
    value: 'VKS7-2026-001',
    category: 'case',
    persisted: false,
  },
  {
    key: 'case.caseTitle',
    value: 'Vụ án hình sự về tội trộm cắp tài sản',
    category: 'case',
    persisted: false,
  },
  {
    key: 'case.caseType',
    value: 'Hình sự',
    category: 'case',
    persisted: false,
  },
  {
    key: 'case.investigationAgency',
    value: 'Công an Quận 7',
    category: 'agency',
    persisted: false,
  },
  {
    key: 'case.prosecutionDecisionNumber',
    value: 'QĐ-KS-VKS7-2026-001',
    category: 'case',
    persisted: false,
  },

  // Offense fields
  {
    key: 'offense.name',
    value: 'Tội trộm cắp tài sản',
    category: 'offense',
    persisted: false,
  },
  {
    key: 'offense.law',
    value: 'Bộ luật Hình sự',
    category: 'offense',
    persisted: false,
  },
  {
    key: 'offense.article',
    value: 'Điều 173',
    category: 'offense',
    persisted: false,
  },
  {
    key: 'offense.clause',
    value: 'Khoản 1',
    category: 'offense',
    persisted: false,
  },
  {
    key: 'offense.description',
    value:
      'Có hành vi trộm cắp tài sản của người khác với giá trị từ 2.000.000 đồng đến dưới 50.000.000 đồng.',
    category: 'offense',
    persisted: false,
  },

  // Date fields
  {
    key: 'document.date',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.dateYear',
    value: SAMPLE_YEAR,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.issueDate',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.decisionDate',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.incidentDate',
    value: '10/06/2026',
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.investigationStartDate',
    value: '12/06/2026',
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.detentionDate',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.remandDate',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },
  {
    key: 'document.formDate',
    value: SAMPLE_DATE,
    category: 'date',
    persisted: false,
  },

  // Document number fields
  {
    key: 'document.number',
    value: 'QĐ-001/VKS7',
    category: 'general',
    persisted: false,
  },
  {
    key: 'document.numberShort',
    value: '001',
    category: 'general',
    persisted: false,
  },
  {
    key: 'document.orderNumber',
    value: '01',
    category: 'general',
    persisted: false,
  },

  // Place fields
  {
    key: 'document.place',
    value: 'Tp. Hồ Chí Minh',
    category: 'address',
    persisted: false,
  },
  {
    key: 'document.detentionPlace',
    value: 'Trại giam Bình Hưng',
    category: 'address',
    persisted: false,
  },
  {
    key: 'document.incidentPlace',
    value: 'Quận 7, Tp. Hồ Chí Minh',
    category: 'address',
    persisted: false,
  },
  {
    key: 'document.hearingPlace',
    value: 'Tòa án nhân dân Quận 7',
    category: 'address',
    persisted: false,
  },

  // Signature fields
  {
    key: 'signature.procuratorName',
    value: 'Nguyễn Văn B',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.prosecutorName',
    value: 'Nguyễn Văn B',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.investigatorName',
    value: 'Lê Văn C',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.witness1Name',
    value: 'Phạm Văn D',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.witness2Name',
    value: 'Hoàng Văn E',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.recorderName',
    value: 'Võ Thị F',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.recipientName',
    value: 'Đặng Văn G',
    category: 'person',
    persisted: false,
  },
  {
    key: 'signature.recipientTitle',
    value: 'Trưởng Công an Quận 7',
    category: 'general',
    persisted: false,
  },

  // Amount fields
  {
    key: 'money.amount',
    value: '10.000.000 đồng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'money.bailAmount',
    value: '50.000.000 đồng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'money.seizedAmount',
    value: '5.000.000 đồng',
    category: 'general',
    persisted: false,
  },

  // Duration fields
  {
    key: 'duration.remandDuration',
    value: '01 tháng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'duration.investigationDuration',
    value: '02 tháng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'duration.detentionDuration',
    value: '03 tháng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'duration.bailDuration',
    value: '06 tháng',
    category: 'general',
    persisted: false,
  },
  {
    key: 'duration.travelRestrictionDuration',
    value: '12 tháng',
    category: 'general',
    persisted: false,
  },

  // General fields
  {
    key: 'general.note',
    value: 'Ghi chú mẫu',
    category: 'general',
    persisted: false,
  },
  {
    key: 'general.reason',
    value: 'Căn cứ vào Bộ luật Tố tụng hình sự',
    category: 'general',
    persisted: false,
  },
  {
    key: 'general.basis',
    value: 'Căn cứ vào Điều 173 Bộ luật Hình sự',
    category: 'general',
    persisted: false,
  },
  {
    key: 'general.description',
    value: 'Nội dung mẫu được điền tự động để xem trước bản in.',
    category: 'general',
    persisted: false,
  },
  {
    key: 'general.recipients',
    value:
      'Công an Quận 7; Viện Kiểm sát nhân dân thành phố Hồ Chí Minh; Lưu hồ sơ.',
    category: 'general',
    persisted: false,
  },
];

/** Singleton instance */
export const SAMPLE_DATA_PROVIDER = new SampleDataProvider(CORE_SAMPLES);
