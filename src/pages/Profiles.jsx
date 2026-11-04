import { useMemo, useState } from 'react';
import { Icon, Chip, StatusDot, ScoreBar, FaceThumb, Drawer, ConfirmReason, AiCard, Empty, PageHeader, SearchInput, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { STATUS_META } from '../data/mock';

const VIEWS = [
  { key: 'all', label: 'Tất cả', count: '24,850', f: () => true },
  { key: 'none', label: 'Chưa thu thập', count: '1,420', f: (p) => p.status === 'none' },
  { key: 'pending', label: 'Chờ xác nhận', count: '342', f: (p) => p.status === 'pending', tone: 'status-pending' },
  { key: 'quality', label: 'Lỗi chất lượng', count: '86', f: (p) => p.status === 'quality' || p.status === 'locked', tone: 'status-rejected' },
  { key: 'expiring', label: 'Sắp hết hạn', count: '115', f: (p) => p.expiring, tone: 'status-pending' },
];

const STATUS_OPTIONS = [{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))];
const VALIDITY_OPTIONS = [{ value: 'all', label: 'Tất cả hiệu lực' }, { value: 'valid', label: 'Còn hiệu lực' }, { value: 'expiring', label: 'Sắp hết hạn' }, { value: 'waiting', label: 'Đang chờ xử lý' }, { value: 'off', label: 'Đã vô hiệu hóa' }, { value: 'blank', label: 'Chưa có' }];
const RISK_OPTIONS = [{ value: 'all', label: 'Tất cả rủi ro' }, { value: 'yes', label: 'Có cờ rủi ro' }, { value: 'no', label: 'Không có cờ' }];
const NO_FILTERS = { status: 'all', validity: 'all', source: 'all', risk: 'all' };

const matchValidity = (p, v) => ({
  all: true,
  valid: p.expiring || /^\d{2}\/\d{2}\/\d{4}$/.test(p.validity || ''),
  expiring: !!p.expiring,
  waiting: /^Chờ/.test(p.validity || ''),
  off: p.status === 'locked',
  blank: !p.validity,
})[v];

const validityClass = (p) => (p.status === 'locked' ? 'text-status-rejected font-medium' : p.expiring || p.status === 'quality' ? 'text-status-pending font-medium' : p.validity ? '' : 'text-text-secondary');

const BULK = [
  { key: 'rescan', icon: 'replay', label: 'Yêu cầu chụp lại' },
  { key: 'activate', icon: 'check_circle', label: 'Kích hoạt hiệu lực' },
  { key: 'policy', icon: 'vpn_key', label: 'Gán quyền truy cập' },
  { key: 'notify', icon: 'forward_to_inbox', label: 'Gửi thông báo' },
  { key: 'lock', icon: 'block', label: 'Khóa tạm thời', danger: true },
];

export default function Profiles() {
  const { profiles, setProfiles, log, toast, scope } = useApp();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [bulk, setBulk] = useState(null);

  const sourceOptions = useMemo(() => [{ value: 'all', label: 'Tất cả nguồn' }, ...[...new Set(profiles.map((p) => p.source).filter(Boolean))].map((s) => ({ value: s, label: s })), { value: 'blank', label: 'Chưa có nguồn' }], [profiles]);

  const rows = useMemo(() => {
    const v = VIEWS.find((x) => x.key === view);
    const subj = scope.subject.startsWith('Đối tượng') ? null : scope.subject;
    const f = filters;
    return profiles.filter(v.f)
      .filter((p) => !subj || p.type === subj)
      .filter((p) => f.status === 'all' || p.status === f.status)
      .filter((p) => matchValidity(p, f.validity))
      .filter((p) => f.source === 'all' || (f.source === 'blank' ? !p.source : p.source === f.source))
      .filter((p) => f.risk === 'all' || (f.risk === 'yes' ? !!p.risk : !p.risk))
      .filter((p) => !q || `${p.id} ${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  }, [profiles, view, q, scope.subject, filters]);

  const narrowed = view !== 'all' || !!q || !!Object.values(filters).find((x) => x !== 'all') || !scope.subject.startsWith('Đối tượng');
  const canReset = view !== 'all' || !!q || !!Object.values(filters).find((x) => x !== 'all');
  const reset = () => { setFilters(NO_FILTERS); setView('all'); setQ(''); };
  const setFilter = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const open = (p) => { setDetail(p); log('Mở xem chi tiết hồ sơ', p.id, 'view'); };

  const runBulk = (reason) => {
    const ids = [...selected];
    if (bulk.key === 'lock') setProfiles((ps) => ps.map((p) => (selected.has(p.id) ? { ...p, status: 'locked', validity: 'Đã vô hiệu hóa' } : p)));
    if (bulk.key === 'activate') setProfiles((ps) => ps.map((p) => (selected.has(p.id) && p.status === 'pending' ? { ...p, status: 'collected', validity: '30/06/2027' } : p)));
    log(`${bulk.label} (hàng loạt: ${ids.length} hồ sơ) — ${reason}`, ids.join(', '));
    toast(bulk.label, `Đã áp dụng cho ${ids.length} hồ sơ và ghi vào nhật ký kiểm toán.`, 'success');
    setBulk(null);
    setSelected(new Set());
  };

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Hồ sơ Face ID" desc="Ảnh luôn được làm mờ; xem rõ phải nêu lý do và được ghi nhật ký (NĐ 13/2023)."
        actions={<>
          <button className="btn-outline" onClick={() => { log('Xuất danh sách kiểm toán (không kèm ảnh)', 'Hồ sơ Face ID'); toast('Đã tạo danh sách kiểm toán', 'Tệp chỉ chứa thông tin hồ sơ, không có ảnh khuôn mặt.', 'success'); }}><Icon name="download" />Xuất danh sách</button>
          <button className="btn-outline" onClick={() => toast('Đồng bộ IAM', 'Đã đồng bộ vòng đời định danh từ IAM (nhập học / bảo lưu / thôi học).', 'success')}><Icon name="sync" />Đồng bộ IAM</button>
          <button className="btn-primary" onClick={() => toast('Thêm hồ sơ', 'Hồ sơ mới được tạo từ IAM; ảnh thu nhận qua App MyDaiNam hoặc Kiosk.')}><Icon name="person_add" />Thêm hồ sơ</button>
        </>} />

      <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
        <Tabs label="Nhóm hồ sơ" className="px-2 border-b border-border-subtle shrink-0" value={view} onChange={setView} items={VIEWS} />

        {selected.size > 0 ? (
          <div className="min-h-[64px] px-3 py-2 bg-primary-fixed border-b border-border-subtle flex items-center gap-2 shrink-0 anim-fade" role="region" aria-label="Thao tác hàng loạt">
            <span className="text-label-md font-semibold text-primary-container mr-2 whitespace-nowrap">Đã chọn {selected.size} hồ sơ</span>
            {BULK.map((b) => <button key={b.key} onClick={() => setBulk(b)} className={`${b.danger ? 'btn-danger' : 'btn-outline'} btn-sm`}><Icon name={b.icon} size={16} />{b.label}</button>)}
            <button onClick={() => setSelected(new Set())} className="btn-sm btn ml-auto text-text-secondary hover:bg-surface-container"><Icon name="close" size={16} />Bỏ chọn</button>
          </div>
        ) : (
          <div className="min-h-[64px] px-3 py-3 border-b border-border-subtle flex items-center gap-2 shrink-0">
            <SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm theo mã số, tên, email" />
            <Select className="!w-[158px]" label="Trạng thái" value={filters.status} options={STATUS_OPTIONS} onChange={setFilter('status')} />
            <Select className="!w-[148px]" label="Hiệu lực" value={filters.validity} options={VALIDITY_OPTIONS} onChange={setFilter('validity')} />
            <Select className="!w-[148px]" label="Nguồn dữ liệu" value={filters.source} options={sourceOptions} onChange={setFilter('source')} />
            <Select className="!w-[140px]" label="Cờ rủi ro" value={filters.risk} options={RISK_OPTIONS} onChange={setFilter('risk')} />
            {canReset && <button className="btn text-text-secondary hover:bg-surface-container-low" onClick={reset}><Icon name="restart_alt" size={16} />Đặt lại</button>}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 w-12 !px-2"><label className="w-8 h-8 flex items-center justify-center cursor-pointer"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-primary-container" aria-label="Chọn tất cả" /></label></th>
                <th className="sticky top-0 left-12 z-20 min-w-[230px]">Họ tên và mã số</th>
                <th className="sticky top-0 z-10">Đơn vị</th>
                <th className="sticky top-0 z-10 hidden min-[1400px]:table-cell">Nguồn dữ liệu</th>
                <th className="sticky top-0 z-10">Trạng thái</th>
                <th className="sticky top-0 z-10">Hiệu lực</th>
                <th className="sticky top-0 z-10">Điểm ảnh (AI)</th>
                <th className="sticky top-0 right-0 z-20 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = STATUS_META[p.status];
                const canOpen = p.status !== 'none';
                return (
                  <tr key={p.id} onClick={canOpen ? () => open(p) : undefined} className={`h-14 transition-colors ${canOpen ? 'cursor-pointer' : ''} ${selected.has(p.id) ? 'bg-primary-fixed' : 'bg-surface hover:bg-surface-container-low'}`}>
                    <td className="sticky left-0 z-[5] bg-inherit !px-2" onClick={(e) => e.stopPropagation()}><label className="w-8 h-8 flex items-center justify-center cursor-pointer"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 accent-primary-container" aria-label={`Chọn ${p.id}`} /></label></td>
                    <td className="sticky left-12 z-[5] bg-inherit">
                      <div className="flex items-center gap-space-sm">
                        <FaceThumb seed={p.seed} missing={p.status === 'none'} />
                        <div className="min-w-0"><div className="text-label-md font-semibold whitespace-nowrap">{p.name}</div><div className="text-caption font-mono text-text-secondary whitespace-nowrap">{p.id}</div></div>
                      </div>
                    </td>
                    <td><div>{p.unit}</div><div className="text-caption text-text-secondary">{p.type}</div></td>
                    <td className="hidden min-[1400px]:table-cell whitespace-nowrap">{p.source || <span className="text-text-secondary">Chưa có</span>}</td>
                    <td>
                      <StatusDot color={st.color} label={st.label} />
                      {p.risk && <div className="text-caption text-status-rejected flex items-center gap-1 mt-0.5 whitespace-nowrap"><Icon name="warning" size={13} />{p.risk}</div>}
                      {p.aiHint && <div className="text-caption text-text-secondary flex items-center gap-1 whitespace-nowrap"><Icon name="info" size={13} />Có gợi ý của AI</div>}
                    </td>
                    <td className={`whitespace-nowrap ${validityClass(p)}`}>{p.validity || 'Chưa có'}</td>
                    <td className="whitespace-nowrap"><ScoreBar value={p.score} /></td>
                    <td className="sticky right-0 z-[5] bg-inherit text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {p.status === 'none'
                        ? <button className="btn-outline btn-sm" onClick={() => { log('Gửi nhắc nhở thu thập Face ID', p.id); toast('Đã gửi nhắc nhở', `${p.name} sẽ nhận thông báo qua App MyDaiNam.`, 'success'); }}>Nhắc nhở</button>
                        : <button className="btn-outline btn-sm" aria-label={`Xem chi tiết ${p.name}`} onClick={() => open(p)}>Chi tiết</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="flex flex-col items-center">
              <Empty icon="search_off" title="Không có hồ sơ phù hợp" desc="Thử bỏ bớt bộ lọc hoặc đổi phạm vi ở thanh trên cùng." />
              {canReset && <button className="btn-outline -mt-6 mb-8" onClick={reset}>Đặt lại bộ lọc</button>}
            </div>
          )}
        </div>

        <div className="h-12 px-space-md border-t border-border-subtle flex items-center justify-between text-body-sm text-text-secondary shrink-0">
          <span aria-live="polite">{narrowed ? <>Tìm thấy <b className="text-text-primary font-medium">{rows.length}</b> hồ sơ</> : <>Hiển thị <b className="text-text-primary font-medium">1–{rows.length}</b> trong tổng số <b className="text-text-primary font-medium">24,850</b> hồ sơ</>}</span>
          <div className="flex items-center gap-2">
            <span>Trang 1 / {narrowed ? 1 : 994}</span>
            <button disabled className="btn-outline btn-sm !px-1.5" aria-label="Trang trước" title="Dữ liệu mẫu chỉ có một trang"><Icon name="chevron_left" /></button>
            <button disabled className="btn-outline btn-sm !px-1.5" aria-label="Trang sau" title="Dữ liệu mẫu chỉ có một trang"><Icon name="chevron_right" /></button>
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
  ['Nghiêng trái 20°', 85, 'Đạt'], ['Nghiêng phải 20°', 81, 'Ổn'], ['Đỉnh đầu', 90, 'Đạt'],
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
    if (kind === 'reveal') { setRevealed(true); log(`Xem rõ ảnh khuôn mặt — ${reason}`, profile.id, 'sensitive'); toast('Đã giải mờ ảnh', 'Thao tác đã được ghi vào nhật ký kiểm toán.', 'warn'); }
    if (kind === 'lock') { setProfiles((ps) => ps.map((p) => (p.id === profile.id ? { ...p, status: 'locked', validity: 'Đã vô hiệu hóa' } : p))); log(`Khóa hồ sơ — ${reason}`, profile.id); toast('Đã khóa hồ sơ', profile.id, 'success'); close(); }
    if (kind === 'revoke') { log(`Thu hồi quyền Face ID — ${reason}`, profile.id); toast('Đã gửi yêu cầu thu hồi', 'Cần cán bộ thứ 2 xác nhận.', 'warn'); close(); }
    if (kind === 'rescan') { log(`Tạo yêu cầu chụp lại — ${reason}`, profile.id); toast('Đã tạo yêu cầu chụp lại', profile.id, 'success'); close(); }
    setConfirm(null);
  };

  return (
    <Drawer open onClose={close} width={520}>
      <div className="px-space-md py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-k-title-md truncate">{profile.name}</h2>
            <div className="text-caption text-text-secondary"><span className="font-mono">{profile.id}</span> • {profile.email}</div>
          </div>
          <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container-low shrink-0" onClick={close}><Icon name="close" size={20} /></button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-body-sm">
          <StatusDot color={STATUS_META[profile.status].color} label={STATUS_META[profile.status].label} />
          <span className="text-text-secondary">{profile.type} • {profile.unit}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-md">
        {profile.aiHint && <AiCard><p className="text-body-sm">{profile.aiHint}</p></AiCard>}

        <section>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-headline-md">Ảnh khuôn mặt <span className="font-normal text-caption text-text-secondary">6 góc chụp</span></h3>
            {revealed
              ? <button className="btn-outline btn-sm" onClick={() => setRevealed(false)}><Icon name="visibility_off" size={16} />Làm mờ lại</button>
              : <button className="btn-outline btn-sm" onClick={() => setConfirm('reveal')}><Icon name="visibility" size={16} />Xem rõ (ghi nhật ký)</button>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {poses.map(([n, s, l], i) => (
              <div key={n} className="p-2 rounded-lg border border-border-subtle flex flex-col items-center text-center">
                <FaceThumb seed={profile.seed + i * 0.15} size={88} round={false} revealed={revealed} />
                <span className="text-caption font-medium mt-1">{n}</span>
                <span className={`text-caption ${scoreColor(s)}`}>{s}/100 ({l})</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-headline-md mb-2">Kết quả kiểm tra</h3>
          <dl className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-surface-bright"><dt className="text-caption text-text-secondary">Khớp với ảnh CCCD</dt><dd className="font-semibold text-status-active">94.2%</dd></div>
            <div className="p-2.5 rounded-lg bg-surface-bright"><dt className="text-caption text-text-secondary">Kiểm tra người thật</dt><dd className={`font-semibold ${profile.risk?.includes('ảnh in') ? 'text-status-rejected' : 'text-status-active'}`}>{profile.risk?.includes('ảnh in') ? 'Không đạt (42%)' : 'Đạt (99.4%)'}</dd></div>
          </dl>
          <p className="text-caption text-text-secondary mt-2">AI chỉ khuyến nghị, người duyệt quyết định.</p>
        </section>

        <section>
          <h3 className="text-headline-md mb-2">Lịch sử phiên bản</h3>
          <ol className="flex flex-col gap-2 text-body-sm">
            <li><div className="flex items-center gap-2"><b className="font-medium">v2.0 (hiện tại)</b><Chip color="status-pending">Chờ duyệt</Chip></div><div className="text-caption text-text-secondary">14:32 25/10/2025 • Kiosk số 03 (phiên #TR3-2025-041)</div></li>
            <li><div className="text-text-secondary">v1.0 (lưu trữ)</div><div className="text-caption text-text-secondary">15/09/2023 • App MyDaiNam (đã thay thế)</div></li>
          </ol>
        </section>

        <section>
          <h3 className="text-headline-md mb-1">Đồng ý xử lý dữ liệu (NĐ 13/2023)</h3>
          <div className="flex items-center gap-2 text-body-sm"><Chip color="status-active">Đã ký điện tử</Chip></div>
          <p className="text-caption text-text-secondary mt-1">Mục đích: điểm danh giảng đường, kiểm soát ra vào, phát hành thẻ.</p>
        </section>
      </div>

      <div className="p-space-md border-t border-border-subtle shrink-0">
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setConfirm('lock')}><Icon name="lock" size={16} />Khóa</button>
          <button className="btn-danger" onClick={() => setConfirm('revoke')}><Icon name="cancel" size={16} />Thu hồi</button>
          <button className="btn-primary flex-1" onClick={() => setConfirm('rescan')}><Icon name="add_task" size={16} />Tạo yêu cầu chụp lại</button>
        </div>
        <p className="text-caption text-text-secondary text-center mt-2">Thao tác của cán bộ sẽ được ký số và lưu vết.</p>
      </div>

      <ConfirmReason open={!!confirm} onClose={() => setConfirm(null)} onConfirm={(r) => act(confirm, r)} danger={confirm === 'revoke' || confirm === 'lock'}
        title={{ reveal: 'Xem rõ ảnh khuôn mặt', lock: 'Khóa tạm thời hồ sơ', revoke: 'Thu hồi quyền Face ID', rescan: 'Tạo yêu cầu chụp lại' }[confirm]}
        subtitle={`${profile.name} • ${profile.id}`} minLength={confirm === 'reveal' ? 5 : 10}>
        {confirm === 'revoke' && <div className="p-3 rounded-lg bg-status-rejected/10 text-body-sm text-status-rejected">Thu hồi cần <b>2 cán bộ</b> xác nhận. Yêu cầu sẽ chuyển sang hộp duyệt.</div>}
      </ConfirmReason>
    </Drawer>
  );
}
