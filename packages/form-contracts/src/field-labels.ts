/**
 * Conservative Vietnamese field-label lookup for generated form inputs.
 *
 * Contracts remain the semantic source of truth. This helper only replaces
 * labels that are empty, obviously generic, or raw camelCase/path fragments.
 * Reviewed contract labels always win.
 */

export const FIELD_LABELS: Record<string, string> = {
  "agency.name": "Cơ quan ban hành",
  "agency.nameUpper": "Cơ quan ban hành",
  "agency.parentName": "Cơ quan cấp trên",
  "agency.code": "Mã cơ quan",

  "document.fullDocumentCode": "Số văn bản",
  "document.documentCode": "Số văn bản",
  "document.issueDate": "Ngày ban hành",
  "document.issuePlace": "Nơi ban hành",
  "document.issuePlaceDateLine": "Địa điểm, ngày ban hành",
  "document.title": "Tên văn bản",

  "caseInfo.caseCode": "Mã hồ sơ",
  "caseInfo.caseTitle": "Tên vụ án",
  "caseInfo.summary": "Tóm tắt vụ án",

  "person.fullName": "Họ tên",
  "fullName": "Họ tên",
  "person.idNumber": "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu",
  "person.birthDate": "Ngày sinh",
  "person.address": "Địa chỉ",

  "receiver.fullName": "Họ tên người tiếp nhận",
  "receiver.positionTitle": "Chức vụ người tiếp nhận",
  "receiver.departmentName": "Đơn vị người tiếp nhận",

  "reception.startedAtTimeText": "Giờ bắt đầu tiếp nhận",
  "reception.startedAtDay": "Ngày bắt đầu tiếp nhận",
  "reception.startedAtMonth": "Tháng bắt đầu tiếp nhận",
  "reception.startedAtYear": "Năm bắt đầu tiếp nhận",
  "reception.locationName": "Địa điểm tiếp nhận",

  "informant.fullName": "Họ tên người cung cấp tin",
  "informant.genderLabel": "Giới tính",
  "informant.birthDay": "Ngày sinh",
  "informant.birthMonth": "Tháng sinh",
  "informant.birthYear": "Năm sinh",
  "informant.placeOfBirth": "Nơi sinh",
  "informant.nationality": "Quốc tịch",
  "informant.ethnicity": "Dân tộc",
  "informant.religion": "Tôn giáo",
  "informant.occupation": "Nghề nghiệp",
  "informant.identityNo": "Số giấy tờ tùy thân",
  "informant.identityIssuedPlace": "Nơi cấp giấy tờ tùy thân",
  "informant.permanentAddress": "Địa chỉ thường trú",
  "informant.currentAddress": "Địa chỉ hiện tại",

  "signature.signerName": "Người ký",
  "signature.signerPosition": "Chức vụ người ký",
  "signature.signMode": "Phương thức ký",
};

const GENERIC_LABELS = new Set([
  "o trong",
  "ô trống",
  "slot",
  "field",
  "unknown",
  "todo",
]);

function normalizeLabel(value: string): string {
  return value.trim().toLocaleLowerCase("vi-VN");
}

function pathTail(path: string): string {
  return path.split(".").pop()?.trim() || path;
}

function humanizePath(path: string): string {
  const tail = pathTail(path);
  return tail
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRawPathFragment(path: string, label: string): boolean {
  const tail = pathTail(path);
  return normalizeLabel(label) === normalizeLabel(tail);
}

function isMeaningfulLabel(path: string, label: string | undefined): label is string {
  if (!label) return false;
  const trimmed = label.trim();
  if (!trimmed) return false;
  if (GENERIC_LABELS.has(normalizeLabel(trimmed))) return false;
  if (isRawPathFragment(path, trimmed)) return false;
  return true;
}

export function getFieldLabel(path: string, currentLabel?: string): string {
  if (isMeaningfulLabel(path, currentLabel)) return currentLabel.trim();
  return FIELD_LABELS[path] ?? humanizePath(path);
}
