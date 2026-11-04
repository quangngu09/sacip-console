import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Chip, ConfirmReason, DataBoundary, Empty, FieldError, Icon, Modal, PageHeader, SearchInput, Select, fold } from '../components/ui';
import { useApp } from '../store';
import { createOrgUnit, renameOrgUnit, setOrgUnitActive, syncOrgUnitsFromHR, unitUsage } from '../api/client';
import { SUBJECT_TYPE } from '../api/enums';
import { fmtDateTime, fmtNumber } from '../lib/format';

// Đặc tả Policy Engine §1: Org Unit được khai báo trực tiếp trên Console hoặc đồng bộ từ hệ thống nguồn.
const SOURCE_META = {
  HR: { label: 'Hệ thống Nhân sự', short: 'Nhân sự', color: 'primary', icon: 'sync' },
  CONTRACTOR: { label: 'Cổng Quản lý Nhà thầu', short: 'Nhà thầu', color: 'status-pending', icon: 'sync' },
  MANUAL: { label: 'Khai báo trên Console', short: 'Khai báo tay', color: 'neutral', icon: 'edit' },
};

const flat = (nodes, path = []) => nodes.flatMap((n) => [{ node: n, path }, ...(n.children ? flat(n.children, [...path, n]) : [])]);
const idsUnder = (n) => [n.id, ...(n.children || []).flatMap(idsUnder)];

export default function OrgUnits() {
  const { data, call, toast, can } = useApp();
  const tree = data.orgTree;
  const all = useMemo(() => flat(tree), [tree]);
  const [sel, setSel] = useState('CNTT');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(() => new Set(['ALL', 'FAC', 'ADM', 'OUT']));
  const [showInactive, setShowInactive] = useState(true);
  const [ask, setAsk] = useState(null); // 'add' | 'rename' | 'deactivate' | 'activate'
  const [syncing, setSyncing] = useState(false);
  const editable = can('policy_write');

  const hit = all.find((x) => x.node.id === sel) || all[0];
  const unit = hit.node;
  const usage = unitUsage(unit.id);
  const people = data.subjects.filter((s) => idsUnder(unit).includes(s.org_unit));
  const byType = Object.keys(SUBJECT_TYPE).map((t) => [t, people.filter((s) => s.subject_type === t).length]).filter(([, n]) => n);

  const f = fold(q.trim());
  const match = (n) => !f || fold(`${n.id} ${n.name}`).includes(f);
  const visible = (n) => (showInactive || !n.inactive) && (match(n) || (n.children || []).some(visible));
  const toggle = (id) => setOpen((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });
  const count = (n) => data.subjects.filter((s) => idsUnder(n).includes(s.org_unit)).length;

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await call(syncOrgUnitsFromHR);
      toast('Đã đồng bộ danh mục đơn vị', r.added.length ? `Thêm ${r.added.map((u) => u.name).join(', ')}.` : 'Không có thay đổi.', 'success');
      if (r.added[0]) { setSel(r.added[0].id); setOpen((s) => new Set([...s, r.added[0].parent])); }
    } catch (e) { toast('Không đồng bộ được', e.message, 'error'); }
    setSyncing(false);
  };

  const render = (nodes, depth) => nodes.filter(visible).map((n) => {
    const hasKids = n.children?.some(visible);
    const expanded = !!f || open.has(n.id);
    return (
      <li key={n.id}>
        <div className={`flex items-center gap-1 h-9 pr-2 rounded ${sel === n.id ? 'bg-primary-fixed text-primary-container' : 'hover:bg-surface-container-low'}`} style={{ paddingLeft: 4 + depth * 18 }}>
          {hasKids
            ? <button type="button" aria-label={expanded ? `Thu gọn ${n.name}` : `Mở ${n.name}`} aria-expanded={expanded} className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={() => toggle(n.id)}><Icon name={expanded ? 'expand_more' : 'chevron_right'} /></button>
            : <span className="w-6" />}
          <button type="button" className={`flex-1 min-w-0 flex items-center gap-2 text-left h-full ${n.inactive ? 'text-text-secondary line-through' : ''}`} onClick={() => setSel(n.id)} aria-current={sel === n.id || undefined}>
            <Icon name={n.children?.length ? 'folder' : 'apartment'} size={16} className="text-text-secondary shrink-0" />
            <span className="text-body-sm truncate">{n.name}</span>
          </button>
          {n.source !== 'MANUAL' && <span title={`Đồng bộ từ ${SOURCE_META[n.source].label}`} className="shrink-0 flex"><Icon name="sync" size={14} className="text-text-secondary" /></span>}
          <span className="text-caption tabular-nums text-text-secondary w-6 text-right">{count(n) || ''}</span>
        </div>
        {hasKids && expanded && <ul>{render(n.children, depth + 1)}</ul>}
      </li>
    );
  });

  const act = async (kind, reason) => {
    try {
      if (kind === 'deactivate' || kind === 'activate') {
        await call(setOrgUnitActive, unit.id, kind === 'activate', reason);
        toast(kind === 'activate' ? 'Đã dùng lại đơn vị' : 'Đã ngừng dùng đơn vị', `${unit.name}${kind === 'deactivate' ? ' không còn xuất hiện khi chọn phạm vi chính sách.' : ''}`, 'success');
      }
      setAsk(null);
    } catch (e) { toast('Không thực hiện được', e.message, 'error'); setAsk(null); }
  };

  return (
    <div>
      <PageHeader title="Đơn vị tổ chức" desc="Cây khoa, phòng ban và đơn vị thuê ngoài dùng để khoanh phạm vi chính sách. Đơn vị đồng bộ từ hệ thống nguồn chỉ sửa ở nguồn; Console chỉ khai báo các nhóm và đơn vị chưa có trong nguồn."
        actions={editable && (
          <>
            <button className="btn-outline" disabled={syncing} onClick={sync}><Icon name="sync" className={syncing ? 'animate-spin' : ''} />{syncing ? 'Đang đồng bộ' : 'Đồng bộ từ Nhân sự'}</button>
            <button className="btn-primary" onClick={() => setAsk('add')}><Icon name="add" />Thêm đơn vị</button>
          </>
        )} />

      <DataBoundary name="org-units" label="cây đơn vị" scopeNote="global" skeleton="bar-split">
        {!editable && <Banner icon="lock" className="mb-space-md">Vai trò hiện tại chỉ được xem. Thêm, sửa hoặc ngừng dùng đơn vị do Quản trị hệ thống thực hiện.</Banner>}
        <div className="grid grid-cols-12 gap-space-md items-start">
          <section className="col-span-5 card overflow-hidden" aria-label="Cây đơn vị">
            <div className="p-3 border-b border-border-subtle flex flex-col gap-2">
              <SearchInput value={q} onChange={setQ} placeholder="Tìm theo mã hoặc tên (không cần dấu)" />
              <div className="flex items-center justify-between text-caption text-text-secondary">
                <span>{all.length - 1} đơn vị • {all.filter((x) => x.node.inactive).length} ngừng dùng</span>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-primary-container" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />Hiện đơn vị ngừng dùng</label>
              </div>
            </div>
            <div className="p-2 max-h-[560px] overflow-y-auto">
              {tree.some(visible) ? <ul>{render(tree, 0)}</ul> : <Empty icon="search_off" title="Không tìm thấy đơn vị" />}
            </div>
          </section>

          <section className="col-span-7 card" aria-label="Chi tiết đơn vị">
            <div className="p-space-md border-b border-border-subtle flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-secondary truncate">{hit.path.map((p) => p.name).join(' › ') || 'Gốc'}</p>
                <h2 className="text-k-title-md flex items-center gap-2 flex-wrap">{unit.name}{unit.inactive && <Chip color="status-inactive">Ngừng dùng</Chip>}</h2>
                <div className="mt-1 flex items-center gap-2 flex-wrap text-caption">
                  <span className="font-mono">{unit.id}</span>
                  <Chip color={SOURCE_META[unit.source].color} icon={SOURCE_META[unit.source].icon}>{SOURCE_META[unit.source].label}</Chip>
                  {unit.created_at && <span className="text-text-secondary">Thêm lúc {fmtDateTime(unit.created_at)}</span>}
                </div>
              </div>
              {editable && unit.id !== 'ALL' && (
                <div className="flex gap-2 shrink-0">
                  <button className="btn-outline btn-sm" disabled={unit.source !== 'MANUAL'} title={unit.source !== 'MANUAL' ? 'Sửa tên tại hệ thống nguồn rồi đồng bộ lại' : undefined} onClick={() => setAsk('rename')}><Icon name="edit" size={16} />Đổi tên</button>
                  {unit.inactive
                    ? <button className="btn-outline btn-sm" onClick={() => setAsk('activate')}><Icon name="undo" size={16} />Dùng lại</button>
                    : <button className="btn-outline btn-sm" onClick={() => setAsk('deactivate')}><Icon name="block" size={16} />Ngừng dùng</button>}
                </div>
              )}
            </div>

            <div className="p-space-md flex flex-col gap-space-lg">
              {unit.source !== 'MANUAL' && <Banner icon="sync">Đơn vị này lấy từ {SOURCE_META[unit.source].label}. Đổi tên hay sáp nhập cần làm ở hệ thống nguồn; Console chỉ cho ngừng dùng để loại khỏi phạm vi chính sách.</Banner>}

              <dl className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Hồ sơ thuộc đơn vị</dt><dd className="text-k-title-md tabular-nums">{fmtNumber(people.length)}</dd></div>
                <div className="p-3 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Đơn vị con</dt><dd className="text-k-title-md tabular-nums">{fmtNumber(idsUnder(unit).length - 1)}</dd></div>
                <div className="p-3 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Chính sách áp dụng</dt><dd className="text-k-title-md tabular-nums">{usage.policies.length}</dd></div>
              </dl>

              <div>
                <h3 className="text-headline-md mb-2">Đối tượng theo loại</h3>
                {byType.length === 0 ? <p className="text-body-sm text-text-secondary">Chưa có hồ sơ nào thuộc đơn vị này.</p> : (
                  <div className="flex flex-wrap gap-2">
                    {byType.map(([t, n]) => <Chip key={t} icon={SUBJECT_TYPE[t].icon} color={SUBJECT_TYPE[t].chip}>{SUBJECT_TYPE[t].label}: {n}</Chip>)}
                    <Link to="/ho-so" className="text-caption text-primary-container hover:underline self-center ml-1">Xem hồ sơ</Link>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-headline-md mb-2">Chính sách có phạm vi gồm đơn vị này</h3>
                {usage.policies.length === 0 ? <p className="text-body-sm text-text-secondary">Không có. Đơn vị chưa nằm trong phạm vi chính sách nào nên hồ sơ thuộc đây sẽ không được thu thập Face ID.</p> : (
                  <ul className="flex flex-col divide-y divide-border-subtle border border-border-subtle rounded">
                    {usage.policies.map((id) => {
                      const p = data.policies.find((x) => x.policy_id === id);
                      return (
                        <li key={id} className="px-3 py-2 flex items-center gap-2 text-body-sm">
                          <span className="font-mono text-caption">{id}</span><span className="truncate">{p.name}</span>
                          <span className="ml-auto text-caption text-text-secondary">{p.current_version}</span>
                          <Link to="/chinh-sach" className="text-caption text-primary-container hover:underline">Mở</Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {unit.children?.length > 0 && (
                <div>
                  <h3 className="text-headline-md mb-2">Đơn vị trực thuộc</h3>
                  <div className="overflow-x-auto rounded border border-border-subtle">
                    <table className="data-table">
                      <thead><tr><th>Mã</th><th>Tên</th><th>Nguồn</th><th className="text-right">Hồ sơ</th><th>Trạng thái</th></tr></thead>
                      <tbody>
                        {unit.children.map((c) => (
                          <tr key={c.id} className="cursor-pointer hover:bg-surface-container-low" onClick={() => setSel(c.id)}>
                            <td className="font-mono text-caption">{c.id}</td><td>{c.name}</td>
                            <td className="text-caption">{SOURCE_META[c.source].short}</td>
                            <td className="text-right tabular-nums">{count(c)}</td>
                            <td>{c.inactive ? <Chip color="status-inactive">Ngừng dùng</Chip> : <Chip color="status-active">Đang dùng</Chip>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </DataBoundary>

      {ask === 'add' && <AddUnit all={all} defaultParent={unit.children ? unit.id : hit.path[hit.path.length - 1]?.id || 'ALL'} onClose={() => setAsk(null)} onDone={(u, parent) => { setSel(u.id); setOpen((s) => new Set([...s, parent])); }} />}
      {ask === 'rename' && <RenameUnit unit={unit} onClose={() => setAsk(null)} />}
      <ConfirmReason open={ask === 'deactivate' || ask === 'activate'} onClose={() => setAsk(null)} onConfirm={(r) => act(ask, r)} danger={ask === 'deactivate'}
        title={ask === 'activate' ? 'Dùng lại đơn vị' : 'Ngừng dùng đơn vị'} subtitle={`${unit.name} • ${unit.id}`}>
        {ask === 'deactivate' && (usage.subjects || usage.policies.length
          ? <Banner tone="danger" title="Chưa thể ngừng dùng.">Còn {usage.subjects} hồ sơ{usage.policies.length ? ` và chính sách ${usage.policies.join(', ')}` : ''} gắn với đơn vị này. Chuyển hồ sơ sang đơn vị khác hoặc bỏ đơn vị khỏi phạm vi chính sách trước.</Banner>
          : <Banner tone="warn">Đơn vị sẽ không còn để chọn ở phạm vi chính sách và bộ lọc. Dữ liệu cũ vẫn giữ nguyên để tra cứu.</Banner>)}
      </ConfirmReason>
    </div>
  );
}

function AddUnit({ all, defaultParent, onClose, onDone }) {
  const { call, toast } = useApp();
  const [parent, setParent] = useState(defaultParent);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const parents = all.filter((x) => !x.node.inactive).map((x) => ({ value: x.node.id, label: `${'— '.repeat(x.path.length)}${x.node.name}` }));
  const save = async () => {
    setBusy(true);
    try {
      const u = await call(createOrgUnit, parent, id, name);
      toast('Đã thêm đơn vị', `${u.name} (${u.id}) có thể chọn ngay trong phạm vi chính sách.`, 'success');
      onDone(u, parent); onClose();
    } catch (e) { setErrors(e.fields || {}); if (!e.fields) toast('Không thêm được', e.message, 'error'); }
    setBusy(false);
  };
  return (
    <Modal open onClose={onClose} width="max-w-lg">
      <div className="p-space-md border-b border-border-subtle flex items-center gap-2.5">
        <Icon name="corporate_fare" size={22} className="text-primary-container" />
        <h3 className="text-headline-md flex-1">Thêm đơn vị</h3>
        <button className="p-1 rounded-lg hover:bg-surface-container text-text-secondary" onClick={onClose} aria-label="Đóng"><Icon name="close" size={20} /></button>
      </div>
      <div className="p-space-md flex flex-col gap-space-md">
        <Banner>Chỉ khai báo đơn vị chưa có ở Hệ thống Nhân sự, ví dụ nhóm dự án hay đơn vị đối tác. Khoa, phòng chính thức hãy thêm ở nguồn rồi bấm “Đồng bộ từ Nhân sự”.</Banner>
        <label className="flex flex-col gap-1.5"><span className="text-label-md font-semibold">Thuộc đơn vị</span>
          <Select label="Thuộc đơn vị" value={parent} options={parents} onChange={setParent} />
          <FieldError msg={errors.parent} />
        </label>
        <div className="grid grid-cols-3 gap-space-md">
          <label className="flex flex-col gap-1.5"><span className="text-label-md font-semibold">Mã <span className="text-status-rejected">*</span></span>
            <input className={`input font-mono uppercase ${errors.id ? '!border-status-rejected' : ''}`} value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="VD: OUT_IT" maxLength={16} />
            <FieldError msg={errors.id} />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5"><span className="text-label-md font-semibold">Tên đơn vị <span className="text-status-rejected">*</span></span>
            <input className={`input ${errors.name ? '!border-status-rejected' : ''}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Hỗ trợ CNTT (FPT IS)" />
            <FieldError msg={errors.name} />
          </label>
        </div>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="lock" size={16} />Ghi nhật ký ORG_UNIT_CREATED</span>
        <div className="flex gap-2"><button className="btn-outline" onClick={onClose}>Hủy</button><button className="btn-primary" disabled={busy || !id || !name} onClick={save}><Icon name="check" />Thêm</button></div>
      </div>
    </Modal>
  );
}

function RenameUnit({ unit, onClose }) {
  const { call, toast } = useApp();
  const [name, setName] = useState(unit.name);
  return (
    <ConfirmReason open onClose={onClose} title="Đổi tên đơn vị" subtitle={`${unit.id}`} confirmLabel="Lưu"
      onConfirm={async (reason) => {
        try { await call(renameOrgUnit, unit.id, name, reason); toast('Đã đổi tên', name, 'success'); onClose(); } catch (e) { toast('Không đổi được', e.message, 'error'); }
      }}>
      <label className="flex flex-col gap-1.5"><span className="text-label-md font-semibold">Tên mới</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </ConfirmReason>
  );
}
