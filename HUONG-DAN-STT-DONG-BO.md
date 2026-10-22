# Cập nhật STT và thứ tự thành viên (22/10/2026)

- Tab Thành viên có cột STT và hai nút ↑ ↓ cho Admin. Thứ tự được lưu bằng `sortOrder` trên từng tài liệu `members` trong Firestore, dùng transaction để hoán đổi hai thành viên.
- Các bảng Boss, CTC, Bảng lương, Dashboard và các danh sách chọn người sử dụng chung mảng `members` đã sắp xếp từ Firestore. Không thay ID thành viên khi sắp xếp. Acc phụ không có STT riêng.
- Không thay tên cột `Kéo xe` trong danh sách thành viên. Trường nhập vẫn là `Số acc`, không giới hạn 20 trong giao diện.
- Các thao tác chấm công Boss/CTC, trạng thái nhận lương và phụ cấp hiện còn là dữ liệu demo trên bộ nhớ, **chưa lưu Firestore**. Cập nhật này chỉ đồng bộ danh sách và thứ tự thành viên, không biến dữ liệu chấm công thành dữ liệu thật.
- Quy tắc Firestore hiện có `allow update: if isAdmin()` trong `members` cho phép Admin lưu `sortOrder`, không cần thay Rules.

## Kiểm thử
1. Đăng nhập Admin, mở Thành viên, dùng ↑ ↓ để đổi vị trí hai thành viên.
2. Tải lại trang: thứ tự giữ nguyên.
3. Mở Boss, CTC, Bảng lương: tên và thứ tự đồng nhất với Thành viên.
4. Đăng nhập tài khoản thường: thấy STT và thứ tự nhưng không có nút ↑ ↓.
5. Kiểm tra lại chức năng duyệt đơn, thêm/sửa/xóa thành viên.

Lưu ý: nếu có nhiều Admin cùng sắp xếp vào đúng thời điểm, hãy kiểm tra lại thứ tự sau khi giao dịch hoàn thành.
