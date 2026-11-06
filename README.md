# SACIP Console (React + Vite + Tailwind)

Giao diện Control Plane cho hệ thống SACIP / DNU Capture Studio, dựng theo DESIGN.md (Biometric Console + Kiosk) và Master Blueprint SACIP.

## Chạy local
```bash
npm install
npm run dev        # http://localhost:5173
```
Build: `npm run build` (thư mục `dist/`), hoặc `npm run build:single` để ra 1 file HTML duy nhất (`dist-single/index.html`).

Trang Hồ sơ định danh đọc được dữ liệu thật khi chạy `npm run dev`: sao chép `.env.example` thành `.env.local` rồi điền token và API key. Khóa nằm ở proxy của máy chủ dev, không vào bundle; bản build chưa có proxy này nên cần một backend trung gian khi triển khai thật.

## Các màn hình
| Route | Màn hình | Nguồn yêu cầu |
|---|---|---|
| `#/` | Tổng quan: tỷ lệ phủ xem chi tiết theo khoa/khóa/nhà thầu/KTX, hàng chờ, cảnh báo lệch chuẩn và gian lận | Đặc tả IAM §2.1 |
| `#/ho-so` | Hồ sơ định danh: một bảng cho mọi loại đối tượng, 5 cột trạng thái, chặn thao tác khi chưa có đồng ý, xem ảnh gốc qua link 60 giây, tra soát Wi-Fi/beacon | Đặc tả IAM §2.2 |
| `#/yeu-cau` | Hộp yêu cầu chung (REQ-xxxx), chuỗi duyệt lấy từ chính sách, từ chối bắt buộc lý do, thu hồi 2 người, AI tự duyệt | Đặc tả IAM §2.3 |
| `#/dong-y` | Đồng ý & bảo mật: phiên bản điều khoản, tỷ lệ đồng ý, quyền được lãng quên | Đặc tả IAM §2.5 |
| `#/chinh-sach` | Chính sách sinh trắc (lịch sử phiên bản, khôi phục) và Quy tắc sự kiện | Đặc tả Policy Engine, Blueprint §4.2 |
| `#/chinh-sach/:id/sua` | Wizard 4 bước + xem lại, tìm nhanh đơn vị và khu vực (gõ không dấu), kiểm tra lỗi trực tiếp, chạy thử, lưu thành phiên bản mới | Đặc tả Policy Engine §2, §4 |
| `#/tich-hop` | Nguồn dữ liệu đầu vào, sự kiện gửi đi (Kafka / RabbitMQ / webhook), tác vụ quét hợp đồng sắp hết hạn | Đặc tả Policy Engine §1, §3 |
| `#/don-vi` | Đơn vị tổ chức: cây khoa/phòng/đơn vị thuê ngoài, đồng bộ từ Nhân sự hoặc khai báo tay, chặn ngừng dùng khi còn hồ sơ hay chính sách | Đặc tả Policy Engine §1 |
| `#/khong-gian` | Cây Tòa → Tầng → Phòng. “Thêm khu vực” (Quản trị hệ thống): chọn tòa có sẵn hoặc khai báo tòa mới, tầng (tự tạo nếu chưa có), mã phòng gợi ý theo tầng, loại khu vực, căn cứ khai báo. Phòng mới chờ duyệt hạ tầng; duyệt xong mới gán thiết bị và chọn được trong chính sách | Blueprint, Đặc tả Policy Engine bước 2 |
| `#/thiet-bi`, `#/thoi-khoa-bieu`, `#/soc`, `#/giam-sat-ai` | Như trước | Blueprint |
| `#/nhat-ky` | Kiểm toán: chỉ số, chuỗi băm bất biến, kiểm tra toàn vẹn, xuất kèm mã băm | Đặc tả IAM §2.6 |
| `#/kiosk` | Kiosk: số tư thế theo chính sách, ký đồng ý tại quầy, AI tự duyệt hoặc chuyển người duyệt | Đặc tả Policy Engine bước 3 |

## Vai trò (mô phỏng đăng nhập)
Đổi ở góc trên bên phải. Menu và nút thao tác thay đổi theo quyền trong `src/api/enums.js` (`ROLES`).

| Vai trò | Được làm |
|---|---|
| Quản trị hệ thống | Mọi thứ, kể cả sửa chính sách |
| Kiểm toán viên trưởng | Xem, kiểm toán, xem ảnh gốc, đồng ý |
| Cán bộ Phòng Đào tạo (mặc định) | Xem, duyệt yêu cầu, sửa hồ sơ, xem ảnh gốc, đồng ý |
| Trực an ninh | Xem, trang An ninh, khóa hồ sơ |

Thu hồi cần 2 người khác nhau: xác nhận lần 1 bằng một vai trò, đổi vai trò, rồi xác nhận lần 2.

## Dữ liệu giả lập (API)
- `src/api/db.js`: dữ liệu mẫu theo đúng schema trong đặc tả (`subject_id`, `subject_type`, `consent_status`, `bssid_metadata`, `request_id`, `rules_config`, `action_code`, `immutable_hash`…).
- `src/api/client.js`: mỗi hàm async là một endpoint (đường dẫn REST ghi ở chú thích đầu hàm). Khi có backend, thay thân hàm bằng `fetch()`; giữ nguyên tên và dạng dữ liệu trả về thì các trang không phải sửa.
- `src/api/policyValidation.js`: kiểm tra cấu hình chính sách, dùng chung cho giao diện và khi lưu.
- `src/api/enums.js`: mã và nhãn tiếng Việt cho loại đối tượng, nguồn, 5 chiều trạng thái, loại yêu cầu, action_code, vai trò.
- Dữ liệu chỉ nằm trong bộ nhớ trình duyệt: tải lại trang là về trạng thái ban đầu.

Endpoint đang giả lập: `GET /bootstrap`, `POST /subjects/{id}/original-image-url`, `POST /subjects/{id}/lock|unlock|activate`, `POST /subjects/bulk`, `POST /requests`, `POST /requests/{id}/approve|reject|cancel`, `POST /policies/{id}/versions`, `POST /policies/{id}/rollback`, `POST /policies/{id}/dry-run`, `POST /consents/reconfirm`, `POST /subjects/{id}/consent`, `POST /erasures/{id}/advance`, `POST /sources/{id}/sync`, `POST /events/{id}/retry`, `GET /audit/verify`, `POST /audit/export`, `POST /kiosk/enroll`, `POST /subjects/{id}/risk`, `POST /subjects/{id}/risk/clear`, `POST /jobs/contract-check/run`, `POST /org-units`, `PATCH /org-units/{id}`, `POST /org-units/{id}/activate|deactivate`, `POST /org-units/sync`, `POST /spaces/rooms`, `POST /spaces/rooms/{id}/approve`, `PATCH /spaces/rooms/{id}`, `POST|DELETE /spaces/rooms/{id}/devices`.

## Sự kiện gửi ra ngoài (Đặc tả Policy Engine §3)
| Sự kiện | Khi nào bắn | Dữ liệu |
|---|---|---|
| `ACADEMIC_VERIFIED` (Trigger A) | Trạng thái thu thập chuyển sang Hoàn tất (Kiosk, duyệt đăng ký mới), không chờ duyệt hiệu lực. Mỗi phiên bản mẫu `face_profile_id` chỉ báo một lần | `student_code`, `face_profile_id`, `status: VERIFIED` |
| `ACCESS_SYNC` (Trigger B) | Hiệu lực thay đổi hoặc chụp lại khi đang hiệu lực | `operation` (`UPSERT_TEMPLATE` / `DELETE_TEMPLATE`), mẫu mã hóa AES-256-GCM kèm `key_id`, danh sách thiết bị nhận diện (camera, cổng xoay, máy xử lý biên) trong các khu vực của chính sách |
| `NOTIFY_RISK` | Cán bộ gắn cờ rủi ro trên hồ sơ, hoặc Kiosk chụp điểm thấp hơn ngưỡng quá 15 điểm. Không tự khóa | `risk_level`, `risk_flags` |
| `NOTIFY_CONTRACT` | Tác vụ quét hằng ngày (hoặc “Chạy ngay”) thấy hợp đồng nhà thầu còn ≤ số ngày báo trước của chính sách; mỗi mốc hết hạn báo một lần | `contract_no`, `contract_until`, `days_left` |

## Quyết định thiết kế khi hai tài liệu khác nhau
- AI được tự duyệt khi chính sách bật và điểm đạt ngưỡng; mỗi lượt ghi `AUTO_APPROVE_FACE_ID`. AI không bao giờ tự từ chối hay tự thu hồi.
- Nơi chụp lại (App MyDaiNam, Kiosk hoặc cả hai) là tham số của chính sách; mặc định sinh viên chụp lại trên App.
- Hộp yêu cầu có thêm tab "Đã hủy" cho yêu cầu người gửi tự hủy trên App.
- Chuỗi duyệt mặc định của sinh viên: GVCN → Phòng Đào tạo; sửa được trong chính sách.
- Mỗi loại đối tượng chỉ thuộc một chính sách.
- Các màn của Blueprint cũ (Không gian, Thiết bị, Lịch học, An ninh) được giữ; Không gian và Thiết bị là nguồn dữ liệu cho bước 2 của wizard.

## Quy tắc DESIGN.md đã áp dụng
- Ảnh khuôn mặt luôn làm mờ, "Xem rõ" yêu cầu lý do và ghi log; không dùng ảnh thật (hình minh họa SVG).
- AI chỉ gợi ý ("Gợi ý của AI – người duyệt quyết định"); không có nút AI tự từ chối / thu hồi.
- Không có xuất ảnh hàng loạt; thao tác nhạy cảm có modal lý do bắt buộc.
- Phạm vi (tenant, đơn vị, đối tượng), tra cứu và chuông thông báo chỉ hiển thị trên thanh trên cùng của trang Tổng quan.

## Hệ thống giao diện
- Màu: xanh `#01358F` là màu chủ đạo; cam `#F57301` chỉ làm điểm nhấn, không dùng làm chữ trên nền sáng và không đặt chữ trắng lên trên (2.86:1, không đạt WCAG AA). Khi cần chữ màu cam dùng `accent-strong` `#B85200`.
- Logo: `src/assets/logo-dnu.svg` (bản đầy đủ) và `logo-dnu-mark.svg` (favicon). Không đổi màu logo; trên nền xanh phải đặt trên nền trắng vì dòng "UNIVERSITY" màu xanh sẽ không đọc được.
- Màu trạng thái chỉ dùng cho trạng thái, luôn kèm chữ hoặc icon. Cảnh báo dùng vàng hổ phách để không lẫn với cam thương hiệu.
- Chữ: nội dung và bảng 14px, chú thích tối thiểu 12px, tiêu đề khối 16px, tiêu đề trang 24px.
- Điều khiển: `btn-sm` 32px, `btn` và ô nhập 40px, `btn-lg` 48px; Kiosk 56px. Bo góc 4px cho điều khiển, 8px cho khối.
- Component dùng chung ở `src/components/ui.jsx`: `Select`, `Tabs`, `Banner`, `MetricStrip`, `SearchInput`, `PageHeader`, `Modal`, `Drawer`, `ConfirmReason`, `DataBoundary`, `SortTh`. Bảng dùng class `.data-table` và hook `useSort`.
- Thuật ngữ và định dạng số, ngày: xem [docs/glossary.md](docs/glossary.md).
- Phạm vi: dùng `useScope` (`src/lib/scope.js`) để lọc theo mã đơn vị (`org_unit`) và `subject_type`. Phạm vi chỉ có hiệu lực ở trang Tổng quan; các trang khác luôn hiển thị toàn bộ dữ liệu.
- Thành phần mới trong `ui.jsx`: `StateBadge`, `SourceBadge`, `SubjectTypeChip`, `ChipToggleGroup`, `FieldError`, `Switch`, `useCountdown`, `RequirePerm`, `Combobox` (ô tìm có gợi ý, ↑/↓/Enter/Esc, tìm không dấu qua `fold`).
- Danh sách đơn vị lấy từ `unitOptions()` / `unitName()` trong `scope.js`, đọc cây hiện tại nên đơn vị thêm ở trang Đơn vị tổ chức có ngay ở bộ lọc và wizard.

## Trạng thái dữ liệu
`DataBoundary` hiển thị trạng thái đang tải, lỗi kèm "Thử lại" và phạm vi chưa có dữ liệu. Khi có backend, chỉ cần thay `loadResource` trong `src/lib/resource.js` bằng lời gọi API (độ trễ giả lập cũng nằm ở đó).

- Lần đầu mở một trang trong phiên: hiện khung tải theo bố cục trang (prop `skeleton` của `DataBoundary`).
- Mở lại trang đã tải: hiện dữ liệu ngay và làm mới ngầm, có thanh tiến trình trên cùng (`useResourceLoading`).
- Hiệu ứng dùng chung trong `index.css`: `.anim-page` khi chuyển trang, `.reveal` để các khối hiện lần lượt, `.anim-grow` cho thanh tỷ lệ. Tất cả tắt khi người dùng bật giảm chuyển động.

Khi chạy dev có thể xem thử bằng cách thêm vào đường dẫn: `#/ho-so?demo=loading` hoặc `#/ho-so?demo=error`.

Hồ sơ, yêu cầu, chính sách, đồng ý, nhật ký đi qua `src/api/client.js`. `src/data/mock.js` chỉ còn dữ liệu cho Không gian, Thiết bị, Lịch học, An ninh và Quy tắc sự kiện.
