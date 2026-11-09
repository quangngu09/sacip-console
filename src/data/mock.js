// Dữ liệu mẫu cho các trang Không gian, Thiết bị, Lịch học, An ninh và Quy tắc sự kiện.
// Hồ sơ, yêu cầu, chính sách, đồng ý, nhật ký nằm trong src/api/db.js và được đọc qua src/api/client.js.

// Cây không gian — Master Data / GIS. approved=false => chưa được duyệt hạ tầng.
export const SPACE_TREE = [
  { id: 'A', name: 'Tòa A — Hành chính', type: 'building', children: [
    { id: 'A-1', name: 'Tầng 1', type: 'floor', children: [
      { id: 'A100', name: 'Cổng chính Tòa A1', type: 'room', zone: 'Public', approved: true, devices: ['TS_A100_01', 'TS_A100_02'] },
      { id: 'A101', name: 'Sảnh chính A', type: 'room', zone: 'Public', approved: true, devices: ['CAM_A101_01'] },
      { id: 'A102', name: 'Phòng Đào tạo', type: 'room', zone: 'Operational', approved: true, devices: ['KIOSK_03', 'SCN_A102_01'] },
    ]},
    { id: 'A-5', name: 'Tầng 5', type: 'floor', children: [
      { id: 'A501', name: 'Phòng Server', type: 'room', zone: 'Restricted', approved: true, devices: ['CAM_A501_01'] },
    ]},
  ]},
  { id: 'C', name: 'Tòa C — Giảng đường', type: 'building', children: [
    { id: 'C-2', name: 'Tầng 2', type: 'floor', children: [
      { id: 'C202', name: 'Phòng thí nghiệm C202', type: 'room', zone: 'Restricted', approved: true, devices: ['CAM_C202_01'] },
    ]},
    { id: 'C-3', name: 'Tầng 3', type: 'floor', children: [
      { id: 'C301', name: 'Phòng học C301', type: 'room', zone: 'Operational', approved: true, devices: ['CAM_C301_01', 'AP_C3_01'] },
      { id: 'C302', name: 'Phòng học C302', type: 'room', zone: 'Operational', approved: true, devices: ['CAM_C302_01', 'BLE_C302'] },
      { id: 'C305', name: 'Phòng máy C305', type: 'room', zone: 'Operational', approved: false, devices: [] },
    ]},
  ]},
  { id: 'K', name: 'KTX — Tòa B', type: 'building', children: [
    { id: 'K-4', name: 'Tầng 4', type: 'floor', children: [
      { id: 'K400', name: 'Cửa từ tầng 4', type: 'room', zone: 'Operational', approved: true, devices: ['TS_K400_01'] },
      { id: 'K402', name: 'Phòng 402', type: 'room', zone: 'Operational', approved: true, devices: [] },
      { id: 'K403', name: 'Phòng 403', type: 'room', zone: 'Operational', approved: false, devices: [] },
    ]},
  ]},
];

export const DEVICES = [
  { id: 'CAM_C302_01', kind: 'Camera AI 4K', vendor: 'Hikvision', ip: '10.20.3.42', mac: 'A4:14:37:9C:02:11', port: 'SW-C3 / Gi1/0/12 PoE', serial: 'DS2CD-K48812', room: 'C302', online: true, ntp: true },
  { id: 'CAM_C301_01', kind: 'Camera AI 4K', vendor: 'Hikvision', ip: '10.20.3.41', mac: 'A4:14:37:9C:02:0F', port: 'SW-C3 / Gi1/0/11 PoE', serial: 'DS2CD-K48807', room: 'C301', online: true, ntp: true },
  { id: 'CAM_A501_01', kind: 'Camera AI 4K', vendor: 'Dahua', ip: '10.10.5.11', mac: '3C:EF:8C:11:20:AA', port: 'SW-A5 / Gi1/0/2 PoE', serial: 'IPC-HFW5841', room: 'A501', online: true, ntp: true },
  { id: 'CAM_A101_01', kind: 'Camera AI 4K', vendor: 'Dahua', ip: '10.10.1.15', mac: '3C:EF:8C:11:20:B4', port: 'SW-A1 / Gi1/0/5 PoE', serial: 'IPC-HFW5850', room: 'A101', online: false, ntp: false },
  { id: 'EDGE_C3_01', kind: 'Thiết bị xử lý (Jetson Orin NX)', vendor: 'NVIDIA', ip: '10.20.3.200', mac: '48:B0:2D:5E:71:03', port: 'SW-C3 / Gi1/0/24', serial: 'ORIN-NX16-0091', room: 'C302', online: true, ntp: true },
  { id: 'NVR_C_01', kind: 'Đầu ghi hình', vendor: 'Hikvision', ip: '10.20.0.10', mac: 'A4:14:37:00:10:01', port: 'SW-CORE / Te1/0/3', serial: 'DS-9632NI-0021', room: 'C301', online: true, ntp: true },
  { id: 'AP_C3_01', kind: 'Wi-Fi AP', vendor: 'Aruba', ip: '10.20.3.5', mac: 'BSSID 20:4C:03:AA:91:C0', port: 'SW-C3 / Gi1/0/1', serial: 'AP535-7781', room: 'C301', online: true, ntp: true },
  { id: 'BLE_C302', kind: 'BLE Beacon', vendor: 'Kontakt', ip: '—', mac: 'UUID f7826da6-…-c302', port: '—', serial: 'BCN-C302', room: 'C302', online: true, ntp: false },
  { id: 'KIOSK_03', kind: 'Kiosk chụp ảnh', vendor: 'DNU Capture Studio', ip: '10.10.1.33', mac: '00:1B:21:3A:4F:03', port: 'SW-A1 / Gi1/0/9', serial: 'KSK-2025-03', room: 'A102', online: true, ntp: true },
  { id: 'TS_A100_01', kind: 'Cổng xoay (turnstile)', vendor: 'ZKTeco', ip: '10.10.1.61', mac: '00:17:61:0A:21:01', port: 'SW-A1 / Gi1/0/14', serial: 'ZK-TS1000-0441', room: 'A100', online: true, ntp: true },
  { id: 'TS_A100_02', kind: 'Cổng xoay (turnstile)', vendor: 'ZKTeco', ip: '10.10.1.62', mac: '00:17:61:0A:21:02', port: 'SW-A1 / Gi1/0/15', serial: 'ZK-TS1000-0442', room: 'A100', online: true, ntp: true },
  { id: 'TS_K400_01', kind: 'Cổng xoay (turnstile)', vendor: 'ZKTeco', ip: '10.30.4.20', mac: '00:17:61:0B:40:01', port: 'SW-KTXB / Gi1/0/3', serial: 'ZK-TS1000-0512', room: 'K400', online: true, ntp: true },
  { id: 'CAM_C202_01', kind: 'Camera AI 4K', vendor: 'Hikvision', ip: '10.20.2.31', mac: 'A4:14:37:9C:01:31', port: 'SW-C2 / Gi1/0/6 PoE', serial: 'DS2CD-K48790', room: 'C202', online: true, ntp: true },
  { id: 'SCN_A102_01', kind: 'Máy quét tại quầy', vendor: 'HID OMNIKEY', ip: '—', mac: 'USB (KIOSK_03)', port: '—', serial: 'OMK-5422-118', room: 'A102', online: true, ntp: false },
  { id: 'CAM_NEW_17', kind: 'Camera AI 4K', vendor: 'Hikvision', ip: '10.20.3.57', mac: 'A4:14:37:9C:02:3D', port: 'SW-C3 / Gi1/0/17 PoE', serial: 'DS2CD-K48851', room: null, online: true, ntp: true },
];

// Mỗi quy tắc gắn một mục đích xử lý (PURPOSES) và một chính sách cảnh báo (ALERT_POLICIES).
// policies: chính sách sinh trắc mà quy tắc áp dụng (xem data/rulesStore.js).
// mode: active = đang chạy; shadow = chạy bóng, chỉ ghi nhận để so sánh, không phát cảnh báo; off = tắt.
export const RULES = [
  { id: 'R-001', policies: ['POL-STU'], name: 'Điểm danh lớp học theo lịch', group: 'Sinh viên của lớp học phần', space: 'Phòng của tiết học', time: 'Theo lịch học, trừ giải lao', action: 'Kết luận theo tiết: có mặt / đi muộn / vắng / có phép / không xác định', type: 'audit', purpose: 'P-ATT-START', alert: 'AP-ACAD-DAY', mode: 'active', hits: 18420, params: true },
  { id: 'R-002', policies: ['POL-STF'], name: 'Kích hoạt ghi hình bài giảng', group: 'Giảng viên phụ trách tiết', space: 'Phòng học có đầu ghi', time: 'Theo lịch học', action: 'Bật/tắt ghi hình; GV có nút bật tay khi không nhận ra', type: 'audit', purpose: 'P-LECTURER', alert: 'AP-OPS', mode: 'off', hits: 612, needs: 'Chờ điều khoản v1.3 có mục đích "Nhận diện giảng viên"' },
  { id: 'R-003', policies: 'ALL', name: 'Danh sách cấm tại cổng', group: 'Người trong danh sách cấm', space: 'Cổng & sảnh', time: '24/7', action: 'Còi tại chỗ + báo an ninh; bảo vệ xác nhận bằng ảnh', type: 'realtime', purpose: 'P-ACCESS', alert: 'AP-SEC-CRIT', mode: 'active', hits: 3 },
  { id: 'R-004A', policies: 'NONE', name: 'Người lạ trong khu vực hạn chế', group: 'Không khớp hồ sơ nào (≥ 3 giây, ≥ 3 khung hình)', space: 'Khu Hạn chế / Cấm', time: '24/7', action: 'Báo bảo vệ zone kèm ảnh để xác nhận tại chỗ; khu Cấm thì còi ngay', type: 'realtime', purpose: 'P-SECURITY', alert: 'AP-SEC-WARN', mode: 'shadow', hits: 1, needs: 'Chạy bóng đến khi điều khoản v1.3 có mục đích "An ninh khu vực hạn chế"' },
  { id: 'R-004B', policies: 'ALL', name: 'Có hồ sơ nhưng không có quyền vào', group: 'Nhận diện chắc chắn (≥ 2 khung hình), không có quyền ra vào', space: 'Khu Hạn chế / Cấm', time: '24/7', action: 'Còi tại chỗ + báo bảo vệ và đơn vị quản lý zone', type: 'realtime', purpose: 'P-ACCESS', alert: 'AP-SEC-CRIT', mode: 'active', hits: 0 },
  { id: 'R-005', policies: ['POL-STF'], name: 'Dạy thay / đổi lịch chưa đăng ký', group: 'Giảng viên không khớp lịch', space: 'Phòng học', time: 'Theo lịch học', action: 'Ghi hình nhưng giữ lại chờ duyệt; báo cáo tuần cho Trưởng khoa', type: 'audit', purpose: 'P-LECTURER', alert: 'AP-TEACH', mode: 'off', hits: 7, needs: 'Chờ điều khoản v1.3 và nội quy lao động' },
  { id: 'R-006', policies: 'NONE', name: 'Thống kê mật độ căng tin', group: 'Tất cả (ẩn danh)', space: 'Căng tin, sảnh lớn', time: '06:00–21:00', action: 'Đếm người, không định danh', type: 'audit', purpose: 'P-DENSITY', alert: null, mode: 'off', hits: 0 },
  { id: 'R-007', policies: ['POL-STU'], name: 'Vắng giữa giờ', group: 'Sinh viên của lớp học phần', space: 'Phòng của tiết học', time: 'Theo lịch học, trừ giải lao', action: 'Tổng rời > 1/3 tiết thì ghi "Vắng giữa giờ" cuối tiết. Không cảnh báo tức thời', type: 'audit', purpose: 'P-ATT-CONT', alert: 'AP-ACAD-REPEAT', mode: 'shadow', hits: 0, params: true, needs: 'Cần camera cửa và điều khoản v1.3; hiện chỉ chạy bóng ở C302' },
  { id: 'R-008', policies: ['POL-STF'], name: 'Ngoại lệ giảng dạy', group: 'Giảng viên phụ trách tiết', space: 'Phòng của tiết học', time: 'Theo lịch học', action: 'Đến muộn, kết thúc sớm, buổi không thấy GV mà không có đơn nghỉ → danh sách để GV giải trình', type: 'audit', purpose: 'P-LECTURER', alert: 'AP-TEACH', mode: 'off', hits: 0, needs: 'Chờ nội quy lao động và ý kiến công đoàn' },
  { id: 'R-009', policies: ['POL-STU'], name: 'Phòng học không quan sát được', group: 'Cả lớp: Không xác định > 20% tiết', space: 'Phòng học', time: 'Theo lịch học', action: 'Tạo sự cố thiết bị; nhắc GV điểm danh tay', type: 'audit', purpose: 'P-ATT-START', alert: 'AP-OPS', mode: 'active', hits: 4 },
  { id: 'R-010', policies: 'NONE', name: 'Khuôn mặt không khớp danh sách lớp', group: 'Người không có Face ID hoặc không thuộc lớp', space: 'Phòng của tiết học', time: 'Theo lịch học', action: 'Loại bỏ ngay tại thiết bị, chỉ đếm số lượng; dư so với số SV quét QR thì báo GV "có thể có người ngoài danh sách"', type: 'audit', purpose: 'P-ATT-START', alert: null, mode: 'active', hits: 2310 },
  { id: 'R-011', policies: ['POL-RES'], name: 'Ra vào KTX trong giờ giới nghiêm', group: 'Cư dân KTX', space: 'Cửa từ KTX Tòa B', time: '23:00–05:00', action: 'Vẫn mở cửa cho cư dân; ghi nhận và gửi bản tổng hợp sáng hôm sau cho Ban Quản lý KTX', type: 'audit', purpose: 'P-ACCESS', alert: 'AP-DORM', mode: 'active', hits: 46 },
  { id: 'R-012', policies: ['POL-CTR'], name: 'Nhà thầu ngoài ca trực hoặc hết hạn hợp đồng', group: 'Nhân viên nhà thầu', space: 'Cổng & khu được cấp quyền', time: 'Ngoài ca trực (Chấm công)', action: 'Không mở cửa; báo bảo vệ zone và đơn vị quản lý hợp đồng', type: 'realtime', purpose: 'P-ACCESS', alert: 'AP-SEC-WARN', mode: 'active', hits: 5, needs: 'Chấm công đang mất đồng bộ 26 giờ: tạm dùng ca làm việc cũ' },
  { id: 'R-013', policies: 'ALL', name: 'Ghi lượt ra vào các zone', group: 'Mọi người đã có Face ID; người khác ghi "không định danh"', space: 'Mọi zone bật "Ghi lượt ra vào"', time: '24/7', action: 'Ghi 1 dòng mỗi lần vào / ra zone: người, zone, hướng, thời điểm, thiết bị, độ tin cậy. Không lưu ảnh, không cảnh báo', type: 'audit', purpose: 'P-MOVE', alert: null, mode: 'shadow', hits: 1412100, needs: 'Chạy bóng: chỉ lưu số đếm ẩn danh cho đến khi có điều khoản v1.3 và DPIA' },
];

export const SCHEDULE = [
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C302', course: 'Cấu trúc dữ liệu', lecturer: 'ThS. Phạm Thu Trang', cls: 'K17-CNTT-02', present: 52, late: 3, midAbsent: 1, absent: 5, leave: 1, unknown: 1, alt: 5, stage: 'provisional', recording: 'done' },
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C301', course: 'Kinh tế vi mô', lecturer: 'TS. Trần Thị Thu Thảo', cls: 'K66-QTKD-A', present: 47, late: 6, midAbsent: 0, absent: 2, leave: 0, unknown: 3, alt: 3, stage: 'final', recording: 'done' },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C302', course: 'Mạng máy tính', lecturer: 'ThS. Lê Quang Huy', cls: 'K17-CNTT-01', present: 41, late: 2, midAbsent: 0, absent: 7, leave: 2, unknown: 0, alt: 2, stage: 'live', recording: 'held', substitute: true },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C305', course: 'Thực hành Java', lecturer: 'ThS. Đỗ Minh Tâm', cls: 'K18-CNTT-03', present: 0, late: 0, midAbsent: 0, absent: 0, leave: 0, unknown: 0, alt: 0, stage: 'manual', recording: 'blocked', blocked: true },
];

export const RECORDING_META = {
  done: ['status-active', 'Đã ghi xong'],
  live: ['status-rejected', 'Đang ghi'],
  blocked: ['status-inactive', 'Không ghi: phòng chưa duyệt'],
  held: ['status-pending', 'Ghi xong, giữ chờ GV duyệt'],
};
