import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, DataBoundary, Icon, Chip, Empty, PageHeader, ConfirmReason, SearchInput, Select, StatusDot } from '../components/ui';
import { useApp } from '../store';
import { SPACE_TREE, DEVICES } from '../data/mock';

const ZONE = { Public: ['status-active', 'Công cộng'], Operational: ['primary', 'Vận hành'], Restricted: ['status-pending', 'Hạn chế'], Forbidden: ['status-rejected', 'Cấm'] };
const ZONE_OPTIONS = Object.entries(ZONE).map(([value, z]) => ({ value, label: z[1] }));
const flatRooms = (tree) => tree.flatMap((b) => b.children.flatMap((f) => f.children.map((r) => ({ ...r, building: b.name, floor: f.name }))));

export default function Spaces() {
  const { log, toast } = useApp();
  const [tree, setTree] = useState(SPACE_TREE);
  const [open, setOpen] = useState(new Set(['A', 'C', 'K', 'C-3', 'A-1']));
  const [sel, setSel] = useState('C305');
  const [q, setQ] = useState('');
  const [assign, setAssign] = useState('');
  const [approveAsk, setApproveAsk] = useState(false);
  const [zoneAsk, setZoneAsk] = useState(null);
  const rooms = flatRooms(tree);
  const room = rooms.find((r) => r.id === sel);
  const free = DEVICES.filter((d) => !d.room || !rooms.some((r) => r.devices.includes(d.id)));
  const query = q.trim().toLowerCase();
  const matches = (r) => !query || `${r.id} ${r.name}`.toLowerCase().includes(query);
  const anyMatch = !query || rooms.some(matches);

  const patchRoom = (id, fn) => setTree((t) => t.map((b) => ({ ...b, children: b.children.map((f) => ({ ...f, children: f.children.map((r) => (r.id === id ? fn(r) : r)) })) })));
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const doAssign = () => {
    if (!assign) return;
    patchRoom(room.id, (r) => ({ ...r, devices: [...r.devices, assign] }));
    log(`Gắn cố định ${assign} → ${room.id}`, room.id);
    toast('Đã gán thiết bị', `${assign} → phòng ${room.id}`, 'success');
    setAssign('');
  };

  return (
    <div>
      <PageHeader title="Không gian & khu vực" desc="Quản lý cây Tòa → Tầng → Phòng, loại khu vực và thiết bị gắn cố định với từng phòng."
        actions={<button className="btn-primary" onClick={() => toast('Thêm khu vực', 'Khu vực mới sẽ ở trạng thái “Chờ duyệt hạ tầng”.')}><Icon name="add" />Thêm khu vực</button>} />

      <DataBoundary name="spaces" label="cây không gian" scopeNote="global">
      <Banner tone="warn" title="Hạ tầng đi trước, thiết bị theo sau." className="mb-space-md">Phòng chưa được duyệt hạ tầng thì chưa được gán camera, thiết bị hay phát hành mã QR điểm danh.</Banner>

      <div className="grid grid-cols-12 gap-space-md items-start">
        <section className="col-span-5 card overflow-hidden" aria-label="Cây không gian">
          <div className="p-3 border-b border-border-subtle">
            <SearchInput value={q} onChange={setQ} placeholder="Tìm phòng theo mã hoặc tên" />
            <p className="text-caption text-text-secondary mt-1.5">{rooms.length} phòng • {rooms.filter((r) => !r.approved).length} chờ duyệt</p>
          </div>
          <div className="p-2">
            {!anyMatch && <Empty icon="search_off" title="Không tìm thấy phòng" />}
            {tree.map((b) => {
              const floors = b.children.filter((f) => f.children.some(matches));
              if (query && floors.length === 0) return null;
              return (
                <div key={b.id}>
                  <button aria-expanded={!!query || open.has(b.id)} className="w-full h-9 flex items-center gap-1.5 px-2 rounded hover:bg-surface-container-low text-label-md font-semibold" onClick={() => toggle(b.id)}>
                    <Icon name={query || open.has(b.id) ? 'expand_more' : 'chevron_right'} />{b.name}
                  </button>
                  {(query || open.has(b.id)) && floors.map((f) => (
                    <div key={f.id} className="ml-4">
                      <button aria-expanded={!!query || open.has(f.id)} className="w-full h-9 flex items-center gap-1.5 px-2 rounded hover:bg-surface-container-low text-label-md font-normal" onClick={() => toggle(f.id)}>
                        <Icon name={query || open.has(f.id) ? 'expand_more' : 'chevron_right'} />{f.name}
                      </button>
                      {(query || open.has(f.id)) && f.children.filter(matches).map((r) => (
                        <button key={r.id} onClick={() => setSel(r.id)} aria-current={sel === r.id ? 'true' : undefined} className={`ml-6 w-[calc(100%-1.5rem)] min-h-[40px] flex items-center gap-2 px-2 py-1 rounded text-body-sm text-left ${sel === r.id ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
                          <span className="font-mono text-caption shrink-0">{r.id}</span><span className="truncate">{r.name}</span>
                          <span className="ml-auto flex items-center gap-1.5 shrink-0">{!r.approved && <span className="text-status-pending" title="Chờ duyệt hạ tầng"><Icon name="pending" size={16} /><span className="sr-only">Chờ duyệt hạ tầng</span></span>}<Chip color={ZONE[r.zone][0]}>{ZONE[r.zone][1]}</Chip></span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        {room && (
          <section className="col-span-7 card" aria-label="Chi tiết phòng">
            <header className="px-space-md py-3 border-b border-border-subtle flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h2 className="text-k-title-md">{room.name}</h2>
                <p className="text-caption text-text-secondary"><span className="font-mono">{room.id}</span> • {room.building} › {room.floor}</p>
              </div>
              {room.approved ? <Chip color="status-active" icon="verified" className="shrink-0">Đã duyệt hạ tầng</Chip> : <Chip color="status-pending" icon="pending" className="shrink-0">Chờ duyệt hạ tầng</Chip>}
            </header>
            <div className="p-space-md flex flex-col gap-space-md">
              {!room.approved && <Banner tone="warn" title="Phòng chưa được duyệt." action={<button className="btn-primary" onClick={() => setApproveAsk(true)}><Icon name="task_alt" />Duyệt hạ tầng</button>}>Gán camera, phát QR và điểm danh đang bị khóa.</Banner>}

              <div className="grid grid-cols-2 gap-space-md items-end">
                <label className="flex flex-col gap-1 text-label-md font-semibold">Loại khu vực
                  <Select className="font-normal" label="Loại khu vực" value={room.zone} options={ZONE_OPTIONS} onChange={(z) => setZoneAsk(z)} />
                </label>
                <p className="text-caption text-text-secondary pb-1">Khu vực Hạn chế và Cấm sẽ kích hoạt cảnh báo tức thời trong 2 giây.</p>
              </div>

              <div>
                <h3 className="section-title mb-2">Thiết bị gắn cố định ({room.devices.length})</h3>
                {room.devices.length === 0 ? <p className="p-3 rounded-lg bg-surface-bright text-body-sm text-text-secondary">Chưa có thiết bị nào gắn với phòng này.</p> : (
                  <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
                    {room.devices.map((id) => { const d = DEVICES.find((x) => x.id === id); return (
                      <li key={id} className="px-3 py-2 flex items-center gap-3 text-body-sm">
                        <span className="min-w-0"><span className="font-mono font-medium">{id}</span> <span className="text-caption text-text-secondary">{d?.kind}</span></span>
                        <span className="ml-auto"><StatusDot color={d?.online ? 'status-active' : 'status-rejected'} label={d?.online ? 'Trực tuyến' : 'Mất kết nối'} /></span>
                        <button className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-status-rejected/10 hover:text-status-rejected" aria-label={`Gỡ ${id} khỏi phòng`} title="Gỡ khỏi phòng" onClick={() => { patchRoom(room.id, (r) => ({ ...r, devices: r.devices.filter((x) => x !== id) })); log(`Gỡ ${id} khỏi ${room.id}`, room.id); }}><Icon name="link_off" /></button>
                      </li>); })}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="section-title mb-2">Gán thiết bị vào phòng</h3>
                <div className="flex gap-2">
                  <Select className="min-w-0 flex-1" label="Thiết bị chưa gán" placeholder="Chọn thiết bị chưa gán" value={assign} options={free.map((d) => ({ value: d.id, label: `${d.id} • ${d.kind}` }))} onChange={setAssign} disabled={!room.approved} />
                  <button className="btn-primary shrink-0" onClick={doAssign} disabled={!room.approved || !assign}><Icon name="link" />Gán</button>
                </div>
                {!room.approved && <p className="text-caption text-status-pending mt-1.5 flex items-center gap-1"><Icon name="lock" size={14} />Bị khóa cho đến khi phòng được duyệt hạ tầng.</p>}
              </div>

              <div className="flex gap-2 pt-3 border-t border-border-subtle">
                <button className="btn-outline flex-1" disabled={!room.approved} onClick={() => { log('Phát hành mã QR điểm danh', room.id); toast('Đã phát hành QR', `QR điểm danh dự phòng cho ${room.id}.`, 'success'); }}><Icon name="qr_code_2" />Phát hành QR điểm danh</button>
                <Link to="/nhat-ky" className="btn-outline flex-1"><Icon name="history" />Xem nhật ký thay đổi</Link>
              </div>
            </div>
          </section>
        )}
      </div>
      </DataBoundary>

      <ConfirmReason open={approveAsk} onClose={() => setApproveAsk(false)} title="Duyệt hạ tầng khu vực" subtitle={room && `${room.id} • ${room.name}`} confirmLabel="Duyệt"
        onConfirm={(reason) => { patchRoom(room.id, (r) => ({ ...r, approved: true })); log(`Duyệt hạ tầng — ${reason}`, room.id); toast('Đã duyệt hạ tầng', `${room.id} có thể gán thiết bị và phát QR.`, 'success'); setApproveAsk(false); }}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Xác nhận phòng đã được khảo sát thực địa và khai báo đúng vị trí (Tòa → Tầng → Phòng).</div>
      </ConfirmReason>
      <ConfirmReason open={!!zoneAsk} onClose={() => setZoneAsk(null)} title="Đổi loại khu vực" subtitle={room && zoneAsk && `${room.id}: ${ZONE[room.zone][1]} → ${ZONE[zoneAsk][1]}`} confirmLabel="Xác nhận đổi"
        onConfirm={(reason) => { patchRoom(room.id, (r) => ({ ...r, zone: zoneAsk })); log(`Đổi loại khu vực ${room.id} sang ${ZONE[zoneAsk][1]} — ${reason}`, room.id); toast('Đã đổi loại khu vực', `${room.id}: ${ZONE[zoneAsk][1]}`, 'success'); setZoneAsk(null); }}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Loại khu vực quyết định quy tắc áp dụng, gồm cả cảnh báo an ninh tức thời.</div>
      </ConfirmReason>
    </div>
  );
}
