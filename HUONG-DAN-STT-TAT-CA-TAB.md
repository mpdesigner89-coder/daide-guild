# Bổ sung STT cho các bảng thành viên

- Bảng Dashboard (cần theo dõi), Chấm công Boss, Chấm công CTC, Bảng lương: hiển thị STT gốc từ thứ tự `members` đã đồng bộ Firestore.
- Bảng Thu chi > Tổng chi theo từng thành viên: hiển thị STT nếu tên người thanh toán khớp tên Zalo hoặc tên nhân vật chính; người ghi chưa khớp sẽ có dấu `—`. Dữ liệu thu chi hiện vẫn là bản demo, chưa liên kết bằng member ID.
- Tab Thành viên giữ nguyên STT và nút lên/xuống. Cột KÉO XE giữ nguyên.
- Đã cập nhật chỉ số cột trong `payroll-enhancements.js` để giữ nút khiếu nại và phần Xem công Boss/CTC sau khi thêm STT.
- Không sửa Firestore Rules; không thay đổi dữ liệu thành viên hoặc chấm công.

## Cài đặt
Giải nén, tải các tệp lên repository GitHub, giữ đúng thư mục; đợi Actions xanh, Ctrl+F5 và kiểm tra các tab. Nếu dùng tính năng thu chi, các tên không khớp hồ sơ thành viên sẽ không có STT.
