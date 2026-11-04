// API giả lập. Mỗi hàm async tương ứng một endpoint REST (ghi ở chú thích đầu hàm).
// Khi có backend: thay thân hàm bằng fetch() tới endpoint đó, giữ nguyên tên hàm và dạng dữ liệu trả về.
// Toàn bộ trạng thái nằm trong biến `db` của module này, giống một máy chủ chạy trong trình duyệt.

import * as seed from './db';
import { ROLES } from './enums';
import { validatePolicy, validateOwnership, diffConfig } from './policyValidation';
import { SPACE_TREE, DEVICES } from '../data/mock';

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
  auditMetrics: clone(seed.AUDIT_METRICS),
  notifications: clone(seed.NOTIFICATIONS),
  audit: [],
};
let seq = { log: 90410, req: 8842, evt: 55214 };

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
export const findSubjectByCode = (code) => clone(db.subjects.find((s) => s.code.toLowerCase() === String(code).trim().toLowerCase()) || null);
const policyOf = (type) => db.policies.find((p) => p.target_subject_type === type);
const activeConfig = (p) => p.versions.find((v) => v.version === p.current_version).config;
export const policyFor = (type) => {
  const p = policyOf(type);
  return p ? { policy_id: p.policy_id, name: p.name, version: p.current_version, config: clone(activeConfig(p)) } : null;
};
const rooms = () => SPACE_TREE.flatMap((b) => b.children.flatMap((f) => f.children));

function emit(type, triggerId, ref, payload) {
  const p = policyOf(type);
  const t = p && activeConfig(p).triggers.find((x) => x.id === triggerId);
  if (!t || !t.enabled) return null;
  const ev = { event_id: `EVT-${++seq.evt}`, trigger_id: t.id, target: t.target, transport: t.transport, destination: t.destination, at: iso(), status: 'DELIVERED', ref, payload };
  db.events.push(ev);
  return ev;
}

function accessPayload(s) {
  const p = policyOf(s.subject_type);
  const zones = p ? activeConfig(p).spatial.zones : [];
  const devices = rooms().filter((r) => zones.includes(r.id)).flatMap((r) => r.devices).length;
  return { subject_id: s.subject_id, validity: s.states.validity, zones, devices };
}

const requireConsent = (s, what) => {
  if (s.states.consent !== 'ACTIVE') throw new ApiError(`${s.name} chưa có xác nhận đồng ý hợp lệ nên không thể ${what}.`);
};

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
  s.states.request = 'OPEN';
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
    s.states.request = 'RESCAN_GRANTED';
    s.rescan_grant = { channels: cfg.biometric.rescan_channels, expires_at: exp, uses_left: cfg.biometric.rescan_max_uses };
    events.push(emit(s.subject_type, 'NOTIFY_RESCAN', r.request_id, { subject_id: s.subject_id, decision: 'APPROVED', rescan_channels: cfg.biometric.rescan_channels, rescan_expires_at: exp, uses: cfg.biometric.rescan_max_uses }));
  } else if (r.request_type === 'NEW_REGISTRATION') {
    s.states.request = 'NONE'; s.states.collection = 'COMPLETED'; s.states.validity = 'ACTIVE'; s.valid_until ||= '30/06/2027';
    if (s.subject_type === 'STUDENT') events.push(emit('STUDENT', 'ACADEMIC_VERIFIED', r.request_id, { student_code: s.code, face_profile_id: s.face_profile_id, status: 'VERIFIED' }));
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'REVOKE') {
    s.states.request = 'NONE'; s.states.validity = 'REVOKED';
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'EXTEND') {
    s.states.request = 'NONE'; s.states.validity = 'ACTIVE'; s.valid_until = '31/12/2027';
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  } else if (r.request_type === 'WITHDRAW_CONSENT') {
    const days = cfg.workflow.retention_days_after_withdraw;
    s.states.request = 'NONE'; s.states.consent = 'WITHDRAWN'; s.states.validity = 'REVOKED';
    const er = db.erasures.find((x) => x.subject_id === s.subject_id);
    const due = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    if (er) Object.assign(er, { status: 'IN_PROGRESS', due_at: due, steps: { lock: true, images: false, template: false, notice: false } });
    else db.erasures.unshift({ subject_id: s.subject_id, code: s.code, name: s.name, requested_at: r.submitted_at, due_at: due, status: 'IN_PROGRESS', steps: { lock: true, images: false, template: false, notice: false } });
    db.consentStats.withdrawn += 1;
    events.push(emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s)));
  }
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
  if (!reason || reason.trim().length < 10) throw new ApiError('Phải nhập lý do từ chối (tối thiểu 10 ký tự).');
  Object.assign(r, { status: 'rejected', rejection_reason: reason, approver_id: actor.name, approved_at: iso() });
  const i = r.approvals.findIndex((a) => !a.decision);
  if (i >= 0) Object.assign(r.approvals[i], { decision: 'REJECTED', approver_id: actor.name, approved_at: iso(), note: reason });
  s.states.request = 'NONE';
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
  r.status = 'cancelled';
  s.states.request = 'NONE';
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
export async function requestReconsent(scope) {
  await wait();
  const n = scope === 'OLD_VERSION' ? db.consentStats.active_old : db.consentStats.pending;
  const e = { event_id: `EVT-${++seq.evt}`, trigger_id: 'NOTIFY_RECONSENT', target: 'NOTIFICATION', transport: 'KAFKA', destination: 'notify.push', at: iso(), status: 'DELIVERED', ref: 'v1.2', payload: { audience: scope, recipients: n, consent_version: 'v1.2' } };
  db.events.push(e);
  appendAudit({ action_code: 'CONSENT_RECONFIRM_REQUESTED', target: 'v1.2', detail: `${n} người (${scope === 'OLD_VERSION' ? 'đang ở phiên bản cũ' : 'chưa xác nhận'})` });
  return { recipients: n };
}

/** POST /subjects/{id}/consent  body: { version, channel } → ký tại quầy hoặc trên App. */
export async function signConsent(subjectId, channel) {
  await wait();
  const s = subjectById(subjectId);
  const wasNew = s.states.consent !== 'ACTIVE';
  s.states.consent = 'ACTIVE'; s.consent_version = 'v1.2';
  if (wasNew) { db.consentStats.pending = Math.max(0, db.consentStats.pending - 1); db.consentStats.active_current += 1; }
  appendAudit({ action_code: 'CONSENT_SIGNED', target: s.code, detail: `Điều khoản v1.2 qua ${channel}` });
  return clone(s);
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

/** Ghi nhật ký cho các thao tác chưa có endpoint riêng (trang Không gian, Thiết bị, An ninh…). */
export function logAction(action_code, target, detail) { appendAudit({ action_code, target, detail }); }

// ---------- Kiosk ----------
/** POST /kiosk/enroll  body: { subject_code, poses:[{name, score}], device_id } */
export async function kioskEnroll(code, poses, deviceId) {
  await wait(500);
  const s = db.subjects.find((x) => x.code === code);
  if (!s) throw new ApiError('Không tìm thấy hồ sơ.');
  requireConsent(s, 'thu thập Face ID');
  const p = policyOf(s.subject_type);
  const cfg = activeConfig(p).biometric;
  if (!cfg.accepted_sources.includes('COUNTER')) throw new ApiError(`Chính sách ${p.policy_id} không chấp nhận đăng ký tại quầy.`);
  if (poses.length < cfg.pose_count) throw new ApiError(`Chính sách yêu cầu ${cfg.pose_count} tư thế, mới chụp ${poses.length}.`);
  const minScore = Math.min(...poses.map((x) => x.score));
  const avg = Math.round(poses.reduce((a, x) => a + x.score, 0) / poses.length);
  Object.assign(s, { source: 'COUNTER', poses, ai_score: avg, face_profile_id: s.face_profile_id || `fp_${s.code.slice(-4)}_v1` });
  appendAudit({ action_code: 'KIOSK_CAPTURE', target: s.code, detail: `${deviceId}: ${poses.length} tư thế, điểm thấp nhất ${minScore}` });
  if (minScore < cfg.min_quality) {
    s.states.collection = 'QUALITY_FAILED';
    return { result: 'QUALITY_FAILED', min_quality: cfg.min_quality, minScore };
  }
  s.states.collection = 'COMPLETED';
  if (s.states.request === 'RESCAN_GRANTED') s.states.request = 'NONE';
  if (cfg.ai_auto_approve_enabled && avg >= cfg.ai_auto_approve_threshold) {
    s.states.validity = 'ACTIVE'; s.valid_until ||= '30/06/2027';
    appendAudit({ action_code: 'AUTO_APPROVE_FACE_ID', target: s.code, detail: `Điểm ${avg}% ≥ ngưỡng ${cfg.ai_auto_approve_threshold}% (${p.policy_id} ${p.current_version})`, by: { id: 'AI-ENGINE', name: 'AI-ENGINE v4.1', ip: '10.20.0.31' } });
    if (s.subject_type === 'STUDENT') emit('STUDENT', 'ACADEMIC_VERIFIED', s.code, { student_code: s.code, face_profile_id: s.face_profile_id, status: 'VERIFIED' });
    emit(s.subject_type, 'ACCESS_SYNC', s.code, accessPayload(s));
    return { result: 'AUTO_APPROVED', score: avg, threshold: cfg.ai_auto_approve_threshold };
  }
  s.states.validity = 'PENDING_ACTIVATION';
  const r = db.requests.find((x) => x.subject_id === s.subject_id && x.status === 'pending' && x.request_type === 'NEW_REGISTRATION') || openRequest(s, 'NEW_REGISTRATION', `Đăng ký tại quầy ${deviceId}, ${poses.length} tư thế.`, 'COUNTER');
  return { result: 'PENDING_REVIEW', score: avg, threshold: cfg.ai_auto_approve_enabled ? cfg.ai_auto_approve_threshold : null, request_id: r.request_id };
}

export { ROLES };
