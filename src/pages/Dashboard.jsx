import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataBoundary, Icon, Chip, MetricStrip, PageHeader } from '../components/ui';
import { useApp } from '../store';
import { RECORDING_META, SCHEDULE, SOC_EVENTS, DEVICES, UNIT_STATS } from '../data/mock';
import { fmtNumber, fmtPercent } from '../lib/format';
import { useScope } from '../lib/scope';

const LEVEL = {
  critical: { label: 'Nghiêm trọng', icon: 'error', color: 'text-status-rejected' },
  warning: { label: 'Cảnh báo', icon: 'warning', color: 'text-status-pending' },
};

function AttentionList({ items }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
      {items.map((it) => (
        <Link key={it.key} to={it.to} className="grid grid-cols-[116px_1fr_auto_16px] items-center gap-3 min-h-[60px] px-space-md py-2.5 hover:bg-surface-container-low -outline-offset-2">
          <span className={`flex items-center gap-1.5 text-label-sm ${LEVEL[it.level].color}`}><Icon name={LEVEL[it.level].icon} size={16} />{LEVEL[it.level].label}</span>
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
  const pad = { l: 44, r: 12, t: 16, b: 24 };
  const band = (width - pad.l - pad.r) / WEEK.length;
  const x = (i) => pad.l + band * (i + 0.5);
  const y = (v) => pad.t + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * (H - pad.t - pad.b);
  const points = WEEK.map(([d, v], i) => ({ d, v, i })).filter((p) => p.v != null);
  const cur = active != null ? points.find((p) => p.i === active) : null;
  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="group" aria-label="Tỉ lệ điểm danh 7 ngày: cao nhất 95,2% vào T7, thấp nhất 89,6% vào T6.">
          {[80, 90, 100].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="stroke-border-subtle" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-text-secondary text-caption tabular-nums">{t}%</text>
            </g>
          ))}
          {WEEK.map(([d], i) => <text key={d} x={x(i)} y={H - 6} textAnchor="middle" className="fill-text-secondary text-caption">{d}</text>)}
          <polyline fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary-container" points={points.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
          {points.map((p) => (
            <g key={p.d}>
              <circle cx={x(p.i)} cy={y(p.v)} r="4" strokeWidth="2" className="fill-primary-container stroke-surface" />
              {LABELLED.includes(p.d) && active !== p.i && <text x={x(p.i)} y={y(p.v) + (p.d === 'T6' ? 20 : -10)} textAnchor="middle" className="fill-text-primary text-caption font-medium tabular-nums">{fmtPercent(p.v)}</text>}
              <rect x={x(p.i) - band / 2} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" role="img" tabIndex={0} aria-label={`${p.d}: ${fmtPercent(p.v)}`} onMouseEnter={() => setActive(p.i)} onFocus={() => setActive(p.i)} onBlur={() => setActive(null)} />
            </g>
          ))}
        </svg>
      )}
      {cur && (
        <div className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-2 py-1 rounded bg-inverse-surface text-inverse-on-surface text-caption tabular-nums whitespace-nowrap" style={{ left: x(cur.i), top: y(cur.v) - 10 }}>
          {cur.d}: <b className="font-semibold">{fmtPercent(cur.v)}</b>
        </div>
      )}
    </div>
  );
}

const PIPELINE = [
  ['Thu thập', 'App MyDaiNam (selfie), camera và kiosk chuyên dụng'],
  ['Kiểm tra chất lượng ảnh', 'Độ sáng, góc nghiêng, kiểm tra người thật'],
  ['Trích xuất đặc trưng', 'Chuyển ảnh thành vector 512 chiều, mã hóa AES-256'],
  ['Đối chiếu quy tắc', 'Đối tượng + không gian + thời gian'],
  ['Hành động', 'Điểm danh, ghi hình bài giảng, cảnh báo an ninh trong 2 giây'],
];

export default function Dashboard() {
  const { requests } = useApp();
  const { scope, allUnits, matchUnit, matchSubject } = useScope();
  const stats = UNIT_STATS[scope.unit];
  const pendingList = requests.filter((r) => r.status === 'pending' && matchUnit(r.unit) && matchSubject(r.subjectId));
  const schedule = SCHEDULE.filter((s) => matchUnit(s.cls));
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
      <PageHeader title="Tổng quan hệ thống" desc={`Phạm vi: ${scope.tenant} • ${scope.unit} • ${scope.subject}`}
        actions={<Link to="/kiosk" className="btn-outline"><Icon name="photo_camera_front" />Mở Kiosk trạm chụp</Link>} />

      <DataBoundary name="dashboard" label="số liệu tổng quan" scopeNote="units">
      <MetricStrip className="mb-space-md" items={[
        { label: 'Hồ sơ Face ID đã thu thập', value: fmtNumber(stats.collected), sub: `${fmtPercent((stats.collected / stats.total) * 100)} trên ${fmtNumber(stats.total)} đối tượng`, to: '/ho-so' },
        { label: 'Tỉ lệ điểm danh hôm nay', value: fmtPercent(stats.rate), sub: `Có mặt ${fmtNumber(stats.present)} • Đi muộn ${fmtNumber(stats.late)}`, to: '/thoi-khoa-bieu' },
        { label: 'Yêu cầu chờ duyệt', value: pendingList.length, sub: urgent.length ? `${urgent.length} yêu cầu sắp quá hạn` : 'Tất cả còn trong hạn', alert: urgent.length > 0, to: '/yeu-cau' },
        { label: 'Thiết bị trực tuyến', value: `${DEVICES.length - offline.length}/${DEVICES.length}`, sub: offline.length ? `${offline.length} mất kết nối (toàn trường)` : 'Tất cả trực tuyến', alert: offline.length > 0, to: '/thiet-bi' },
      ]} />

      <div className="grid grid-cols-12 gap-space-md items-start">
        <section className="col-span-7 card overflow-hidden">
          <div className="flex items-center justify-between h-12 px-space-md">
            <h2 className="text-headline-md">Cần xử lý <span className="ml-1 font-normal text-text-secondary tabular-nums">{attention.length}</span></h2>
            <Link to="/soc" className="text-label-sm text-primary-container hover:underline">Xem trang An ninh</Link>
          </div>
          <AttentionList items={attention} />
          {!allUnits && <p className="px-space-md py-2 border-t border-border-subtle text-caption text-text-secondary">Sự kiện an ninh và thiết bị luôn hiển thị toàn trường.</p>}
        </section>

        <section className="col-span-5 card p-space-md">
          <h2 className="text-headline-md mb-2">Tỉ lệ điểm danh 7 ngày <span className="font-normal text-caption text-text-secondary">toàn trường</span></h2>
          <AttendanceChart />
          <p className="text-caption text-text-secondary mt-1">Trục tung bắt đầu từ 80%. Chủ nhật không có lịch học.</p>
        </section>

        <section className="col-span-12 card overflow-hidden">
          <div className="flex items-center justify-between h-12 px-space-md">
            <h2 className="text-headline-md">Lịch học hôm nay</h2>
            <Link to="/thoi-khoa-bieu" className="text-label-sm text-primary-container hover:underline">Xem toàn bộ</Link>
          </div>
          <div className="overflow-x-auto border-t border-border-subtle">
            <table className="data-table">
              <thead><tr>{['Khung giờ', 'Phòng', 'Học phần', 'Giảng viên', 'Có mặt', 'Đi muộn', 'Vắng', 'Ghi hình bài giảng'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {schedule.map((s) => (
                  <tr key={`${s.slot}-${s.room}`}>
                    <td className="whitespace-nowrap">{s.slot}</td>
                    <td className="font-mono">{s.room}</td>
                    <td><span className="font-medium">{s.course}</span> <span className="text-caption text-text-secondary">{s.cls}</span></td>
                    <td className="whitespace-nowrap">{s.lecturer}</td>
                    <td className="tabular-nums">{s.present}</td>
                    <td className="tabular-nums">{s.late}</td>
                    <td className="tabular-nums">{s.absent}</td>
                    <td><Chip color={RECORDING_META[s.recording][0]}>{RECORDING_META[s.recording][1]}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {schedule.length === 0 && <p className="p-space-md text-body-sm text-text-secondary">Đơn vị này không có tiết học hôm nay.</p>}
          </div>
        </section>

        <details className="col-span-12 card group">
          <summary className="h-12 px-space-md flex items-center justify-between cursor-pointer list-none text-label-md font-semibold">
            Cách hệ thống xử lý dữ liệu
            <Icon name="expand_more" size={20} className="text-text-secondary transition-transform group-open:rotate-180" />
          </summary>
          <ol className="grid grid-cols-5 divide-x divide-border-subtle border-t border-border-subtle">
            {PIPELINE.map(([t, d], i) => (
              <li key={t} className="px-space-md py-3">
                <div className="text-label-md font-semibold">{i + 1}. {t}</div>
                <p className="text-caption text-text-secondary mt-0.5">{d}</p>
              </li>
            ))}
          </ol>
        </details>
      </div>
      </DataBoundary>
    </div>
  );
}
