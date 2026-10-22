# Kết nối danh sách thành viên Firestore

1. Mở Firestore → Rules, chèn nội dung `FIRESTORE-MEMBERS-RULES.txt` bên trong `match /databases/{database}/documents` trước luật chặn cuối cùng; Publish. **Không thay thế toàn bộ Rules**.
2. Đẩy các file `frontend` lên GitHub và chờ Actions thành công.
3. Đăng nhập bằng tài khoản admin `phunght`, mở Thành viên và thử thêm một thành viên thử nghiệm. Kiểm tra collection `members` trong Firestore.
4. Mở lại trên thiết bị khác và xác minh thành viên xuất hiện.

**Chú ý:** Các thành viên mẫu được thay bằng dữ liệu thật khi Firestore trả về thành công; Firestore ban đầu rỗng là bình thường. Chấm công, lương, thu chi và đấu giá **chưa** được lưu Firestore. Không dùng chúng để thanh toán thực tế. Không cấp quyền Admin qua giao diện người dùng.

**Giới hạn hiện tại:** Đây là giai đoạn kết nối CRUD thành viên; các thao tác chấm công và lương vẫn sửa bộ nhớ. Chưa có liên kết UID giữa hồ sơ đăng nhập và nhân vật ingame. Firestore Rules cho members cấp quyền đọc cho tài khoản active, ghi cho admin. Nếu muốn hạn chế dữ liệu nhạy cảm theo vai trò, cần thiết kế quy tắc chi tiết hơn trước khi sử dụng thực tế.
