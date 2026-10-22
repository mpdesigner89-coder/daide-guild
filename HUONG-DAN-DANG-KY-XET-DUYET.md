# Đại Đế — Đăng ký gia nhập và xét duyệt

## Đã cập nhật
- Đăng ký Username/Password và thông tin thành viên (Tên Zalo, acc chính, bang, môn phái, số xe), nhiều acc phụ (tên, bang, môn phái).
- Không hiển thị chức vụ hoặc hệ số lương cho người tự đăng ký.
- Admin vẫn có chức vụ, hệ số Boss và CTC khi thêm/sửa thành viên. Acc phụ ở form Admin chỉ có tên, bang, môn phái.
- Tạo yêu cầu `joinRequests/{uid}` trạng thái `pending`; tất cả người đăng nhập thấy danh sách và trạng thái tại trang Thành viên.
- Admin duyệt: tạo `members/{uid}` và chuyển trạng thái sang `approved` bằng Firestore transaction; từ chối: lưu lý do và trạng thái `rejected`.
- Thành viên chờ duyệt không xuất hiện trong danh sách chính thức, không được chấm công/tính lương.

## Bắt buộc trước khi thử
1. Đăng toàn bộ mã nguồn mới lên GitHub và chờ GitHub Actions hoàn tất.
2. Firebase Console → Firestore Database → Rules. **Không thay thế toàn bộ rules hiện có.** Chèn nội dung `FIRESTORE-JOIN-REQUESTS-RULES.txt` vào cùng cấp với `match /users/{userId}` và `match /members/{memberId}` trong `match /databases/{database}/documents`. Sau đó Publish.
3. Kiểm tra `members` rules vẫn giữ `allow create, update, delete: if isAdmin()` và `users` rules vẫn cho phép tạo hồ sơ của chính mình.
4. Thử đăng ký bằng tài khoản mới (không dùng Admin), kiểm tra `joinRequests` có status pending; đăng nhập Admin và duyệt; kiểm tra `members` có hồ sơ mới; tải lại trang.
5. Thử từ chối một yêu cầu khác và kiểm tra mọi thành viên thấy lý do/trạng thái.

## Lưu ý
- Tài khoản Google đăng nhập theo luồng cũ, **chưa tích hợp biểu mẫu gia nhập bang**. Đăng ký mới đầy đủ dùng Username/Password.
- Khi tạo tài khoản Authentication thành công nhưng lưu hồ sơ Firestore thất bại, tài khoản Auth có thể đã tồn tại; cần xử lý thủ công hoặc triển khai luồng tiếp tục hoàn tất đăng ký.
- Firestore Rules chỉ kiểm tra cấu trúc cấp cao của `secondaryAccounts`; nếu cần xác thực chặt từng acc phụ, nên dùng backend/Cloud Functions.
- Quy trình duyệt sử dụng client transaction và kiểm tra Admin bằng Firestore Rules. Không thay đổi cơ chế quản trị hiện tại.
