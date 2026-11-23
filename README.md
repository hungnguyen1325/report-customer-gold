# HỆ THỐNG BÁO CÁO & QUẢN TRỊ GIAO DỊCH VÀNG

Ứng dụng web chuyên sâu phục vụ công tác kiểm soát, phân tích và quản trị dữ liệu giao dịch cho các tiệm vàng, doanh nghiệp kinh doanh vàng bạc đá quý. Hệ thống kết nối trực tiếp đến cơ sở dữ liệu **Microsoft SQL Server**, hỗ trợ quản lý đa bảng dữ liệu (Multi-table), phân quyền chi tiết theo từng bảng cho nhân viên, và xuất báo cáo tài chính/giao dịch ra Excel.

---

## 🌟 Tính Năng Nổi Bật

### 1. Báo cáo & Thống kê Tài chính (KPIs Dashboard)
* **Tổng hợp chỉ số tức thì**: Tự động tính toán Doanh thu, Tổng trọng lượng giao dịch (chỉ), Trọng lượng vàng nguyên chất (Au), Tiền công, Tiền đá, Tổng số lượng giao dịch.
* **Bộ lọc đa chiều linh hoạt**:
  * Lọc theo khoảng ngày (Hôm nay, 7 ngày qua, Tháng này, Toàn bộ hoặc chọn ngày tùy ý).
  * Lọc theo Loại chứng từ (`KieuCt`), Kho hàng (`KhoName`), Quầy giao dịch (`maQuay`), Trạng thái (`status`).
  * Tìm kiếm tức thời theo: Số chứng từ (`So_ct`), Tên khách hàng (`DoiTacName`), Số điện thoại (`DoiTacTel`), CCCD/CMND (`DoiTacCCCD`), Tên hàng hóa (`VtName`), Mã vạch (`code`).
* **Xuất báo cáo Excel chuyên nghiệp**: Xuất toàn bộ hoặc kết quả lọc ra file `.xlsx` với tiêu đề tiếng Việt chuẩn, tự động căn chỉnh độ rộng cột và định dạng số tiền VND.

### 2. Phân Quyền Theo Bảng Dữ Liệu (Table-Level Access Control)
* **Quản lý đa bảng giao dịch**: Hỗ trợ chuyển đổi nhanh giữa các bảng giao dịch (ví dụ: `Vang_NamPhong`, `gd_history`,...).
* **Nhập tên bảng trực tiếp**: Khi tạo hoặc cấp quyền cho tài khoản, người quản trị chỉ cần điền tên table vào hệ thống.
* **Tự động tạo bảng vật lý (Auto DDL Generation)**: Nếu tên bảng chưa tồn tại trên SQL Server, hệ thống sẽ tự động khởi tạo bảng vật lý với cấu trúc 37 cột chuẩn, khóa chính clustered `(stt_rec, stt_rec0, FK_CtID)` và tự động đánh sẵn các chỉ mục tối ưu hiệu năng.

### 3. Tối Ưu Hiệu Năng & An Toàn CSDL
* **Covering Index**: Chỉ mục bao phủ `IX_[Table]_Ngay_ct` giúp các truy vấn lọc ngày và tính tổng KPI chỉ quét trực tiếp trên Index, phản hồi trong ~80ms trên hàng vạn bản ghi.
* **Chống nghẽn bảng (`WITH (NOLOCK)`)**: Toàn bộ thao tác đọc báo cáo chạy dưới chế độ `READ UNCOMMITTED`, không làm nghẽn hoặc khóa các giao dịch bán hàng đang ghi vào tiệm vàng.
* **Tối ưu 1 Network Round-trip**: Tính toán 6 chỉ số KPI và phân trang 25 dòng được gộp trong 1 lần gọi duy nhất.
* **Bộ nhớ đệm thông minh (Cache Multi-tier)**: Cache bộ lọc (2 phút TTL) và cache chỉ số KPI khi chuyển trang, giúp chuyển trang tức thì mà không phải quét lại toàn bộ dữ liệu.
* **Bảo mật tuyệt đối**: 100% Parameterized Queries chống SQL Injection, mã hóa mật khẩu bằng `bcryptjs`, xác thực phiên bằng `JWT Cookie (HttpOnly)`.
* **Phân tách Console Dev / Production**: Tự động lược bỏ log phía client khi build Production (`removeConsole`), logger phía máy chủ bảo vệ thông tin nội bộ.

---

## 🛠️ Công Nghệ Sử Dụng

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons
* **Backend**: Next.js API Routes (Serverless / Node.js Runtime)
* **Cơ sở dữ liệu**: Microsoft SQL Server (kết nối qua `mssql` / `tedious`)
* **Xác thực & Mã hóa**: `jsonwebtoken`, `bcryptjs`
* **Xử lý dữ liệu & Báo cáo**: `xlsx` (SheetJS)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu môi trường
* Node.js version 18.18 trở lên (hoặc Node.js 20+)
* Trình quản lý gói `npm`, `yarn` hoặc `pnpm`
* Microsoft SQL Server (2012, 2016, 2019, 2022 hoặc Azure SQL)

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Biến môi trường (`.env`)
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và điền thông số kết nối CSDL SQL Server của bạn:
```env
DATABASE_HOST=your_server_ip_or_localhost
DATABASE_PORT=1433
DATABASE_USER=your_db_username
DATABASE_PASS=your_db_password
DATABASE_NAME=your_database_name
DATABASE_ENCRYPT=false

# Khóa bí mật JWT (tối thiểu 32 ký tự)
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Khởi tạo CSDL ban đầu (Nếu chưa có)
Chạy script tự động tạo các bảng quản trị hệ thống (`accounts`, `data_table`, `account_data`) và tài khoản Admin mặc định:
```bash
node --env-file=.env scripts/init-schema.mjs
```
*Tài khoản quản trị viên mặc định sau khi tạo: `admin` / `admin123` (vui lòng đổi mật khẩu ngay sau khi đăng nhập).*

### 5. Chạy ứng dụng
* **Môi trường phát triển (Development):**
  ```bash
  npm run dev
  ```
  Truy cập: [http://localhost:3000](http://localhost:3000)

* **Build và chạy môi trường Production:**
  ```bash
  npm run build
  npm start
  ```

* **Chạy kiểm thử hệ thống (Automated Tests):**
  ```bash
  npm test              # Kiểm thử toàn diện các API routes end-to-end
  npm run test:db       # Kiểm tra kết nối CSDL SQL Server
  npm run test:auto-create # Kiểm thử tạo bảng vật lý tự động & chèn dữ liệu
  ```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
report-customer-gold/
├── public/                     # Tài nguyên tĩnh
├── scripts/                    # Scripts tiện ích & khởi tạo CSDL
│   ├── init-schema.mjs         # Script khởi tạo bảng quản trị và tài khoản admin
│   └── inspect-tables.mjs      # Script kiểm tra cấu trúc & metadata bảng
├── tests/                      # Thư mục kiểm thử tự động (Automated Tests)
│   ├── test-db.mjs             # Kiểm tra kết nối trực tiếp CSDL SQL Server
│   ├── test-auth.mjs           # Kiểm tra logic mã hóa mật khẩu & JWT
│   ├── test-auto-create.mjs    # Kiểm tra tự động tạo bảng vật lý 37 cột
│   └── verify-all.mjs          # Kiểm thử toàn diện end-to-end các API
├── src/
│   ├── app/
│   │   ├── api/                # Các Next.js API Routes
│   │   │   ├── accounts/       # Quản lý tài khoản & phân quyền
│   │   │   ├── auth/           # Đăng nhập, đăng xuất, đổi mật khẩu
│   │   │   ├── tables/         # Quản lý bảng dữ liệu
│   │   │   └── transactions/   # Phân trang, lọc, thống kê, xuất Excel
│   │   ├── login/              # Giao diện đăng nhập
│   │   ├── layout.tsx          # Master layout
│   │   └── page.tsx            # Bảng điều khiển chính (Dashboard)
│   ├── components/             # Các React UI Components
│   │   ├── AccountsModal.tsx   # Modal quản lý tài khoản & gõ tên table
│   │   ├── ChangePasswordModal.tsx
│   │   ├── DataTablesModal.tsx # Modal quản trị bảng dữ liệu
│   │   ├── FilterBar.tsx       # Thanh tìm kiếm & lọc ngày, kho, loại CT
│   │   ├── GoldLogo.tsx        # Logo thỏi vàng 3D vector responsive
│   │   ├── Navbar.tsx          # Header responsive (Mobile Drawer + Desktop)
│   │   ├── StatsCards.tsx      # 6 thẻ KPI tài chính
│   │   ├── TransactionDetailModal.tsx # Hóa đơn xem chi tiết 37 trường
│   │   └── TransactionTable.tsx# Bảng dữ liệu phân trang
│   ├── context/
│   │   └── AuthContext.tsx     # Quản lý phiên đăng nhập & bảng đang chọn
│   └── lib/
│       ├── auth.ts             # JWT, Bcrypt, kiểm tra quyền bảng
│       ├── db.ts               # Connection pool SQL Server & Auto-create DDL
│       ├── logger.ts           # Logger an toàn phân tách Dev/Prod
│       └── types.ts            # TypeScript interfaces
├── .env.example                # File mẫu cấu hình môi trường
├── .gitignore                  # Cấu hình bỏ qua file nhạy cảm khi commit git
├── next.config.ts              # Cấu hình Next.js (removeConsole, Turbopack)
├── package.json
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

## 🔒 Quy Chuẩn Bảo Mật & An Toàn Dữ Liệu
1. **Không lưu thông tin đăng nhập trong mã nguồn**: Tất cả cấu hình đều đọc từ `.env`.
2. **Ngăn chặn SQL Injection**: Sử dụng Parameterized Queries và cơ chế Whitelist tên bảng cho mọi truy vấn.
3. **Bảo mật phiên đăng nhập**: Token JWT lưu trong HttpOnly Cookie với cờ `SameSite=Lax`.
4. **Phòng chống Brute-force**: Tự động khóa tạm thời 5 phút sau 5 lần đăng nhập thất bại liên tiếp trên cùng IP.
