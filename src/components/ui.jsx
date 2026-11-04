import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const foldText = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();

const SELECT_TRIGGER = {
  field: 'w-full min-h-[34px] px-2.5 py-1.5 bg-surface border border-border-strong rounded-lg text-body-sm hover:border-status-inactive disabled:bg-surface-container-low disabled:text-text-secondary disabled:border-border-subtle disabled:cursor-not-allowed',
  inline: 'max-w-[240px] px-2 py-1 rounded-lg text-label-md font-medium hover:bg-surface-container-low',
};

/** Select một lựa chọn theo mẫu combobox của WAI-ARIA. Menu render qua portal nên không bị modal/bảng cắt. */
export function Select({ value, onChange, options, label, placeholder = 'Chọn…', disabled = false, variant = 'field', wrap = false, className = '' }) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = items.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const btn = useRef();
  const menu = useRef();
  const typed = useRef({ text: '', timer: null });
  const id = useId();

  const show = (index = items.indexOf(selected)) => { setActive(Math.max(index, 0)); setPos(null); setOpen(true); };
  const commit = (o) => { setOpen(false); if (o && o.value !== value) onChange(o.value); };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current.getBoundingClientRect();
      const h = menu.current.scrollHeight + 2;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = h > below && above > below;
      const maxWidth = Math.max(r.width, 420);
      const width = Math.min(Math.max(menu.current.offsetWidth, r.width), maxWidth);
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), minWidth: r.width, maxWidth, maxHeight: Math.min(up ? above : below, 288),
        ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      });
    };
    place();
    const outside = (e) => {
      if (btn.current.contains(e.target) || menu.current?.contains(e.target)) return;
      // Giữ focus khi bấm nhãn, nếu không onBlur đóng menu rồi click của nhãn lại mở ra.
      if ([...btn.current.labels].some((l) => l.contains(e.target))) { e.preventDefault(); return; }
      setOpen(false);
    };
    const onScroll = (e) => { if (!menu.current?.contains(e.target)) place(); };
    document.addEventListener('mousedown', outside);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => { if (open && pos) menu.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [open, pos, active]);
  useEffect(() => () => clearTimeout(typed.current.timer), []);

  const typeAhead = (key) => {
    const t = typed.current;
    clearTimeout(t.timer);
    t.text += foldText(key);
    t.timer = setTimeout(() => { t.text = ''; }, 600);
    const from = open ? active + (t.text.length === 1 ? 1 : 0) : 0;
    const order = [...items.slice(from), ...items.slice(0, from)];
    const hit = order.find((o) => foldText(o.label).startsWith(t.text));
    if (!hit) { if (!open) show(); return; }
    if (open) setActive(items.indexOf(hit)); else show(items.indexOf(hit));
  };

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const printable = e.key.length === 1 && (e.key !== ' ' || typed.current.text);
    const last = items.length - 1;
    const moves = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last, PageDown: Math.min(active + 8, last), PageUp: Math.max(active - 8, 0) };
    if (printable) typeAhead(e.key);
    else if (!open) { if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) return; show(); }
    else if (e.key in moves) setActive(moves[e.key]);
    else if (e.key === 'Enter' || e.key === ' ') commit(items[active]);
    else if (e.key === 'Escape') setOpen(false);
    else { if (e.key === 'Tab') commit(items[active]); return; }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <button ref={btn} type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-activedescendant={open && items[active] ? `${id}-${active}` : undefined} disabled={disabled} title={wrap ? undefined : selected?.label}
        className={`flex items-center justify-between gap-1.5 text-left transition-colors ${SELECT_TRIGGER[variant]} ${open && variant === 'field' ? 'border-primary-container ring-1 ring-primary-container hover:border-primary-container' : ''} ${open && variant === 'inline' ? 'bg-surface-container hover:bg-surface-container' : ''} ${className}`}
        onClick={() => (open ? setOpen(false) : show())} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} onKeyUp={(e) => e.key === ' ' && e.preventDefault()}>
        <span className={`min-w-0 ${wrap ? '' : 'truncate'} ${selected ? '' : 'text-text-secondary'}`}>{selected ? selected.label : placeholder}</span>
        <Icon name="expand_more" size={18} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <ul ref={menu} id={id} role="listbox" aria-label={label} className="fixed z-[70] w-max p-1 bg-surface border border-border-strong rounded-lg shadow-lg overflow-y-auto text-text-primary"
          style={pos || { top: 0, left: 0, visibility: 'hidden' }} onMouseDown={(e) => e.preventDefault()}>
          {items.length === 0 && <li className="px-2.5 py-1.5 text-body-sm text-text-secondary">Không có lựa chọn</li>}
          {items.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li key={o.value} id={`${id}-${i}`} role="option" aria-selected={isSel} onMouseMove={() => setActive(i)} onClick={() => commit(o)}
                className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded cursor-pointer text-body-sm ${i === active ? 'bg-surface-container' : ''} ${isSel ? 'font-medium text-primary' : ''}`}>
                <span className="min-w-0 break-words">{o.label}</span>
                <Icon name="check" size={16} className={isSel ? '' : 'invisible'} />
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
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
    <div className="fixed inset-0 z-[55] flex justify-end bg-slate-900/30" onClick={onClose}>
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
        <Icon name={danger ? 'gpp_maybe' : 'verified_user'} size={22} className={danger ? 'text-status-rejected' : 'text-primary-container'} />
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
  <div className={`rounded-lg p-space-md bg-ai-surface border border-border-subtle ${className}`}>
    <div className="mb-2 text-label-md font-semibold">Gợi ý của AI – người duyệt quyết định</div>
    {children}
  </div>
);

export const PageHeader = ({ title, badge, desc, actions }) => (
  <div className="flex items-center justify-between gap-4 mb-space-md">
    <div className="min-w-0">
      <div className="flex items-center gap-2"><h1 className="text-headline-lg">{title}</h1>{badge}</div>
      {desc && <p className="text-caption text-text-secondary truncate">{desc}</p>}
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
