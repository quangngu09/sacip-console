import { useState } from 'react';
import { Banner, Chip, DataBoundary, Empty, Icon, PageHeader, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { retryEvent, runContractExpiryCheck, syncSource } from '../api/client';
import { TRIGGER_SHORT, TRIGGER_TARGET, transportLabel } from '../api/enums';
import { fmtDateTime, fmtNumber, fmtRelative } from '../lib/format';

const SRC_STATUS = { OK: ['status-active', 'Bình thường'], WARN: ['status-pending', 'Có cảnh báo'], ERROR: ['status-rejected', 'Lỗi đồng bộ'] };
const EV_STATUS = { DELIVERED: ['status-active', 'Đã gửi'], RETRYING: ['status-pending', 'Đang thử lại'], FAILED: ['status-rejected', 'Thất bại'] };
const TARGET_OPTIONS = [{ value: 'all', label: 'Mọi hệ thống nhận' }, ...Object.entries(TRIGGER_TARGET).map(([value, m]) => ({ value, label: m.label }))];

/** Hiển thị dữ liệu sự kiện gọn: mẫu khuôn mặt chỉ hiện thông tin mã hóa, không hiện chuỗi mã. */
function Payload({ p }) {
  const { template, devices, ...rest } = p;
  return (
    <div className="flex flex-col gap-1">
      <code className="font-mono text-caption text-text-secondary break-all">{JSON.stringify(rest)}</code>
      {Array.isArray(devices) && <span className="text-caption"><b>{devices.length}</b> thiết bị: <span className="font-mono text-text-secondary">{devices.join(', ') || '—'}</span></span>}
      {template && (
        <span className="text-caption flex items-center gap-1 flex-wrap"><Icon name="lock" size={14} className="text-status-active" />Mẫu {template.face_profile_id} • {template.format} • {template.encryption} • <span className="font-mono text-text-secondary">{template.key_id}</span> • {fmtNumber(template.size_bytes)} B</span>
      )}
      {template === null && <span className="text-caption flex items-center gap-1"><Icon name="delete" size={14} className="text-status-rejected" />Lệnh xóa mẫu khỏi thiết bị</span>}
    </div>
  );
}

/** Nguồn dữ liệu đầu vào cho Policy Engine và sự kiện gửi ra hệ thống khác (Đặc tả Policy Engine §1 và §3). */
export default function Integrations() {
  const { data, call, toast, can } = useApp();
  const job = data.jobs.contract_check;
  const runCheck = async () => {
    setBusy('job');
    try {
      const r = await call(runContractExpiryCheck);
      if (r.found.length) toast(`Đã báo ${r.found.length} hợp đồng sắp hết hạn`, r.found.map((f) => `${f.code}: còn ${f.days_left} ngày`).join('; ') + (r.trigger_enabled ? '' : ' (sự kiện đang tắt trong chính sách, không gửi ra ngoài)'), 'success');
      else toast('Không có trường hợp mới', `Báo trước ${r.notice_days} ngày.${r.already.length ? ` ${r.already.length} hợp đồng đã báo trước đó.` : ''}`, 'info');
      setTab('out');
    } catch (e) { toast('Không chạy được', e.message, 'error'); }
    setBusy(null);
  };
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
      <PageHeader title="Nguồn dữ liệu & tích hợp" desc="Hệ thống không tự tạo người, thiết bị hay phòng ban: dữ liệu đến từ các hệ thống nguồn; mọi thay đổi trạng thái được gửi sang hệ thống khác qua Kafka, RabbitMQ hoặc webhook." />
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
            <div className="p-3 border-b border-border-subtle flex flex-wrap items-center gap-3 bg-surface-container-low">
              <Icon name="event_repeat" className="text-text-secondary" />
              <div className="min-w-0">
                <div className="text-body-sm font-medium">Quét hợp đồng nhà thầu sắp hết hạn <span className="text-caption text-text-secondary font-normal">({job.schedule})</span></div>
                <div className="text-caption text-text-secondary">Lần chạy cuối {fmtRelative(job.last_run)}: {job.last_result}</div>
              </div>
              {can('policy_write') && <button className="btn-outline btn-sm ml-auto" disabled={busy === 'job'} onClick={runCheck}><Icon name="play_arrow" size={16} />{busy === 'job' ? 'Đang quét' : 'Chạy ngay'}</button>}
            </div>
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
                      <td className="whitespace-nowrap"><span className="flex items-center gap-1.5"><Icon name={TRIGGER_TARGET[e.target].icon} size={16} />{TRIGGER_TARGET[e.target].label}</span><span className="text-caption text-text-secondary">{TRIGGER_SHORT[e.trigger_id] || e.trigger_id}</span></td>
                      <td className="whitespace-nowrap"><div>{transportLabel(e.transport)}</div><div className="font-mono text-caption text-text-secondary max-w-[220px] truncate" title={e.destination}>{e.destination}</div></td>
                      <td className="font-mono text-caption whitespace-nowrap">{e.ref}</td>
                      <td><Payload p={e.payload} /></td>
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
