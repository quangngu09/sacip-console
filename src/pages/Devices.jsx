import { useState } from 'react';
import { Icon, Chip, Empty, MetricStrip, PageHeader, SearchInput, Select, StatusDot } from '../components/ui';
import { useApp } from '../store';
import { DEVICES } from '../data/mock';

const CONNECTION_OPTIONS = [{ value: 'all', label: 'Tất cả kết nối' }, { value: 'on', label: 'Trực tuyến' }, { value: 'off', label: 'Mất kết nối' }, { value: 'unassigned', label: 'Chưa gán phòng' }];

export default function Devices() {
  const { toast, log } = useApp();
  const [kind, setKind] = useState('all');
  const [connection, setConnection] = useState('all');
  const [q, setQ] = useState('');
  const [devices, setDevices] = useState(DEVICES);
  const kinds = [{ value: 'all', label: 'Tất cả loại' }, ...[...new Set(DEVICES.map((d) => d.kind))].map((k) => ({ value: k, label: k }))];
  const online = devices.filter((d) => d.online).length;
  const unassigned = devices.filter((d) => !d.room).length;
  const rows = devices
    .filter((d) => kind === 'all' || d.kind === kind)
    .filter((d) => connection === 'all' || (connection === 'on' ? d.online : connection === 'off' ? !d.online : !d.room))
    .filter((d) => !q || `${d.id} ${d.ip} ${d.mac} ${d.serial} ${d.room || ''} ${d.vendor}`.toLowerCase().includes(q.toLowerCase()));
  const canReset = kind !== 'all' || connection !== 'all' || !!q;
  const reset = () => { setKind('all'); setConnection('all'); setQ(''); };

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Thiết bị" desc="Theo dõi camera, đầu ghi và thiết bị mạng. Thiết bị chỉ được gán vào phòng đã duyệt hạ tầng."
        actions={<>
          <button className="btn-outline" onClick={() => { setDevices((ds) => ds.map((d) => ({ ...d, ntp: d.kind.includes('BLE') ? d.ntp : true }))); log('Đồng bộ giờ toàn bộ thiết bị', 'Thiết bị'); toast('Đã đồng bộ giờ', 'Thời gian thiết bị khớp máy chủ (lệch dưới 5ms).', 'success'); }}><Icon name="schedule" />Đồng bộ giờ</button>
          <button className="btn-primary" onClick={() => toast('Khai báo thiết bị', 'Thiết bị mới cần được gán vào phòng đã duyệt hạ tầng.')}><Icon name="add" />Khai báo thiết bị</button>
        </>} />

      <MetricStrip className="mb-space-md shrink-0" items={[
        { label: 'Tổng thiết bị', value: devices.length, sub: `${kinds.length - 1} loại thiết bị` },
        { label: 'Trực tuyến', value: online, sub: `${Math.round((online / devices.length) * 100)}% tổng số` },
        { label: 'Mất kết nối', value: devices.length - online, sub: devices.length - online ? 'Cần kiểm tra ngay' : 'Không có', alert: devices.length - online > 0 },
        { label: 'Chưa gán phòng', value: unassigned, sub: unassigned ? 'Cần gán tại Không gian & khu vực' : 'Không có', alert: unassigned > 0 },
      ]} />

      <div className="card flex-1 min-h-[320px] flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2 shrink-0">
          <SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm theo mã, IP, serial, phòng" />
          <Select className="!w-[230px]" label="Loại thiết bị" value={kind} options={kinds} onChange={setKind} />
          <Select className="!w-[170px]" label="Kết nối" value={connection} options={CONNECTION_OPTIONS} onChange={setConnection} />
          {canReset && <button className="btn text-text-secondary hover:bg-surface-container-low" onClick={reset}><Icon name="restart_alt" size={16} />Đặt lại</button>}
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="data-table">
            <thead><tr>
              <th className="sticky top-0 z-10">Thiết bị</th>
              <th className="sticky top-0 z-10">Hãng và serial</th>
              <th className="sticky top-0 z-10">Địa chỉ mạng</th>
              <th className="sticky top-0 z-10 hidden min-[1400px]:table-cell">Cổng switch</th>
              <th className="sticky top-0 z-10">Phòng</th>
              <th className="sticky top-0 z-10">Kết nối</th>
              <th className="sticky top-0 z-10">Đồng bộ giờ</th>
              <th className="sticky top-0 right-0 z-20 text-right">Thao tác</th>
            </tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="h-14 bg-surface hover:bg-surface-container-low">
                  <td><div className="font-mono font-medium whitespace-nowrap">{d.id}</div><div className="text-caption text-text-secondary whitespace-nowrap">{d.kind}</div></td>
                  <td><div>{d.vendor}</div><div className="text-caption font-mono text-text-secondary whitespace-nowrap">{d.serial}</div></td>
                  <td><div className="font-mono whitespace-nowrap">{d.ip}</div><div className="text-caption font-mono text-text-secondary whitespace-nowrap">{d.mac}</div></td>
                  <td className="hidden min-[1400px]:table-cell whitespace-nowrap">{d.port}</td>
                  <td>{d.room ? <span className="font-mono">{d.room}</span> : <Chip color="status-pending">Chưa gán</Chip>}</td>
                  <td className="whitespace-nowrap"><StatusDot color={d.online ? 'status-active' : 'status-rejected'} label={d.online ? 'Trực tuyến' : 'Mất kết nối'} /></td>
                  <td className="whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 text-label-sm ${d.ntp ? 'text-status-active' : 'text-status-pending'}`}><Icon name={d.ntp ? 'check_circle' : 'error'} size={16} />{d.ntp ? 'Đã đồng bộ' : 'Chưa đồng bộ'}</span></td>
                  <td className="sticky right-0 z-[5] bg-inherit text-right">
                    <button className="btn-outline btn-sm" aria-label={`Kiểm tra ${d.id}`} onClick={() => toast(`Kiểm tra ${d.id}`, d.online ? `${d.ip} phản hồi 1ms` : `${d.ip} không phản hồi. Kiểm tra cổng ${d.port}.`, d.online ? 'success' : 'error')}>Kiểm tra</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty icon="search_off" title="Không có thiết bị phù hợp" desc="Thử bỏ bớt bộ lọc." />}
        </div>
        <div className="h-10 px-space-md border-t border-border-subtle text-caption text-text-secondary flex items-center shrink-0" aria-live="polite">Hiển thị {rows.length} / {devices.length} thiết bị</div>
      </div>
    </div>
  );
}
