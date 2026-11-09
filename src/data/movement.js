// Dữ liệu mẫu cho Lượt ra vào khu vực (quy tắc R-013): mỗi lần một người đi qua ranh giới một zone có camera
// thì ghi một dòng, giống trạm camera giao thông ghi biển số. Thay bằng API khi có backend.

/** Zone nào ghi lượt ra vào. Zone riêng tư không bao giờ được bật. */
export const MOVEMENT_ZONES = {
  A100: { log: true, cam: 'TS_A100_01', note: 'Cổng chính: điểm vào / ra trường' },
  A101: { log: true, cam: 'CAM_A101_01', note: 'Sảnh tòa A', down: true },
  A102: { log: true, cam: 'KIOSK_03', note: 'Phòng Đào tạo: khu làm việc có tiếp SV' },
  A501: { log: true, cam: 'CAM_A501_01', note: 'Khu Hạn chế: có lưu ảnh mờ 30 ngày' },
  C202: { log: true, cam: 'CAM_C202_01', note: 'Khu Hạn chế: có lưu ảnh mờ 30 ngày' },
  C301: { log: true, cam: 'CAM_C301_01', note: 'Phòng học: lấy giờ vào / ra từ phiên điểm danh' },
  C302: { log: true, cam: 'CAM_C302_01', note: 'Phòng học: lấy giờ vào / ra từ phiên điểm danh' },
  C305: { log: false, cam: null, note: 'Phòng chưa duyệt hạ tầng, chưa có camera' },
  K400: { log: true, cam: 'TS_K400_01', note: 'Cửa từ KTX tầng 4' },
  K402: { log: false, cam: null, note: 'Phòng ở của cư dân: khu riêng tư, không được bật' },
  K403: { log: false, cam: null, note: 'Phòng ở của cư dân: khu riêng tư, không được bật' },
};
/** Loại zone không bao giờ được ghi lượt ra vào. */
export const NEVER_LOG = ['Nhà vệ sinh', 'Phòng y tế', 'Phòng tư vấn tâm lý', 'Phòng ở KTX', 'Phòng thay đồ', 'Phòng cầu nguyện'];

export const ZONE_NAME = { A100: 'Cổng chính Tòa A1', A101: 'Sảnh chính A', A102: 'Phòng Đào tạo', A501: 'Phòng Server', C202: 'Phòng thí nghiệm C202', C301: 'Phòng học C301', C302: 'Phòng học C302', K400: 'Cửa từ KTX tầng 4' };

/** Luồng ghi nhận gần nhất (danh tính làm mờ mặc định). identified=false: không định danh, chỉ đếm. */
export const MOVEMENT_FEED = [
  { t: '11:06:42', who: 'SV-2023-8891', type: 'STUDENT', zone: 'A100', dir: 'out', conf: 0.97, identified: true },
  { t: '11:06:40', who: null, type: null, zone: 'A100', dir: 'out', conf: null, identified: false },
  { t: '11:06:31', who: 'NV-2022-019', type: 'STAFF', zone: 'A102', dir: 'in', conf: 0.95, identified: true },
  { t: '11:06:18', who: 'SV-2024-1102', type: 'STUDENT', zone: 'A102', dir: 'in', conf: 0.91, identified: true },
  { t: '11:06:02', who: 'EXT-2025-031', type: 'CONTRACTOR', zone: 'A501', dir: 'in', conf: 0.98, identified: true, image: true },
  { t: '11:05:57', who: null, type: null, zone: 'C302', dir: 'in', conf: null, identified: false },
  { t: '11:05:44', who: 'SV-2023-5521', type: 'STUDENT', zone: 'C302', dir: 'out', conf: 0.93, identified: true },
  { t: '11:05:21', who: 'GST-2026-0311', type: 'GUEST', zone: 'A100', dir: 'in', conf: 0.89, identified: true },
  { t: '11:05:09', who: 'KTX-2024-118', type: 'RESIDENT', zone: 'K400', dir: 'out', conf: 0.96, identified: true },
  { t: '11:04:50', who: null, type: null, zone: 'A100', dir: 'in', conf: null, identified: false },
];

/** Hành trình một ngày của một SV mẫu: chỉ mở được qua yêu cầu tra cứu có lý do và người duyệt thứ hai. */
export const PERSON_JOURNEY = {
  id: 'SV-2023-8891', name: 'Nguyễn Hoàng Nam', cls: 'K17-CNTT-02', date: '06/11/2026',
  rows: [
    { t: '06:52:14', zone: 'A100', dir: 'in', conf: 0.97, src: 'Cổng xoay TS_A100_01' },
    { t: '07:01:03', zone: 'C302', dir: 'in', conf: 0.94, src: 'Phiên điểm danh (CAM_C302_01)' },
    { t: '09:25:40', zone: 'C302', dir: 'out', conf: 0.95, src: 'Phiên điểm danh (CAM_C302_01)' },
    { t: '09:41:12', zone: 'A102', dir: 'in', conf: 0.92, src: 'KIOSK_03' },
    { t: '09:58:30', zone: 'A102', dir: 'out', conf: 0.93, src: 'KIOSK_03' },
    { t: '11:06:42', zone: 'A100', dir: 'out', conf: 0.97, src: 'Cổng xoay TS_A100_01' },
    { t: '17:44:05', zone: 'K400', dir: 'in', conf: 0.96, src: 'Cổng xoay TS_K400_01' },
  ],
  gaps: ['Không ghi trong nhà vệ sinh, phòng y tế, phòng ở KTX', 'Sảnh A mất kết nối từ 08:12: không có dòng ở A101'],
};

/** Lưu lượng ẩn danh 24 giờ theo zone (lượt vào + ra). */
export const ZONE_FLOW = [
  { zone: 'A100', total: 41280, identified: 37150, peak: '07:00–07:30' },
  { zone: 'C302', total: 1240, identified: 1110, peak: '06:55–07:05' },
  { zone: 'C301', total: 1180, identified: 1040, peak: '06:55–07:05' },
  { zone: 'K400', total: 2650, identified: 2580, peak: '21:30–22:00' },
  { zone: 'A102', total: 610, identified: 574, peak: '09:30–10:00' },
  { zone: 'C202', total: 96, identified: 96, peak: '13:30–14:00' },
  { zone: 'A501', total: 14, identified: 14, peak: '—' },
];

/** Yêu cầu tra cứu hành trình đã có (dữ liệu khởi tạo). Yêu cầu mới tạo và duyệt qua src/api/client.js. */
export const LOOKUPS = [
  { id: 'LK-0042', at: '2026-11-06T10:20:00+07:00', by: 'Đỗ Minh Khang', by_id: 'NV-2016-033', target: 'EXT-2024-008', date: '2026-11-05', incident: 'AN-290', reason: 'Đối chiếu nghi vấn ảnh in tại cổng A1', approver: 'Lê Hoàng Minh', decided_at: '2026-11-06T10:41:00+07:00', status: 'approved' },
  { id: 'LK-0041', at: '2026-11-04T15:02:00+07:00', by: 'Đỗ Minh Khang', by_id: 'NV-2016-033', target: 'SV-2022-3340', date: '2026-11-04', incident: 'AN-284', reason: 'Báo mất laptop tại C202', approver: 'Lê Hoàng Minh', decided_at: '2026-11-04T15:30:00+07:00', status: 'approved' },
  { id: 'LK-0040', at: '2026-11-02T09:11:00+07:00', by: 'Phan Đức Long', by_id: 'NV-2019-007', target: 'SV-2023-6612', date: '2026-11-01', incident: '—', reason: 'Kiểm tra xem SV có đi học không', approver: 'Lê Hoàng Minh', decided_at: '2026-11-02T09:40:00+07:00', status: 'rejected', note: 'Không có sự cố; chuyên cần xem ở Lịch học & điểm danh.' },
];
