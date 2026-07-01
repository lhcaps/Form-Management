import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRuntimeTemplateCaseImportData,
  mergeRuntimeTemplateCaseImportData,
} from "./runtime-template-case-import";

test("buildRuntimeTemplateCaseImportData maps case detail into common form fields", () => {
  const data = buildRuntimeTemplateCaseImportData({
    id: "1",
    caseCode: "VKS-2026-0001",
    nationalCaseCode: "QG-1",
    caseTitle: "Vu an thu nghiem",
    caseSummary: "Tom tat",
    currentStage: "RECEPTION",
    currentStatus: "DRAFT",
    receivedDate: "2026-06-30",
    acceptedDate: null,
    prosecutedDate: null,
    closedDate: null,
    note: "Ghi chu",
    people: [
      {
        id: "cp1",
        caseId: "1",
        personId: "p1",
        roleType: "ACCUSED",
        personOrder: 1,
        legalStatus: null,
        isPrimary: true,
        isActive: true,
        note: null,
        person: {
          id: "p1",
          fullName: "Nguyen Van A",
          otherName: null,
          gender: null,
          dateOfBirth: null,
          identityNo: null,
          occupation: null,
          permanentAddress: "Dia chi thuong tru",
          currentAddress: "Dia chi hien tai",
        },
      },
    ],
    offenses: [
      {
        id: "o1",
        caseId: "1",
        personId: "p1",
        offenseId: "off1",
        legalArticleId: null,
        offenseDescription: null,
        isPrimary: true,
        isDeleted: false,
        offense: {
          id: "off1",
          offenseCode: "TCTP",
          offenseName: "Toi co y gay thuong tich",
          offenseGroup: null,
          description: null,
          isActive: true,
        },
      },
    ],
    assignments: [
      {
        id: "a1",
        caseId: "1",
        officialId: "u1",
        assignmentRole: "PROSECUTOR",
        assignedDate: null,
        endedDate: null,
        decisionNo: "QD-1",
        decisionDate: "2026-06-29",
        isActive: true,
        note: null,
        official: {
          id: "u1",
          fullName: "Kiem sat vien B",
          positionTitle: "Kiem sat vien",
          rankTitle: null,
        },
      },
    ],
  });

  assert.equal(data.caseInfo.caseCode, "VKS-2026-0001");
  assert.equal(data.caseInfo.accusedName, "Nguyen Van A");
  assert.equal(data.caseInfo.offenseName, "Toi co y gay thuong tich");
  assert.equal(data.signature.signerName, "Kiem sat vien B");
});

test("mergeRuntimeTemplateCaseImportData fills empty values without clobbering user input", () => {
  const result = mergeRuntimeTemplateCaseImportData(
    {
      caseInfo: {
        caseCode: "",
        caseTitle: "Nguoi dung da nhap",
      },
    },
    {
      caseInfo: {
        caseCode: "VKS-2026-0001",
        caseTitle: "Tu ho so",
      },
    },
  );

  assert.deepEqual(result, {
    caseInfo: {
      caseCode: "VKS-2026-0001",
      caseTitle: "Nguoi dung da nhap",
    },
  });
});
