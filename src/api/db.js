// Dữ liệu giả lập phía "máy chủ". Mọi trang đọc/ghi qua src/api/client.js, không import trực tiếp file này.
// Không dùng ảnh thật hay dữ liệu cá nhân thật. Thời điểm được tính tương đối so với lúc mở trang
// để thời hạn xử lý, thời hạn chụp lại và link xem ảnh luôn khớp nhau.

const H = 3600 * 1000;
const D = 24 * H;
const now = Date.now();
const ago = (ms) => new Date(now - ms).toISOString();
const ahead = (ms) => new Date(now + ms).toISOString();

export const TENANT = 'Đại học Đại Nam';

/** Cây tổ chức (Org Unit Tree) cho bước 1 của wizard chính sách. */
export const ORG_TREE = [
  { id: 'ALL', name: 'Toàn trường', children: [
    { id: 'FAC', name: 'Các khoa, viện', children: [
      { id: 'CNTT', name: 'Khoa Công nghệ Thông tin' },
      { id: 'KT', name: 'Khoa Kinh tế & QTKD' },
      { id: 'DDT', name: 'Khoa Điện - Điện tử' },
      { id: 'NN', name: 'Khoa Ngoại ngữ' },
      { id: 'LUAT', name: 'Khoa Luật' },
      { id: 'VDTQT', name: 'Viện Đào tạo Quốc tế' },
    ]},
    { id: 'ADM', name: 'Các phòng, ban', children: [
      { id: 'PDT', name: 'Phòng Đào tạo' },
      { id: 'HCQT', name: 'Phòng Hành chính - Quản trị' },
      { id: 'HTQT', name: 'Phòng Hợp tác Quốc tế' },
    ]},
    { id: 'KTX', name: 'Ban Quản lý KTX' },
    { id: 'OUT', name: 'Đơn vị thuê ngoài', children: [
      { id: 'OUT_CANTEEN', name: 'Căng tin (Vending Partner)' },
      { id: 'OUT_GUARD', name: 'Bảo vệ (An Phát)' },
    ]},
  ]},
];

const pose = (name, score) => ({ name, score });
const POSES_6 = ['Trực diện', 'Chúc 15°', 'Ngửa 15°', 'Nghiêng trái 20°', 'Nghiêng phải 20°', 'Đỉnh đầu'];
const posesFrom = (base, n = 6) => POSES_6.slice(0, n).map((p, i) => pose(p, Math.min(99, base + [0, 3, 5, 2, -1, 4][i])));

const bssid = (ap, room, minutes, rssi = -58) => ({ bssid: ap.bssid, ap_name: ap.name, rssi, beacon: room.beacon || null, location: room.name, seen_at: ago(minutes * 60 * 1000) });
const AP = { C3: { bssid: '20:4C:03:AA:91:C0', name: 'AP_C3_01' }, A1: { bssid: '20:4C:03:AA:10:12', name: 'AP_A1_02' }, KTX: { bssid: '20:4C:03:BB:04:21', name: 'AP_KTXB_04' } };

/**
 * subjects: bảng Master Table duy nhất cho mọi loại đối tượng.
 * Năm chiều trạng thái nằm trong states, không có cột status gộp.
 */
export const SUBJECTS = [
  { subject_id: 'sub_7f3a01', code: 'SV-2023-8891', name: 'Nguyễn Hoàng Nam', email: 'nam.nh23@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'CNTT', context: { cohort: 'K2023', class: 'K17-CNTT-02' },
    source: 'APP', face_profile_id: 'fp_8891_v2', ai_score: 98, poses: posesFrom(95), valid_until: '30/06/2027',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.C3, { name: 'Phòng học C302', beacon: 'BCN-C302' }, 42), seed: 1 },
  { subject_id: 'sub_7f3a02', code: 'SV-2024-1102', name: 'Lê Minh Khôi', email: 'khoi.lm24@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'KT', context: { cohort: 'K2024', class: 'K66-QTKD-A' },
    source: 'APP', face_profile_id: 'fp_1102_v2', ai_score: 64, poses: [pose('Trực diện', 64), pose('Chúc 15°', 88), pose('Ngửa 15°', 92), pose('Nghiêng trái 20°', 85), pose('Nghiêng phải 20°', 81), pose('Đỉnh đầu', 90)], valid_until: null,
    states: { collection: 'QUALITY_FAILED', validity: 'PENDING_ACTIVATION', request: 'OPEN', risk: 'WATCH', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: ['Vùng trán bị chói 38%', 'Đầu nghiêng 22°'],
    ai_hint: 'Ảnh trực diện bị chói vùng trán 38% và đầu nghiêng 22°. Khuyến nghị cho chụp lại trên App MyDaiNam.',
    bssid_metadata: bssid(AP.C3, { name: 'Phòng học C301' }, 95, -71), seed: 2 },
  { subject_id: 'sub_7f3a03', code: 'GV-2018-042', name: 'TS. Trần Thị Thu Thảo', email: 'thao.ttt@dnu.edu.vn', subject_type: 'STAFF', org_unit: 'VDTQT', context: { role_title: 'Giảng viên', position: 'Phó Viện trưởng' },
    source: 'COUNTER', face_profile_id: 'fp_0042_v1', ai_score: 93, poses: posesFrom(90), valid_until: null,
    states: { collection: 'COMPLETED', validity: 'PENDING_ACTIVATION', request: 'OPEN', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: null, seed: 3 },
  { subject_id: 'sub_7f3a04', code: 'KTX-2023-441', name: 'Phạm Quốc Bảo', email: 'bao.pq@student.dnu.edu.vn', subject_type: 'RESIDENT', org_unit: 'KTX', context: { building: 'KTX Tòa B', room: 'P.402', stay_until: '19/11/2026' },
    source: 'CARD_DB', face_profile_id: 'fp_k441_v1', ai_score: 91, poses: [pose('Ảnh thẻ', 91)], valid_until: '19/11/2026',
    states: { collection: 'COMPLETED', validity: 'EXPIRING', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.0', risk_flags: [],
    bssid_metadata: bssid(AP.KTX, { name: 'KTX Tòa B tầng 4' }, 600), seed: 4 },
  { subject_id: 'sub_7f3a05', code: 'NV-2022-019', name: 'Vũ Thị Mai Anh', email: 'maianh.vt@dnu.edu.vn', subject_type: 'STAFF', org_unit: 'HCQT', context: { role_title: 'Cán bộ', position: 'Chuyên viên' },
    source: 'COUNTER', face_profile_id: 'fp_n019_v1', ai_score: 89, poses: posesFrom(86), valid_until: '15/11/2026',
    states: { collection: 'COMPLETED', validity: 'EXPIRING', request: 'OPEN', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.A1, { name: 'Sảnh chính A' }, 30), seed: 5 },
  { subject_id: 'sub_7f3a06', code: 'EXT-2024-008', name: 'Đoàn Văn Hùng', email: 'hung.dv@vendingpartner.vn', subject_type: 'CONTRACTOR', org_unit: 'OUT_CANTEEN', context: { company: 'Công ty Vending Partner', contract_no: 'HĐDV-2024/118', contract_until: '30/11/2026' },
    source: 'COUNTER', face_profile_id: 'fp_e008_v1', ai_score: 48, poses: posesFrom(46), valid_until: null,
    states: { collection: 'COMPLETED', validity: 'LOCKED', request: 'OPEN', risk: 'HIGH', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: ['Nghi dùng ảnh in (kiểm tra người thật 42%)'],
    bssid_metadata: bssid(AP.A1, { name: 'Cổng chính Tòa A1' }, 300, -66), seed: 6 },
  { subject_id: 'sub_7f3a07', code: 'SV-2024-9912', name: 'Trương Gia Huy', email: 'giahuy.tg24@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'NN', context: { cohort: 'K2024', class: 'K18-NN-01' },
    source: null, face_profile_id: null, ai_score: null, poses: [], valid_until: null,
    states: { collection: 'NOT_STARTED', validity: 'NONE', request: 'NONE', risk: 'NONE', consent: 'PENDING' }, consent_version: null, risk_flags: [],
    bssid_metadata: null, seed: 7 },
  { subject_id: 'sub_7f3a08', code: 'SV-2023-5521', name: 'Trịnh Bảo Ngọc', email: 'ngoc.tb23@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'CNTT', context: { cohort: 'K2023', class: 'K17-CNTT-01' },
    source: 'APP', face_profile_id: 'fp_5521_v1', ai_score: 97, poses: posesFrom(95), valid_until: '30/06/2027',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.C3, { name: 'Phòng học C302', beacon: 'BCN-C302' }, 15), seed: 8 },
  { subject_id: 'sub_7f3a09', code: 'GV-2020-117', name: 'ThS. Nguyễn Văn An', email: 'an.nv@dnu.edu.vn', subject_type: 'STAFF', org_unit: 'KT', context: { role_title: 'Giảng viên', position: 'Cố vấn học tập K66' },
    source: 'CARD_DB', face_profile_id: 'fp_0117_v1', ai_score: 96, poses: [pose('Ảnh thẻ', 96)], valid_until: '31/12/2027',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.C3, { name: 'Phòng học C301' }, 120), seed: 9 },
  { subject_id: 'sub_7f3a10', code: 'SV-2022-3340', name: 'Đặng Thu Hà', email: 'ha.dt22@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'DDT', context: { cohort: 'K2022', class: 'K16-DDT-02' },
    source: 'APP', face_profile_id: 'fp_3340_v2', ai_score: 72, poses: posesFrom(70), valid_until: null,
    states: { collection: 'QUALITY_FAILED', validity: 'PENDING_ACTIVATION', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: null, seed: 10 },
  { subject_id: 'sub_7f3a11', code: 'SV-2023-4509', name: 'Hoàng Đỗ Gia Hân', email: 'han.hdg23@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'LUAT', context: { cohort: 'K2023', class: 'K17-LUAT-01' },
    source: 'APP', face_profile_id: 'fp_4509_v1', ai_score: 94, poses: posesFrom(92), valid_until: null,
    states: { collection: 'COMPLETED', validity: 'LOCKED', request: 'OPEN', risk: 'NONE', consent: 'WITHDRAWN' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: null, seed: 11 },
  { subject_id: 'sub_7f3a12', code: 'SV-2023-6612', name: 'Bùi Thanh Tùng', email: 'tung.bt23@student.dnu.edu.vn', subject_type: 'STUDENT', org_unit: 'CNTT', context: { cohort: 'K2023', class: 'K17-CNTT-02' },
    source: 'APP', face_profile_id: 'fp_6612_v1', ai_score: 91, poses: posesFrom(89), valid_until: '30/06/2027',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'OPEN', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.C3, { name: 'Phòng học C302', beacon: 'BCN-C302' }, 1440, -77), seed: 12 },
  { subject_id: 'sub_7f3a13', code: 'GST-2026-0311', name: 'Ngô Thị Lan', email: 'lan.nt@partner-univ.edu', subject_type: 'GUEST', org_unit: 'HTQT', context: { host: 'Phòng Hợp tác Quốc tế', visit_until: '06/11/2026', purpose: 'Hội thảo trao đổi học thuật' },
    source: 'COUNTER', face_profile_id: 'fp_g311_v1', ai_score: 90, poses: posesFrom(88, 3), valid_until: '06/11/2026',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: bssid(AP.A1, { name: 'Hội trường A1' }, 60), seed: 13 },
  { subject_id: 'sub_7f3a14', code: 'EXT-2025-031', name: 'Lý Văn Phúc', email: 'phuc.lv@anphat-security.vn', subject_type: 'CONTRACTOR', org_unit: 'OUT_GUARD', context: { company: 'Công ty Bảo vệ An Phát', contract_no: 'HĐBV-2025/031', contract_until: '13/11/2026' },
    source: 'COUNTER', face_profile_id: 'fp_e031_v1', ai_score: 92, poses: posesFrom(90), valid_until: '13/11/2026',
    states: { collection: 'COMPLETED', validity: 'EXPIRING', request: 'NONE', risk: 'WATCH', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: ['Hợp đồng còn 9 ngày, chưa có phụ lục gia hạn'],
    bssid_metadata: bssid(AP.A1, { name: 'Cổng chính Tòa A1' }, 10), seed: 14 },
  { subject_id: 'sub_7f3a15', code: 'KTX-2024-118', name: 'Mai Quỳnh Như', email: 'nhu.mq24@student.dnu.edu.vn', subject_type: 'RESIDENT', org_unit: 'KTX', context: { building: 'KTX Tòa A', room: 'P.215', stay_until: '30/06/2027' },
    source: 'APP', face_profile_id: null, ai_score: null, poses: posesFrom(90, 3), valid_until: null,
    states: { collection: 'IN_PROGRESS', validity: 'NONE', request: 'NONE', risk: 'NONE', consent: 'ACTIVE' }, consent_version: 'v1.2', risk_flags: [],
    bssid_metadata: null, seed: 15 },
  { subject_id: 'sub_7f3a16', code: 'NV-2019-007', name: 'Phan Đức Long', email: 'long.pd@dnu.edu.vn', subject_type: 'STAFF', org_unit: 'PDT', context: { role_title: 'Cán bộ', position: 'Chuyên viên khảo thí' },
    source: 'CARD_DB', face_profile_id: 'fp_n007_v1', ai_score: 94, poses: [pose('Ảnh thẻ', 94)], valid_until: '31/12/2026',
    states: { collection: 'COMPLETED', validity: 'ACTIVE', request: 'NONE', risk: 'NONE', consent: 'PENDING' }, consent_version: 'v1.0', risk_flags: [],
    bssid_metadata: null, seed: 16 },
];

/** Yêu cầu: request_id dạng REQ-xxxx. approvals là chuỗi duyệt chụp lại từ policy tại thời điểm tạo. */
const chain = (...steps) => steps.map(([role, label, by, at, note]) => ({ role, label, decision: by ? 'APPROVED' : null, approver_id: by || null, approved_at: at || null, note: note || null }));

export const REQUESTS = [
  { request_id: 'REQ-8842', request_type: 'RESCAN', subject_id: 'sub_7f3a02', status: 'pending', submitted_at: ago(2 * H), sla_due: ahead(3.75 * H), priority: 'HIGH', channel: 'APP',
    reason_submitted: 'Em chụp trên App sáng nay nhưng hệ thống báo ảnh chói trán và đầu nghiêng 22 độ, camera lớp học và cửa phòng thi không nhận ra em. Em xin được chụp lại.',
    policy_ref: { policy_id: 'POL-STU', version: 'v1.3' }, ai: { quality: 64, match: 94.2, liveness: 99.4, confidence: 98.6 },
    approvals: chain(['ADVISOR', 'GVCN / Cố vấn học tập', 'ThS. Nguyễn Văn An', ago(1.2 * H), 'Xác nhận sinh viên cần ảnh chuẩn để điểm danh thi.'], ['REGISTRAR', 'Phòng Đào tạo']),
    approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8841', request_type: 'NEW_REGISTRATION', subject_id: 'sub_7f3a03', status: 'pending', submitted_at: ago(3 * H), sla_due: ahead(18 * H), priority: 'NORMAL', channel: 'COUNTER',
    reason_submitted: 'Đăng ký Face ID để vào giảng đường thông minh và Phòng thí nghiệm C202.',
    policy_ref: { policy_id: 'POL-STF', version: 'v1.1' }, ai: { quality: 93, match: 99.1, liveness: 99.8, confidence: 97.2 },
    auto_note: 'Chính sách cán bộ, giảng viên không bật AI tự duyệt nên cần người duyệt.',
    approvals: chain(['UNIT_HEAD', 'Trưởng đơn vị']), approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8839', request_type: 'REVOKE', subject_id: 'sub_7f3a06', status: 'pending', submitted_at: ago(4 * H), sla_due: ahead(1.25 * H), priority: 'URGENT', channel: 'ADMIN',
    reason_submitted: 'Thu hồi toàn bộ quyền ra vào khu căng tin và tòa thí nghiệm: hợp đồng kết thúc sớm, hệ thống cảnh báo nghi dùng ảnh in.',
    policy_ref: { policy_id: 'POL-CTR', version: 'v1.0' }, ai: { quality: 48, match: 71.3, liveness: 42.0, confidence: 88.0 },
    two_person: true, first_confirm: null,
    approvals: chain(['CONTRACT_OWNER', 'Đơn vị quản lý hợp đồng', 'Trần Văn Đức', ago(3 * H), 'Đã thông báo nhà thầu kết thúc hợp đồng.'], ['HCQT', 'Phòng Hành chính - Quản trị (2 người)']),
    approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8836', request_type: 'WITHDRAW_CONSENT', subject_id: 'sub_7f3a11', status: 'pending', submitted_at: ago(5 * H), sla_due: ahead(67 * H), priority: 'LEGAL', channel: 'APP',
    reason_submitted: 'Em thực hiện quyền rút lại sự đồng ý cho Nhà trường lưu trữ và nhận diện dữ liệu khuôn mặt. Em đề nghị dùng thẻ sinh viên RFID để điểm danh và ra vào.',
    policy_ref: { policy_id: 'POL-STU', version: 'v1.3' }, approvals: chain(['DPO', 'Cán bộ bảo vệ dữ liệu']),
    approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8830', request_type: 'EXTEND', subject_id: 'sub_7f3a05', status: 'pending', submitted_at: ago(26 * H), sla_due: ahead(36 * H), priority: 'LOW', channel: 'APP',
    reason_submitted: 'Đề nghị gia hạn quyền ra vào khu hành chính đến hết năm 2027. Đã có quyết định gia hạn hợp đồng lao động đính kèm.',
    policy_ref: { policy_id: 'POL-STF', version: 'v1.1' }, ai: { quality: 89, match: 96.0, liveness: 99.0, confidence: 93.0 },
    approvals: chain(['UNIT_HEAD', 'Trưởng đơn vị']), approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8828', request_type: 'RESCAN', subject_id: 'sub_7f3a12', status: 'pending', submitted_at: ago(7 * H), sla_due: ahead(17 * H), priority: 'NORMAL', channel: 'APP',
    reason_submitted: 'Đổi kiểu tóc và đeo kính cận mới.',
    policy_ref: { policy_id: 'POL-STU', version: 'v1.3' }, ai: { quality: 91, match: 82.5, liveness: 99.6, confidence: 90.1 },
    approvals: chain(['ADVISOR', 'GVCN / Cố vấn học tập'], ['REGISTRAR', 'Phòng Đào tạo']), approver_id: null, approved_at: null, rejection_reason: null },
  { request_id: 'REQ-8821', request_type: 'NEW_REGISTRATION', subject_id: 'sub_7f3a08', status: 'completed', submitted_at: ago(50 * H), sla_due: null, priority: 'NORMAL', channel: 'APP',
    reason_submitted: 'Đăng ký Face ID để điểm danh lớp học phần.',
    policy_ref: { policy_id: 'POL-STU', version: 'v1.3' }, ai: { quality: 97, match: 98.4, liveness: 99.7, confidence: 97.4 },
    auto_approved: true, approvals: [], approver_id: 'AI-ENGINE', approved_at: ago(49.9 * H), rejection_reason: null },
  { request_id: 'REQ-8817', request_type: 'RESCAN', subject_id: 'sub_7f3a10', status: 'rejected', submitted_at: ago(30 * H), sla_due: null, priority: 'NORMAL', channel: 'APP',
    reason_submitted: 'Ảnh của em bị tối, em muốn chụp lại.',
    policy_ref: { policy_id: 'POL-STU', version: 'v1.3' }, ai: { quality: 72, match: 95.0, liveness: 99.1, confidence: 92.0 },
    approvals: chain(['ADVISOR', 'GVCN / Cố vấn học tập'], ['REGISTRAR', 'Phòng Đào tạo']),
    approver_id: 'Lê Hoàng Minh', approved_at: ago(26 * H), rejection_reason: 'Đã được chụp lại 2 lần trong học kỳ. Đề nghị đến quầy Phòng Đào tạo (Tòa A1, phòng 102) để chụp có hỗ trợ ánh sáng.' },
  { request_id: 'REQ-8810', request_type: 'RESCAN', subject_id: 'sub_7f3a01', status: 'cancelled', submitted_at: ago(72 * H), sla_due: null, priority: 'NORMAL', channel: 'APP',
    reason_submitted: 'Em lỡ gửi nhầm.', policy_ref: { policy_id: 'POL-STU', version: 'v1.2' },
    approvals: chain(['ADVISOR', 'GVCN / Cố vấn học tập'], ['REGISTRAR', 'Phòng Đào tạo']), approver_id: null, approved_at: null, rejection_reason: null },
];

const TRIGGERS = (opts = {}) => [
  { id: 'ACADEMIC_VERIFIED', target: 'ACADEMIC', event: 'COLLECTION_COMPLETED', transport: 'KAFKA', destination: 'faceid.profile.verified', enabled: opts.academic !== false, payload: ['student_code', 'face_profile_id', 'status: VERIFIED'] },
  { id: 'ACCESS_SYNC', target: 'ACCESS_CONTROL', event: 'VALIDITY_CHANGED', transport: 'WEBHOOK', destination: 'https://acs.dnu.edu.vn/api/faceid/templates', enabled: true, payload: ['subject_id', 'template (mã hóa)', 'zones', 'validity'] },
  { id: 'NOTIFY_RESCAN', target: 'NOTIFICATION', event: 'RESCAN_DECIDED', transport: 'KAFKA', destination: 'notify.push', enabled: true, payload: ['subject_id', 'decision', 'rejection_reason', 'rescan_expires_at'] },
  { id: 'NOTIFY_RISK', target: 'NOTIFICATION', event: 'RISK_FLAGGED', transport: 'KAFKA', destination: 'notify.push', enabled: true, payload: ['subject_id', 'risk_flags'] },
  { id: 'NOTIFY_CONTRACT', target: 'NOTIFICATION', event: 'CONTRACT_EXPIRING', transport: 'WEBHOOK', destination: 'https://notify.dnu.edu.vn/hooks/contract', enabled: opts.contract !== false, payload: ['subject_id', 'contract_no', 'contract_until'] },
];

/** Cấu hình rules_config (JSONB) của từng chính sách. */
const STU_V13 = {
  scope: { tenant: TENANT, org_units: ['ALL'], subject_types: ['STUDENT'] },
  spatial: { zones: ['A100', 'C301', 'C302', 'C202'], time_window: { preset: 'TIMETABLE', days: [1, 2, 3, 4, 5, 6], from: '06:30', to: '21:30' } },
  biometric: { accepted_sources: ['APP', 'CARD_DB', 'COUNTER'], pose_count: 6, min_quality: 85, ai_auto_approve_enabled: true, ai_auto_approve_threshold: 95, rescan_validity_hours: 48, rescan_max_uses: 1, rescan_channels: ['APP'] },
  workflow: { approval_chain: [{ id: 's1', role: 'ADVISOR', label: 'GVCN / Cố vấn học tập' }, { id: 's2', role: 'REGISTRAR', label: 'Phòng Đào tạo' }], revoke_two_person: true, retention_days_after_withdraw: 30 },
  triggers: TRIGGERS({ contract: false }),
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const withPatch = (base, fn) => { const c = clone(base); fn(c); return c; };

const STU_V10 = withPatch(STU_V13, (c) => { c.biometric = { ...c.biometric, accepted_sources: ['APP', 'CARD_DB'], pose_count: 3, ai_auto_approve_enabled: false, rescan_validity_hours: 72 }; c.workflow.approval_chain = [{ id: 's2', role: 'REGISTRAR', label: 'Phòng Đào tạo' }]; });
const STU_V11 = withPatch(STU_V10, (c) => { c.biometric.pose_count = 6; c.biometric.accepted_sources = ['APP', 'CARD_DB', 'COUNTER']; c.workflow.approval_chain = STU_V13.workflow.approval_chain; });
const STU_V12 = withPatch(STU_V11, (c) => { c.biometric.ai_auto_approve_enabled = true; c.biometric.ai_auto_approve_threshold = 97; });

const STF_V11 = {
  scope: { tenant: TENANT, org_units: ['FAC', 'ADM'], subject_types: ['STAFF'] },
  spatial: { zones: ['A100', 'A102', 'C202', 'C301', 'C302'], time_window: { preset: 'OFFICE', days: [1, 2, 3, 4, 5], from: '07:00', to: '17:30' } },
  biometric: { accepted_sources: ['CARD_DB', 'COUNTER', 'APP'], pose_count: 6, min_quality: 85, ai_auto_approve_enabled: false, ai_auto_approve_threshold: 95, rescan_validity_hours: 72, rescan_max_uses: 1, rescan_channels: ['APP', 'KIOSK'] },
  workflow: { approval_chain: [{ id: 's1', role: 'UNIT_HEAD', label: 'Trưởng đơn vị' }], revoke_two_person: true, retention_days_after_withdraw: 30 },
  triggers: TRIGGERS({ academic: false, contract: false }),
};
const CTR_V10 = {
  scope: { tenant: TENANT, org_units: ['OUT'], subject_types: ['CONTRACTOR'] },
  spatial: { zones: ['A100'], time_window: { preset: 'SHIFT', days: [1, 2, 3, 4, 5, 6, 7], from: '05:30', to: '22:00' } },
  biometric: { accepted_sources: ['COUNTER'], pose_count: 6, min_quality: 88, ai_auto_approve_enabled: false, ai_auto_approve_threshold: 97, rescan_validity_hours: 24, rescan_max_uses: 1, rescan_channels: ['KIOSK'] },
  workflow: { approval_chain: [{ id: 's1', role: 'CONTRACT_OWNER', label: 'Đơn vị quản lý hợp đồng' }, { id: 's2', role: 'HCQT', label: 'Phòng Hành chính - Quản trị' }], revoke_two_person: true, retention_days_after_withdraw: 7 },
  triggers: TRIGGERS({ academic: false }),
};
const RES_V10 = {
  scope: { tenant: TENANT, org_units: ['KTX'], subject_types: ['RESIDENT'] },
  spatial: { zones: ['K400'], time_window: { preset: 'ALWAYS', days: [1, 2, 3, 4, 5, 6, 7], from: '00:00', to: '23:59' } },
  biometric: { accepted_sources: ['APP', 'CARD_DB', 'COUNTER'], pose_count: 6, min_quality: 85, ai_auto_approve_enabled: true, ai_auto_approve_threshold: 96, rescan_validity_hours: 48, rescan_max_uses: 1, rescan_channels: ['APP', 'KIOSK'] },
  workflow: { approval_chain: [{ id: 's1', role: 'DORM', label: 'Ban Quản lý KTX' }], revoke_two_person: false, retention_days_after_withdraw: 30 },
  triggers: TRIGGERS({ academic: false, contract: false }),
};
const GST_V10 = {
  scope: { tenant: TENANT, org_units: ['HTQT'], subject_types: ['GUEST'] },
  spatial: { zones: ['A100'], time_window: { preset: 'CUSTOM', days: [1, 2, 3, 4, 5], from: '07:30', to: '18:00' } },
  biometric: { accepted_sources: ['COUNTER'], pose_count: 3, min_quality: 80, ai_auto_approve_enabled: false, ai_auto_approve_threshold: 95, rescan_validity_hours: 4, rescan_max_uses: 1, rescan_channels: ['KIOSK'] },
  workflow: { approval_chain: [{ id: 's1', role: 'HOST', label: 'Đơn vị bảo lãnh' }], revoke_two_person: false, retention_days_after_withdraw: 1 },
  triggers: TRIGGERS({ academic: false, contract: false }),
};

const ver = (version, config, saved_by, daysAgo, reason) => ({ version, config: clone(config), saved_by, saved_at: ago(daysAgo * D), reason });

/** BiometricPolicies: mỗi lần lưu sinh một phiên bản mới, không ghi đè. */
export const POLICIES = [
  { policy_id: 'POL-STU', name: 'Sinh viên chính quy', target_subject_type: 'STUDENT', current_version: 'v1.3', versions: [
    ver('v1.0', STU_V10, 'Phan Đức Long', 420, 'Khởi tạo chính sách đầu tiên khi triển khai Face ID cho sinh viên.'),
    ver('v1.1', STU_V11, 'Phan Đức Long', 300, 'Tăng lên 6 tư thế theo khuyến nghị của nhóm AI; thêm nguồn đăng ký tại quầy; thêm bước GVCN duyệt.'),
    ver('v1.2', STU_V12, 'Lê Hoàng Minh', 120, 'Bật AI tự duyệt với ngưỡng 97% sau 3 tháng chạy thử.'),
    ver('v1.3', STU_V13, 'Lê Hoàng Minh', 21, 'Hạ ngưỡng AI tự duyệt xuống 95% và rút thời hạn chụp lại còn 48 giờ theo biên bản họp Phòng Đào tạo ngày 10/10.'),
  ]},
  { policy_id: 'POL-STF', name: 'Cán bộ, giảng viên', target_subject_type: 'STAFF', current_version: 'v1.1', versions: [
    ver('v1.0', withPatch(STF_V11, (c) => { c.biometric.accepted_sources = ['CARD_DB']; }), 'Phan Đức Long', 400, 'Khởi tạo, dùng ảnh thẻ có sẵn từ hệ thống nhân sự.'),
    ver('v1.1', STF_V11, 'Phan Đức Long', 90, 'Cho phép đăng ký tại quầy và qua App; thêm thời hạn chụp lại 72 giờ.'),
  ]},
  { policy_id: 'POL-CTR', name: 'Nhân viên nhà thầu', target_subject_type: 'CONTRACTOR', current_version: 'v1.0', versions: [
    ver('v1.0', CTR_V10, 'Lê Hoàng Minh', 60, 'Chỉ chấp nhận đăng ký tại quầy có cán bộ đối chiếu giấy tờ; bật thông báo hợp đồng sắp hết hạn.'),
  ]},
  { policy_id: 'POL-RES', name: 'Cư dân KTX', target_subject_type: 'RESIDENT', current_version: 'v1.0', versions: [
    ver('v1.0', RES_V10, 'Phan Đức Long', 200, 'Khởi tạo chính sách ra vào KTX 24/7.'),
  ]},
  { policy_id: 'POL-GST', name: 'Khách vãng lai', target_subject_type: 'GUEST', current_version: 'v1.0', versions: [
    ver('v1.0', GST_V10, 'Lê Hoàng Minh', 45, 'Khách chỉ chụp 3 tư thế tại quầy, hiệu lực theo ngày bảo lãnh.'),
  ]},
];

/** Phiên bản điều khoản đồng ý (Consent Versioning). */
export const CONSENT_VERSIONS = [
  { version: 'v1.0', published_at: '01/09/2023', status: 'RETIRED', signed: 3120, summary: 'Điểm danh lớp học, ra vào cổng trường.', purposes: ['Điểm danh lớp học', 'Ra vào cổng trường'], retention: 'Đến khi thôi học' },
  { version: 'v1.1', published_at: '15/02/2024', status: 'RETIRED', signed: 610, summary: 'Bổ sung ra vào KTX và phòng thí nghiệm.', purposes: ['Điểm danh lớp học', 'Ra vào cổng trường', 'Ra vào KTX, phòng thí nghiệm'], retention: 'Đến khi thôi học' },
  { version: 'v1.2', published_at: '01/08/2025', status: 'ACTIVE', signed: 19840, summary: 'Bổ sung phát hành thẻ, ghi rõ thời hạn xóa 30 ngày sau khi rút đồng ý và quyền được lãng quên.', purposes: ['Điểm danh lớp học', 'Ra vào cổng, KTX, phòng thí nghiệm', 'Phát hành thẻ sinh viên'], retention: 'Xóa trong 30 ngày sau khi rút đồng ý hoặc thôi học' },
];

export const CONSENT_STATS = { total: 24850, active_current: 19840, active_old: 3730, pending: 1150, withdrawn: 130 };

/** Danh sách đã rút đồng ý để thực hiện quyền được lãng quên. */
export const ERASURES = [
  { subject_id: 'sub_7f3a11', code: 'SV-2023-4509', name: 'Hoàng Đỗ Gia Hân', requested_at: ago(5 * H), due_at: ahead(30 * D - 5 * H), status: 'PENDING_CONFIRM', steps: { lock: true, images: false, template: false, notice: false } },
  { subject_id: 'ext_a1', code: 'SV-2021-7720', name: 'Lâm Tuấn Kiệt', requested_at: ago(9 * D), due_at: ahead(21 * D), status: 'IN_PROGRESS', steps: { lock: true, images: true, template: false, notice: false } },
  { subject_id: 'ext_a2', code: 'NV-2017-044', name: 'Đinh Thị Hằng', requested_at: ago(40 * D), due_at: ago(10 * D), status: 'DONE', steps: { lock: true, images: true, template: true, notice: true } },
];

/** Nguồn dữ liệu đầu vào (Đặc tả Policy Engine §1). */
export const SOURCES = [
  { id: 'EMS', name: 'Hệ thống Đào tạo', provides: 'Sinh viên, lớp học phần, lịch học', method: 'Webhook + đồng bộ đêm', last_sync: ago(12 * 60 * 1000), records: 21480, status: 'OK', note: null },
  { id: 'HR', name: 'Hệ thống Nhân sự', provides: 'Cán bộ, giảng viên, chức danh', method: 'Đồng bộ định kỳ 2 giờ', last_sync: ago(70 * 60 * 1000), records: 1620, status: 'OK', note: null },
  { id: 'CONTRACTOR', name: 'Cổng Quản lý Nhà thầu', provides: 'Nhân viên nhà thầu, số và hạn hợp đồng', method: 'Webhook', last_sync: ago(3 * H), records: 214, status: 'WARN', note: '3 bản ghi thiếu ngày hết hạn hợp đồng nên chưa nhập.' },
  { id: 'DORM', name: 'Hệ thống KTX', provides: 'Cư dân, tòa, phòng, hạn lưu trú', method: 'Đồng bộ đêm', last_sync: ago(9 * H), records: 1200, status: 'OK', note: null },
  { id: 'TIMEKEEPING', name: 'Hệ thống Chấm công', provides: 'Ca làm việc của cán bộ và nhà thầu', method: 'Đồng bộ định kỳ 1 giờ', last_sync: ago(26 * H), records: 96, status: 'ERROR', note: 'Không kết nối được từ 26 giờ trước; chính sách dùng ca làm việc đang lấy dữ liệu cũ.' },
  { id: 'GIS', name: 'Danh mục không gian', provides: 'Tòa, tầng, phòng, cổng, khu vực', method: 'Khai báo trực tiếp trên Console', last_sync: ago(2 * D), records: 412, status: 'OK', note: null },
];

/** Sự kiện đã gửi sang hệ thống ngoài. */
export const INTEGRATION_EVENTS = [
  { event_id: 'EVT-55120', trigger_id: 'ACADEMIC_VERIFIED', target: 'ACADEMIC', transport: 'KAFKA', destination: 'faceid.profile.verified', at: ago(49.9 * H), status: 'DELIVERED', ref: 'REQ-8821', payload: { student_code: 'SV-2023-5521', face_profile_id: 'fp_5521_v1', status: 'VERIFIED' } },
  { event_id: 'EVT-55121', trigger_id: 'ACCESS_SYNC', target: 'ACCESS_CONTROL', transport: 'WEBHOOK', destination: 'https://acs.dnu.edu.vn/api/faceid/templates', at: ago(49.9 * H), status: 'DELIVERED', ref: 'SV-2023-5521', payload: { subject_id: 'sub_7f3a08', validity: 'ACTIVE', zones: ['A100', 'C301', 'C302', 'C202'], devices: 6 } },
  { event_id: 'EVT-55188', trigger_id: 'NOTIFY_RESCAN', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: ago(26 * H), status: 'DELIVERED', ref: 'REQ-8817', payload: { subject_id: 'sub_7f3a10', decision: 'REJECTED', rejection_reason: 'Đã được chụp lại 2 lần trong học kỳ…' } },
  { event_id: 'EVT-55201', trigger_id: 'ACCESS_SYNC', target: 'ACCESS_CONTROL', transport: 'WEBHOOK', destination: 'https://acs.dnu.edu.vn/api/faceid/templates', at: ago(5 * H), status: 'DELIVERED', ref: 'SV-2023-4509', payload: { subject_id: 'sub_7f3a11', validity: 'LOCKED', reason: 'WITHDRAW_CONSENT' } },
  { event_id: 'EVT-55209', trigger_id: 'NOTIFY_RISK', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: ago(4 * H), status: 'DELIVERED', ref: 'EXT-2024-008', payload: { subject_id: 'sub_7f3a06', risk_flags: ['Nghi dùng ảnh in'] } },
  { event_id: 'EVT-55214', trigger_id: 'NOTIFY_CONTRACT', target: 'NOTIFICATION', transport: 'WEBHOOK', destination: 'https://notify.dnu.edu.vn/hooks/contract', at: ago(2 * H), status: 'RETRYING', ref: 'EXT-2025-031', payload: { subject_id: 'sub_7f3a14', contract_no: 'HĐBV-2025/031', contract_until: '13/11/2026' }, error: 'Máy chủ thông báo trả lỗi HTTP 503, hệ thống đang tự thử lại.' },
];

/** Số liệu tổng hợp (máy chủ tính sẵn) cho Tổng quan và Kiểm toán. */
export const COVERAGE = {
  faculty: [
    { key: 'CNTT', name: 'Khoa Công nghệ Thông tin', total: 6400, collected: 6170, consent: 6210, children: [['K2022', 1480, 1462, 1470], ['K2023', 1620, 1588, 1601], ['K2024', 1650, 1590, 1612], ['K2025', 1650, 1530, 1527]] },
    { key: 'KT', name: 'Khoa Kinh tế & QTKD', total: 5200, collected: 4910, consent: 5020, children: [['K2022', 1250, 1230, 1238], ['K2023', 1300, 1262, 1281], ['K2024', 1320, 1240, 1270], ['K2025', 1330, 1178, 1231]] },
    { key: 'DDT', name: 'Khoa Điện - Điện tử', total: 3100, collected: 2880, consent: 2955, children: [['K2022', 760, 741, 748], ['K2023', 780, 750, 760], ['K2024', 790, 731, 744], ['K2025', 770, 658, 703]] },
    { key: 'NN', name: 'Khoa Ngoại ngữ', total: 2900, collected: 2540, consent: 2702, children: [['K2022', 700, 672, 690], ['K2023', 720, 668, 690], ['K2024', 740, 640, 676], ['K2025', 740, 560, 646]] },
    { key: 'LUAT', name: 'Khoa Luật', total: 2100, collected: 1980, consent: 2010, children: [['K2022', 510, 500, 502], ['K2023', 520, 500, 503], ['K2024', 530, 501, 505], ['K2025', 540, 479, 500]] },
    { key: 'VDTQT', name: 'Viện Đào tạo Quốc tế', total: 1830, collected: 1648, consent: 1700, children: [['K2022', 420, 410, 412], ['K2023', 450, 420, 430], ['K2024', 470, 420, 431], ['K2025', 490, 398, 427]] },
  ],
  cohort: [['K2022', 5120, 5015, 5060], ['K2023', 5390, 5188, 5265], ['K2024', 5500, 5122, 5238], ['K2025', 5520, 4803, 5034]],
  contractor: [['Căng tin (Vending Partner)', 48, 41, 46], ['Bảo vệ (An Phát)', 96, 93, 96], ['Vệ sinh (Sạch Xanh)', 70, 52, 61]],
  dorm: [['KTX Tòa A', 560, 540, 552], ['KTX Tòa B', 640, 590, 620]],
  staff: [['Giảng viên', 980, 950, 962], ['Cán bộ', 640, 598, 612]],
};

export const BACKLOG = { rescan_open: 37, rescan_oldest_hours: 52, over_sla: 4, new_registration_open: 128, auto_approved_7d: 1402, manual_approved_7d: 386 };

/** Cảnh báo lệch chuẩn và nghi gian lận thiết bị. Chỉ dựa trên điều kiện chụp, thiết bị, nhóm đối tượng; không dùng thuộc tính nhân khẩu học. */
export const ANOMALIES = [
  { id: 'AN-301', kind: 'BIAS', severity: 'HIGH', title: 'Tỷ lệ lỗi chất lượng ở Kiosk 03 cao gấp 2,4 lần các trạm khác', detail: '38% ảnh bị chói vùng trán trong 7 ngày; nghi đèn trần phản quang.', ref: 'KIOSK_03' },
  { id: 'AN-298', kind: 'BIAS', severity: 'MEDIUM', title: 'Người đeo kính bị AI chấm thấp hơn trung bình 9 điểm', detail: 'Ảnh hưởng tỷ lệ tự duyệt của nhóm này (61% so với 82%).', ref: 'AI-ENGINE v4.1' },
  { id: 'AN-295', kind: 'DEVICE_FRAUD', severity: 'HIGH', title: '14 lượt đăng ký từ cùng một điện thoại trong 1 giờ', detail: 'Cùng mã thiết bị App, 14 mã sinh viên khác nhau, 3 lượt không qua kiểm tra người thật.', ref: 'device:a91f…c07' },
  { id: 'AN-290', kind: 'DEVICE_FRAUD', severity: 'MEDIUM', title: 'Ảnh chụp lại từ màn hình tại cổng A1', detail: '2 lượt phát hiện vân moiré trong 24 giờ.', ref: 'TS_A100_01' },
];

export const AUDIT_METRICS = { original_views_7d: 46, original_views_prev_7d: 31, auto_approve_rate: 78.4, bias_alerts_open: 2 };

/** Nhật ký kiểm toán khởi tạo; client.js tính chuỗi băm khi nạp. */
export const AUDIT_SEED = [
  { at: ago(5 * H), actor_id: 'APP', actor_name: 'App MyDaiNam', action_code: 'CREATE_REQUEST', target_subject_id: 'SV-2023-4509', ip_address: '113.190.22.14', detail: 'REQ-8836: Rút đồng ý' },
  { at: ago(4 * H), actor_id: 'AI-ENGINE', actor_name: 'AI-ENGINE v4.1', action_code: 'SYSTEM_EVENT', target_subject_id: 'EXT-2024-008', ip_address: '10.20.0.31', detail: 'Kiểm tra người thật 42%: gắn cờ rủi ro cao' },
  { at: ago(3 * H), actor_id: 'NV-2015-002', actor_name: 'Trần Văn Đức', actor_role: 'CONTRACT_OWNER', action_code: 'APPROVE_STEP', target_subject_id: 'EXT-2024-008', ip_address: '10.10.20.44', detail: 'REQ-8839 bước 1: Đơn vị quản lý hợp đồng' },
  { at: ago(2 * H), actor_id: 'APP', actor_name: 'App MyDaiNam', action_code: 'CREATE_REQUEST', target_subject_id: 'SV-2024-1102', ip_address: '113.190.22.87', detail: 'REQ-8842: Chụp lại' },
  { at: ago(1.2 * H), actor_id: 'GV-2020-117', actor_name: 'ThS. Nguyễn Văn An', actor_role: 'ADVISOR', action_code: 'APPROVE_STEP', target_subject_id: 'SV-2024-1102', ip_address: '10.10.31.8', detail: 'REQ-8842 bước 1: GVCN / Cố vấn học tập' },
  { at: ago(50 * 60 * 1000), actor_id: 'NV-2010-015', actor_name: 'Lê Hoàng Minh', actor_role: 'AUDITOR', action_code: 'VIEW_ORIGINAL_IMAGE', target_subject_id: 'EXT-2024-008', ip_address: '10.10.20.15', detail: 'Lý do: đối chiếu nghi vấn ảnh in theo cảnh báo AN-290' },
];

export const NOTIFICATIONS = [
  { id: 1, color: 'status-rejected', title: 'Rút đồng ý Face ID', time: '5 giờ trước', body: 'Hoàng Đỗ Gia Hân (SV-2023-4509) yêu cầu xóa dữ liệu khuôn mặt.', unread: true, to: '/yeu-cau' },
  { id: 2, color: 'status-pending', title: 'Yêu cầu sắp quá hạn', time: '18 phút trước', body: 'REQ-8839 (Khóa, thu hồi) còn 1 giờ 15 phút để xử lý.', unread: true, to: '/yeu-cau' },
  { id: 3, color: 'status-rejected', title: 'Mất kết nối Hệ thống Chấm công', time: '26 giờ trước', body: 'Chính sách dùng ca làm việc đang lấy dữ liệu cũ.', unread: true, to: '/tich-hop' },
  { id: 4, color: 'status-rejected', title: 'Cảnh báo an ninh: khu vực hạn chế', time: '25 phút trước', body: 'Đối tượng lạ xuất hiện tại Phòng Server tầng 5 nhà A.', unread: true, alert: true, to: '/soc' },
];

export const CURRENT_USER = { id: 'NV-2010-015', name: 'Lê Hoàng Minh', ip: '10.10.20.15' };
