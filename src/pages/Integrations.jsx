import { useState } from 'react';
import { Banner, Chip, DataBoundary, Empty, Icon, PageHeader, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { retryEvent, syncSource } from '../api/client';
import { TRIGGER_TARGET } from '../api/enums';
import { fmtDateTime, fmtNumber, fmtRelative } from '../lib/format';

const SRC_STATUS = { OK: ['status-active', 'Bình thường'], WARN: ['status-pending', 'Có cảnh báo'], ERROR: ['status-rejected', 'Lỗi đồng bộ'] };
const EV_STATUS = { DELIVERED: ['status-active', 'Đã gửi'], RETRYING: ['status-pending', 'Đang thử lại'], FAILED: ['status-rejected', 'Thất bại'] };
const TARGET_OPTIONS = [{ value: 'all', label: 'Mọi hệ thống nhận' }, ...Object.entries(TRIGGER_TARGET).map(([value, m]) => ({ value, label: m.label }))];

/** Nguồn dữ liệu đầu vào cho Policy Engine và sự kiện gửi ra hệ thống khác (Đặc tả Policy Engine §1 và §3). */
export default function Integrations() {
  const { data, call, toast } = useApp();
  const [tab, setTab] = useState('in');
  const [target, setTarget] = useState('all');
  const [busy, setBusy] = useState(null);
  const events = [...data.events].filter((e) => target === 'all' || e.target === target).sort((a, b) => b.at.localeCompare(a.at));

  const sync = async (s) => {
    setBusy(s.id);
    try { await call(syncSource, s.id); toast(`Đã đồng bộ ${s.name}`, s.id === 'CONTRACTOR' ? 'Vẫn còn bản ghi thiếu ngày hết hạn hợp đồng.' : 'Dữ liệu đã cập nhật.', 'success'); } catch (e) { toast(`Không đồng bộ được ${s.name}`, e.message, 'error'); }
    setBusy(null);
  };

  return (
    <div>
      <PageHeader title="Nguồn dữ liệu & tích hợp" desc="Hệ thống không tự tạo người, thiết bị hay phòng ban: dữ liệu đến từ các hệ thống nguồn; mọi thay đổi trạng thái được gửi sang hệ thống khác qua Kafka hoặc webhook." />
      <Tabs label="Chiều dữ liệu" className="mb-space-md border-b border-border-subtle" value={tab} onChange={setTab}
        items={[{ key: 'in', label: 'Nguồn đầu vào', count: data.sources.length, tone: data.sources.some((s) => s.status === 'ERROR') ? 'status-rejected' : undefined }, { key: 'out', label: 'Sự kiện gửi đi', count: data.events.length }]} />

      <DataBoundary name="integrations" label="dữ liệu tích hợp" scopeNote="global">
        {tab === 'in' ? (
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Hệ thống nguồn</th><th>Cung cấp</th><th>Cách đồng bộ</th><th className="text-right">Bản ghi</th><th>Lần đồng bộ cuối</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="min-w-[200px]"><div className="font-medium">{s.name}</div><div className="font-mono text-caption text-text-secondary">{s.id}</div></td>
                    <td className="min-w-[220px]">{s.provides}</td>
                    <td className="whitespace-nowrap">{s.method}</td>
                    <td className="text-right tabular-nums">{fmtNumber(s.records)}</td>
                    <td className="whitespace-nowrap"><div>{fmtRelative(s.last_sync)}</div><div className="text-caption text-text-secondary">{fmtDateTime(s.last_sync)}</div></td>
                    <td className="min-w-[220px]"><Chip color={SRC_STATUS[s.status][0]}>{SRC_STATUS[s.status][1]}</Chip>{s.note && <p className="text-caption text-text-secondary mt-1">{s.note}</p>}</td>
                    <td className="text-right"><button className="btn-outline btn-sm" disabled={busy === s.id} onClick={() => sync(s)}><Icon name="sync" size={16} className={busy === s.id ? 'animate-spin' : ''} />{busy === s.id ? 'Đang đồng bộ' : 'Đồng bộ ngay'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-border-subtle flex items-center gap-2">
              <Select className="!w-[240px]" label="Hệ thống nhận" value={target} options={TARGET_OPTIONS} onChange={setTarget} />
              <span className="text-caption text-text-secondary ml-auto">Bật, tắt từng loại sự kiện trong bước 4 của Chính sách sinh trắc.</span>
            </div>
            {data.events.some((e) => e.status === 'RETRYING') && <Banner tone="warn" className="m-3">Có sự kiện chưa gửi được. Hệ thống tự thử lại; có thể gửi lại thủ công sau khi bên nhận khắc phục.</Banner>}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Thời điểm</th><th>Gửi tới</th><th>Kênh</th><th>Liên quan</th><th className="min-w-[320px]">Dữ liệu</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.event_id} className="align-top">
                      <td className="whitespace-nowrap"><div>{fmtDateTime(e.at)}</div><div className="font-mono text-caption text-text-secondary">{e.event_id}</div></td>
                      <td className="whitespace-nowrap"><span className="flex items-center gap-1.5"><Icon name={TRIGGER_TARGET[e.target].icon} size={16} />{TRIGGER_TARGET[e.target].label}</span><span className="font-mono text-caption text-text-secondary">{e.trigger_id}</span></td>
                      <td className="whitespace-nowrap"><div>{e.transport === 'KAFKA' ? 'Kafka' : 'Webhook'}</div><div className="font-mono text-caption text-text-secondary max-w-[220px] truncate" title={e.destination}>{e.destination}</div></td>
                      <td className="font-mono text-caption whitespace-nowrap">{e.ref}</td>
                      <td><code className="font-mono text-caption text-text-secondary break-all">{JSON.stringify(e.payload)}</code></td>
                      <td className="whitespace-nowrap">
                        <Chip color={EV_STATUS[e.status][0]}>{EV_STATUS[e.status][1]}</Chip>
                        {e.error && <p className="text-caption text-status-pending mt-1 max-w-[220px] whitespace-normal">{e.error}</p>}
                        {e.status === 'RETRYING' && <button className="btn-outline btn-sm mt-1" onClick={async () => { await call(retryEvent, e.event_id); toast('Đã gửi lại', e.event_id, 'success'); }}>Gửi lại</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <Empty title="Chưa có sự kiện" />}
            </div>
          </div>
        )}
      </DataBoundary>
    </div>
  );
}
