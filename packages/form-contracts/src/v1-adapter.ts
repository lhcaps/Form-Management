import { createEmptyContract } from "./factory.js";
import type {
  ControlType,
  FieldDataSource,
  FormContractV2,
  V1Contract,
} from "./types.js";

function controlFromV1(value: string | undefined): ControlType {
  switch (value?.toLowerCase()) {
    case "textarea":
      return "TEXTAREA";
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "select":
      return "SELECT";
    case "checkbox":
      return "CHECKBOX";
    case "readonly":
      return "READONLY";
    default:
      return "TEXT";
  }
}

function sourceFromV1(value: string | undefined): FieldDataSource {
  switch (value) {
    case "agencyConfig":
      return { kind: "AGENCY", path: "agency" };
    case "officialConfig":
      return { kind: "OFFICIAL", path: "official" };
    case "casePayload":
      return { kind: "CASE", path: "case" };
    case "systemDate":
      return { kind: "SYSTEM", value: "CURRENT_DATE" };
    case "constantFromDocx":
      return { kind: "CONSTANT", value: "" };
    default:
      return { kind: "MANUAL" };
  }
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function adaptV1Contract(
  contract: V1Contract,
  agencyId: string | null = null,
): FormContractV2 {
  const adapted = createEmptyContract({
    templateCode: contract.templateCode,
    title: contract.templateTitle,
    agencyId,
    templateHash:
      contract.extractionSource?.sha256 ??
      contract.docx?.sha256 ??
      `legacy-${contract.sourceId}`,
    normalizedDocxPath: contract.extractionSource?.relativePath,
  });
  const sectionTitles = [
    ...new Set(
      (contract.canonicalFields ?? []).map(
        (field) => field.section || "Thông tin biểu mẫu",
      ),
    ),
  ];
  adapted.sections = sectionTitles.map((title, index) => ({
    id: `section-${slug(title) || index + 1}`,
    title,
    order: index,
    columns: 2,
  }));
  adapted.fields = (contract.canonicalFields ?? []).map((field, index) => {
    const sectionTitle = field.section || "Thông tin biểu mẫu";
    return {
      id: `field-${slug(field.path) || index + 1}`,
      key: field.path,
      sectionId:
        adapted.sections.find((section) => section.title === sectionTitle)?.id ??
        adapted.sections[0]?.id ??
        "section-default",
      label:
        contract.docxSlots?.find((slot) => slot.slotId === field.path)?.label ??
        field.path.split(".").at(-1) ??
        field.path,
      control: controlFromV1(field.uiComponent),
      order: index,
      width: 6,
      required: Boolean(field.required),
      dataSource: sourceFromV1(field.source),
    };
  });
  adapted.renderBindings = (contract.renderBindings ?? []).map(
    (binding, index) => ({
      id: `binding-${index + 1}`,
      target: { kind: "SLOT", slotId: binding.slotId },
      source: { kind: "FIELD", fieldKey: binding.from },
      transform: binding.transform || "identity",
      fallback: binding.fallback ?? "",
    }),
  );
  return adapted;
}
