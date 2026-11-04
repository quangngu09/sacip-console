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
| `#/` | Tổng quan | Blueprint — luồng dữ liệu |
| `#/ho-so` | Hồ sơ Face ID + drawer chi tiết 480px | Stitch |
| `#/yeu-cau` | Hộp yêu cầu, modal phê duyệt, rút đồng ý NĐ 13, xác nhận 2 người | Stitch |
| `#/dong-y` | Quản lý đồng ý | Blueprint |
| `#/khong-gian` | Cây không gian & Zone, map Camera_ID → Room_ID, nguyên tắc "Hạ tầng đi trước" | Blueprint §0, §4.1 |
| `#/thiet-bi` | CMDB thiết bị, NTP, Online/Offline | Blueprint §3, §4.3 |
| `#/thoi-khoa-bieu` | TKB (EMS), Workflow A & B | Blueprint §2 |
| `#/chinh-sach` | Rule & Policy (PDP) có Dry-Run | Blueprint §4.2 |
| `#/soc` | SOC & ngoại lệ (Dạy thay, khiếu nại) | Blueprint §4.4 |
| `#/giam-sat-ai` | Giám sát mô hình AI | Blueprint Gói 3 |
| `#/nhat-ky` | Immutable audit log (cập nhật theo thao tác thật trong app) | DESIGN.md |
| `#/kiosk` | Kiosk trạm chụp (Space / F2 / F4 / Esc) | Stitch kiosk |

## Quy tắc DESIGN.md đã áp dụng
- Ảnh khuôn mặt luôn làm mờ, "Xem rõ" yêu cầu lý do và ghi log; không dùng ảnh thật (hình minh họa SVG).
- AI chỉ gợi ý ("Gợi ý của AI – người duyệt quyết định"); không có nút AI tự từ chối / thu hồi.
- Không có xuất ảnh hàng loạt; thao tác nhạy cảm có modal lý do bắt buộc.
- Phạm vi (tenant, đơn vị, đối tượng) luôn hiển thị trên thanh trên cùng.

Dữ liệu là mock (`src/data/mock.js`), trạng thái giữ trong `src/store.jsx` — thay bằng API khi tích hợp backend.
