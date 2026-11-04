import { useState } from 'react';
import { Icon, Chip, PageHeader, ConfirmReason } from '../components/ui';
import { useApp } from '../store';
import { SPACE_TREE, DEVICES } from '../data/mock';

const zoneColor = { Public: 'status-active', Operational: 'primary', Restricted: 'status-pending', Forbidden: 'status-rejected' };
const flatRooms = (tree) => tree.flatMap((b) => b.children.flatMap((f) => f.children.map((r) => ({ ...r, building: b.name, floor: f.name }))));

export default function Spaces() {
  const { log, toast } = useApp();
  const [tree, setTree] = useState(SPACE_TREE);
  const [open, setOpen] = useState(new Set(['A', 'C', 'K', 'C-3', 'A-1']));
  const [sel, setSel] = useState('C305');
  const [assign, setAssign] = useState('');
  const [approveAsk, setApproveAsk] = useState(false);
  const rooms = flatRooms(tree);
  const room = rooms.find((r) => r.id === sel);
  const free = DEVICES.filter((d) => !d.room || !rooms.some((r) => r.devices.includes(d.id)));

  const patchRoom = (id, fn) => setTree((t) => t.map((b) => ({ ...b, children: b.children.map((f) => ({ ...f, children: f.children.map((r) => (r.id === id ? fn(r) : r)) })) })));
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const doAssign = () => {
    if (!assign) return;
    if (!room.approved) { toast('Không thể gán thiết bị', 'Phòng chưa được định danh & duyệt trên hạ tầng — “Hạ tầng đi trước, Thiết bị theo sau”.', 'error'); return; }
    patchRoom(room.id, (r) => ({ ...r, devices: [...r.devices, assign] }));
    log(`Map cứng ${assign} → ${room.id}`, room.id);
    toast('Đã gán thiết bị', `${assign} → Room_ID ${room.id}`, 'success');
    setAssign('');
  };

  return (
    <div>
      <PageHeader icon="account_tree" title="Không gian & Zone" desc="Master Data / GIS • Cây phân cấp Trường → Tòa → Tầng → Phòng, định nghĩa Zone và map cứng Camera_ID → Room_ID"
        actions={<><button className="btn-outline"><Icon name="upload" />Nhập từ CMDB</button><button className="btn-primary" onClick={() => toast('Thêm khu vực', 'Khu vực mới sẽ ở trạng thái “Chờ duyệt hạ tầng”.')}><Icon name="add" />Thêm khu vực</button></>} />

      <div className="mb-space-md p-3 rounded-lg bg-status-pending/10 border border-status-pending/30 flex gap-3 text-body-sm">
        <Icon name="rule_settings" size={22} className="text-status-pending" />
        <div><b className="text-status-pending">Nguyên tắc “Hạ tầng đi trước — Thiết bị theo sau”.</b> Phòng/khu vực chưa được định danh và duyệt trên hệ thống hạ tầng thì không được cấu hình camera, thiết bị IoT hay phát hành mã QR / điểm danh. (Bài học thực tế KTX)</div>
      </div>

      <div className="grid grid-cols-12 gap-space-md items-start">
        <div className="col-span-5 card p-space-sm">
          <div className="px-2 py-1.5 flex justify-between text-caption text-text-secondary"><span className="font-semibold uppercase tracking-wider">Cây không gian</span><span>{rooms.length} phòng • {rooms.filter((r) => !r.approved).length} chờ duyệt</span></div>
          {tree.map((b) => (
            <div key={b.id}>
              <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-surface-container-low text-label-md font-semibold" onClick={() => toggle(b.id)}>
                <Icon name={open.has(b.id) ? 'expand_more' : 'chevron_right'} /><Icon name="domain" className="text-primary-container" />{b.name}
              </button>
              {open.has(b.id) && b.children.map((f) => (
                <div key={f.id} className="ml-5">
                  <button className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-container-low text-label-md" onClick={() => toggle(f.id)}>
                    <Icon name={open.has(f.id) ? 'expand_more' : 'chevron_right'} /><Icon name="layers" className="text-text-secondary" />{f.name}
                  </button>
                  {open.has(f.id) && f.children.map((r) => (
                    <button key={r.id} onClick={() => setSel(r.id)} className={`ml-6 w-[calc(100%-1.5rem)] flex items-center gap-2 px-2 py-1.5 rounded text-body-sm ${sel === r.id ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'hover:bg-surface-container-low'}`}>
                      <Icon name="meeting_room" size={16} /><span className="font-mono text-caption">{r.id}</span><span className="truncate">{r.name}</span>
                      <span className="ml-auto flex items-center gap-1">{!r.approved && <Icon name="pending" size={16} className="text-status-pending" />}<Chip color={zoneColor[r.zone]}>{r.zone}</Chip></span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {room && (
          <div className="col-span-7 card">
            <div className="p-space-md border-b border-border-subtle flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2"><h2 className="text-headline-md">{room.name}</h2><span className="font-mono text-caption text-text-secondary">Room_ID: {room.id}</span></div>
                <p className="text-caption text-text-secondary">{room.building} › {room.floor}</p>
              </div>
              {room.approved ? <Chip color="status-active" icon="verified">Đã duyệt hạ tầng</Chip> : <Chip color="status-pending" icon="pending">Chờ duyệt hạ tầng</Chip>}
            </div>
            <div className="p-space-md flex flex-col gap-space-md">
              <div className="grid grid-cols-2 gap-space-md">
                <label className="flex flex-col gap-1 text-label-md font-semibold">Loại Zone
                  <select className="input" value={room.zone} onChange={(e) => { patchRoom(room.id, (r) => ({ ...r, zone: e.target.value })); log(`Đổi Zone ${room.id} → ${e.target.value}`, room.id); }}>
                    {['Public', 'Operational', 'Restricted', 'Forbidden'].map((z) => <option key={z}>{z}</option>)}
                  </select>
                </label>
                <div className="text-caption text-text-secondary self-end pb-1.5">Zone quyết định rule áp dụng: Restricted/Forbidden kích hoạt cảnh báo real-time ≤2s.</div>
              </div>

              {!room.approved && (
                <div className="p-3 rounded-lg border border-status-pending/40 bg-status-pending/5 flex items-center justify-between gap-3">
                  <div className="text-body-sm"><b>Phòng chưa được duyệt.</b> Mọi thao tác gán camera, phát QR, điểm danh đang bị khóa.</div>
                  <button className="btn-primary shrink-0" onClick={() => setApproveAsk(true)}><Icon name="task_alt" />Duyệt hạ tầng</button>
                </div>
              )}

              <div>
                <div className="section-title mb-2">Thiết bị đã map cứng ({room.devices.length})</div>
                {room.devices.length === 0 ? <div className="p-4 rounded-lg bg-surface-bright text-caption text-text-secondary text-center">Chưa có thiết bị nào gắn với phòng này.</div> : (
                  <div className="flex flex-col gap-1.5">
                    {room.devices.map((id) => { const d = DEVICES.find((x) => x.id === id); return (
                      <div key={id} className="p-2.5 rounded-lg bg-surface-bright flex items-center gap-3 text-body-sm">
                        <Icon name={d?.kind.includes('Camera') ? 'videocam' : d?.kind.includes('BLE') ? 'bluetooth' : d?.kind.includes('Wi-Fi') ? 'wifi' : 'devices'} className="text-primary-container" />
                        <span className="font-mono font-semibold">{id}</span><span className="text-text-secondary">{d?.kind}</span>
                        <span className="ml-auto"><span className={`inline-block w-2 h-2 rounded-full mr-1 ${d?.online ? 'bg-status-active' : 'bg-status-rejected'}`} />{d?.online ? 'Online' : 'Offline'}</span>
                        <button className="text-text-secondary hover:text-status-rejected" title="Gỡ map" onClick={() => { patchRoom(room.id, (r) => ({ ...r, devices: r.devices.filter((x) => x !== id) })); log(`Gỡ map ${id} khỏi ${room.id}`, room.id); }}><Icon name="link_off" /></button>
                      </div>); })}
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-lg border border-border-subtle ${room.approved ? '' : 'opacity-60'}`}>
                <div className="text-label-md font-semibold mb-2 flex items-center gap-1.5"><Icon name="add_link" />Gán thiết bị vào phòng</div>
                <div className="flex gap-2">
                  <select className="input" value={assign} onChange={(e) => setAssign(e.target.value)} disabled={!room.approved}>
                    <option value="">— Chọn thiết bị chưa gán —</option>
                    {free.map((d) => <option key={d.id} value={d.id}>{d.id} • {d.kind}</option>)}
                  </select>
                  <button className="btn-primary shrink-0 disabled:opacity-40" onClick={doAssign} disabled={!room.approved || !assign}><Icon name="link" />Gán</button>
                </div>
                {!room.approved && <p className="text-caption text-status-pending mt-1.5 flex items-center gap-1"><Icon name="lock" size={14} />Bị khóa cho đến khi phòng được duyệt hạ tầng.</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="btn-outline justify-center disabled:opacity-40" disabled={!room.approved} onClick={() => { log('Phát hành mã QR điểm danh', room.id); toast('Đã phát hành QR', `QR điểm danh dự phòng cho ${room.id}.`, 'success'); }}><Icon name="qr_code_2" />Phát hành QR điểm danh</button>
                <button className="btn-outline justify-center"><Icon name="history" />Lịch sử thay đổi</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmReason open={approveAsk} onClose={() => setApproveAsk(false)} title="Duyệt hạ tầng khu vực" subtitle={room && `${room.id} • ${room.name}`} confirmLabel="Duyệt"
        onConfirm={(reason) => { patchRoom(room.id, (r) => ({ ...r, approved: true })); log(`Duyệt hạ tầng — ${reason}`, room.id); toast('Đã duyệt hạ tầng', `${room.id} có thể gán thiết bị & phát QR.`, 'success'); setApproveAsk(false); }}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Xác nhận phòng đã được khảo sát thực địa, khai báo đúng vị trí trên CMDB (Tòa → Tầng → Phòng → Vị trí).</div>
      </ConfirmReason>
    </div>
  );
}
