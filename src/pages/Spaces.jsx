import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, DataBoundary, Icon, Chip, Empty, FieldError, Modal, PageHeader, ConfirmReason, SearchInput, Select, StatusDot } from '../components/ui';
import { useApp } from '../store';
import { approveRoom, assignDevice, createRoom, setRoomZone, suggestRoomCode } from '../api/client';
import { DEVICES } from '../data/mock';

const ZONE = { Public: ['status-active', 'Công cộng'], Operational: ['primary', 'Vận hành'], Restricted: ['status-pending', 'Hạn chế'], Forbidden: ['status-rejected', 'Cấm'] };
const ZONE_OPTIONS = Object.entries(ZONE).map(([value, z]) => ({ value, label: z[1] }));
const flatRooms = (tree) => tree.flatMap((b) => b.children.flatMap((f) => f.children.map((r) => ({ ...r, building: b.name, floor: f.name }))));

export default function Spaces() {
  const { data, call, log, toast, can } = useApp();
  const tree = data.spaces;
  const [adding, setAdding] = useState(false);
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

  // Mọi thay đổi đi qua API để wizard chính sách và việc gửi mẫu xuống thiết bị thấy ngay.
  const run = async (fn, ok) => { try { await call(fn); ok(); } catch (e) { toast('Không thực hiện được', e.message, 'error'); } };
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const doAssign = () => {
    if (!assign) return;
    const id = assign;
    run(() => assignDevice(room.id, id, true), () => { toast('Đã gán thiết bị', `${id} → phòng ${room.id}`, 'success'); setAssign(''); });
  };

  return (
    <div>
      <PageHeader title="Không gian & khu vực" desc="Quản lý cây Tòa → Tầng → Phòng, loại khu vực và thiết bị gắn cố định với từng phòng."
        actions={<button className="btn-primary" disabled={!can('space_write')} title={!can('space_write') ? 'Chỉ Quản trị hệ thống được thêm khu vực' : undefined} onClick={() => setAdding(true)}><Icon name="add" />Thêm khu vực</button>} />

      <DataBoundary name="spaces" label="cây không gian" scopeNote="global" skeleton="bar-split">
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
                        <button className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-status-rejected/10 hover:text-status-rejected" aria-label={`Gỡ ${id} khỏi phòng`} title="Gỡ khỏi phòng" onClick={() => run(() => assignDevice(room.id, id, false), () => toast('Đã gỡ thiết bị', `${id} khỏi ${room.id}`, 'success'))}><Icon name="link_off" /></button>
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
        onConfirm={(reason) => run(() => approveRoom(room.id, reason), () => { toast('Đã duyệt hạ tầng', `${room.id} có thể gán thiết bị, phát QR và chọn trong chính sách.`, 'success'); setApproveAsk(false); })}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Xác nhận phòng đã được khảo sát thực địa và khai báo đúng vị trí (Tòa → Tầng → Phòng).</div>
      </ConfirmReason>
      <ConfirmReason open={!!zoneAsk} onClose={() => setZoneAsk(null)} title="Đổi loại khu vực" subtitle={room && zoneAsk && `${room.id}: ${ZONE[room.zone][1]} → ${ZONE[zoneAsk][1]}`} confirmLabel="Xác nhận đổi"
        onConfirm={(reason) => run(() => setRoomZone(room.id, zoneAsk, reason), () => { toast('Đã đổi loại khu vực', `${room.id}: ${ZONE[zoneAsk][1]}`, 'success'); setZoneAsk(null); })}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Loại khu vực quyết định quy tắc áp dụng, gồm cả cảnh báo an ninh tức thời.</div>
      </ConfirmReason>
      {adding && <AddRoom tree={tree} defaults={room} onClose={() => setAdding(false)}
        onDone={(r) => { setOpen((s) => new Set([...s, r.building_id, r.floor_id])); setSel(r.room.id); setQ(''); }} />}
    </div>
  );
}

const NEW_BUILDING = '__new__';
const ZONE_HINT = {
  Public: 'Ai có Face ID hiệu lực cũng qua được; không cảnh báo.',
  Operational: 'Chỉ người thuộc chính sách có khu vực này; dùng cho phòng học, phòng làm việc.',
  Restricted: 'Người không có quyền xuất hiện sẽ báo an ninh trong 2 giây.',
  Forbidden: 'Mọi lượt xuất hiện đều báo an ninh; không cấp quyền qua chính sách.',
};

/** Thêm khu vực: chọn tòa (hoặc khai báo tòa mới), tầng, mã và tên phòng, loại khu vực. Phòng mới luôn chờ duyệt hạ tầng. */
function AddRoom({ tree, defaults, onClose, onDone }) {
  const { call, toast } = useApp();
  const floorOf = (id) => Number(String(id || '').split('-')[1]) || 1;
  const startB = tree.find((b) => b.children.some((f) => f.children.some((r) => r.id === defaults?.id))) || tree[0];
  const startF = startB?.children.find((f) => f.children.some((r) => r.id === defaults?.id)) || startB?.children[0];
  const [building, setBuilding] = useState(startB?.id || NEW_BUILDING);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [floorNo, setFloorNo] = useState(String(floorOf(startF?.id)));
  const bid = building === NEW_BUILDING ? newId.trim().toUpperCase() : building;
  const suggested = suggestRoomCode(bid, floorNo);
  const [code, setCode] = useState(suggested);
  const [codeTouched, setCodeTouched] = useState(false);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Operational');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const shownCode = codeTouched ? code : suggested;
  const b = tree.find((x) => x.id === building);
  const floors = b ? b.children.map((f) => ({ value: String(floorOf(f.id)), label: `${f.name} (${f.children.length} phòng)` })) : [];
  const floorExists = floors.some((f) => f.value === String(floorNo));

  const save = async () => {
    setBusy(true);
    try {
      const r = await call(createRoom, {
        building: building === NEW_BUILDING ? { new_id: newId, new_name: newName } : { id: building },
        floor_no: Number(floorNo), code: shownCode, name, zone, reason,
      });
      toast('Đã thêm khu vực', `${r.room.id} • ${r.room.name} đang chờ duyệt hạ tầng.`, 'success');
      onDone(r); onClose();
    } catch (e) { setErrors(e.fields || {}); if (!e.fields) toast('Không thêm được', e.message, 'error'); }
    setBusy(false);
  };
  const inv = (k) => (errors[k] ? '!border-status-rejected' : '');
  // Sửa ô nào thì bỏ lỗi của ô đó, không để lỗi cũ treo lại.
  const clr = (...keys) => setErrors((e) => { const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const L = ({ children, req }) => <span className="text-label-md font-semibold">{children}{req && <span className="text-status-rejected"> *</span>}</span>;

  return (
    <Modal open onClose={onClose} width="max-w-2xl">
      <div className="p-space-md border-b border-border-subtle flex items-center gap-2.5">
        <Icon name="add_location_alt" size={22} className="text-primary-container" />
        <div className="flex-1"><h3 className="text-headline-md">Thêm khu vực</h3><p className="text-caption text-text-secondary">Khu vực mới ở trạng thái “Chờ duyệt hạ tầng” cho đến khi khảo sát thực địa xong.</p></div>
        <button className="p-1 rounded-lg hover:bg-surface-container text-text-secondary" onClick={onClose} aria-label="Đóng"><Icon name="close" size={20} /></button>
      </div>
      <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
        <fieldset className="grid grid-cols-2 gap-space-md">
          <legend className="sr-only">Vị trí</legend>
          <label className="flex flex-col gap-1.5"><L req>Tòa nhà</L>
            <Select label="Tòa nhà" value={building} onChange={(v) => { setBuilding(v); const nb = tree.find((x) => x.id === v); if (nb?.children[0]) setFloorNo(String(floorOf(nb.children[0].id))); setCodeTouched(false); setErrors({}); }} options={[...tree.map((x) => ({ value: x.id, label: x.name })), { value: NEW_BUILDING, label: '+ Tòa nhà mới…' }]} />
            <FieldError msg={errors.building} />
          </label>
          <label className="flex flex-col gap-1.5"><L req>Tầng</L>
            <div className="flex gap-2">
              <input className={`input w-24 ${inv('floor_no')}`} type="number" min={1} max={30} aria-label="Số tầng" value={floorNo} onChange={(e) => { setFloorNo(e.target.value); setCodeTouched(false); clr('floor_no', 'code'); }} />
              {floors.length > 0 && <Select className="flex-1 min-w-0" label="Chọn tầng có sẵn" placeholder="Tầng có sẵn" value={floorExists ? String(floorNo) : ''} options={floors} onChange={(v) => { setFloorNo(v); setCodeTouched(false); clr('floor_no', 'code'); }} />}
            </div>
            {!errors.floor_no && floorNo && !floorExists && <span className="text-caption text-text-secondary">Tầng {floorNo} chưa có, sẽ được tạo cùng phòng.</span>}
            <FieldError msg={errors.floor_no} />
          </label>
          {building === NEW_BUILDING && (
            <>
              <label className="flex flex-col gap-1.5"><L req>Mã tòa</L>
                <input className={`input font-mono uppercase ${inv('building_id')}`} maxLength={1} placeholder="VD: D" value={newId} onChange={(e) => { setNewId(e.target.value.toUpperCase()); clr('building_id', 'code'); }} />
                <FieldError msg={errors.building_id} />
              </label>
              <label className="flex flex-col gap-1.5"><L req>Tên tòa</L>
                <input className={`input ${inv('building_name')}`} placeholder="VD: Tòa D — Thư viện" value={newName} onChange={(e) => { setNewName(e.target.value); clr('building_name'); }} />
                <FieldError msg={errors.building_name} />
              </label>
            </>
          )}
        </fieldset>

        <div className="grid grid-cols-3 gap-space-md">
          <label className="flex flex-col gap-1.5"><L req>Mã phòng</L>
            <input className={`input font-mono uppercase ${inv('code')}`} maxLength={5} placeholder={bid ? `${bid}${floorNo || 1}01` : 'VD: D101'} value={shownCode} onChange={(e) => { setCodeTouched(true); setCode(e.target.value.toUpperCase()); clr('code'); }} />
            {!codeTouched && suggested && !errors.code && <span className="text-caption text-text-secondary">Gợi ý theo tầng, sửa được.</span>}
            <FieldError msg={errors.code} />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5"><L req>Tên khu vực</L>
            <input className={`input ${inv('name')}`} placeholder="VD: Phòng máy C306" value={name} onChange={(e) => { setName(e.target.value); clr('name'); }} />
            <FieldError msg={errors.name} />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <L req>Loại khu vực</L>
          <div role="radiogroup" aria-label="Loại khu vực" className="grid grid-cols-4 gap-2">
            {ZONE_OPTIONS.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={zone === o.value} onClick={() => setZone(o.value)}
                className={`min-h-[40px] px-3 rounded border text-body-sm flex items-center gap-2 ${zone === o.value ? 'border-primary-container bg-primary-fixed text-primary-container font-medium' : 'border-border-control hover:bg-surface-container-low'}`}>
                <Icon name={zone === o.value ? 'radio_button_checked' : 'radio_button_unchecked'} size={18} />{o.label}
              </button>
            ))}
          </div>
          <p className="text-caption text-text-secondary">{ZONE_HINT[zone]}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between"><L req>Căn cứ khai báo</L><span className="text-caption text-text-secondary">Tối thiểu 10 ký tự</span></span>
          <textarea className={`input leading-relaxed ${inv('reason')}`} rows={2} placeholder="VD: Theo quyết định cải tạo phòng máy số 45/QĐ-ĐN, bàn giao 01/12/2026." value={reason} onChange={(e) => { setReason(e.target.value); clr('reason'); }} />
          <FieldError msg={errors.reason} />
        </label>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="lock" size={16} />Ghi nhật ký SPACE_CREATED</span>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={busy || !shownCode || !name.trim()} onClick={save}><Icon name="check" />{busy ? 'Đang lưu' : 'Thêm khu vực'}</button>
        </div>
      </div>
    </Modal>
  );
}
