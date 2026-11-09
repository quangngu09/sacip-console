import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataBoundary, Icon, Chip, MetricStrip, PageHeader, ConfirmReason, Tabs } from '../components/ui';
import { useApp } from '../store';
import { ackIncident, closeIncident, viewIncidentEvidence } from '../api/client';
import { fmtDateTime, fmtNumber } from '../lib/format';

const lv = { critical: ['status-rejected', 'Nghiêm trọng', 'error', 'text-status-rejected'], warning: ['status-pending', 'Cảnh báo', 'warning', 'text-status-pending'], info: ['status-inactive', 'Thông tin', 'info', 'text-text-secondary'] };
const LEVEL_RANK = { critical: 0, warning: 1, info: 2 };
const STATE_RANK = { open: 0, ack: 1, closed: 2 };
const STATE_LABEL = { ack: ['neutral', 'Đã tiếp nhận'], closed: ['status-active', 'Đã đóng'] };
const byPriority = (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.time.localeCompare(a.time);

/** Nhóm sự cố; ?loai=SPOOF mở sẵn nhóm (liên kết từ Giám sát AI). */
export const INCIDENT_CATEGORY = {
  ACCESS: { label: 'Vào sai khu vực', icon: 'door_front' },
  SPOOF: { label: 'Giả mạo, gian lận thiết bị', icon: 'phonelink_lock' },
  DEVICE: { label: 'Thiết bị an ninh', icon: 'videocam_off' },
};

/** Sự cố an ninh theo thời gian thực. Việc học vụ (dạy thay, khiếu nại điểm danh) nằm ở Lịch học & điểm danh. */
export default function Soc() {
  const { data, call, toast } = useApp();
  const [params, setParams] = useSearchParams();
  const cat = INCIDENT_CATEGORY[params.get('loai')] ? params.get('loai') : 'all';
  const events = data.incidents;
  const shown = events.filter((e) => cat === 'all' || e.category === cat).sort(byPriority);
  const [sel, setSel] = useState(null);
  const [ask, setAsk] = useState(null);
  const cur = shown.find((e) => e.id === sel) || shown[0];
  const openCount = (c) => events.filter((e) => e.state !== 'closed' && (c === 'all' || e.category === c)).length;
  const openCritical = events.filter((e) => e.state === 'open' && e.level === 'critical').length;

  const run = async (fn, ok) => {
    try { await call(fn); toast(...ok); } catch (e) { toast('Không thực hiện được', e.message, 'error'); }
    setAsk(null);
  };

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Sự cố an ninh" desc="Vào sai khu vực, nghi giả mạo và sự cố thiết bị an ninh, theo thời gian thực. Khuôn mặt luôn được làm mờ; xem minh chứng đầy đủ phải nêu lý do và được ghi nhật ký."
        badge={openCritical > 0 && <Chip color="status-rejected" icon="error">{openCritical} sự cố nghiêm trọng chưa tiếp nhận</Chip>} />

      <DataBoundary name="events" label="sự cố an ninh" fill scopeNote="global" skeleton="metrics-split">
      <MetricStrip className="mb-space-md shrink-0" items={[
        { label: 'Thời gian phát cảnh báo', value: '1,6 giây', sub: 'Mục tiêu tối đa 2 giây' },
        { label: 'Sự kiện 24 giờ qua', value: fmtNumber(1284), sub: '98% tự động đóng' },
        { label: 'Chưa tiếp nhận', value: String(events.filter((e) => e.state === 'open').length), sub: `${openCritical} nghiêm trọng`, alert: openCritical > 0 },
        { label: 'Nghi giả mạo đang mở', value: String(openCount('SPOOF')), sub: 'Phát hiện bởi AI-ENGINE' },
      ]} />

      <div className="card shrink-0 mb-space-md">
        <Tabs label="Nhóm sự cố" className="px-2" value={cat} onChange={(c) => { setParams(c === 'all' ? {} : { loai: c }); setSel(null); }}
          items={[{ key: 'all', label: 'Tất cả', count: openCount('all') }, ...Object.entries(INCIDENT_CATEGORY).map(([key, m]) => ({ key, label: m.label, count: openCount(key) }))]} />
      </div>

      <div className="flex-1 min-h-[360px] grid grid-cols-[380px_minmax(0,1fr)] gap-space-md">
        <section className="card overflow-y-auto divide-y divide-border-subtle" aria-label="Danh sách sự cố">
          {shown.length === 0 && <p className="px-space-md py-6 text-body-sm text-text-secondary">Không có sự cố trong nhóm này.</p>}
          {shown.map((e) => (
            <button key={e.id} onClick={() => setSel(e.id)} aria-current={cur?.id === e.id ? 'true' : undefined} className={`w-full text-left px-3.5 py-3 flex flex-col gap-1 transition-colors -outline-offset-2 ${cur?.id === e.id ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`flex items-center gap-1.5 text-label-sm ${lv[e.level][3]}`}><Icon name={lv[e.level][2]} size={16} />{lv[e.level][1]}</span>
                <span className="font-mono text-caption text-text-secondary">{e.time}</span>
              </div>
              <span className="text-label-md font-semibold">{e.title}</span>
              <div className="flex items-center justify-between gap-2 text-caption text-text-secondary">
                <span className="truncate flex items-center gap-1"><Icon name={INCIDENT_CATEGORY[e.category].icon} size={14} />{e.place}</span>
                {STATE_LABEL[e.state] && <Chip color={STATE_LABEL[e.state][0]} className="shrink-0">{STATE_LABEL[e.state][1]}</Chip>}
              </div>
            </button>
          ))}
        </section>

        {cur && (
          <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Chi tiết sự cố">
            <header className="px-space-md py-3 border-b border-border-subtle flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0"><h2 className="text-k-title-md truncate">{cur.title}</h2><p className="text-caption text-text-secondary"><span className="font-mono">{cur.id}</span> • {INCIDENT_CATEGORY[cur.category].label} • {cur.place} • <span className="font-mono">{cur.cam}</span></p></div>
              <Chip color={lv[cur.level][0]} className="shrink-0">{lv[cur.level][1]}</Chip>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto p-space-md flex flex-col gap-space-md">
              {cur.category !== 'DEVICE' && (
                <div className="relative h-56 rounded-lg overflow-hidden bg-inverse-surface shrink-0">
                  <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-40" aria-hidden><rect x="40" y="120" width="320" height="80" fill="#4a5470" /><rect x="60" y="40" width="60" height="80" fill="#3a4360" /><rect x="280" y="50" width="50" height="70" fill="#3a4360" /><circle cx="200" cy="95" r="16" fill="#8892b0" /><rect x="186" y="112" width="28" height="50" rx="8" fill="#8892b0" /></svg>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption font-mono">{cur.cam} • {cur.time}</div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption">Khuôn mặt đã làm mờ</div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-caption">Minh chứng lưu 30 ngày. Xem đầy đủ sẽ được ghi nhật ký.</div>
                </div>
              )}
              {cur.detail && <p className="text-body-sm">{cur.detail}</p>}
              <dl className="grid grid-cols-3 gap-2 text-body-sm">
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Thời gian phát cảnh báo</dt><dd className="font-medium">{cur.latency}</dd></div>
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Phát hiện bởi</dt><dd className="font-medium font-mono">{cur.rule}</dd></div>
                <div className="p-2.5 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Hành động tự động</dt><dd className="font-medium">{cur.auto}</dd></div>
              </dl>
              {(cur.ack_by || cur.closed_by) && (
                <ul className="text-caption text-text-secondary flex flex-col gap-0.5">
                  {cur.ack_by && <li>Tiếp nhận: {cur.ack_by}, {fmtDateTime(cur.ack_at)}</li>}
                  {cur.closed_by && <li>Đóng: {cur.closed_by}, {fmtDateTime(cur.closed_at)} — {cur.resolution}</li>}
                </ul>
              )}
            </div>
            <footer className="px-space-md py-3 border-t border-border-subtle flex justify-end gap-2 shrink-0">
              <button className="btn-outline" disabled={cur.state !== 'open'} onClick={() => run(() => ackIncident(cur.id), ['Đã tiếp nhận', cur.id, 'success'])}><Icon name="front_hand" />Tiếp nhận</button>
              {cur.category !== 'DEVICE' && <button className="btn-outline" onClick={() => setAsk('evidence')}><Icon name="smart_display" />Xem minh chứng</button>}
              <button className="btn-primary" disabled={cur.state === 'closed'} onClick={() => setAsk('close')}><Icon name="task_alt" />Đóng sự cố</button>
            </footer>
          </section>
        )}
      </div>
      </DataBoundary>

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} minLength={ask === 'evidence' ? 5 : 10}
        title={ask === 'evidence' ? 'Xem minh chứng video' : 'Đóng sự cố'} subtitle={cur && `${cur.id} • ${cur.title}`}
        reasonLabel={ask === 'close' ? 'Đã xử lý thế nào' : undefined}
        onConfirm={(reason) => (ask === 'close'
          ? run(() => closeIncident(cur.id, reason), ['Đã đóng sự cố', cur.id, 'success'])
          : run(() => viewIncidentEvidence(cur.id, reason), ['Đã mở minh chứng', 'Thao tác đã được ghi nhật ký.', 'warn']))} />
    </div>
  );
}
