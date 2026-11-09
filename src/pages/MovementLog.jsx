import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Chip, ConfirmReason, DataBoundary, Empty, Icon, MetricStrip, PageHeader, SubjectTypeChip, Tabs } from '../components/ui';
import { decideMovementLookup, openMovementJourney, requestMovementLookup } from '../api/client';
import { useApp } from '../store';
import { MOVEMENT_FEED, MOVEMENT_ZONES, NEVER_LOG, ZONE_FLOW, ZONE_NAME } from '../data/movement';
import { fmtDateTime, fmtNumber } from '../lib/format';

const DIR = { in: ['login', 'Vào', 'text-status-active'], out: ['logout', 'Ra', 'text-text-secondary'] };
const maskId = (id) => (id ? `${id.slice(0, -2)}••` : '—');
const LOOKUP_STATUS = { approved: ['status-active', 'Đã duyệt'], rejected: ['status-rejected', 'Từ chối'], pending: ['status-pending', 'Chờ người thứ hai duyệt'] };

/** Lượt ra vào khu vực (R-013): mỗi lần đi qua ranh giới một zone có camera thì ghi một dòng, như trạm camera giao thông. */
export default function MovementLog() {
  const { data } = useApp();
  const lookups = data.lookups;
  const [tab, setTab] = useState('feed');
  const zonesOn = Object.values(MOVEMENT_ZONES).filter((z) => z.log).length;
  const total = ZONE_FLOW.reduce((a, z) => a + z.total, 0);
  const ident = ZONE_FLOW.reduce((a, z) => a + z.identified, 0);
  return (
    <div>
      <PageHeader title="Lượt ra vào khu vực" desc="Mỗi lần một người đi qua ranh giới một zone có camera, hệ thống ghi một dòng: ai, zone nào, vào hay ra, lúc nào. Giống trạm camera giao thông ghi biển số."
        badge={<Chip color="secondary" icon="visibility">R-013 đang chạy bóng</Chip>} />
      <Banner tone="warn" className="mb-space-md" icon="gavel" title="Chưa ghi đích danh.">
        Mục đích "Lượt ra vào khu vực" chưa có trong điều khoản hiện hành, nên R-013 đang chạy bóng: chỉ lưu số đếm ẩn danh, danh tính bên dưới là dữ liệu minh họa. Cần điều khoản v1.3, DPIA và (với GV / CBNV) nội quy lao động trước khi bật. <Link to="/dong-y?tab=purposes" className="underline">Xem mục đích xử lý</Link>
      </Banner>

      <DataBoundary name="movement" label="lượt ra vào khu vực" scopeNote="global" skeleton="metrics-table">
      <MetricStrip className="mb-space-md" items={[
        { label: 'Lượt ghi 24 giờ', value: fmtNumber(total), sub: 'Gộp cùng người, cùng zone trong 60 giây' },
        { label: 'Định danh được', value: `${Math.round((ident / total) * 1000) / 10}%`.replace('.', ','), sub: `${fmtNumber(total - ident)} lượt không định danh` },
        { label: 'Zone đang ghi', value: `${zonesOn}/${Object.keys(MOVEMENT_ZONES).length}`, sub: '1 zone mất camera (A101)', alert: true },
        { label: 'Tra cứu theo cá nhân', value: String(lookups.length), sub: `${lookups.filter((l) => l.status === 'pending').length} chờ duyệt • ${lookups.filter((l) => l.status === 'rejected').length} bị từ chối`, alert: lookups.some((l) => l.status === 'pending') },
        { label: 'Thời hạn lưu', value: '90 ngày', sub: 'Tự xóa; giữ lâu hơn khi có sự cố' },
      ]} />

      <div className="card overflow-hidden">
        <Tabs label="Nội dung" className="px-2 border-b border-border-subtle" value={tab} onChange={setTab} items={[
          { key: 'feed', label: 'Luồng ghi nhận' }, { key: 'lookup', label: 'Tra cứu hành trình một người' }, { key: 'flow', label: 'Lưu lượng theo zone (ẩn danh)' }, { key: 'audit', label: 'Lịch sử tra cứu', count: lookups.length },
        ]} />
        {tab === 'feed' && <Feed />}
        {tab === 'lookup' && <Lookup />}
        {tab === 'flow' && <Flow />}
        {tab === 'audit' && <Audit />}
      </div>
      </DataBoundary>
    </div>
  );
}

function Feed() {
  return (
    <>
      <p className="px-space-md py-2 text-caption text-text-secondary border-b border-border-subtle">Danh tính làm mờ mặc định. Không có nút "hiện tên" ở đây: muốn xem hành trình của một người phải gửi yêu cầu tra cứu có lý do.</p>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Thời điểm</th><th>Người</th><th>Zone</th><th>Hướng</th><th>Thiết bị</th><th>Độ tin cậy</th><th>Lưu ảnh</th></tr></thead>
          <tbody>
            {MOVEMENT_FEED.map((r, i) => (
              <tr key={i} className="hover:bg-surface-container-low">
                <td className="font-mono tabular-nums">{r.t}</td>
                <td>{r.identified ? <span className="flex items-center gap-2"><span className="font-mono">{maskId(r.who)}</span><SubjectTypeChip type={r.type} /></span> : <Chip color="status-inactive" icon="face_retouching_off">Không định danh</Chip>}</td>
                <td><span className="font-mono font-medium">{r.zone}</span> <span className="text-text-secondary">{ZONE_NAME[r.zone]}</span></td>
                <td><span className={`flex items-center gap-1 ${DIR[r.dir][2]}`}><Icon name={DIR[r.dir][0]} size={16} />{DIR[r.dir][1]}</span></td>
                <td className="font-mono text-caption">{MOVEMENT_ZONES[r.zone].cam}</td>
                <td className="tabular-nums">{r.conf ? r.conf.toFixed(2).replace('.', ',') : '—'}</td>
                <td>{r.image ? <Chip color="status-pending">Ảnh mờ, 30 ngày</Chip> : <span className="text-text-secondary">Không</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Lookup() {
  const { data, call, toast, can, actor } = useApp();
  const [form, setForm] = useState({ target: '', date: new Date().toISOString().slice(0, 10), incident: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [journey, setJourney] = useState(null);
  const valid = form.target.trim() && form.incident.trim() && form.reason.trim().length >= 10;
  const canRequest = can('movement');
  const canDecide = ['AUDITOR', 'ADMIN'].includes(actor.role);
  const open = data.lookups.filter((l) => l.status === 'pending' || l.status === 'approved').slice(0, 6);

  const submit = async () => {
    setBusy(true);
    try {
      const l = await call(requestMovementLookup, form);
      toast(`Đã gửi ${l.id}`, 'Cần một người khác duyệt trước khi xem hành trình.', 'success');
      setForm((f) => ({ ...f, target: '', incident: '', reason: '' }));
    } catch (e) { toast('Không gửi được', e.message, 'error'); }
    setBusy(false);
  };
  const decide = async (l, approve, note) => {
    try { await call(decideMovementLookup, l.id, approve, note); toast(approve ? `Đã duyệt ${l.id}` : `Đã từ chối ${l.id}`, l.target, approve ? 'success' : 'info'); } catch (e) { toast('Không thực hiện được', e.message, 'error'); }
    setRejecting(null);
  };
  const view = async (l) => {
    try { setJourney({ lookup: l, j: await call(openMovementJourney, l.id) }); } catch (e) { toast('Không mở được', e.message, 'error'); }
  };

  return (
    <div className="p-space-md grid grid-cols-[360px_minmax(0,1fr)] gap-space-md items-start">
      <section className="p-3 rounded-lg border border-border-subtle flex flex-col gap-space-sm">
        <h3 className="text-label-md font-semibold">Yêu cầu tra cứu</h3>
        <p className="text-caption text-text-secondary">Giống tra lịch sử một biển số: chỉ khi có sự cố, nêu lý do, một người khác duyệt. Mỗi lượt gửi, duyệt và xem đều ghi vào Nhật ký truy vết.</p>
        <label className="flex flex-col gap-1 text-label-md">Mã người<input className="input font-mono" placeholder="Ví dụ: SV-2023-8891" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></label>
        <label className="flex flex-col gap-1 text-label-md">Ngày<input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <label className="flex flex-col gap-1 text-label-md">Mã sự cố (bắt buộc)<input className="input font-mono" placeholder="Ví dụ: AN-291" value={form.incident} onChange={(e) => setForm({ ...form, incident: e.target.value })} /></label>
        <label className="flex flex-col gap-1 text-label-md">Lý do (tối thiểu 10 ký tự)<textarea className="input !h-20 py-2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ví dụ: Báo mất đồ tại C302 lúc 09:30" /></label>
        <button className="btn-primary" disabled={!valid || busy || !canRequest} onClick={submit}><Icon name="send" />Gửi yêu cầu</button>
        <p className="text-caption text-text-secondary">Không dùng để kiểm tra chuyên cần hay chấm công: những việc đó có trang riêng và sẽ bị từ chối.</p>
      </section>

      <section className="flex flex-col gap-space-md min-w-0">
        {open.length === 0 && <Empty icon="route" title="Chưa có yêu cầu tra cứu" desc="Hành trình chỉ hiện sau khi yêu cầu được duyệt." />}
        {open.length > 0 && (
          <ul className="card divide-y divide-border-subtle">
            {open.map((l) => {
              const own = l.by_id === actor.id;
              return (
                <li key={l.id} className="px-space-md py-2.5 flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-caption">{l.id}</span>
                  <span className="flex-1 min-w-[200px] text-body-sm"><b className="font-mono">{l.target}</b> ngày {l.date.split('-').reverse().join('/')} • sự cố <span className="font-mono">{l.incident}</span> • {l.reason}<span className="block text-caption text-text-secondary">Gửi bởi {l.by}, {fmtDateTime(l.at)}{l.approver && ` • duyệt bởi ${l.approver}`}</span></span>
                  {l.status === 'approved'
                    ? <button className="btn-outline btn-sm" onClick={() => view(l)}><Icon name="route" size={16} />Xem hành trình</button>
                    : (
                      <span className="flex items-center gap-1.5">
                        <Chip color="status-pending" icon="group">Chờ người thứ hai</Chip>
                        {canDecide && !own && <button className="btn-outline btn-sm" onClick={() => decide(l, true, null)}><Icon name="how_to_reg" size={16} />Duyệt</button>}
                        {canDecide && !own && <button className="btn btn-sm text-status-rejected hover:bg-status-rejected/10" onClick={() => setRejecting(l)}>Từ chối</button>}
                        {(own || !canDecide) && <span className="text-caption text-text-secondary">{own ? 'Bạn là người gửi, cần người khác duyệt.' : 'Chỉ Kiểm toán viên trưởng duyệt.'}</span>}
                      </span>
                    )}
                </li>
              );
            })}
          </ul>
        )}

        {journey && (
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-k-title-md">{journey.j.name}</h3><span className="font-mono text-caption text-text-secondary">{journey.j.id}{journey.j.cls && ` • ${journey.j.cls}`}</span>
              <Chip color="status-active" icon="verified">{journey.lookup.id} đã duyệt • sự cố {journey.lookup.incident}</Chip>
              <button className="btn btn-sm ml-auto text-text-secondary hover:bg-surface-container-low" onClick={() => setJourney(null)}><Icon name="close" size={16} />Đóng</button>
            </div>
            {journey.j.rows.length > 0 && (
              <ol className="card divide-y divide-border-subtle">
                {journey.j.rows.map((r) => (
                  <li key={r.t} className="px-space-md py-2.5 flex items-center gap-3">
                    <span className="font-mono tabular-nums w-20">{r.t}</span>
                    <span className={`flex items-center gap-1 w-14 ${DIR[r.dir][2]}`}><Icon name={DIR[r.dir][0]} size={16} />{DIR[r.dir][1]}</span>
                    <span className="flex-1"><span className="font-mono font-medium">{r.zone}</span> {ZONE_NAME[r.zone]}</span>
                    <span className="text-caption text-text-secondary">{r.src}</span>
                    <span className="text-caption tabular-nums w-10 text-right">{r.conf.toFixed(2).replace('.', ',')}</span>
                  </li>
                ))}
              </ol>
            )}
            <ul className="text-caption text-text-secondary flex flex-col gap-0.5">{journey.j.gaps.map((g) => <li key={g} className="flex items-start gap-1"><Icon name="info" size={14} className="mt-0.5" />{g}</li>)}</ul>
          </div>
        )}
      </section>

      <ConfirmReason open={!!rejecting} onClose={() => setRejecting(null)} danger title="Từ chối tra cứu hành trình" subtitle={rejecting && `${rejecting.id} • ${rejecting.target}`} confirmLabel="Từ chối"
        reasonLabel="Lý do từ chối" placeholder="Ví dụ: không gắn với sự cố cụ thể; chuyên cần xem ở Lịch học & điểm danh."
        onConfirm={(note) => decide(rejecting, false, note)} />
    </div>
  );
}

function Flow() {
  const max = Math.max(...ZONE_FLOW.map((z) => z.total));
  return (
    <div className="p-space-md flex flex-col gap-space-sm">
      <p className="text-caption text-text-secondary">Số lượt vào + ra trong 24 giờ. Không có danh tính: ai cũng xem được báo cáo này.</p>
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Zone</th><th className="min-w-[280px]">Lượt qua (24 giờ)</th><th>Không định danh</th><th>Cao điểm</th></tr></thead>
          <tbody>
            {ZONE_FLOW.map((z) => (
              <tr key={z.zone}>
                <td><span className="font-mono font-medium">{z.zone}</span> <span className="text-text-secondary">{ZONE_NAME[z.zone]}</span></td>
                <td><div className="flex items-center gap-2"><span className="tabular-nums w-16">{fmtNumber(z.total)}</span><div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${(z.total / max) * 100}%` }} /></div></div></td>
                <td className="tabular-nums">{fmtNumber(z.total - z.identified)}</td>
                <td className="tabular-nums">{z.peak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Banner icon="block" title="Không bao giờ ghi ở:">{NEVER_LOG.join(', ')}. Bật / tắt từng zone ở <Link to="/khong-gian" className="underline">Không gian & khu vực</Link>.</Banner>
    </div>
  );
}

function Audit() {
  const { data } = useApp();
  return (
    <div className="overflow-x-auto">
      <p className="px-space-md py-2 text-caption text-text-secondary border-b border-border-subtle">Đọc từ cùng dữ liệu với Nhật ký truy vết; mỗi yêu cầu, quyết định và lượt xem ở đây đều có dòng tương ứng ở đó.</p>
      <table className="data-table">
        <thead><tr><th>Mã</th><th>Gửi lúc</th><th>Người tra cứu</th><th>Tra ai, ngày nào</th><th>Sự cố và lý do</th><th>Người duyệt</th><th>Kết quả</th></tr></thead>
        <tbody>
          {data.lookups.map((l) => (
            <tr key={l.id} className="align-top">
              <td className="font-mono py-3">{l.id}</td>
              <td className="py-3 whitespace-nowrap">{fmtDateTime(l.at)}</td>
              <td className="py-3">{l.by}</td>
              <td className="py-3"><span className="font-mono">{l.target}</span><div className="text-caption text-text-secondary">{l.date.split('-').reverse().join('/')}</div></td>
              <td className="py-3 min-w-[240px]"><span className="font-mono text-caption">{l.incident}</span> • {l.reason}{l.note && <div className={`text-caption ${l.status === 'rejected' ? 'text-status-rejected' : 'text-text-secondary'}`}>{l.note}</div>}</td>
              <td className="py-3">{l.approver || '—'}{l.decided_at && <div className="text-caption text-text-secondary">{fmtDateTime(l.decided_at)}</div>}</td>
              <td className="py-3"><Chip color={LOOKUP_STATUS[l.status][0]}>{LOOKUP_STATUS[l.status][1]}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.lookups.length === 0 && <Empty title="Chưa có lượt tra cứu nào" />}
    </div>
  );
}
