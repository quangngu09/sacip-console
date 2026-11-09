// API giả lập. Mỗi hàm async tương ứng một endpoint REST (ghi ở chú thích đầu hàm).
// Khi có backend: thay thân hàm bằng fetch() tới endpoint đó, giữ nguyên tên hàm và dạng dữ liệu trả về.
// Toàn bộ trạng thái nằm trong biến `db` của module này, giống một máy chủ chạy trong trình duyệt.

import * as seed from './db';
import { ROLES, canApproveStep, stepApproverText } from './enums';
import { validatePolicy, validateOwnership, diffConfig } from './policyValidation';
import { SPACE_TREE, DEVICES } from '../data/mock';
import { LOOKUPS, PERSON_JOURNEY } from '../data/movement';

const clone = (o) => JSON.parse(JSON.stringify(o));
const wait = (ms = 180 + Math.random() * 220) => new Promise((r) => setTimeout(r, ms));
const iso = () => new Date().toISOString();

export class ApiError extends Error {
  constructor(message, fields) { super(message); this.fields = fields || null; }
}

// ---------- Chuỗi băm cho nhật ký bất biến ----------
// Mô phỏng immutable_hash: mỗi bản ghi băm cùng bản ghi trước, sửa một dòng sẽ làm gãy cả chuỗi phía sau.
function cyrb53(str, seed2 = 0) {
  let h1 = 0xdeadbeef ^ seed2; let h2 = 0x41c6ce57 ^ seed2;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}
export const hash = (s) => cyrb53(s, 1) + cyrb53(s, 7);
const GENESIS = '0'.repeat(32);
const entryBody = (e) => JSON.stringify([e.log_id, e.timestamp, e.actor_id, e.action_code, e.target_subject_id, e.ip_address, e.detail]);

// ---------- Trạng thái máy chủ ----------
const db = {
  subjects: clone(seed.SUBJECTS),
  requests: clone(seed.REQUESTS),
  policies: clone(seed.POLICIES),
  consentVersions: clone(seed.CONSENT_VERSIONS),
  consentStats: clone(seed.CONSENT_STATS),
  erasures: clone(seed.ERASURES),
  sources: clone(seed.SOURCES),
  events: clone(seed.INTEGRATION_EVENTS),
  coverage: clone(seed.COVERAGE),
  backlog: clone(seed.BACKLOG),
  anomalies: clone(seed.ANOMALIES),
  incidents: clone(seed.INCIDENTS),
  attendanceCases: clone(seed.ATTENDANCE_CASES),
  auditMetrics: clone(seed.AUDIT_METRICS),
  notifications: clone(seed.NOTIFICATIONS),
  orgTree: clone(seed.ORG_TREE),
  spaces: clone(SPACE_TREE),
  hrPendingUnits: clone(seed.HR_PENDING_UNITS),
  jobs: clone(seed.JOBS),
  lookups: clone(LOOKUPS),
  audit: [],
};
let seq = { log: 90410, req: 8842, evt: 55214, lookup: 42 };

/** Người đang thao tác. Đổi vai trò ở thanh trên cùng tương đương đăng nhập bằng tài khoản khác. */
export const ACTORS = {
  ADMIN: { id: 'NV-2008-001', name: 'Nguyễn Quốc Trung', role: 'ADMIN', ip: '10.10.20.11' },
  AUDITOR: { id: 'NV-2010-015', name: 'Lê Hoàng Minh', role: 'AUDITOR', ip: '10.10.20.15' },
  REGISTRAR: { id: 'NV-2019-007', name: 'Phan Đức Long', role: 'REGISTRAR', ip: '10.10.31.22' },
  SECURITY: { id: 'NV-2016-033', name: 'Đỗ Minh Khang', role: 'SECURITY', ip: '10.10.50.4' },
};
let actor = ACTORS.REGISTRAR;
export const setActor = (role) => { actor = ACTORS[role]; };

function appendAudit({ action_code, target, detail, by = actor }) {
  const prev = db.audit[db.audit.length - 1];
  const e = {
    log_id: `LOG-${++seq.log}`, timestamp: iso(), actor_id: by.id, actor_name: by.name, actor_role: by.role || null,
    action_code, target_subject_id: target || null, ip_address: by.ip || '—', detail: detail || '', prev_hash: prev ? prev.immutable_hash : GENESIS,
  };
  e.immutable_hash = hash(e.prev_hash + entryBody(e));
  db.audit.push(e);
  return e;
}

// Nạp nhật ký mẫu theo đúng chuỗi băm.
[...seed.AUDIT_SEED,
  { at: seed.REQUESTS.find((r) => r.request_id === 'REQ-8821').approved_at, actor_id: 'AI-ENGINE', actor_name: 'AI-ENGINE v4.1', action_code: 'AUTO_APPROVE_FACE_ID', target_subject_id: 'SV-2023-5521', ip_address: '10.20.0.31', detail: 'REQ-8821: điểm 97,4% ≥ ngưỡng 95% (POL-STU v1.3)' },
].sort((a, b) => a.at.localeCompare(b.at)).forEach((s) => {
  const prev = db.audit[db.audit.length - 1];
  const e = { log_id: `LOG-${++seq.log}`, timestamp: s.at, actor_id: s.actor_id, actor_name: s.actor_name, actor_role: s.actor_role || null, action_code: s.action_code, target_subject_id: s.target_subject_id, ip_address: s.ip_address, detail: s.detail, prev_hash: prev ? prev.immutable_hash : GENESIS };
  e.immutable_hash = hash(e.prev_hash + entryBody(e));
  db.audit.push(e);
});

// ---------- Tra cứu nội bộ ----------
const subjectById = (id) => db.subjects.find((s) => s.subject_id === id);
const policyOf = (type) => db.policies.find((p) => p.target_subject_type === type);
const activeConfig = (p) => p.versions.find((v) => v.version === p.current_version).config;
export const policyFor = (type) => {
  const p = policyOf(type);
  return p ? { policy_id: p.policy_id, name: p.name, version: p.current_version, config: clone(activeConfig(p)) } : null;
};
const rooms = () => db.spaces.flatMap((b) => b.children.flatMap((f) => f.children));

function emit(type, triggerId, ref, payload) {
  const p = policyOf(type);
  const t = p && activeConfig(p).triggers.find((x) => x.id === triggerId);
  if (!t || !t.enabled) return null;
  const ev = { event_id: `EVT-${++seq.evt}`, trigger_id: t.id, target: t.target, transport: t.transport, destination: t.destination, at: iso(), status: 'DELIVERED', ref, payload };
  db.events.push(ev);
  return ev;
}

// Khóa mã hóa mẫu khuôn mặt do KMS quản lý, xoay vòng hằng tháng. Thiết bị chỉ giữ khóa giải mã, Console không thấy mẫu thô.
const TEMPLATE_KEY = 'kms://sacip/face-template/2026-11';
const FACE_DEVICE = /^(CAM|TS|EDGE)_/;

/**
 * Trigger B (Đặc tả Policy Engine §3): gửi mẫu khuôn mặt đã mã hóa xuống đúng thiết bị trong các khu vực của chính sách.
 * Hồ sơ hết hiệu lực thì gửi lệnh xóa mẫu khỏi thiết bị thay cho mẫu.
 */
function accessPayload(s) {
  const p = policyOf(s.subject_type);
  const zones = p ? activeConfig(p).spatial.zones : [];
  // Chỉ thiết bị nhận diện (camera AI, cổng xoay, máy xử lý biên) giữ mẫu; Wi-Fi AP, beacon, kiosk thì không.
  const devices = rooms().filter((r) => zones.includes(r.id)).flatMap((r) => r.devices).filter((id) => FACE_DEVICE.test(id));
  const live = ['ACTIVE', 'EXPIRING'].includes(s.states.validity) && s.face_profile_id;
  const base = { subject_id: s.subject_id, validity: s.states.validity, operation: live ? 'UPSERT_TEMPLATE' : 'DELETE_TEMPLATE', zones, devices };
  if (!live) return { ...base, template: null };
  const cipher = (hash(`${s.face_profile_id}|${TEMPLATE_KEY}|a`) + hash(`${s.face_profile_id}|${TEMPLATE_KEY}|b`)).slice(0, 40);
  return { ...base, template: { face_profile_id: s.face_profile_id, format: 'ArcFace-512d', encryption: 'AES-256-GCM', key_id: TEMPLATE_KEY, ciphertext: `${cipher}…`, size_bytes: 2048, checksum: hash(cipher).slice(0, 16) } };
}

/** Trigger A: báo Hệ thống Đào tạo khi sinh viên có Face ID hoàn chỉnh. Mỗi phiên bản mẫu chỉ báo một lần. */
function notifyAcademic(s, ref) {
  if (s.subject_type !== 'STUDENT' || s.states.collection !== 'COMPLETED' || !s.face_profile_id) return null;
  if (s.academic_sent_for === s.face_profile_id) return null;
  const ev = emit('STUDENT', 'ACADEMIC_VERIFIED', ref, { student_code: s.code, face_profile_id: s.face_profile_id, status: 'VERIFIED' });
  if (ev) s.academic_sent_for = s.face_profile_id;
  return ev;
}

const dayDiff = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
};

const requireConsent = (s, what) => {
  if (s.states.consent !== 'ACTIVE') throw new ApiError(`${s.name} chưa có xác nhận đồng ý hợp lệ nên không thể ${what}.`);
};

const pendingOf = (s, type) => db.requests.find((r) => r.subject_id === s.subject_id && r.status === 'pending' && (!type || r.request_type === type));

/** Trạng thái "Yêu cầu" của hồ sơ luôn suy ra từ hàng đợi, để đóng một yêu cầu không xóa mất yêu cầu khác còn chờ. */
function syncRequestState(s) {
  const grant = s.rescan_grant && new Date(s.rescan_grant.expires_at) > new Date() && s.rescan_grant.uses_left > 0;
  s.states.request = pendingOf(s) ? 'OPEN' : grant ? 'RESCAN_GRANTED' : 'NONE';
}

/** Chuyển một người giữa các nhóm trong thống kê đồng ý, giữ tổng không đổi. */
function moveConsentStat(s, to) {
  const cs = db.consentStats;
  const from = s.states.consent === 'ACTIVE' ? (s.consent_version === 'v1.2' ? 'active_current' : 'active_old') : s.states.consent === 'WITHDRAWN' ? 'withdrawn' : 'pending';
  if (from === to) return;
  cs[from] = Math.max(0, cs[from] - 1);
  cs[to] += 1;
}

// ---------- Đọc ----------
/** GET /bootstrap — toàn bộ dữ liệu ban đầu cho Console. */
export function snapshot() {
  const s = clone(db);
  s.audit = s.audit.slice().reverse();
  return s;
}

// ---------- Hồ sơ định danh ----------
/** POST /subjects/{id}/original-image-url  body: { reason } → Signed URL sống 60 giây. Ghi VIEW_ORIGINAL_IMAGE. */
export async function requestOriginalImage(subjectId, reason) {
  await wait();
  const s = subjectById(subjectId);
  requireConsent(s, 'xem ảnh gốc');
  if (!s.face_profile_id && !s.poses.length) throw new ApiError('Hồ sơ chưa có ảnh.');
  appendAudit({ action_code: 'VIEW_ORIGINAL_IMAGE', target: s.code, detail: `Lý do: ${reason}` });
  db.auditMetrics.original_views_7d += 1;
  const expires = Date.now() + 60 * 1000;
  const sig = hash(`${s.subject_id}${expires}`).slice(0, 24);
  return { signed_url: `https://media.sacip.internal/faces/${s.face_profile_id || s.subject_id}/original.jpg?X-Expires=60&X-Signature=${sig}`, expires_at: expires, ttl: 60 };
}

const VALIDITY_ACTIONS = {
  LOCK: { to: 'LOCKED', code: 'LOCK_PROFILE', label: 'Khóa hồ sơ' },
  UNLOCK: { to: 'ACTIVE', code: 'UNLOCK_PROFILE', label: 'Mở khóa hồ sơ' },
  ACTIVATE: { to: 'ACTIVE', code: 'ACTIVATE_PROFILE', label: 'Kích hoạt hiệu lực' },
};

function applyValidity(s, action, reason) {
  const a = VALIDITY_ACTIONS[action];
  if (action !== 'LOCK') {
    requireConsent(s, a.label.toLowerCase());
    if (s.states.collection !== 'COMPLETED') throw new ApiError(`${s.name} chưa thu thập xong Face ID.`);
    if (s.states.risk === 'HIGH') throw new ApiError(`${s.name} đang có cờ rủi ro cao, cần xử lý cờ trước.`);
  }
  if (action === 'LOCK' && s.states.validity === 'LOCKED') throw new ApiError(`${s.name} đã bị khóa.`);
  if (action === 'ACTIVATE' && s.states.validity === 'ACTIVE') throw new ApiError(`${s.name} đã đang hiệu lực.`);
  const reg = action === 'ACTIVATE' && pendingOf(s, 'NEW_REGISTRATION');
  if (reg) throw new ApiError(`${s.name} có ${reg.request_id} đang chờ duyệt; hãy kích hoạt bằng cách duyệt yêu cầu trong Hộp yêu cầu.`);
  s.states.validity = a.to;
  if (a.to === 'ACTIVE' && !s.valid_until) s.valid_until = '30/06/2027';
  appendAudit({ action_code: a.code, target: s.code, detail: reason });
  return emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s));
}

/** POST /subjects/{id}/lock | /unlock | /activate  body: { reason } → cập nhật quyền tại cổng ngay. */
export async function setValidity(subjectId, action, reason) {
  await wait();
  const ev = applyValidity(subjectById(subjectId), action, reason);
  return { event: ev };
}

function openRequest(s, type, reason, channel = 'ADMIN') {
  if (type !== 'WITHDRAW_CONSENT') requireConsent(s, 'tạo yêu cầu');
  if (db.requests.some((r) => r.subject_id === s.subject_id && r.status === 'pending' && r.request_type === type)) throw new ApiError(`${s.name} đã có yêu cầu cùng loại đang chờ duyệt.`);
  const p = policyOf(s.subject_type);
  const cfg = activeConfig(p);
  const steps = type === 'WITHDRAW_CONSENT' ? [{ role: 'DPO', label: 'Cán bộ bảo vệ dữ liệu' }] : cfg.workflow.approval_chain;
  const r = {
    request_id: `REQ-${++seq.req}`, request_type: type, subject_id: s.subject_id, status: 'pending', submitted_at: iso(), sla_due: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    priority: 'NORMAL', channel, reason_submitted: reason, policy_ref: { policy_id: p.policy_id, version: p.current_version },
    ai: s.ai_score != null ? { quality: s.ai_score, match: 95, liveness: 99, confidence: s.ai_score } : null,
    two_person: type === 'REVOKE' && cfg.workflow.revoke_two_person, first_confirm: null,
    approvals: steps.map((x) => ({ role: x.role, label: x.label, decision: null, approver_id: null, approved_at: null, note: null })),
    approver_id: null, approved_at: null, rejection_reason: null,
  };
  db.requests.unshift(r);
  syncRequestState(s);
  appendAudit({ action_code: 'CREATE_REQUEST', target: s.code, detail: `${r.request_id}: ${type} — ${reason}` });
  return r;
}

/** POST /requests  body: { subject_id, request_type, reason } */
export async function createRequest(subjectId, type, reason) {
  await wait();
  return clone(openRequest(subjectById(subjectId), type, reason));
}

/** POST /subjects/bulk  body: { ids, action, reason } → { done, skipped } (bỏ qua hồ sơ không đủ điều kiện, không dừng cả lô). */
export async function bulkAction(ids, action, reason) {
  await wait(400);
  const done = []; const skipped = [];
  ids.forEach((id) => {
    const s = subjectById(id);
    try {
      if (action === 'RESCAN') openRequest(s, 'RESCAN', reason);
      else if (action === 'REMIND') {
        if (s.states.consent !== 'ACTIVE') throw new ApiError('chưa có đồng ý hợp lệ');
        if (s.states.collection === 'COMPLETED') throw new ApiError('đã thu thập xong');
        appendAudit({ action_code: 'SEND_REMINDER', target: s.code, detail: reason });
      } else applyValidity(s, action, reason);
      done.push(s.code);
    } catch (e) { skipped.push({ code: s.code, why: e.message }); }
  });
  return { done, skipped };
}

// ---------- Hộp yêu cầu ----------
function finalize(r, s, note) {
  const p = policyOf(s.subject_type);
  const cfg = activeConfig(p);
  r.status = 'completed'; r.approver_id = actor.name; r.approved_at = iso();
  const events = [];
  if (r.request_type === 'RESCAN') {
    const exp = new Date(Date.now() + cfg.biometric.rescan_validity_hours * 3600 * 1000).toISOString();
    s.rescan_grant = { channels: cfg.biometric.rescan_channels, expires_at: exp, uses_left: cfg.biometric.rescan_max_uses };
    events.push(emit(s.subject_type, 'NOTIFY_RESCAN', r.request_id, { subject_id: s.subject_id, decision: 'APPROVED', rescan_channels: cfg.biometric.rescan_channels, rescan_expires_at: exp, uses: cfg.biometric.rescan_max_uses }));
  } else if (r.request_type === 'NEW_REGISTRATION') {
    s.states.collection = 'COMPLETED'; s.states.validity = 'ACTIVE'; s.valid_until ||= '30/06/2027';
    events.push(notifyAcademic(s, r.request_id));
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'REVOKE') {
    s.states.validity = 'REVOKED';
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'EXTEND') {
    s.states.validity = 'ACTIVE'; s.valid_until = '31/12/2027';
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'WITHDRAW_CONSENT') {
    const days = cfg.workflow.retention_days_after_withdraw;
    // Rút đồng ý có hiệu lực ngay khi người dùng gửi trên App; nếu chưa ghi nhận thì ghi nhận lúc xác nhận.
    moveConsentStat(s, 'withdrawn');
    s.states.consent = 'WITHDRAWN'; s.states.validity = 'REVOKED';
    const er = db.erasures.find((x) => x.subject_id === s.subject_id);
    const due = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    if (er) Object.assign(er, { status: 'IN_PROGRESS', due_at: due, steps: { lock: true, images: false, template: false, notice: false } });
    else db.erasures.unshift({ subject_id: s.subject_id, code: s.code, name: s.name, requested_at: r.submitted_at, due_at: due, status: 'IN_PROGRESS', steps: { lock: true, images: false, template: false, notice: false } });
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  }
  syncRequestState(s);
  appendAudit({ action_code: r.request_type === 'WITHDRAW_CONSENT' ? 'CONSENT_WITHDRAW_CONFIRMED' : 'APPROVE_REQUEST', target: s.code, detail: `${r.request_id}${note ? ` — ${note}` : ''}` });
  return events.filter(Boolean);
}

/** POST /requests/{id}/approve  body: { note } → duyệt bước hiện tại; bước cuối thì thực thi. */
export async function approveRequest(requestId, note) {
  await wait();
  const r = db.requests.find((x) => x.request_id === requestId);
  const s = subjectById(r.subject_id);
  if (r.status !== 'pending') throw new ApiError('Yêu cầu này đã được xử lý.');
  if (!['WITHDRAW_CONSENT', 'REVOKE'].includes(r.request_type)) requireConsent(s, 'phê duyệt yêu cầu');
  const i = r.approvals.findIndex((a) => !a.decision);
  const last = i === r.approvals.length - 1;
  if (!canApproveStep(actor.role, r.approvals[i].role)) throw new ApiError(`Bước "${r.approvals[i].label}" do ${stepApproverText(r.approvals[i].role)} xác nhận.`);
  if (r.two_person && last) {
    if (!r.first_confirm) {
      r.first_confirm = { by: actor.name, by_id: actor.id, at: iso(), note };
      appendAudit({ action_code: 'REVOKE_FIRST_CONFIRM', target: s.code, detail: `${r.request_id} — ${note}` });
      return { stage: 'FIRST_CONFIRM', request: clone(r) };
    }
    if (r.first_confirm.by_id === actor.id) throw new ApiError('Người xác nhận thứ hai phải là một cán bộ khác. Đổi tài khoản ở góc trên bên phải để mô phỏng.');
  }
  Object.assign(r.approvals[i], { decision: 'APPROVED', approver_id: actor.name, approved_at: iso(), note });
  if (!last) {
    appendAudit({ action_code: 'APPROVE_STEP', target: s.code, detail: `${r.request_id} bước ${i + 1}: ${r.approvals[i].label}` });
    return { stage: 'STEP', request: clone(r) };
  }
  const events = finalize(r, s, note);
  return { stage: 'DONE', request: clone(r), events: clone(events) };
}

/** POST /requests/{id}/reject  body: { rejection_reason } → lý do được lưu công khai và đẩy về App. */
export async function rejectRequest(requestId, reason) {
  await wait();
  const r = db.requests.find((x) => x.request_id === requestId);
  const s = subjectById(r.subject_id);
  if (r.request_type === 'WITHDRAW_CONSENT') throw new ApiError('Không được từ chối yêu cầu rút đồng ý.');
  if (r.status !== 'pending') throw new ApiError('Yêu cầu này đã được xử lý.');
  const step = r.approvals.find((a) => !a.decision);
  if (step && !canApproveStep(actor.role, step.role)) throw new ApiError(`Bước "${step.label}" do ${stepApproverText(step.role)} xử lý.`);
  if (!reason || reason.trim().length < 10) throw new ApiError('Phải nhập lý do từ chối (tối thiểu 10 ký tự).');
  Object.assign(r, { status: 'rejected', rejection_reason: reason, approver_id: actor.name, approved_at: iso() });
  const i = r.approvals.findIndex((a) => !a.decision);
  if (i >= 0) Object.assign(r.approvals[i], { decision: 'REJECTED', approver_id: actor.name, approved_at: iso(), note: reason });
  syncRequestState(s);
  const ev = r.request_type === 'RESCAN'
    ? emit(s.subject_type, 'NOTIFY_RESCAN', r.request_id, { subject_id: s.subject_id, decision: 'REJECTED', rejection_reason: reason })
    : (() => { const e = { event_id: `EVT-${++seq.evt}`, trigger_id: 'NOTIFY_DECISION', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: iso(), status: 'DELIVERED', ref: r.request_id, payload: { subject_id: s.subject_id, decision: 'REJECTED', rejection_reason: reason } }; db.events.push(e); return e; })();
  appendAudit({ action_code: r.request_type === 'RESCAN' ? 'REJECT_RESCAN_REQUEST' : 'REJECT_REQUEST', target: s.code, detail: `${r.request_id} — ${reason}` });
  return { request: clone(r), event: clone(ev) };
}

/** Mô phỏng người gửi tự hủy trên App: POST /requests/{id}/cancel (gọi từ App MyDaiNam). */
export async function cancelRequest(requestId) {
  await wait();
  const r = db.requests.find((x) => x.request_id === requestId);
  const s = subjectById(r.subject_id);
  if (r.status !== 'pending') throw new ApiError('Yêu cầu này đã được xử lý.');
  r.status = 'cancelled';
  // Hủy rút đồng ý: người dùng giữ lại đồng ý trước đó và bỏ phiếu xóa chưa bắt đầu. Hồ sơ vẫn khóa đến khi cán bộ mở lại.
  if (r.request_type === 'WITHDRAW_CONSENT' && s.states.consent === 'WITHDRAWN') {
    moveConsentStat(s, s.consent_version === 'v1.2' ? 'active_current' : 'active_old');
    s.states.consent = 'ACTIVE';
    db.erasures = db.erasures.filter((e) => !(e.subject_id === s.subject_id && e.status === 'PENDING_CONFIRM'));
  }
  syncRequestState(s);
  appendAudit({ action_code: 'CANCEL_REQUEST', target: s.code, detail: r.request_id, by: { id: 'APP', name: 'App MyDaiNam', ip: '113.190.22.87' } });
}

// ---------- Chính sách ----------
const bump = (v) => { const [maj, min] = v.slice(1).split('.').map(Number); return `v${maj}.${min + 1}`; };

/** POST /policies/{id}/versions  body: { rules_config, reason } → luôn tạo phiên bản mới, không ghi đè. */
export async function savePolicy(policyId, config, reason) {
  await wait();
  const errors = { ...validatePolicy(config), ...validateOwnership(config, policyId, db.policies) };
  if (Object.keys(errors).length) throw new ApiError('Cấu hình chưa hợp lệ.', errors);
  if (!reason || reason.trim().length < 10) throw new ApiError('Nhập lý do thay đổi (tối thiểu 10 ký tự).');
  const p = db.policies.find((x) => x.policy_id === policyId);
  const before = activeConfig(p);
  const changes = diffConfig(before, config);
  if (!changes.length) throw new ApiError('Không có thay đổi nào so với phiên bản hiện tại.');
  const version = bump(p.versions[p.versions.length - 1].version);
  p.versions.push({ version, config: clone(config), saved_by: actor.name, saved_at: iso(), reason });
  p.current_version = version;
  appendAudit({ action_code: 'POLICY_VERSION_CREATED', target: policyId, detail: `${version} (${changes.length} thay đổi) — ${reason}` });
  return { version, changes };
}

/** POST /policies/{id}/rollback  body: { version, reason } → tạo phiên bản mới mang cấu hình cũ. */
export async function rollbackPolicy(policyId, fromVersion, reason) {
  await wait();
  const p = db.policies.find((x) => x.policy_id === policyId);
  const old = p.versions.find((v) => v.version === fromVersion);
  const version = bump(p.versions[p.versions.length - 1].version);
  p.versions.push({ version, config: clone(old.config), saved_by: actor.name, saved_at: iso(), reason: `Khôi phục cấu hình ${fromVersion}: ${reason}`, restored_from: fromVersion });
  p.current_version = version;
  appendAudit({ action_code: 'POLICY_ROLLBACK', target: policyId, detail: `${version} = ${fromVersion} — ${reason}` });
  return { version };
}

const TYPE_TOTAL = { STUDENT: 21480, STAFF: 1620, CONTRACTOR: 214, RESIDENT: 1200, GUEST: 336 };

/** POST /policies/{id}/dry-run  body: { rules_config } → ước tính ảnh hưởng trên dữ liệu 24 giờ qua, không thay đổi gì. */
export async function dryRunPolicy(policyId, config) {
  await wait(600);
  const p = db.policies.find((x) => x.policy_id === policyId);
  const before = activeConfig(p);
  const affected = config.scope.subject_types.reduce((n, t) => n + (TYPE_TOTAL[t] || 0), 0);
  const zoneRooms = rooms().filter((r) => config.spatial.zones.includes(r.id));
  const devices = zoneRooms.flatMap((r) => r.devices);
  const pending = db.requests.filter((r) => r.status === 'pending' && ['NEW_REGISTRATION', 'RESCAN'].includes(r.request_type) && config.scope.subject_types.includes(subjectById(r.subject_id).subject_type));
  const autoNow = (c) => (c.biometric.ai_auto_approve_enabled ? pending.filter((r) => r.ai && r.ai.confidence >= c.biometric.ai_auto_approve_threshold).length : 0);
  const conflicts = [];
  zoneRooms.filter((r) => !r.approved).forEach((r) => conflicts.push(`${r.id} (${r.name}) chưa được duyệt hạ tầng nên sẽ không nhận dữ liệu.`));
  db.policies.filter((x) => x.policy_id !== policyId).forEach((x) => {
    const shared = activeConfig(x).scope.subject_types.filter((t) => config.scope.subject_types.includes(t));
    if (shared.length) conflicts.push(`Trùng loại đối tượng với ${x.policy_id} (${x.name}). Mỗi loại đối tượng chỉ được thuộc một chính sách.`);
  });
  const offline = devices.map((id) => DEVICES.find((d) => d.id === id)).filter((d) => d && !d.online);
  appendAudit({ action_code: 'POLICY_DRY_RUN', target: policyId, detail: `${affected} đối tượng, ${devices.length} thiết bị` });
  return {
    affected, devices: devices.length, offline_devices: offline.map((d) => d.id),
    auto_approve_before: autoNow(before), auto_approve_after: autoNow(config), pending_considered: pending.length,
    rescan_window_change: config.biometric.rescan_validity_hours - before.biometric.rescan_validity_hours,
    conflicts, changes: diffConfig(before, config),
  };
}

// ---------- Đồng ý ----------
/** POST /consents/reconfirm  body: { scope: 'OLD_VERSION' | 'PENDING' } → gửi yêu cầu xác nhận điều khoản hiện hành. */
export async function requestReconsent(scope, subjectId) {
  await wait();
  const one = subjectId && subjectById(subjectId);
  if (one) {
    db.events.push({ event_id: `EVT-${++seq.evt}`, trigger_id: 'NOTIFY_RECONSENT', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: iso(), status: 'DELIVERED', ref: one.code, payload: { subject_id: one.subject_id, consent_version: 'v1.2' } });
    appendAudit({ action_code: 'CONSENT_RECONFIRM_REQUESTED', target: one.code, detail: 'Gửi điều khoản v1.2 tới App MyDaiNam' });
    return { recipients: 1 };
  }
  const n = scope === 'OLD_VERSION' ? db.consentStats.active_old : db.consentStats.pending;
  const e = { event_id: `EVT-${++seq.evt}`, trigger_id: 'NOTIFY_RECONSENT', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: iso(), status: 'DELIVERED', ref: 'v1.2', payload: { audience: scope, recipients: n, consent_version: 'v1.2' } };
  db.events.push(e);
  appendAudit({ action_code: 'CONSENT_RECONFIRM_REQUESTED', target: 'v1.2', detail: `${n} người (${scope === 'OLD_VERSION' ? 'đang ở phiên bản cũ' : 'chưa xác nhận'})` });
  return { recipients: n };
}

/** Mô phỏng người dùng bấm đồng ý điều khoản v1.2 trên App MyDaiNam: POST /consents (gọi từ App). */
export async function confirmConsentOnApp(subjectId) {
  await wait();
  const s = subjectById(subjectId);
  if (s.states.consent === 'WITHDRAWN') throw new ApiError('Người này đã rút đồng ý; chỉ chính họ đăng ký lại được trên App.');
  if (s.states.consent === 'ACTIVE' && s.consent_version === 'v1.2') throw new ApiError('Đã đồng ý điều khoản hiện hành.');
  moveConsentStat(s, 'active_current');
  s.states.consent = 'ACTIVE'; s.consent_version = 'v1.2';
  appendAudit({ action_code: 'CONSENT_SIGNED', target: s.code, detail: 'Điều khoản v1.2 qua App MyDaiNam', by: { id: 'APP', name: 'App MyDaiNam', ip: '113.190.22.87' } });
  return clone(s);
}

/** POST /anomalies/{id}/resolve  body: { note } → đóng cảnh báo bất thường sau khi đã xử lý. */
export async function resolveAnomaly(id, note) {
  await wait();
  const a = db.anomalies.find((x) => x.id === id);
  if (a.status === 'RESOLVED') throw new ApiError('Cảnh báo đã được đóng.');
  Object.assign(a, { status: 'RESOLVED', resolved_by: actor.name, resolved_at: iso(), resolution: note });
  appendAudit({ action_code: 'ANOMALY_RESOLVED', target: a.ref, detail: `${a.id}: ${a.title} — ${note}` });
  return clone(a);
}

const ERASE_ORDER = ['lock', 'images', 'template', 'notice'];
/** POST /erasures/{subject_id}/advance — mô phỏng tiến trình xóa dữ liệu theo quyền được lãng quên. */
export async function advanceErasure(subjectId) {
  await wait();
  const er = db.erasures.find((x) => x.subject_id === subjectId);
  const next = ERASE_ORDER.find((k) => !er.steps[k]);
  if (!next) return clone(er);
  er.steps[next] = true;
  er.status = ERASE_ORDER.every((k) => er.steps[k]) ? 'DONE' : 'IN_PROGRESS';
  const s = subjectById(subjectId);
  if (s && next === 'template') { s.face_profile_id = null; s.poses = []; s.ai_score = null; s.states.collection = 'NOT_STARTED'; s.source = null; }
  appendAudit({ action_code: 'DATA_ERASED', target: er.code, detail: { lock: 'Khóa tại mọi thiết bị', images: 'Xóa ảnh gốc', template: 'Xóa dữ liệu sinh trắc (vector)', notice: 'Gửi biên bản xác nhận xóa' }[next] });
  return clone(er);
}

// ---------- Nguồn dữ liệu, tích hợp ----------
/** POST /sources/{id}/sync */
export async function syncSource(id) {
  await wait(700);
  const src = db.sources.find((x) => x.id === id);
  appendAudit({ action_code: 'SOURCE_SYNC', target: id, detail: src.name });
  if (id === 'TIMEKEEPING') throw new ApiError('Hệ thống Chấm công không phản hồi sau 30 giây. Kiểm tra kết nối VPN tới máy chủ chấm công.');
  src.last_sync = iso();
  if (id === 'CONTRACTOR') { src.status = 'WARN'; } else src.status = 'OK';
  return clone(src);
}

/** POST /events/{id}/retry */
export async function retryEvent(eventId) {
  await wait();
  const e = db.events.find((x) => x.event_id === eventId);
  e.status = 'DELIVERED'; e.error = null; e.at = iso();
  return clone(e);
}

// ---------- Kiểm toán ----------
/** GET /audit/verify → tính lại chuỗi băm từ bản ghi đầu tiên. */
export async function verifyAuditChain() {
  await wait(500);
  let prev = GENESIS;
  for (let i = 0; i < db.audit.length; i++) {
    const e = db.audit[i];
    if (e.prev_hash !== prev || hash(prev + entryBody(e)) !== e.immutable_hash) return { ok: false, count: db.audit.length, broken_at: e.log_id };
    prev = e.immutable_hash;
  }
  appendAudit({ action_code: 'AUDIT_CHAIN_VERIFIED', target: null, detail: `${db.audit.length} bản ghi, toàn vẹn` });
  return { ok: true, count: db.audit.length };
}

/** POST /audit/export  body: { filter } → tệp kèm mã băm để bên nhận tự kiểm tra, thay cho xuất Excel tĩnh. */
export async function exportAudit(rows) {
  await wait(500);
  const digest = hash(rows.map((r) => r.immutable_hash).join(''));
  const file = `audit-${new Date().toISOString().slice(0, 10)}-${digest.slice(0, 8)}.jsonl`;
  appendAudit({ action_code: 'AUDIT_EXPORT_SIGNED', target: file, detail: `${rows.length} bản ghi, băm ${digest.slice(0, 16)}…` });
  return { file, digest, count: rows.length };
}

// ---------- Tra cứu hành trình (Lượt ra vào khu vực, R-013) ----------
// Giống tra lịch sử một biển số: chỉ khi có sự cố, có lý do, một người thứ hai khác người gửi duyệt.
const LOOKUP_APPROVERS = ['AUDITOR', 'ADMIN'];

/** POST /movement/lookups  body: { target, date, incident, reason } */
export async function requestMovementLookup({ target, date, incident, reason }) {
  await wait();
  const code = String(target || '').trim().toUpperCase();
  if (!code) throw new ApiError('Nhập mã người cần tra cứu.');
  if (!String(incident || '').trim()) throw new ApiError('Phải gắn với một mã sự cố.');
  if (!reason || reason.trim().length < 10) throw new ApiError('Lý do tối thiểu 10 ký tự.');
  if (db.lookups.some((l) => l.status === 'pending' && l.target === code && l.date === date)) throw new ApiError(`Đã có yêu cầu tra cứu ${code} ngày này đang chờ duyệt.`);
  const l = { id: `LK-${String(++seq.lookup).padStart(4, '0')}`, at: iso(), by: actor.name, by_id: actor.id, target: code, date, incident: incident.trim(), reason: reason.trim(), approver: null, decided_at: null, status: 'pending' };
  db.lookups.unshift(l);
  appendAudit({ action_code: 'MOVEMENT_LOOKUP_REQUESTED', target: code, detail: `${l.id} ngày ${date}, sự cố ${l.incident}: ${l.reason}` });
  return clone(l);
}

/** POST /movement/lookups/{id}/approve | /reject  body: { note } → người duyệt phải khác người gửi. */
export async function decideMovementLookup(id, approve, note) {
  await wait();
  const l = db.lookups.find((x) => x.id === id);
  if (l.status !== 'pending') throw new ApiError('Yêu cầu này đã được xử lý.');
  if (!LOOKUP_APPROVERS.includes(actor.role)) throw new ApiError('Chỉ Kiểm toán viên trưởng hoặc Quản trị được duyệt tra cứu.');
  if (l.by_id === actor.id) throw new ApiError('Người duyệt phải khác người gửi yêu cầu. Đổi vai trò ở góc trên bên phải để mô phỏng.');
  if (!approve && (!note || note.trim().length < 10)) throw new ApiError('Từ chối phải nêu lý do (tối thiểu 10 ký tự).');
  Object.assign(l, { status: approve ? 'approved' : 'rejected', approver: actor.name, decided_at: iso(), note: note || null });
  appendAudit({ action_code: approve ? 'MOVEMENT_LOOKUP_APPROVED' : 'MOVEMENT_LOOKUP_REJECTED', target: l.target, detail: `${l.id}${note ? ` — ${note}` : ''}` });
  return clone(l);
}

/** GET /movement/lookups/{id}/journey → chỉ trả khi đã duyệt; mỗi lượt mở đều ghi nhật ký truy vết. */
export async function openMovementJourney(id) {
  await wait();
  const l = db.lookups.find((x) => x.id === id);
  if (l.status !== 'approved') throw new ApiError('Chỉ xem được hành trình của yêu cầu đã duyệt.');
  appendAudit({ action_code: 'MOVEMENT_JOURNEY_VIEWED', target: l.target, detail: `${l.id} ngày ${l.date}, sự cố ${l.incident}` });
  const j = PERSON_JOURNEY;
  const s = db.subjects.find((x) => x.code === l.target);
  return j.id === l.target ? clone(j) : { id: l.target, name: s?.name || l.target, cls: s ? s.code : '', rows: [], gaps: ['Không có lượt ra vào nào được ghi trong ngày này (dữ liệu minh họa chỉ có cho SV-2023-8891).'] };
}

// ---------- Sự cố an ninh ----------
const incidentById = (id) => db.incidents.find((x) => x.id === id);

/** POST /incidents/{id}/ack → trực an ninh nhận xử lý. */
export async function ackIncident(id) {
  await wait();
  const e = incidentById(id);
  if (e.state !== 'open') throw new ApiError('Sự cố đã được tiếp nhận.');
  Object.assign(e, { state: 'ack', ack_by: actor.name, ack_at: iso() });
  appendAudit({ action_code: 'INCIDENT_ACKNOWLEDGED', target: e.id, detail: e.title });
  return clone(e);
}

/** POST /incidents/{id}/close  body: { note } */
export async function closeIncident(id, note) {
  await wait();
  const e = incidentById(id);
  if (e.state === 'closed') throw new ApiError('Sự cố đã đóng.');
  if (!note || note.trim().length < 10) throw new ApiError('Ghi rõ đã xử lý thế nào (tối thiểu 10 ký tự).');
  Object.assign(e, { state: 'closed', closed_by: actor.name, closed_at: iso(), resolution: note });
  appendAudit({ action_code: 'INCIDENT_CLOSED', target: e.id, detail: `${e.title} — ${note}` });
  return clone(e);
}

/** POST /incidents/{id}/evidence  body: { reason } → mở minh chứng video, ghi nhật ký như xem ảnh gốc. */
export async function viewIncidentEvidence(id, reason) {
  await wait();
  const e = incidentById(id);
  appendAudit({ action_code: 'VIEW_INCIDENT_EVIDENCE', target: e.id, detail: `Lý do: ${reason}` });
  return { ok: true };
}

// ---------- Ngoại lệ học vụ (Lịch học & điểm danh) ----------
/** POST /attendance/cases/{id}/decide  body: { accept, note } → Phòng Đào tạo quyết định. */
export async function decideAttendanceCase(id, accept, note) {
  await wait();
  const c = db.attendanceCases.find((x) => x.id === id);
  if (c.status !== 'open') throw new ApiError('Ngoại lệ này đã được xử lý.');
  if (!['REGISTRAR', 'ADMIN'].includes(actor.role)) throw new ApiError('Chỉ Phòng Đào tạo hoặc Quản trị xử lý ngoại lệ học vụ.');
  if (!note || note.trim().length < 10) throw new ApiError('Nhập căn cứ quyết định (tối thiểu 10 ký tự).');
  Object.assign(c, { status: accept ? 'accepted' : 'rejected', decided_by: actor.name, decided_at: iso(), note });
  appendAudit({ action_code: 'ATTENDANCE_CASE_DECIDED', target: c.id, detail: `${c.title}: ${accept ? 'chấp nhận' : 'không chấp nhận'} — ${note}` });
  return clone(c);
}

/** Ghi nhật ký cho các thao tác chưa có endpoint riêng (trang Không gian, Thiết bị, An ninh…). */
export function logAction(action_code, target, detail) { appendAudit({ action_code, target, detail }); }

// ---------- Rủi ro ----------
const AI_ENGINE = { id: 'AI-ENGINE', name: 'AI-ENGINE v4.1', ip: '10.20.0.31' };
const RISK_RANK = { NONE: 0, WATCH: 1, HIGH: 2 };

function raiseRisk(s, level, flag, by = actor) {
  s.risk_flags = [...(s.risk_flags || []), flag];
  if (RISK_RANK[level] > RISK_RANK[s.states.risk]) s.states.risk = level;
  appendAudit({ action_code: 'RISK_FLAGGED', target: s.code, detail: `${level}: ${flag}`, by });
  return emit(s.subject_type, 'NOTIFY_RISK', s.code, { subject_id: s.subject_id, risk_level: s.states.risk, risk_flags: s.risk_flags });
}

/** POST /subjects/{id}/risk  body: { level: WATCH|HIGH, flag } → gắn cờ, báo an ninh. Không tự khóa: người trực quyết định. */
export async function flagRisk(subjectId, level, flag) {
  await wait();
  if (!flag || flag.trim().length < 10) throw new ApiError('Mô tả dấu hiệu rủi ro tối thiểu 10 ký tự.', { flag: 'Tối thiểu 10 ký tự.' });
  return { event: raiseRisk(subjectById(subjectId), level, flag.trim()) };
}

/** POST /subjects/{id}/risk/clear  body: { reason } */
export async function clearRisk(subjectId, reason) {
  await wait();
  const s = subjectById(subjectId);
  if (s.states.risk === 'NONE') throw new ApiError(`${s.name} không có cờ rủi ro.`);
  s.states.risk = 'NONE'; s.risk_flags = [];
  appendAudit({ action_code: 'RISK_CLEARED', target: s.code, detail: reason });
  return clone(s);
}

// ---------- Tác vụ định kỳ ----------
/**
 * POST /jobs/contract-check/run — quét nhà thầu có hợp đồng sắp hết hạn trong số ngày báo trước của chính sách
 * rồi bắn NOTIFY_CONTRACT. Mỗi mốc hết hạn chỉ báo một lần; gia hạn hợp đồng thì mốc mới được báo lại.
 */
export async function runContractExpiryCheck() {
  await wait(600);
  const p = policyOf('CONTRACTOR');
  const cfg = activeConfig(p);
  const notice = cfg.workflow.contract_notice_days ?? 14;
  const found = []; const already = []; const events = [];
  db.subjects.filter((s) => s.subject_type === 'CONTRACTOR' && s.context?.contract_until && !['REVOKED'].includes(s.states.validity)).forEach((s) => {
    const left = dayDiff(s.context.contract_until);
    if (left < 0 || left > notice) return;
    if (s.contract_notified_for === s.context.contract_until) { already.push({ code: s.code, days_left: left }); return; }
    const ev = emit('CONTRACTOR', 'NOTIFY_CONTRACT', s.code, { subject_id: s.subject_id, contract_no: s.context.contract_no, contract_until: s.context.contract_until, days_left: left });
    s.contract_notified_for = s.context.contract_until;
    if (s.states.validity === 'ACTIVE') s.states.validity = 'EXPIRING';
    found.push({ code: s.code, name: s.name, days_left: left });
    if (ev) events.push(ev);
  });
  const result = found.length ? `${found.length} nhà thầu mới vào diện sắp hết hạn, đã gửi thông báo` : already.length ? `Không có trường hợp mới (${already.length} đã báo trước đó)` : 'Không có hợp đồng nào sắp hết hạn';
  db.jobs.contract_check = { ...db.jobs.contract_check, last_run: iso(), last_result: result };
  appendAudit({ action_code: 'JOB_CONTRACT_CHECK', target: p.policy_id, detail: `Báo trước ${notice} ngày: ${result}` });
  return { notice_days: notice, found, already, events, trigger_enabled: !!activeConfig(p).triggers.find((t) => t.id === 'NOTIFY_CONTRACT')?.enabled };
}

// ---------- Không gian & khu vực ----------
/** Cây Tòa → Tầng → Phòng đang dùng (đọc trực tiếp) cho wizard chính sách và gửi mẫu xuống thiết bị. */
export const spacesLive = () => db.spaces;
const ZONES = ['Public', 'Operational', 'Restricted', 'Forbidden'];
const ROOM_CODE_RE = /^[A-Z]\d{3,4}$/;
const findRoom = (id) => {
  for (const b of db.spaces) for (const f of b.children) { const r = f.children.find((x) => x.id === id); if (r) return { b, f, r }; }
  return null;
};

/** Gợi ý mã phòng tiếp theo trên một tầng, ví dụ Tòa C tầng 3 đã có C301, C302, C305 thì gợi ý C306. */
export function suggestRoomCode(buildingId, floorNo) {
  const n = Number(floorNo);
  if (!buildingId || !Number.isInteger(n) || n < 1) return '';
  const used = rooms().map((r) => r.id).filter((id) => id.startsWith(`${buildingId}${n}`)).map((id) => Number(id.slice(String(n).length + 1)));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${buildingId}${n}${String(next).padStart(2, '0')}`;
}

/**
 * POST /spaces/rooms  body: { building: {id} | {new_id, new_name}, floor_no, code, name, zone, reason }
 * Khu vực mới luôn ở trạng thái “Chờ duyệt hạ tầng”: chưa gán thiết bị, chưa phát QR, chưa chọn được trong chính sách.
 */
export async function createRoom(input) {
  await wait();
  const f = {};
  let b = null;
  if (input.building?.id) b = db.spaces.find((x) => x.id === input.building.id);
  else {
    const id = String(input.building?.new_id || '').trim().toUpperCase();
    if (!/^[A-Z]$/.test(id)) f.building_id = 'Mã tòa là một chữ cái in hoa, ví dụ D.';
    else if (db.spaces.some((x) => x.id === id)) f.building_id = `Tòa ${id} đã có.`;
    if (!input.building?.new_name || input.building.new_name.trim().length < 3) f.building_name = 'Tên tòa tối thiểu 3 ký tự.';
  }
  if (input.building?.id && !b) f.building = 'Chọn tòa nhà.';
  const floorNo = Number(input.floor_no);
  if (!Number.isInteger(floorNo) || floorNo < 1 || floorNo > 30) f.floor_no = 'Tầng từ 1 đến 30.';
  const bid = b ? b.id : String(input.building?.new_id || '').trim().toUpperCase();
  const code = String(input.code || '').trim().toUpperCase();
  if (!ROOM_CODE_RE.test(code)) f.code = 'Mã phòng gồm mã tòa và 3–4 chữ số, ví dụ C306.';
  else if (findRoom(code)) f.code = `Mã ${code} đã tồn tại.`;
  else if (bid && !code.startsWith(bid)) f.code = `Mã phòng phải bắt đầu bằng mã tòa ${bid}.`;
  else if (!f.floor_no && !code.slice(1).startsWith(String(floorNo))) f.code = `Phòng ở tầng ${floorNo} nên mã bắt đầu bằng ${bid}${floorNo}.`;
  if (!input.name || input.name.trim().length < 3) f.name = 'Tên khu vực tối thiểu 3 ký tự.';
  if (!ZONES.includes(input.zone)) f.zone = 'Chọn loại khu vực.';
  if (!input.reason || input.reason.trim().length < 10) f.reason = 'Ghi căn cứ khai báo, tối thiểu 10 ký tự.';
  if (Object.keys(f).length) throw new ApiError('Thông tin khu vực chưa hợp lệ.', f);

  if (!b) { b = { id: bid, name: input.building.new_name.trim(), type: 'building', children: [] }; db.spaces.push(b); }
  let floor = b.children.find((x) => x.id === `${b.id}-${floorNo}`);
  if (!floor) {
    floor = { id: `${b.id}-${floorNo}`, name: `Tầng ${floorNo}`, type: 'floor', children: [] };
    b.children.push(floor);
    b.children.sort((x, y) => Number(x.id.split('-')[1]) - Number(y.id.split('-')[1]));
  }
  const room = { id: code, name: input.name.trim(), type: 'room', zone: input.zone, approved: false, devices: [], created_at: iso(), created_by: actor.name };
  floor.children.push(room);
  floor.children.sort((x, y) => x.id.localeCompare(y.id));
  appendAudit({ action_code: 'SPACE_CREATED', target: code, detail: `${room.name} (${b.name} › ${floor.name}), loại ${input.zone}. ${input.reason.trim()}` });
  return { room: clone(room), building_id: b.id, floor_id: floor.id };
}

/** POST /spaces/rooms/{id}/approve  body: { reason } */
export async function approveRoom(id, reason) {
  await wait();
  const hit = findRoom(id);
  if (hit.r.approved) throw new ApiError(`${id} đã được duyệt.`);
  hit.r.approved = true;
  appendAudit({ action_code: 'SPACE_APPROVED', target: id, detail: reason });
  return clone(hit.r);
}

/** PATCH /spaces/rooms/{id}  body: { zone, reason } */
export async function setRoomZone(id, zone, reason) {
  await wait();
  const hit = findRoom(id);
  const from = hit.r.zone;
  hit.r.zone = zone;
  appendAudit({ action_code: 'SPACE_ZONE_CHANGED', target: id, detail: `${from} → ${zone}. ${reason}` });
  return clone(hit.r);
}

/** POST /spaces/rooms/{id}/devices  body: { device_id } | DELETE /spaces/rooms/{id}/devices/{device_id} */
export async function assignDevice(roomId, deviceId, attach = true) {
  await wait(150);
  const hit = findRoom(roomId);
  if (attach) {
    if (!hit.r.approved) throw new ApiError('Phòng chưa được duyệt hạ tầng.');
    if (rooms().some((r) => r.devices.includes(deviceId))) throw new ApiError(`${deviceId} đang gắn với phòng khác.`);
    hit.r.devices.push(deviceId);
  } else hit.r.devices = hit.r.devices.filter((x) => x !== deviceId);
  appendAudit({ action_code: attach ? 'DEVICE_ASSIGNED' : 'DEVICE_UNASSIGNED', target: roomId, detail: deviceId });
  return clone(hit.r);
}

// ---------- Đơn vị tổ chức ----------
const flatUnits = (nodes, parent = null) => nodes.flatMap((n) => [{ node: n, parent }, ...(n.children ? flatUnits(n.children, n) : [])]);
const findUnit = (id) => flatUnits(db.orgTree).find((x) => x.node.id === id);
/** Cây đơn vị đang dùng (đọc trực tiếp, không sao chép) cho tra tên đơn vị ở mọi trang. */
export const orgTreeLive = () => db.orgTree;

const unitIdsUnder = (node) => [node.id, ...(node.children || []).flatMap(unitIdsUnder)];
/** Những gì đang tham chiếu tới đơn vị: hồ sơ và chính sách. Dùng để chặn ngừng dùng đơn vị còn người. */
export function unitUsage(id) {
  const hit = findUnit(id);
  if (!hit) return { subjects: 0, policies: [] };
  const ids = unitIdsUnder(hit.node);
  // Chính sách khoanh phạm vi ở đơn vị cha (kể cả "Toàn trường") cũng áp dụng cho đơn vị con.
  const ancestors = [];
  for (let up = hit.parent; up; up = findUnit(up.id)?.parent) ancestors.push(up.id);
  const inScope = (u) => ids.includes(u) || ancestors.includes(u);
  return {
    subjects: db.subjects.filter((s) => ids.includes(s.org_unit)).length,
    policies: db.policies.filter((p) => activeConfig(p).scope.org_units.some(inScope)).map((p) => p.policy_id),
  };
}

const UNIT_ID_RE = /^[A-Z][A-Z0-9_]{1,15}$/;

/** POST /org-units  body: { parent_id, id, name } */
export async function createOrgUnit(parentId, id, name) {
  await wait();
  const fields = {};
  const code = String(id || '').trim().toUpperCase();
  if (!UNIT_ID_RE.test(code)) fields.id = 'Mã gồm 2–16 ký tự in hoa, số hoặc gạch dưới, bắt đầu bằng chữ.';
  else if (findUnit(code)) fields.id = `Mã ${code} đã tồn tại.`;
  if (!name || name.trim().length < 3) fields.name = 'Tên đơn vị tối thiểu 3 ký tự.';
  const parent = findUnit(parentId);
  if (!parent) fields.parent = 'Chọn đơn vị cha.';
  else if (parent.node.inactive) fields.parent = 'Đơn vị cha đang ngừng dùng.';
  if (Object.keys(fields).length) throw new ApiError('Thông tin đơn vị chưa hợp lệ.', fields);
  const unit = { id: code, name: name.trim(), source: 'MANUAL', created_at: iso() };
  (parent.node.children ||= []).push(unit);
  appendAudit({ action_code: 'ORG_UNIT_CREATED', target: code, detail: `${unit.name}, thuộc ${parent.node.name}` });
  return clone(unit);
}

/** PATCH /org-units/{id}  body: { name, reason } — chỉ đơn vị khai báo tay; đơn vị đồng bộ sửa ở hệ thống nguồn. */
export async function renameOrgUnit(id, name, reason) {
  await wait();
  const hit = findUnit(id);
  if (hit.node.source !== 'MANUAL') throw new ApiError('Đơn vị này đồng bộ từ hệ thống nguồn, cần sửa tại nguồn rồi đồng bộ lại.');
  if (!name || name.trim().length < 3) throw new ApiError('Tên đơn vị tối thiểu 3 ký tự.', { name: 'Tối thiểu 3 ký tự.' });
  const old = hit.node.name;
  hit.node.name = name.trim();
  appendAudit({ action_code: 'ORG_UNIT_UPDATED', target: id, detail: `“${old}” → “${hit.node.name}”. ${reason || ''}`.trim() });
  return clone(hit.node);
}

/** POST /org-units/{id}/deactivate | /activate  body: { reason } — không cho ngừng dùng khi còn người hoặc chính sách tham chiếu. */
export async function setOrgUnitActive(id, active, reason) {
  await wait();
  const hit = findUnit(id);
  if (id === 'ALL') throw new ApiError('Không thể ngừng dùng gốc cây tổ chức.');
  if (!active) {
    const u = unitUsage(id);
    if (u.subjects || u.policies.length) throw new ApiError(`Còn ${u.subjects} hồ sơ${u.policies.length ? ` và chính sách ${u.policies.join(', ')}` : ''} gắn với đơn vị này. Chuyển hồ sơ hoặc sửa chính sách trước.`);
  } else if (hit.parent?.inactive) throw new ApiError('Đơn vị cha đang ngừng dùng, cần dùng lại đơn vị cha trước.');
  hit.node.inactive = !active;
  appendAudit({ action_code: active ? 'ORG_UNIT_ACTIVATED' : 'ORG_UNIT_DEACTIVATED', target: id, detail: reason });
  return clone(hit.node);
}

/** POST /org-units/sync  — kéo danh mục từ Hệ thống Nhân sự. */
export async function syncOrgUnitsFromHR() {
  await wait(700);
  const added = [];
  db.hrPendingUnits.forEach((u) => {
    const parent = findUnit(u.parent);
    if (!parent || findUnit(u.id)) return;
    (parent.node.children ||= []).push({ id: u.id, name: u.name, source: 'HR', created_at: iso() });
    added.push(u);
  });
  db.hrPendingUnits = [];
  const hr = db.sources.find((x) => x.id === 'HR');
  if (hr) hr.last_sync = iso();
  appendAudit({ action_code: 'SOURCE_SYNC', target: 'HR', detail: `Danh mục đơn vị: thêm ${added.length}` });
  return { added };
}

export { ROLES };
