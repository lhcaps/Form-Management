"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  defaultArchiveLine,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import { getDocumentRenderPayload, saveDocumentFormInputs } from "@/lib/document-form-api";

type StringRecord = Record<string, string>;
type JsonRecord = Record<string, unknown>;

type Bm213Form = {
  agency: {
    parentName: string;
    name: string;
  };
  document: {
    documentCode: string;
    issuePlaceAndDateLine: string;
  };
  official: {
    issuerTitle: string;
  };
  person: {
    fullName: string;
    genderLabel: string;
    otherName: string;
    dateOfBirthText: string;
    placeOfBirth: string;
    nationality: string;
    ethnicity: string;
    religion: string;
    occupation: string;
    identityDocumentLine: string;
    identityIssueLine: string;
    permanentAddress: string;
    temporaryAddress: string;
    currentAddress: string;
  };
  juvenileProtection: {
    contextLine: string;
    article1Line: string;
    resultDeadlineLine: string;
    article2Line: string;
  };
  recipients: {
    primaryLine: string;
    investigationAuthorityLine: string;
    otherRecipientsLine: string;
    archiveLine: string;
  };
  signature: {
    signerName: string;
  };
};

type Props = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const EMPTY_FORM: Bm213Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "213/YC-VKS",
    issuePlaceAndDateLine: "",
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
  },
  person: {
    fullName: "",
    genderLabel: "",
    otherName: "",
    dateOfBirthText: "",
    placeOfBirth: "",
    nationality: "Việt Nam",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityDocumentLine: "",
    identityIssueLine: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
  },
  juvenileProtection: {
    contextLine: "",
    article1Line: "",
    resultDeadlineLine: "",
    article2Line: "",
  },
  recipients: {
    primaryLine: "",
    investigationAuthorityLine: "",
    otherRecipientsLine: "",
    archiveLine: defaultArchiveLine(),
  },
  signature: {
    signerName: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<
  readonly [keyof Bm213Form, string, string]
> = [
  ["agency", "parentName", "Cơ quan cấp trên"],
  ["agency", "name", "Viện kiểm sát ban hành"],
  ["document", "documentCode", "Số yêu cầu"],
  ["document", "issuePlaceAndDateLine", "Địa danh, ngày ban hành"],
  ["official", "issuerTitle", "Chủ thể ban hành"],
  ["person", "fullName", "Họ tên người chưa thành niên"],
  ["person", "genderLabel", "Giới tính"],
  ["person", "dateOfBirthText", "Ngày sinh"],
  ["person", "placeOfBirth", "Nơi sinh"],
  ["person", "nationality", "Quốc tịch"],
  ["person", "ethnicity", "Dân tộc"],
  ["person", "occupation", "Nghề nghiệp hoặc tình trạng học tập"],
  ["person", "permanentAddress", "Nơi thường trú"],
  ["person", "currentAddress", "Nơi ở hiện tại"],
  ["juvenileProtection", "contextLine", "Bối cảnh cần bảo vệ"],
  ["juvenileProtection", "article1Line", "Biện pháp kỹ thuật"],
  ["juvenileProtection", "resultDeadlineLine", "Thời hạn thông báo kết quả"],
  ["juvenileProtection", "article2Line", "Yêu cầu phối hợp"],
  ["recipients", "primaryLine", "Nơi nhận chính"],
  [
    "recipients",
    "investigationAuthorityLine",
    "Cơ quan thực hiện biện pháp kỹ thuật",
  ],
  ["recipients", "archiveLine", "Dòng lưu hồ sơ"],
  ["signature", "signerName", "Họ tên người ký"],
];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function section(payload: JsonRecord, key: keyof Bm213Form): JsonRecord {
  const direct = payload[key];
  if (isRecord(direct)) return direct;

  for (const containerName of [
    "formInputs",
    "payloadOverrides",
    "renderPayloadOverrides",
  ]) {
    const container = payload[containerName];
    if (!isRecord(container)) continue;
    const nested = container[key];
    if (isRecord(nested)) return nested;
  }
  return {};
}

function normalizeForm(payload: JsonRecord): Bm213Form {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const official = section(payload, "official");
  const person = section(payload, "person");
  const juvenileProtection = section(payload, "juvenileProtection");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return {
    agency: {
      parentName: text(agency.parentName) || EMPTY_FORM.agency.parentName,
      name: text(agency.name) || EMPTY_FORM.agency.name,
    },
    document: {
      documentCode:
        text(document.documentCode) || EMPTY_FORM.document.documentCode,
      issuePlaceAndDateLine:
        text(document.issuePlaceAndDateLine) ||
        text(document.issuePlaceDateLine) ||
        EMPTY_FORM.document.issuePlaceAndDateLine,
    },
    official: {
      issuerTitle:
        text(official.issuerTitle) || EMPTY_FORM.official.issuerTitle,
    },
    person: {
      fullName: text(person.fullName),
      genderLabel: text(person.genderLabel) || text(person.genderText),
      otherName: text(person.otherName),
      dateOfBirthText:
        text(person.dateOfBirthText) || text(person.birthDateLine),
      placeOfBirth: text(person.placeOfBirth),
      nationality: text(person.nationality) || EMPTY_FORM.person.nationality,
      ethnicity: text(person.ethnicity),
      religion: text(person.religion),
      occupation: text(person.occupation),
      identityDocumentLine:
        text(person.identityDocumentLine) || text(person.identityNo),
      identityIssueLine: text(person.identityIssueLine),
      permanentAddress:
        text(person.permanentAddress) || text(person.permanentResidence),
      temporaryAddress:
        text(person.temporaryAddress) || text(person.temporaryResidence),
      currentAddress:
        text(person.currentAddress) || text(person.currentResidence),
    },
    juvenileProtection: {
      contextLine: text(juvenileProtection.contextLine),
      article1Line: text(juvenileProtection.article1Line),
      resultDeadlineLine: text(juvenileProtection.resultDeadlineLine),
      article2Line: text(juvenileProtection.article2Line),
    },
    recipients: {
      primaryLine: text(recipients.primaryLine),
      investigationAuthorityLine: text(
        recipients.investigationAuthorityLine,
      ),
      otherRecipientsLine: text(recipients.otherRecipientsLine),
      archiveLine:
        text(recipients.archiveLine) || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signerName: text(signature.signerName),
    },
  };
}

function validateForm(form: Bm213Form): string[] {
  return REQUIRED_FIELDS.flatMap(([sectionName, fieldName, label]) => {
    const values = form[sectionName] as StringRecord;
    return values[fieldName]?.trim() ? [] : [label];
  });
}

function buildSaveBody(form: Bm213Form) {
  const savedInputs = {
    agency: { ...form.agency },
    document: {
      ...form.document,
      issuePlaceDateLine: form.document.issuePlaceAndDateLine,
    },
    official: { ...form.official },
    person: { ...form.person },
    juvenileProtection: { ...form.juvenileProtection },
    recipients: { ...form.recipients },
    signature: { ...form.signature },
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName: form.signature.signerName.trim(),
  };
}

export function Bm213FormInputsPanel({ documentId, onSaved }: Props) {
  const [form, setForm] = useState<Bm213Form>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  function patch<T extends keyof Bm213Form>(
    sectionName: T,
    fieldName: keyof Bm213Form[T],
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [sectionName]: {
        ...(current[sectionName] as StringRecord),
        [fieldName]: value,
      },
    }));
    setIsDirty(true);
    setMessage(null);
  }

  async function reloadFromBackend() {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await getDocumentRenderPayload<JsonRecord>(documentId);
      setForm(normalizeForm(payload));
      setIsDirty(false);
      setMessage("Đã tải dữ liệu BM-213 từ hồ sơ.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được dữ liệu BM-213.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    const missing = validateForm(form);
    if (missing.length > 0) {
      setError(`Thiếu dữ liệu bắt buộc: ${missing.join(", ")}`);
      setMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveDocumentFormInputs(documentId, buildSaveBody(form));
      setIsDirty(false);
      setSavedAt(new Date());
      setMessage("Đã lưu dữ liệu BM-213 và đồng bộ payload render.");
      await onSaved?.();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không lưu được dữ liệu BM-213.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function fillSample() {
    setForm({
      agency: {
        parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      document: {
        documentCode: "213/YC-VKSKV7",
        issuePlaceAndDateLine:
          "TP. Hồ Chí Minh, ngày 22 tháng 6 năm 2026",
      },
      official: {
        issuerTitle:
          "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      person: {
        fullName: "Lê Hoàng Nam",
        genderLabel: "Nam",
        otherName: "",
        dateOfBirthText: "15 tháng 8 năm 2010",
        placeOfBirth: "TP. Hồ Chí Minh",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Học sinh",
        identityDocumentLine: "Số định danh cá nhân: 079210012345",
        identityIssueLine:
          "Cấp ngày 15/8/2024 tại Cục Cảnh sát QLHC về TTXH",
        permanentAddress:
          "Số 10 đường Nguyễn Du, Phường Bến Thành, TP. Hồ Chí Minh",
        temporaryAddress: "",
        currentAddress:
          "Số 10 đường Nguyễn Du, Phường Bến Thành, TP. Hồ Chí Minh",
      },
      juvenileProtection: {
        contextLine:
          "là bị hại trong vụ án đang được giải quyết; hình ảnh cá nhân đang bị phát tán trên không gian mạng, ảnh hưởng nghiêm trọng đến quyền riêng tư, danh dự và nhân phẩm.",
        article1Line:
          "Yêu cầu cơ quan có thẩm quyền áp dụng biện pháp ngăn chặn truy cập, gỡ bỏ và hạn chế phát tán thông tin, hình ảnh của người chưa thành niên.",
        resultDeadlineLine:
          "Cơ quan có thẩm quyền thông báo kết quả thực hiện cho Viện kiểm sát trước 16 giờ 00 ngày 23 tháng 6 năm 2026.",
        article2Line:
          "Yêu cầu các cơ quan, tổ chức, cá nhân liên quan phối hợp rà soát, cung cấp thông tin, phát hiện và xử lý hành vi phát tán trái pháp luật.",
      },
      recipients: {
        primaryLine: "Cơ quan điều tra có thẩm quyền",
        investigationAuthorityLine: "Đơn vị chuyên trách an ninh mạng",
        otherRecipientsLine: "Doanh nghiệp cung cấp dịch vụ mạng liên quan",
        archiveLine: defaultArchiveLine(),
      },
      signature: {
        signerName: "LÊ HOÀNG ANH",
      },
    });
    setIsDirty(true);
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-213.");
  }

  useEffect(() => {
    void reloadFromBackend();
  }, [documentId]);

  const warningMessage =
    !error && validationErrors.length > 0
      ? `Còn ${validationErrors.length} trường bắt buộc chưa nhập: ${validationErrors.join(", ")}.`
      : undefined;

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-213"
        title="Yêu cầu áp dụng biện pháp kỹ thuật bảo vệ người chưa thành niên"
        subtitle="Mẫu số 213/HS · Điều 155 Luật Tư pháp người chưa thành niên · Nhóm G04"
        isDirty={isDirty}
        isLoading={isLoading}
        isSaving={isSaving}
        errorMessage={error ?? undefined}
        warningMessage={warningMessage}
        successMessage={message ?? undefined}
        savedAt={savedAt}
        primaryLabel={isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-213"}
        onPrimary={handleSave}
        primaryDisabled={isSaving || isLoading}
        secondaryLabel="Tải lại từ hồ sơ"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-213"
            form={form}
            onApply={(next) => {
              setForm(next as Bm213Form);
              setIsDirty(true);
            }}
          />
        }
        meta={
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
            onClick={fillSample}
            disabled={isLoading || isSaving}
          >
            Điền dữ liệu mẫu
          </button>
        }
      />

      {error ? (
        <BmFormStatus kind="error" title="Không thể xử lý BM-213">
          {error}
        </BmFormStatus>
      ) : null}

      <BmFormSection
        title="1. Cơ quan và văn bản"
        description="Thông tin được đặt vào phần đầu và dòng chủ thể ban hành của DOCX."
      >
        <BmFieldText
          label="Cơ quan cấp trên"
          required
          value={form.agency.parentName}
          onChange={(value) => patch("agency", "parentName", value)}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => patch("agency", "name", value)}
        />
        <BmFieldText
          label="Số yêu cầu"
          required
          value={form.document.documentCode}
          onChange={(value) => patch("document", "documentCode", value)}
        />
        <BmFieldText
          label="Địa danh, ngày ban hành"
          required
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) =>
            patch("document", "issuePlaceAndDateLine", value)
          }
        />
        <BmFieldText
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => patch("official", "issuerTitle", value)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="2. Người chưa thành niên cần được bảo vệ"
        description="Các trường bám đúng từng dòng nhân thân trong Mẫu số 213/HS."
      >
        <BmFieldText
          label="Họ tên"
          required
          value={form.person.fullName}
          onChange={(value) => patch("person", "fullName", value)}
        />
        <BmFieldText
          label="Giới tính"
          required
          value={form.person.genderLabel}
          onChange={(value) => patch("person", "genderLabel", value)}
        />
        <BmFieldText
          label="Tên gọi khác"
          value={form.person.otherName}
          onChange={(value) => patch("person", "otherName", value)}
        />
        <BmFieldText
          label="Ngày sinh"
          required
          value={form.person.dateOfBirthText}
          onChange={(value) => patch("person", "dateOfBirthText", value)}
        />
        <BmFieldText
          label="Nơi sinh"
          required
          value={form.person.placeOfBirth}
          onChange={(value) => patch("person", "placeOfBirth", value)}
        />
        <BmFieldText
          label="Quốc tịch"
          required
          value={form.person.nationality}
          onChange={(value) => patch("person", "nationality", value)}
        />
        <BmFieldText
          label="Dân tộc"
          required
          value={form.person.ethnicity}
          onChange={(value) => patch("person", "ethnicity", value)}
        />
        <BmFieldText
          label="Tôn giáo"
          value={form.person.religion}
          onChange={(value) => patch("person", "religion", value)}
        />
        <BmFieldText
          label="Nghề nghiệp hoặc tình trạng học tập"
          required
          value={form.person.occupation}
          onChange={(value) => patch("person", "occupation", value)}
          fullWidth
        />
        <BmFieldText
          label="Số giấy tờ tùy thân hoặc số định danh"
          value={form.person.identityDocumentLine}
          onChange={(value) =>
            patch("person", "identityDocumentLine", value)
          }
          fullWidth
        />
        <BmFieldText
          label="Ngày cấp và nơi cấp giấy tờ"
          value={form.person.identityIssueLine}
          onChange={(value) => patch("person", "identityIssueLine", value)}
          fullWidth
        />
        <BmFieldText
          label="Nơi thường trú"
          required
          value={form.person.permanentAddress}
          onChange={(value) => patch("person", "permanentAddress", value)}
          fullWidth
        />
        <BmFieldText
          label="Nơi tạm trú"
          value={form.person.temporaryAddress}
          onChange={(value) => patch("person", "temporaryAddress", value)}
          fullWidth
        />
        <BmFieldText
          label="Nơi ở hiện tại"
          required
          value={form.person.currentAddress}
          onChange={(value) => patch("person", "currentAddress", value)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nội dung yêu cầu bảo vệ"
        description="Tách riêng bối cảnh, biện pháp kỹ thuật, thời hạn báo cáo và nghĩa vụ phối hợp."
        fullWidth
      >
        <BmFieldTextarea
          label="Bối cảnh cần bảo vệ"
          required
          rows={4}
          value={form.juvenileProtection.contextLine}
          onChange={(value) =>
            patch("juvenileProtection", "contextLine", value)
          }
        />
        <BmFieldTextarea
          label="Điều 1 - Biện pháp kỹ thuật được yêu cầu"
          required
          rows={4}
          value={form.juvenileProtection.article1Line}
          onChange={(value) =>
            patch("juvenileProtection", "article1Line", value)
          }
        />
        <BmFieldTextarea
          label="Thời hạn thông báo kết quả"
          required
          rows={3}
          value={form.juvenileProtection.resultDeadlineLine}
          onChange={(value) =>
            patch("juvenileProtection", "resultDeadlineLine", value)
          }
        />
        <BmFieldTextarea
          label="Điều 2 - Yêu cầu phối hợp"
          required
          rows={4}
          value={form.juvenileProtection.article2Line}
          onChange={(value) =>
            patch("juvenileProtection", "article2Line", value)
          }
        />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận">
        <BmFieldText
          label="Nơi nhận chính"
          required
          value={form.recipients.primaryLine}
          onChange={(value) => patch("recipients", "primaryLine", value)}
        />
        <BmFieldText
          label="Cơ quan thực hiện biện pháp kỹ thuật"
          required
          value={form.recipients.investigationAuthorityLine}
          onChange={(value) =>
            patch("recipients", "investigationAuthorityLine", value)
          }
        />
        <BmFieldText
          label="Cơ quan, tổ chức phối hợp khác"
          value={form.recipients.otherRecipientsLine}
          onChange={(value) =>
            patch("recipients", "otherRecipientsLine", value)
          }
        />
        <BmFieldText
          label="Dòng lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => patch("recipients", "archiveLine", value)}
        />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký">
        <BmFieldText
          label="Họ tên người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => patch("signature", "signerName", value)}
          fullWidth
        />
      </BmFormSection>
    </div>
  );
}
