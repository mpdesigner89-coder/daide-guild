# Nâng cấp thông báo và giao diện — 22/10/2026

## Đã cập nhật
- Bỏ nút Thêm thành viên trùng ở thanh trên; nút tại tab Thành viên chỉ hiển thị cho Admin.
- Chuông thông báo ở thanh trên, tổng hợp yêu cầu gia nhập và trạng thái duyệt từ collection joinRequests (dữ liệu Firestore thực). Admin xem tất cả; thành viên chỉ thấy đơn của mình ở chuông. Bảng đơn công khai trong tab Thành viên vẫn giữ nguyên.
- Trạng thái đã xem của chuông lưu trong localStorage trên thiết bị, KHÔNG đồng bộ giữa thiết bị; chuông chưa bao gồm khiếu nại và sự kiện khác.
- Bình luận mặc định đóng, nút thu gọn và số bình luận mới chưa xem trong phiên demo.
- Khiếu nại đã phản hồi không tính vào số đang chờ, vẫn giữ lịch sử trong phiên demo; chỉ Admin có nút phản hồi. Khiếu nại chưa có backend và không đồng bộ giữa thiết bị, không dùng làm dữ liệu lương thật.
- Thay các hộp thoại prompt/confirm được xác định bằng cửa sổ tích hợp trong trang (từ chối đơn, phản hồi khiếu nại, xóa thành viên, thành thị, kết thúc đấu giá).
- Thêm hướng dẫn gia nhập ở Quy định & hướng dẫn và Hướng dẫn nhanh.
- Ẩn các nút tạo/kết thúc phiên đấu giá demo đối với tài khoản không phải Admin; quyền thực tế cho đấu giá chưa có backend.

## Chưa hoàn thành — không hiểu nhầm là tính năng đã vận hành
- Khiếu nại và bình luận hiện là dữ liệu demo trong bộ nhớ; chưa thể gửi thông báo thời gian thực cho mọi thành viên hoặc giữ lịch sử giữa các thiết bị. Cần Firestore collections complaints, comments, notifications và Rules phù hợp.
- Chưa ẩn/khóa đầy đủ mọi thao tác Admin trên các tab chấm công, thu chi, lịch, quỹ, lương vốn đang là dữ liệu demo. Cần kiểm tra từng chức năng và bổ sung backend bảo vệ quyền trước khi dùng thật.
- Chuông chưa hỗ trợ khiếu nại, phản hồi khiếu nại, tin hệ thống hoặc trạng thái đọc đồng bộ nhiều máy.
- Không cần thay đổi Firestore Rules hiện tại cho chuông đọc từ joinRequests.

## Kiểm thử
1. Cập nhật các file vào đúng thư mục trên GitHub, chờ deploy xanh, Ctrl+F5.
2. Đăng nhập Admin: xem chuông, duyệt đơn; kiểm tra nút Thêm thành viên chỉ còn một ở tab Thành viên.
3. Đăng nhập tài khoản thường: nút Thêm thành viên và nút duyệt đơn không hiển thị; chuông chỉ chứa trạng thái đơn của tài khoản đó.
4. Kiểm tra bình luận mặc định đóng; bấm nút mới mở.
5. Nếu có lỗi Console, gửi ảnh để kiểm tra trước khi triển khai thêm.
