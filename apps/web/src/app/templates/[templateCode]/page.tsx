import { TemplatePreviewWorkspace } from "@/components/documents/template-preview-workspace";

type TemplatePreviewPageProps = {
  params: Promise<{
    templateCode: string;
  }>;
};

export default async function TemplatePreviewPage({
  params,
}: TemplatePreviewPageProps) {
  const { templateCode } = await params;

  return <TemplatePreviewWorkspace templateCode={templateCode} />;
}
