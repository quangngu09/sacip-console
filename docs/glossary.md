# Bảng từ vựng giao diện SACIP

Dùng thống nhất cho mọi màn hình. Thuật ngữ kỹ thuật chỉ xuất hiện dạng chú thích nhỏ khi cán bộ cần đối chiếu với kỹ thuật.

## Thuật ngữ

| Không dùng trên giao diện | Dùng | Ghi chú |
|---|---|---|
| Rule, Policy Engine, PDP | Quy tắc, hệ thống quy tắc | |
| Real-time trigger | Cảnh báo tức thời | Phản ứng trong 2 giây |
| Audit (loại quy tắc) | Ghi nhận | |
| Audit log, Audit trail | Nhật ký, nhật ký kiểm toán | |
| Dry-run | Chạy thử | |
| SOC | An ninh | |
| Push SOC | Báo an ninh | |
| Blacklist | Danh sách cấm | |
| Zone | Khu vực | |
| Public / Operational / Restricted / Forbidden | Công cộng / Vận hành / Hạn chế / Cấm | Mã trong dữ liệu giữ nguyên tiếng Anh |
| CMDB | Thiết bị | |
| Online / Offline | Trực tuyến / Mất kết nối | |
| NTP | Đồng bộ giờ | |
| NVR | Đầu ghi hình | |
| Edge Box | Thiết bị xử lý | |
| TKB, EMS | Lịch học, hệ thống đào tạo | |
| PRESENT / LATE | Có mặt / Đi muộn | |
| Session presence | Thời lượng có mặt | |
| SLA | Thời hạn xử lý, quá hạn | |
| Rescan | Chụp lại | |
| Quality Gating | Kiểm tra chất lượng ảnh | |
| Liveness, Anti-spoofing | Kiểm tra người thật | |
| Spoofing | Giả mạo, nghi dùng ảnh in | |
| Specular, yaw | Chói, nghiêng đầu | |
| Confidence | Độ chắc chắn của AI | Không phải điểm chất lượng ảnh |
| Embedding, vector, template | Dữ liệu sinh trắc | |

## Thao tác

| Dùng | Không dùng |
|---|---|
| Hủy (đóng hộp thoại, không lưu) | Hủy bỏ |
| Hủy phiên (Kiosk) | Thoát phiên |
| Xem rõ / Làm mờ lại (ảnh khuôn mặt) | Giải mờ, Mở khóa ảnh |
| Đặt lại (bộ lọc) | Xóa lọc |
| Từ chối, Chuyển cấp, Phê duyệt (yêu cầu) | Reject, Forward, Approve |

Câu bắt buộc giữ nguyên theo quy tắc sản phẩm: **"Gợi ý của AI – người duyệt quyết định"**.

## Định dạng

| Loại | Quy tắc | Ví dụ | Hàm |
|---|---|---|---|
| Số nguyên | Dấu chấm phân cách nghìn | 23.430 | `fmtNumber` |
| Phần trăm | Dấu phẩy thập phân, tối đa 1 chữ số | 95,2% | `fmtPercent` |
| Thời lượng | Có khoảng trắng trước đơn vị | 1,6 giây; 38 ms | |
| Ngày | dd/mm/yyyy | 24/10/2025 | |
| Ngày giờ | Ngày trước, giờ sau | 24/10/2025 14:20 | |
| Giờ trong ngày | 24 giờ | 16:32:08 | |

Các hàm nằm ở `src/lib/format.js`.
