import { PageShell } from "@/components/common/page-shell";
import { ImportWorkspace } from "@/components/imports/import-workspace";

export default function ImportsPage() {
  return (
    <PageShell maxWidth="default" className="bg-slate-50">
      <ImportWorkspace />
    </PageShell>
  );
}