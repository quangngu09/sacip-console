// Kiểm tra cấu hình chính sách. Dùng chung cho giao diện (báo lỗi đỏ ngay khi nhập) và client.js (chặn khi lưu),
// đúng yêu cầu "Frontend phải báo lỗi trước khi cho phép gọi API lưu" (Đặc tả Policy Engine §4.3).

/** Nguồn nào hợp lệ với loại đối tượng nào. App MyDaiNam chỉ có cho người có tài khoản trường. */
export const SOURCE_ALLOWED = {
  APP: ['STUDENT', 'STAFF', 'RESIDENT'],
  CARD_DB: ['STUDENT', 'STAFF', 'RESIDENT'],
  COUNTER: ['STUDENT', 'STAFF', 'RESIDENT', 'CONTRACTOR', 'GUEST'],
};

/** Khung giờ nào hợp lệ với loại đối tượng nào. */
export const TIME_PRESETS = {
  TIMETABLE: { label: 'Giờ học theo lịch (từ Hệ thống Đào tạo)', for: ['STUDENT', 'STAFF'] },
  OFFICE: { label: 'Giờ hành chính', for: ['STAFF', 'CONTRACTOR', 'GUEST', 'STUDENT'] },
  SHIFT: { label: 'Ca làm việc (từ Hệ thống Chấm công)', for: ['STAFF', 'CONTRACTOR'] },
  ALWAYS: { label: 'Cả ngày, 7 ngày', for: ['RESIDENT', 'STAFF', 'CONTRACTOR'] },
  CUSTOM: { label: 'Tùy chỉnh dải giờ và ngày', for: ['STUDENT', 'STAFF', 'CONTRACTOR', 'RESIDENT', 'GUEST'] },
};

const URL_RE = /^https:\/\/[\w.-]+(:\d+)?(\/[\w./-]*)?$/;
const TOPIC_RE = /^[a-z][a-z0-9._-]{2,}$/;

/**
 * Trả về { [đường dẫn trường]: thông báo lỗi }. Đối tượng rỗng nghĩa là hợp lệ.
 * Đường dẫn trường dùng cho cả việc tô đỏ ô nhập và đánh dấu bước của wizard.
 */
export function validatePolicy(c) {
  const e = {};
  const types = c.scope.subject_types;

  // Bước 1
  if (!c.scope.org_units.length) e['scope.org_units'] = 'Chọn ít nhất một đơn vị áp dụng.';
  if (!types.length) e['scope.subject_types'] = 'Chọn ít nhất một loại đối tượng.';

  // Bước 2
  if (!c.spatial.zones.length) e['spatial.zones'] = 'Chọn ít nhất một khu vực kiểm soát.';
  const tw = c.spatial.time_window;
  if (!tw.preset) e['spatial.time_window'] = 'Chọn khung thời gian áp dụng.';
  else {
    const preset = TIME_PRESETS[tw.preset];
    const wrong = types.filter((t) => !preset.for.includes(t));
    if (wrong.length) e['spatial.time_window'] = `“${preset.label}” không áp dụng được cho: ${wrong.map(typeLabel).join(', ')}.`;
    if (['CUSTOM', 'OFFICE'].includes(tw.preset)) {
      if (!tw.days.length) e['spatial.time_window.days'] = 'Chọn ít nhất một ngày trong tuần.';
      if (!tw.from || !tw.to) e['spatial.time_window.range'] = 'Nhập đủ giờ bắt đầu và giờ kết thúc.';
      else if (tw.from >= tw.to) e['spatial.time_window.range'] = 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
  }

  // Bước 3
  const b = c.biometric;
  if (!b.accepted_sources.length) e['biometric.accepted_sources'] = 'Chọn ít nhất một nguồn dữ liệu.';
  else {
    const bad = b.accepted_sources.flatMap((s) => types.filter((t) => !SOURCE_ALLOWED[s].includes(t)).map((t) => `${sourceLabel(s)} không dùng được cho ${typeLabel(t)}`));
    if (bad.length) e['biometric.accepted_sources'] = `${bad.join('; ')}.`;
  }
  if (!Number.isInteger(b.pose_count) || b.pose_count < 1 || b.pose_count > 8) e['biometric.pose_count'] = 'Số tư thế phải từ 1 đến 8.';
  else if (b.accepted_sources.includes('APP') && b.pose_count < 3) e['biometric.pose_count'] = 'Thu thập qua App cần ít nhất 3 tư thế.';
  if (!(b.min_quality >= 50 && b.min_quality <= 100)) e['biometric.min_quality'] = 'Ngưỡng chất lượng phải từ 50 đến 100.';
  if (b.ai_auto_approve_enabled) {
    if (!(b.ai_auto_approve_threshold >= 80 && b.ai_auto_approve_threshold <= 100)) e['biometric.ai_auto_approve_threshold'] = 'Ngưỡng AI tự duyệt phải từ 80% đến 100%.';
    else if (b.ai_auto_approve_threshold < b.min_quality) e['biometric.ai_auto_approve_threshold'] = 'Ngưỡng AI tự duyệt không được thấp hơn ngưỡng chất lượng ảnh.';
  }
  if (!(b.rescan_validity_hours >= 1 && b.rescan_validity_hours <= 168)) e['biometric.rescan_validity_hours'] = 'Thời hạn chụp lại phải từ 1 đến 168 giờ.';
  if (!(b.rescan_max_uses >= 1 && b.rescan_max_uses <= 5)) e['biometric.rescan_max_uses'] = 'Số lần chụp lại phải từ 1 đến 5.';
  if (!b.rescan_channels.length) e['biometric.rescan_channels'] = 'Chọn ít nhất một nơi được chụp lại.';
  else if (b.rescan_channels.includes('APP') && !b.accepted_sources.includes('APP')) e['biometric.rescan_channels'] = 'Muốn cho chụp lại trên App thì phải chấp nhận nguồn App MyDaiNam.';

  // Bước 4
  const chain = c.workflow.approval_chain;
  if (!chain.length) e['workflow.approval_chain'] = 'Chuỗi phê duyệt cần ít nhất một bước.';
  else if (chain.some((s) => !s.label.trim())) e['workflow.approval_chain'] = 'Đặt tên cho mọi bước duyệt.';
  if (!(c.workflow.retention_days_after_withdraw >= 0 && c.workflow.retention_days_after_withdraw <= 30)) e['workflow.retention_days_after_withdraw'] = 'Theo điều khoản v1.2, dữ liệu phải xóa trong tối đa 30 ngày.';
  c.triggers.forEach((t, i) => {
    if (!t.enabled) return;
    if (t.transport === 'WEBHOOK' && !URL_RE.test(t.destination)) e[`triggers.${i}`] = 'Địa chỉ webhook phải là URL https hợp lệ.';
    if (t.transport === 'KAFKA' && !TOPIC_RE.test(t.destination)) e[`triggers.${i}`] = 'Tên topic chỉ gồm chữ thường, số, dấu chấm, gạch ngang.';
    if (t.target === 'ACADEMIC' && !types.includes('STUDENT')) e[`triggers.${i}`] = 'Gửi sang Hệ thống Đào tạo chỉ áp dụng khi chính sách có sinh viên.';
    if (t.event === 'CONTRACT_EXPIRING' && !types.includes('CONTRACTOR')) e[`triggers.${i}`] = 'Thông báo hết hạn hợp đồng chỉ áp dụng khi chính sách có nhà thầu.';
  });
  return e;
}

/** Bước wizard chứa lỗi (1–4), để đánh dấu đỏ trên thanh bước. */
export const stepOfError = (key) => (key.startsWith('scope') ? 1 : key.startsWith('spatial') ? 2 : key.startsWith('biometric') ? 3 : 4);

// Nhãn ngắn dùng trong thông báo lỗi; tránh import vòng với enums.js.
const TYPE_LABEL = { STUDENT: 'Sinh viên', STAFF: 'Cán bộ, giảng viên', CONTRACTOR: 'Nhà thầu', RESIDENT: 'Cư dân KTX', GUEST: 'Khách' };
const SOURCE_LABEL = { APP: 'App MyDaiNam', CARD_DB: 'Ảnh thẻ CSDL', COUNTER: 'Đăng ký tại quầy' };
const typeLabel = (t) => TYPE_LABEL[t] || t;
const sourceLabel = (s) => SOURCE_LABEL[s] || s;

/** So sánh hai cấu hình, trả về danh sách thay đổi dễ đọc cho lịch sử phiên bản. */
export function diffConfig(a, b) {
  const out = [];
  const walk = (x, y, path) => {
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x) && !Array.isArray(y)) {
      new Set([...Object.keys(x), ...Object.keys(y)]).forEach((k) => walk(x[k], y[k], path ? `${path}.${k}` : k));
      return;
    }
    out.push({ path, from: x, to: y });
  };
  walk(a, b, '');
  return out;
}

export const FIELD_LABEL = {
  'scope.org_units': 'Đơn vị áp dụng', 'scope.subject_types': 'Loại đối tượng', 'scope.tenant': 'Đơn vị vận hành',
  'spatial.zones': 'Khu vực kiểm soát', 'spatial.time_window': 'Khung thời gian',
  'spatial.time_window.preset': 'Khung thời gian', 'spatial.time_window.days': 'Ngày áp dụng', 'spatial.time_window.from': 'Giờ bắt đầu', 'spatial.time_window.to': 'Giờ kết thúc',
  'biometric.accepted_sources': 'Nguồn chấp nhận', 'biometric.pose_count': 'Số tư thế', 'biometric.min_quality': 'Ngưỡng chất lượng ảnh',
  'biometric.ai_auto_approve_enabled': 'AI tự duyệt', 'biometric.ai_auto_approve_threshold': 'Ngưỡng AI tự duyệt',
  'biometric.rescan_validity_hours': 'Thời hạn chụp lại (giờ)', 'biometric.rescan_max_uses': 'Số lần chụp lại', 'biometric.rescan_channels': 'Nơi chụp lại',
  'workflow.approval_chain': 'Chuỗi phê duyệt', 'workflow.revoke_two_person': 'Thu hồi cần 2 người', 'workflow.retention_days_after_withdraw': 'Hạn xóa sau rút đồng ý (ngày)',
  triggers: 'Sự kiện gửi ra ngoài',
};

/** Một loại đối tượng chỉ thuộc một chính sách, để chính sách sinh viên không áp nhầm sang nhà thầu (Đặc tả Policy Engine, bước 1). */
export function validateOwnership(config, policyId, policies) {
  const owners = {};
  policies.forEach((p) => { if (p.policy_id !== policyId) owners[p.target_subject_type] = p; });
  const taken = config.scope.subject_types.filter((t) => owners[t]);
  return taken.length ? { 'scope.subject_types': `${taken.map((t) => `${TYPE_LABEL[t]} đã thuộc ${owners[t].policy_id} (${owners[t].name})`).join('; ')}. Bỏ chọn hoặc sửa ở chính sách đó.` } : {};
}
