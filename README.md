# Nguyễn Hồng Tuấn – Ecopark Real Estate

| Thư mục | Stack | Cổng |
|---|---|---|
| `frontend/` | Next.js 15 + React 19 (App Router) + Tailwind, font Manrope | 3000 |
| `backend/` | NestJS 10 + TypeORM + PostgreSQL 16 | 4000 |

## Chạy local

```bash
docker compose up -d                 # chỉ PostgreSQL (api/nginx/certbot thuộc profile prod)
cd backend  && cp .env.example .env && npm i && npm run build && npm run seed && npm start
cd frontend && cp .env.example .env.local && npm i && npm run dev
```

Backend đọc biến môi trường từ shell (chưa nạp `.env` tự động) — export trước khi chạy, ví dụ `set -a; . ./.env; set +a`.
Frontend vẫn chạy được khi API tắt: tự dùng dữ liệu mẫu `frontend/src/data/seed.json`.

## Trang

| URL | Nội dung |
|---|---|
| `/`, `/en` | Trang chủ VI / EN |
| `/properties/for-rent` · `resale` · `projects` | Danh sách + bộ lọc + "Nhận thông báo căn mới" |
| `/property/[code]` | Chi tiết căn, ♡ Lưu, đặt lịch xem |
| `/projects/[slug]` | Dự án: Thông tin → Bản đồ → Chính sách → Hàng dự án → Tải brochure |
| `/about`, `/ecopark` | Giới thiệu |
| `/login`, `/register` | Đăng nhập / đăng ký (tên đăng nhập + mật khẩu, Google, Facebook) |
| `/account` | Khách: hồ sơ, căn đã lưu, yêu cầu của tôi, thông báo căn mới |
| `/admin` | Quản trị (admin): khách hàng, BĐS, dự án, slider, video, đánh giá, tài khoản — có tải ảnh lên |

## Vai trò

| Role | Có từ đâu | Quyền |
|---|---|---|
| `member` | Tự đăng ký / Google / Facebook | Lưu căn, lịch sử yêu cầu, email căn mới. Không vào được `/admin` |
| `admin` | `npm run seed` / admin bấm "Cấp quyền quản trị" cho một khách | Toàn bộ: nội dung, tải ảnh, khách hàng, tài khoản |

## Tình trạng căn (admin → Bất động sản)

| Tình trạng | Danh sách / tìm kiếm | Trang chi tiết | Email "căn mới" |
|---|---|---|---|
| Đang bán / cho thuê | ✅ | ✅ | ✅ gửi |
| Đã đặt cọc | ✅ nhãn ĐÃ CỌC | ✅ "Tìm căn tương tự" thay form đặt lịch | — |
| Đã bán / đã cho thuê | — | ✅ dấu ĐÃ GIAO DỊCH + căn tương tự (link cũ không lỗi) | — |
| Bản nháp | — | 404 | — |

Thêm: **Link video review** (TikTok/YouTube, phát trong popup), **Anh Tuấn đã xem nhà thực tế** (lưu ngày), **Ghim lên trang chủ**.
Dữ liệu cũ tự chuyển khi API khởi động: `published` → Đang bán / Bản nháp, `verified` → ngày đăng tin.

## Lưu trữ & email

| | Local | Production |
|---|---|---|
| Database | PostgreSQL trên máy | Supabase Session pooler (`DB_HOST`, `DB_USER`, `DB_PASSWORD`…, `DB_SSL=true`) |
| Ảnh / brochure tải lên | `backend/uploads`, phục vụ ở `{API_PUBLIC_URL}/uploads` | Cloudflare R2 (`R2_*`), frontend cần `NEXT_PUBLIC_UPLOAD_URL` |
| Email "căn mới" + xác minh email | Ghi ra `backend/mail-outbox/*.html` | Resend (`RESEND_API_KEY`, `MAIL_FROM`) |
| IP thật của khách (giới hạn gửi form) | để trống `TRUST_PROXY` | `TRUST_PROXY=1` (số proxy đứng trước API) |

Dữ liệu thử local: `npm run seed:local` — thêm căn/dự án/đánh giá mẫu và tài khoản khách `khach / khach-pass-123`.

## Deploy

| Phần | Nơi chạy | Cách deploy |
|---|---|---|
| `frontend/` | Vercel | Vercel tự build khi push `main`; bỏ qua commit không đụng `frontend/` (`frontend/vercel.json`) |
| `backend/` | VPS OVH: Docker (API) + Nginx + certbot (HTTPS) | GitHub Actions `.github/workflows/backend.yml`: test → image `ghcr.io/<repo>-api` → SSH vào VPS chạy `docker compose up -d` (`docker-compose.yml`, `nginx.conf` ở gốc repo) |
| Database / ảnh / email | Supabase / Cloudflare R2 / Resend | — |

Luồng: `trình duyệt → Cloudflare (proxy, SSL Full strict) → Nginx :443 (chứng chỉ Let's Encrypt do certbot lấy qua DNS Cloudflare, tự gia hạn) → api:4000`. Nginx chặn mọi kết nối không đến từ Cloudflare.

### 1. Cloudflare

- DNS: `A api → <IP_VPS>` (đám mây cam = Proxied); tên miền chính trỏ Vercel theo hướng dẫn của Vercel.
- SSL/TLS → **Full (strict)**.
- My Profile → API Tokens → Create Token → mẫu **Edit zone DNS**, chọn đúng tên miền → giữ token cho bước 2 (certbot cần để lấy chứng chỉ).

### 2. VPS (làm 1 lần, Ubuntu)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable

mkdir -p ~/ecopark/backend && cd ~/ecopark
printf 'API_DOMAIN=api.tenmien.vn\nLETSENCRYPT_EMAIL=email@cua-anh.com\n' > .env
nano backend/.env.prod            # dán nội dung backend/.env.prod.example rồi điền giá trị thật
echo 'dns_cloudflare_api_token = <TOKEN_O_BUOC_1>' > cloudflare.ini
chmod 600 backend/.env.prod cloudflare.ini
```

Khoá SSH riêng cho GitHub (chạy trên máy anh):

```bash
ssh-keygen -t ed25519 -f ecopark-deploy -N ""
ssh-copy-id -i ecopark-deploy.pub ubuntu@<IP_VPS>
```

### 3. GitHub → repo → Settings → Secrets and variables → Actions

| Secret | Giá trị |
|---|---|
| `VPS_HOST` | IP VPS |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | nội dung file `ecopark-deploy` (khoá riêng) |

Push `main` (hoặc Actions → backend → Run workflow). Lần đầu, tạo admin:

```bash
cd ~/ecopark && docker compose run --rm api node dist/seed.js   # cần ADMIN_PASSWORD trong backend/.env.prod
# xong thì xoá dòng ADMIN_PASSWORD trong backend/.env.prod
```

### 4. Vercel

Import repo → **Root Directory: `frontend`** → Environment Variables lấy từ `frontend/.env.example`, với
`NEXT_PUBLIC_API_URL=https://api.tenmien.vn/api` và `NEXT_PUBLIC_UPLOAD_URL=<R2_PUBLIC_URL>`.

### Xử lý sự cố

| Việc | Lệnh trên VPS (`cd ~/ecopark`) |
|---|---|
| Xem log API | `docker compose logs -f api` |
| Xem chứng chỉ | `docker compose run --rm --entrypoint certbot certbot certificates` |
| Quay về bản trước | sửa `API_IMAGE=...:<sha cũ>` trong `.env` → `docker compose up -d api` |
| Đổi biến môi trường | sửa `~/ecopark/backend/.env.prod` → `docker compose up -d api` |

## API (`/api`)

| Method | Path | |
|---|---|---|
| GET | `/properties?type=rent\|resale\|project`, `/properties/:code` | |
| GET | `/projects/:slug`, `/slides`, `/videos`, `/testimonials` | |
| POST | `/leads` | form liên hệ / đặt lịch (có validate) |
| POST | `/auth/register` | Khách đăng ký `{ username, password, fullName?, phone?, email? }` → role `member` |
| POST | `/auth/login` | `{ username, password }` → `{ accessToken }` (JWT, mặc định 8h). Sai 5 lần → khoá 15 phút |
| GET | `/auth/oauth/google`, `/auth/oauth/facebook` | Tiếp tục với Google / Facebook — email phải được admin gắn vào một tài khoản |
| GET | `/login/oauth2/code/google`, `/login/oauth2/code/facebook` *(ngoài `/api`)* | Callback — đăng ký đúng URI này trong Google Cloud / Facebook, local: `http://localhost:4000/login/oauth2/code/google` |
| GET | `/auth/me` | thông tin + hồ sơ người đang đăng nhập |
| PUT | `/me/profile` | sửa họ tên, SĐT, email (email mới phải xác minh qua link) |
| POST | `/me/verify-email` | gửi lại link xác minh (tối đa 3 lần/giờ) |
| GET | `/auth/verify-email?token=` | link trong email → `/account?email=verified` |
| GET/POST/DELETE | `/me/favorites[/:code]` | căn đã lưu |
| GET | `/me/leads` | yêu cầu của tôi |
| GET/POST/DELETE | `/me/searches[/:id]` | thông báo căn mới |
| POST | `/admin/uploads` | *(admin)* tải ảnh hoặc PDF → `{ url }` |
| GET | `/admin/customers` | *(admin)* khách có tài khoản + căn họ đã lưu |
| POST | `/admin/customers/:id/promote` | *(admin)* "Cấp quyền quản trị" — nâng một tài khoản khách lên admin |
| GET/POST/PUT/DELETE | `/admin/:resource[/:id]` | `Authorization: Bearer <accessToken>`; resource = properties, projects, slides, videos, testimonials, leads |

Màn đăng nhập: `http://localhost:3000/login`. Tài khoản admin đầu tiên tạo bằng `npm run seed` từ `ADMIN_USERNAME` / `ADMIN_PASSWORD` (và `ADMIN_EMAIL` nếu muốn đăng nhập Google/Facebook) trong `.env`.

Ví dụ đổi thứ tự slider "Dự án đang mở bán" (lấy token từ `/auth/login`):
`curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"sortOrder":1}' localhost:4000/api/admin/slides/2`

Web cập nhật sau tối đa 60 giây (ISR).

Smoke test: chạy API rồi `cd backend && npm test`.

## Cần thay trước khi lên production

- Ảnh bàn giao thật → `frontend/public/images/clients/client-1..4.webp` (đang là ảnh tạm)
- SĐT, email, Zalo, Facebook, YouTube → `frontend/.env.local`
- `embedId` video TikTok/YouTube thật, số liệu trang Về tôi, toạ độ phân khu trên bản đồ Về Ecopark
- Thông tin Eco Retreat (đang tổng hợp từ báo chí) – cần anh Tuấn xác nhận
