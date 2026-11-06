// Hồ sơ định danh thật: POST /api/process/{id}/business-documents/search, business_type = user_face_verification.
// Đổi mỗi tài liệu sang đúng dạng hồ sơ mà trang Profiles đang dùng.

export const LIVE_PROFILES = import.meta.env.VITE_PROFILES_LIVE === '1';

const PAGE_LIMIT = 100;

export const NO_DATA = 'Chưa có dữ liệu';

export const SUBJECT_TYPE_OF = { teacher: 'STAFF', student: 'STUDENT' };

export const DOCUMENT_STATUS = {
  pending: { label: 'Chờ duyệt', color: 'status-pending' },
  approved: { label: 'Đã duyệt', color: 'status-active' },
  rejected: { label: 'Đã từ chối', color: 'status-rejected' },
  resubmitted: { label: 'Đã gửi lại', color: 'status-pending' },
  verified: { label: 'Đã xác minh', color: 'status-active' },
};

/** Giá trị API thêm sau này chưa có trong enum thì hiện nguyên văn. */
export const documentStatusMeta = (status) => DOCUMENT_STATUS[status] || { label: status || 'Chưa có', color: 'status-inactive' };

/** Mỗi hướng chụp lấy ảnh có chất lượng cao nhất, giữ thứ tự chụp. */
const posesOf = (captures = []) => {
  const best = new Map();
  captures.forEach((c) => { if (!best.has(c.direction) || c.quality > best.get(c.direction).quality) best.set(c.direction, c); });
  return [...best.values()].map((c) => ({ name: c.direction, score: Math.round(c.quality * 100) }));
};

export const toSubject = (doc) => {
  const p = doc.payload_json || {};
  const v = p.verification;
  const subjectType = SUBJECT_TYPE_OF[p.user_type] || null;
  const identity = `Mã định danh: ${p.identity_code || NO_DATA}`;
  return {
    subject_id: doc.id,
    readonly: true,
    code: doc.business_code || NO_DATA,
    name: p.full_name || doc.display_name || NO_DATA,
    email: '',
    subject_type: subjectType,
    context_line: p.user_type && !subjectType ? `${identity} • Loại gốc: ${p.user_type}` : identity,
    context: {},
    org_unit: null,
    source: null,
    poses: posesOf(v?.captures),
    ai_score: v?.identity_score != null ? Math.round(v.identity_score * 100) : null,
    ai_hint: null,
    consent_version: null,
    valid_until: null,
    risk_flags: [],
    rescan_grant: null,
    bssid_metadata: null,
    history: p.history_changes || [],
    status: doc.status,
    // Hồ sơ thật chỉ có status; năm trạng thái riêng chỉ có trong dữ liệu giả lập.
    states: {},
  };
};

// Giữ kết quả gần nhất để quay lại trang không bị trống trong lúc làm mới ngầm.
let last = { rows: [], total: 0 };
export const lastFaceDocuments = () => last;

export async function searchFaceDocuments() {
  const res = await fetch('/sacip-api/face-documents/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ page: 1, limit: PAGE_LIMIT, business_type: 'user_face_verification', sort: { field: 'modified_date', direction: 'DESC' } }),
  });
  const body = await res.json().catch(() => null);
  // Token sai hoặc hết hạn có thể về 400 chứ không chỉ 401, nên luôn kèm thông điệp của API và gợi ý kiểm tra khóa.
  if (!res.ok || !body?.success) throw new Error(`${body?.error_message || `API trả về lỗi ${res.status}.`} Nếu token đã hết hạn, cập nhật .env.local rồi khởi động lại npm run dev.`);
  last = { rows: body.data.items.map(toSubject), total: body.data.total_items };
  return last;
}
