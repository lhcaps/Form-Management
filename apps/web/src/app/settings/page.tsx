"use client";

import { useEffect, useState } from "react";
import { fetchCurrentAgency, fetchOfficials, type AuthUser } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { fetchMyTemplates, type TemplateSummary } from "@/lib/templates-api";
import { PageShell, PageHeader, PageSection } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Official = {
  id: string;
  fullName: string;
  positionTitle: string | null;
  agencyName: string | null;
};

type Agency = {
  id: string;
  name: string;
  code: string | null;
  parentName: string | null;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    setLoading(true);
    try {
      const [agencyData, officialsData, templateData] = await Promise.all([
        fetchCurrentAgency(),
        fetchOfficials(),
        fetchMyTemplates(),
      ]);
      setAgency(agencyData);
      setOfficials(officialsData);
      setMyTemplates(templateData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  return (
    <PageShell maxWidth="default" className="bg-slate-50">
      <PageHeader className="border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Cấu hình</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thông tin phiên đăng nhập, cơ quan hiện tại và danh sách cán bộ đang hoạt động.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadSettings()}
          className="h-10"
        >
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
      </PageHeader>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoPanel title="Người dùng hiện tại" user={user} />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-black text-slate-950">Cơ quan</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tên cơ quan" value={agency?.name ?? "Chưa có"} />
            <Row label="Mã cơ quan" value={agency?.code ?? "Chưa có"} />
            <Row label="Cơ quan cấp trên" value={agency?.parentName ?? "Không có"} />
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-black text-slate-950">Trạng thái hệ thống</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Auth" value="Session cookie" />
            <Row label="Biểu mẫu của tài khoản" value={String(myTemplates.length)} />
            <Row label="Người dùng hoạt động" value={String(officials.length)} />
            <Row label="Quyền hiện tại" value={user?.role ?? "Chưa xác định"} />
          </dl>
        </div>
      </section>

      <PageSection card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-950">Biểu mẫu của tài khoản</h2>
            <p className="mt-1 text-sm text-slate-600">
              Danh sách lấy từ owner account trong DB, không suy từ tên người tạo.
            </p>
          </div>
          <Badge variant="blue" className="text-xs">
            {myTemplates.length}
          </Badge>
        </div>

        <div className="rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên biểu mẫu</TableHead>
                <TableHead>Giai đoạn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500">
                    Tài khoản này chưa có biểu mẫu được gắn owner.
                  </TableCell>
                </TableRow>
              ) : null}
              {myTemplates.slice(0, 12).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-black text-slate-900">{item.templateCode}</TableCell>
                  <TableCell className="text-slate-700">{item.templateName}</TableCell>
                  <TableCell className="text-slate-600">{item.stageCode ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <PageSection card className="space-y-4">
        <h2 className="text-base font-black text-slate-950">Cán bộ đang hoạt động</h2>
        <div className="rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Cơ quan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500">
                    Chưa có dữ liệu cán bộ.
                  </TableCell>
                </TableRow>
              ) : null}
              {officials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">{item.fullName}</TableCell>
                  <TableCell className="text-slate-600">{item.positionTitle ?? ""}</TableCell>
                  <TableCell className="text-slate-600">{item.agencyName ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>
    </PageShell>
  );
}

function InfoPanel({ title, user }: { title: string; user: AuthUser | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Tên" value={user?.fullName ?? "Chưa đăng nhập"} />
        <Row label="Username" value={user?.username ?? "Chưa có"} />
        <Row label="Chức danh" value={user?.positionTitle ?? "Chưa có"} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}