import { Icon, Chip, PageHeader } from '../components/ui';
import { useApp } from '../store';
import { SCHEDULE } from '../data/mock';

const rec = {
  done: ['status-active', 'Đã có audio sạch'],
  live: ['status-rejected', '● Đang ghi (NVR)'],
  blocked: ['status-inactive', 'Không ghi — phòng chưa duyệt'],
};

export default function Schedule() {
  const { toast, log } = useApp();
  return (
    <div>
      <PageHeader icon="calendar_month" title="TKB & Điểm danh" desc="EMS Integration (read-only sync) • Workflow A: Điểm danh & kích hoạt ghi hình bài giảng • Workflow B: Media Pipeline"
        badge={<Chip color="status-active" icon="sync">Đồng bộ EMS: 2 phút trước</Chip>}
        actions={<button className="btn-outline" onClick={() => { log('Đồng bộ thủ công TKB từ EMS', 'EMS'); toast('Đã đồng bộ TKB', '128 tiết học hôm nay • 3 lịch đổi phòng • múi giờ Asia/Ho_Chi_Minh.', 'success'); }}><Icon name="sync" />Đồng bộ ngay</button>} />

      <div className="card overflow-hidden mb-space-md">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-bright"><tr className="h-10 text-[12px] uppercase tracking-wider text-text-secondary">
            {['Khung giờ', 'Phòng', 'Học phần / Lớp', 'Giảng viên', 'PRESENT', 'LATE', 'Vắng', 'Ghi hình bài giảng', 'Thao tác'].map((h) => <th key={h} className="px-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {SCHEDULE.map((s, i) => (
              <tr key={i} className="h-14 border-t border-border-subtle/60 hover:bg-surface-container-low">
                <td className="px-3 whitespace-nowrap">{s.slot}</td>
                <td className="px-3 font-mono font-semibold">{s.room}</td>
                <td className="px-3"><div className="font-medium">{s.course}</div><div className="text-caption text-text-secondary">{s.cls}</div></td>
                <td className="px-3"><div>{s.lecturer}</div>{s.substitute && <Chip color="status-pending" icon="swap_horiz">Dạy thay — chưa xin phép</Chip>}</td>
                <td className="px-3 tabular-nums text-status-active font-semibold">{s.present}</td>
                <td className="px-3 tabular-nums text-status-pending font-semibold">{s.late}</td>
                <td className="px-3 tabular-nums">{s.absent}</td>
                <td className="px-3"><Chip color={rec[s.recording][0]}>{rec[s.recording][1]}</Chip></td>
                <td className="px-3 text-right">{s.blocked
                  ? <span className="text-caption text-status-pending flex items-center gap-1 justify-end"><Icon name="lock" size={14} />C305 chưa duyệt hạ tầng</span>
                  : <button className="text-primary-container text-label-sm font-medium px-2 py-1 rounded hover:bg-surface-container" onClick={() => toast('Chi tiết điểm danh', `${s.room} • Session presence ≥ 80% mới tính PRESENT.`)}>Chi tiết</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        <div className="card p-space-md">
          <h2 className="text-headline-md mb-3">Workflow A — Điểm danh & Trigger bài giảng</h2>
          <ol className="flex flex-col gap-2 text-body-sm">
            {[['videocam', 'Camera AI 4K → Edge Box (Jetson Orin NX)', 'RTSP frame → SCRFD phát hiện mặt'],
              ['filter_alt', 'Quality Gating & Anti-Spoofing', 'Loại khung hình mờ, nghiêng, ảnh in'],
              ['join_inner', '1:K Matching trên tập cục bộ', 'So khớp với danh sách lớp của tiết học, < 50ms'],
              ['stream', 'Raw Event → Redis Streams', 'Gửi về Middleware Policy Engine'],
              ['fact_check', 'Khớp TKB & phòng học', 'Ghi PRESENT/LATE, tích lũy session presence ≥ 80%'],
              ['radio_button_checked', 'Khớp giảng viên → gọi ISAPI', 'Start/Stop ghi hình NVR, đánh dấu Start_Time/End_Time']].map(([ic, t, d], i) => (
              <li key={t} className="flex gap-3 p-2.5 rounded-lg bg-surface-bright"><span className="w-6 h-6 rounded-full bg-primary-container text-white text-caption flex items-center justify-center shrink-0">{i + 1}</span><Icon name={ic} className="text-primary-container" /><div><b className="text-label-md">{t}</b><div className="text-caption text-text-secondary">{d}</div></div></li>
            ))}
          </ol>
        </div>
        <div className="card p-space-md">
          <h2 className="text-headline-md mb-3">Workflow B — Media Pipeline (tiết C302, 07:00)</h2>
          <div className="flex flex-col gap-2">
            {[['download', 'Tải video thô từ NVR (ISAPI)', 'NVR_C_01 • 2.4 GB', 100],
              ['graphic_eq', 'FFmpeg: tách audio .mp4 → .aac', '142 phút • 48kHz', 100],
              ['noise_control_off', 'AI Denoiser (RNNoise / DeepFilterNet)', 'Lọc tiếng quạt, điều hòa, ồn lớp', 100],
              ['subtitles', 'STT → phụ đề & lưu trữ', 'Đang chuyển giọng nói thành văn bản', 64]].map(([ic, t, d, p]) => (
              <div key={t} className="p-2.5 rounded-lg bg-surface-bright">
                <div className="flex items-center gap-2"><Icon name={ic} className={p === 100 ? 'text-status-active' : 'text-primary-container'} /><b className="text-label-md flex-1">{t}</b><span className="text-caption tabular-nums text-text-secondary">{p}%</span></div>
                <div className="text-caption text-text-secondary ml-7">{d}</div>
                <div className="ml-7 mt-1.5 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className={`h-full ${p === 100 ? 'bg-status-active' : 'bg-primary-container'}`} style={{ width: `${p}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-ai-surface border border-ai-border/40 text-caption flex gap-2"><Icon name="info" size={16} className="text-ai-border" />Dạy thay chưa xin phép vẫn được ghi âm & phát hành bình thường; hệ thống chỉ bắn cảnh báo sang SOC để hậu kiểm.</div>
        </div>
      </div>
    </div>
  );
}
