"use client";

import dynamic from "next/dynamic";

const FormStudioWorkspace = dynamic(
  () =>
    import("@/components/form-studio/form-studio-workspace").then(
      (module) => module.FormStudioWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[70vh] place-items-center text-sm font-semibold text-slate-500">
        Đang khởi tạo Form Studio…
      </div>
    ),
  },
);

export default function FormStudioPage() {
  return <FormStudioWorkspace />;
}
