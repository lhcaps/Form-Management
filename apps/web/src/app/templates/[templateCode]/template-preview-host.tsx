"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Client wrapper for the `/templates/[templateCode]` route. Receives a
 * bridge callback so the workspace component does not have to import
 * `next/navigation` directly — this keeps the templates workspace
 * free of `/documents/*` navigation, preserving the
 * "Standalone template = Runtime DOCX/Preview Session. No persisted
 * document." invariant while still allowing the explicit user-initiated
 * bridge to navigate to the freshly created draft.
 */
export function TemplatePreviewHost({
  templateCode,
  localUnlockAllForms,
  Workspace,
}: {
  templateCode: string;
  localUnlockAllForms: boolean;
  Workspace: (props: {
    templateCode: string;
    localUnlockAllForms: boolean;
    onDraftCreated?: (documentId: string | number) => void;
  }) => ReactNode;
}) {
  const router = useRouter();
  return (
    <Workspace
      templateCode={templateCode}
      localUnlockAllForms={localUnlockAllForms}
      onDraftCreated={(documentId) => router.push(`/documents/${documentId}`)}
    />
  );
}