import { notFound } from "next/navigation";
import { TemplatePreviewWorkspace } from "@/components/documents/template-preview-workspace";
import { TemplatePreviewHost } from "./template-preview-host";
import { hasRegisteredBmPanel } from "@/lib/generated/bm-panel-codes.generated";
import {
  resolveFormAccess,
  resolveLocalAllFormsUnlock,
} from "@/lib/form-flight";

type TemplatePreviewPageProps = {
  params: Promise<{
    templateCode: string;
  }>;
};

export default async function TemplatePreviewPage({
  params,
}: TemplatePreviewPageProps) {
  const { templateCode } = await params;

  if (!hasRegisteredBmPanel(templateCode)) {
    notFound();
  }

  const localUnlockAllForms = resolveLocalAllFormsUnlock({
    nodeEnv: process.env.NODE_ENV,
    flagValue: process.env.NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS,
    isCi: process.env.CI === "true",
  });

  const access = resolveFormAccess({
    formCode: templateCode,
    localUnlockAllForms,
  });

  return (
    <TemplatePreviewHost
      templateCode={templateCode}
      localUnlockAllForms={localUnlockAllForms}
      Workspace={TemplatePreviewWorkspace}
    />
  );
}
