import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, PageHeader } from '../components/ui';
import { useApp } from '../store';
import { SOC_EVENTS, DEVICES } from '../data/mock';

const Metric = ({ label, value, sub, alert }) => (
  <div className="px-space-md py-3.5">
    <div className="text-caption text-text-secondary">{label}</div>
    <div className="text-[26px] font-semibold leading-8 mt-1 tabular-nums">{value}</div>
    <div className={`text-caption mt-0.5 ${alert ? 'text-status-pending font-medium' : 'text-text-secondary'}`}>{sub}</div>
  </div>
);

const LEVEL = {
  critical: { label: 'Nghiêm trọng', icon: 'error', color: 'text-status-rejected' },
  warning: { label: 'Cảnh báo', icon: 'warning', color: 'text-status-pending' },
};

function AttentionList({ items }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
      {items.map((it) => (
        <Link key={it.key} to={it.to} className="grid grid-cols-[112px_1fr_auto_16px] items-center gap-3 px-space-md py-2.5 hover:bg-surface-container-low">
          <span className={`flex items-center gap-1.5 text-label-sm ${LEVEL[it.level].color}`}><Icon name={LEVEL[it.level].icon} size={15} />{LEVEL[it.level].label}</span>
          <span className="min-w-0">
            <span className="block text-label-md font-semibold truncate">{it.title}</span>
            <span className="block text-caption text-text-secondary truncate">{it.meta}</span>
          </span>
          <span className="text-caption font-mono text-text-secondary whitespace-nowrap">{it.when}</span>
          <Icon name="chevron_right" size={16} className="text-status-inactive" />
        </Link>
      ))}
    </div>
  );
}

const WEEK = [['T2', 92.1], ['T3', 93.4], ['T4', 91.8], ['T5', 94.0], ['T6', 89.6], ['T7', 95.2], ['CN', null]];
const Y_MIN = 80;
const Y_MAX = 100;
const LABELLED = ['T6', 'T7'];

function AttendanceChart() {
  const ref = useRef();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const H = 196;
  const pad = { l: 36, r: 12, t: 16, b: 24 };
  const band = (width - pad.l - pad.r) / WEEK.length;
  const x = (i) => pad.l + band * (i + 0.5);
  const y = (v) => pad.t + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - pad.t - pad.b);
  const points = WEEK.map(([d, v], i) => ({ d, v, i })).filter((p) => p.v != null);
  const cur = active != null ? points.find((p) => p.i === active) : null;
  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="group" aria-label="Tỉ lệ điểm danh 7 ngày: cao nhất 95.2% vào T7, thấp nhất 89.6% vào T6.">
          {[80, 90, 100].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="stroke-border-subtle" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-text-secondary text-[11px] tabular-nums">{t}%</text>
            </g>
          ))}
          {WEEK.map(([d], i) => <text key={d} x={x(i)} y={H - 6} textAnchor="middle" className="fill-text-secondary text-[12px]">{d}</text>)}
          <polyline fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary-container" points={points.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
          {points.map((p) => (
            <g key={p.d}>
              <circle cx={x(p.i)} cy={y(p.v)} r="4" strokeWidth="2" className="fill-primary-container stroke-surface" />
              {LABELLED.includes(p.d) && active !== p.i && <text x={x(p.i)} y={y(p.v) + (p.d === 'T6' ? 20 : -10)} textAnchor="middle" className="fill-text-primary text-[12px] font-medium tabular-nums">{p.v}%</text>}
              <rect x={x(p.i) - band / 2} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" role="img" tabIndex={0} aria-label={`${p.d}: ${p.v}%`} onMouseEnter={() => setActive(p.i)} onFocus={() => setActive(p.i)} onBlur={() => setActive(null)} />
            </g>
          ))}
        </svg>
      )}
      {cur && (
        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-2 py-1 rounded bg-inverse-surface text-inverse-on-surface text-caption tabular-nums whitespace-nowrap" style={{ left: x(cur.i), top: y(cur.v) - 10 }}>
          {cur.d}: <b className="font-semibold">{cur.v}%</b>
        </div>
      )}
    </div>
  );
}

const PIPELINE = [
  ['Thu thập', 'App MyDaiNam (selfie) • Camera/Kiosk chuyên dụng'],
  ['Quality Gating', 'Độ sáng, góc nghiêng, Liveness / Anti-spoofing'],
  ['Trích xuất vector', 'SCRFD + ArcFace → Embedding 512d (AES-256, pgvector)'],
  ['Policy Engine (PDP)', 'Đối tượng + Không gian + Thời gian (Redis Streams)'],
  ['Hành động', 'Điểm danh / Ghi hình bài giảng / Cảnh báo SOC ≤2s'],
];

export default function Dashboard() {
  const { requests, scope } = useApp();
  const pendingList = requests.filter((r) => r.status === 'pending');
  const urgent = pendingList.filter((r) => r.slaUrgent);
  const offline = DEVICES.filter((d) => !d.online);
  const attention = [
    ...SOC_EVENTS.filter((e) => e.state === 'open' && e.level === 'critical').map((e) => ({ key: e.id, level: e.level, title: e.title, meta: `${e.place} • ${e.cam}`, when: e.time, to: '/soc' })),
    ...urgent.map((r) => ({ key: r.id, level: 'warning', title: `${r.kindLabel}: ${r.name}`, meta: `${r.id} • ${r.unit}`, when: r.sla, to: '/yeu-cau' })),
    ...offline.map((d) => ({ key: d.id, level: 'warning', title: `${d.id} mất kết nối`, meta: `Phòng ${d.room} • ${d.ip}`, when: 'Ngoại tuyến', to: '/thiet-bi' })),
    ...SOC_EVENTS.filter((e) => e.state === 'open' && e.level === 'warning').map((e) => ({ key: e.id, level: e.level, title: e.title, meta: `${e.place} • ${e.cam}`, when: e.time, to: '/soc' })),
  ];
  return (
    <div>
      <PageHeader title="Tổng quan hệ thống" desc={`Phạm vi: ${scope.tenant} • ${scope.unit}`}
        actions={<Link to="/kiosk" className="btn-outline"><Icon name="photo_camera_front" size={16} />Mở Kiosk trạm chụp</Link>} />

      <div className="card grid grid-cols-4 divide-x divide-border-subtle mb-space-md">
        <Metric label="Hồ sơ Face ID đã thu thập" value="23,430" sub="94.3% / 24,850 đối tượng" />
        <Metric label="Tỉ lệ điểm danh hôm nay" value="95.2%" sub="PRESENT 11,842 • LATE 412" />
        <Metric label="Yêu cầu chờ duyệt" value={pendingList.length} sub={urgent.length ? `${urgent.length} yêu cầu sắp quá SLA` : 'Trong hạn SLA'} alert={urgent.length > 0} />
        <Metric label="Thiết bị trực tuyến" value={`${DEVICES.length - offline.length}/${DEVICES.length}`} sub={offline.length ? `${offline.length} thiết bị mất kết nối` : 'Tất cả trực tuyến'} alert={offline.length > 0} />
      </div>

      <div className="grid grid-cols-12 gap-space-md items-start">
        <section className="col-span-7 card">
          <div className="flex items-baseline justify-between px-space-md py-3">
            <h2 className="text-headline-md">Cần xử lý <span className="ml-1 font-normal text-text-secondary tabular-nums">{attention.length}</span></h2>
            <Link to="/soc" className="text-caption text-primary-container hover:underline">Mở SOC</Link>
          </div>
          <AttentionList items={attention} />
        </section>

        <section className="col-span-5 card p-space-md">
          <h2 className="text-headline-md mb-2">Tỉ lệ điểm danh 7 ngày</h2>
          <AttendanceChart />
          <p className="text-caption text-text-secondary mt-1">Trục tung từ 80%. Chủ nhật không có lịch học. Nguồn: Policy Engine.</p>
        </section>

        <section className="col-span-12 card">
          <h2 className="text-headline-md px-space-md py-3 border-b border-border-subtle">Luồng dữ liệu SACIP</h2>
          <ol className="grid grid-cols-5 divide-x divide-border-subtle">
            {PIPELINE.map(([t, d]) => (
              <li key={t} className="px-space-md py-3">
                <div className="text-label-md font-semibold">{t}</div>
                <p className="text-caption text-text-secondary mt-0.5">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
