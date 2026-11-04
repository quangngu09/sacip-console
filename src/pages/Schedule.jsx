import { useState } from 'react';
import { Banner, Icon, Chip, Empty, PageHeader, SearchInput, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { RECORDING_META as rec, SCHEDULE } from '../data/mock';

const SAMPLE_DATE = '2025-10-24';
const VIEWS = [{ key: 'schedule', label: 'Lịch học' }, { key: 'attendance', label: 'Luồng điểm danh' }, { key: 'media', label: 'Xử lý bài giảng' }];

const ATTENDANCE_STEPS = [
  ['Camera gửi hình về thiết bị xử lý tại phòng', 'Phát hiện khuôn mặt trong khung hình'],
  ['Kiểm tra chất lượng và người thật', 'Loại khung hình mờ, nghiêng, ảnh in'],
  ['Đối chiếu với danh sách lớp', 'So khớp trong danh sách của tiết học, dưới 50ms'],
  ['Gửi sự kiện về hệ thống quy tắc', 'Xử lý theo thời gian thực'],
  ['Đối chiếu lịch học và phòng', 'Ghi có mặt hoặc đi muộn; cần có mặt từ 80% thời lượng tiết'],
  ['Nhận diện giảng viên và bật ghi hình', 'Tự bắt đầu, dừng ghi hình và đánh dấu giờ'],
];
const MEDIA_STEPS = [
  ['Tải video từ đầu ghi', 'NVR_C_01 • 2.4 GB', 100],
  ['Tách âm thanh', '142 phút • 48kHz', 100],
  ['Lọc tiếng ồn', 'Tiếng quạt, điều hòa, ồn lớp', 100],
  ['Tạo phụ đề và lưu trữ', 'Đang chuyển giọng nói thành văn bản', 64],
];

export default function Schedule() {
  const { toast, log } = useApp();
  const [view, setView] = useState('schedule');
  const [date, setDate] = useState(SAMPLE_DATE);
  const [room, setRoom] = useState('all');
  const [q, setQ] = useState('');
  const rooms = [{ value: 'all', label: 'Tất cả phòng' }, ...[...new Set(SCHEDULE.map((s) => s.room))].map((r) => ({ value: r, label: `Phòng ${r}` }))];
  const rows = (date === SAMPLE_DATE ? SCHEDULE : [])
    .filter((s) => room === 'all' || s.room === room)
    .filter((s) => !q || `${s.course} ${s.cls} ${s.lecturer}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Lịch học & điểm danh" desc="Lịch lấy từ hệ thống đào tạo, chỉ đọc. Điểm danh và ghi hình bài giảng chạy tự động theo lịch."
        badge={<Chip color="status-active" icon="sync">Đồng bộ 2 phút trước</Chip>}
        actions={<button className="btn-outline" onClick={() => { log('Đồng bộ thủ công lịch học', 'Hệ thống đào tạo'); toast('Đã đồng bộ lịch học', '128 tiết học hôm nay, 3 lịch đổi phòng.', 'success'); }}><Icon name="sync" />Đồng bộ ngay</button>} />

      <div className="card overflow-hidden">
        <Tabs label="Nội dung" className="px-2 border-b border-border-subtle" value={view} onChange={setView} items={VIEWS} />

        {view === 'schedule' && (
          <>
            <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2">
              <label className="flex items-center gap-2 text-label-md shrink-0">Ngày<input type="date" className="input !w-[160px]" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <Select className="!w-[160px]" label="Phòng" value={room} options={rooms} onChange={setRoom} />
              <SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm học phần, lớp, giảng viên" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>{['Khung giờ', 'Phòng', 'Học phần và lớp', 'Giảng viên', 'Có mặt', 'Đi muộn', 'Vắng', 'Ghi hình bài giảng', 'Thao tác'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={`${s.slot}-${s.room}`} className="h-14 hover:bg-surface-container-low">
                      <td className="whitespace-nowrap">{s.slot}</td>
                      <td className="font-mono font-medium">{s.room}</td>
                      <td><div className="font-medium">{s.course}</div><div className="text-caption font-mono text-text-secondary">{s.cls}</div></td>
                      <td><div className="whitespace-nowrap">{s.lecturer}</div>{s.substitute && <Chip color="status-pending" icon="swap_horiz">Dạy thay, chưa xin phép</Chip>}</td>
                      <td className="tabular-nums">{s.present}</td>
                      <td className="tabular-nums">{s.late}</td>
                      <td className="tabular-nums">{s.absent}</td>
                      <td><Chip color={rec[s.recording][0]}>{rec[s.recording][1]}</Chip></td>
                      <td>{s.blocked
                        ? <span className="text-caption text-status-pending flex items-center gap-1 whitespace-nowrap"><Icon name="lock" size={14} />{s.room} chưa duyệt hạ tầng</span>
                        : <button className="btn-outline btn-sm" aria-label={`Chi tiết điểm danh ${s.course} phòng ${s.room}`} onClick={() => toast('Chi tiết điểm danh', `Phòng ${s.room}: cần có mặt từ 80% thời lượng tiết mới tính có mặt.`)}>Chi tiết</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <Empty icon="event_busy" title="Không có tiết học phù hợp" desc={date === SAMPLE_DATE ? 'Thử bỏ bớt bộ lọc.' : 'Dữ liệu mẫu chỉ có lịch của ngày 24/10/2025.'} />}
            </div>
          </>
        )}

        {view === 'attendance' && (
          <ol className="p-space-md flex flex-col gap-1 max-w-2xl">
            {ATTENDANCE_STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <div className="flex flex-col items-center"><span className="w-6 h-6 rounded-full bg-primary-fixed text-primary-container text-caption font-semibold flex items-center justify-center shrink-0">{i + 1}</span>{i < ATTENDANCE_STEPS.length - 1 && <span className="w-px flex-1 bg-border-strong" />}</div>
                <div className="pb-3"><div className="text-label-md font-semibold">{t}</div><div className="text-caption text-text-secondary">{d}</div></div>
              </li>
            ))}
          </ol>
        )}

        {view === 'media' && (
          <div className="p-space-md flex flex-col gap-space-md max-w-2xl">
            <h2 className="text-headline-md">Bài giảng phòng C302, tiết 07:00</h2>
            {MEDIA_STEPS.map(([t, d, p]) => (
              <div key={t}>
                <div className="flex justify-between gap-3"><span className="text-label-md font-semibold">{t}</span><span className="text-caption tabular-nums text-text-secondary">{p === 100 ? 'Hoàn tất' : `${p}%`}</span></div>
                <div className="text-caption text-text-secondary">{d}</div>
                <div className="mt-1.5 h-1.5 bg-surface-container rounded-full overflow-hidden" role="progressbar" aria-label={t} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}><div className={`h-full ${p === 100 ? 'bg-status-active' : 'bg-primary-container'}`} style={{ width: `${p}%` }} /></div>
              </div>
            ))}
            <Banner>Dạy thay chưa xin phép vẫn được ghi âm và phát hành bình thường; hệ thống chỉ gửi cảnh báo để hậu kiểm.</Banner>
          </div>
        )}
      </div>
    </div>
  );
}
