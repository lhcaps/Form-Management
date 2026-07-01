import type { CaseDetail } from "./case-detail-api";

type PlainRecord = Record<string, unknown>;

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isRecord(value: unknown): value is PlainRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function preferred<T extends { isPrimary?: boolean; isActive?: boolean }>(
  items: T[],
): T | null {
  return (
    items.find((item) => item.isPrimary && item.isActive !== false) ??
    items.find((item) => item.isActive !== false) ??
    items[0] ??
    null
  );
}

export function buildRuntimeTemplateCaseImportData(
  detail: Pick<
    CaseDetail,
    | "id"
    | "caseCode"
    | "nationalCaseCode"
    | "caseTitle"
    | "caseSummary"
    | "currentStage"
    | "currentStatus"
    | "receivedDate"
    | "acceptedDate"
    | "prosecutedDate"
    | "closedDate"
    | "note"
    | "people"
    | "offenses"
    | "assignments"
  >,
): Record<string, Record<string, string>> {
  const person = preferred(detail.people)?.person ?? null;
  const offense = preferred(detail.offenses);
  const assignment = preferred(detail.assignments);
  const official = assignment?.official ?? null;

  return {
    case: {
      id: text(detail.id),
      caseCode: text(detail.caseCode),
      nationalCaseCode: text(detail.nationalCaseCode),
      caseTitle: text(detail.caseTitle),
      caseSummary: text(detail.caseSummary),
      currentStage: text(detail.currentStage),
      currentStatus: text(detail.currentStatus),
      receivedDate: text(detail.receivedDate),
      acceptedDate: text(detail.acceptedDate),
      prosecutedDate: text(detail.prosecutedDate),
      closedDate: text(detail.closedDate),
      note: text(detail.note),
    },
    caseInfo: {
      caseCode: text(detail.caseCode),
      caseTitle: text(detail.caseTitle),
      summaryLine: text(detail.caseSummary),
      accusedName: text(person?.fullName),
      offenseName: text(offense?.offense?.offenseName),
      offenseCode: text(offense?.offense?.offenseCode),
      legalArticle: text(offense?.offenseDescription),
      receivedDate: text(detail.receivedDate),
    },
    person: {
      fullName: text(person?.fullName),
      otherName: text(person?.otherName),
      gender: text(person?.gender),
      dateOfBirth: text(person?.dateOfBirth),
      identityNo: text(person?.identityNo),
      occupation: text(person?.occupation),
      permanentAddress: text(person?.permanentAddress),
      currentAddress: text(person?.currentAddress),
    },
    offense: {
      name: text(offense?.offense?.offenseName),
      code: text(offense?.offense?.offenseCode),
      group: text(offense?.offense?.offenseGroup),
      description: text(offense?.offenseDescription),
    },
    content: {
      summaryLine: text(detail.caseSummary),
    },
    signature: {
      signerName: text(official?.fullName),
      signerPosition: text(official?.positionTitle),
      signerRank: text(official?.rankTitle),
    },
    assignment: {
      decisionNo: text(assignment?.decisionNo),
      decisionDate: text(assignment?.decisionDate),
      assignedDate: text(assignment?.assignedDate),
      role: text(assignment?.assignmentRole),
    },
  };
}

export function mergeRuntimeTemplateCaseImportData(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  for (const [key, incomingValue] of Object.entries(incoming)) {
    if (isRecord(incomingValue)) {
      const currentValue = next[key];
      next[key] = mergeRuntimeTemplateCaseImportData(
        isRecord(currentValue) ? currentValue : {},
        incomingValue,
      );
      continue;
    }

    if (!isEmpty(incomingValue) && isEmpty(next[key])) {
      next[key] = incomingValue;
    }
  }

  return next;
}
