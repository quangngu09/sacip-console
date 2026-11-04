# SACIP Console (React + Vite + Tailwind)

Giao diện Control Plane cho hệ thống SACIP / DNU Capture Studio, dựng theo DESIGN.md (Biometric Console + Kiosk) và Master Blueprint SACIP.

## Chạy local
```bash
npm install
npm run dev        # http://localhost:5173
```
Build: `npm run build` (thư mục `dist/`), hoặc `npm run build:single` để ra 1 file HTML duy nhất (`dist-single/index.html`).

## Các màn hình
| Route | Màn hình | Nguồn |
|---|---|---|
| `#/` | Tổng quan: việc cần xử lý, điểm danh, lịch học hôm nay | Blueprint — luồng dữ liệu |
| `#/ho-so` | Hồ sơ Face ID + drawer chi tiết | Stitch |
| `#/yeu-cau` | Hộp yêu cầu, modal phê duyệt, rút đồng ý NĐ 13, xác nhận 2 người | Stitch |
| `#/dong-y` | Quản lý đồng ý | Blueprint |
| `#/khong-gian` | Không gian & khu vực, map Camera_ID → Room_ID, nguyên tắc "Hạ tầng đi trước" | Blueprint §0, §4.1 |
| `#/thiet-bi` | Thiết bị, NTP, Online/Offline | Blueprint §3, §4.3 |
| `#/thoi-khoa-bieu` | Lịch học & điểm danh (EMS), Workflow A & B | Blueprint §2 |
| `#/chinh-sach` | Quy tắc & chính sách (PDP) có Dry-Run | Blueprint §4.2 |
| `#/soc` | An ninh & ngoại lệ (Dạy thay, khiếu nại) | Blueprint §4.4 |
| `#/giam-sat-ai` | Giám sát mô hình AI | Blueprint Gói 3 |
| `#/nhat-ky` | Immutable audit log (cập nhật theo thao tác thật trong app) | DESIGN.md |
| `#/kiosk` | Kiosk trạm chụp (Space / F2 / F4 / Esc) | Stitch kiosk |

## Quy tắc DESIGN.md đã áp dụng
- Ảnh khuôn mặt luôn làm mờ, "Xem rõ" yêu cầu lý do và ghi log; không dùng ảnh thật (hình minh họa SVG).
- AI chỉ gợi ý ("Gợi ý của AI – người duyệt quyết định"); không có nút AI tự từ chối / thu hồi.
- Không có xuất ảnh hàng loạt; thao tác nhạy cảm có modal lý do bắt buộc.
- Phạm vi (tenant, đơn vị, đối tượng) luôn hiển thị trên thanh trên cùng.

## Hệ thống giao diện
- Màu: xanh `#01358F` là màu chủ đạo; cam `#F57301` chỉ làm điểm nhấn, không dùng làm chữ trên nền sáng và không đặt chữ trắng lên trên (2.86:1, không đạt WCAG AA). Khi cần chữ màu cam dùng `accent-strong` `#B85200`.
- Logo: `src/assets/logo-dnu.svg` (bản đầy đủ) và `logo-dnu-mark.svg` (favicon). Không đổi màu logo; trên nền xanh phải đặt trên nền trắng vì dòng "UNIVERSITY" màu xanh sẽ không đọc được.
- Màu trạng thái chỉ dùng cho trạng thái, luôn kèm chữ hoặc icon. Cảnh báo dùng vàng hổ phách để không lẫn với cam thương hiệu.
- Chữ: nội dung và bảng 14px, chú thích tối thiểu 12px, tiêu đề khối 16px, tiêu đề trang 24px.
- Điều khiển: `btn-sm` 32px, `btn` và ô nhập 40px, `btn-lg` 48px; Kiosk 56px. Bo góc 4px cho điều khiển, 8px cho khối.
- Component dùng chung ở `src/components/ui.jsx`: `Select`, `Tabs`, `Banner`, `MetricStrip`, `SearchInput`, `PageHeader`, `Modal`, `Drawer`, `ConfirmReason`, `DataBoundary`, `SortTh`. Bảng dùng class `.data-table` và hook `useSort`.
- Thuật ngữ và định dạng số, ngày: xem [docs/glossary.md](docs/glossary.md).
- Phạm vi: dùng `useScope` (`src/lib/scope.js`) để lọc theo đơn vị và đối tượng. Trang hạ tầng (thiết bị, không gian, quy tắc, an ninh, AI, nhật ký) áp dụng toàn trường và có ghi chú khi đang chọn đơn vị.

## Trạng thái dữ liệu
`DataBoundary` hiển thị trạng thái đang tải, lỗi kèm "Thử lại" và phạm vi chưa có dữ liệu. Khi có backend, chỉ cần thay `loadResource` trong `src/lib/resource.js` bằng lời gọi API.

Khi chạy dev có thể xem thử bằng cách thêm vào đường dẫn: `#/ho-so?demo=loading` hoặc `#/ho-so?demo=error`.

Dữ liệu là mock (`src/data/mock.js`), trạng thái giữ trong `src/store.jsx` — thay bằng API khi tích hợp backend.
