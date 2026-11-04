import { SOURCE, SUBJECT_TYPE, TRIGGER_SHORT } from '../api/enums';
import { FIELD_LABEL, TIME_PRESETS } from '../api/policyValidation';
import { unitName } from './scope';

export const DAYS = [[1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [7, 'CN']];
export const RESCAN_CHANNELS = { APP: 'App MyDaiNam', KIOSK: 'Kiosk tại quầy' };
export const APPROVER_ROLES = {
  ADVISOR: 'GVCN / Cố vấn học tập', REGISTRAR: 'Phòng Đào tạo', UNIT_HEAD: 'Trưởng đơn vị', DORM: 'Ban Quản lý KTX',
  CONTRACT_OWNER: 'Đơn vị quản lý hợp đồng', HCQT: 'Phòng Hành chính - Quản trị', HOST: 'Đơn vị bảo lãnh', DPO: 'Cán bộ bảo vệ dữ liệu',
};

export const timeWindowText = (tw) => {
  const base = TIME_PRESETS[tw.preset]?.label || '—';
  if (!['CUSTOM', 'OFFICE'].includes(tw.preset)) return base;
  const days = DAYS.filter(([d]) => tw.days.includes(d)).map(([, l]) => l).join(', ');
  return `${base}: ${tw.from}–${tw.to}, ${days}`;
};

/** Hiển thị một giá trị cấu hình theo đường dẫn trường, dùng cho lịch sử phiên bản và màn xem lại. */
export function valueText(path, v) {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'boolean') return v ? 'Bật' : 'Tắt';
  if (path === 'scope.subject_types') return v.map((t) => SUBJECT_TYPE[t]?.label || t).join(', ');
  if (path === 'scope.org_units') return v.map(unitName).join(', ');
  if (path === 'biometric.accepted_sources') return v.map((s) => SOURCE[s]?.label || s).join(', ');
  if (path === 'biometric.rescan_channels') return v.map((c) => RESCAN_CHANNELS[c] || c).join(', ');
  if (path === 'biometric.ai_auto_approve_threshold' || path === 'biometric.min_quality') return path.endsWith('threshold') ? `${v}%` : `${v}/100`;
  if (path === 'spatial.time_window.preset') return TIME_PRESETS[v]?.label || v;
  if (path === 'spatial.time_window.days') return DAYS.filter(([d]) => v.includes(d)).map(([, l]) => l).join(', ');
  if (path === 'workflow.approval_chain') return v.map((s) => s.label).join(' → ');
  if (path === 'triggers') return v.filter((t) => t.enabled).map((t) => TRIGGER_SHORT[t.id]).join(', ') || 'Không gửi sự kiện nào';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

export const fieldLabel = (path) => FIELD_LABEL[path] || path;
