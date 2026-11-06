import { useState } from 'react';
import { Banner, Chip, ConfirmReason, DataBoundary, Empty, Icon, Modal, SearchInput, Select, SortTh, Tabs, useSort } from '../components/ui';
import { useApp } from '../store';
import { ACCESS_GRANTS, GRANT_SOURCE, SUBJECT_KIND } from '../data/attendance';

const ZONE = { Public: ['status-active', 'Công cộng'], Operational: ['primary', 'Vận hành'], Restricted: ['status-pending', 'Hạn chế'], Forbidden: ['status-rejected', 'Cấm'] };
const SORTERS = { subject: (g) => g.subject, zone: (g) => g.zone, source: (g) => g.source, effect: (g) => g.effect };
const ZONES = [['A501', 'Phòng Server', 'Restricted'], ['C202', 'Phòng thí nghiệm C202', 'Restricted'], ['C301', 'Phòng học C301', 'Operational'], ['C302', 'Phòng học C302', 'Operational'], ['C305', 'Phòng máy C305', 'Operational']];
const BLANK = { kind: 'unit', subject: '', zone: 'A501', schedule: '24/7', effect: 'allow', to: '' };

/** Quyền ra vào theo zone: chủ thể × zone × khung giờ × hiệu lực × nguồn. Từ chối thắng cho phép. */
export default function AccessGrants() {
  const { can, log, toast } = useApp();
  const [grants, setGrants] = useState(ACCESS_GRANTS);
  const [src, setSrc] = useState('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [revoke, setRevoke] = useState(null);
  const query = q.trim().toLowerCase();
  const rows = grants.filter((g) => (src === 'all' || g.source === src) && (!query || `${g.subject} ${g.zone} ${g.zoneName}`.toLowerCase().includes(query)));
  const table = useSort(rows, SORTERS);
  const write = can('space_write');

  const add = () => {
    const z = ZONES.find((x) => x[0] === form.zone);
    const g = { id: `G-${101 + grants.length}`, subject: form.subject.trim(), kind: form.kind, zone: z[0], zoneName: z[1], zoneType: z[2], schedule: form.schedule, from: '06/11/2026', to: form.to || null, source: 'manual', effect: form.effect, by: 'Bạn' };
    setGrants((gs) => [g, ...gs]);
    log(`Thêm quyền ra vào ${g.id}: ${g.effect === 'deny' ? 'từ chối' : 'cho phép'} ${g.subject} tại ${g.zone}`, g.id);
    toast('Đã thêm quyền ra vào', `${g.subject} • ${g.zone}`, 'success');
    setAdding(false); setForm(BLANK);
  };

  return (
    <div>
      <Banner className="mb-space-md" icon="key" title="Ai được ở đâu, khi nào.">
        Quyền kế thừa theo cây Tòa → Tầng → Phòng; <b>từ chối thắng cho phép</b>. Quyền theo lịch học do Hệ thống Đào tạo tự sinh và không sửa tay. Cảnh báo người không có quyền chỉ áp dụng cho khu <b>Hạn chế / Cấm</b>; phòng làm việc của phòng ban là khu Vận hành, mở cho SV và khách đến làm việc.
      </Banner>

      <DataBoundary name="grants" label="quyền ra vào" scopeNote="global">
      <div className="card overflow-hidden">
        <Tabs label="Nguồn quyền" className="px-2 border-b border-border-subtle" value={src} onChange={setSrc} items={[
          { key: 'all', label: 'Tất cả', count: grants.length },
          ...Object.entries(GRANT_SOURCE).filter(([k]) => grants.some((g) => g.source === k)).map(([k, [, l]]) => ({ key: k, label: l, count: grants.filter((g) => g.source === k).length })),
        ]} />
        <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2">
          <SearchInput className="flex-1 max-w-md" value={q} onChange={setQ} placeholder="Tìm theo chủ thể hoặc phòng" />
          <span className="text-caption text-text-secondary ml-auto">Danh sách được phép được đẩy xuống thiết bị xử lý tại chỗ để còi vẫn chạy khi mất mạng.</span>
          <button className="btn-primary" disabled={!write} title={write ? undefined : 'Chỉ Quản trị hệ thống được cấp quyền'} onClick={() => setAdding(true)}><Icon name="add" />Cấp quyền</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><SortTh k="subject" table={table}>Chủ thể</SortTh><SortTh k="zone" table={table}>Khu vực</SortTh><th>Khung giờ</th><th>Hiệu lực</th><SortTh k="effect" table={table}>Kiểu</SortTh><SortTh k="source" table={table}>Nguồn</SortTh><th /></tr></thead>
            <tbody>
              {table.sorted.map((g) => (
                <tr key={g.id} className="hover:bg-surface-container-low align-top">
                  <td className="min-w-[240px] py-3">
                    <div className="flex items-center gap-1.5 font-medium"><Icon name={SUBJECT_KIND[g.kind][0]} size={16} className="text-text-secondary" />{g.subject}</div>
                    <div className="text-caption text-text-secondary"><span className="font-mono">{g.id}</span> • {SUBJECT_KIND[g.kind][1]} • cấp bởi {g.by}</div>
                    {g.warn && <div className="mt-1 text-caption text-status-pending flex items-start gap-1"><Icon name="warning" size={14} className="mt-0.5" />{g.warn}</div>}
                  </td>
                  <td className="py-3 whitespace-nowrap"><span className="font-mono font-medium">{g.zone}</span> <span className="text-text-secondary">{g.zoneName}</span><div><Chip color={ZONE[g.zoneType][0]}>{ZONE[g.zoneType][1]}</Chip></div></td>
                  <td className="py-3">{g.schedule}</td>
                  <td className="py-3 whitespace-nowrap">{g.from} → {g.to || 'không thời hạn'}</td>
                  <td className="py-3">{g.effect === 'deny' ? <Chip color="status-rejected" icon="block">Từ chối</Chip> : <Chip color="status-active" icon="check">Cho phép</Chip>}</td>
                  <td className="py-3"><Chip color={GRANT_SOURCE[g.source][0]} icon={g.source === 'ems' ? 'lock' : undefined}>{GRANT_SOURCE[g.source][1]}</Chip></td>
                  <td className="py-3">{g.source === 'manual' && <button className="btn-outline btn-sm" disabled={!write} onClick={() => setRevoke(g)}>Thu hồi</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty icon="key_off" title="Không có quyền phù hợp" />}
        </div>
      </div>
      </DataBoundary>

      <Modal open={adding} onClose={() => setAdding(false)}>
        <div className="p-space-md border-b border-border-subtle"><h3 className="text-k-title-md">Cấp quyền ra vào</h3><p className="text-caption text-text-secondary">Quyền theo lịch học không tạo ở đây; chúng đến từ Hệ thống Đào tạo.</p></div>
        <div className="p-space-md flex flex-col gap-space-md">
          <div className="grid grid-cols-[160px_1fr] gap-2 items-end">
            <label className="flex flex-col gap-1 text-label-md font-semibold">Loại chủ thể<Select label="Loại chủ thể" value={form.kind} options={Object.entries(SUBJECT_KIND).filter(([k]) => k !== 'class').map(([value, m]) => ({ value, label: m[1] }))} onChange={(v) => setForm({ ...form, kind: v })} /></label>
            <label className="flex flex-col gap-1 text-label-md font-semibold">Tên chủ thể<input className="input font-normal" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ví dụ: Phòng Quản trị mạng" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-label-md font-semibold">Khu vực<Select label="Khu vực" value={form.zone} options={ZONES.map(([v, n]) => ({ value: v, label: `${v} • ${n}` }))} onChange={(v) => setForm({ ...form, zone: v })} /></label>
            <label className="flex flex-col gap-1 text-label-md font-semibold">Khung giờ<Select label="Khung giờ" value={form.schedule} options={['24/7', 'Giờ hành chính 07:30–17:00', 'Theo ca trực (Chấm công)']} onChange={(v) => setForm({ ...form, schedule: v })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-label-md font-semibold">Kiểu<Select label="Kiểu" value={form.effect} options={[{ value: 'allow', label: 'Cho phép' }, { value: 'deny', label: 'Từ chối (thắng cho phép)' }]} onChange={(v) => setForm({ ...form, effect: v })} /></label>
            <label className="flex flex-col gap-1 text-label-md font-semibold">Hết hạn (không bắt buộc)<input className="input font-normal" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="dd/mm/yyyy" /></label>
          </div>
          {ZONES.find((z) => z[0] === form.zone)[2] !== 'Restricted' && <Banner tone="warn">Khu Vận hành không phát cảnh báo khi người không có quyền xuất hiện; quyền ở đây chỉ dùng cho mở cửa.</Banner>}
        </div>
        <div className="p-space-md bg-surface-bright border-t border-border-subtle flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setAdding(false)}>Hủy</button>
          <button className="btn-primary" disabled={form.subject.trim().length < 3} onClick={add}><Icon name="check" />Cấp quyền</button>
        </div>
      </Modal>

      <ConfirmReason open={!!revoke} onClose={() => setRevoke(null)} danger title={`Thu hồi quyền ${revoke?.id}`} subtitle={revoke && `${revoke.subject} • ${revoke.zone}`} confirmLabel="Thu hồi"
        onConfirm={(reason) => { setGrants((gs) => gs.filter((g) => g.id !== revoke.id)); log(`Thu hồi quyền ra vào ${revoke.id}: ${reason}`, revoke.id); toast('Đã thu hồi quyền', `${revoke.subject} • ${revoke.zone}`, 'warn'); setRevoke(null); }} />
    </div>
  );
}
