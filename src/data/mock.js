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

export const RULES = [
  { id: 'R-001', name: 'Điểm danh lớp học theo lịch', group: 'Sinh viên lớp học phần', space: 'Phòng học (Tòa C)', time: 'Theo lịch học, ±15 phút', action: 'Ghi có mặt / đi muộn, tính đủ từ 80% thời lượng', type: 'audit', enabled: true, hits: 18420 },
  { id: 'R-002', name: 'Kích hoạt ghi hình bài giảng', group: 'Giảng viên phụ trách môn', space: 'Phòng học có đầu ghi', time: 'Theo lịch học', action: 'Bật/tắt ghi hình, đánh dấu giờ bắt đầu và kết thúc', type: 'audit', enabled: true, hits: 612 },
  { id: 'R-003', name: 'Cảnh báo danh sách cấm tại cổng', group: 'Danh sách cấm', space: 'Cổng & sảnh', time: '24/7', action: 'Còi tại chỗ + báo an ninh (≤2s)', type: 'realtime', enabled: true, hits: 3 },
  { id: 'R-004', name: 'Xâm nhập khu vực hạn chế', group: 'Không có quyền', space: 'Phòng Server A501', time: '24/7', action: 'Còi tại chỗ + báo an ninh (≤2s)', type: 'realtime', enabled: true, hits: 1 },
  { id: 'R-005', name: 'Dạy thay / đổi lịch chưa xin phép', group: 'Giảng viên không khớp lịch', space: 'Phòng học', time: 'Theo lịch học', action: 'Vẫn ghi âm và phát hành, gửi cảnh báo để hậu kiểm', type: 'audit', enabled: true, hits: 7 },
  { id: 'R-006', name: 'Thống kê mật độ căng tin', group: 'Tất cả (ẩn danh)', space: 'Căng tin, sảnh lớn', time: '06:00–21:00', action: 'Thống kê mật độ, không định danh', type: 'audit', enabled: false, hits: 0 },
];

export const SCHEDULE = [
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C302', course: 'Cấu trúc dữ liệu', lecturer: 'ThS. Nguyễn Văn An', cls: 'K17-CNTT-02', present: 52, late: 3, absent: 5, recording: 'done' },
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C301', course: 'Kinh tế vi mô', lecturer: 'TS. Trần Thị Thu Thảo', cls: 'K66-QTKD-A', present: 47, late: 6, absent: 2, recording: 'done' },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C302', course: 'Mạng máy tính', lecturer: 'ThS. Lê Quang Huy', cls: 'K17-CNTT-01', present: 41, late: 2, absent: 7, recording: 'live', substitute: true },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C305', course: 'Thực hành Java', lecturer: 'ThS. Đỗ Minh Tâm', cls: 'K18-CNTT-03', present: 0, late: 0, absent: 0, recording: 'blocked', blocked: true },
];

export const SOC_EVENTS = [
  { id: 'EV-99121', level: 'critical', title: 'Người lạ trong khu vực hạn chế', place: 'A501 — Phòng Server', cam: 'CAM_A501_01', time: '16:32:08', latency: '1,4 giây', state: 'open' },
  { id: 'EV-99117', level: 'critical', title: 'Trùng danh sách cấm tại cổng', place: 'Cổng chính — Sảnh A', cam: 'CAM_A101_01', time: '15:58:41', latency: '1,8 giây', state: 'ack' },
  { id: 'EV-99102', level: 'warning', title: 'Dạy thay chưa xin phép', place: 'C302 — Tiết 4-6', cam: 'CAM_C302_01', time: '09:41:12', latency: '—', state: 'open' },
  { id: 'EV-99098', level: 'info', title: 'Khiếu nại điểm danh', place: 'C301 — SV-2024-1102', cam: 'CAM_C301_01', time: '09:30:55', latency: '—', state: 'open' },
  { id: 'EV-99090', level: 'warning', title: 'Camera mất kết nối', place: 'A101 — Sảnh chính', cam: 'CAM_A101_01', time: '08:12:03', latency: '—', state: 'ack' },
];

export const RECORDING_META = {
  done: ['status-active', 'Đã ghi xong'],
  live: ['status-rejected', 'Đang ghi'],
  blocked: ['status-inactive', 'Không ghi: phòng chưa duyệt'],
};
