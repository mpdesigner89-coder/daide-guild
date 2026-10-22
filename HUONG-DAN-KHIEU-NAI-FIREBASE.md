# Đại Đế – Khiếu nại Firestore

## Đã thay đổi
- Khiếu nại lưu ở collection `complaints`, nghe cập nhật thời gian thực.
- Thành viên chỉ được gửi khiếu nại cho nhân vật liên kết `ownerUid` với tài khoản đăng nhập; Admin có thể gửi hộ.
- Chỉ Admin duyệt/từ chối; sau xử lý số chờ giảm về 0, lịch sử vẫn tồn tại.
- Chuông thông báo nhận thêm sự kiện khiếu nại. Trạng thái đã đọc của chuông vẫn chỉ lưu theo trình duyệt (localStorage).
- Không nhận ảnh đính kèm trong phiên bản này. Firebase Storage và quy tắc bảo vệ ảnh sẽ phát triển riêng, tránh hiển thị giả rằng ảnh đã lưu.

## Cài đặt
1. Đưa file cập nhật lên GitHub và chờ deploy thành công.
2. Vào Firebase Console > Firestore Database > Rules.
3. Mở `FIRESTORE-COMPLAINTS-RULES.txt`, chèn nguyên khối `match /complaints/{complaintId}` trước catch-all, **bên trong** match database. Giữ nguyên toàn bộ Rules `users`, `members`, `joinRequests`.
4. Publish, đăng nhập tài khoản thành viên có hồ sơ được duyệt và gửi khiếu nại thử.
5. Đăng nhập Admin `phunght`, mở Bảng lương > Xem khiếu nại > Duyệt/Từ chối, nhập phản hồi; kiểm tra số chờ về 0 và lịch sử vẫn còn.

## Lưu ý
- Hồ sơ `members` cũ do Admin thêm không có `ownerUid`: người dùng thường không thể gửi khiếu nại cho hồ sơ đó cho đến khi liên kết đúng UID; Admin vẫn có thể gửi hộ.
- Bảng lương/chấm công vẫn là demo, việc duyệt khiếu nại không tự sửa công hay lương.
- Phân quyền Admin ở các module khác chưa hoàn tất.
- Nên thử trên tài khoản phụ và sao lưu Rules trước khi Publish.
