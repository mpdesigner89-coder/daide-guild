# Cập nhật đăng ký thành viên

- Đã đổi nhãn “Số xe / tài khoản” thành “Số acc” ở form Admin, form đăng ký và form gửi đơn bổ sung. Trường Firestore `vehicles` vẫn giữ nguyên để tương thích dữ liệu cũ.
- Thành viên đã có tài khoản nhưng chưa có đơn: đăng nhập, vào Thành viên, chọn “Gửi đơn gia nhập bang hội”, nhập thông tin và gửi.
- Nếu đã có đơn, giao diện hiển thị trạng thái; không cho gửi lại để ghi đè.
- Acc phụ chỉ gồm tên, bang, môn phái.
- Sửa luồng Admin duyệt để ID tài liệu members là ID số dạng chuỗi, tương thích nút Sửa/Xóa hiện có.

## Lưu ý triển khai

1. Upload nội dung thư mục dự án lên GitHub và chờ GitHub Actions thành công.
2. Giữ nguyên Firestore Rules đã Publish ở bước trước (schema `joinRequests` với các trường `uid,zalo,character,guild,sect,vehicles,secondaryAccounts,status,createdAt`).
3. Thử bằng tài khoản phunght4: Thành viên → Gửi đơn gia nhập bang hội.
4. Đăng nhập Admin, duyệt thử, kiểm tra collection `members`.

**Chưa kiểm thử trực tiếp với Firebase thật.**
