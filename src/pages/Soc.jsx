import { useState } from 'react';
import { Icon, Chip, PageHeader, ConfirmReason } from '../components/ui';
import { useApp } from '../store';
import { SOC_EVENTS } from '../data/mock';

const lv = { critical: ['status-rejected', 'Nghiêm trọng'], warning: ['status-pending', 'Cảnh báo'], info: ['status-inactive', 'Thông tin'] };

export default function Soc() {
  const { log, toast } = useApp();
  const [events, setEvents] = useState(SOC_EVENTS);
  const [sel, setSel] = useState(SOC_EVENTS[0].id);
  const [ask, setAsk] = useState(null);
  const cur = events.find((e) => e.id === sel);
  const set = (id, state) => setEvents((es) => es.map((e) => (e.id === id ? { ...e, state } : e)));

  return (
    <div>
      <PageHeader icon="shield_lock" title="SOC & Ngoại lệ" desc="Giám sát an ninh thời gian thực • duyệt ngoại lệ “Dạy thay” • tra cứu minh chứng khi có khiếu nại điểm danh"
        badge={<Chip color="status-rejected" icon="sensors">{events.filter((e) => e.state === 'open' && e.level === 'critical').length} sự cố mở</Chip>} />

      <div className="grid grid-cols-4 gap-space-md mb-space-md">
        {[['Độ trễ cảnh báo TB', '1.6s', 'Mục tiêu ≤ 2s', 'timer'], ['Sự kiện 24h', '1,284', '98% tự động đóng', 'stream'], ['Khiếu nại điểm danh', '3', 'Chờ tra cứu minh chứng', 'gavel'], ['Dạy thay chưa phép', '7', 'Tuần này', 'swap_horiz']].map(([l, v, s, i]) => (
          <div key={l} className="card p-space-md"><div className="flex justify-between text-caption text-text-secondary">{l}<Icon name={i} className="text-primary-container" /></div><div className="text-[26px] font-semibold tabular-nums">{v}</div><div className="text-caption text-text-secondary">{s}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-space-md items-start">
        <div className="col-span-5 card divide-y divide-border-subtle overflow-hidden">
          {events.map((e) => (
            <button key={e.id} onClick={() => setSel(e.id)} className={`w-full text-left p-3 flex gap-3 border-l-4 ${sel === e.id ? 'bg-surface-container-low border-l-primary-container' : 'border-l-transparent hover:bg-surface-container-low/50'}`}>
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${e.level === 'critical' ? 'bg-status-rejected' : e.level === 'warning' ? 'bg-status-pending' : 'bg-status-inactive'} ${e.state === 'open' && e.level === 'critical' ? 'animate-pulse' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between"><span className="text-label-md font-semibold">{e.title}</span><span className="font-mono text-caption text-text-secondary">{e.time}</span></div>
                <div className="text-caption text-text-secondary">{e.place} • {e.id}</div>
                <div className="flex gap-1 mt-1"><Chip color={lv[e.level][0]}>{lv[e.level][1]}</Chip>{e.state === 'ack' && <Chip color="neutral">Đã tiếp nhận</Chip>}{e.state === 'closed' && <Chip color="status-active">Đã đóng</Chip>}</div>
              </div>
            </button>
          ))}
        </div>

        {cur && (
          <div className="col-span-7 card">
            <div className="p-space-md border-b border-border-subtle flex justify-between">
              <div><h2 className="text-headline-md">{cur.title}</h2><p className="text-caption text-text-secondary">{cur.id} • {cur.place} • {cur.cam}</p></div>
              <Chip color={lv[cur.level][0]}>{lv[cur.level][1]}</Chip>
            </div>
            <div className="p-space-md flex flex-col gap-space-md">
              <div className="relative h-56 rounded-lg overflow-hidden bg-inverse-surface flex items-center justify-center">
                <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-40"><rect x="40" y="120" width="320" height="80" fill="#4a5470" /><rect x="60" y="40" width="60" height="80" fill="#3a4360" /><rect x="280" y="50" width="50" height="70" fill="#3a4360" /><circle cx="200" cy="95" r="16" fill="#8892b0" /><rect x="186" y="112" width="28" height="50" rx="8" fill="#8892b0" /></svg>
                <div className="absolute border-2 border-status-rejected rounded" style={{ left: '44%', top: '30%', width: '14%', height: '48%' }} />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption font-mono">{cur.cam} • {cur.time}</div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-status-rejected text-white text-caption">Khuôn mặt làm mờ</div>
                <div className="absolute bottom-2 left-2 text-white/80 text-caption">Minh chứng video lưu 30 ngày • xem đầy đủ sẽ được ghi log</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-body-sm">
                <div className="p-2.5 rounded bg-surface-bright"><div className="text-caption text-text-secondary">Độ trễ phát cảnh báo</div><b>{cur.latency}</b></div>
                <div className="p-2.5 rounded bg-surface-bright"><div className="text-caption text-text-secondary">Rule kích hoạt</div><b>{cur.level === 'critical' ? (cur.title.includes('Blacklist') ? 'R-003' : 'R-004') : cur.title.includes('Dạy thay') ? 'R-005' : '—'}</b></div>
                <div className="p-2.5 rounded bg-surface-bright"><div className="text-caption text-text-secondary">Hành động tự động</div><b>{cur.level === 'critical' ? 'Còi + Push SOC' : 'Ghi audit'}</b></div>
              </div>
              {cur.title.includes('Dạy thay') && <div className="p-3 rounded-lg bg-ai-surface border border-ai-border/40 text-body-sm">Bài giảng vẫn được ghi âm & phát hành bình thường. Cần cán bộ xác nhận ngoại lệ hoặc chuyển Phòng Đào tạo xử lý.</div>}
              {cur.title.includes('Khiếu nại') && <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Sinh viên khiếu nại bị ghi vắng tiết 1-3 C301. Tra cứu: session presence 74% (&lt; 80%) — xem minh chứng để quyết định.</div>}
            </div>
            <div className="p-space-md border-t border-border-subtle flex justify-end gap-2">
              <button className="btn-outline disabled:opacity-40" disabled={cur.state !== 'open'} onClick={() => { set(cur.id, 'ack'); log('Tiếp nhận sự kiện SOC', cur.id); toast('Đã tiếp nhận', cur.id, 'success'); }}><Icon name="front_hand" />Tiếp nhận</button>
              <button className="btn-outline" onClick={() => setAsk('evidence')}><Icon name="smart_display" />Xem minh chứng</button>
              <button className="btn-primary disabled:opacity-40" disabled={cur.state === 'closed'} onClick={() => setAsk('close')}><Icon name="task_alt" />{cur.title.includes('Dạy thay') ? 'Duyệt ngoại lệ' : 'Đóng sự cố'}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} minLength={ask === 'evidence' ? 5 : 10}
        title={ask === 'evidence' ? 'Xem minh chứng video' : 'Đóng sự cố / Duyệt ngoại lệ'} subtitle={cur?.id}
        onConfirm={(reason) => {
          if (ask === 'close') { set(cur.id, 'closed'); log(`Đóng sự cố — ${reason}`, cur.id); toast('Đã đóng sự cố', cur.id, 'success'); }
          else { log(`Xem minh chứng video — ${reason}`, cur.id, 'sensitive'); toast('Đã mở minh chứng', 'Thao tác đã được ghi log.', 'warn'); }
          setAsk(null);
        }} />
    </div>
  );
}
