import { useState } from 'react';
import { Icon, Chip, PageHeader } from '../components/ui';
import { useApp } from '../store';
import { DEVICES } from '../data/mock';

export default function Devices() {
  const { toast, log } = useApp();
  const [kind, setKind] = useState('Tất cả');
  const [devices, setDevices] = useState(DEVICES);
  const kinds = ['Tất cả', ...new Set(DEVICES.map((d) => d.kind))];
  const rows = devices.filter((d) => kind === 'Tất cả' || d.kind === kind);
  const online = devices.filter((d) => d.online).length;

  return (
    <div>
      <PageHeader icon="videocam" title="Thiết bị (CMDB)" desc="Hệ thống Quản lý Tài sản & Hạ tầng • IP, MAC, Port Switch PoE, Serial, trạng thái Online/Offline, đồng bộ NTP"
        actions={<><button className="btn-outline" onClick={() => { setDevices((ds) => ds.map((d) => ({ ...d, ntp: d.kind.includes('BLE') ? d.ntp : true }))); log('Đồng bộ NTP toàn bộ thiết bị', 'CMDB'); toast('Đã đồng bộ NTP', 'Thời gian thiết bị khớp máy chủ (lệch < 5ms).', 'success'); }}><Icon name="schedule" />Đồng bộ NTP</button><button className="btn-primary"><Icon name="add" />Khai báo thiết bị</button></>} />

      <div className="grid grid-cols-4 gap-space-md mb-space-md">
        {[['Tổng thiết bị', devices.length, 'devices'], ['Online', online, 'wifi'], ['Offline', devices.length - online, 'wifi_off'], ['Chưa gán phòng', devices.filter((d) => !d.room).length, 'link_off']].map(([l, v, i]) => (
          <div key={l} className="card p-space-md flex items-center justify-between"><div><div className="text-caption text-text-secondary">{l}</div><div className="text-[26px] font-semibold tabular-nums">{v}</div></div><Icon name={i} size={26} className="text-primary-container" /></div>
        ))}
      </div>

      <div className="flex gap-1 mb-space-sm flex-wrap">
        {kinds.map((k) => <button key={k} onClick={() => setKind(k)} className={`px-3 py-1 rounded-full text-label-sm ${kind === k ? 'bg-primary-container text-white' : 'bg-surface shadow-soft hover:bg-surface-container-low'}`}>{k}</button>)}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-bright sticky top-0"><tr className="h-10 text-[12px] uppercase tracking-wider text-text-secondary">
            {['Device ID', 'Loại', 'Hãng', 'IP', 'MAC / BSSID / UUID', 'Port Switch', 'Serial', 'Room_ID', 'Trạng thái', 'NTP', 'Thao tác'].map((h) => <th key={h} className="px-3 font-medium whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="h-12 border-t border-border-subtle/60 hover:bg-surface-container-low">
                <td className="px-3 font-mono font-semibold whitespace-nowrap">{d.id}</td>
                <td className="px-3 whitespace-nowrap">{d.kind}</td>
                <td className="px-3">{d.vendor}</td>
                <td className="px-3 font-mono text-caption">{d.ip}</td>
                <td className="px-3 font-mono text-caption whitespace-nowrap">{d.mac}</td>
                <td className="px-3 text-caption whitespace-nowrap">{d.port}</td>
                <td className="px-3 font-mono text-caption">{d.serial}</td>
                <td className="px-3">{d.room ? <span className="font-mono">{d.room}</span> : <Chip color="status-pending">Chưa gán</Chip>}</td>
                <td className="px-3 whitespace-nowrap"><span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${d.online ? 'bg-status-active' : 'bg-status-rejected'}`} /><span className={d.online ? 'text-status-active' : 'text-status-rejected'}>{d.online ? 'Online' : 'Offline'}</span></td>
                <td className="px-3">{d.ntp ? <Icon name="check_circle" className="text-status-active" /> : <Icon name="error" className="text-status-pending" />}</td>
                <td className="px-3 text-right">
                  <button className="text-primary-container text-label-sm font-medium px-2 py-1 rounded hover:bg-surface-container" onClick={() => { toast(`Ping ${d.id}`, d.online ? `${d.ip} phản hồi 1ms` : `${d.ip} không phản hồi — kiểm tra PoE ${d.port}`, d.online ? 'success' : 'error'); }}>Kiểm tra</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-text-secondary mt-2">Thiết bị chỉ được gán vào phòng đã duyệt hạ tầng — thực hiện tại trang Không gian & Zone.</p>
    </div>
  );
}
