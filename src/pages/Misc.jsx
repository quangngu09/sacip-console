import { useState } from 'react';
import { Icon, Chip, Empty, MetricStrip, PageHeader, ConfirmReason, SearchInput, Select, Tabs } from '../components/ui';
import { useApp } from '../store';
import { CONSENTS } from '../data/mock';

export function AiMonitor() {
  const models = [
    ['Phát hiện khuôn mặt', 'SCRFD', 'Thiết bị xử lý tại phòng', '8.2ms', '99.1%'],
    ['Nhận diện khuôn mặt', 'ArcFace buffalo_l', 'Thiết bị xử lý và máy chủ', '21ms', '98.7%'],
    ['Kiểm tra chất lượng ảnh', 'Quality Gating v3.2', 'Máy chủ tiếp nhận', '6ms', '—'],
    ['Kiểm tra người thật', 'Anti-Spoofing v3.2', 'Thiết bị xử lý và Kiosk', '14ms', '99.4%'],
    ['Tìm kiếm khuôn mặt', 'pgvector HNSW', 'Cơ sở dữ liệu', '9ms', '—'],
  ];
  return (
    <div>
      <PageHeader title="Giám sát AI" desc="Theo dõi chất lượng mô hình. AI chỉ đưa gợi ý, không có quyền tự động từ chối hay thu hồi." />
      <MetricStrip className="mb-space-md" items={[
        { label: 'Thời gian nhận diện', value: '38ms', sub: 'Mục tiêu dưới 50ms' },
        { label: 'Độ chính xác nhận diện', value: '98.7%', sub: 'Mục tiêu từ 98%' },
        { label: 'Ảnh bị loại vì chất lượng', value: '6.4%', sub: 'Chủ yếu do chói và nghiêng', alert: true },
        { label: 'Phát hiện giả mạo', value: '12', sub: '7 ngày qua' },
      ]} />
      <div className="card overflow-x-auto mb-space-md">
        <table className="data-table">
          <thead><tr>{['Mô hình', 'Vị trí chạy', 'Thời gian xử lý', 'Độ chính xác', 'Trạng thái'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{models.map(([m, tech, w, l, a]) => (
            <tr key={m} className="h-14"><td><div className="font-medium">{m}</div><div className="text-caption font-mono text-text-secondary">{tech}</div></td><td>{w}</td><td className="tabular-nums">{l}</td><td className="tabular-nums">{a}</td><td><Chip color="status-active">Hoạt động</Chip></td></tr>
          ))}</tbody>
        </table>
      </div>
      <section className="card p-space-md">
        <h2 className="text-headline-md mb-2">Nguyên nhân ảnh bị loại (7 ngày)</h2>
        {[['Chói, phản quang', 41], ['Góc nghiêng trên 20°', 27], ['Thiếu sáng', 14], ['Bị che (khẩu trang, kính)', 11], ['Nghi giả mạo (ảnh in, màn hình)', 7]].map(([l, v]) => (
          <div key={l} className="flex items-center gap-3 py-1.5 text-body-sm"><span className="w-64">{l}</span><div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${v * 2}%` }} /></div><span className="w-10 text-right tabular-nums">{v}%</span></div>
        ))}
      </section>
    </div>
  );
}

const kindIcon = { view: 'visibility', alert: 'notifications_active', system: 'settings', ai: 'smart_toy', user: 'person', sensitive: 'gpp_maybe' };
const kindLabel = { view: 'Xem hồ sơ', alert: 'Cảnh báo', system: 'Hệ thống', ai: 'AI', user: 'Thao tác cán bộ', sensitive: 'Dữ liệu nhạy cảm' };
const KIND_TABS = ['all', 'user', 'view', 'sensitive', 'alert', 'ai', 'system'];
const isoDate = (t) => t.slice(6, 10) + '-' + t.slice(3, 5) + '-' + t.slice(0, 2);

export function AuditLog() {
  const { audit, log, toast } = useApp();
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const inRange = audit
    .filter((a) => !from || isoDate(a.t) >= from)
    .filter((a) => !to || isoDate(a.t) <= to)
    .filter((a) => !q || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q.toLowerCase()));
  const rows = inRange.filter((a) => f === 'all' || a.kind === f);
  return (
    <div>
      <PageHeader title="Nhật ký & báo cáo" desc="Nhật ký không thể sửa xóa. Mọi thao tác nhạy cảm (xem ảnh, phê duyệt, khóa, đổi quy tắc) đều ghi kèm người thực hiện."
        actions={<button className="btn-outline" onClick={() => { log('Xuất báo cáo thanh tra (không kèm ảnh)', 'Nhật ký & báo cáo'); toast('Đã xuất báo cáo kiểm toán', 'Báo cáo chỉ gồm thông tin thao tác, không kèm ảnh khuôn mặt.', 'success'); }}><Icon name="download" />Xuất báo cáo thanh tra</button>} />
      <div className="card overflow-hidden">
        <Tabs label="Loại nhật ký" className="px-2 border-b border-border-subtle" value={f} onChange={setF} items={KIND_TABS.map((k) => ({ key: k, label: k === 'all' ? 'Tất cả' : kindLabel[k], count: k === 'all' ? inRange.length : inRange.filter((a) => a.kind === k).length }))} />
        <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2 flex-wrap">
          <SearchInput className="flex-1 min-w-[220px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm người thực hiện, hành động, đối tượng" />
          <label className="flex items-center gap-2 text-label-md">Từ ngày<input type="date" className="input !w-[160px]" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-label-md">Đến ngày<input type="date" className="input !w-[160px]" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          {(q || from || to) && <button className="btn text-text-secondary hover:bg-surface-container-low" onClick={() => { setQ(''); setFrom(''); setTo(''); }}><Icon name="restart_alt" size={16} />Đặt lại</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>{['Thời gian', 'Loại', 'Người thực hiện', 'Hành động', 'Đối tượng'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((a, i) => (
              <tr key={i} className={`h-12 ${a.kind === 'sensitive' ? 'bg-status-pending/5' : ''}`}>
                <td className="font-mono text-caption whitespace-nowrap">{a.t}</td>
                <td className="whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 ${a.kind === 'sensitive' ? 'text-status-pending' : 'text-text-secondary'}`}><Icon name={kindIcon[a.kind]} size={16} />{kindLabel[a.kind]}</span></td>
                <td className="font-medium whitespace-nowrap">{a.actor}</td>
                <td>{a.action}</td>
                <td className="font-mono text-caption">{a.target}</td>
              </tr>
            ))}</tbody>
          </table>
          {rows.length === 0 && <Empty icon="search_off" title="Không có bản ghi phù hợp" desc="Thử đổi khoảng ngày hoặc bỏ bớt bộ lọc." />}
        </div>
        <div className="h-10 px-space-md border-t border-border-subtle text-caption text-text-secondary flex items-center" aria-live="polite">Hiển thị {rows.length} / {audit.length} bản ghi</div>
      </div>
    </div>
  );
}

const cState = {
  active: ['status-active', 'Còn hiệu lực'],
  withdrawing: ['status-pending', 'Đang rút đồng ý', 'Đang xóa dữ liệu, tối đa 72 giờ'],
  expired: ['status-inactive', 'Hết hiệu lực', 'Cần ký lại nếu tiếp tục sử dụng'],
  none: ['status-inactive', 'Chưa ký', 'Chưa có cam kết để rút'],
};
const STATE_OPTIONS = [{ value: 'all', label: 'Tất cả trạng thái' }, ...Object.entries(cState).map(([value, s]) => ({ value, label: s[1] }))];

export function Consents() {
  const { log, toast } = useApp();
  const [rows, setRows] = useState(CONSENTS);
  const [ask, setAsk] = useState(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const count = (s) => rows.filter((c) => c.state === s).length;
  const shown = rows.filter((c) => state === 'all' || c.state === state).filter((c) => !q || `${c.id} ${c.name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Đồng ý xử lý dữ liệu" desc="Cam kết theo Nghị định 13/2023. Người rút đồng ý luôn có phương án thay thế không dùng sinh trắc." />
      <MetricStrip className="mb-space-md" items={[
        { label: 'Còn hiệu lực', value: count('active'), sub: `Trên tổng ${rows.length} đối tượng` },
        { label: 'Đang rút đồng ý', value: count('withdrawing'), sub: 'Phải hoàn tất trong 72 giờ', alert: count('withdrawing') > 0 },
        { label: 'Hết hiệu lực', value: count('expired'), sub: 'Cần ký lại nếu tiếp tục' },
        { label: 'Chưa ký', value: count('none'), sub: 'Chưa thể xử lý dữ liệu sinh trắc' },
      ]} />
      <div className="card overflow-hidden">
        <div className="px-3 py-3 border-b border-border-subtle flex items-center gap-2">
          <SearchInput className="flex-1 min-w-[180px] max-w-sm" value={q} onChange={setQ} placeholder="Tìm theo mã hoặc họ tên" />
          <Select className="!w-[180px]" label="Trạng thái đồng ý" value={state} options={STATE_OPTIONS} onChange={setState} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>{['Họ tên và mã số', 'Mục đích xử lý', 'Ngày ký', 'Kênh ký', 'Trạng thái', 'Thao tác'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{shown.map((c) => (
              <tr key={c.id} className="h-14 hover:bg-surface-container-low">
                <td><div className="font-medium whitespace-nowrap">{c.name}</div><div className="text-caption font-mono text-text-secondary">{c.id}</div></td>
                <td>{c.purpose}</td>
                <td className="whitespace-nowrap">{c.signed}</td>
                <td className="whitespace-nowrap">{c.channel}</td>
                <td><Chip color={cState[c.state][0]}>{cState[c.state][1]}</Chip></td>
                <td>{c.state === 'active'
                  ? <button className="btn-outline btn-sm" aria-label={`Ghi nhận rút đồng ý của ${c.name}`} onClick={() => setAsk(c)}>Ghi nhận rút đồng ý</button>
                  : <span className="text-caption text-text-secondary">{cState[c.state][2]}</span>}</td>
              </tr>
            ))}</tbody>
          </table>
          {shown.length === 0 && <Empty icon="search_off" title="Không có đối tượng phù hợp" desc="Thử bỏ bớt bộ lọc." />}
        </div>
      </div>
      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} title="Ghi nhận rút đồng ý" subtitle={ask && `${ask.name} • ${ask.id}`} confirmLabel="Khởi tạo quy trình xóa"
        onConfirm={(reason) => { setRows((rs) => rs.map((x) => (x.id === ask.id ? { ...x, state: 'withdrawing' } : x))); log(`Ghi nhận rút đồng ý — ${reason}`, ask.id); toast('Đã khởi tạo quy trình xóa', 'Khóa Kiosk → xóa ảnh → xóa dữ liệu sinh trắc → gửi biên bản (tối đa 72 giờ).', 'success'); setAsk(null); }}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Hệ thống sẽ tự chạy 4 bước xóa dữ liệu và cấp phương án thay thế (thẻ RFID + PIN). Không thể từ chối quyền này.</div>
      </ConfirmReason>
    </div>
  );
}
