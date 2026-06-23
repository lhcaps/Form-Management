# Free Public Testing — Vercel + Cloudflare Tunnel

> **Kiến trúc**: Vercel (frontend) + Cloudflare Tunnel (expose local API) + Local MySQL + Local storage.
> **Chi phí**: $0. Laptop/PC phải bật + `pnpm dev` + `cloudflared` phải chạy.
> **Không dùng** backend cloud, không dùng MySQL cloud trong phase này.

## Kiến trúc

```
┌──────────────────┐
│  Tester Browser   │
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────┐     HTTPS forward     ┌───────────────────────────┐
│  Vercel           │ ─────────────────────▶│  cloudflared tunnel       │
│  Next.js Frontend │                      │  (laptop của bạn)          │
│  vercel.app       │                      │  localhost:3001             │
└──────────────────┘                      └─────────────┬───────────────┘
                                                       │
                                             ┌─────────▼─────────┐
                                             │  NestJS API      │
                                             │  localhost:3001  │
                                             └─────────┬─────────┘
                                                       │
                                             ┌─────────▼─────────┐
                                             │  Local MySQL    │
                                             │  localhost:3307  │
                                             └─────────────────┘
```

**Lưu ý**: Laptop phải bật liên tục. Ngắt tunnel = ngưng public access.

---

## Bước 1 — Chuẩn bị Vercel Frontend

### 1.1 Tạo Vercel project

1. Vào [vercel.com](https://vercel.com) → "Add New" → "Project"
2. Import GitHub repo
3. Root Directory: `.` (repo root)
4. Framework: Next.js
5. Build Command: để trống (dùng `vercel.json`)
6. Output Directory: để trống (dùng `vercel.json`)

### 1.2 Tạo `.env.local` cho frontend (local test)

```powershell
# Trong thư mục apps/web/
# Tạm thời dùng local backend khi dev
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

### 1.3 Deploy Vercel

Sau khi có tunnel URL (bước 2), update Vercel env:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://xxxxx.trycloudflare.com/api/v1` | Production |

> **Quan trọng**: Mỗi lần restart `cloudflared`, URL mới sẽ được tạo. Cập nhật Vercel env + redeploy khi URL thay đổi.

---

## Bước 2 — Chạy Cloudflare Tunnel

### 2.1 Cài đặt cloudflared (Windows)

Tải từ: [cloudflared releases](https://github.com/cloudflare/cloudflared/releases)

Chọn file phù hợp:
- **Windows 64-bit**: `cloudflared-stable-windows-amd64.msi` (installer) hoặc `cloudflared-stable-windows-amd64.exe` (portable)

Installer: chạy MSI, next → next → done.
Portable: giải nén `.exe` vào thư mục, thêm vào PATH.

Xác nhận:

```powershell
cloudflared --version
```

### 2.2 Chạy API local (PowerShell)

```powershell
cd D:/Study/Project/QLLaw-main

# Chạy ở chế độ TUNNEL_TEST (cross-origin cookie + bypass admin password check)
$env:TUNNEL_TEST="true"
$env:NODE_ENV="development"
$env:WEB_ORIGIN="https://your-vercel-domain.vercel.app"
$env:API_CORS_ORIGIN="https://your-vercel-domain.vercel.app"

pnpm dev
```

Output mong đợi:

```
[Nest] 12345  - 11:30:00 [TUNNEL_TEST] Allowed CORS origins: https://your-vercel-domain.vercel.app | Cookie: Secure=true, SameSite=none
[Nest] 12345  - 11:30:00 QUANLYVKS API is running on http://localhost:3001/api/v1
```

### 2.3 Chạy Cloudflare Tunnel (terminal khác)

```powershell
cloudflared tunnel --url http://localhost:3001
```

Output mong đợi:

```
2026-06-24T04:30:00Z INF +---------------------------------------------------------------+
2026-06-24T04:30:00Z INF |  Your quick Tunnel has been created!                         |
2026-06-24T04:30:00Z INF |  Ingress rule: localhost:3001                              |
2026-06-24T04:30:00Z INF +---------------------------------------------------------------+
2026-06-24T04:30:00Z INF |  URL:  https://xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.trycloudflare.com |
2026-06-24T04:30:00Z INF |  URL:  https://xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.trycloudflare.com |
2026-06-24T04:30:00Z INF +---------------------------------------------------------------+
```

**Copy URL đó** — ví dụ: `https://abc123-def456.trycloudflare.com`

### 2.4 Cập nhật Vercel env

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Cập nhật `NEXT_PUBLIC_API_BASE_URL`:

```
NEXT_PUBLIC_API_BASE_URL=https://abc123-def456.trycloudflare.com/api/v1
```

3. Redeploy: Deployments → Click current → "Create New Deployment"

---

## Bước 3 — Verify API qua Tunnel

### 3.1 Health check

```powershell
Invoke-RestMethod https://abc123-def456.trycloudflare.com/api/v1/health
```

Expected: `{ ok: true, ... }`

### 3.2 Login qua tunnel

```powershell
$body = @{
    username = "tester"
    password = "tester123"
} | ConvertTo-Json

$r = Invoke-WebRequest -Uri "https://abc123-def456.trycloudflare.com/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SessionVariable session `
    -SkipHttpErrorCheck

$session.Cookies.GetCookies("https://abc123-def456.trycloudflare.com") | Format-Table Name, Value, Secure
```

Expected: Cookie `qlv_session` được set với `Secure=True`, `SameSite=None`.

### 3.3 Runtime smoke test

```powershell
$env:API_URL = "https://abc123-def456.trycloudflare.com"
node scripts/smoke-forms-runtime-213.mjs
```

Expected:

```
Passed: 213/213
Failed: 0/213
[OK] All 213 forms returned valid CompiledFormContract (schemaVersion "2.0", ...)
```

---

## Bước 4 — Manual Smoke

### 4.1 Mở web

```
https://your-vercel-domain.vercel.app
```

### 4.2 Đăng nhập

```
Username: tester
Password: tester123
```

### 4.3 Test forms

Mở "Biểu mẫu đã tạo" → chọn form → nhập dữ liệu → lưu → reload → kiểm tra dữ liệu còn → tạo DOCX → tải file.

10 forms đại diện: BM-001, BM-052, BM-067, BM-085, BM-141, BM-168, BM-173, BM-185, BM-200, BM-213.

Điền kết quả vào `docs/audit/manual-smoke/public-staging-10-form-smoke.md`.

---

## Cách hoạt động của TUNNEL_TEST

Khi `$env:TUNNEL_TEST=true`:

| Setting | Giá trị | Giải thích |
|---|---|---|
| `AUTH_COOKIE_SECURE` | `true` (auto) | Browser chỉ gửi cookie qua HTTPS |
| `AUTH_COOKIE_SAMESITE` | `none` (auto) | Cookie gửi cross-origin từ Vercel → tunnel API |
| `assertProductionSafety()` | bypass admin password | Không cần đổi `admin123` |
| CORS | vẫn kiểm tra | `API_CORS_ORIGIN` hoặc `WEB_ORIGIN` phải match |

Mà không cần:

- Backend cloud hosting
- MySQL cloud
- Thay đổi admin password

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Xử lý |
|---|---|---|
| Login nhận 401 | Cookie không được set | Kiểm tra `Secure=True, SameSite=None` trong DevTools → Application → Cookies |
| CORS error | `API_CORS_ORIGIN` không match Vercel domain | Set đúng `WEB_ORIGIN` và `API_CORS_ORIGIN` trong `.env` |
| 213/213 FAIL | DB chưa migrate/publish | Chạy `pnpm db:migrate:deploy && pnpm db:seed && node scripts/docx-contract/publish-locked-contracts-to-db.mjs && node scripts/docx-contract/migrate-compiled-json-to-v2.mjs` |
| Vercel gọi localhost | `NEXT_PUBLIC_API_BASE_URL` trên Vercel chưa update | Update env + redeploy |
| DOCX generation 500 | Storage path không đúng | Kiểm tra `STORAGE_ROOT` trong `.env` |
| Tunnel URL hết hạn | Cloudflare quick tunnel reset | Restart cloudflared, lấy URL mới, cập nhật Vercel |
| Browser reject cookie | SameSite=None cần Secure | Đảm bảo tunnel URL là HTTPS |

---

## Cleanup (khi test xong)

```powershell
# Dừng cloudflared
# Ctrl+C trong terminal đang chạy cloudflared

# Dừng pnpm dev
# Ctrl+C trong terminal đang chạy pnpm dev

# Xóa tunnel khỏi Vercel env (tùy chọn)
# Vercel Dashboard → Settings → Environment Variables → xóa NEXT_PUBLIC_API_BASE_URL
```

---

## Để có URL ổn định (tùy chọn, nâng cao)

Quick tunnel URL thay đổi mỗi lần restart. Để có URL cố định:

1. Tạo Cloudflare account + thêm domain đã mua
2. Tạo named tunnel: `cloudflared tunnel create qllaw-staging`
3. Tạo DNS record trỏ subdomain (vd: `api.yourdomain.com`) vào tunnel
4. Chạy: `cloudflared tunnel run --hostname api.yourdomain.com qllaw-staging`
5. Set `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1`

Chi phí: domain ~$10/year, Cloudflare free.

---

## Bảo mật — Đọc trước khi public link

- **Chỉ là môi trường test**: Không có dữ liệu thật. Chỉ dùng dữ liệu demo.
- **Laptop là server**: Ngắt điện = ngưng public access — đúng behavior.
- **Không có password trên API**: `admin/admin123` chỉ dùng local. `tester/tester123` là account test.
- **Không expose ra Internet rộng**: Chỉ share link với người test cụ thể.
- **Stop tunnel khi test xong**: Không cần giữ public khi không test.
- **Không dùng cho production**: Đây là staging/test environment.

## Checklist trước khi share link

- [ ] `pnpm dev` đang chạy (terminal 1)
- [ ] `cloudflared tunnel` đang chạy (terminal 2)
- [ ] Health check OK: `curl https://xxx.trycloudflare.com/api/v1/health`
- [ ] Smoke 213/213 PASS
- [ ] Vercel redeployed với tunnel URL mới
- [ ] Tester có link đăng nhập `tester/tester123`
- [ ] Không có dữ liệu thật trong DB
