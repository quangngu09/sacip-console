// Dữ liệu mẫu (giả lập) — không dùng ảnh thật hay dữ liệu cá nhân thật.

export const CURRENT_USER = { name: 'Lê Hoàng Minh', role: 'Kiểm toán viên trưởng', id: 'LM-9812' };

export const TENANTS = ['Đại học Đại Nam', 'Phân hiệu Cơ sở II'];
export const ORG_UNITS = ['Tất cả Khoa / Phòng ban', 'Khoa Công nghệ Thông tin', 'Khoa Kinh tế & QTKD', 'Khoa Điện - Điện tử', 'Phòng Đào tạo', 'Ban Quản lý KTX'];
export const SUBJECT_TYPES = ['Đối tượng: Tất cả', 'Sinh viên', 'Giảng viên', 'Cán bộ', 'NV thuê ngoài', 'Cư dân KTX'];

export const PROFILES = [
  { id: 'SV-2023-8891', name: 'Nguyễn Hoàng Nam', email: 'nam.nh23@student.edu.vn', type: 'Sinh viên', unit: 'Khoa CNTT', source: 'App MyDaiNam', status: 'collected', validity: '30/06/2027', score: 98, risk: null, seed: 1 },
  { id: 'SV-2024-1102', name: 'Lê Minh Khôi', email: 'khoi.lm24@student.edu.vn', type: 'Sinh viên', unit: 'Khoa Kinh tế & QTKD', source: 'App MyDaiNam', status: 'quality', validity: 'Chờ chụp lại', score: 64, risk: 'Góc nghiêng > 20°', seed: 2 },
  { id: 'GV-2018-042', name: 'TS. Trần Thị Thu Thảo', email: 'thao.ttt@uni.edu.vn', type: 'Giảng viên', unit: 'Viện ĐT Quốc tế', source: 'Nhập tại quầy', status: 'collected', validity: '31/12/2028', score: 95, risk: null, seed: 3 },
  { id: 'KTX-2023-441', name: 'Phạm Quốc Bảo', email: 'bao.pq@dorm.uni.edu.vn', type: 'Cư dân KTX', unit: 'KTX Tòa B (P.402)', source: 'Ảnh thẻ kiosk', status: 'collected', validity: 'Sắp hết hạn (15 ngày)', expiring: true, score: 91, risk: null, seed: 4 },
  { id: 'NV-2022-019', name: 'Vũ Thị Mai Anh', email: 'maianh.vt@staff.edu.vn', type: 'Cán bộ', unit: 'Phòng Hành chính - QT', source: 'Ảnh thẻ kiosk', status: 'pending', validity: 'Chờ kích hoạt', score: 89, risk: null, seed: 5 },
  { id: 'EXT-2024-008', name: 'Đoàn Văn Hùng', email: 'hung.dv@vendingpartner.vn', type: 'NV thuê ngoài', unit: 'Đơn vị Căn-tin', source: 'Nhập tại quầy', status: 'locked', validity: 'Đã vô hiệu hóa', score: 48, risk: 'Nguy cơ ảnh in (Spoofing)', seed: 6 },
  { id: 'SV-2024-9912', name: 'Hoàng Đỗ Gia Hân', email: 'giahan.hd24@student.edu.vn', type: 'Sinh viên', unit: 'Khoa Ngoại ngữ', source: null, status: 'none', validity: null, score: null, risk: null, seed: 7 },
  { id: 'SV-2023-5521', name: 'Trịnh Bảo Ngọc', email: 'ngoc.tb23@student.edu.vn', type: 'Sinh viên', unit: 'Khoa CNTT', source: 'Camera cổng', status: 'collected', validity: '30/06/2027', score: 93, risk: null, seed: 8 },
  { id: 'GV-2020-117', name: 'ThS. Nguyễn Văn An', email: 'an.nv@uni.edu.vn', type: 'Giảng viên', unit: 'Khoa Kinh tế & QTKD', source: 'Nhập tại quầy', status: 'collected', validity: '31/12/2027', score: 96, risk: null, seed: 9 },
  { id: 'SV-2022-3340', name: 'Đặng Thu Hà', email: 'ha.dt22@student.edu.vn', type: 'Sinh viên', unit: 'Khoa Điện - Điện tử', source: 'App MyDaiNam', status: 'pending', validity: 'Chờ kích hoạt', score: 87, risk: null, seed: 10 },
];

export const STATUS_META = {
  collected: { label: 'Đã thu thập', color: 'status-active' },
  quality: { label: 'Lỗi chất lượng', color: 'status-rejected' },
  pending: { label: 'Chờ xác nhận', color: 'status-pending' },
  locked: { label: 'Tạm khóa', color: 'status-rejected' },
  none: { label: 'Chưa thu thập', color: 'status-inactive' },
};

export const REQUESTS = [
  {
    id: 'YC-2025-0842', kind: 'rescan', kindLabel: 'Rescan Kiosk', status: 'pending', priority: 'Cao', sla: 'Còn 03h 45m', slaUrgent: false,
    name: 'Lê Minh Khôi', initials: 'MK', subjectId: 'SV-2024-1102', unit: 'Khoa Kinh tế & QTKD', cls: 'K66-QTKD-A', time: '2 giờ trước', created: '14:20 24/10/2025',
    note: 'Em đi chụp ảnh tại Kiosk số 03 vào sáng nay nhưng hệ thống báo ảnh chói trán (specular glare) và góc chụp lệch 22 độ nên camera nhận diện thư viện và cửa phòng thi không khớp. Kính đề nghị Phòng Đào tạo mở lại quyền để em chụp lại tại trạm Kiosk.',
    ai: { quality: 64, match: 94.2, liveness: 99.4, confidence: 98.6, verdict: 'Hồ sơ gặp lỗi ngoại cảnh khi chụp tại Kiosk số 03 (đèn trần phản quang trên trán, nghiêng đầu 22°). Khuyến nghị CHẤP THUẬN cấp quyền chụp lại tại Kiosk 01 hoặc 02. Quyết định cuối cùng thuộc về cán bộ Phòng Đào tạo.' },
    footer: 'Bước 3/4 • Phòng Đào tạo', step: 3,
  },
  { id: 'YC-2025-0841', kind: 'new', kindLabel: 'Đăng ký mới', status: 'pending', priority: 'Thường', sla: 'Còn 18h 20m', name: 'TS. Trần Thị Thu Thảo', initials: 'TT', subjectId: 'GV-2018-042', unit: 'Viện Đào tạo Quốc tế', time: '3 giờ trước', created: '13:05 24/10/2025', note: 'Đăng ký truy cập giảng đường thông minh & Phòng LAB thực nghiệm 402.', footer: 'Chờ Thư ký Viện duyệt', step: 2, ai: { quality: 95, match: 99.1, liveness: 99.8, confidence: 97.2, verdict: 'Ảnh đạt chuẩn ICAO, khớp CCCD gắn chip 99.1%. Không phát hiện bất thường.' } },
  { id: 'YC-2025-0839', kind: 'revoke', kindLabel: 'Khóa / Thu hồi', status: 'pending', priority: 'Khẩn cấp', sla: 'Còn 01h 15m', slaUrgent: true, name: 'Đoàn Văn Hùng', initials: 'ĐH', subjectId: 'EXT-2024-008', unit: 'Đơn vị Căn-tin', time: '4 giờ trước', created: '12:30 24/10/2025', note: 'Yêu cầu thu hồi toàn bộ quyền quét Face ID cổng KTX & Tòa nhà thí nghiệm do kết thúc hợp đồng và có cảnh báo ảnh in.', footer: 'Bước 2/3 • Cần xác nhận 2 người', step: 2, twoPerson: true, ai: { quality: 48, match: 71.3, liveness: 42.0, confidence: 88.0, verdict: 'Phát hiện dấu hiệu tấn công trình diễn (ảnh in). AI chỉ gợi ý — việc thu hồi cần 2 cán bộ xác nhận.' } },
  { id: 'YC-2025-0836', kind: 'consent', kindLabel: 'Rút đồng ý (NĐ 13)', status: 'pending', priority: 'Bình thường', sla: 'Còn 22h 10m', name: 'Hoàng Đỗ Gia Hân', initials: 'GH', subjectId: 'SV-2023-4509', unit: 'Khoa Luật Quốc tế', time: '5 giờ trước', created: '14:15 hôm nay', note: 'Em thực hiện quyền rút lại sự đồng ý cho phép Nhà trường lưu trữ và nhận diện vector khuôn mặt theo Nghị định 13/2023/NĐ-CP. Em đề nghị được cấp thẻ sinh viên RFID để điểm danh và ra vào giảng đường.', footer: 'Bước 3/4 • Xóa vector', step: 3 },
  { id: 'YC-2025-0830', kind: 'extend', kindLabel: 'Gia hạn quyền', status: 'pending', priority: 'Thấp', sla: 'Còn 36h', name: 'Vũ Thị Mai Anh', initials: 'MA', subjectId: 'NV-2022-019', unit: 'Phòng Hành chính - QT', time: 'Hôm qua', created: '09:10 23/10/2025', note: 'Đề nghị gia hạn quyền truy cập khu hành chính đến hết năm 2026. Đã có văn bản đính kèm.', footer: 'Chờ duyệt trưởng đơn vị', step: 2, ai: { quality: 89, match: 96.0, liveness: 99.0, confidence: 93.0, verdict: 'Hồ sơ hợp lệ, văn bản đính kèm đầy đủ.' } },
  { id: 'YC-2025-0821', kind: 'new', kindLabel: 'Đăng ký mới', status: 'approved', priority: 'Thường', sla: 'Đã xử lý', name: 'Trịnh Bảo Ngọc', initials: 'BN', subjectId: 'SV-2023-5521', unit: 'Khoa CNTT', time: '2 ngày trước', created: '08:00 22/10/2025', note: 'Đăng ký Face ID điểm danh lớp học.', footer: 'Hoàn tất', step: 4, ai: { quality: 93, match: 98.0, liveness: 99.5, confidence: 96.0, verdict: 'Đạt chuẩn.' } },
];

export const NOTIFICATIONS = [
  { id: 1, color: 'status-rejected', title: 'Rút đồng ý Face ID (NĐ 13)', time: '5 phút trước', body: 'Sinh viên Hoàng Đỗ Gia Hân (SV-2023-4509) gửi yêu cầu thu hồi template khuôn mặt.', unread: true },
  { id: 2, color: 'status-pending', title: 'Yêu cầu sắp quá SLA', time: '18 phút trước', body: 'YC-2025-0839 (Khóa / Thu hồi) còn 01h 15m để xử lý.', unread: true },
  { id: 3, color: 'status-rejected', title: 'Cảnh báo SOC: Restricted Zone', time: '25 phút trước', body: 'Đối tượng lạ xuất hiện tại Phòng Server tầng 5 nhà A. Đã kích hoạt còi tại chỗ.', unread: true, alert: true },
  { id: 4, color: 'transparent', title: 'Kiosk 01 đồng bộ thành công', time: '1 giờ trước', body: 'Danh sách thu hồi quyền đã nạp vào Kiosk Nhà A.', unread: false },
];

// Cây không gian — Master Data / GIS. approved=false => chưa được duyệt hạ tầng.
export const SPACE_TREE = [
  { id: 'A', name: 'Tòa A — Hành chính', type: 'building', children: [
    { id: 'A-1', name: 'Tầng 1', type: 'floor', children: [
      { id: 'A101', name: 'Sảnh chính A', type: 'room', zone: 'Public', approved: true, devices: ['CAM_A101_01'] },
      { id: 'A102', name: 'Phòng Đào tạo', type: 'room', zone: 'Operational', approved: true, devices: ['KIOSK_03'] },
    ]},
    { id: 'A-5', name: 'Tầng 5', type: 'floor', children: [
      { id: 'A501', name: 'Phòng Server', type: 'room', zone: 'Restricted', approved: true, devices: ['CAM_A501_01'] },
    ]},
  ]},
  { id: 'C', name: 'Tòa C — Giảng đường', type: 'building', children: [
    { id: 'C-3', name: 'Tầng 3', type: 'floor', children: [
      { id: 'C301', name: 'Phòng học C301', type: 'room', zone: 'Operational', approved: true, devices: ['CAM_C301_01', 'AP_C3_01'] },
      { id: 'C302', name: 'Phòng học C302', type: 'room', zone: 'Operational', approved: true, devices: ['CAM_C302_01', 'BLE_C302'] },
      { id: 'C305', name: 'Phòng máy C305', type: 'room', zone: 'Operational', approved: false, devices: [] },
    ]},
  ]},
  { id: 'K', name: 'KTX — Tòa B', type: 'building', children: [
    { id: 'K-4', name: 'Tầng 4', type: 'floor', children: [
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
  { id: 'EDGE_C3_01', kind: 'Edge Box (Jetson Orin NX)', vendor: 'NVIDIA', ip: '10.20.3.200', mac: '48:B0:2D:5E:71:03', port: 'SW-C3 / Gi1/0/24', serial: 'ORIN-NX16-0091', room: 'C302', online: true, ntp: true },
  { id: 'NVR_C_01', kind: 'NVR / Đầu ghi', vendor: 'Hikvision', ip: '10.20.0.10', mac: 'A4:14:37:00:10:01', port: 'SW-CORE / Te1/0/3', serial: 'DS-9632NI-0021', room: 'C301', online: true, ntp: true },
  { id: 'AP_C3_01', kind: 'Wi-Fi AP', vendor: 'Aruba', ip: '10.20.3.5', mac: 'BSSID 20:4C:03:AA:91:C0', port: 'SW-C3 / Gi1/0/1', serial: 'AP535-7781', room: 'C301', online: true, ntp: true },
  { id: 'BLE_C302', kind: 'BLE Beacon', vendor: 'Kontakt', ip: '—', mac: 'UUID f7826da6-…-c302', port: '—', serial: 'BCN-C302', room: 'C302', online: true, ntp: false },
  { id: 'KIOSK_03', kind: 'Kiosk chụp ảnh', vendor: 'DNU Capture Studio', ip: '10.10.1.33', mac: '00:1B:21:3A:4F:03', port: 'SW-A1 / Gi1/0/9', serial: 'KSK-2025-03', room: 'A102', online: true, ntp: true },
  { id: 'CAM_NEW_17', kind: 'Camera AI 4K', vendor: 'Hikvision', ip: '10.20.3.57', mac: 'A4:14:37:9C:02:3D', port: 'SW-C3 / Gi1/0/17 PoE', serial: 'DS2CD-K48851', room: null, online: true, ntp: true },
];

export const RULES = [
  { id: 'R-001', name: 'Điểm danh lớp học theo TKB', group: 'Sinh viên lớp học phần', space: 'Phòng học (Tòa C)', time: 'Theo TKB — ±15 phút', action: 'Ghi PRESENT / LATE, tích lũy ≥80% session', type: 'audit', enabled: true, hits: 18420 },
  { id: 'R-002', name: 'Kích hoạt ghi hình bài giảng', group: 'Giảng viên phụ trách môn', space: 'Phòng học có NVR', time: 'Theo TKB', action: 'ISAPI Start/Stop NVR + đánh dấu Start/End', type: 'audit', enabled: true, hits: 612 },
  { id: 'R-003', name: 'Cảnh báo Blacklist tại cổng', group: 'Danh sách Blacklist', space: 'Cổng & Sảnh (Public)', time: '24/7', action: 'Còi tại chỗ + Push SOC (≤2s)', type: 'realtime', enabled: true, hits: 3 },
  { id: 'R-004', name: 'Xâm nhập Restricted Zone', group: 'Không có quyền', space: 'Phòng Server A501', time: '24/7', action: 'Còi tại chỗ + Push SOC (≤2s)', type: 'realtime', enabled: true, hits: 1 },
  { id: 'R-005', name: 'Dạy thay / đổi lịch chưa xin phép', group: 'Giảng viên không khớp TKB', space: 'Phòng học', time: 'Theo TKB', action: 'Vẫn ghi âm & phát hành, bắn cảnh báo hậu kiểm', type: 'audit', enabled: true, hits: 7 },
  { id: 'R-006', name: 'Heatmap mật độ căng tin', group: 'Tất cả (ẩn danh)', space: 'Căng tin, sảnh lớn', time: '06:00–21:00', action: 'Thống kê mật độ, không định danh', type: 'audit', enabled: false, hits: 0 },
];

export const SCHEDULE = [
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C302', course: 'Cấu trúc dữ liệu', lecturer: 'ThS. Nguyễn Văn An', cls: 'K17-CNTT-02', present: 52, late: 3, absent: 5, recording: 'done' },
  { slot: 'Tiết 1-3 (07:00–09:25)', room: 'C301', course: 'Kinh tế vi mô', lecturer: 'TS. Trần Thị Thu Thảo', cls: 'K66-QTKD-A', present: 47, late: 6, absent: 2, recording: 'done' },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C302', course: 'Mạng máy tính', lecturer: 'ThS. Lê Quang Huy', cls: 'K17-CNTT-01', present: 41, late: 2, absent: 7, recording: 'live', substitute: true },
  { slot: 'Tiết 4-6 (09:35–12:00)', room: 'C305', course: 'Thực hành Java', lecturer: 'ThS. Đỗ Minh Tâm', cls: 'K18-CNTT-03', present: 0, late: 0, absent: 0, recording: 'blocked', blocked: true },
];

export const SOC_EVENTS = [
  { id: 'EV-99121', level: 'critical', title: 'Người lạ trong Restricted Zone', place: 'A501 — Phòng Server', cam: 'CAM_A501_01', time: '16:32:08', latency: '1.4s', state: 'open' },
  { id: 'EV-99117', level: 'critical', title: 'Khớp Blacklist tại cổng', place: 'Cổng chính — Sảnh A', cam: 'CAM_A101_01', time: '15:58:41', latency: '1.8s', state: 'ack' },
  { id: 'EV-99102', level: 'warning', title: 'Dạy thay chưa xin phép', place: 'C302 — Tiết 4-6', cam: 'CAM_C302_01', time: '09:41:12', latency: '—', state: 'open' },
  { id: 'EV-99098', level: 'info', title: 'Khiếu nại điểm danh', place: 'C301 — SV-2024-1102', cam: 'CAM_C301_01', time: '09:30:55', latency: '—', state: 'open' },
  { id: 'EV-99090', level: 'warning', title: 'Camera mất kết nối', place: 'A101 — Sảnh chính', cam: 'CAM_A101_01', time: '08:12:03', latency: '—', state: 'ack' },
];

export const INITIAL_AUDIT = [
  { t: '24/10/2025 16:35:02', actor: 'Lê Hoàng Minh', action: 'Mở xem chi tiết hồ sơ', target: 'SV-2024-1102', kind: 'view' },
  { t: '24/10/2025 16:32:09', actor: 'Policy Engine', action: 'Kích hoạt R-004 (Restricted Zone)', target: 'EV-99121', kind: 'alert' },
  { t: '24/10/2025 14:32:40', actor: 'KIOSK_03', action: 'Tải lên gói dữ liệu nhận diện đa góc', target: 'SV-2024-1102', kind: 'system' },
  { t: '24/10/2025 14:30:11', actor: 'IAM', action: 'Xác thực chip CCCD thành công', target: 'SV-2024-1102', kind: 'system' },
  { t: '24/10/2025 14:21:03', actor: 'AI-ENGINE v4.1', action: 'Confidence 94.2%, yaw 22°', target: 'YC-2025-0842', kind: 'ai' },
  { t: '24/10/2025 14:20:45', actor: 'App MyDaiNam', action: 'Tạo yêu cầu chụp lại', target: 'YC-2025-0842', kind: 'system' },
];

export const CONSENTS = [
  { id: 'SV-2023-8891', name: 'Nguyễn Hoàng Nam', purpose: 'Điểm danh, ra vào, phát hành thẻ', signed: '15/09/2023', channel: 'App MyDaiNam (OTP)', state: 'active' },
  { id: 'SV-2024-1102', name: 'Lê Minh Khôi', purpose: 'Điểm danh, ra vào, phát hành thẻ', signed: '25/10/2024', channel: 'Kiosk OTP', state: 'active' },
  { id: 'SV-2023-4509', name: 'Hoàng Đỗ Gia Hân', purpose: 'Điểm danh, ra vào', signed: '02/09/2023', channel: 'App MyDaiNam (OTP)', state: 'withdrawing' },
  { id: 'GV-2018-042', name: 'TS. Trần Thị Thu Thảo', purpose: 'Ra vào phòng LAB, ghi hình bài giảng', signed: '10/01/2024', channel: 'Nhập tại quầy', state: 'active' },
  { id: 'EXT-2024-008', name: 'Đoàn Văn Hùng', purpose: 'Ra vào khu căng tin', signed: '01/03/2024', channel: 'Nhập tại quầy', state: 'expired' },
  { id: 'SV-2024-9912', name: 'Hoàng Đỗ Gia Hân (K24)', purpose: '—', signed: '—', channel: '—', state: 'none' },
];
