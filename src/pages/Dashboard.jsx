import { Link } from 'react-router-dom';
import { Icon, Chip, PageHeader } from '../components/ui';
import { useApp } from '../store';
import { SOC_EVENTS, DEVICES } from '../data/mock';

const Kpi = ({ icon, label, value, sub, tone = 'text-primary-container' }) => (
  <div className="card p-space-md">
    <div className="flex items-center justify-between text-caption text-text-secondary"><span>{label}</span><Icon name={icon} size={20} className={tone} /></div>
    <div className="text-[28px] font-semibold leading-9 mt-1 tabular-nums">{value}</div>
    <div className="text-caption text-text-secondary">{sub}</div>
  </div>
);

const week = [['T2', 92.1], ['T3', 93.4], ['T4', 91.8], ['T5', 94.0], ['T6', 89.6], ['T7', 95.2], ['CN', 0]];

export default function Dashboard() {
  const { requests, scope } = useApp();
  const pending = requests.filter((r) => r.status === 'pending').length;
  const online = DEVICES.filter((d) => d.online).length;
  const max = 100;
  return (
    <div>
      <PageHeader icon="dashboard" title="Tổng quan hệ thống" desc={`Phạm vi: ${scope.tenant} • ${scope.unit}`}
        badge={<Chip color="status-active" icon="check_circle">Tất cả phân hệ hoạt động</Chip>}
        actions={<Link to="/kiosk" className="btn-primary"><Icon name="photo_camera_front" />Mở Kiosk trạm chụp</Link>} />

      <div className="grid grid-cols-4 gap-space-md mb-space-md">
        <Kpi icon="face" label="Hồ sơ Face ID đã thu thập" value="23,430" sub="94.3% / 24,850 đối tượng" />
        <Kpi icon="how_to_reg" label="Tỉ lệ điểm danh hôm nay" value="95.2%" sub="PRESENT 11,842 • LATE 412" tone="text-status-active" />
        <Kpi icon="move_to_inbox" label="Yêu cầu chờ duyệt" value={pending} sub="1 yêu cầu sắp quá SLA" tone="text-status-pending" />
        <Kpi icon="videocam" label="Thiết bị trực tuyến" value={`${online}/${DEVICES.length}`} sub="1 camera mất kết nối (A101)" tone="text-status-rejected" />
      </div>

      <div className="grid grid-cols-12 gap-space-md">
        <div className="col-span-7 card p-space-md">
          <div className="flex justify-between mb-3"><h2 className="text-headline-md">Tỉ lệ điểm danh 7 ngày</h2><span className="text-caption text-text-secondary">Nguồn: Policy Engine (read-only audit)</span></div>
          <div className="flex items-end gap-4 h-48 px-2 border-b border-border-subtle">
            {week.map(([d, v]) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-caption tabular-nums text-text-secondary">{v ? `${v}%` : '—'}</span>
                <div className={`w-full max-w-[44px] rounded-t ${v ? 'bg-primary-container' : 'bg-surface-container'}`} style={{ height: v ? `${((v - 80) / (max - 80)) * 100}%` : '4px' }} title={`${d}: ${v}%`} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 px-2 pt-1.5">{week.map(([d]) => <span key={d} className="flex-1 text-center text-caption text-text-secondary">{d}</span>)}</div>
          <p className="text-caption text-text-secondary mt-2">Trục tung bắt đầu từ 80% để thấy rõ chênh lệch. Chủ nhật không có lịch học.</p>
        </div>

        <div className="col-span-5 card p-space-md">
          <div className="flex justify-between mb-3"><h2 className="text-headline-md">Sự kiện an ninh gần đây</h2><Link to="/soc" className="text-caption text-primary-container hover:underline">Mở SOC</Link></div>
          <div className="flex flex-col divide-y divide-border-subtle">
            {SOC_EVENTS.slice(0, 4).map((e) => (
              <div key={e.id} className="py-2.5 flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 ${e.level === 'critical' ? 'bg-status-rejected' : e.level === 'warning' ? 'bg-status-pending' : 'bg-status-inactive'}`} />
                <div className="flex-1 min-w-0"><div className="text-label-md font-semibold">{e.title}</div><div className="text-caption text-text-secondary">{e.place} • {e.cam}</div></div>
                <span className="text-caption font-mono text-text-secondary">{e.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 card p-space-md">
          <h2 className="text-headline-md mb-3">Luồng dữ liệu SACIP</h2>
          <div className="grid grid-cols-5 gap-3 text-body-sm">
            {[
              ['photo_camera', 'Thu thập', 'App MyDaiNam (selfie) • Camera/Kiosk chuyên dụng'],
              ['filter_center_focus', 'Quality Gating', 'Độ sáng, góc nghiêng, Liveness / Anti-spoofing'],
              ['hub', 'Trích xuất vector', 'SCRFD + ArcFace → Embedding 512d (AES-256, pgvector)'],
              ['rule', 'Policy Engine (PDP)', 'Đối tượng + Không gian + Thời gian (Redis Streams)'],
              ['notifications_active', 'Hành động', 'Điểm danh / Ghi hình bài giảng / Cảnh báo SOC ≤2s'],
            ].map(([ic, t, d], i) => (
              <div key={t} className="relative p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-primary-container text-white text-caption flex items-center justify-center font-semibold">{i + 1}</span><Icon name={ic} className="text-primary-container" /><b className="text-label-md">{t}</b></div>
                <p className="text-caption text-text-secondary">{d}</p>
                {i < 4 && <Icon name="arrow_forward" size={16} className="absolute -right-3 top-1/2 -translate-y-1/2 text-status-inactive z-10" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
