"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchOfficials } from "@/lib/auth-client";
import {
  grantFormPermission,
  listFormPermissions,
  revokeFormPermission,
  type FormPermissionGrant,
} from "@/lib/form-studio-api";

const PERMISSIONS = [
  ["FORM_TEMPLATE_EDIT", "Editor"],
  ["FORM_TEMPLATE_APPROVE", "Approver"],
  ["FORM_TEMPLATE_PERMISSION_ADMIN", "Permission Admin"],
] as const;

export default function FormStudioPermissionsPage() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<FormPermissionGrant[]>([]);
  const [officials, setOfficials] = useState<
    Awaited<ReturnType<typeof fetchOfficials>>
  >([]);
  const [officialId, setOfficialId] = useState("");
  const [permission, setPermission] = useState<string>(PERMISSIONS[0][0]);
  const [message, setMessage] = useState("");
  const allowed =
    user?.role === "ADMIN" ||
    user?.permissions?.includes("FORM_TEMPLATE_PERMISSION_ADMIN");

  async function reload() {
    try {
      const [nextGrants, nextOfficials] = await Promise.all([
        listFormPermissions(),
        fetchOfficials(),
      ]);
      setGrants(nextGrants);
      setOfficials(nextOfficials);
      setOfficialId((value) => value || nextOfficials[0]?.id || "");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Không tải được quyền.");
    }
  }

  useEffect(() => {
    if (allowed) void reload();
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="p-8 text-sm font-semibold text-rose-700">
        Tài khoản không có quyền quản trị permission của Form Studio.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link
              href="/admin/form-studio"
              className="text-sm font-bold text-blue-700"
            >
              ← Form Studio
            </Link>
            <h1 className="mt-2 text-2xl font-black text-slate-950">
              Phân quyền biểu mẫu
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Editor và Approver là capability độc lập; workflow vẫn cấm người
              tạo tự phê duyệt.
            </p>
          </div>
        </header>

        {message ? (
          <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold">
            {message}
          </div>
        ) : null}

        <form
          className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!officialId) return;
            void grantFormPermission({ officialId, permission })
              .then(() => {
                setMessage("Đã cấp quyền.");
                return reload();
              })
              .catch((cause) =>
                setMessage(cause instanceof Error ? cause.message : "Cấp quyền thất bại."),
              );
          }}
        >
          <label className="text-sm font-bold text-slate-700">
            Cán bộ
            <select
              className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              value={officialId}
              onChange={(event) => setOfficialId(event.target.value)}
            >
              {officials.map((official) => (
                <option key={official.id} value={official.id}>
                  {official.fullName} · {official.positionTitle ?? "Cán bộ"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Quyền
            <select
              className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            >
              {PERMISSIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label} · {value}
                </option>
              ))}
            </select>
          </label>
          <button className="self-end rounded-lg bg-[#123B66] px-5 py-3 text-sm font-extrabold text-white">
            Cấp quyền
          </button>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cán bộ</th>
                <th className="px-4 py-3">Quyền</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{grant.officialName}</div>
                    <div className="text-xs text-slate-500">{grant.positionTitle}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{grant.permission}</td>
                  <td className="px-4 py-3">{grant.agencyId ?? "Global"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="font-bold text-rose-600"
                      onClick={() =>
                        void revokeFormPermission(grant.id)
                          .then(reload)
                          .catch((cause) =>
                            setMessage(cause instanceof Error ? cause.message : "Thu hồi thất bại."),
                          )
                      }
                    >
                      Thu hồi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
