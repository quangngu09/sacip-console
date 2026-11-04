import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from './ui';
import { useApp } from '../store';
import { CURRENT_USER, TENANTS, ORG_UNITS, SUBJECT_TYPES } from '../data/mock';

const NAV = [
  { group: 'Vận hành', items: [
    { to: '/', icon: 'dashboard', label: 'Tổng quan', end: true },
    { to: '/ho-so', icon: 'face', label: 'Hồ sơ Face ID' },
    { to: '/yeu-cau', icon: 'move_to_inbox', label: 'Hộp yêu cầu', badge: 'requests' },
    { to: '/dong-y', icon: 'verified_user', label: 'Đồng ý (NĐ 13)' },
  ]},
  { group: 'Control Plane', items: [
    { to: '/khong-gian', icon: 'account_tree', label: 'Không gian & Zone' },
    { to: '/thiet-bi', icon: 'videocam', label: 'Thiết bị (CMDB)' },
    { to: '/thoi-khoa-bieu', icon: 'calendar_month', label: 'TKB & Điểm danh' },
    { to: '/chinh-sach', icon: 'policy', label: 'Rule & Chính sách' },
  ]},
  { group: 'Giám sát', items: [
    { to: '/soc', icon: 'shield_lock', label: 'SOC & Ngoại lệ', badge: 'soc' },
    { to: '/giam-sat-ai', icon: 'smart_toy', label: 'Giám sát AI' },
    { to: '/nhat-ky', icon: 'receipt_long', label: 'Nhật ký & Báo cáo' },
  ]},
];

function Sidebar() {
  const { requests } = useApp();
  const pending = requests.filter((r) => r.status === 'pending').length;
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-surface z-40 flex flex-col border-r border-border-subtle">
      <div className="h-14 px-space-md flex items-center gap-2 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white"><Icon name="fingerprint" size={20} /></div>
        <div className="min-w-0">
          <div className="text-label-md font-semibold leading-tight">SACIP Console</div>
          <div className="text-caption text-text-secondary truncate">DNU Capture Studio / BioCard Hub</div>
        </div>
      </div>
      <div className="px-space-md py-space-sm">
        <div className="p-1.5 rounded bg-surface-container-low border border-border-subtle flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-active" />
          <span className="text-caption text-text-secondary truncate">Policy Engine: Trực tuyến</span>
        </div>
      </div>
      <nav className="flex-1 px-space-sm overflow-y-auto pb-2">
        {NAV.map((g) => (
          <div key={g.group} className="mb-2">
            <div className="px-space-md pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-status-inactive">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end}
                className={({ isActive }) => `flex items-center gap-2 px-space-md py-2 rounded-lg text-label-md transition-colors ${isActive ? 'bg-primary-container text-white' : 'text-text-secondary hover:bg-surface-container-low hover:text-text-primary'}`}>
                {({ isActive }) => (<>
                  <Icon name={it.icon} size={20} />
                  <span className="truncate">{it.label}</span>
                  {it.badge === 'requests' && pending > 0 && <span className={`ml-auto px-1.5 rounded-full text-[11px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-status-pending/10 text-status-pending'}`}>{pending}</span>}
                  {it.badge === 'soc' && <span className={`ml-auto w-2 h-2 rounded-full bg-status-rejected ${isActive ? 'ring-2 ring-white/60' : ''}`} />}
                </>)}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="mx-space-sm mt-2 border-t border-border-subtle pt-3">
          <NavLink to="/kiosk" className="flex items-center gap-2 px-space-md py-2 rounded-lg text-label-md text-secondary bg-ai-surface hover:bg-secondary-fixed/40">
            <Icon name="photo_camera_front" size={20} /><span>Mở Kiosk Trạm chụp</span><Icon name="open_in_new" size={14} className="ml-auto" />
          </NavLink>
        </div>
      </nav>
      <div className="p-space-md border-t border-border-subtle flex items-center justify-between text-caption text-text-secondary">
        <span>Phiên bản v2.4.8</span>
        <span className="flex items-center gap-1 text-ai-border"><Icon name="lock" size={14} />Bảo mật</span>
      </div>
    </aside>
  );
}

function ScopeSelect({ icon, value, options, onChange }) {
  return (
    <label className="flex items-center gap-1 border border-border-subtle rounded-lg px-2.5 py-1 bg-surface-bright text-label-md">
      <Icon name={icon} size={18} className="text-text-secondary" />
      <select className="bg-transparent outline-none cursor-pointer pr-1 font-medium" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Notifications({ onClose }) {
  const { notifications, setNotifications } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState('unread');
  const list = notifications.filter((n) => tab === 'all' || (tab === 'unread' ? n.unread : n.alert));
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <div className="absolute right-0 top-11 w-96 bg-surface rounded-xl shadow-xl border border-border-subtle z-50 overflow-hidden anim-fade">
      <div className="p-3.5 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="notifications_active" size={20} className="text-primary-container" />
          <h4 className="text-label-md font-semibold">Thông báo hệ thống</h4>
          {unread > 0 && <span className="px-1.5 rounded-full bg-status-rejected/10 text-status-rejected text-[11px] font-bold">{unread} mới</span>}
        </div>
        <button className="text-caption text-primary-container hover:underline" onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })))}>Đánh dấu đã đọc tất cả</button>
      </div>
      <div className="flex gap-1 px-3 py-1.5 border-b border-border-subtle bg-surface-bright text-caption">
        {[['unread', `Chưa đọc (${unread})`], ['all', 'Tất cả'], ['alert', 'Kiểm toán & Cảnh báo']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1 rounded ${tab === k ? 'bg-surface font-medium shadow-soft border border-border-subtle' : 'text-text-secondary hover:text-text-primary'}`}>{l}</button>
        ))}
      </div>
      <div className="divide-y divide-border-subtle max-h-80 overflow-y-auto">
        {list.length === 0 && <div className="p-6 text-center text-caption text-text-secondary">Không có thông báo</div>}
        {list.map((n) => (
          <button key={n.id} className={`w-full text-left p-3 flex gap-2.5 hover:bg-surface-container-low ${n.unread ? 'bg-surface-container-low/50' : 'opacity-75'}`}
            onClick={() => { setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x))); onClose(); nav(n.alert ? '/soc' : '/yeu-cau'); }}>
            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.unread ? `bg-${n.color}` : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-1"><span className={`text-[13px] font-semibold ${n.alert ? 'text-status-rejected' : ''}`}>{n.title}</span><span className="text-[11px] text-text-secondary shrink-0">{n.time}</span></div>
              <p className="text-caption text-text-secondary mt-0.5">{n.body}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopBar() {
  const { scope, setScope, notifications, toast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unread = notifications.some((n) => n.unread);
  return (
    <header className="fixed top-0 left-[240px] right-0 h-14 bg-surface z-30 border-b border-border-subtle shadow-soft flex items-center justify-between px-space-md gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <ScopeSelect icon="account_balance" value={scope.tenant} options={TENANTS} onChange={(v) => setScope((s) => ({ ...s, tenant: v }))} />
        <ScopeSelect icon="apartment" value={scope.unit} options={ORG_UNITS} onChange={(v) => setScope((s) => ({ ...s, unit: v }))} />
        <ScopeSelect icon="badge" value={scope.subject} options={SUBJECT_TYPES} onChange={(v) => setScope((s) => ({ ...s, subject: v }))} />
        <form className="flex-1 min-w-[200px] max-w-sm" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get('q'); if (q) toast('Trợ lý tra cứu', `Đang tìm: “${q}” trong phạm vi ${scope.tenant}`); }}>
          <div className="flex items-center gap-2 border border-border-subtle rounded-lg px-3 py-1 bg-surface-bright focus-within:border-ai-border">
            <Icon name="auto_awesome" className="text-ai-border" />
            <input name="q" className="bg-transparent outline-none text-body-sm w-full placeholder:text-text-secondary" placeholder="Hỏi bằng ngôn ngữ tự nhiên..." />
            <kbd className="text-caption px-1.5 rounded bg-surface-container-high text-text-secondary border border-border-subtle">⌘K</kbd>
          </div>
        </form>
      </div>
      <div className="flex items-center gap-space-md shrink-0">
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ai-surface border border-ai-border text-ai-border text-label-sm whitespace-nowrap">
          <Icon name="shield" size={16} /><span className="font-medium">Kiểm toán: Ghi nhật ký đầy đủ</span>
        </div>
        <div className="relative" ref={ref}>
          <button className="relative p-1 rounded-lg text-text-secondary hover:bg-surface-container-low" onClick={() => setOpen((o) => !o)} aria-label="Thông báo">
            <Icon name="notifications" size={22} />
            {unread && <span className="w-2 h-2 rounded-full bg-status-rejected absolute top-1 right-1" />}
          </button>
          {open && <Notifications onClose={() => setOpen(false)} />}
        </div>
        <div className="h-5 w-px bg-border-subtle" />
        <div className="flex items-center gap-2.5">
          <div className="text-right"><div className="text-label-md font-medium leading-none">{CURRENT_USER.name}</div><div className="text-caption text-text-secondary mt-0.5">{CURRENT_USER.role}</div></div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white"><Icon name="person" /></div>
        </div>
      </div>
    </header>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="pl-[240px] pt-14">
        <div className="px-space-lg py-space-md"><Outlet /></div>
      </main>
    </div>
  );
}
