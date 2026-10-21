# Đại Đế • Quản lý bang hội — mã nguồn

Bộ mã nguồn này được tách từ bản giao diện preview hiện tại và giữ lại các tính năng UI đang có: dashboard, thành viên, chấm công Boss/CTC, bảng lương, tài chính, cài đặt, cộng đồng và sàn đấu giá Kim đỉnh (có ô nhập giá tùy ý).

> **Trạng thái:** Đây là frontend prototype. Một số dữ liệu vẫn là dữ liệu demo trong JavaScript; đấu giá lưu cục bộ trên trình duyệt. Đăng nhập, phân quyền an toàn, OCR, lưu dữ liệu dùng chung và backend nghiệp vụ chưa được triển khai. Không dùng số liệu demo để chốt lương thật.

## Cây thư mục

```text
daide-guild-project/
├── frontend/
│   ├── index.html                         # HTML khung và thứ tự nạp module
│   └── assets/
│       ├── css/
│       │   └── main.css                   # thiết kế, màu sắc, responsive
│       └── js/
│           ├── app-core.js                # dữ liệu demo, trang và render nền tảng
│           └── modules/
│               ├── payroll-enhancements.js # bảng lương/CTC và luồng bổ sung
│               ├── dashboard-enhancements.js # dashboard, cộng đồng, lịch
│               └── auction.js              # phiên đấu giá và nhập giá
├── backend/
│   ├── README.md                           # hướng dẫn xây backend
│   └── src/                                # vị trí dành cho API server
├── docs/
│   ├── ARCHITECTURE.md                     # sơ đồ module và nguyên tắc phát triển
│   ├── BACKEND-ROADMAP.md                  # kế hoạch API, database, bảo mật
│   └── HOSTING.md                          # chạy local và triển khai host
├── .gitignore
└── package.json                            # lệnh chạy static server tùy chọn
```

## Chạy nhanh

1. Giải nén ZIP.
2. Mở `frontend/index.html` để xem giao diện cơ bản, hoặc khuyến nghị chạy qua local server:
   - Cài Node.js LTS.
   - Mở Terminal tại thư mục dự án.
   - Chạy `npm install` rồi `npm run dev`.
   - Mở URL local mà terminal hiển thị.
3. Muốn deploy host tĩnh: đặt **nội dung thư mục `frontend/`** làm thư mục publish/root.

## Quy tắc khi chỉnh sửa

- Giữ đúng thứ tự script trong `frontend/index.html`: `app-core.js` → payroll → dashboard/community → auction.
- Các module hiện đang chia sẻ một số hàm/biến toàn cục. Không chuyển `type="module"` hoặc đổi tên biến/hàm dùng chung nếu chưa refactor các module phụ thuộc.
- CSS/JS đã tách file nhưng logic vẫn là prototype kế thừa; hãy đọc `docs/ARCHITECTURE.md` trước khi sửa nghiệp vụ.
- Không đưa khóa bí mật/API key vào frontend. Backend phải tự xác thực người dùng, quyền chấm công, duyệt lương và giá đấu.

## Kiểm tra giới hạn bản hiện tại

- Dữ liệu demo thành viên/chấm công/lương có thể khởi tạo lại khi tải trang.
- Đấu giá dùng `localStorage` trên trình duyệt hiện tại; không đồng bộ máy khác và chưa chống được thao tác gian lận.
- Giao diện đăng nhập không tương đương xác thực bảo mật.
- Chưa có API/database thực, chưa OCR ảnh chấm công, chưa xử lý giao dịch tiền thật.
