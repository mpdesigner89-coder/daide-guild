# Lộ trình backend đề xuất

## 1. Các miền dữ liệu

- `users`: tài khoản, trạng thái, vai trò, mã băm mật khẩu/định danh nhà cung cấp.
- `guilds`: Đại Đế, Nhị Đế, Tam Đế, Chấp Niệm và cấu hình từng bang.
- `members`: thành viên, nhân vật, môn phái, tài khoản chính/phụ, hệ số công.
- `attendance_records`: thành viên, ngày/ca, loại `BOSS` hoặc `CTC`, người ghi nhận, nguồn ảnh, thời điểm tạo/sửa.
- `payroll_periods` và `payroll_lines`: kỳ lương, quy tắc được đóng băng theo kỳ, kết quả tính, trạng thái duyệt và người duyệt.
- `guild_ledger`: khoản thu/chi, loại nguồn tiền, số tiền, ghi chú, chứng từ, trạng thái duyệt.
- `auction_sessions`, `auction_bids`, `auction_results`: phiên, giá khởi điểm, bước giá, hạn kết thúc, người thắng, lịch sử giá.
- `audit_logs`: mọi thay đổi nhạy cảm (chấm công, sửa hệ số, duyệt lương, điều chỉnh quỹ, kết thúc đấu giá).

## 2. API gợi ý

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST/PATCH /api/members`
- `GET/POST/PATCH /api/attendance`
- `GET/POST /api/payroll-periods`, `POST /api/payroll-periods/:id/calculate`, `POST /api/payroll-periods/:id/approve`
- `GET/POST /api/ledger`, `POST /api/ledger/:id/approve`
- `GET/POST /api/auctions`, `POST /api/auctions/:id/bids`, `POST /api/auctions/:id/close`

Đây là hợp đồng thiết kế đề xuất, chưa phải API đã có trong dự án.

## 3. Bảo mật và tính đúng đắn

1. Xác thực ở server; không lưu mật khẩu dạng rõ hoặc tin vào tên người dùng gửi từ browser.
2. Áp dụng RBAC: người xem, người chấm công, kế toán, quản trị. Mỗi endpoint tự kiểm tra quyền.
3. Tính lương ở server từ bản ghi chấm công đã duyệt; lưu snapshot công thức, đầu vào và kết quả để truy vết.
4. Dùng transaction/locking cho đặt giá và chốt phiên để hai giá đấu đồng thời không ghi đè nhau.
5. Mọi sửa/xóa dữ liệu tài chính hoặc công phải ghi audit log.
6. Validate dữ liệu ở server; giới hạn loại/kích thước ảnh; lưu ảnh ở object storage, không nhúng file lớn vào bảng dữ liệu.
7. Dùng HTTPS, biến môi trường, rate limiting, backup và quy trình phục hồi.

## 4. Các bước triển khai

1. Chốt quy tắc nghiệp vụ và bộ dữ liệu kiểm thử.
2. Chọn backend (ví dụ Node.js + Express/Fastify) và cơ sở dữ liệu quan hệ (ví dụ PostgreSQL).
3. Tạo schema, migration, seed dữ liệu thử và kiểm thử công thức lương.
4. Thêm đăng nhập, phiên/token an toàn, RBAC và audit log.
5. Xây API từng miền; thay dữ liệu demo frontend bằng `fetch` tới API.
6. Kiểm thử đa người dùng, tải đồng thời, quyền truy cập và khôi phục dữ liệu.
