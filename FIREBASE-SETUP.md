# Bước 1 — Firebase Authentication

1. Firebase Console → Authentication → Sign-in method: bật Email/Password.
2. Authentication → Settings → Authorized domains: thêm hostname GitHub Pages hoặc tên miền tùy chỉnh đang chạy website (không kèm https:// hoặc đường dẫn).
3. Authentication → Users: tạo tài khoản email/password thử nghiệm. Không gửi mật khẩu cho người khác.
4. Đẩy thư mục `frontend` lên GitHub như quy trình cũ. GitHub Actions hiện triển khai GitHub Pages, **không tự triển khai Firebase Hosting**.
5. Truy cập website qua HTTPS, bấm Đăng nhập, thử tài khoản đã tạo, tải lại trang và kiểm tra trạng thái đăng nhập, sau đó Đăng xuất.

**Giới hạn:** Chỉ tích hợp Firebase Auth. Chưa có phân quyền Firestore Security Rules, chưa lưu thành viên/chấm công/lương lên Firestore. Tuyệt đối không dùng dữ liệu demo để thanh toán thật.

**Lưu ý:** `firebase-config.js` chứa cấu hình web công khai, không phải service-account private key. Không đưa khóa quản trị lên frontend.
