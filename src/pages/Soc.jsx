import { useState } from 'react';
import { Banner, DataBoundary, Icon, Chip, MetricStrip, PageHeader, ConfirmReason } from '../components/ui';
import { useApp } from '../store';
import { SOC_EVENTS } from '../data/mock';
import { fmtNumber } from '../lib/format';

const lv = { critical: ['status-rejected', 'Nghiêm trọng', 'error', 'text-status-rejected'], warning: ['status-pending', 'Cảnh báo', 'warning', 'text-status-pending'], info: ['status-inactive', 'Thông tin', 'info', 'text-text-secondary'] };
const LEVEL_RANK = { critical: 0, warning: 1, info: 2 };
const STATE_RANK = { open: 0, ack: 1, closed: 2 };
const STATE_LABEL = { ack: ['neutral', 'Đã tiếp nhận'], closed: ['status-active', 'Đã đóng'] };
const byPriority = (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.time.localeCompare(a.time);
const ruleOf = (e) => e.rule || (e.level === 'critical' ? (e.title.includes('danh sách cấm') ? 'R-003' : 'R-004B') : e.title.includes('Dạy thay') ? 'R-005' : '—');

export default function Soc() {
  const { log, toast } = useApp();
  const [events, setEvents] = useState(SOC_EVENTS);
  const [sel, setSel] = useState(SOC_EVENTS[0].id);
  const [ask, setAsk] = useState(null);
  const cur = events.find((e) => e.id === sel);
  const set = (id, state) => setEvents((es) => es.map((e) => (e.id === id ? { ...e, state } : e)));
  const openCritical = events.filter((e) => e.state === 'open' && e.level === 'critical').length;
  const sorted = [...events].sort(byPriority);

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="An ninh & ngoại lệ" desc="Sự kiện an ninh theo thời gian thực, ngoại lệ dạy thay và khiếu nại điểm danh. Khuôn mặt luôn được làm mờ."
        badge={openCritical > 0 && <Chip color="status-rejected" icon="error">{openCritical} sự cố nghiêm trọng</Chip>} />

      <DataBoundary name="events" label="sự kiện an ninh" fill scopeNote="global" skeleton="metrics-split">
      <MetricStrip className="mb-space-md shrink-0" items={[
        { label: 'Thời gian phát cảnh báo', value: '1,6 giây', sub: 'Mục tiêu tối đa 2 giây' },
        { label: 'Sự kiện 24 giờ qua', value: fmtNumber(1284), sub: '98% tự động đóng' },
        { label: 'Khiếu nại điểm danh', value: '3', sub: 'Chờ tra cứu minh chứng', alert: true },
        { label: 'Dạy thay chưa xin phép', value: '7', sub: 'Tuần này' },
      ]} />

      <div className="flex-1 min-h-[360px] grid grid-cols-[380px_minmax(0,1fr)] gap-space-md">
        <section className="card overflow-y-auto divide-y divide-border-subtle" aria-label="Danh sách sự kiện">
          {sorted.map((e) => (
            <button key={e.id} onClick={() => setSel(e.id)} aria-current={sel === e.id ? 'true' : undefined} className={`w-full text-left px-3.5 py-3 flex flex-col gap-1 transition-colors -outline-offset-2 ${sel === e.id ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`flex items-center gap-1.5 text-label-sm ${lv[e.level][3]}`}><Icon name={lv[e.level][2]} size={16} />{lv[e.level][1]}</span>
                <span className="font-mono text-caption text-text-secondary">{e.time}</span>
              </div>
              <span className="text-label-md font-semibold">{e.title}</span>
              <div className="flex items-center justify-between gap-2 text-caption text-text-secondary">
                <span className="truncate">{e.place}</span>
                {STATE_LABEL[e.state] && <Chip color={STATE_LABEL[e.state][0]} className="shrink-0">{STATE_LABEL[e.state][1]}</Chip>}
              </div>
            </button>
          ))}
        </section>

        {cur && (
          <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Chi tiết sự kiện">
            <header className="px-space-md py-3 border-b border-border-subtle flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0"><h2 className="text-k-title-md truncate">{cur.title}</h2><p className="text-caption text-text-secondary"><span className="font-mono">{cur.id}</span> • {cur.place} • <span className="font-mono">{cur.cam}</span></p></div>
              <Chip color={lv[cur.level][0]} className="shrink-0">{lv[cur.level][1]}</Chip>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto p-space-md flex flex-col gap-space-md">
              <div className="relative h-56 rounded-lg overflow-hidden bg-inverse-surface shrink-0">
                <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-40" aria-hidden><rect x="40" y="120" width="320" height="80" fill="#4a5470" /><rect x="60" y="40" width="60" height="80" fill="#3a4360" /><rect x="280" y="50" width="50" height="70" fill="#3a4360" /><circle cx="200" cy="95" r="16" fill="#8892b0" /><rect x="186" y="112" width="28" height="50" rx="8" fill="#8892b0" /></svg>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption font-mono">{cur.cam} • {cur.time}</div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption">Khuôn mặt đã làm mờ</div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption">Minh chứng lưu 30 ngày. Xem đầy đủ sẽ được ghi nhật ký.</div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-body-sm">
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Thời gian phát cảnh báo</dt><dd className="font-medium">{cur.latency}</dd></div>
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Quy tắc kích hoạt</dt><dd className="font-medium font-mono">{ruleOf(cur)}</dd></div>
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Hành động tự động</dt><dd className="font-medium">{cur.level === 'critical' ? 'Còi + báo an ninh' : 'Ghi nhật ký'}</dd></div>
              </dl>
              {cur.title.includes('Dạy thay') && <Banner>Bài giảng vẫn được ghi âm và phát hành bình thường. Cần cán bộ xác nhận ngoại lệ hoặc chuyển Phòng Đào tạo xử lý.</Banner>}
              {cur.title.includes('Khiếu nại') && <Banner>Sinh viên khiếu nại bị ghi vắng tiết 1-3 C301. Tra cứu cho thấy có mặt 74% thời lượng (dưới mức 80%). Xem minh chứng để quyết định.</Banner>}
            </div>
            <footer className="px-space-md py-3 border-t border-border-subtle flex justify-end gap-2 shrink-0">
              <button className="btn-outline" disabled={cur.state !== 'open'} onClick={() => { set(cur.id, 'ack'); log('Tiếp nhận sự kiện an ninh', cur.id); toast('Đã tiếp nhận', cur.id, 'success'); }}><Icon name="front_hand" />Tiếp nhận</button>
              <button className="btn-outline" onClick={() => setAsk('evidence')}><Icon name="smart_display" />Xem minh chứng</button>
              <button className="btn-primary" disabled={cur.state === 'closed'} onClick={() => setAsk('close')}><Icon name="task_alt" />{cur.title.includes('Dạy thay') ? 'Duyệt ngoại lệ' : 'Đóng sự cố'}</button>
            </footer>
          </section>
        )}
      </div>
      </DataBoundary>

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} minLength={ask === 'evidence' ? 5 : 10}
        title={ask === 'evidence' ? 'Xem minh chứng video' : 'Đóng sự cố / Duyệt ngoại lệ'} subtitle={cur?.id}
        onConfirm={(reason) => {
          if (ask === 'close') { set(cur.id, 'closed'); log(`Đóng sự cố — ${reason}`, cur.id); toast('Đã đóng sự cố', cur.id, 'success'); }
          else { log(`Xem minh chứng video — ${reason}`, cur.id, 'sensitive'); toast('Đã mở minh chứng', 'Thao tác đã được ghi nhật ký.', 'warn'); }
          setAsk(null);
        }} />
    </div>
  );
}
