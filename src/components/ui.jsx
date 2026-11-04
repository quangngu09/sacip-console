import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import { useResource } from '../lib/resource';
import { useScope } from '../lib/scope';
import { SOURCE, SUBJECT_TYPE, stateMeta } from '../api/enums';

export const Icon = ({ name, size = 18, className = '', fill = false }) => (
  <span className={`ms ${className}`} style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : undefined }} aria-hidden>
    {name}
  </span>
);

const tone = {
  'status-active': 'bg-status-active/10 text-status-active',
  'status-pending': 'bg-status-pending/10 text-status-pending',
  'status-rejected': 'bg-status-rejected/10 text-status-rejected',
  'status-inactive': 'bg-surface-container text-text-secondary',
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
  field: 'w-full min-h-[40px] px-3 py-1.5 bg-surface border border-border-control rounded text-body-sm hover:bg-surface-container-low disabled:bg-surface-container-low disabled:text-text-secondary disabled:border-border-subtle disabled:cursor-not-allowed',
  inline: 'h-8 max-w-[240px] px-2 rounded text-label-md font-medium hover:bg-surface-container-low',
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

const dialogStack = [];

/** Hành vi chung của hộp thoại: giữ focus bên trong, Esc chỉ đóng hộp trên cùng, trả focus khi đóng. */
function useDialog(open, onClose) {
  const ref = useRef();
  const close = useRef(onClose);
  close.current = onClose;
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const token = {};
    dialogStack.push(token);
    const previous = document.activeElement;
    const el = ref.current;
    const focusables = () => [...el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]')];
    const heading = el.querySelector('h2, h3');
    if (heading) { heading.id ||= id; el.setAttribute('aria-labelledby', heading.id); }
    if (!el.contains(document.activeElement)) (focusables()[0] || el).focus();
    const onKey = (e) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (e.key === 'Escape') { close.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      dialogStack.splice(dialogStack.indexOf(token), 1);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, id]);
  return ref;
}

export function Modal({ open, onClose, children, width = 'max-w-xl' }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div ref={ref} tabIndex={-1} className={`w-full ${width} bg-surface rounded-xl shadow-xl overflow-hidden flex flex-col anim-fade max-h-[92vh] outline-none`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, children, width = 480 }) {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-slate-900/30" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" className="h-full bg-surface shadow-xl border-l border-border-subtle flex flex-col anim-slide outline-none" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/** Modal xác nhận có trường lý do bắt buộc — mọi thao tác nhạy cảm đều ghi log. */
export function ConfirmReason({ open, onClose, onConfirm, title, subtitle, danger, confirmLabel = 'Xác nhận', children, minLength = 10, reasonLabel = 'Lý do / Ghi chú kiểm toán', placeholder = 'Nhập căn cứ cho thao tác này…' }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setReason(''); setBusy(false); } }, [open]);
  const ok = reason.trim().length >= minLength && !busy;
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
            <span>{reasonLabel} <span className="text-status-rejected">*</span></span>
            <span className="text-caption text-text-secondary font-normal">Tối thiểu {minLength} ký tự</span>
          </span>
          <textarea className="input leading-relaxed" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} autoFocus />
        </label>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="lock" size={16} className="text-ai-border" />Thao tác sẽ được ký số và ghi log</span>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Hủy</button>
          <button disabled={!ok} className={`btn ${danger ? 'bg-status-rejected text-white hover:bg-red-700' : 'bg-primary-container text-white hover:bg-primary'} disabled:cursor-not-allowed`} onClick={async () => { setBusy(true); try { await onConfirm(reason.trim()); } finally { setBusy(false); } }}>
            <Icon name="check" />{confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Toasts() {
  const { toasts, railCollapsed } = useApp();
  const ic = { success: 'check_circle', warn: 'warning', error: 'error', info: 'info' };
  const col = { success: 'text-status-active', warn: 'text-status-pending', error: 'text-status-rejected', info: 'text-primary-container' };
  return (
    <div className={`fixed bottom-5 ${railCollapsed ? 'left-[80px]' : 'left-[256px]'} z-[80] flex flex-col gap-2 w-[360px]`}>
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

const COUNT_TONE = { 'status-pending': 'text-status-pending', 'status-rejected': 'text-status-rejected' };

/** Thanh tab gạch chân. items: [{ key, label, count, tone }] */
export function Tabs({ items, value, onChange, label, className = '' }) {
  const ref = useRef();
  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = items.findIndex((t) => t.key === value);
    const next = items[(i + step + items.length) % items.length];
    onChange(next.key);
    ref.current.querySelector(`[data-tab="${next.key}"]`)?.focus();
  };
  return (
    <div ref={ref} role="tablist" aria-label={label} onKeyDown={onKeyDown} className={`flex items-stretch gap-1 overflow-x-auto ${className}`}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button key={t.key} data-tab={t.key} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => onChange(t.key)}
            className={`h-11 px-3 -mb-px border-b-2 text-label-md whitespace-nowrap flex items-center gap-1.5 transition-colors ${on ? 'border-primary-container text-primary-container font-semibold' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {t.label}
            {t.count != null && <span className={`text-caption tabular-nums font-medium ${COUNT_TONE[t.tone] || ''}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

const BANNER_TONE = {
  info: ['bg-primary-fixed border-primary-container/20', 'text-primary-container', 'info'],
  warn: ['bg-status-pending/10 border-status-pending/30', 'text-status-pending', 'warning'],
  danger: ['bg-status-rejected/10 border-status-rejected/30', 'text-status-rejected', 'error'],
};

export const Banner = ({ tone = 'info', icon, title, children, action, className = '' }) => (
  <div className={`p-3 rounded-lg border flex items-start gap-2.5 text-body-sm ${BANNER_TONE[tone][0]} ${className}`}>
    <Icon name={icon || BANNER_TONE[tone][2]} size={20} className={BANNER_TONE[tone][1]} />
    <div className="flex-1 min-w-0">{title && <b className={BANNER_TONE[tone][1]}>{title} </b>}{children}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/** Dải số liệu dùng chung. items: [{ label, value, sub, alert, to }] */
export const MetricStrip = ({ items, className = '' }) => (
  <div className={`card grid divide-x divide-border-subtle overflow-hidden ${className}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((m) => {
      const body = (
        <>
          <div className="text-label-md font-normal text-text-secondary">{m.label}</div>
          <div className="text-[28px] font-semibold leading-9 mt-0.5 tabular-nums">{m.value}</div>
          <div className={`text-caption mt-0.5 ${m.alert ? 'text-status-pending font-medium' : 'text-text-secondary'}`}>{m.sub}</div>
        </>
      );
      return m.to
        ? <Link key={m.label} to={m.to} className="block px-space-md py-3 hover:bg-surface-container-low transition-colors -outline-offset-2">{body}</Link>
        : <div key={m.label} className="px-space-md py-3">{body}</div>;
    })}
  </div>
);

export const SearchInput = ({ value, onChange, placeholder, label, className = '' }) => (
  <div className={`relative ${className}`}>
    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
    <input className="input pl-9 pr-9" aria-label={label || placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    {value && <button type="button" aria-label="Xóa nội dung tìm kiếm" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={() => onChange('')}><Icon name="close" size={16} /></button>}
  </div>
);

const blankLast = (v) => v === null || v === undefined || v === '';

/** Sắp xếp theo cột: bấm lần lượt tăng dần, giảm dần, bỏ sắp xếp. accessors: { khóa: (hàng) => giá trị } */
export function useSort(rows, accessors) {
  const [sort, setSort] = useState(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const get = accessors[sort.key];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (blankLast(x) || blankLast(y)) return blankLast(x) - blankLast(y);
      return dir * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi', { numeric: true }));
    });
    // accessors được khai báo cố định theo từng bảng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key) => setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
  return { sorted, sort, toggle };
}

export const SortTh = ({ k, table, children, className = '' }) => {
  const dir = table.sort?.key === k ? table.sort.dir : null;
  return (
    <th className={className} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}>
      <button type="button" onClick={() => table.toggle(k)} className={`inline-flex items-center gap-1 h-8 -mx-1 px-1 rounded font-medium hover:text-text-primary ${dir ? 'text-primary-container' : ''}`}>
        {children}
        <Icon name={dir === 'asc' ? 'arrow_upward' : dir === 'desc' ? 'arrow_downward' : 'unfold_more'} size={14} className={dir ? '' : 'text-border-control'} />
      </button>
    </th>
  );
};

const SCOPE_NOTE = {
  global: 'Trang này áp dụng toàn trường, không lọc theo đơn vị hay đối tượng.',
  units: 'Trang này lọc theo đơn vị, chưa tách theo đối tượng.',
};

export const Bone = ({ className = '' }) => <div className={`skeleton ${className}`} />;

/** Cùng kích thước với MetricStrip để trang không nhảy khi dữ liệu về. */
export const MetricsSkeleton = ({ count = 4, subLines = 1 }) => (
  <div className="card grid divide-x divide-border-subtle overflow-hidden mb-space-md shrink-0" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="px-space-md py-3">
        <Bone className="h-4 my-0.5 w-3/5" />
        <Bone className="h-7 mt-1.5 mb-1 w-24" />
        <Bone className="h-3 mt-1.5 mb-0.5 w-4/5" />
        {subLines > 1 && <Bone className="h-3 mt-1.5 mb-0.5 w-1/2" />}
      </div>
    ))}
  </div>
);

const TableSkeleton = ({ rows = 8, fill }) => (
  <div className={`card overflow-hidden ${fill ? 'flex-1 min-h-0' : ''}`}>
    <div className="h-11 px-space-md flex items-center gap-5 border-b border-border-subtle">
      {['w-20', 'w-24', 'w-16'].map((w) => <Bone key={w} className={`h-4 ${w}`} />)}
    </div>
    <div className="h-10 px-3 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 bg-surface-container-low border-b border-border-subtle">
      {[0, 1, 2, 3, 4].map((c) => <Bone key={c} className="h-3 w-16" />)}
    </div>
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} className="h-14 px-3 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border-subtle last:border-0">
        <div><Bone className="h-4 w-3/5" /><Bone className="h-3 w-2/5 mt-1.5" /></div>
        {[0, 1, 2, 3].map((c) => <Bone key={c} className={`h-4 ${['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'][(r + c) % 4]}`} />)}
      </div>
    ))}
  </div>
);

const SplitSkeleton = ({ fill }) => (
  <div className={`grid grid-cols-[400px_minmax(0,1fr)] gap-space-md ${fill ? 'flex-1 min-h-0' : ''}`}>
    <div className="card overflow-hidden divide-y divide-border-subtle">
      {Array.from({ length: fill ? 9 : 7 }, (_, r) => (
        <div key={r} className="px-3.5 py-3">
          <Bone className={`h-4 ${r % 2 ? 'w-3/5' : 'w-3/4'}`} />
          <Bone className="h-3 w-2/5 mt-2" />
        </div>
      ))}
    </div>
    <div className="card overflow-hidden p-space-md flex flex-col gap-3">
      <Bone className="h-6 w-2/5" />
      <Bone className="h-3 w-1/4" />
      <Bone className="h-24 mt-2" />
      <Bone className="h-4 w-1/3 mt-2" />
      <Bone className="h-10" />
      <Bone className="h-10" />
      <Bone className="h-4 w-1/4 mt-2" />
      <Bone className="h-10" />
    </div>
  </div>
);

const SKELETONS = {
  table: (fill) => <TableSkeleton fill={fill} />,
  'metrics-table': (fill) => <><MetricsSkeleton /><TableSkeleton fill={fill} rows={6} /></>,
  split: (fill) => <SplitSkeleton fill={fill} />,
  'bar-split': (fill) => <><Bone className="h-[46px] rounded-lg mb-space-md shrink-0" /><SplitSkeleton fill={fill} /></>,
  'metrics-split': (fill) => <><MetricsSkeleton /><SplitSkeleton fill={fill} /></>,
};

/**
 * Bao nội dung một trang: xử lý trạng thái đang tải, lỗi và phạm vi chưa có dữ liệu.
 * skeleton: khung tải giống bố cục trang, là tên trong SKELETONS hoặc một phần tử React.
 * reveal: các khối con hiện lần lượt; tắt khi trang tự sắp hiệu ứng.
 */
export function DataBoundary({ name, label, fill = false, scopeNote, skeleton = 'table', reveal = true, children }) {
  const { status, reload } = useResource(name);
  const { scope, primaryTenant, allUnits, allSubjects } = useScope();
  const box = `card ${fill ? 'flex-1 min-h-0' : ''}`;
  if (!primaryTenant) return <div className={box}><Empty icon="domain_disabled" title={`${scope.tenant} chưa có dữ liệu`} desc="Đơn vị này chưa được kết nối vào hệ thống. Đổi phạm vi ở thanh trên cùng để xem đơn vị khác." /></div>;
  if (status === 'loading') {
    return (
      <div className={fill ? 'flex-1 min-h-0 flex flex-col' : ''} role="status" aria-busy="true">
        <span className="sr-only">Đang tải {label}…</span>
        {typeof skeleton === 'string' ? SKELETONS[skeleton](fill) : skeleton}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className={box} role="alert">
        <div className="py-12 flex flex-col items-center text-center">
          <Icon name="cloud_off" size={32} className="text-status-rejected mb-2" />
          <div className="text-label-md font-semibold">Không tải được {label}</div>
          <p className="text-caption text-text-secondary mt-0.5 mb-3">Kiểm tra kết nối mạng rồi thử lại. Nếu vẫn lỗi, liên hệ bộ phận kỹ thuật.</p>
          <button className="btn-primary" onClick={reload}><Icon name="refresh" />Thử lại</button>
        </div>
      </div>
    );
  }
  const showNote = scopeNote === 'global' ? !allUnits || !allSubjects : scopeNote === 'units' && !allSubjects;
  return (
    <div className={reveal ? 'contents reveal' : 'contents'}>
      {showNote && <p className="mb-2 text-caption text-text-secondary flex items-center gap-1.5 shrink-0"><Icon name="info" size={14} />{SCOPE_NOTE[scopeNote]}</p>}
      {children}
    </div>
  );
}

export const Empty = ({ icon = 'inbox', title, desc }) => (
  <div className="py-12 flex flex-col items-center text-center text-text-secondary">
    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-2"><Icon name={icon} size={24} /></div>
    <div className="text-label-md font-semibold text-text-primary">{title}</div>
    {desc && <div className="text-caption mt-0.5">{desc}</div>}
  </div>
);

/** Một chiều trạng thái của hồ sơ, ví dụ <StateBadge dim="validity" value="LOCKED" />. */
export const StateBadge = ({ dim, value, label }) => {
  const m = stateMeta(dim, value);
  return <StatusDot color={m.color} label={label || m.label} />;
};

/** Badge nguồn Face ID: App MyDaiNam, Ảnh thẻ CSDL, Đăng ký tại quầy. */
export const SourceBadge = ({ source, poses }) => {
  if (!source) return <span className="text-caption text-text-secondary">Chưa có</span>;
  const m = SOURCE[source];
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-caption whitespace-nowrap" title={m.label}>
      <Icon name={m.icon} size={14} className="text-primary-container" />
      <span className="font-medium">{m.short}</span>
      {poses != null && source !== 'CARD_DB' && <span className="text-text-secondary">• {poses} tư thế</span>}
    </span>
  );
};

export const SubjectTypeChip = ({ type, className = '' }) => {
  const m = SUBJECT_TYPE[type];
  return <Chip color={m.chip} icon={m.icon} className={className}>{m.label}</Chip>;
};

/** Ô chọn nhiều bằng checkbox dạng chip. options: [{ value, label, hint }] */
export function ChipToggleGroup({ options, value, onChange, label, invalid }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => toggle(o.value)} disabled={o.disabled} title={o.hint}
            className={`min-h-[40px] px-3 rounded border text-body-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'border-primary-container bg-primary-fixed text-primary-container font-medium' : `${invalid ? 'border-status-rejected' : 'border-border-control'} bg-surface hover:bg-surface-container-low`}`}>
            <Icon name={on ? 'check_box' : 'check_box_outline_blank'} size={18} />
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Dòng lỗi kiểm tra dưới ô nhập. */
export const FieldError = ({ msg, id }) => (msg ? <p id={id} role="alert" className="mt-1 text-caption text-status-rejected flex items-start gap-1"><Icon name="error" size={14} className="mt-0.5" />{msg}</p> : null);

/** Công tắc bật/tắt. */
export const Switch = ({ checked, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-50 ${checked ? 'bg-status-active' : 'bg-border-control'}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);

/** Đếm ngược tới thời điểm until (ms); hết giờ gọi onEnd. Trả về số giây còn lại. */
export function useCountdown(until, onEnd) {
  const [left, setLeft] = useState(0);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (!until) { setLeft(0); return undefined; }
    const tick = () => { const l = Math.max(0, Math.ceil((until - Date.now()) / 1000)); setLeft(l); if (l === 0) end.current?.(); };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

/** Quyền theo vai trò: hiển thị thông báo thay cho trang khi không đủ quyền. */
export function RequirePerm({ perm, children }) {
  const { can, actor } = useApp();
  if (can(perm)) return children;
  return (
    <div className="card"><Empty icon="lock" title="Vai trò hiện tại không được xem trang này" desc={`${actor.name} chưa được cấp quyền. Đổi vai trò ở góc trên bên phải để mô phỏng tài khoản khác.`} /></div>
  );
}
