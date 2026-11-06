import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Banner, ConfirmReason, DataBoundary, Icon, Chip, Empty, MetricStrip, PageHeader, SearchInput, Select, SortTh, Tabs, useSort } from '../components/ui';
import ClassSessionDrawer from '../components/ClassSessionDrawer';
import { useApp } from '../store';
import { RECORDING_META as rec, SCHEDULE } from '../data/mock';
import { AT_RISK, ATTENDANCE_PARAMS, BREAKS, PRESENCE_BY_UNIT, TEACHING_EXCEPTIONS } from '../data/attendance';
import { fmtNumber } from '../lib/format';
import { useScope } from '../lib/scope';

const SORTERS = { slot: (s) => s.slot, room: (s) => s.room, course: (s) => s.course, lecturer: (s) => s.lecturer, present: (s) => s.present, late: (s) => s.late, midAbsent: (s) => s.midAbsent, absent: (s) => s.absent, unknown: (s) => s.unknown };
const SAMPLE_DATE = '2025-10-24';
const VIEWS = [
  { key: 'schedule', label: 'Lịch học' },
  { key: 'report', label: 'Báo cáo hiện diện' },
  { key: 'params', label: 'Tham số điểm danh' },
  { key: 'attendance', label: 'Luồng điểm danh' },
  { key: 'media', label: 'Xử lý bài giảng' },
];
const STAGE = {
  live: ['secondary', 'Đang diễn ra', 'radio_button_checked'],
  provisional: ['status-pending', 'Tạm thời, chờ GV xác nhận', 'schedule'],
  final: ['status-active', 'Đã chốt', 'lock'],
  manual: ['status-inactive', 'Điểm danh tay / QR', 'edit_note'],
};
const pct = (v) => `${String(v).replace('.', ',')}%`;

const ATTENDANCE_STEPS = [
  ['Camera trước lớp theo dõi thân người và chỗ ngồi', 'Khuôn mặt chỉ dùng để gắn danh tính; cúi đầu, bị che vẫn giữ trạng thái có mặt.'],
  ['Gắn danh tính khi khớp 2 trong 3 lần', 'So với danh sách lớp. Chỉ khi một khuôn mặt giống một SV trong lớp ở vùng xám mới tìm thêm trên toàn trường để phát hiện học hộ.'],
  ['Khuôn mặt không khớp ai thì loại bỏ ngay tại thiết bị', 'Gồm SV không đồng ý Face ID và người ngoài lớp: không lưu ảnh, không lưu vector, không tìm toàn trường, không cảnh báo. Chỉ đếm để so với số SV đã quét QR.'],
  ['Phiên có mặt: Có mặt → Không quan sát → Ra ngoài → Quay lại', 'Mất cả mặt lẫn thân 90 giây thì "Không quan sát" (không tính vắng). Chỉ kết luận "Ra ngoài" khi camera cửa ghi nhận, hoặc ghế trống quá 10 phút (suy đoán).'],
  ['Trừ giải lao và khoảng có phép', 'Thời gian rời = từ lần thấy cuối đến lần thấy lại, không tính giờ giải lao và đơn xin phép đã duyệt.'],
  ['SV không dùng Face ID quét QR động', 'Đầu giờ và một lần kiểm tra ngẫu nhiên giữa giờ; ghi vào cùng phiên có mặt, cùng loại kết luận.'],
  ['Kết luận theo từng tiết, khi kết thúc tiết', 'Có mặt / Đi muộn / Vắng giữa giờ / Vắng / Có phép / Không xác định. Không cảnh báo tức thời cho GV hay bảo vệ.'],
  ['GV xác nhận trong 48 giờ, SV khiếu nại trong 7 ngày', 'Kết quả tạm thời được chốt; chỉ kết quả đã chốt và hết hạn khiếu nại mới đẩy về Hệ thống Đào tạo.'],
];
const MEDIA_STEPS = [
  ['Tải video từ đầu ghi', 'NVR_C_01 • 2,4 GB', 100],
  ['Tách âm thanh', '142 phút • 48kHz', 100],
  ['Lọc tiếng ồn', 'Tiếng quạt, điều hòa, ồn lớp', 100],
  ['Tạo phụ đề và lưu trữ', 'Đang chuyển giọng nói thành văn bản', 64],
];

export default function Schedule() {
  const { toast, log } = useApp();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') || 'schedule';
  return (
    <div>
      <PageHeader title="Lịch học & điểm danh" desc="Lịch lấy từ hệ thống đào tạo, chỉ đọc. Kết luận điểm danh theo từng tiết, GV xác nhận sau buổi, rồi mới đẩy về Hệ thống Đào tạo."
        badge={<Chip color="status-active" icon="sync">Đồng bộ 2 phút trước</Chip>}
        actions={<button className="btn-outline" onClick={() => { log('Đồng bộ thủ công lịch học', 'Hệ thống đào tạo'); toast('Đã đồng bộ lịch học', '128 tiết học hôm nay, 3 lịch đổi phòng.', 'success'); }}><Icon name="sync" />Đồng bộ ngay</button>} />

      <DataBoundary name="schedule" label="lịch học" scopeNote="units">
      <div className="card overflow-hidden">
        <Tabs label="Nội dung" className="px-2 border-b border-border-subtle" value={view} onChange={(v) => setParams(v === 'schedule' ? {} : { view: v })} items={VIEWS} />
        {view === 'schedule' && <ScheduleView />}
        {view === 'report' && <ReportView />}
        {view === 'params' && <ParamsView />}
        {view === 'attendance' && (
          <div className="p-space-md">
            <ol className="flex flex-col gap-1 max-w-3xl">
              {ATTENDANCE_STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="w-6 h-6 rounded-full bg-primary-fixed text-primary-container text-caption font-semibold flex items-center justify-center shrink-0">{i + 1}</span>{i < ATTENDANCE_STEPS.length - 1 && <span className="w-px flex-1 bg-border-strong" />}</div>
                  <div className="pb-3"><div className="text-label-md font-semibold">{t}</div><div className="text-caption text-text-secondary">{d}</div></div>
                </li>
              ))}
            </ol>
            <Banner className="max-w-3xl" icon="photo_camera" title="Chống giả mạo trong lớp học.">Kiểm tra người thật (ảnh in, màn hình) chỉ tin cậy ở kiosk, cửa và cổng, nơi khuôn mặt đủ lớn. Trong lớp, rủi ro thực tế là học hộ và điểm danh xong bỏ về, nên dùng theo dõi phiên và tìm toàn trường khi điểm số ở vùng xám.</Banner>
          </div>
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
            <Banner tone="warn">Camera ghi hình hướng về bục giảng, không quay mặt SV. Video chỉ phát hành sau khi GV duyệt; buổi dạy thay chưa đăng ký được ghi nhưng giữ lại chờ duyệt.</Banner>
          </div>
        )}
      </div>
      </DataBoundary>
    </div>
  );
}

function ScheduleView() {
  const { allUnits, matchUnit } = useScope();
  const [date, setDate] = useState(SAMPLE_DATE);
  const [room, setRoom] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const rooms = [{ value: 'all', label: 'Tất cả phòng' }, ...[...new Set(SCHEDULE.map((s) => s.room))].map((r) => ({ value: r, label: `Phòng ${r}` }))];
  const rows = (date === SAMPLE_DATE ? SCHEDULE : [])
    .filter((s) => matchUnit(s.cls))
    .filter((s) => room === 'all' || s.room === room)
    .filter((s) => !q || `${s.course} ${s.cls} ${s.lecturer}`.toLowerCase().includes(q.toLowerCase()));
  const table = useSort(rows, SORTERS);

  return (
    <>
      <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2">
        <label className="flex items-center gap-2 text-label-md shrink-0">Ngày<input type="date" className="input !w-[160px]" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <Select className="!w-[160px]" label="Phòng" value={room} options={rooms} onChange={setRoom} />
        <SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm học phần, lớp, giảng viên" />
        <span className="ml-auto text-caption text-text-secondary">"Không xác định" không tính là vắng. SV không dùng Face ID điểm danh bằng QR, trong cùng bảng.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><SortTh k="slot" table={table}>Khung giờ</SortTh><SortTh k="room" table={table}>Phòng</SortTh><SortTh k="course" table={table}>Học phần và lớp</SortTh><SortTh k="lecturer" table={table}>Giảng viên</SortTh><SortTh k="present" table={table}>Có mặt</SortTh><SortTh k="late" table={table}>Muộn</SortTh><SortTh k="midAbsent" table={table}>Vắng giữa giờ</SortTh><SortTh k="absent" table={table}>Vắng</SortTh><th>Có phép</th><SortTh k="unknown" table={table}>Không xác định</SortTh><th title="SV không dùng Face ID, điểm danh bằng QR động">Dùng QR</th><th>Kết quả</th><th>Ghi hình</th><th>Thao tác</th></tr></thead>
          <tbody>
            {table.sorted.map((s) => (
              <tr key={`${s.slot}-${s.room}`} className="h-14 hover:bg-surface-container-low">
                <td className="whitespace-nowrap">{s.slot}</td>
                <td className="font-mono font-medium">{s.room}</td>
                <td><div className="font-medium">{s.course}</div><div className="text-caption font-mono text-text-secondary">{s.cls}</div></td>
                <td><div className="whitespace-nowrap">{s.lecturer}</div>{s.substitute && <Chip color="status-pending" icon="swap_horiz">Dạy thay, chưa đăng ký</Chip>}</td>
                <td className="tabular-nums">{s.present}</td>
                <td className="tabular-nums">{s.late}</td>
                <td className="tabular-nums">{s.midAbsent || '—'}</td>
                <td className="tabular-nums">{s.absent}</td>
                <td className="tabular-nums">{s.leave || '—'}</td>
                <td className={`tabular-nums ${s.unknown ? 'text-status-pending font-medium' : ''}`}>{s.unknown || '—'}</td>
                <td className="tabular-nums">{s.alt || '—'}</td>
                <td><Chip color={STAGE[s.stage][0]} icon={STAGE[s.stage][2]}>{STAGE[s.stage][1]}</Chip></td>
                <td><Chip color={rec[s.recording][0]}>{rec[s.recording][1]}</Chip></td>
                <td>{s.blocked
                  ? <span className="text-caption text-status-pending flex items-center gap-1 whitespace-nowrap"><Icon name="lock" size={14} />{s.room} chưa duyệt hạ tầng</span>
                  : <button className="btn-outline btn-sm" aria-label={`Chi tiết điểm danh ${s.course} phòng ${s.room}`} onClick={() => setOpen(s)}>Chi tiết</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty icon="event_busy" title="Không có tiết học phù hợp" desc={date !== SAMPLE_DATE ? 'Dữ liệu mẫu chỉ có lịch của ngày 24/10/2025.' : allUnits ? 'Thử bỏ bớt bộ lọc.' : 'Đơn vị đang chọn không có tiết học trong ngày này.'} />}
      </div>
      {open && <ClassSessionDrawer row={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ReportView() {
  const { can, toast, log } = useApp();
  const [sub, setSub] = useState('students');
  const teachingAllowed = can('approve') || can('*') || can('audit');
  const max = 100;
  return (
    <div className="p-space-md flex flex-col gap-space-md">
      <div className="flex items-center gap-2">
        <Tabs label="Góc nhìn" value={sub} onChange={setSub} items={[{ key: 'students', label: 'Sinh viên' }, ...(teachingAllowed ? [{ key: 'teaching', label: 'Ngoại lệ giảng dạy' }] : [])]} />
        <div className="ml-auto flex gap-2">
          <button className="btn-outline btn-sm" onClick={() => { log('Xuất báo cáo hiện diện', 'Báo cáo hiện diện', 'sensitive'); toast('Đang xuất báo cáo', 'Tệp Excel sẽ có trong mục Tải xuống.'); }}><Icon name="download" size={16} />Xuất Excel</button>
          <button className="btn-outline btn-sm" disabled={!can('approve') && !can('*')} onClick={() => { log('Đẩy kết quả điểm danh đã chốt về Hệ thống Đào tạo', 'EMS'); toast('Đã đẩy về Hệ thống Đào tạo', '1.284 tiết đã chốt và hết hạn khiếu nại.', 'success'); }}><Icon name="upload" size={16} />Đẩy kết quả đã chốt về EMS</button>
        </div>
      </div>
      <Banner icon="info" title="Chỉ số hiện diện, không phải hiệu suất.">Số liệu đo mức có mặt tại phòng theo lịch, không đo chất lượng giảng dạy hay học tập. Không dùng làm căn cứ duy nhất để đánh giá, thi đua hay kỷ luật.</Banner>

      {sub === 'students' ? (
        <>
          <MetricStrip items={[
            { label: 'Có mặt (tiết đã chốt)', value: '91,9%', sub: 'Học kỳ 1, 2026–2027' },
            { label: 'Đi muộn', value: '4,4%', sub: 'Sau ân hạn 15 phút' },
            { label: 'Vắng giữa giờ', value: '2,2%', sub: 'Gồm kết quả suy đoán', alert: true },
            { label: 'Không xác định', value: '2,4%', sub: 'Không tính là vắng' },
            { label: 'SV sắp vượt ngưỡng vắng', value: fmtNumber(PRESENCE_BY_UNIT.reduce((a, u) => a + u.atRisk, 0)), sub: 'Đã vắng ≥ 10% số tiết', alert: true },
          ]} />
          <section>
            <h3 className="section-title mb-1">Theo khoa</h3>
            <p className="text-caption text-text-secondary mb-2">Sắp từ thấp đến cao để thấy chỗ cần chú ý trước.</p>
            <div className="card overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Đơn vị</th><th>Số tiết</th><th className="min-w-[220px]">Có mặt</th><th>Đi muộn</th><th>Vắng giữa giờ</th><th>Không xác định</th><th>Sắp vượt ngưỡng</th></tr></thead>
                <tbody>
                  {PRESENCE_BY_UNIT.map((u) => (
                    <tr key={u.unit} className="hover:bg-surface-container-low">
                      <td className="font-medium">{u.unit}</td>
                      <td className="tabular-nums">{fmtNumber(u.sessions)}</td>
                      <td><div className="flex items-center gap-2"><span className="tabular-nums w-12">{pct(u.present)}</span><div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className={`h-full ${u.present < 90 ? 'bg-status-pending' : 'bg-primary-container'}`} style={{ width: `${(u.present / max) * 100}%` }} /></div></div></td>
                      <td className="tabular-nums">{pct(u.late)}</td>
                      <td className="tabular-nums">{pct(u.midAbsent)}</td>
                      <td className={`tabular-nums ${u.unknown > 3 ? 'text-status-pending font-medium' : ''}`}>{pct(u.unknown)}</td>
                      <td className="tabular-nums">{u.atRisk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-caption text-text-secondary mt-1.5">Khoa Điện - Điện tử có tỷ lệ Không xác định 3,8%: kiểm tra camera các phòng thực hành.</p>
          </section>
          <section>
            <h3 className="section-title mb-1">Sinh viên sắp vượt ngưỡng vắng</h3>
            <p className="text-caption text-text-secondary mb-2">Cảnh báo sớm gửi cố vấn học tập. Ngưỡng cấm thi do trường quy định và ban hành trên Hệ thống Đào tạo; SACIP không tự cấm thi.</p>
            <div className="card overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Sinh viên</th><th>Học phần</th><th>Đã vắng</th><th>Cố vấn học tập</th><th>Ghi chú</th></tr></thead>
                <tbody>
                  {AT_RISK.map((s) => (
                    <tr key={s.id + s.course}>
                      <td><div className="font-medium">{s.name}</div><div className="text-caption font-mono text-text-secondary">{s.id} • {s.cls}</div></td>
                      <td>{s.course}</td>
                      <td className="tabular-nums whitespace-nowrap"><b>{s.absent}</b>/{s.total} tiết <Chip color={s.absent / s.total >= 0.15 ? 'status-rejected' : 'status-pending'}>{Math.round((s.absent / s.total) * 100)}%</Chip></td>
                      <td>{s.advisor}</td>
                      <td className="text-caption text-text-secondary">{s.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section>
          <Banner className="mb-space-sm" tone="warn" icon="gavel" title="Không xếp hạng giảng viên.">Chỉ có danh sách ngoại lệ. GV xem và giải trình trước; Trưởng khoa nhận sau 48 giờ. Cần nội quy lao động có điều khoản này và đã tham khảo ý kiến công đoàn trước khi bật quy tắc R-008.</Banner>
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Giảng viên</th><th>Ngoại lệ</th><th>Buổi học</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {TEACHING_EXCEPTIONS.map((e) => (
                  <tr key={e.session}>
                    <td><div className="font-medium">{e.lecturer}</div><div className="text-caption text-text-secondary">{e.unit}</div></td>
                    <td>{e.kind}</td>
                    <td className="text-caption">{e.session}</td>
                    <td><Chip color={e.status[0]}>{e.status[1]}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-caption text-text-secondary mt-1.5">GV có thể dạy ở xưởng, thực địa, sân thể dục, dạy online hoặc đi công tác: một buổi không thấy GV không tự động là vi phạm.</p>
        </section>
      )}
    </div>
  );
}

function ParamsView() {
  const { can, log, toast } = useApp();
  const [items, setItems] = useState(ATTENDANCE_PARAMS);
  const [ask, setAsk] = useState(null);
  const [val, setVal] = useState('');
  const write = can('approve') || can('*');
  return (
    <div className="p-space-md flex flex-col gap-space-sm">
      <p className="text-body-sm text-text-secondary">Phòng Đào tạo quản lý. Mặc định toàn trường, ghi đè theo khoa hoặc học phần. Quy tắc <Link to="/chinh-sach?tab=rules" className="text-primary-container hover:underline">R-001, R-007</Link> đọc giá trị ở đây thay vì ghi cứng.</p>
      <Banner icon="free_breakfast">{BREAKS}</Banner>
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Tham số</th><th>Toàn trường</th><th>Ghi đè</th><th>Ghi chú</th><th /></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.key} className="align-top hover:bg-surface-container-low">
                <td className="py-3 min-w-[280px] font-medium">{p.label}</td>
                <td className="py-3 whitespace-nowrap tabular-nums"><b>{p.value}</b> {p.unit}</td>
                <td className="py-3 min-w-[180px]">{p.overrides.length ? p.overrides.map(([sc, v]) => <div key={sc} className="text-caption">{sc}: <b>{v}</b> {p.unit}</div>) : <span className="text-text-secondary">—</span>}</td>
                <td className="py-3 text-caption text-text-secondary min-w-[240px]">{p.hint}</td>
                <td className="py-3"><button className="btn-outline btn-sm" disabled={!write} onClick={() => { setAsk(p); setVal(String(p.value)); }}>Sửa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-text-secondary">Các giá trị là điểm xuất phát; hiệu chỉnh sau khi đo thực tế ở 3–5 phòng mẫu. Mỗi lần lưu tạo một phiên bản mới và ghi nhật ký.</p>
      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} title="Sửa tham số điểm danh" subtitle={ask?.label} confirmLabel="Lưu phiên bản mới"
        onConfirm={(reason) => { setItems((xs) => xs.map((x) => (x.key === ask.key ? { ...x, value: val } : x))); log(`Sửa tham số điểm danh "${ask.label}": ${ask.value} → ${val} — ${reason}`, 'ATTENDANCE_PARAMS'); toast('Đã lưu tham số', `${ask.label}: ${val} ${ask.unit}`, 'success'); setAsk(null); }}>
        {ask && <label className="flex flex-col gap-1 text-label-md font-semibold">Giá trị toàn trường {ask.unit && `(${ask.unit})`}<input className="input font-normal" value={val} onChange={(e) => setVal(e.target.value)} /></label>}
      </ConfirmReason>
    </div>
  );
}
