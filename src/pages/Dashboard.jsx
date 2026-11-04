import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bone, Chip, DataBoundary, Icon, MetricsSkeleton, MetricStrip, PageHeader, Tabs } from '../components/ui';
import { useApp } from '../store';
import { REQUEST_TYPE } from '../api/enums';
import { SOC_EVENTS, DEVICES } from '../data/mock';
import { fmtNumber, fmtPercent, fmtRelative, slaState } from '../lib/format';
import { useScope } from '../lib/scope';

const LEVEL = {
  critical: { label: 'Nghiêm trọng', icon: 'error', color: 'text-status-rejected' },
  warning: { label: 'Cảnh báo', icon: 'warning', color: 'text-status-pending' },
};

function AttentionList({ items }) {
  if (!items.length) return <p className="px-space-md py-6 text-body-sm text-text-secondary border-t border-border-subtle">Không có việc cần xử lý.</p>;
  return (
    <div className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
      {items.map((it) => (
        <Link key={it.key} to={it.to} className="grid grid-cols-[116px_1fr_auto_16px] items-center gap-3 min-h-[60px] px-space-md py-2.5 hover:bg-surface-container-low -outline-offset-2">
          <span className={`flex items-center gap-1.5 text-label-sm ${LEVEL[it.level].color}`}><Icon name={LEVEL[it.level].icon} size={16} />{LEVEL[it.level].label}</span>
          <span className="min-w-0">
            <span className="block text-label-md font-semibold truncate">{it.title}</span>
            <span className="block text-caption text-text-secondary truncate">{it.meta}</span>
          </span>
          <span className="text-caption text-text-secondary whitespace-nowrap">{it.when}</span>
          <Icon name="chevron_right" size={16} className="text-status-inactive" />
        </Link>
      ))}
    </div>
  );
}

/** Thanh tỷ lệ có ngưỡng: dưới 90% tô vàng để thấy điểm nghẽn. */
const RateBar = ({ part, total, label }) => {
  const pct = total ? (part / total) * 100 : 0;
  const low = pct < 90;
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={`${label}: ${fmtNumber(part)}/${fmtNumber(total)}`}>
      <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden"><div className={`anim-grow h-full ${low ? 'bg-status-amber' : 'bg-primary-container'}`} style={{ width: `${pct}%` }} /></div>
      <span className={`w-14 text-right tabular-nums text-label-sm ${low ? 'text-status-pending font-semibold' : ''}`}>{fmtPercent(pct)}</span>
    </div>
  );
};

const DIMENSIONS = [
  { key: 'faculty', label: 'Theo khoa' },
  { key: 'cohort', label: 'Theo khóa' },
  { key: 'staff', label: 'Cán bộ, giảng viên' },
  { key: 'contractor', label: 'Đơn vị thuê ngoài' },
  { key: 'dorm', label: 'KTX' },
];

const toRows = (coverage, dim) => (dim === 'faculty'
  ? coverage.faculty.map((f) => ({ key: f.key, name: f.name, total: f.total, collected: f.collected, consent: f.consent, children: f.children.map(([name, total, collected, consent]) => ({ key: `${f.key}-${name}`, name: `Khóa ${name}`, total, collected, consent })) }))
  : coverage[dim].map(([name, total, collected, consent]) => ({ key: name, name: dim === 'cohort' ? `Khóa ${name}` : name, total, collected, consent })));

function Coverage({ coverage, dim, setDim }) {
  const { matchUnit, allUnits, unitLabel } = useScope();
  const [open, setOpen] = useState(new Set());
  let rows = toRows(coverage, dim);
  if (dim === 'faculty' && !allUnits) rows = rows.filter((r) => matchUnit(r.key));
  rows.sort((a, b) => a.collected / a.total - b.collected / b.total);
  const sum = rows.reduce((s, r) => ({ total: s.total + r.total, collected: s.collected + r.collected, consent: s.consent + r.consent }), { total: 0, collected: 0, consent: 0 });
  const toggle = (k) => setOpen((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-space-md pt-3">
        <div>
          <h2 className="text-headline-md">Tỷ lệ phủ Face ID và đồng ý</h2>
          <p className="text-caption text-text-secondary">Sắp xếp từ thấp đến cao để thấy điểm nghẽn trước. Dưới 90% tô vàng. Bấm một khoa để xem theo khóa.</p>
        </div>
      </div>
      <Tabs label="Chiều xem" className="px-2 border-b border-border-subtle" value={dim} onChange={(d) => { setDim(d); setOpen(new Set()); }} items={DIMENSIONS} />
      {dim === 'faculty' && !allUnits && rows.length === 0 && <p className="px-space-md py-4 text-body-sm text-text-secondary">{unitLabel} không phải khoa đào tạo. Chọn chiều xem khác.</p>}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th className="min-w-[200px]">Đơn vị</th><th className="text-right">Tổng</th><th>Đã thu thập Face ID</th><th>Đã xác nhận đồng ý</th><th className="text-right">Chưa thu</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.key}>
                <tr className={r.children ? 'cursor-pointer hover:bg-surface-container-low' : ''} onClick={r.children ? () => toggle(r.key) : undefined}>
                  <td>
                    {r.children
                      ? <button type="button" aria-expanded={open.has(r.key)} className="flex items-center gap-1.5 font-medium text-left" onClick={(e) => { e.stopPropagation(); toggle(r.key); }}><Icon name={open.has(r.key) ? 'expand_more' : 'chevron_right'} size={18} />{r.name}</button>
                      : <span className="font-medium">{r.name}</span>}
                  </td>
                  <td className="text-right tabular-nums">{fmtNumber(r.total)}</td>
                  <td><RateBar part={r.collected} total={r.total} label="Đã thu thập" /></td>
                  <td><RateBar part={r.consent} total={r.total} label="Đã đồng ý" /></td>
                  <td className="text-right tabular-nums">{fmtNumber(r.total - r.collected)}</td>
                </tr>
                {open.has(r.key) && r.children.map((c) => (
                  <tr key={c.key} className="bg-surface-bright">
                    <td className="!pl-10 text-text-secondary">{c.name}</td>
                    <td className="text-right tabular-nums">{fmtNumber(c.total)}</td>
                    <td><RateBar part={c.collected} total={c.total} label="Đã thu thập" /></td>
                    <td><RateBar part={c.consent} total={c.total} label="Đã đồng ý" /></td>
                    <td className="text-right tabular-nums">{fmtNumber(c.total - c.collected)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {rows.length > 1 && (
              <tr className="bg-surface-container-low font-semibold">
                <td>Cộng</td><td className="text-right tabular-nums">{fmtNumber(sum.total)}</td>
                <td><RateBar part={sum.collected} total={sum.total} label="Đã thu thập" /></td>
                <td><RateBar part={sum.consent} total={sum.total} label="Đã đồng ý" /></td>
                <td className="text-right tabular-nums">{fmtNumber(sum.total - sum.collected)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const KIND = { BIAS: ['Lệch chuẩn', 'balance'], DEVICE_FRAUD: ['Nghi gian lận thiết bị', 'phonelink_lock'] };

const DashboardSkeleton = () => (
  <>
    <MetricsSkeleton subLines={2} />
    <div className="grid grid-cols-12 gap-space-md items-start">
      <div className="col-span-8 card overflow-hidden">
        <div className="px-space-md pt-3 pb-1">
          <Bone className="h-5 w-64" />
          <Bone className="h-3 w-4/5 mt-2" />
        </div>
        <div className="h-11 px-space-md flex items-center gap-5 border-b border-border-subtle">
          {['w-20', 'w-20', 'w-28', 'w-28', 'w-10'].map((w, i) => <Bone key={i} className={`h-4 ${w}`} />)}
        </div>
        <div className="h-10 bg-surface-container-low border-b border-border-subtle" />
        {[0, 1, 2, 3, 4, 5, 6].map((r) => (
          <div key={r} className="h-[37px] px-3 grid grid-cols-[2fr_1fr_2fr_2fr_1fr] items-center gap-4 border-b border-border-subtle last:border-0">
            <Bone className={`h-4 ${r % 2 ? 'w-3/5' : 'w-4/5'}`} />
            <Bone className="h-4 w-12 justify-self-end" />
            <Bone className="h-2 rounded-full" />
            <Bone className="h-2 rounded-full" />
            <Bone className="h-4 w-10 justify-self-end" />
          </div>
        ))}
      </div>
      <div className="col-span-4 flex flex-col gap-space-md">
        <div className="card overflow-hidden">
          <div className="h-12 px-space-md flex items-center"><Bone className="h-5 w-40" /></div>
          <div className="divide-y divide-border-subtle border-t border-border-subtle">
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="px-space-md py-2.5 flex gap-2.5">
                <Bone className="w-[18px] h-[18px] shrink-0" />
                <div className="flex-1">
                  <Bone className="h-4 my-0.5 w-full" />
                  <Bone className="h-4 my-0.5 w-3/5" />
                  <Bone className="h-3 my-[3px] w-full" />
                  <Bone className="h-3 my-[3px] w-4/5" />
                  <Bone className="h-5 mt-1 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-space-md">
          <Bone className="h-5 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-2">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-16" />)}</div>
        </div>
      </div>
      <div className="col-span-12 card overflow-hidden">
        <div className="h-12 px-space-md flex items-center"><Bone className="h-5 w-28" /></div>
        <div className="divide-y divide-border-subtle border-t border-border-subtle">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <div key={r} className="min-h-[60px] px-space-md grid grid-cols-[116px_1fr_auto] items-center gap-3">
              <Bone className="h-4 w-24" />
              <div><Bone className={`h-4 ${r % 2 ? 'w-1/3' : 'w-2/5'}`} /><Bone className="h-3 w-1/4 mt-2" /></div>
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default function Dashboard() {
  const { data } = useApp();
  const { scope, unitLabel } = useScope();
  // Giữ ở đây để chiều xem không mất khi đổi đơn vị làm bảng tải lại.
  const [dim, setDim] = useState('faculty');
  const subjectOf = (r) => data.subjects.find((s) => s.subject_id === r.subject_id);
  const pending = data.requests.filter((r) => r.status === 'pending');
  const urgent = pending.filter((r) => slaState(r.sla_due) !== 'ok');
  const offline = DEVICES.filter((d) => !d.online);
  const sourceErr = data.sources.filter((s) => s.status === 'ERROR');
  const { backlog: bl, consentStats: cs, anomalies } = data;
  const totalAll = data.coverage.faculty.reduce((n, f) => n + f.total, 0) + data.coverage.staff.reduce((n, r) => n + r[1], 0) + data.coverage.contractor.reduce((n, r) => n + r[1], 0) + data.coverage.dorm.reduce((n, r) => n + r[1], 0);
  const collectedAll = data.coverage.faculty.reduce((n, f) => n + f.collected, 0) + data.coverage.staff.reduce((n, r) => n + r[2], 0) + data.coverage.contractor.reduce((n, r) => n + r[2], 0) + data.coverage.dorm.reduce((n, r) => n + r[2], 0);
  const autoRate = (bl.auto_approved_7d / (bl.auto_approved_7d + bl.manual_approved_7d)) * 100;

  const attention = [
    ...SOC_EVENTS.filter((e) => e.state === 'open' && e.level === 'critical').map((e) => ({ key: e.id, level: 'critical', title: e.title, meta: `${e.place} • ${e.cam}`, when: e.time, to: '/soc' })),
    ...anomalies.filter((a) => a.severity === 'HIGH').map((a) => ({ key: a.id, level: 'critical', title: a.title, meta: `${KIND[a.kind][0]} • ${a.ref}`, when: 'Đang mở', to: '/nhat-ky' })),
    ...urgent.map((r) => ({ key: r.request_id, level: 'warning', title: `${REQUEST_TYPE[r.request_type].label}: ${subjectOf(r).name}`, meta: `${r.request_id} • ${subjectOf(r).code}`, when: slaState(r.sla_due) === 'over' ? 'Quá hạn' : fmtRelative(r.sla_due), to: `/yeu-cau?id=${r.request_id}` })),
    ...sourceErr.map((s) => ({ key: s.id, level: 'warning', title: `${s.name} không đồng bộ được`, meta: s.note, when: fmtRelative(s.last_sync), to: '/tich-hop' })),
    ...offline.map((d) => ({ key: d.id, level: 'warning', title: `${d.id} mất kết nối`, meta: `Phòng ${d.room} • ${d.ip}`, when: 'Ngoại tuyến', to: '/thiet-bi' })),
  ];

  return (
    <div>
      <PageHeader title="Tổng quan" desc={`Phạm vi: ${scope.tenant} • ${unitLabel}`}
        actions={<Link to="/kiosk" className="btn-outline"><Icon name="photo_camera_front" />Mở Kiosk trạm chụp</Link>} />

      <DataBoundary name={`dashboard:${scope.unit}`} label="số liệu tổng quan" scopeNote="units" skeleton={<DashboardSkeleton />} reveal={false}>
        <MetricStrip className="anim-fade mb-space-md" items={[
          { label: 'Tỷ lệ phủ Face ID', value: fmtPercent((collectedAll / totalAll) * 100), sub: `${fmtNumber(totalAll - collectedAll)} người chưa thu thập`, to: '/ho-so' },
          { label: 'Đã đồng ý theo điều khoản hiện hành', value: fmtPercent((cs.active_current / cs.total) * 100), sub: `${fmtNumber(cs.active_old)} người còn ở điều khoản cũ • ${fmtNumber(cs.pending)} chưa xác nhận`, alert: true, to: '/dong-y' },
          { label: 'Yêu cầu chụp lại tồn đọng', value: fmtNumber(bl.rescan_open), sub: `Lâu nhất ${bl.rescan_oldest_hours} giờ • ${bl.over_sla} quá hạn`, alert: bl.over_sla > 0, to: '/yeu-cau' },
          { label: 'AI tự duyệt (7 ngày)', value: fmtPercent(autoRate), sub: `${fmtNumber(bl.auto_approved_7d)} tự duyệt • ${fmtNumber(bl.manual_approved_7d)} người duyệt`, to: '/nhat-ky' },
        ]} />

        <div className="reveal grid grid-cols-12 gap-space-md items-start">
          <div className="col-span-8"><Coverage coverage={data.coverage} dim={dim} setDim={setDim} /></div>

          <div className="col-span-4 flex flex-col gap-space-md">
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between h-12 px-space-md">
                <h2 className="text-headline-md">Cảnh báo bất thường</h2>
                <Link to="/nhat-ky" className="text-label-sm text-primary-container hover:underline">Kiểm toán</Link>
              </div>
              <ul className="divide-y divide-border-subtle border-t border-border-subtle">
                {anomalies.map((a) => (
                  <li key={a.id} className="px-space-md py-2.5 flex gap-2.5">
                    <Icon name={KIND[a.kind][1]} size={18} className={a.severity === 'HIGH' ? 'text-status-rejected mt-0.5' : 'text-status-pending mt-0.5'} />
                    <div className="min-w-0">
                      <div className="text-label-md font-semibold">{a.title}</div>
                      <div className="text-caption text-text-secondary">{a.detail}</div>
                      <div className="mt-1 flex gap-1.5"><Chip color={a.kind === 'BIAS' ? 'secondary' : 'status-rejected'}>{KIND[a.kind][0]}</Chip><span className="font-mono text-caption text-text-secondary">{a.ref}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="card p-space-md">
              <h2 className="text-headline-md mb-2">Hàng chờ</h2>
              <dl className="grid grid-cols-2 gap-2 text-body-sm">
                {[
                  ['Chờ duyệt (mẫu)', pending.length, '/yeu-cau'],
                  ['Đăng ký mới chờ duyệt', fmtNumber(bl.new_registration_open), '/yeu-cau'],
                  ['Chụp lại quá hạn', bl.over_sla, '/yeu-cau'],
                  ['Chờ xóa dữ liệu', data.erasures.filter((e) => e.status !== 'DONE').length, '/dong-y'],
                ].map(([l, v, to]) => (
                  <Link key={l} to={to} className="p-2.5 rounded bg-surface-container-low hover:bg-surface-container"><dt className="text-caption text-text-secondary">{l}</dt><dd className="text-k-title-md tabular-nums">{v}</dd></Link>
                ))}
              </dl>
            </section>
          </div>

          <section className="col-span-12 card overflow-hidden">
            <div className="flex items-center justify-between h-12 px-space-md">
              <h2 className="text-headline-md">Cần xử lý <span className="ml-1 font-normal text-text-secondary tabular-nums">{attention.length}</span></h2>
              <Link to="/soc" className="text-label-sm text-primary-container hover:underline">Trang An ninh</Link>
            </div>
            <AttentionList items={attention} />
          </section>
        </div>
      </DataBoundary>
    </div>
  );
}
