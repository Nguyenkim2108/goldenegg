# ĐẬP TRỨNG VÀNG - TRÒ CHƠI MAY MẮN TRỰC TUYẾN

Trò chơi "Đập Trứng Vàng" cho phép người chơi đập vỡ các quả trứng vàng để nhận phần thưởng ngẫu nhiên. Phiên bản này cũng hỗ trợ tạo link đặc biệt với một quả trứng được chỉ định trước.

## Yêu cầu hệ thống

- Node.js (v16 trở lên)
- npm hoặc yarn
- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)

## Cài đặt và chạy dự án

### 1. Cài đặt các dependencies

```bash
npm install
```

### 2. Chạy dự án ở môi trường phát triển

```bash
npm run dev
```

Lệnh này sẽ khởi động server Node.js với môi trường phát triển, sử dụng cross-env và tsx. Ứng dụng sẽ chạy ở địa chỉ [http://localhost:5000](http://localhost:5000).

### 3. Build dự án cho môi trường production

```bash
npm run build
```

Lệnh này sẽ build cả phía client (sử dụng Vite) và phía server (sử dụng esbuild), tạo ra các file trong thư mục `dist`.

### 4. Chạy phiên bản đã build

```bash
npm run start
```

Lệnh này sẽ chạy ứng dụng trong môi trường production từ các file đã được build.

### 5. Các lệnh khác

```bash
# Kiểm tra TypeScript
npm run check

# Cập nhật schema database (sử dụng drizzle-kit)
npm run db:push
```

## Cấu trúc dự án

```
ViralMediaHub/
├── client/                # Mã nguồn phía client
│   ├── src/
│   │   ├── components/    # Các thành phần UI có thể tái sử dụng
│   │   ├── pages/         # Các trang của ứng dụng
│   │   ├── lib/           # Các tiện ích và thư viện
│   │   ├── hooks/         # React hooks
│   │   ├── assets/        # Tài nguyên tĩnh
│   │   ├── App.tsx        # Component chính của ứng dụng
│   │   └── main.tsx       # Điểm vào ứng dụng React
│   │
│   ├── index.html         # File HTML chính
│   └── vite.config.ts     # Cấu hình Vite
│
├── server/                # Mã nguồn phía server
│   ├── routes.ts          # Định nghĩa các route API
│   ├── storage.ts         # Lớp quản lý dữ liệu
│   ├── db.ts              # Kết nối database
│   ├── vite.ts            # Cấu hình tích hợp Vite với Express
│   └── index.ts           # Điểm vào của server
│
└── shared/                # Mã nguồn dùng chung
    └── schema/            # Các schema và type dùng chung
```

## Công nghệ chính

- **Frontend**: React, TailwindCSS, Framer Motion, React Query
- **Backend**: Node.js, Express
- **Database**: Drizzle ORM
- **Build Tools**: Vite, esbuild, TypeScript

## Tính năng chính

1. **Trò chơi đập trứng vàng**:
   - Người chơi có thể đập vỡ các quả trứng để nhận phần thưởng
   - Hệ thống bấm giờ đếm ngược
   - Hiển thị phần thưởng với hiệu ứng đẹp mắt

2. **Link đặc biệt**:
   - Admin có thể tạo link đặc biệt cho người chơi
   - Mỗi link cho phép đập một quả trứng duy nhất
   - Sau khi đập, tất cả quả trứng còn lại sẽ hiển thị phần thưởng nhưng không thể đập thêm

3. **Quản lý Admin**:
   - Tạo và quản lý các link đặc biệt
   - Cấu hình phần thưởng và tỉ lệ trúng thưởng cho từng quả trứng
   - Xem thống kê người chơi

## Ghi chú

- Đăng nhập vào trang admin tại đường dẫn `/admin`
- Tài khoản mặc định: admin/admin123

## Hỗ trợ và liên hệ

Nếu bạn gặp vấn đề hoặc có câu hỏi liên hệ qua zalo 0397707745.

