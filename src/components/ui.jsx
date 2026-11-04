import { useEffect, useState } from 'react';
import { useApp } from '../store';

export const Icon = ({ name, size = 18, className = '', fill = false }) => (
  <span className={`ms ${className}`} style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : undefined }} aria-hidden>
    {name}
  </span>
);

const tone = {
  'status-active': 'bg-status-active/10 text-status-active',
  'status-pending': 'bg-status-pending/10 text-status-pending',
  'status-rejected': 'bg-status-rejected/10 text-status-rejected',
  'status-inactive': 'bg-status-inactive/20 text-text-secondary',
  ai: 'bg-ai-surface text-ai-border',
  primary: 'bg-primary-fixed text-on-primary-fixed-variant',
  neutral: 'bg-surface-container text-text-primary',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed-variant',
};

export const Chip = ({ color = 'neutral', icon, children, className = '' }) => (
  <span className={`chip ${tone[color] || tone.neutral} ${className}`}>
    {icon && <Icon name={icon} size={13} />}
    {children}
  </span>
);

const dotBg = { 'status-active': 'bg-status-active', 'status-pending': 'bg-status-pending', 'status-rejected': 'bg-status-rejected', 'status-inactive': 'bg-status-inactive' };
const dotText = { 'status-active': 'text-status-active', 'status-pending': 'text-status-pending', 'status-rejected': 'text-status-rejected', 'status-inactive': 'text-status-inactive' };

export const StatusDot = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`w-2 h-2 rounded-full ${dotBg[color]}`} />
    <span className={`text-label-sm ${dotText[color]}`}>{label}</span>
  </span>
);

export const ScoreBar = ({ value }) => {
  if (value == null) return <span className="text-caption text-text-secondary">Chưa có điểm</span>;
  const c = value >= 85 ? 'status-active' : value >= 70 ? 'status-pending' : 'status-rejected';
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-label-sm font-semibold ${dotText[c]}`}>{value}/100</span>
      <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${dotBg[c]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

/** Ảnh khuôn mặt luôn làm mờ mặc định. Dùng hình minh họa (không phải ảnh thật). */
export function FaceThumb({ seed = 1, size = 36, round = true, revealed = false, missing = false }) {
  if (missing)
    return (
      <div className={`${round ? 'rounded-full' : 'rounded-lg'} bg-surface-container-high flex items-center justify-center text-text-secondary shrink-0`} style={{ width: size, height: size }}>
        <Icon name="no_accounts" size={size * 0.5} />
      </div>
    );
  const hue = (seed * 47) % 360;
  return (
    <div className={`relative overflow-hidden shrink-0 ${round ? 'rounded-full' : 'rounded-lg'}`} style={{ width: size, height: size, background: `linear-gradient(160deg, hsl(${hue} 30% 82%), hsl(${(hue + 40) % 360} 25% 62%))` }}>
      <svg viewBox="0 0 40 40" className={`absolute inset-0 w-full h-full ${revealed ? '' : 'blur-[3px] scale-110'}`}>
        <circle cx="20" cy="16" r="7.5" fill={`hsl(${hue} 20% 40%)`} opacity=".75" />
        <path d="M6 40c1.5-9 7.5-13 14-13s12.5 4 14 13z" fill={`hsl(${hue} 20% 35%)`} opacity=".75" />
      </svg>
      {!revealed && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
          <Icon name="visibility_off" size={Math.max(14, size * 0.42)} className="text-white" />
        </div>
      )}
    </div>
  );
}

export function Modal({ open, onClose, children, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`w-full ${width} bg-surface rounded-xl shadow-xl overflow-hidden flex flex-col anim-fade max-h-[92vh]`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="h-full bg-surface shadow-xl border-l border-border-subtle flex flex-col anim-slide" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/** Modal xác nhận có trường lý do bắt buộc — mọi thao tác nhạy cảm đều ghi log. */
export function ConfirmReason({ open, onClose, onConfirm, title, subtitle, danger, confirmLabel = 'Xác nhận', children, minLength = 10 }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  const ok = reason.trim().length >= minLength;
  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="p-space-md border-b border-border-subtle flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${danger ? 'bg-status-rejected/10 text-status-rejected' : 'bg-primary-fixed text-primary-container'}`}>
          <Icon name={danger ? 'gpp_maybe' : 'verified_user'} size={22} />
        </div>
        <div className="flex-1">
          <h3 className="text-headline-md">{title}</h3>
          {subtitle && <p className="text-caption text-text-secondary">{subtitle}</p>}
        </div>
        <button className="p-1 rounded-lg hover:bg-surface-container text-text-secondary" onClick={onClose} aria-label="Đóng"><Icon name="close" size={20} /></button>
      </div>
      <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
        {children}
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-semibold flex justify-between">
            <span>Lý do / Ghi chú kiểm toán <span className="text-status-rejected">*</span></span>
            <span className="text-caption text-text-secondary font-normal">Tối thiểu {minLength} ký tự</span>
          </span>
          <textarea className="input leading-relaxed" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập căn cứ cho thao tác này…" autoFocus />
        </label>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="lock" size={16} className="text-ai-border" />Thao tác sẽ được ký số và ghi log</span>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Hủy bỏ</button>
          <button disabled={!ok} className={`btn ${danger ? 'bg-status-rejected text-white hover:bg-red-700' : 'bg-primary-container text-white hover:bg-primary'} disabled:opacity-40 disabled:cursor-not-allowed`} onClick={() => onConfirm(reason.trim())}>
            <Icon name="check" />{confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  const ic = { success: 'check_circle', warn: 'warning', error: 'error', info: 'info' };
  const col = { success: 'text-status-active', warn: 'text-status-pending', error: 'text-status-rejected', info: 'text-primary-container' };
  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 w-[360px]">
      {toasts.map((t) => (
        <div key={t.id} className="bg-surface border border-border-subtle rounded-lg shadow-lg p-3 flex gap-2.5 anim-fade" role="status">
          <Icon name={ic[t.tone]} size={20} className={col[t.tone]} />
          <div className="min-w-0">
            <div className="text-label-md font-semibold">{t.title}</div>
            {t.desc && <div className="text-caption text-text-secondary">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export const AiCard = ({ children, className = '' }) => (
  <div className={`rounded-lg p-space-md bg-ai-surface border border-ai-border ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon name="smart_toy" size={20} className="text-ai-border" />
      <span className="text-label-md font-semibold">Gợi ý của AI – người duyệt quyết định</span>
    </div>
    {children}
  </div>
);

export const PageHeader = ({ icon, title, badge, desc, actions }) => (
  <div className="flex items-center justify-between gap-4 mb-space-md">
    <div className="flex items-center gap-3 min-w-0">
      {icon && <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0"><Icon name={icon} size={22} /></div>}
      <div className="min-w-0">
        <div className="flex items-center gap-2"><h1 className="text-headline-lg">{title}</h1>{badge}</div>
        {desc && <p className="text-caption text-text-secondary truncate">{desc}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export const Empty = ({ icon = 'inbox', title, desc }) => (
  <div className="py-12 flex flex-col items-center text-center text-text-secondary">
    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-2"><Icon name={icon} size={24} /></div>
    <div className="text-label-md font-semibold text-text-primary">{title}</div>
    {desc && <div className="text-caption mt-0.5">{desc}</div>}
  </div>
);
