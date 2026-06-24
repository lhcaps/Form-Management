import { readApi } from "./api-client";
import type { DbTemplate } from "./documents-api";

export { type DbTemplate } from "./documents-api";

export type TemplateSummary = {
  id: string;
  templateCode: string;
  templateNo: string | null;
  templateName: string;
  stageCode: string | null;
  renderScope: string;
  createdByOfficialId: string | null;
};

export async function fetchMyTemplates(): Promise<TemplateSummary[]> {
  return readApi<TemplateSummary[]>("/templates/mine", { noStore: true });
}

export async function fetchDbTemplates(): Promise<DbTemplate[]> {
  return readApi<DbTemplate[]>("/templates", { noStore: true });
}
