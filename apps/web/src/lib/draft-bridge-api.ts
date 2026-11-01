import { readApi } from "./api-client";

export type CreateDraftFromTemplateRequest = {
  templateCode: string;
  caseId: string;
  targetPersonId?: string;
};

export type CreateDraftFromTemplateResponse = {
  documentId: string;
  templateCode: string;
  isNew: boolean;
  reused: boolean;
  caseId: string;
  reviewStatus: string;
  documentTitle: string;
};

export async function createDraftFromTemplate(
  request: CreateDraftFromTemplateRequest,
): Promise<CreateDraftFromTemplateResponse> {
  return readApi<CreateDraftFromTemplateResponse>(
    '/documents/draft-from-template',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
}
