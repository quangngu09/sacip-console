import { useMemo, useState } from 'react';
import { Icon, Chip, StatusDot, ScoreBar, FaceThumb, Drawer, ConfirmReason, AiCard, Empty } from '../components/ui';
import { useApp } from '../store';
import { STATUS_META } from '../data/mock';

const VIEWS = [
  { key: 'all', label: 'Tất cả', count: '24,850', f: () => true },
  { key: 'none', label: 'Chưa thu thập', count: '1,420', f: (p) => p.status === 'none' },
  { key: 'pending', label: 'Chờ xác nhận', count: '342', f: (p) => p.status === 'pending', tone: 'status-pending' },
  { key: 'quality', label: 'Lỗi chất lượng', count: '86', f: (p) => p.status === 'quality' || p.status === 'locked', tone: 'status-rejected' },
  { key: 'expiring', label: 'Sắp hết hạn', count: '115', f: (p) => p.expiring, tone: 'status-pending' },
];

const typeColor = { 'Sinh viên': 'primary', 'Giảng viên': 'secondary', 'Cư dân KTX': 'primary', 'Cán bộ': 'neutral', 'NV thuê ngoài': 'status-inactive' };

export default function Profiles() {
  const { profiles, setProfiles, log, toast, scope } = useApp();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set(['SV-2023-8891', 'SV-2024-1102', 'KTX-2023-441']));
  const [chips, setChips] = useState(['Khóa K2021-K2024', 'Đang theo học']);
  const [detail, setDetail] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [aiDismissed, setAiDismissed] = useState(false);

  const rows = useMemo(() => {
    const v = VIEWS.find((x) => x.key === view);
    const subj = scope.subject.startsWith('Đối tượng') ? null : scope.subject;
    return profiles.filter(v.f).filter((p) => !subj || p.type === subj).filter((p) => !q || `${p.id} ${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  }, [profiles, view, q, scope.subject]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  const BULK = [
    { key: 'rescan', icon: 'replay', label: 'Yêu cầu chụp lại' },
    { key: 'activate', icon: 'check_circle', label: 'Kích hoạt hiệu lực' },
    { key: 'policy', icon: 'vpn_key', label: 'Gán chính sách truy cập' },
    { key: 'lock', icon: 'block', label: 'Khóa tạm thời', danger: true },
    { key: 'notify', icon: 'forward_to_inbox', label: 'Gửi thông báo' },
  ];

  const runBulk = (reason) => {
    const ids = [...selected];
    if (bulk.key === 'lock') setProfiles((ps) => ps.map((p) => (selected.has(p.id) ? { ...p, status: 'locked', validity: 'Đã vô hiệu hóa' } : p)));
    if (bulk.key === 'activate') setProfiles((ps) => ps.map((p) => (selected.has(p.id) && p.status === 'pending' ? { ...p, status: 'collected', validity: '30/06/2027' } : p)));
    log(`${bulk.label} (hàng loạt: ${ids.length} hồ sơ) — ${reason}`, ids.join(', '));
    toast(bulk.label, `Đã áp dụng cho ${ids.length} hồ sơ. Đã ghi vào Audit Trail.`, 'success');
    setBulk(null);
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Privacy banner */}
      <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container"><Icon name="encrypted" size={20} /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-label-md font-semibold">Quy chuẩn Bảo vệ Dữ liệu Cá nhân & Sinh trắc học (Nghị định 13/2023/NĐ-CP)</span>
              <Chip color="status-active">Vector 512d mã hóa AES-256</Chip>
            </div>
            <p className="text-caption text-text-secondary">Admin Core chỉ lưu ánh xạ Person_ID ↔ Vector Embedding (pgvector). Mọi thao tác giải mờ hoặc trích xuất đều tạo bản ghi kiểm toán bất biến.</p>
          </div>
        </div>
        <span className="text-caption text-ai-border flex items-center gap-1 shrink-0"><Icon name="verified_user" size={16} />Phiên kiểm toán: #AUD-2025-90412</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-space-sm">
          <h1 className="text-headline-lg">Hồ sơ Face ID</h1>
          <Chip color="primary" className="text-label-sm">Tổng cộng: 24,850 hồ sơ</Chip>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => { log('Xuất danh sách kiểm toán (không kèm ảnh)', 'Hồ sơ Face ID'); toast('Đã tạo danh sách kiểm toán', 'Tệp chỉ chứa metadata — không bao gồm ảnh khuôn mặt.', 'success'); }}><Icon name="history_toggle_off" className="text-text-secondary" />Xuất danh sách kiểm toán</button>
          <button className="btn-outline" onClick={() => toast('Đồng bộ IAM', 'Đã đồng bộ vòng đời định danh từ IAM (nhập học / bảo lưu / thôi học).', 'success')}><Icon name="sync" className="text-text-secondary" />Đồng bộ IAM</button>
          <button className="btn-primary" onClick={() => toast('Thêm hồ sơ', 'Hồ sơ mới được tạo từ IAM; ảnh thu nhận qua App MyDaiNam hoặc Kiosk.')}><Icon name="person_add" />Thêm mới hồ sơ</button>
        </div>
      </div>

      {/* Saved views */}
      <div className="flex items-center justify-between bg-surface px-space-sm pt-1 rounded-xl shadow-soft">
        <div className="flex items-center gap-space-md">
          {VIEWS.map((v) => (
            <button key={v.key} onClick={() => setView(v.key)} className={`pb-2.5 pt-1.5 px-space-sm text-label-md whitespace-nowrap flex items-center gap-1.5 border-b-2 ${view === v.key ? 'text-primary-container font-semibold border-primary-container' : 'text-text-secondary border-transparent hover:text-text-primary'}`}>
              {v.label}
              <span className={`px-1.5 rounded-full text-[11px] font-semibold ${{ 'status-pending': 'bg-status-pending/10 text-status-pending', 'status-rejected': 'bg-status-rejected/10 text-status-rejected' }[v.tone] || 'bg-primary-container/10 text-primary-container'}`}>{v.count}</span>
            </button>
          ))}
          <button className="pb-2.5 pt-1.5 px-space-sm text-ai-border text-label-md whitespace-nowrap flex items-center gap-1" onClick={() => toast('Tạo góc nhìn', 'Lưu tổ hợp bộ lọc hiện tại thành tab mới.')}><Icon name="add_circle" size={16} />Tạo góc nhìn</button>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-2 top-2 text-text-secondary" />
            <input className="input w-64 h-8 pl-8" placeholder="Tìm theo Mã số, Tên, Email..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="h-8 px-2 rounded-lg bg-surface-bright hover:bg-surface-container-low text-text-secondary" title="Cột hiển thị"><Icon name="view_column" /></button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-space-xs">
        {[['Trạng thái', 'Tất cả thu thập'], ['Hiệu lực', 'Còn hiệu lực'], ['Nguồn', 'Tất cả nguồn'], ['Cờ rủi ro', 'Tất cả']].map(([k, v]) => (
          <div key={k} className="h-8 px-2.5 rounded-lg bg-surface hover:bg-surface-container-low text-label-sm shadow-soft flex items-center gap-1.5 cursor-pointer">
            {k === 'Cờ rủi ro' && <span className="w-1.5 h-1.5 rounded-full bg-status-rejected" />}
            <span className="text-text-secondary">{k}:</span><span className="font-medium">{v}</span><Icon name="arrow_drop_down" size={16} className="text-text-secondary" />
          </div>
        ))}
        {chips.map((c) => (
          <div key={c} className="h-8 px-2.5 rounded-full bg-surface text-label-sm shadow-soft flex items-center gap-1.5">
            <span className="font-medium">{c}</span>
            <button onClick={() => setChips((cs) => cs.filter((x) => x !== c))} aria-label={`Bỏ lọc ${c}`} className="text-text-secondary hover:text-status-rejected"><Icon name="close" size={16} /></button>
          </div>
        ))}
        <button className="h-8 px-2.5 rounded-lg bg-surface-container-high text-primary-container text-label-sm font-medium flex items-center gap-1"><Icon name="tune" size={16} />+ Bộ lọc nâng cao (AND/OR)</button>
        <button className="h-8 px-2 text-text-secondary hover:text-status-rejected text-label-sm flex items-center gap-1" onClick={() => { setChips([]); setView('all'); setQ(''); }}><Icon name="restart_alt" size={16} />Đặt lại tất cả</button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-20 p-space-sm bg-primary-container text-white rounded-xl shadow-lg flex items-center justify-between anim-fade">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center gap-2 text-label-md font-semibold"><Icon name="check_box" size={20} />Đã chọn {selected.size} hồ sơ</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex gap-1">
              {BULK.map((b) => (
                <button key={b.key} onClick={() => setBulk(b)} className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-label-sm whitespace-nowrap flex items-center gap-1.5"><Icon name={b.icon} size={16} />{b.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="hidden 2xl:flex text-white/70 text-caption items-center gap-1"><Icon name="shield" size={14} />Không cho phép xuất ảnh hàng loạt</span>
            <button onClick={() => setSelected(new Set())} className="h-7 px-2 rounded hover:bg-white/20 text-label-sm whitespace-nowrap flex items-center gap-1"><Icon name="close" size={16} />Hủy chọn</button>
          </div>
        </div>
      )}

      {/* AI suggestion */}
      {!aiDismissed && (
        <div className="p-space-sm bg-ai-surface border border-ai-border/40 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-space-sm">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0"><Icon name="smart_toy" /></div>
            <p className="text-body-sm">
              <span className="text-label-md text-secondary font-semibold">Gợi ý của AI – người duyệt quyết định: </span>
              Hồ sơ <strong>SV-2024-1102 (Lê Minh Khôi)</strong> có độ chói cao ở vùng trán (specular 38%) và góc nghiêng 22°. Khuyến nghị gửi yêu cầu chụp lại tại Kiosk trạm 01/02.
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button className="h-7 px-2.5 rounded-lg bg-secondary text-white text-label-sm hover:opacity-90" onClick={() => { log('Duyệt gợi ý AI: Yêu cầu chụp lại', 'SV-2024-1102'); toast('Đã tạo yêu cầu chụp lại', 'SV-2024-1102 — quyết định bởi cán bộ duyệt.', 'success'); setAiDismissed(true); }}>Duyệt gợi ý: Yêu cầu chụp lại</button>
            <button className="h-7 px-2 text-text-secondary hover:text-text-primary text-label-sm" onClick={() => setAiDismissed(true)}>Bỏ qua</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-260px)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-bright sticky top-0 z-10">
              <tr className="h-10 text-text-secondary text-[12px] uppercase tracking-wider">
                <th className="w-10 px-3 text-center"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-primary-container" aria-label="Chọn tất cả" /></th>
                {['Mã đối tượng', 'Họ tên & Ảnh Face ID', 'Phân loại', 'Đơn vị / Khoa', 'Nguồn dữ liệu', 'Trạng thái thu thập', 'Thời hạn hiệu lực', 'Điểm AI (ICAO)', 'Cờ rủi ro'].map((h) => <th key={h} className="px-3 font-medium whitespace-nowrap">{h}</th>)}
                <th className="px-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-body-sm">
              {rows.map((p) => {
                const st = STATUS_META[p.status];
                return (
                  <tr key={p.id} className={`h-12 border-t border-border-subtle/60 hover:bg-surface-container-low transition-colors ${selected.has(p.id) ? 'bg-surface-container-low/60' : ''}`}>
                    <td className="px-3 text-center"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 accent-primary-container" aria-label={`Chọn ${p.id}`} /></td>
                    <td className="px-3 font-mono text-label-md font-semibold whitespace-nowrap">{p.id}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-space-sm">
                        <FaceThumb seed={p.seed} missing={p.status === 'none'} />
                        <div className="min-w-0"><div className="text-label-md font-semibold truncate">{p.name}</div><div className="text-caption text-text-secondary truncate">{p.email}</div></div>
                      </div>
                    </td>
                    <td className="px-3"><Chip color={typeColor[p.type]} className="text-[12px] whitespace-nowrap">{p.type}</Chip></td>
                    <td className="px-3 whitespace-nowrap">{p.unit}</td>
                    <td className="px-3">{p.source ? <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] whitespace-nowrap">{p.source}</span> : <span className="text-text-secondary">—</span>}</td>
                    <td className="px-3 whitespace-nowrap"><StatusDot color={st.color} label={st.label} /></td>
                    <td className="px-3 text-[12px] whitespace-nowrap">{p.expiring ? <Chip color="status-pending">{p.validity}</Chip> : <span className={p.status === 'locked' ? 'text-status-rejected font-medium' : p.status === 'quality' ? 'text-status-pending font-medium' : p.validity ? '' : 'text-text-secondary'}>{p.validity || '—'}</span>}</td>
                    <td className="px-3"><ScoreBar value={p.score} /></td>
                    <td className="px-3">{p.risk ? <Chip color="status-rejected" icon="warning" className="whitespace-nowrap">{p.risk}</Chip> : <span className="text-caption text-text-secondary whitespace-nowrap">{p.status === 'none' ? 'Chưa chụp ảnh' : 'Không có'}</span>}</td>
                    <td className="px-3 text-right whitespace-nowrap">
                      {p.status === 'none'
                        ? <button className="h-8 px-2 rounded hover:bg-surface-container text-primary-container text-label-sm font-medium" onClick={() => { log('Gửi nhắc nhở thu thập Face ID', p.id); toast('Đã gửi nhắc nhở', `${p.name} sẽ nhận thông báo qua App MyDaiNam.`, 'success'); }}>Gửi nhắc nhở</button>
                        : <button className="h-8 px-2 rounded hover:bg-surface-container text-primary-container text-label-sm font-medium" onClick={() => { setDetail(p); log('Mở xem chi tiết hồ sơ', p.id, 'view'); }}>Chi tiết</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty icon="search_off" title="Không có hồ sơ phù hợp" desc="Thử bỏ bớt bộ lọc hoặc thay đổi phạm vi ở thanh trên cùng." />}
        </div>
        <div className="h-14 px-space-md border-t border-border-subtle flex items-center justify-between text-body-sm text-text-secondary">
          <span>Hiển thị <strong className="text-text-primary font-medium">1 - {rows.length}</strong> trong tổng số <strong className="text-text-primary font-medium">24,850</strong> hồ sơ</span>
          <div className="flex items-center gap-1">
            <button className="h-8 px-2.5 rounded-lg text-status-inactive text-label-sm flex items-center gap-1" disabled><Icon name="chevron_left" size={16} />Trang trước</button>
            {['1', '2', '3'].map((n) => <button key={n} className={`h-8 w-8 rounded-lg text-label-sm ${n === '1' ? 'bg-primary-container text-white font-semibold' : 'hover:bg-surface-container text-text-primary'}`}>{n}</button>)}
            <span className="px-1">…</span><button className="h-8 px-2 rounded-lg hover:bg-surface-container text-text-primary font-mono text-label-sm">994</button>
            <button className="h-8 px-2.5 rounded-lg hover:bg-surface-container text-text-primary text-label-sm flex items-center gap-1">Trang sau<Icon name="chevron_right" size={16} /></button>
          </div>
        </div>
      </div>

      <ProfileDrawer profile={detail} onClose={() => setDetail(null)} />
      <ConfirmReason open={!!bulk} onClose={() => setBulk(null)} onConfirm={runBulk} danger={bulk?.danger}
        title={bulk?.label} subtitle={`Áp dụng cho ${selected.size} hồ sơ đã chọn`} confirmLabel="Xác nhận áp dụng">
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Danh sách: <span className="font-mono text-caption">{[...selected].join(', ')}</span></div>
      </ConfirmReason>
    </div>
  );
}

const POSES = [
  ['Trực diện', 64, 'Chói'], ['Chúc 15°', 88, 'Đạt'], ['Ngửa 15°', 92, 'Đạt'],
  ['Nghiêng T 20°', 85, 'Đạt'], ['Nghiêng P 20°', 81, 'Ổn'], ['Đỉnh đầu', 90, 'Đạt'],
];

function ProfileDrawer({ profile, onClose }) {
  const { log, toast, setProfiles } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [confirm, setConfirm] = useState(null);
  if (!profile) return null;
  const base = profile.score ?? 80;
  const poses = POSES.map(([n, s, l], i) => [n, i === 0 ? base : Math.min(99, s + (base > 85 ? 6 : 0)), i === 0 && base >= 85 ? 'Đạt' : l]);
  const scoreColor = (s) => (s >= 85 ? 'text-status-active' : s >= 70 ? 'text-status-pending' : 'text-status-rejected');
  const close = () => { setRevealed(false); onClose(); };

  const act = (kind, reason) => {
    if (kind === 'reveal') { setRevealed(true); log(`Xem rõ ảnh khuôn mặt — ${reason}`, profile.id, 'sensitive'); toast('Đã giải mờ ảnh', 'Thao tác đã được ghi vào Audit Trail.', 'warn'); }
    if (kind === 'lock') { setProfiles((ps) => ps.map((p) => (p.id === profile.id ? { ...p, status: 'locked', validity: 'Đã vô hiệu hóa' } : p))); log(`Khóa hồ sơ — ${reason}`, profile.id); toast('Đã khóa hồ sơ', profile.id, 'success'); close(); }
    if (kind === 'revoke') { log(`Thu hồi quyền Face ID — ${reason}`, profile.id); toast('Đã gửi yêu cầu thu hồi', 'Cần cán bộ thứ 2 xác nhận.', 'warn'); close(); }
    if (kind === 'rescan') { log(`Tạo yêu cầu chụp lại — ${reason}`, profile.id); toast('Đã tạo yêu cầu chụp lại', profile.id, 'success'); close(); }
    setConfirm(null);
  };

  return (
    <Drawer open onClose={close}>
      <div className="px-space-md py-space-sm border-b border-border-subtle flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-label-md font-semibold"><Icon name="badge" size={20} className="text-primary-container" />Chi tiết Hồ sơ Face ID</span>
          <div className="flex gap-1">
            <button className="p-1 rounded-lg hover:bg-surface-container-low text-text-secondary" title="In báo cáo"><Icon name="print" /></button>
            <button className="p-1 rounded-lg hover:bg-surface-container-low text-text-secondary" onClick={close} title="Đóng (Esc)"><Icon name="close" size={20} /></button>
          </div>
        </div>
        <div className="flex items-start justify-between">
          <div><div className="flex items-baseline gap-2"><h2 className="text-headline-md font-bold">{profile.name}</h2><span className="font-mono text-label-sm text-text-secondary">{profile.id}</span></div><span className="text-caption text-text-secondary">{profile.unit}</span></div>
          <Chip color={typeColor[profile.type]} className="text-[12px]">{profile.type}</Chip>
        </div>
        <div className="flex justify-between text-caption pt-1 border-t border-border-subtle"><StatusDot color={STATUS_META[profile.status].color} label={STATUS_META[profile.status].label} /><span className="text-text-secondary">Đại học Đại Nam</span></div>
      </div>

      <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-md">
        <section className="rounded-xl border border-border-subtle p-space-sm bg-surface-container-low/50">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5 text-label-md font-semibold"><Icon name="lock" className="text-primary-container" />Dữ liệu ảnh khuôn mặt</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-text-secondary font-mono text-[11px]">6 góc chụp</span>
          </div>
          <p className="text-caption text-text-secondary mb-2">Ảnh gốc được làm mờ mặc định. Admin Core chỉ giữ vector đã mã hóa; ảnh hiển thị lấy từ kho đối soát có thời hạn.</p>
          <div className="mb-2 p-1.5 bg-surface rounded-lg border border-border-subtle flex items-center justify-between">
            <span className="flex items-center gap-2 text-caption text-text-secondary"><Icon name="shield" className="text-ai-border" />Mở khóa ảnh tạo bản ghi kiểm toán bất biến.</span>
            {revealed
              ? <button className="h-7 px-2.5 rounded bg-surface-container text-[12px] font-medium flex items-center gap-1" onClick={() => setRevealed(false)}><Icon name="visibility_off" size={15} />Làm mờ lại</button>
              : <button className="h-7 px-2.5 rounded bg-primary-container text-white text-[12px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1" onClick={() => setConfirm('reveal')}><Icon name="visibility" size={15} />Xem rõ (sẽ được ghi log)</button>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {poses.map(([n, s, l], i) => (
              <div key={n} className="flex flex-col items-center bg-surface p-1.5 rounded-lg border border-border-subtle text-center">
                <div className="mb-1"><FaceThumb seed={profile.seed + i * 0.15} size={80} round={false} revealed={revealed} /></div>
                <span className="text-[11px] font-semibold">{i + 1}. {n}</span>
                <span className={`text-[10px] font-medium ${scoreColor(s)}`}>{s}/100 ({l})</span>
              </div>
            ))}
          </div>
        </section>

        <AiCard>
          <div className="space-y-1.5">
            {poses.map(([n, s]) => (
              <div key={n} className="p-2 bg-surface rounded-lg border border-border-subtle flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${s >= 85 ? 'bg-status-active' : s >= 70 ? 'bg-status-pending' : 'bg-status-rejected'}`} />{n}: <b className={`font-mono ${scoreColor(s)}`}>{s}/100</b></span>
                <span className={scoreColor(s)}>{s >= 85 ? 'Đạt chuẩn' : s >= 70 ? 'Chấp nhận được' : 'Lỗi: chói trán 38%, nghiêng 22°'}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-surface rounded-lg border border-border-subtle"><div className="text-[11px] text-text-secondary">Đối sánh 1:1 CCCD</div><div className="font-mono font-bold text-status-active">94.2%</div></div>
            <div className="p-2 bg-surface rounded-lg border border-border-subtle"><div className="text-[11px] text-text-secondary">Liveness / Anti-spoofing</div><div className={`font-mono font-bold ${profile.risk?.includes('Spoof') ? 'text-status-rejected' : 'text-status-active'}`}>{profile.risk?.includes('Spoof') ? 'FAIL (42%)' : 'PASS (99.4%)'}</div></div>
          </div>
          <div className="flex justify-between text-[11px] text-text-secondary pt-2"><span>SCRFD + ArcFace (buffalo_l) • Quality Gating v3.2</span><span className="italic text-secondary">AI khuyến nghị, người duyệt quyết định</span></div>
        </AiCard>

        <section className="rounded-xl border border-border-subtle p-space-sm">
          <div className="text-label-md font-semibold mb-2 flex items-center gap-1.5"><Icon name="history" className="text-primary-container" />Lịch sử phiên bản</div>
          <div className="space-y-3 pl-4 border-l-2 border-border-subtle ml-2 text-[12px]">
            <div className="relative"><span className="w-2.5 h-2.5 rounded-full bg-status-pending absolute -left-[22px] top-1" /><b>v2.0 (Hiện tại)</b> <Chip color="status-pending">Chờ duyệt</Chip><div className="text-[11px] text-text-secondary">14:32 25/10/2025 • Kiosk số 03 (Phiên #TR3-2025-041)</div></div>
            <div className="relative"><span className="w-2.5 h-2.5 rounded-full bg-status-inactive absolute -left-[22px] top-1" /><span className="text-text-secondary">v1.0 (Lưu trữ)</span><div className="text-[11px] text-text-secondary">15/09/2023 • App MyDaiNam (đã thay thế)</div></div>
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle p-space-sm">
          <div className="text-label-md font-semibold mb-1.5 flex items-center gap-1.5"><Icon name="verified_user" className="text-status-active" />Tình trạng đồng ý (NĐ 13/2023)</div>
          <div className="p-2 rounded-lg bg-surface-bright border border-border-subtle text-[12px] space-y-1">
            <div className="flex justify-between"><span className="font-medium">Cam kết xử lý dữ liệu sinh trắc:</span><Chip color="status-active">Đã ký điện tử</Chip></div>
            <div className="text-[11px] text-text-secondary"><b className="text-text-primary">Mục đích hợp lệ:</b> Điểm danh giảng đường, kiểm soát ra vào, phát hành thẻ.</div>
          </div>
        </section>
      </div>

      <div className="p-space-md border-t border-border-subtle flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
          <button className="btn-outline h-9" onClick={() => setConfirm('lock')}><Icon name="lock" size={16} />Khóa</button>
          <button className="btn h-9 border border-status-rejected/30 text-status-rejected hover:bg-status-rejected/10" onClick={() => setConfirm('revoke')}><Icon name="cancel" size={16} />Thu hồi</button>
          <button className="btn-primary h-9 flex-1 justify-center" onClick={() => setConfirm('rescan')}><Icon name="add_task" size={16} />Tạo yêu cầu chụp lại</button>
        </div>
        <div className="text-center text-[11px] text-text-secondary flex items-center justify-center gap-1"><Icon name="verified" size={13} className="text-ai-border" />Thao tác của cán bộ sẽ được ký số và lưu vết.</div>
      </div>

      <ConfirmReason open={!!confirm} onClose={() => setConfirm(null)} onConfirm={(r) => act(confirm, r)} danger={confirm === 'revoke' || confirm === 'lock'}
        title={{ reveal: 'Xem rõ ảnh khuôn mặt', lock: 'Khóa tạm thời hồ sơ', revoke: 'Thu hồi quyền Face ID', rescan: 'Tạo yêu cầu chụp lại' }[confirm]}
        subtitle={`${profile.name} • ${profile.id}`} minLength={confirm === 'reveal' ? 5 : 10}>
        {confirm === 'revoke' && <div className="p-3 rounded-lg bg-status-rejected/10 text-body-sm text-status-rejected">Thu hồi cần <b>2 cán bộ</b> xác nhận. Yêu cầu sẽ chuyển sang hộp duyệt.</div>}
      </ConfirmReason>
    </Drawer>
  );
}
