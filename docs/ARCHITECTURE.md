# Kiến trúc frontend

## Luồng nạp

```text
index.html
  └─ assets/css/main.css
  └─ assets/js/app-core.js
       ├─ modules/payroll-enhancements.js
       ├─ modules/dashboard-enhancements.js
       └─ modules/auction.js
```

### `app-core.js`

Lớp nền tảng của bản preview: dữ liệu mẫu, khung trang, các hàm render chung, tính toán hiển thị và xử lý sự kiện. Đây là tệp lớn nhất và là nơi có nhiều biến/hàm được module bổ sung sử dụng. Khi phát triển tiếp, nên dần tách phần dữ liệu và nghiệp vụ thành `services/`, `domain/` và `ui/`, thay vì tiếp tục thêm mã vào cuối tệp.

### `modules/payroll-enhancements.js`

Bổ sung giao diện/luồng bảng lương, xem công CTC và khiếu nại. Công thức hiển thị trong frontend chỉ phục vụ prototype; cần chuyển phép tính lương có giá trị thực sang backend, kiểm thử bằng dữ liệu chuẩn và lưu phiên bản kỳ lương.

### `modules/dashboard-enhancements.js`

Bổ sung thống kê, lịch hoạt động, thành phần cộng đồng và một số điều chỉnh UI. Các cập nhật giao diện không phải là quyền truy cập bảo mật.

### `modules/auction.js`

Tạo giao diện các phiên đấu giá độc lập, ô nhập giá, kiểm tra giá tối thiểu ở client, lịch sử và kết thúc phiên. Kiểm tra client chỉ hỗ trợ UX; server phải xác minh giá tối thiểu, người đặt, thời gian kết thúc và cập nhật giá cao nhất một cách nguyên tử.

## Lưu ý khi refactor

Các module đang là script cổ điển và có thể dựa vào biến toàn cục. Thứ tự script là một phần của hợp đồng nội bộ hiện tại. Chỉ chuyển sang ES Modules sau khi đưa các hàm chia sẻ thành export/import rõ ràng và kiểm thử lại toàn bộ trang.
