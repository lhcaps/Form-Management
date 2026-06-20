import { Injectable } from '@nestjs/common';
import { stableStringify, type FormContractV2 } from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import { FormStudioError } from '../domain/form-studio.error';

type DiffEntry = {
  kind: 'ADDED' | 'REMOVED' | 'CHANGED';
  area: 'SECTION' | 'FIELD' | 'BINDING' | 'RULE';
  key: string;
  before?: unknown;
  after?: unknown;
};

function diffCollection(
  area: DiffEntry['area'],
  before: Array<Record<string, unknown>>,
  after: Array<Record<string, unknown>>,
  keyOf: (value: Record<string, unknown>) => string,
): DiffEntry[] {
  const left = new Map(before.map((value) => [keyOf(value), value]));
  const right = new Map(after.map((value) => [keyOf(value), value]));
  const keys = [...new Set([...left.keys(), ...right.keys()])].sort();
  return keys.flatMap((key): DiffEntry[] => {
    const previous = left.get(key);
    const current = right.get(key);
    if (!previous && current)
      return [{ kind: 'ADDED', area, key, after: current }];
    if (previous && !current) {
      return [{ kind: 'REMOVED', area, key, before: previous }];
    }
    if (stableStringify(previous) !== stableStringify(current)) {
      return [
        {
          kind: 'CHANGED',
          area,
          key,
          before: previous,
          after: current,
        },
      ];
    }
    return [];
  });
}

function contractDiff(
  before: FormContractV2 | null,
  after: FormContractV2,
): DiffEntry[] {
  const previous = before ?? {
    sections: [],
    fields: [],
    renderBindings: [],
    conditionalRules: [],
    validationRules: [],
  };
  return [
    ...diffCollection(
      'SECTION',
      previous.sections as unknown as Array<Record<string, unknown>>,
      after.sections as unknown as Array<Record<string, unknown>>,
      (value) => String(value.id),
    ),
    ...diffCollection(
      'FIELD',
      previous.fields as unknown as Array<Record<string, unknown>>,
      after.fields as unknown as Array<Record<string, unknown>>,
      (value) => String(value.key),
    ),
    ...diffCollection(
      'BINDING',
      previous.renderBindings as unknown as Array<Record<string, unknown>>,
      after.renderBindings as unknown as Array<Record<string, unknown>>,
      (value) => String(value.id),
    ),
    ...diffCollection(
      'RULE',
      [
        ...previous.conditionalRules,
        ...previous.validationRules,
      ] as unknown as Array<Record<string, unknown>>,
      [...after.conditionalRules, ...after.validationRules] as unknown as Array<
        Record<string, unknown>
      >,
      (value) => String(value.id),
    ),
  ];
}

@Injectable()
export class FormReviewQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async get(versionId: string) {
    const current = await this.prisma.form_contract_versions.findUnique({
      where: { id: BigInt(versionId) },
      include: {
        reviews: {
          include: {
            actor_official: {
              select: { id: true, full_name: true },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    if (!current) {
      throw new FormStudioError(
        'FORM_REVIEW_NOT_FOUND',
        'Không tìm thấy phiên bản cần duyệt.',
        404,
      );
    }
    const previous = await this.prisma.form_contract_versions.findFirst({
      where: {
        id: { not: current.id },
        template_id: current.template_id,
        agency_id: current.agency_id,
        status: { in: ['PUBLISHED', 'ARCHIVED'] },
      },
      orderBy: [{ published_at: 'desc' }, { version_no: 'desc' }],
    });
    const currentContract = current.draft_json as FormContractV2;
    const previousContract = previous?.draft_json
      ? (previous.draft_json as FormContractV2)
      : null;
    return {
      versionId: String(current.id),
      revision: current.revision,
      status: current.status,
      previousVersionId: previous ? String(previous.id) : null,
      previousVersion: previous?.version_no ?? null,
      diff: contractDiff(previousContract, currentContract),
      comments: current.reviews.map((review) => ({
        id: String(review.id),
        action: review.action,
        comment: review.comment,
        revision: review.revision_no,
        actorId: String(review.actor_official.id),
        actorName: review.actor_official.full_name,
        createdAt: review.created_at,
      })),
    };
  }
}
