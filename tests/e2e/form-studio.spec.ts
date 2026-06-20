import { expect, test } from "@playwright/test";

const emptyContract = {
  schemaVersion: "2.0",
  templateCode: "CUS-VKS01-0001",
  title: "Biểu mẫu kiểm thử",
  agencyId: "1",
  version: 1,
  status: "DRAFT",
  baseContractHash: null,
  contractHash: "",
  templateHash: "pending-CUS-VKS01-0001",
  sections: [],
  fields: [],
  repeatableGroups: [],
  tables: [],
  computedFields: [],
  conditionalRules: [],
  validationRules: [],
  defaultRules: [],
  presetRules: [],
  renderBindings: [],
  migrationRules: [],
  extensionPoints: [],
};

test("admin can add a field and change its control type", async ({
  context,
  page,
}) => {
  let revision = 0;
  let currentContract = structuredClone(emptyContract);
  const draft = () => ({
    id: "501",
    templateId: "91",
    agencyId: "1",
    version: 1,
    status: "DRAFT",
    revision,
    contract: currentContract,
    compiledContract: null,
    createdByOfficialId: "1",
    approvedByOfficialId: null,
    publishedByOfficialId: null,
    submittedAt: null,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  });

  await context.addCookies([
    {
      name: "qlv_session",
      value: "playwright-session",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "1",
        username: "admin",
        fullName: "Quản trị viên",
        positionTitle: "Administrator",
        rankTitle: null,
        email: null,
        phone: null,
        role: "ADMIN",
        agencyId: "1",
        agencyName: "VKS kiểm thử",
        agencyCode: "VKS01",
        isActive: true,
        permissions: [
          "FORM_TEMPLATE_EDIT",
          "FORM_TEMPLATE_APPROVE",
          "FORM_TEMPLATE_PERMISSION_ADMIN",
        ],
      }),
    }),
  );
  await page.route("**/api/v1/admin/form-templates**", async (route) => {
    const request = route.request();
    if (request.method() === "POST" && request.url().endsWith("/form-templates")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(draft()),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
  await page.route("**/api/v1/admin/form-drafts/501", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as {
        operations: Array<Record<string, unknown>>;
      };
      for (const operation of body.operations) {
        if (operation.type === "ADD_SECTION") {
          currentContract.sections.push(operation.section as never);
        }
        if (operation.type === "ADD_FIELD") {
          currentContract.fields.push(operation.field as never);
        }
        if (operation.type === "UPDATE_FIELD") {
          currentContract.fields = currentContract.fields.map((field) =>
            field.id === operation.fieldId
              ? { ...field, ...(operation.patch as object) }
              : field,
          );
        }
      }
      revision += 1;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(draft()),
    });
  });

  await page.goto("/admin/form-studio");
  await expect(page.getByRole("heading", { name: "Form Studio" })).toBeVisible();
  await page.getByRole("button", { name: "+ Biểu mẫu trống" }).click();
  await page.getByLabel("Tên biểu mẫu").fill("Biểu mẫu kiểm thử");
  await page.getByRole("button", { name: "Tạo draft" }).click();

  await expect(page.getByText("Canvas người dùng")).toBeVisible();
  await page.getByRole("button", { name: /Văn bản/ }).click();
  await expect(page.getByLabel("Nhãn hiển thị")).toHaveValue("Trường mới");
  await page.getByLabel("Kiểu ô").selectOption("TEXTAREA");
  await expect(page.locator("textarea").first()).toBeVisible();
  await page.getByLabel("Nhãn hiển thị").fill("Nội dung tùy chỉnh");
  await expect(page.getByText("Nội dung tùy chỉnh").first()).toBeVisible();

  await expect.poll(() => revision).toBeGreaterThan(0);
});
