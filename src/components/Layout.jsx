import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Select } from './ui';
import { useApp } from '../store';
import { useResourceLoading } from '../lib/resource';
import { TENANT_OPTIONS, unitOptions, SUBJECT_OPTIONS } from '../lib/scope';
import { ROLES } from '../api/enums';
import logo from '../assets/logo-dnu.svg';
import logoMark from '../assets/logo-dnu-mark.svg';

// perm: quyền cần có để thấy mục menu (xem ROLES trong api/enums.js).
const NAV = [
  { group: 'Vận hành', items: [
    { to: '/', icon: 'dashboard', label: 'Tổng quan', end: true, perm: 'view' },
    { to: '/ho-so', icon: 'face', label: 'Hồ sơ định danh', perm: 'view' },
    { to: '/yeu-cau', icon: 'move_to_inbox', label: 'Hộp yêu cầu', badge: 'requests', perm: 'view' },
    { to: '/dong-y', icon: 'verified_user', label: 'Đồng ý & bảo mật', perm: 'consent' },
  ]},
  { group: 'Cấu hình', items: [
    { to: '/chinh-sach', icon: 'policy', label: 'Chính sách & quy tắc', perm: 'view' },
    { to: '/don-vi', icon: 'corporate_fare', label: 'Đơn vị tổ chức', perm: 'view' },
    { to: '/khong-gian', icon: 'account_tree', label: 'Không gian & khu vực', perm: 'view' },
    { to: '/thiet-bi', icon: 'videocam', label: 'Thiết bị', perm: 'view' },
    { to: '/tich-hop', icon: 'hub', label: 'Nguồn dữ liệu & tích hợp', badge: 'sources', perm: 'view' },
    { to: '/thoi-khoa-bieu', icon: 'calendar_month', label: 'Lịch học & điểm danh', perm: 'view' },
  ]},
  { group: 'Giám sát', items: [
    { to: '/soc', icon: 'shield_lock', label: 'An ninh & ngoại lệ', badge: 'soc', perm: 'security' },
    { to: '/giam-sat-ai', icon: 'smart_toy', label: 'Giám sát AI', perm: 'view' },
    { to: '/nhat-ky', icon: 'receipt_long', label: 'Kiểm toán & báo cáo', perm: 'audit' },
  ]},
];

function Sidebar() {
  const { requests, data, railCollapsed: collapsed, toggleRail, can } = useApp();
  const pending = requests.filter((r) => r.status === 'pending').length;
  const sourceIssue = data.sources.some((x) => x.status === 'ERROR');
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((it) => can(it.perm) || can('*')) })).filter((g) => g.items.length);
  const shape = `relative flex items-center h-9 rounded text-label-md transition-colors focus-visible:outline-white ${collapsed ? 'justify-center' : 'gap-2.5 px-2.5'}`;
  const toggleLabel = collapsed ? 'Mở rộng menu' : 'Thu gọn menu';
  return (
    <aside className={`fixed left-0 top-0 h-full ${collapsed ? 'w-16' : 'w-[240px]'} bg-rail z-40 flex flex-col overflow-hidden transition-[width] duration-200`}>
      {collapsed ? (
        <div className="h-14 shrink-0 bg-surface flex items-center justify-center border-b border-border-subtle">
          <img src={logoMark} alt="Trường Đại học Đại Nam" className="h-8 w-auto" />
        </div>
      ) : (
        <div className="h-14 shrink-0 px-3 bg-surface flex items-center gap-2.5 border-b border-border-subtle">
          <img src={logo} alt="Trường Đại học Đại Nam" className="h-8 w-auto" />
          <span className="w-px h-7 bg-border-strong" />
          <div className="text-label-sm font-semibold leading-tight text-primary-container">SACIP<br /><span className="font-normal text-text-secondary">Console</span></div>
        </div>
      )}
      <nav className="flex-1 px-space-sm overflow-y-auto overflow-x-hidden py-2">
        {groups.map((g, i) => (
          <div key={g.group} className="mb-3">
            {collapsed && i > 0 && <div className="mx-1 mb-3 border-t border-rail-line" />}
            <div className={collapsed ? 'sr-only' : 'px-2.5 pt-1 pb-1 text-caption text-rail-muted whitespace-nowrap'}>{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} title={collapsed ? it.label : undefined}
                className={({ isActive }) => `${shape} ${isActive ? 'bg-rail-active text-white shadow-[inset_3px_0_0_theme(colors.accent)]' : 'text-rail-text hover:bg-rail-hover hover:text-white'}`}>
                <Icon name={it.icon} size={18} />
                <span className={collapsed ? 'sr-only' : 'truncate'}>{it.label}</span>
                {it.badge === 'requests' && pending > 0 && <span className={`${collapsed ? 'absolute top-0 right-0.5 min-w-[16px] h-4 px-0.5' : 'ml-auto min-w-[20px] h-5 px-1'} rounded bg-accent text-on-accent text-caption font-semibold flex items-center justify-center`} aria-label={`${pending} yêu cầu chờ duyệt`}>{pending}</span>}
                {it.badge === 'sources' && sourceIssue && <span className={`${collapsed ? 'absolute top-1.5 right-2' : 'ml-auto'} w-2 h-2 rounded-full bg-rail-alert`} role="img" aria-label="Có nguồn dữ liệu lỗi đồng bộ" />}
                {it.badge === 'soc' && <span className={`${collapsed ? 'absolute top-1.5 right-2' : 'ml-auto'} w-2 h-2 rounded-full bg-rail-alert`} role="img" aria-label="Có sự kiện chưa xử lý" />}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="border-t border-rail-line pt-2">
          <NavLink to="/kiosk" title={collapsed ? 'Mở Kiosk trạm chụp' : undefined} className={`${shape} text-rail-text hover:bg-rail-hover hover:text-white`}>
            <Icon name="photo_camera_front" size={18} /><span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>Mở Kiosk trạm chụp</span>{!collapsed && <Icon name="open_in_new" size={14} className="ml-auto" />}
          </NavLink>
        </div>
      </nav>
      <div className="px-space-sm pt-2 border-t border-rail-line">
        <button type="button" onClick={toggleRail} aria-expanded={!collapsed} title={collapsed ? toggleLabel : undefined} className={`${shape} w-full text-rail-text hover:bg-rail-hover hover:text-white`}>
          <Icon name={collapsed ? 'left_panel_open' : 'left_panel_close'} size={18} />
          <span className={collapsed ? 'sr-only' : 'whitespace-nowrap'}>{toggleLabel}</span>
        </button>
      </div>
      {collapsed ? (
        <div className="h-9 flex items-center justify-center" title="Hệ thống trực tuyến • v2.4.8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" role="img" aria-label="Hệ thống trực tuyến" />
        </div>
      ) : (
        <div className="px-space-md py-2 flex items-center justify-between text-caption text-rail-muted whitespace-nowrap">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Hệ thống trực tuyến</span>
          <span className="font-mono">v2.4.8</span>
        </div>
      )}
    </aside>
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
          {unread > 0 && <span className="px-1.5 rounded-full bg-status-rejected/10 text-status-rejected text-caption font-bold">{unread} mới</span>}
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
            onClick={() => { setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x))); onClose(); nav(n.to || '/yeu-cau'); }}>
            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.unread ? `bg-${n.color}` : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-1"><span className={`text-label-md font-semibold ${n.alert ? 'text-status-rejected' : ''}`}>{n.title}</span><span className="text-caption text-text-secondary shrink-0">{n.time}</span></div>
              <p className="text-caption text-text-secondary mt-0.5">{n.body}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopBar() {
  const { scope, setScope, notifications, toast, railCollapsed, role, setRole, actor } = useApp();
  const { pathname } = useLocation();
  const onDashboard = pathname === '/';
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unread = notifications.some((n) => n.unread);
  return (
    <header className={`fixed top-0 ${railCollapsed ? 'left-16' : 'left-[240px]'} right-0 h-14 bg-surface z-30 border-b border-border-subtle flex items-center justify-between px-space-lg gap-3 transition-[left] duration-200`}>
      {onDashboard && (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Select variant="inline" label="Đơn vị chủ quản" value={scope.tenant} options={TENANT_OPTIONS} onChange={(v) => setScope((s) => ({ ...s, tenant: v }))} />
          <span className="text-border-strong" aria-hidden>/</span>
          <Select variant="inline" label="Khoa / Phòng ban" value={scope.unit} options={unitOptions()} onChange={(v) => setScope((s) => ({ ...s, unit: v }))} />
          <span className="text-border-strong" aria-hidden>/</span>
          <Select variant="inline" label="Đối tượng" value={scope.subject} options={SUBJECT_OPTIONS} onChange={(v) => setScope((s) => ({ ...s, subject: v }))} />
          <form className="flex-1 min-w-[200px] max-w-sm ml-3" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get('q'); if (q) toast('Trợ lý tra cứu', `Đang tìm: “${q}” trong phạm vi ${scope.tenant}`); }}>
            <div className="h-8 flex items-center gap-2 border border-border-control rounded px-2.5 bg-surface focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <Icon name="search" size={16} className="text-text-secondary" />
              <input name="q" aria-label="Tra cứu" className="bg-transparent outline-none text-body-sm w-full placeholder:text-text-secondary" placeholder="Tra cứu bằng ngôn ngữ tự nhiên" />
            </div>
          </form>
        </div>
      )}
      <div className="ml-auto flex items-center gap-space-md shrink-0">
        {onDashboard && (
          <>
            <span className="hidden 2xl:inline text-caption text-text-secondary whitespace-nowrap">Kiểm toán: Ghi nhật ký đầy đủ</span>
            <div className="relative" ref={ref}>
              <button className="relative p-1 rounded-lg text-text-secondary hover:bg-surface-container-low" onClick={() => setOpen((o) => !o)} aria-label="Thông báo">
                <Icon name="notifications" size={22} />
                {unread && <span className="w-2 h-2 rounded-full bg-status-rejected absolute top-1 right-1" />}
              </button>
              {open && <Notifications onClose={() => setOpen(false)} />}
            </div>
            <div className="h-5 w-px bg-border-subtle" />
          </>
        )}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-label-md font-medium leading-none">{actor.name}</div>
            <Select variant="inline" className="!h-6 !px-1 -mr-1 text-caption !font-normal text-text-secondary" label="Vai trò đăng nhập (mô phỏng)" value={role} onChange={(r) => { setRole(r); toast('Đã đổi tài khoản', `Đăng nhập với vai trò ${ROLES[r].label}. Menu và quyền thao tác thay đổi theo vai trò.`); }}
              options={Object.entries(ROLES).map(([value, m]) => ({ value, label: m.label }))} />
          </div>
          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-label-sm font-semibold" aria-hidden>{actor.name.split(' ').slice(-2).map((w) => w[0]).join('')}</div>
        </div>
      </div>
    </header>
  );
}

function TopLoader() {
  const loading = useResourceLoading();
  if (!loading) return null;
  return <div className="fixed top-0 inset-x-0 h-0.5 z-[45] overflow-hidden" aria-hidden><div className="top-loader h-full w-2/5 bg-accent" /></div>;
}

export default function Layout() {
  const main = useRef();
  const { railCollapsed } = useApp();
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    window.scrollTo(0, 0);
    main.current.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <div className="min-h-screen">
      <button className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[90] btn-primary" onClick={() => main.current.focus()}>Bỏ qua menu, đến nội dung chính</button>
      <TopLoader />
      <Sidebar />
      <TopBar />
      <main ref={main} tabIndex={-1} className={`${railCollapsed ? 'pl-16' : 'pl-[240px]'} pt-14 outline-none transition-[padding] duration-200`}>
        <div key={pathname} className="anim-page mx-auto max-w-[1680px] px-space-lg py-space-md"><Outlet /></div>
      </main>
    </div>
  );
}
