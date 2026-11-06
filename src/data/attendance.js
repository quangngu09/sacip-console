// Dữ liệu mẫu theo bản phân tích "Quy tắc khu vực & Điểm danh" (06/11/2026):
// mục đích xử lý, thời hạn lưu, quyền ra vào, chính sách cảnh báo, tham số điểm danh, phiên có mặt, báo cáo hiện diện.

/** Mục đích xử lý theo điều khoản đồng ý. Quy tắc phải gắn một mục đích; mục đích chưa có đồng ý thì không bật được. */
export const PURPOSES = [
  { id: 'P-ATT-START', name: 'Điểm danh đầu giờ theo lịch học', terms: 'v1.2', consented: 19840, total: 24850, status: 'active', basis: 'Đồng ý (Luật 91/2025, Đ.9)', note: 'Có trong điều khoản v1.2. Người không đồng ý điểm danh bằng QR động, không bị bất lợi.' },
  { id: 'P-ACCESS', name: 'Ra vào cổng, KTX, phòng thí nghiệm', terms: 'v1.2', consented: 19840, total: 24850, status: 'active', basis: 'Đồng ý', note: 'Có trong điều khoản v1.2.' },
  { id: 'P-SECURITY', name: 'An ninh khu vực hạn chế (phát hiện người lạ)', terms: 'v1.3 (dự thảo)', consented: 0, total: 24850, status: 'draft', basis: 'Đồng ý + biển báo tại khu vực', note: 'v1.2 chỉ nêu "ra vào"; cần nêu rõ việc so khớp để phát hiện người lạ.' },
  { id: 'P-ATT-CONT', name: 'Theo dõi có mặt trong tiết (rời / quay lại)', terms: 'v1.3 (dự thảo)', consented: 0, total: 24850, status: 'draft', basis: 'Đồng ý riêng', note: 'Mục đích mới, cần DPIA cập nhật trước khi bật.' },
  { id: 'P-LECTURER', name: 'Nhận diện giảng viên: bật ghi hình, thống kê giờ dạy', terms: 'v1.3 (dự thảo)', consented: 0, total: 1620, status: 'draft', basis: 'Nội quy lao động + đồng ý riêng', note: 'Cần tham khảo ý kiến công đoàn (BLLĐ 2019, Đ.118).' },
  { id: 'P-RECORD', name: 'Ghi hình và phát hành video bài giảng', terms: 'v1.3 (dự thảo)', consented: 0, total: 1620, status: 'draft', basis: 'Đồng ý + quyền tác giả của GV', note: 'Camera hướng bục giảng; GV duyệt trước khi phát hành.' },
  { id: 'P-DENSITY', name: 'Thống kê mật độ ẩn danh', terms: 'Không cần', consented: null, total: null, status: 'active', basis: 'Không định danh', note: 'Không so khớp khuôn mặt, chỉ đếm người.' },
];
export const purposeOf = (id) => PURPOSES.find((p) => p.id === id);
export const purposeReady = (id) => purposeOf(id)?.status === 'active';

/** Thời hạn lưu theo từng loại dữ liệu. */
export const RETENTION = [
  { kind: 'Sự kiện nhận diện thô (mã người, phòng, thời điểm, độ tin cậy)', keep: 'Đến hết hạn khiếu nại của học kỳ', basis: 'Tối thiểu hóa; đủ cho khiếu nại và chạy bóng quy tắc', note: 'Không lưu ảnh, không lưu vector trong luồng sự kiện' },
  { kind: 'Kết luận điểm danh theo tiết', keep: 'Theo quy chế hồ sơ học vụ', basis: 'Quy chế đào tạo của trường', note: '—' },
  { kind: 'Minh chứng điểm danh (ảnh đã làm mờ)', keep: 'Đến hết hạn khiếu nại của học kỳ', basis: 'Trước đây 30 ngày, không đủ cho khiếu nại cuối kỳ', note: 'Mở ảnh gốc có ghi nhật ký' },
  { kind: 'Minh chứng sự cố an ninh', keep: '30 ngày; giữ lâu hơn khi đang điều tra', basis: 'An ninh khu vực hạn chế', note: 'Làm mờ; mở khi tiếp nhận sự cố' },
  { kind: 'Dữ liệu hiện diện của GV / CBNV', keep: 'Xóa khi chấm dứt hợp đồng', basis: 'Luật 91/2025, Đ.25', note: '—' },
  { kind: 'Mẫu khuôn mặt (vector)', keep: 'Xóa trong 20 ngày sau khi rút đồng ý hoặc thôi học', basis: 'NĐ 356/2025, Đ.5', note: '—' },
];

export const DPIA = {
  status: 'Cần cập nhật', last: '01/08/2025', form: 'Mẫu 10, NĐ 356/2025', dpo: 'Chưa chỉ định',
  pending: ['Theo dõi có mặt trong tiết', 'Nhận diện giảng viên', 'Ghi hình bài giảng', 'An ninh khu vực hạn chế'],
};

export const GRANT_SOURCE = { manual: ['neutral', 'Thủ công'], ems: ['primary', 'Từ lịch EMS'], contract: ['secondary', 'Từ hợp đồng'], hr: ['primary', 'Từ Nhân sự'] };
export const SUBJECT_KIND = { unit: ['corporate_fare', 'Đơn vị'], person: ['person', 'Cá nhân'], class: ['school', 'Lớp học phần'], role: ['badge', 'Vai trò'] };

/** Quyền ra vào: chủ thể × zone × khung giờ × hiệu lực × nguồn. Từ chối thắng cho phép. */
export const ACCESS_GRANTS = [
  { id: 'G-101', subject: 'Phòng Quản trị mạng', kind: 'unit', zone: 'A501', zoneName: 'Phòng Server', zoneType: 'Restricted', schedule: '24/7', from: '01/09/2025', to: null, source: 'manual', effect: 'allow', by: 'Phan Đức Long' },
  { id: 'G-102', subject: 'Lý Văn Phúc • Bảo vệ An Phát', kind: 'person', zone: 'A501', zoneName: 'Phòng Server', zoneType: 'Restricted', schedule: 'Theo ca trực (Chấm công)', from: '13/11/2025', to: '13/11/2026', source: 'contract', effect: 'allow', by: 'Cổng Quản lý Nhà thầu', warn: 'Hợp đồng còn 7 ngày; Chấm công đang mất đồng bộ 26 giờ' },
  { id: 'G-103', subject: 'Đoàn Văn Hùng • Vending Partner', kind: 'person', zone: 'C202', zoneName: 'Phòng thí nghiệm C202', zoneType: 'Restricted', schedule: '24/7', from: '06/11/2026', to: null, source: 'manual', effect: 'deny', by: 'Trần Văn Đức', warn: 'Chặn tạm trong khi chờ thu hồi REQ-8839' },
  { id: 'G-104', subject: 'Khoa Điện - Điện tử', kind: 'unit', zone: 'C202', zoneName: 'Phòng thí nghiệm C202', zoneType: 'Restricted', schedule: 'Giờ hành chính 07:30–17:00', from: '01/09/2025', to: null, source: 'manual', effect: 'allow', by: 'Phan Đức Long' },
  { id: 'G-105', subject: 'K17-CNTT-02 • Cấu trúc dữ liệu', kind: 'class', zone: 'C302', zoneName: 'Phòng học C302', zoneType: 'Operational', schedule: 'Thứ Sáu 07:00–09:25', from: '15/08/2026', to: '31/12/2026', source: 'ems', effect: 'allow', by: 'Hệ thống Đào tạo' },
  { id: 'G-106', subject: 'K17-CNTT-01 • Mạng máy tính', kind: 'class', zone: 'C302', zoneName: 'Phòng học C302', zoneType: 'Operational', schedule: 'Thứ Sáu 09:35–12:00', from: '15/08/2026', to: '31/12/2026', source: 'ems', effect: 'allow', by: 'Hệ thống Đào tạo' },
  { id: 'G-107', subject: 'Kỹ thuật viên phòng máy', kind: 'role', zone: 'C305', zoneName: 'Phòng máy C305', zoneType: 'Operational', schedule: '24/7', from: '01/10/2026', to: null, source: 'manual', effect: 'allow', by: 'Phan Đức Long', warn: 'Phòng chưa duyệt hạ tầng nên quyền chưa có hiệu lực' },
];

export const SEVERITY = { critical: ['status-rejected', 'Nghiêm trọng', 'error'], warning: ['status-pending', 'Cảnh báo', 'warning'], info: ['status-inactive', 'Thông tin', 'info'] };
export const ALERT_KIND = { security: ['shield_lock', 'An ninh'], academic: ['school', 'Học vụ'], ops: ['build', 'Vận hành'] };

/** Chính sách cảnh báo. Quy tắc chỉ tham chiếu tới đây, không tự cấu hình người nhận. */
export const ALERT_POLICIES = [
  { id: 'AP-SEC-CRIT', name: 'An ninh khu Cấm / Hạn chế, nghiêm trọng', kind: 'security', severity: 'critical', recipients: ['Trực an ninh phụ trách zone', 'Đơn vị quản lý zone'], channels: ['Console An ninh', 'App bảo vệ (push)', 'Còi tại chỗ'], cooldown: '5 phút, cùng người + cùng zone', escalation: ['Sau 3 phút chưa tiếp nhận: Trưởng ca an ninh', 'Sau 10 phút: Phòng Hành chính - Quản trị'], quiet: 'Không áp dụng', sla: '≤ 2 giây' },
  { id: 'AP-SEC-WARN', name: 'An ninh, cần bảo vệ xác nhận tại chỗ', kind: 'security', severity: 'warning', recipients: ['Trực an ninh phụ trách zone'], channels: ['Console An ninh', 'App bảo vệ (push)'], cooldown: '10 phút, gộp theo zone', escalation: ['Sau 15 phút chưa tiếp nhận: Trưởng ca an ninh'], quiet: 'Không áp dụng', sla: '≤ 2 giây' },
  { id: 'AP-ACAD-DAY', name: 'Học vụ, tổng hợp cuối ngày cho cố vấn học tập', kind: 'academic', severity: 'info', recipients: ['Cố vấn học tập của lớp hành chính'], channels: ['Email tổng hợp', 'App MyDaiNam'], cooldown: 'Gộp theo ngày', escalation: [], quiet: 'Không gửi sau 21:00', sla: 'Cuối ngày' },
  { id: 'AP-ACAD-REPEAT', name: 'Học vụ, vi phạm lặp lại', kind: 'academic', severity: 'warning', recipients: ['Phòng Công tác sinh viên'], channels: ['Email tổng hợp tuần'], cooldown: 'Gộp theo tuần', escalation: [], quiet: 'Chỉ ngày làm việc', sla: 'Thứ Hai hằng tuần' },
  { id: 'AP-TEACH', name: 'Ngoại lệ giảng dạy, báo cáo Trưởng khoa', kind: 'academic', severity: 'info', recipients: ['Giảng viên (giải trình trước)', 'Trưởng khoa sau 48 giờ'], channels: ['App MyDaiNam', 'Báo cáo tuần'], cooldown: 'Gộp theo tuần', escalation: [], quiet: 'Không cảnh báo thời gian thực', sla: 'Hằng tuần' },
  { id: 'AP-DORM', name: 'KTX, tổng hợp cho Ban Quản lý KTX', kind: 'academic', severity: 'info', recipients: ['Ban Quản lý KTX'], channels: ['Email tổng hợp', 'Console'], cooldown: 'Gộp theo đêm', escalation: [], quiet: 'Gửi lúc 07:00 hôm sau', sla: 'Sáng hôm sau' },
  { id: 'AP-OPS', name: 'Vận hành thiết bị và nguồn dữ liệu', kind: 'ops', severity: 'warning', recipients: ['Bộ phận Thiết bị', 'Quản trị hệ thống'], channels: ['Console', 'Email'], cooldown: '60 phút, cùng thiết bị', escalation: ['Sau 2 giờ: Trưởng bộ phận Kỹ thuật'], quiet: 'Không áp dụng', sla: '5 phút' },
];
export const alertPolicyOf = (id) => ALERT_POLICIES.find((a) => a.id === id);

/** Tham số điểm danh: mặc định toàn trường, ghi đè theo khoa / học phần. */
export const ATTENDANCE_PARAMS = [
  { key: 'grace', label: 'Ân hạn đầu giờ', unit: 'phút', value: 15, overrides: [['Khoa CNTT • học phần thực hành', 10]], hint: 'Đến sau ân hạn thì tính đi muộn.' },
  { key: 'lateMax', label: 'Đi muộn quá mức này thì tính vắng tiết đầu', unit: 'phút', value: 30, overrides: [], hint: 'Chỉ áp dụng cho tiết đầu của ca.' },
  { key: 'lost', label: 'Mất cả mặt lẫn thân bao lâu thì chuyển "Không quan sát"', unit: 'giây', value: 90, overrides: [], hint: 'Không quan sát KHÔNG tính là vắng.' },
  { key: 'out', label: 'Ghế trống bao lâu thì suy đoán "Ra ngoài" (phòng chưa có camera cửa)', unit: 'phút', value: 10, overrides: [], hint: 'Kết quả gắn cờ suy đoán, chỉ dùng cho báo cáo.' },
  { key: 'absentShare', label: 'Tổng thời gian rời vượt mức này thì tính vắng tiết đó', unit: '% tiết', value: 33, overrides: [], hint: 'Khoảng 1/3 tiết, tức 17 phút với tiết 50 phút.' },
  { key: 'presentShare', label: 'Tỷ lệ có mặt tối thiểu để tính có mặt', unit: '% thời lượng', value: 80, overrides: [['Giáo dục thể chất', 70]], hint: 'Tính trên thời lượng đã trừ giải lao và khoảng có phép.' },
  { key: 'unknownShare', label: 'Không quan sát vượt mức này thì kết luận "Không xác định"', unit: '% thời lượng', value: 20, overrides: [], hint: 'Cần GV xác nhận; nếu cả lớp bị ảnh hưởng thì tạo sự cố thiết bị.' },
  { key: 'confirm', label: 'Hạn GV xác nhận hoặc sửa kết quả tiết', unit: 'giờ', value: 48, overrides: [], hint: 'Hết hạn thì kết quả tạm thời được chốt.' },
  { key: 'appeal', label: 'Hạn SV khiếu nại sau khi chốt', unit: 'ngày', value: 7, overrides: [], hint: 'Chỉ đẩy về EMS sau khi hết hạn khiếu nại.' },
  { key: 'leaveCounts', label: 'Vắng có phép có tính vào ngưỡng vắng học phần', unit: '', value: 'Không', overrides: [], hint: 'Chờ Phòng Đào tạo chốt theo quy chế của trường.' },
  { key: 'altMethod', label: 'Phương thức thay thế cho SV không dùng Face ID', unit: '', value: 'QR động', overrides: [['SV khuyết tật / không dùng điện thoại', 'GV điểm danh tay']], hint: 'Mã QR đổi mỗi 20 giây trên màn chiếu, kèm BLE để chống gửi mã cho bạn. Không cần lý do vì sao không dùng Face ID.' },
  { key: 'altCheck', label: 'Số lần kiểm tra QR ngẫu nhiên giữa giờ (nhóm dùng phương thức thay thế)', unit: 'lần / ca', value: 1, overrides: [], hint: 'Để kết quả hai nhóm so sánh được: nhóm Face ID được theo dõi cả tiết. Bỏ lỡ một lần kiểm tra → Không xác định, GV xác nhận.' },
  { key: 'unmatched', label: 'Khuôn mặt không khớp ai trong danh sách lớp', unit: '', value: 'Loại bỏ ngay tại thiết bị', overrides: [], hint: 'Không lưu ảnh, không lưu vector, không tìm trên toàn trường; chỉ đếm số lượng để so với số SV đã quét QR.' },
  { key: 'warnAbsent', label: 'Cảnh báo sớm khi số tiết vắng của học phần đạt', unit: '%', value: '10 và 15', overrides: [], hint: 'Ngưỡng cấm thi do trường quy định và ban hành trên EMS. SACIP không tự cấm thi.' },
];
export const BREAKS = 'Giải lao 10 phút giữa tiết 2 và tiết 3 của mỗi ca, lấy từ khung tiết của trường.';

/** Trạng thái trên timeline có mặt. */
export const SPAN = {
  present: ['bg-status-active', 'Thấy trong phòng'],
  out: ['bg-status-rejected', 'Rời lớp'],
  unknown: ['stripe-unknown', 'Không quan sát được'],
  leave: ['bg-status-inactive/50', 'Có phép'],
};
export const VERDICT = {
  'Có mặt': 'status-active', 'Đúng giờ': 'status-active', 'Đi muộn': 'status-pending', 'Vắng giữa giờ': 'status-rejected',
  'Vắng': 'status-rejected', 'Có phép': 'neutral', 'Không xác định': 'status-inactive',
};

/** Buổi học mẫu cho khung Chi tiết tiết. Mốc tính bằng phút kể từ đầu ca 07:00. */
export const SESSION_DETAIL = {
  room: 'C302', course: 'Cấu trúc dữ liệu', cls: 'K17-CNTT-02', lecturer: 'ThS. Phạm Thu Trang', start: 7 * 60, minutes: 145,
  breaks: [[100, 110]], grace: 15, stage: 'provisional', doorCam: false, confirmDue: 'còn 41 giờ',
  // Sĩ số và nhóm không dùng Face ID. unmatched: số vệt khuôn mặt không khớp ai trong danh sách lớp (đã loại bỏ, chỉ đếm).
  roster: 60, faceId: 55, alt: 5, altCheckedIn: 5, unmatched: 6, randomCheck: 58,
  people: [
    { id: 'GV-2021-204', name: 'ThS. Phạm Thu Trang', teacher: true, spans: [[2, 145, 'present']], verdict: 'Đúng giờ', note: 'Vào lúc 07:02, kết thúc 09:25' },
    { id: 'SV-2023-8891', name: 'Nguyễn Hoàng Nam', spans: [[3, 145, 'present']], verdict: 'Có mặt', pct: 100, leaves: 0 },
    { id: 'SV-2023-6612', name: 'Bùi Thanh Tùng', spans: [[4, 52, 'present'], [52, 64, 'out'], [64, 145, 'present']], verdict: 'Có mặt', pct: 91, leaves: 1, longest: 12, note: 'Rời 12 phút (07:52–08:04), dưới ngưỡng 1/3 tiết' },
    { id: 'SV-2023-5521', name: 'Trịnh Bảo Ngọc', spans: [[22, 145, 'present']], verdict: 'Đi muộn', pct: 85, leaves: 0, note: 'Vào lúc 07:22, muộn 7 phút sau ân hạn' },
    { id: 'SV-2024-0417', name: 'Phạm Minh Khang', spans: [[5, 40, 'present'], [40, 145, 'out']], verdict: 'Vắng giữa giờ', pct: 26, leaves: 1, longest: 95, note: 'Ghế trống từ 07:40 đến hết ca. Suy đoán: phòng chưa có camera cửa' },
    { id: 'SV-2024-0533', name: 'Lê Thị Hồng', spans: [[0, 30, 'leave'], [30, 145, 'present']], verdict: 'Có phép', pct: 100, leaves: 0, note: 'Đơn xin đến muộn REQ-8851 đã duyệt' },
    { id: 'SV-2024-0612', name: 'Vũ Đức Anh', spans: [[6, 60, 'present'], [60, 100, 'unknown'], [110, 145, 'present']], verdict: 'Không xác định', pct: null, leaves: 0, note: 'Không quan sát được 40 phút (bị che khuất). Chờ GV xác nhận' },
    { id: 'SV-2024-0788', name: 'Hoàng Gia Bảo', spans: [], verdict: 'Vắng', pct: 0, leaves: 0, note: 'Không thấy trong cả ca' },
    { id: 'SV-2024-0901', name: 'Ngô Thanh Mai', method: 'qr', spans: [], checks: [4, 58], verdict: 'Có mặt', pct: null, leaves: null, note: 'Quét QR lúc 07:04 và có mặt ở lần kiểm tra ngẫu nhiên 07:58' },
    { id: 'SV-2024-0915', name: 'Đinh Quốc Việt', method: 'qr', spans: [], checks: [19, 58], verdict: 'Đi muộn', pct: null, leaves: null, note: 'Quét QR lúc 07:19, muộn 4 phút sau ân hạn' },
    { id: 'SV-2024-0937', name: 'Trần Khánh Linh', method: 'qr', spans: [], checks: [6], verdict: 'Không xác định', pct: null, leaves: null, note: 'Quét QR lúc 07:06, không quét ở lần kiểm tra ngẫu nhiên. GV xác nhận, không tự tính vắng' },
  ],
};

/** Báo cáo hiện diện theo khoa (mẫu, học kỳ 1 năm 2026–2027, đến 06/11/2026). Sắp từ thấp đến cao. */
export const PRESENCE_BY_UNIT = [
  { unit: 'Khoa Ngoại ngữ', sessions: 1840, present: 88.1, late: 6.2, midAbsent: 3.4, unknown: 2.9, atRisk: 41 },
  { unit: 'Khoa Luật', sessions: 1260, present: 90.4, late: 4.8, midAbsent: 2.6, unknown: 1.8, atRisk: 18 },
  { unit: 'Khoa Kinh tế & QTKD', sessions: 3120, present: 91.2, late: 5.1, midAbsent: 2.2, unknown: 2.1, atRisk: 37 },
  { unit: 'Viện Đào tạo Quốc tế', sessions: 1010, present: 92.6, late: 3.9, midAbsent: 1.8, unknown: 1.5, atRisk: 9 },
  { unit: 'Khoa Điện - Điện tử', sessions: 1880, present: 93.0, late: 3.6, midAbsent: 1.9, unknown: 3.8, atRisk: 14 },
  { unit: 'Khoa Công nghệ Thông tin', sessions: 3960, present: 93.8, late: 3.2, midAbsent: 1.7, unknown: 2.4, atRisk: 26 },
];
export const AT_RISK = [
  { id: 'SV-2024-0788', name: 'Hoàng Gia Bảo', cls: 'K18-CNTT-02', course: 'Cấu trúc dữ liệu', absent: 7, total: 45, advisor: 'ThS. Phạm Thu Trang' },
  { id: 'SV-2024-9912', name: 'Trương Gia Huy', cls: 'K18-NN-01', course: 'Ngữ âm học', absent: 6, total: 45, advisor: 'ThS. Đặng Lan Anh', note: 'Chưa xác nhận đồng ý, điểm danh bằng QR' },
  { id: 'SV-2023-1290', name: 'Đỗ Quang Minh', cls: 'K17-QTKD-B', course: 'Kinh tế vi mô', absent: 5, total: 45, advisor: 'TS. Ngô Văn Tài' },
];
export const TEACHING_EXCEPTIONS = [
  { lecturer: 'ThS. Lê Quang Huy', unit: 'Khoa CNTT', kind: 'Dạy thay chưa có đăng ký', session: 'Mạng máy tính • C302 • 06/11, tiết 4-6', status: ['status-pending', 'Chờ GV giải trình (còn 46 giờ)'] },
  { lecturer: 'ThS. Đỗ Minh Tâm', unit: 'Khoa CNTT', kind: 'Buổi không thấy GV, chưa có đơn nghỉ', session: 'Thực hành Java • C305 • 05/11, tiết 4-6', status: ['status-inactive', 'Không xác định: phòng chưa có camera'] },
  { lecturer: 'TS. Trần Thị Thu Thảo', unit: 'Khoa KT&QTKD', kind: 'Kết thúc sớm 25 phút', session: 'Kinh tế vi mô • C301 • 04/11, tiết 1-3', status: ['status-active', 'Đã giải trình: cho SV làm bài nhóm tại thư viện'] },
];

/** Khảo sát phòng cho điểm danh: tiêu chí duyệt hạ tầng (mặt ≥ 40 px ở ghế xa nhất) và camera cửa. */
export const ROOM_SURVEY = {
  C301: { seats: 60, ied: 31, doorCam: false, measured: '28/10/2026' },
  C302: { seats: 64, ied: 22, doorCam: false, measured: '28/10/2026', pilot: true },
  C305: { seats: 40, ied: null, doorCam: false, measured: null },
  C202: { seats: 30, ied: 48, doorCam: true, measured: '15/10/2026' },
  A501: { seats: null, ied: 96, doorCam: true, measured: '15/10/2026' },
};

/** Cách xử lý người không đồng ý Face ID (hiển thị ở Đồng ý & bảo mật và Lịch học). */
export const OPT_OUT_RULES = [
  ['Không có mẫu khuôn mặt', 'Không thu thập, không tạo vector. Hồ sơ gắn cờ "Dùng phương thức thay thế"; GV chỉ thấy cờ này, không thấy lý do.'],
  ['Gương mặt vẫn lọt vào camera thì bị loại bỏ ngay', 'Khuôn mặt không khớp ai trong danh sách lớp bị bỏ ngay tại thiết bị trong lớp: không lưu ảnh, không lưu vector, không tìm trên toàn trường, không cảnh báo "người lạ". Chỉ giữ một con số đếm.'],
  ['Không bị gán nhầm thành bạn cùng lớp', 'Chỉ gắn danh tính khi khớp 2 trong 3 lần và cách người giống thứ hai đủ xa. Mỗi danh tính chỉ ở một chỗ ngồi, nên một gương mặt lạ không thể làm một bạn vắng mặt thành "có mặt".'],
  ['Điểm danh bằng QR động trong cùng bảng kết quả', 'Mã đổi mỗi 20 giây, kèm BLE. Kết quả cùng 6 loại kết luận như nhóm Face ID; không bao giờ bị tính vắng chỉ vì không có Face ID.'],
  ['Kiểm tra ngẫu nhiên giữa giờ cho công bằng', 'Nhóm Face ID được theo dõi cả tiết, nên nhóm QR có một lần quét ngẫu nhiên giữa giờ. Bỏ lỡ thì "Không xác định", GV xác nhận.'],
  ['Phát hiện người ngoài danh sách mà không định danh ai', 'So số khuôn mặt không khớp với số SV đã quét QR. Dư ra thì báo GV "có thể có người ngoài danh sách", không định danh, không cảnh báo an ninh.'],
  ['Không gây bất lợi, không gây áp lực', 'Không xếp hạng, không ghi chú tiêu cực, không nhắc đồng ý quá 1 lần mỗi học kỳ. Có thể đồng ý lại hoặc rút đồng ý bất kỳ lúc nào trên App MyDaiNam.'],
];
