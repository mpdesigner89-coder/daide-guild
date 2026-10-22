# Đăng ký và đăng nhập bằng Username

- Đăng ký: Username (3–24 ký tự chữ ASCII, số, `_`), Password (tối thiểu 6 ký tự), Biệt danh (xin nhập đúng tên ingame). Không yêu cầu email.
- Đăng nhập: nhập **Username hoặc Email** cùng mật khẩu. Tài khoản email đã tạo trước đây vẫn đăng nhập bình thường.
- Đăng ký/đăng nhập Google: nút riêng trên form đăng ký; sau đăng nhập yêu cầu nhập biệt danh ingame.
- Firebase Authentication Email/Password **không hỗ trợ username gốc**. Ứng dụng dùng định danh email nội bộ dạng `username@accounts.daide.invalid` để xác thực; người dùng không cần biết hoặc nhập email này.
- **Hạn chế quan trọng:** tài khoản username không có email thật, nên không thể dùng chức năng quên mật khẩu qua email; cần xây dựng quy trình quản trị đặt lại mật khẩu an toàn trước khi dùng thực tế. Không gửi email xác minh đến định danh nội bộ.
- Username không phân biệt hoa thường; tính duy nhất được đảm bảo bằng Firebase Auth qua định danh nội bộ.
- Firestore `users/{uid}` cần Security Rules cho phép người dùng tạo/chỉnh sửa hồ sơ của mình mà **không được tự nâng role**. Chưa coi việc có tài khoản là có quyền sửa chấm công/lương.
- Để Google hoạt động: bật provider Google trong Firebase Authentication và cấu hình Authorized domains.
