import { useState } from 'react';
import { Banner, Chip, Drawer, Icon, Select } from './ui';
import { useApp } from '../store';
import { SESSION_DETAIL, SPAN, VERDICT } from '../data/attendance';

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const VERDICT_OPTIONS = ['Có mặt', 'Đi muộn', 'Vắng giữa giờ', 'Vắng', 'Có phép'];
const mask = (name) => name.split(' ').map((w, i, a) => (i === a.length - 1 ? w : `${w[0]}.`)).join(' ');

/** Chi tiết một tiết: timeline có mặt của GV và từng SV, kết luận giải thích được, GV xác nhận sau buổi. */
export default function ClassSessionDrawer({ row, onClose }) {
  const { log, toast, can } = useApp();
  const d = SESSION_DETAIL;
  const [people, setPeople] = useState(d.people);
  const [stage, setStage] = useState(row?.stage === 'final' ? 'final' : d.stage);
  const [reveal, setReveal] = useState(false);
  const [ended, setEnded] = useState(null);
  if (!row) return null;
  const total = ended || d.minutes;
  const pct = (m) => `${(Math.min(m, total) / total) * 100}%`;
  const ticks = Array.from({ length: Math.floor(total / 30) + 1 }, (_, i) => i * 30);
  const sample = row.room !== d.room || row.course !== d.course;
  const editable = stage !== 'final' && (can('approve') || can('*'));

  const setVerdict = (id, v) => {
    setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, verdict: v, edited: true } : p)));
    log(`Sửa kết luận điểm danh ${row.room} ${row.slot}: ${id} → ${v}`, id);
  };
  const confirm = () => {
    setStage('final');
    log(`Xác nhận kết quả điểm danh ${row.course} • ${row.room} • ${row.slot}`, row.cls);
    toast('Đã chốt kết quả tiết', 'SV có 7 ngày để khiếu nại; sau đó kết quả mới đẩy về Hệ thống Đào tạo.', 'success');
  };
  const counts = people.filter((p) => !p.teacher).reduce((a, p) => ({ ...a, [p.verdict]: (a[p.verdict] || 0) + 1 }), {});

  return (
    <Drawer open onClose={onClose} width={1040}>
      <div className="p-space-md border-b border-border-subtle flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-k-title-md">{row.course}</h3>
            {stage === 'final' ? <Chip color="status-active" icon="lock">Đã chốt</Chip> : <Chip color="status-pending" icon="schedule">Tạm thời • GV xác nhận {d.confirmDue}</Chip>}
          </div>
          <p className="text-caption text-text-secondary"><span className="font-mono">{row.cls}</span> • Phòng {row.room} • {row.slot} • {row.lecturer}</p>
          <p className="text-caption text-text-secondary mt-0.5">Sĩ số {d.roster} • <b>{d.faceId}</b> dùng Face ID • <b>{d.alt}</b> dùng phương thức thay thế (QR động)</p>
        </div>
        <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={onClose}><Icon name="close" size={20} /></button>
      </div>

      <div className="p-space-md flex flex-col gap-space-md overflow-y-auto flex-1 [&>*]:shrink-0">
        {sample && <p className="text-caption text-text-secondary flex items-center gap-1.5"><Icon name="info" size={14} />Dữ liệu minh họa lấy từ tiết C302, 07:00 để thể hiện bố cục.</p>}
        <Banner icon="qr_code_2" title={`${d.alt} SV không dùng Face ID.`}>
          Không có mẫu khuôn mặt nên camera không nhận diện họ. Khuôn mặt không khớp ai trong danh sách lớp bị <b>loại bỏ ngay tại thiết bị</b>: không lưu ảnh, không lưu vector, không cảnh báo. Họ điểm danh bằng QR động và một lần kiểm tra ngẫu nhiên lúc {hhmm(d.start + d.randomCheck)}, không bị tính vắng chỉ vì không có Face ID.
        </Banner>
        {!d.doorCam && <Banner tone="warn" title="Phòng chưa có camera cửa.">Hệ thống chỉ biết ghế trống, không biết chắc SV đã ra ngoài. Kết luận "Vắng giữa giờ" ở tiết này là suy đoán và cần GV xác nhận.</Banner>}

        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-caption">
          {Object.entries(SPAN).map(([k, [cls, label]]) => <span key={k} className="flex items-center gap-1.5"><span className={`w-5 h-2.5 rounded-sm ${cls}`} />{label}</span>)}
          <span className="flex items-center gap-1.5"><span className="w-5 h-2.5 rounded-sm stripe-break border border-border-subtle" />Giải lao (không tính rời)</span>
          <span className="flex items-center gap-1.5"><Icon name="qr_code_2" size={14} className="text-primary-container" />Lần quét QR</span>
          <button className="btn-outline btn-sm ml-auto" onClick={() => { setReveal((r) => !r); if (!reveal) log(`Hiện tên trong chi tiết điểm danh ${row.room} ${row.slot}`, row.cls, 'sensitive'); }}><Icon name={reveal ? 'visibility_off' : 'visibility'} size={16} />{reveal ? 'Ẩn tên' : 'Hiện tên (ghi nhật ký)'}</button>
        </div>

        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[200px]">Người</th>
                <th className="min-w-[360px]">
                  <div className="relative h-4">{ticks.map((t) => <span key={t} className="absolute -translate-x-1/2 text-caption font-normal tabular-nums" style={{ left: pct(t) }}>{hhmm(d.start + t)}</span>)}</div>
                </th>
                <th>Vào lúc</th><th>Số lần rời</th><th>Rời lâu nhất</th><th>% có mặt</th><th className="min-w-[160px]">Kết luận</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const qr = p.method === 'qr';
                const first = qr ? (p.checks?.length ? [p.checks[0]] : null) : p.spans.find((s) => s[2] === 'present');
                return (
                  <tr key={p.id} className={`align-top ${p.teacher ? 'bg-surface-bright' : ''}`}>
                    <td className="py-2.5">
                      <div className="font-medium flex items-center gap-1.5">{p.teacher && <Icon name="co_present" size={16} className="text-primary-container" />}{reveal || p.teacher ? p.name : mask(p.name)}</div>
                      <div className="text-caption font-mono text-text-secondary">{p.id}</div>
                      {qr && <Chip color="primary" icon="qr_code_2" className="mt-0.5">Phương thức thay thế</Chip>}
                    </td>
                    <td className="py-2.5">
                      {qr ? (
                      <div className="relative h-5 rounded border border-dashed border-border-strong" role="img" aria-label={p.note || p.verdict}>
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-caption text-text-secondary">Không theo dõi sinh trắc, chỉ quét QR</span>
                        <span className="absolute inset-y-0 border-l border-dotted border-primary-container" style={{ left: pct(d.randomCheck) }} title="Kiểm tra QR ngẫu nhiên" />
                        {p.checks.map((m) => <span key={m} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface text-primary-container" style={{ left: pct(m) }} title={`Quét QR lúc ${hhmm(d.start + m)}`}><Icon name="qr_code_2" size={16} /></span>)}
                      </div>
                      ) : (
                      <div className="relative h-5 rounded bg-surface-container-low overflow-hidden" role="img" aria-label={p.note || p.verdict}>
                        {d.breaks.map(([a, b]) => <span key={a} className="absolute inset-y-0 stripe-break" style={{ left: pct(a), width: `calc(${pct(b)} - ${pct(a)})` }} />)}
                        {p.spans.filter(([a]) => a < total).map(([a, b, k]) => <span key={a} title={`${SPAN[k][1]} ${hhmm(d.start + a)}–${hhmm(d.start + Math.min(b, total))}`} className={`absolute inset-y-1 rounded-sm ${SPAN[k][0]}`} style={{ left: pct(a), width: `calc(${pct(b)} - ${pct(a)})` }} />)}
                        <span className="absolute inset-y-0 border-l border-dashed border-status-pending" style={{ left: pct(d.grace) }} title="Hết ân hạn" />
                      </div>
                      )}
                      {p.note && <p className="text-caption text-text-secondary mt-1">{p.note}</p>}
                    </td>
                    <td className="py-2.5 tabular-nums whitespace-nowrap">{first ? hhmm(d.start + first[0]) : '—'}</td>
                    <td className="py-2.5 tabular-nums">{p.teacher || qr ? '—' : p.leaves}</td>
                    <td className="py-2.5 tabular-nums whitespace-nowrap">{p.longest ? `${p.longest} phút` : '—'}</td>
                    <td className="py-2.5 tabular-nums">{p.pct == null ? '—' : `${p.pct}%`}</td>
                    <td className="py-2.5">
                      {editable && !p.teacher
                        ? <Select className="!h-8 !min-h-0" label={`Kết luận của ${p.id}`} value={p.verdict} options={p.verdict === 'Không xác định' ? ['Không xác định', ...VERDICT_OPTIONS] : VERDICT_OPTIONS} onChange={(v) => setVerdict(p.id, v)} />
                        : <Chip color={VERDICT[p.verdict]}>{p.verdict}</Chip>}
                      {p.edited && <div className="text-caption text-status-pending mt-0.5">Đã sửa, có ghi nhật ký</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <dl className="grid grid-cols-6 gap-2 text-body-sm">
          {['Có mặt', 'Đi muộn', 'Vắng giữa giờ', 'Vắng', 'Có phép', 'Không xác định'].map((k) => (
            <div key={k} className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">{k}</dt><dd className="font-semibold tabular-nums">{counts[k] || 0}</dd></div>
          ))}
        </dl>
        <div className="p-3 rounded-lg border border-border-subtle flex items-start gap-2.5 text-body-sm">
          <Icon name="face_retouching_off" size={20} className="text-text-secondary" />
          <div>
            <b>{d.unmatched}</b> khuôn mặt không khớp danh sách lớp, đã loại bỏ (chỉ giữ số đếm). Có <b>{d.altCheckedIn}</b> SV đã quét QR, nên dư <b>{d.unmatched - d.altCheckedIn}</b>: có thể có người ngoài danh sách (dự giờ, ngồi nhầm lớp).
            <div className="text-caption text-text-secondary">Hệ thống không định danh và không cảnh báo an ninh. GV kiểm tra tại lớp nếu cần.</div>
          </div>
        </div>
        <p className="text-caption text-text-secondary">"Không xác định" không bao giờ được tính là vắng. Kết quả tạm thời chưa đẩy về Hệ thống Đào tạo; chỉ kết quả đã chốt và hết hạn khiếu nại mới được đẩy.</p>
      </div>

      <div className="p-space-md border-t border-border-subtle bg-surface-bright flex items-center gap-2">
        <button className="btn-outline" disabled={stage === 'final' || !!ended} onClick={() => { setEnded(95); log(`GV kết thúc sớm tiết ${row.room} ${row.slot} lúc ${hhmm(d.start + 95)}`, row.cls); toast('Đã ghi kết thúc sớm', 'Thời gian sau khi kết thúc không tính vắng.', 'success'); }}><Icon name="stop_circle" />Kết thúc sớm</button>
        <button className="btn-outline" disabled={stage === 'final'} onClick={() => { log(`GV cho giải lao thêm tại ${row.room}`, row.cls); toast('Đã ghi giải lao', 'Khoảng giải lao không tính rời lớp.', 'success'); }}><Icon name="coffee" />Cho giải lao</button>
        <span className="text-caption text-text-secondary ml-auto">{editable ? 'GV hoặc Phòng Đào tạo sửa kết luận trước khi chốt.' : stage === 'final' ? 'Muốn sửa sau khi chốt cần có quyết định và ghi nhật ký.' : 'Vai trò hiện tại chỉ được xem.'}</span>
        <button className="btn-primary" disabled={!editable} onClick={confirm}><Icon name="task_alt" />Xác nhận và chốt</button>
      </div>
    </Drawer>
  );
}
