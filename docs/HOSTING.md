# Chạy và triển khai host

## Chạy trên máy cá nhân

### Cách nhanh
Mở `frontend/index.html` trong trình duyệt. Nếu trình duyệt chặn một số tính năng khi dùng `file://`, hãy dùng local server.

### Dùng Node.js
Tại thư mục gốc dự án:

```bash
npm install
npm run dev
```

Lệnh dùng `http-server` để phục vụ thư mục `frontend/`.

## Deploy host tĩnh

Với GitHub Pages, Netlify, Cloudflare Pages hoặc host tĩnh tương tự:

- Publish/root directory: `frontend`
- Build command: để trống (không cần build)
- Output/publish directory: `frontend`

Sau khi deploy, kiểm tra đường dẫn CSS và các script trong tab Network của DevTools. Nếu host yêu cầu thư mục gốc riêng, hãy đảm bảo `index.html` nằm ở root được publish.

## Khi có backend

Frontend tĩnh vẫn có thể deploy riêng. Backend cần deploy thành service riêng hoặc cùng nền tảng có hỗ trợ server. Cấu hình base URL API bằng cấu hình runtime hoặc biến môi trường được xử lý trong quá trình build; tuyệt đối không đưa secret vào JavaScript gửi cho trình duyệt. Cấu hình CORS chỉ cho phép domain cần thiết và dùng HTTPS.

**Lưu ý:** Deploy thành công chỉ có nghĩa là giao diện truy cập được. Nó không tự tạo database, đăng nhập bảo mật hay đồng bộ dữ liệu giữa người dùng.
