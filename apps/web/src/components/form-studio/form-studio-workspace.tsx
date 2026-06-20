"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ContractIssue,
  ControlType,
  FieldDefinition,
  FormContractV2,
} from "@qllaw/form-contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ContractV2Renderer } from "@/features/forms-contracts/ContractV2Renderer";
import { useAuth } from "@/lib/auth-context";
import {
  approveFormDraft,
  archiveFormVersion,
  cloneFormTemplate,
  createBlankFormTemplate,
  getFormDraft,
  getFormReview,
  importFormTemplate,
  listFormStudioTemplates,
  patchFormDraft,
  previewArtifactUrl,
  previewFormDraft,
  publishFormVersion,
  requestFormChanges,
  submitFormDraft,
  validateFormDraft,
  type DraftOperation,
  type FormDraftRecord,
  type FormStudioTemplateSummary,
  type FormReviewDetail,
} from "@/lib/form-studio-api";

const CONTROL_PALETTE: Array<{
  control: ControlType;
  label: string;
  symbol: string;
}> = [
  { control: "TEXT", label: "Văn bản", symbol: "T" },
  { control: "TEXTAREA", label: "Đoạn văn", symbol: "¶" },
  { control: "NUMBER", label: "Số", symbol: "#" },
  { control: "DATE", label: "Ngày", symbol: "◫" },
  { control: "PARTIAL_DATE", label: "Ngày một phần", symbol: "◩" },
  { control: "TIME", label: "Giờ", symbol: "◷" },
  { control: "SELECT", label: "Danh sách", symbol: "⌄" },
  { control: "RADIO", label: "Một lựa chọn", symbol: "◉" },
  { control: "CHECKBOX", label: "Đánh dấu", symbol: "☑" },
  { control: "AGENCY_PICKER", label: "Chọn cơ quan", symbol: "A" },
  { control: "OFFICIAL_PICKER", label: "Chọn cán bộ", symbol: "O" },
  { control: "PERSON_PICKER", label: "Chọn người", symbol: "P" },
  { control: "READONLY", label: "Chỉ đọc", symbol: "R" },
  { control: "COMPUTED", label: "Tự tính", symbol: "ƒ" },
];

type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";
type StudioTab = "FORM" | "BINDINGS" | "PREVIEW" | "VALIDATION" | "VERSIONS";

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function applyLocalOperation(
  contract: FormContractV2,
  operation: DraftOperation,
): FormContractV2 {
  const next = structuredClone(contract);
  switch (operation.type) {
    case "ADD_SECTION":
      next.sections.push(operation.section);
      break;
    case "UPDATE_SECTION":
      next.sections = next.sections.map((section) =>
        section.id === operation.sectionId
          ? { ...section, ...operation.patch, id: section.id }
          : section,
      );
      break;
    case "REMOVE_SECTION":
      next.sections = next.sections.filter(
        (section) => section.id !== operation.sectionId,
      );
      next.fields = next.fields.filter(
        (field) => field.sectionId !== operation.sectionId,
      );
      break;
    case "ADD_FIELD":
      next.fields.push(operation.field);
      break;
    case "UPDATE_FIELD":
      next.fields = next.fields.map((field) =>
        field.id === operation.fieldId
          ? { ...field, ...operation.patch, id: field.id }
          : field,
      );
      break;
    case "REMOVE_FIELD": {
      const field = next.fields.find((item) => item.id === operation.fieldId);
      next.fields = next.fields.filter(
        (item) => item.id !== operation.fieldId,
      );
      if (field) {
        next.renderBindings = next.renderBindings.filter(
          (binding) =>
            !(
              binding.source.kind === "FIELD" &&
              binding.source.fieldKey === field.key
            ),
        );
      }
      break;
    }
    case "MOVE_FIELD":
      next.fields = next.fields.map((field) =>
        field.id === operation.fieldId
          ? {
              ...field,
              sectionId: operation.sectionId,
              order: operation.order,
            }
          : field,
      );
      break;
    case "ADD_REPEATER":
      next.repeatableGroups.push(operation.repeater);
      break;
    case "REMOVE_REPEATER":
      next.repeatableGroups = next.repeatableGroups.filter(
        (item) => item.id !== operation.repeaterId,
      );
      break;
    case "ADD_TABLE":
      next.tables.push(operation.table);
      break;
    case "REMOVE_TABLE":
      next.tables = next.tables.filter(
        (item) => item.id !== operation.tableId,
      );
      break;
    case "REPLACE_CONTRACT":
      return structuredClone(operation.contract);
  }
  next.contractHash = "";
  next.status = "DRAFT";
  return next;
}

export function FormStudioWorkspace() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FormStudioTemplateSummary[]>([]);
  const [draft, setDraft] = useState<FormDraftRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const canEdit =
    user?.role === "ADMIN" ||
    user?.permissions?.includes("FORM_TEMPLATE_EDIT");

  const loadTemplates = useCallback(async (search = query) => {
    setLoading(true);
    setError("");
    try {
      setTemplates(await listFormStudioTemplates(search));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (canEdit) void loadTemplates("");
  }, [canEdit, loadTemplates]);

  if (!canEdit) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-8">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-black text-amber-950">
            Không có quyền Form Studio
          </h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Tài khoản cần quyền FORM_TEMPLATE_EDIT. Hãy liên hệ quản trị viên
            quyền biểu mẫu.
          </p>
        </div>
      </div>
    );
  }

  if (draft) {
    return (
      <StudioEditor
        initialDraft={draft}
        templates={templates}
        onClose={() => {
          setDraft(null);
          void loadTemplates();
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F4F6F8] p-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              Quản trị biểu mẫu
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Form Studio
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Thiết kế trường dữ liệu, quy tắc và binding DOCX theo cơ quan.
              Chỉ phiên bản đã duyệt và publish mới xuất hiện cho người dùng.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.role === "ADMIN" ||
            user?.permissions?.includes("FORM_TEMPLATE_PERMISSION_ADMIN") ? (
              <Link
                href="/admin/form-studio/permissions"
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Phân quyền
              </Link>
            ) : null}
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50">
              Import DOC/DOCX
              <input
                type="file"
                accept=".doc,.docx"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImport(file, setDraft, setError);
                  }
                  event.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="min-h-11 rounded-lg bg-[#123B66] px-4 text-sm font-extrabold text-white shadow-sm hover:bg-[#0B2D50]"
            >
              + Biểu mẫu trống
            </button>
          </div>
        </header>

        <div className="mt-5 flex items-center gap-3">
          <input
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadTemplates();
            }}
            placeholder="Tìm theo mã hoặc tên biểu mẫu..."
          />
          <button
            type="button"
            onClick={() => void loadTemplates()}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold"
          >
            Tìm kiếm
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">Biểu mẫu</th>
                <th className="px-5 py-3 font-black">Phiên bản cơ quan</th>
                <th className="px-5 py-3 font-black">Trạng thái</th>
                <th className="px-5 py-3 text-right font-black">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                    Đang tải danh mục…
                  </td>
                </tr>
              ) : null}
              {!loading && templates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                    Chưa có biểu mẫu phù hợp.
                  </td>
                </tr>
              ) : null}
              {templates.map((template) => {
                const latest = template.versions[0];
                return (
                  <tr key={template.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-950">
                        {template.templateCode}
                      </div>
                      <div className="mt-1 max-w-xl text-slate-600">
                        {template.title}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {latest ? `v${latest.version} · rev ${latest.revision}` : "Chưa có"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={latest?.status ?? "DRAFT"} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {latest && latest.status !== "PUBLISHED" && latest.status !== "ARCHIVED" ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-2 font-bold"
                            onClick={() =>
                              void getFormDraft(latest.id).then(setDraft).catch((cause) =>
                                setError(cause instanceof Error ? cause.message : "Không mở được draft."),
                              )
                            }
                          >
                            Mở draft
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-800"
                          onClick={() =>
                            void cloneFormTemplate(template.id)
                              .then(setDraft)
                              .catch((cause) =>
                                setError(cause instanceof Error ? cause.message : "Không clone được biểu mẫu."),
                              )
                          }
                        >
                          Clone cho cơ quan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen ? (
        <CreateBlankDialog
          onClose={() => setCreateOpen(false)}
          onCreated={setDraft}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

async function handleImport(
  file: File,
  onCreated: (draft: FormDraftRecord) => void,
  onError: (message: string) => void,
) {
  const title = file.name.replace(/\.(docx?|DOCX?)$/, "");
  try {
    const result = await importFormTemplate({ title, file });
    onCreated(result.draft);
    if (result.conversionStatus === "CONVERSION_BLOCKED") {
      onError(
        "File DOC đã được lưu nhưng môi trường chưa convert được DOCX. Draft bị chặn publish đúng theo gate.",
      );
    }
  } catch (cause) {
    onError(cause instanceof Error ? cause.message : "Import thất bại.");
  }
}

function CreateBlankDialog({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (draft: FormDraftRecord) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
      <form
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          setSaving(true);
          void createBlankFormTemplate({ title, description })
            .then((created) => {
              onCreated(created);
              onClose();
            })
            .catch((cause) =>
              onError(cause instanceof Error ? cause.message : "Không tạo được biểu mẫu."),
            )
            .finally(() => setSaving(false));
        }}
      >
        <h2 className="text-xl font-black text-slate-950">Tạo biểu mẫu trống</h2>
        <p className="mt-1 text-sm text-slate-500">
          Draft chưa thể publish cho đến khi có DOCX chuẩn hóa và binding hợp lệ.
        </p>
        <label className="mt-5 block text-sm font-bold text-slate-700">
          Tên biểu mẫu
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
          />
        </label>
        <label className="mt-4 block text-sm font-bold text-slate-700">
          Mô tả
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 font-bold">
            Hủy
          </button>
          <button
            disabled={saving || !title.trim()}
            className="rounded-lg bg-[#123B66] px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {saving ? "Đang tạo…" : "Tạo draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StudioEditor({
  initialDraft,
  templates,
  onClose,
}: {
  initialDraft: FormDraftRecord;
  templates: FormStudioTemplateSummary[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [draft, setDraft] = useState(initialDraft);
  const [contract, setContract] = useState(initialDraft.contract);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialDraft.contract.fields[0]?.id ?? null,
  );
  const [tab, setTab] = useState<StudioTab>("FORM");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [issues, setIssues] = useState<ContractIssue[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>>({});
  const [previewJob, setPreviewJob] = useState<{
    id: string;
    status: string;
    errorCode: string | null;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewDetail, setReviewDetail] = useState<FormReviewDetail | null>(null);
  const [conflictDraft, setConflictDraft] = useState<FormDraftRecord | null>(null);
  const [desktopEditing, setDesktopEditing] = useState(true);
  const [history, setHistory] = useState<FormContractV2[]>([]);
  const [redo, setRedo] = useState<FormContractV2[]>([]);
  const pendingRef = useRef<DraftOperation[]>([]);
  const revisionRef = useRef(initialDraft.revision);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const canApprove =
    user?.role === "ADMIN" ||
    user?.permissions?.includes("FORM_TEMPLATE_APPROVE");
  const editable =
    desktopEditing &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(draft.status);
  const selectedField =
    contract.fields.find((field) => field.id === selectedFieldId) ?? null;
  const template = templates.find((item) => item.id === draft.templateId);

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    while (pendingRef.current.length > 0 || savePromiseRef.current) {
      if (savePromiseRef.current) {
        await savePromiseRef.current;
        continue;
      }
      const operations = pendingRef.current.splice(0);
      const expectedRevision = revisionRef.current;
      setSaveState("saving");
      const promise = patchFormDraft(draft.id, expectedRevision, operations)
        .then((saved) => {
          revisionRef.current = saved.revision;
          setDraft((current) => ({
            ...current,
            ...saved,
            contract: current.contract,
            revision: saved.revision,
          }));
          setSaveState("saved");
        })
        .catch((cause) => {
          pendingRef.current.unshift(...operations);
          const text =
            cause instanceof Error ? cause.message : "Không lưu được draft.";
          setMessage(text);
          setSaveState(text.includes("409") ? "conflict" : "error");
          if (text.includes("409")) {
            void getFormDraft(draft.id).then(setConflictDraft).catch(() => {});
          }
          throw cause;
        })
        .finally(() => {
          savePromiseRef.current = null;
        });
      savePromiseRef.current = promise;
      await promise;
    }
  }, [draft.id]);

  const queue = useCallback(
    (operation: DraftOperation, remember = true) => {
      if (!editable) return;
      setContract((current) => {
        if (remember) {
          setHistory((items) => [...items.slice(-49), current]);
          setRedo([]);
        }
        return applyLocalOperation(current, operation);
      });
      pendingRef.current.push(operation);
      setSaveState("idle");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, 800);
    },
    [editable, flush],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1100px)");
    const sync = () => setDesktopEditing(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (tab !== "VERSIONS" || !["IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"].includes(draft.status)) {
      return;
    }
    void getFormReview(draft.id)
      .then(setReviewDetail)
      .catch(() => setReviewDetail(null));
  }, [draft.id, draft.status, tab]);

  const replaceDraft = (saved: FormDraftRecord) => {
    pendingRef.current = [];
    revisionRef.current = saved.revision;
    setDraft(saved);
    setContract(saved.contract);
    setSaveState("saved");
  };

  const runAction = async (
    action: () => Promise<FormDraftRecord>,
    successMessage: string,
  ) => {
    setMessage("");
    try {
      await flush();
      const saved = await action();
      replaceDraft(saved);
      setMessage(successMessage);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Thao tác thất bại.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addSection = () => {
    const order = contract.sections.length;
    queue({
      type: "ADD_SECTION",
      section: {
        id: uid("section"),
        title: `Phần ${order + 1}`,
        order,
        columns: 2,
      },
    });
  };

  const addField = (control: ControlType) => {
    let sectionId = contract.sections[0]?.id;
    if (!sectionId) {
      sectionId = uid("section");
      queue({
        type: "ADD_SECTION",
        section: {
          id: sectionId,
          title: "Thông tin biểu mẫu",
          order: 0,
          columns: 2,
        },
      });
    }
    const id = uid("field");
    const key = `custom.${id.replace(/-/g, "_")}`;
    const field: FieldDefinition = {
      id,
      key,
      sectionId,
      label: "Trường mới",
      control,
      order: contract.fields.filter((item) => item.sectionId === sectionId).length,
      width: 6,
      required: false,
      dataSource:
        control === "COMPUTED"
          ? { kind: "COMPUTED", expression: { op: "literal", value: "" } }
          : { kind: "MANUAL" },
    };
    queue({ type: "ADD_FIELD", field });
    setSelectedFieldId(id);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setRedo((items) => [...items, contract]);
    setContract(previous);
    pendingRef.current.push({ type: "REPLACE_CONTRACT", contract: previous });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), 800);
  };

  const redoChange = () => {
    const next = redo.at(-1);
    if (!next) return;
    setRedo((items) => items.slice(0, -1));
    setHistory((items) => [...items, contract]);
    setContract(next);
    pendingRef.current.push({ type: "REPLACE_CONTRACT", contract: next });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), 800);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;
    const overField = contract.fields.find((field) => field.id === overId);
    if (!overField) return;
    const ordered = contract.fields
      .filter((field) => field.sectionId === overField.sectionId)
      .sort((a, b) => a.order - b.order);
    const order = ordered.findIndex((field) => field.id === overId);
    queue({
      type: "MOVE_FIELD",
      fieldId: activeId,
      sectionId: overField.sectionId,
      order: Math.max(0, order),
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col bg-[#EEF1F4]">
      <header className="border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-lg"
              aria-label="Quay lại danh mục"
            >
              ←
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-black text-slate-950">
                  {contract.templateCode} · {contract.title}
                </h1>
                <StatusPill status={draft.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                <span>v{draft.version}</span>
                <span>revision {draft.revision}</span>
                <span>{saveLabel(saveState)}</span>
                <span>{contract.agencyId ? "Overlay cơ quan" : "Global"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!editable || history.length === 0}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40"
            >
              Hoàn tác
            </button>
            <button
              type="button"
              onClick={redoChange}
              disabled={!editable || redo.length === 0}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold disabled:opacity-40"
            >
              Làm lại
            </button>
            <button
              type="button"
              onClick={() =>
                void flush()
                  .then(() => validateFormDraft(draft.id))
                  .then((result) => {
                    setIssues(result.issues);
                    setTab("VALIDATION");
                    setMessage(result.valid ? "Validation đạt." : "Còn lỗi chặn publish.");
                  })
                  .catch(() => {})
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-extrabold"
            >
              Kiểm tra
            </button>
            {editable ? (
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    () => submitFormDraft(draft.id),
                    "Đã gửi phiên bản sang hàng đợi duyệt.",
                  )
                }
                className="h-10 rounded-lg bg-[#123B66] px-4 text-sm font-extrabold text-white"
              >
                Gửi duyệt
              </button>
            ) : null}
            {draft.status === "IN_REVIEW" && canApprove ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void runAction(
                      () =>
                        requestFormChanges(
                          draft.id,
                          reviewComment.trim() || "Cần chỉnh sửa thêm.",
                        ),
                      "Đã trả draft về cho Editor.",
                    )
                  }
                  className="h-10 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-extrabold text-amber-900"
                >
                  Yêu cầu sửa
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void runAction(
                      () =>
                        approveFormDraft(
                          draft.id,
                          reviewComment.trim() || undefined,
                        ),
                      "Đã phê duyệt phiên bản.",
                    )
                  }
                  className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white"
                >
                  Phê duyệt
                </button>
              </>
            ) : null}
            {draft.status === "APPROVED" && canApprove ? (
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    () => publishFormVersion(draft.id),
                    "Đã publish snapshot bất biến.",
                  )
                }
                className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white"
              >
                Publish
              </button>
            ) : null}
            {draft.status === "PUBLISHED" && canApprove ? (
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    () => archiveFormVersion(draft.id),
                    "Đã archive phiên bản.",
                  )
                }
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-extrabold"
              >
                Archive
              </button>
            ) : null}
          </div>
        </div>
        {message ? (
          <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {message}
          </div>
        ) : null}
        {!desktopEditing ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            Màn hình nhỏ đang ở chế độ review chỉ đọc. Dùng desktop rộng từ
            1100px để chỉnh cấu trúc biểu mẫu.
          </div>
        ) : null}
        {saveState === "conflict" && conflictDraft ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div>
              <span className="font-black">Xung đột revision.</span>{" "}
              Server đang ở rev {conflictDraft.revision}; bản local chưa được ghi.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-rose-300 bg-white px-3 py-2 font-bold"
                onClick={() => {
                  replaceDraft(conflictDraft);
                  setConflictDraft(null);
                }}
              >
                Dùng bản server
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-700 px-3 py-2 font-bold text-white"
                onClick={() => {
                  pendingRef.current = [
                    { type: "REPLACE_CONTRACT", contract },
                  ];
                  revisionRef.current = conflictDraft.revision;
                  setDraft((current) => ({
                    ...current,
                    revision: conflictDraft.revision,
                  }));
                  setConflictDraft(null);
                  void flush();
                }}
              >
                Giữ bản local
              </button>
            </div>
          </div>
        ) : null}
        {draft.status === "IN_REVIEW" && canApprove ? (
          <label className="mt-3 block max-w-3xl text-xs font-extrabold uppercase tracking-[0.06em] text-slate-500">
            Nhận xét của Approver
            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              className="mt-1.5 min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none focus:border-blue-500"
              placeholder="Ghi rõ nội dung phê duyệt hoặc yêu cầu chỉnh sửa…"
            />
          </label>
        ) : null}
        <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Các vùng Form Studio">
          {[
            ["FORM", "Form"],
            ["BINDINGS", "Bindings"],
            ["PREVIEW", "DOCX Preview"],
            ["VALIDATION", `Validation${issues.length ? ` (${issues.length})` : ""}`],
            ["VERSIONS", "Versions"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as StudioTab)}
              className={[
                "border-b-2 px-4 py-2 text-sm font-extrabold",
                tab === value
                  ? "border-blue-700 text-blue-800"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "FORM" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Nhấn phím cách để chọn trường, dùng phím mũi tên để di chuyển, nhấn phím cách lần nữa để thả.",
            },
          }}
        >
          <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(520px,1fr)_320px] max-[1100px]:grid-cols-1">
            <aside className="overflow-y-auto border-r border-slate-200 bg-white p-4 max-[1100px]:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">
                  Cấu trúc
                </h2>
                <button
                  type="button"
                  onClick={addSection}
                  disabled={!editable}
                  className="rounded-md px-2 py-1 text-sm font-black text-blue-700 disabled:opacity-40"
                >
                  + Phần
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {[...contract.sections]
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const fields = contract.fields
                      .filter((field) => field.sectionId === section.id)
                      .sort((a, b) => a.order - b.order);
                    return (
                      <div key={section.id} className="rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                          <span className="truncate text-sm font-extrabold text-slate-800">
                            {section.title}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {fields.length}
                          </span>
                        </div>
                        <SortableContext
                          items={fields.map((field) => field.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1 p-2">
                            {fields.map((field) => (
                              <SortableFieldItem
                                key={field.id}
                                field={field}
                                selected={field.id === selectedFieldId}
                                onSelect={() => setSelectedFieldId(field.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    );
                  })}
              </div>

              <h2 className="mt-6 text-sm font-black uppercase tracking-[0.08em] text-slate-500">
                Thêm trường
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CONTROL_PALETTE.map((item) => (
                  <button
                    key={item.control}
                    type="button"
                    disabled={!editable}
                    onClick={() => addField(item.control)}
                    className="flex min-h-16 flex-col items-start justify-between rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40"
                  >
                    <span className="text-base font-black text-blue-700">{item.symbol}</span>
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!editable || !selectedField}
                  onClick={() =>
                    queue({
                      type: "ADD_REPEATER",
                      repeater: {
                        id: uid("repeater"),
                        key: `items.${uid("group").replace(/-/g, "_")}`,
                        label: "Nhóm lặp",
                        minItems: 0,
                        maxItems: 20,
                        fieldKeys: [selectedField!.key],
                      },
                    })
                  }
                  className="rounded-lg border border-slate-200 p-3 text-xs font-extrabold disabled:opacity-40"
                >
                  + Repeater
                </button>
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() =>
                    queue({
                      type: "ADD_TABLE",
                      table: {
                        id: uid("table"),
                        key: `table.${uid("rows").replace(/-/g, "_")}`,
                        label: "Bảng dữ liệu",
                        rowLoopStart: "rows",
                        columns: [
                          {
                            key: "value",
                            label: "Nội dung",
                            control: "TEXT",
                            required: false,
                          },
                        ],
                      },
                    })
                  }
                  className="rounded-lg border border-slate-200 p-3 text-xs font-extrabold disabled:opacity-40"
                >
                  + Bảng
                </button>
              </div>
            </aside>

            <main className="overflow-y-auto bg-[#E9EDF1] p-6">
              <div className="mx-auto max-w-[920px]">
                <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  <span>Canvas người dùng</span>
                  <span>Desktop · 920 px</span>
                </div>
                <ContractV2Renderer
                  contract={contract}
                  data={sampleData}
                  onChange={setSampleData}
                  readOnly={!editable}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                />
              </div>
            </main>

            <aside className="overflow-y-auto border-l border-slate-200 bg-white p-4 max-[1100px]:hidden">
              <FieldInspector
                field={selectedField}
                contract={contract}
                editable={editable}
                onUpdate={(patch) =>
                  selectedField &&
                  queue({
                    type: "UPDATE_FIELD",
                    fieldId: selectedField.id,
                    patch,
                  })
                }
                onDelete={() => {
                  if (!selectedField) return;
                  queue({ type: "REMOVE_FIELD", fieldId: selectedField.id });
                  setSelectedFieldId(null);
                }}
                onReplaceContract={(next) =>
                  queue({ type: "REPLACE_CONTRACT", contract: next })
                }
              />
            </aside>
          </div>
        </DndContext>
      ) : null}

      {tab === "BINDINGS" ? (
        <BindingsPanel contract={contract} />
      ) : null}
      {tab === "PREVIEW" ? (
        <PreviewPanel
          job={previewJob}
          onRun={() =>
            void flush()
              .then(() => previewFormDraft(draft.id, sampleData))
              .then((job) =>
                setPreviewJob({
                  id: job.id,
                  status: job.status,
                  errorCode: job.errorCode,
                }),
              )
              .catch((cause) =>
                setMessage(cause instanceof Error ? cause.message : "Preview thất bại."),
              )
          }
        />
      ) : null}
      {tab === "VALIDATION" ? <ValidationPanel issues={issues} /> : null}
      {tab === "VERSIONS" ? (
        <VersionsPanel
          versions={template?.versions ?? []}
          currentId={draft.id}
          review={reviewDetail}
        />
      ) : null}
    </div>
  );
}

/* eslint-disable react-hooks/refs -- dnd-kit exposes imperative draggable refs and attributes. */
function SortableFieldItem({
  field,
  selected,
  onSelect,
}: {
  field: FieldDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const sortable = useSortable({ id: field.id });
  return (
    <button
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      {...sortable.attributes}
      {...sortable.listeners}
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
        selected ? "bg-blue-100 font-extrabold text-blue-900" : "text-slate-700 hover:bg-slate-50",
        sortable.isDragging ? "z-10 shadow-lg" : "",
      ].join(" ")}
    >
      <span className="cursor-grab text-slate-400">⋮⋮</span>
      <span className="min-w-0 flex-1 truncate">{field.label}</span>
      <span className="text-[10px] font-black text-slate-400">{field.control}</span>
    </button>
  );
}
/* eslint-enable react-hooks/refs */

function FieldInspector({
  field,
  contract,
  editable,
  onUpdate,
  onDelete,
  onReplaceContract,
}: {
  field: FieldDefinition | null;
  contract: FormContractV2;
  editable: boolean;
  onUpdate: (patch: Partial<FieldDefinition>) => void;
  onDelete: () => void;
  onReplaceContract: (contract: FormContractV2) => void;
}) {
  if (!field) {
    return (
      <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        Chọn một trường trên cây hoặc canvas để chỉnh thuộc tính.
      </div>
    );
  }
  const binding = contract.renderBindings.find(
    (item) => item.source.kind === "FIELD" && item.source.fieldKey === field.key,
  );
  const inputClass =
    "mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50";
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">
          Thuộc tính trường
        </h2>
        <button
          type="button"
          disabled={!editable}
          onClick={onDelete}
          className="text-sm font-extrabold text-rose-600 disabled:opacity-40"
        >
          Xóa
        </button>
      </div>
      <div className="mt-4 space-y-4">
        <InspectorLabel label="Nhãn hiển thị">
          <input
            className={inputClass}
            value={field.label}
            disabled={!editable}
            onChange={(event) => onUpdate({ label: event.target.value })}
          />
        </InspectorLabel>
        <InspectorLabel label="Khóa dữ liệu">
          <input
            className={inputClass}
            value={field.key}
            disabled={!editable}
            onChange={(event) => onUpdate({ key: event.target.value })}
          />
        </InspectorLabel>
        <InspectorLabel label="Kiểu ô">
          <select
            className={inputClass}
            value={field.control}
            disabled={!editable}
            onChange={(event) =>
              onUpdate({ control: event.target.value as ControlType })
            }
          >
            {CONTROL_PALETTE.map((item) => (
              <option key={item.control} value={item.control}>
                {item.label}
              </option>
            ))}
          </select>
        </InspectorLabel>
        <InspectorLabel label="Nguồn dữ liệu">
          <select
            className={inputClass}
            value={field.dataSource.kind}
            disabled={!editable}
            onChange={(event) => {
              const kind = event.target.value;
              if (kind === "MANUAL") onUpdate({ dataSource: { kind } });
              if (kind === "DEFAULT") {
                onUpdate({ dataSource: { kind, value: "" } });
              }
              if (kind === "COMPUTED") {
                onUpdate({
                  dataSource: {
                    kind,
                    expression: { op: "literal", value: "" },
                  },
                });
              }
              if (kind === "CASE" || kind === "AGENCY" || kind === "OFFICIAL") {
                onUpdate({ dataSource: { kind, path: field.key } });
              }
            }}
          >
            <option value="MANUAL">Nhập thủ công</option>
            <option value="DEFAULT">Giá trị mặc định</option>
            <option value="COMPUTED">Tự tính</option>
            <option value="CASE">Dữ liệu hồ sơ</option>
            <option value="AGENCY">Cấu hình cơ quan</option>
            <option value="OFFICIAL">Cán bộ hiện tại</option>
          </select>
        </InspectorLabel>
        {field.dataSource.kind === "DEFAULT" ? (
          <InspectorLabel label="Giá trị mặc định">
            <input
              className={inputClass}
              value={String(field.dataSource.value ?? "")}
              disabled={!editable}
              onChange={(event) =>
                onUpdate({
                  dataSource: { kind: "DEFAULT", value: event.target.value },
                })
              }
            />
          </InspectorLabel>
        ) : null}
        {field.dataSource.kind === "COMPUTED" ? (
          <InspectorLabel label="Tham chiếu để tự tính">
            <select
              className={inputClass}
              disabled={!editable}
              value={
                field.dataSource.expression.op === "field"
                  ? field.dataSource.expression.path
                  : ""
              }
              onChange={(event) =>
                onUpdate({
                  dataSource: {
                    kind: "COMPUTED",
                    expression: event.target.value
                      ? { op: "field", path: event.target.value }
                      : { op: "literal", value: "" },
                  },
                })
              }
            >
              <option value="">Chọn trường nguồn</option>
              {contract.fields
                .filter((candidate) => candidate.id !== field.id)
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.key}>
                    {candidate.label} · {candidate.key}
                  </option>
                ))}
            </select>
          </InspectorLabel>
        ) : null}
        {field.dataSource.kind === "CASE" ||
        field.dataSource.kind === "AGENCY" ||
        field.dataSource.kind === "OFFICIAL" ? (
          <InspectorLabel label="Đường dẫn nguồn">
            <input
              className={inputClass}
              value={field.dataSource.path}
              disabled={!editable}
              onChange={(event) =>
                onUpdate({
                  dataSource: {
                    kind: field.dataSource.kind as
                      | "CASE"
                      | "AGENCY"
                      | "OFFICIAL",
                    path: event.target.value,
                  },
                })
              }
            />
          </InspectorLabel>
        ) : null}
        {field.control === "SELECT" || field.control === "RADIO" ? (
          <InspectorLabel label="Lựa chọn (mỗi dòng: nhãn|giá trị)">
            <textarea
              className={`${inputClass} min-h-24 py-2 font-mono text-xs normal-case`}
              disabled={!editable}
              value={(field.options ?? [])
                .map((option) => `${option.label}|${option.value}`)
                .join("\n")}
              onChange={(event) =>
                onUpdate({
                  options: event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [label, value] = line.split("|");
                      return {
                        label: label?.trim() || "",
                        value: value?.trim() || label?.trim() || "",
                      };
                    }),
                })
              }
            />
          </InspectorLabel>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <InspectorLabel label="Độ rộng">
            <select
              className={inputClass}
              value={field.width}
              disabled={!editable}
              onChange={(event) =>
                onUpdate({
                  width: Number(event.target.value) as FieldDefinition["width"],
                })
              }
            >
              {[3, 4, 6, 8, 9, 12].map((width) => (
                <option key={width} value={width}>
                  {width}/12
                </option>
              ))}
            </select>
          </InspectorLabel>
          <InspectorLabel label="Bắt buộc">
            <label className="mt-1.5 flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                disabled={!editable}
                onChange={(event) => onUpdate({ required: event.target.checked })}
              />
              Áp dụng
            </label>
          </InspectorLabel>
        </div>
        <InspectorLabel label="Placeholder">
          <input
            className={inputClass}
            value={field.placeholder ?? ""}
            disabled={!editable}
            onChange={(event) => onUpdate({ placeholder: event.target.value })}
          />
        </InspectorLabel>
        <InspectorLabel label="Mô tả">
          <textarea
            className={`${inputClass} min-h-20 py-2`}
            value={field.description ?? ""}
            disabled={!editable}
            onChange={(event) => onUpdate({ description: event.target.value })}
          />
        </InspectorLabel>
        <div className="border-t border-slate-200 pt-4">
          <InspectorLabel label="DOCX slot binding">
            <input
              className={inputClass}
              defaultValue={
                binding?.target.kind === "SLOT" ? binding.target.slotId : ""
              }
              disabled={!editable}
              placeholder="ví dụ receiver.fullName"
              onBlur={(event) => {
                const slotId = event.target.value.trim();
                const next = structuredClone(contract);
                next.renderBindings = next.renderBindings.filter(
                  (item) =>
                    !(
                      item.source.kind === "FIELD" &&
                      item.source.fieldKey === field.key
                    ),
                );
                if (slotId) {
                  next.renderBindings.push({
                    id: uid("binding"),
                    target: { kind: "SLOT", slotId },
                    source: { kind: "FIELD", fieldKey: field.key },
                    transform: "identity",
                    fallback: "",
                  });
                }
                onReplaceContract(next);
              }}
            />
          </InspectorLabel>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Field tùy chỉnh phải có slot hoặc nguồn computed/default trước khi
            publish.
          </p>
        </div>
      </div>
    </div>
  );
}

function InspectorLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-extrabold uppercase tracking-[0.04em] text-slate-600">
      {label}
      {children}
    </label>
  );
}

function BindingsPanel({ contract }: { contract: FormContractV2 }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">Bản đồ DOCX bindings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Nguồn</th>
                <th className="px-3 py-2">Đích DOCX</th>
                <th className="px-3 py-2">Transform</th>
                <th className="px-3 py-2">Fallback</th>
              </tr>
            </thead>
            <tbody>
              {contract.renderBindings.map((binding) => (
                <tr key={binding.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-mono text-xs">
                    {binding.source.kind === "FIELD"
                      ? binding.source.fieldKey
                      : binding.source.kind}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {binding.target.kind === "SLOT"
                      ? binding.target.slotId
                      : binding.target.tableKey}
                  </td>
                  <td className="px-3 py-3">{binding.transform}</td>
                  <td className="px-3 py-3">{JSON.stringify(binding.fallback)}</td>
                </tr>
              ))}
              {contract.renderBindings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                    Chưa có binding. Chọn field ở tab Form để gắn DOCX slot.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  job,
  onRun,
}: {
  job: { id: string; status: string; errorCode: string | null } | null;
  onRun: () => void;
}) {
  return (
    <div className="grid flex-1 place-items-center p-6">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h2 className="text-xl font-black text-slate-950">DOCX Preview</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Render bằng contract hiện tại và dữ liệu đang nhập trên canvas. Job và
          lỗi được lưu bền vững ở backend.
        </p>
        <button
          type="button"
          onClick={onRun}
          className="mt-5 rounded-lg bg-[#123B66] px-5 py-3 text-sm font-extrabold text-white"
        >
          Tạo preview mới
        </button>
        {job ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
            <div className="font-black">Job #{job.id} · {job.status}</div>
            {job.errorCode ? (
              <div className="mt-2 text-rose-700">{job.errorCode}</div>
            ) : null}
            {job.status === "COMPLETED" ? (
              <a
                href={previewArtifactUrl(job.id)}
                className="mt-3 inline-flex font-extrabold text-blue-700 underline"
              >
                Tải DOCX preview
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ValidationPanel({ issues }: { issues: ContractIssue[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">Validation gates</h2>
        {issues.length === 0 ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            Chưa ghi nhận lỗi. Hãy bấm “Kiểm tra” để chạy validation mới nhất.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {issues.map((issue, index) => (
              <div
                key={`${issue.code}-${issue.path}-${index}`}
                className={[
                  "rounded-lg border p-3",
                  issue.severity === "ERROR"
                    ? "border-rose-200 bg-rose-50"
                    : "border-amber-200 bg-amber-50",
                ].join(" ")}
              >
                <div className="text-xs font-black uppercase tracking-wide">
                  {issue.code} · {issue.path}
                </div>
                <div className="mt-1 text-sm">{issue.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionsPanel({
  versions,
  currentId,
  review,
}: {
  versions: FormStudioTemplateSummary["versions"];
  currentId: string;
  review: FormReviewDetail | null;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-950">Lịch sử phiên bản</h2>
        {review ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-black text-slate-900">
                Diff với phiên bản publish trước
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {review.previousVersion
                  ? `So với v${review.previousVersion}`
                  : "Phiên bản đầu tiên"}
              </p>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {review.diff.map((entry, index) => (
                  <div
                    key={`${entry.area}-${entry.key}-${index}`}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <div className="text-xs font-black">
                      {entry.kind} · {entry.area}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-slate-600">
                      {entry.key}
                    </div>
                  </div>
                ))}
                {review.diff.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    Không có thay đổi cấu trúc.
                  </div>
                ) : null}
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-black text-slate-900">
                Nhật ký review
              </h3>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {review.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-black">{comment.action}</span>
                      <span className="text-slate-500">
                        rev {comment.revision}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {comment.actorName}
                    </div>
                    {comment.comment ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {comment.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
        <div className="mt-4 space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className={[
                "flex items-center justify-between rounded-lg border p-4",
                version.id === currentId
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200",
              ].join(" ")}
            >
              <div>
                <div className="font-black">v{version.version} · rev {version.revision}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {version.contractHash ?? "Chưa có immutable hash"}
                </div>
              </div>
              <StatusPill status={version.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "PUBLISHED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "APPROVED"
        ? "bg-teal-100 text-teal-800"
        : status === "IN_REVIEW"
          ? "bg-amber-100 text-amber-900"
          : status === "CHANGES_REQUESTED"
            ? "bg-rose-100 text-rose-800"
            : status === "ARCHIVED"
              ? "bg-slate-200 text-slate-700"
              : "bg-blue-100 text-blue-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${style}`}>
      {status}
    </span>
  );
}

function saveLabel(state: SaveState) {
  if (state === "saving") return "Đang lưu…";
  if (state === "saved") return "Đã lưu";
  if (state === "conflict") return "Xung đột revision";
  if (state === "error") return "Lưu lỗi";
  return "Chưa lưu";
}
