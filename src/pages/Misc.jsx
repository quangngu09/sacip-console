import { useState } from 'react';
import { Icon, Chip, PageHeader, ConfirmReason } from '../components/ui';
import { useApp } from '../store';
import { CONSENTS } from '../data/mock';

export function AiMonitor() {
  const models = [
    ['SCRFD (phát hiện mặt)', 'Edge Box Jetson Orin NX', '8.2ms', '99.1%'],
    ['ArcFace / InsightFace buffalo_l', 'Edge + Core', '21ms', '98.7%'],
    ['Face Quality Gating v3.2', 'Ingestion API', '6ms', '—'],
    ['Liveness / Anti-Spoofing v3.2', 'Edge + Kiosk', '14ms', '99.4%'],
    ['pgvector HNSW 1:K', 'PostgreSQL Core', '9ms', '—'],
  ];
  return (
    <div>
      <PageHeader icon="smart_toy" title="Giám sát AI" desc="Theo dõi chất lượng mô hình, độ trễ và tỉ lệ từ chối. AI chỉ đưa gợi ý — không có quyền tự động từ chối hay thu hồi." />
      <div className="grid grid-cols-4 gap-space-md mb-space-md">
        {[['Độ trễ 1:K Matching', '38ms', 'Mục tiêu < 50ms', 'speed', 'status-active'], ['Độ chính xác nhận diện', '98.7%', 'Mục tiêu ≥ 98%', 'target', 'status-active'], ['Ảnh bị Quality Gating loại', '6.4%', 'Chủ yếu: chói, nghiêng', 'filter_alt', 'status-pending'], ['Phát hiện giả mạo', '12', '7 ngày qua', 'gpp_bad', 'status-rejected']].map(([l, v, s, i, c]) => (
          <div key={l} className="card p-space-md"><div className="flex justify-between text-caption text-text-secondary">{l}<Icon name={i} className={`text-${c}`} /></div><div className="text-[26px] font-semibold tabular-nums">{v}</div><div className="text-caption text-text-secondary">{s}</div></div>
        ))}
      </div>
      <div className="card overflow-x-auto mb-space-md">
        <table className="data-table">
          <thead><tr>{['Mô hình', 'Vị trí chạy', 'Độ trễ p95', 'Độ chính xác', 'Trạng thái'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{models.map(([m, w, l, a]) => (
            <tr key={m} className="h-12"><td className="px-3 font-medium">{m}</td><td className="px-3">{w}</td><td className="px-3 font-mono">{l}</td><td className="px-3 font-mono">{a}</td><td className="px-3"><Chip color="status-active">Hoạt động</Chip></td></tr>
          ))}</tbody>
        </table>
      </div>
      <div className="card p-space-md">
        <h2 className="text-headline-md mb-2">Nguyên nhân bị loại ở Quality Gating (7 ngày)</h2>
        {[['Chói / phản quang (specular)', 41], ['Góc nghiêng > 20°', 27], ['Thiếu sáng', 14], ['Che khuất (khẩu trang, kính)', 11], ['Nghi giả mạo (ảnh in, màn hình)', 7]].map(([l, v]) => (
          <div key={l} className="flex items-center gap-3 py-1.5 text-body-sm"><span className="w-64">{l}</span><div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${v * 2}%` }} /></div><span className="w-10 text-right tabular-nums">{v}%</span></div>
        ))}
      </div>
    </div>
  );
}

const kindIcon = { view: 'visibility', alert: 'notifications_active', system: 'settings', ai: 'smart_toy', user: 'person', sensitive: 'gpp_maybe' };
const kindLabel = { view: 'Xem hồ sơ', alert: 'Cảnh báo', system: 'Hệ thống', ai: 'AI', user: 'Thao tác cán bộ', sensitive: 'Dữ liệu nhạy cảm' };

export function AuditLog() {
  const { audit, log, toast } = useApp();
  const [f, setF] = useState('all');
  const rows = audit.filter((a) => f === 'all' || a.kind === f);
  return (
    <div>
      <PageHeader icon="receipt_long" title="Nhật ký & Báo cáo" desc="Immutable Audit Log • mọi thao tác nhạy cảm (xem ảnh, phê duyệt, khóa, đổi rule) đều được ghi kèm người thực hiện"
        actions={<button className="btn-outline" onClick={() => { log('Xuất báo cáo thanh tra (không kèm ảnh)', 'Nhật ký & Báo cáo'); toast('Đã xuất báo cáo kiểm toán', 'Báo cáo chỉ gồm metadata, không kèm ảnh khuôn mặt.', 'success'); }}><Icon name="download" />Xuất báo cáo thanh tra</button>} />
      <div className="flex gap-1 mb-space-sm">
        {[['all', 'Tất cả'], ['user', 'Thao tác cán bộ'], ['sensitive', 'Xem dữ liệu nhạy cảm'], ['alert', 'Cảnh báo'], ['ai', 'AI'], ['system', 'Hệ thống']].map(([k, l]) => (
          <button key={k} onClick={() => setF(k)} className={`px-3 py-1 rounded-full text-label-sm ${f === k ? 'bg-primary-container text-white' : 'bg-surface shadow-soft hover:bg-surface-container-low'}`}>{l}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr>{['Thời gian', 'Loại', 'Người / tác nhân', 'Hành động', 'Đối tượng'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((a, i) => (
            <tr key={i} className={`h-11 ${a.kind === 'sensitive' ? 'bg-status-pending/5' : ''}`}>
              <td className="px-3 font-mono text-caption whitespace-nowrap">{a.t}</td>
              <td className="px-3 whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 ${a.kind === 'sensitive' ? 'text-status-pending' : 'text-text-secondary'}`}><Icon name={kindIcon[a.kind]} size={16} />{kindLabel[a.kind]}</span></td>
              <td className="px-3 font-medium">{a.actor}</td>
              <td className="px-3">{a.action}</td>
              <td className="px-3 font-mono text-caption">{a.target}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

const cState = { active: ['status-active', 'Còn hiệu lực'], withdrawing: ['status-pending', 'Đang rút đồng ý'], expired: ['status-inactive', 'Hết hiệu lực'], none: ['status-inactive', 'Chưa ký'] };

export function Consents() {
  const { log, toast } = useApp();
  const [rows, setRows] = useState(CONSENTS);
  const [ask, setAsk] = useState(null);
  return (
    <div>
      <PageHeader icon="verified_user" title="Đồng ý xử lý dữ liệu (NĐ 13/2023)" desc="Quản lý cam kết, mục đích xử lý và quyền rút đồng ý của chủ thể dữ liệu. Rút đồng ý luôn có phương án thay thế phi sinh trắc." />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr>{['Mã đối tượng', 'Họ tên', 'Mục đích xử lý', 'Ngày ký', 'Kênh ký', 'Trạng thái', 'Thao tác'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id} className="h-12 hover:bg-surface-container-low">
              <td className="px-3 font-mono font-semibold">{c.id}</td><td className="px-3">{c.name}</td><td className="px-3">{c.purpose}</td><td className="px-3">{c.signed}</td><td className="px-3 text-caption">{c.channel}</td>
              <td className="px-3"><Chip color={cState[c.state][0]}>{cState[c.state][1]}</Chip></td>
              <td className="px-3 text-right">{c.state === 'active' && <button className="text-primary-container text-label-sm font-medium px-2 py-1 rounded hover:bg-surface-container" onClick={() => setAsk(c)}>Ghi nhận rút đồng ý</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} title="Ghi nhận rút đồng ý" subtitle={ask && `${ask.name} • ${ask.id}`} confirmLabel="Khởi tạo quy trình xóa"
        onConfirm={(reason) => { setRows((rs) => rs.map((x) => (x.id === ask.id ? { ...x, state: 'withdrawing' } : x))); log(`Ghi nhận rút đồng ý — ${reason}`, ask.id); toast('Đã khởi tạo quy trình xóa', 'Khóa Kiosk → xóa ảnh → xóa vector → gửi biên bản (≤72h).', 'success'); setAsk(null); }}>
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Hệ thống sẽ tự chạy 4 bước xóa dữ liệu và cấp phương án thay thế (thẻ RFID + PIN). Không thể từ chối quyền này.</div>
      </ConfirmReason>
    </div>
  );
}
