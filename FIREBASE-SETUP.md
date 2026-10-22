# Bước 1 — Firebase Authentication

1. Firebase Console → Authentication → Sign-in method: bật Email/Password.
2. Authentication → Settings → Authorized domains: thêm hostname GitHub Pages hoặc tên miền tùy chỉnh đang chạy website (không kèm https:// hoặc đường dẫn).
3. Authentication → Users: tạo tài khoản email/password thử nghiệm. Không gửi mật khẩu cho người khác.
4. Đẩy thư mục `frontend` lên GitHub như quy trình cũ. GitHub Actions hiện triển khai GitHub Pages, **không tự triển khai Firebase Hosting**.
5. Truy cập website qua HTTPS, bấm Đăng nhập, thử tài khoản đã tạo, tải lại trang và kiểm tra trạng thái đăng nhập, sau đó Đăng xuất.

**Giới hạn:** Chỉ tích hợp Firebase Auth. Chưa có phân quyền Firestore Security Rules, chưa lưu thành viên/chấm công/lương lên Firestore. Tuyệt đối không dùng dữ liệu demo để thanh toán thật.

**Lưu ý:** `firebase-config.js` chứa cấu hình web công khai, không phải service-account private key. Không đưa khóa quản trị lên frontend.


## Đăng ký thành viên
- Authentication → Sign-in method: bật Email/Password và Google. Với Google, chọn email hỗ trợ dự án và lưu.
- Authentication → Settings → Authorized domains: thêm chính xác tên miền đang dùng, bao gồm GitHub Pages nếu dùng.
- Form đăng ký có Username, Email, Password và Biệt danh (tên ingame). Email là định danh đăng nhập thực tế. Username chưa có kiểm tra duy nhất toàn hệ thống.
- Hồ sơ email đăng ký được thử lưu ở Firestore `users/{uid}` với role `pending`. Nếu Firestore Rules chưa cho phép, tài khoản Auth vẫn được tạo nhưng hồ sơ không lưu; không mở rules công khai.
- Đăng nhập Google dùng popup, chưa có bước thu username/tên ingame và chưa tự lưu hồ sơ. Sẽ hoàn thiện trong bước hồ sơ thành viên/Firestore tiếp theo.
- Đăng ký không cấp quyền quản trị hoặc quyền sửa dữ liệu. Các nút nghiệp vụ hiện vẫn demo.
