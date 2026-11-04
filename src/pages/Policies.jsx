import { useState } from 'react';
import { Icon, Chip, PageHeader, Modal, Select, ConfirmReason } from '../components/ui';
import { useApp } from '../store';
import { RULES } from '../data/mock';

const GROUPS = ['Sinh viên lớp học phần', 'Giảng viên phụ trách môn', 'Danh sách Blacklist', 'Không có quyền', 'Cán bộ hành chính', 'Khách tham quan'];
const SPACES = ['Phòng học (Tòa C)', 'Phòng Server A501', 'Cổng & Sảnh (Public)', 'KTX Tòa B', 'Phòng LAB 402'];
const TIMES = ['Theo TKB — ±15 phút', '24/7', 'Giờ hành chính (07:30–17:00)', '06:00–21:00'];
const ACTIONS = ['Ghi PRESENT / LATE', 'Còi tại chỗ + Push SOC (≤2s)', 'Ghi Immutable Audit Log', 'ISAPI Start/Stop NVR', 'Cho phép mở cửa'];

export default function Policies() {
  const { log, toast } = useApp();
  const [rules, setRules] = useState(RULES);
  const [editor, setEditor] = useState(false);
  const [form, setForm] = useState({ name: '', group: GROUPS[0], space: SPACES[0], time: TIMES[0], action: ACTIONS[0] });
  const [dry, setDry] = useState(null);
  const [toggleAsk, setToggleAsk] = useState(null);

  const runDry = () => {
    const rt = form.action.includes('SOC');
    setDry({ events: rt ? 4 : 1840, matched: rt ? 2 : 1712, conflicts: form.space.includes('Server') && form.action.includes('mở cửa') ? 1 : 0, rt });
  };
  const save = (live) => {
    const r = { id: `R-${String(rules.length + 1).padStart(3, '0')}`, ...form, name: form.name || 'Rule mới', type: form.action.includes('SOC') ? 'realtime' : 'audit', enabled: live, hits: 0 };
    setRules((rs) => [...rs, r]);
    log(`${live ? 'Áp dụng' : 'Lưu Dry-Run'} rule ${r.id}: ${r.name}`, r.id);
    toast(live ? 'Đã áp dụng rule' : 'Đã lưu ở chế độ Dry-Run', `${r.id} • ${r.name}`, 'success');
    setEditor(false); setDry(null); setForm({ name: '', group: GROUPS[0], space: SPACES[0], time: TIMES[0], action: ACTIONS[0] });
  };

  return (
    <div>
      <PageHeader icon="policy" title="Rule & Chính sách" desc="Middleware Policy Engine (PDP) • Đối tượng + Không gian + Thời gian → Hành động. Giao diện hóa 100%, không cấu hình cứng trong code."
        actions={<button className="btn-primary" onClick={() => setEditor(true)}><Icon name="add" />Tạo rule</button>} />

      <div className="grid grid-cols-2 gap-space-md mb-space-md">
        <div className="card p-space-md border-l-4 border-l-status-rejected"><div className="flex items-center gap-2 text-label-md font-semibold"><Icon name="bolt" className="text-status-rejected" />Real-time Triggers (≤ 2 giây)</div><p className="text-caption text-text-secondary mt-1">Blacklist tại cổng/sảnh; người lạ/không có quyền tại Restricted Zone → còi tại chỗ + push SOC.</p></div>
        <div className="card p-space-md border-l-4 border-l-primary-container"><div className="flex items-center gap-2 text-label-md font-semibold"><Icon name="menu_book" className="text-primary-container" />Read-only / Audit Logs</div><p className="text-caption text-text-secondary mt-1">Điểm danh PRESENT/LATE, nhật ký ra vào phòng làm việc, heatmap mật độ — phục vụ thống kê & thanh tra.</p></div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-bright"><tr className="h-10 text-[12px] uppercase tracking-wider text-text-secondary">
            {['ID', 'Tên rule', 'Đối tượng', 'Không gian', 'Thời gian', 'Hành động', 'Loại', 'Lượt khớp (30 ngày)', 'Bật'].map((h) => <th key={h} className="px-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="h-12 border-t border-border-subtle/60 hover:bg-surface-container-low">
                <td className="px-3 font-mono text-caption whitespace-nowrap">{r.id}</td>
                <td className="px-3 font-medium">{r.name}</td>
                <td className="px-3">{r.group}</td>
                <td className="px-3">{r.space}</td>
                <td className="px-3 whitespace-nowrap">{r.time}</td>
                <td className="px-3 text-caption">{r.action}</td>
                <td className="px-3">{r.type === 'realtime' ? <Chip color="status-rejected" icon="bolt">Real-time</Chip> : <Chip color="primary">Audit</Chip>}</td>
                <td className="px-3 tabular-nums">{r.hits.toLocaleString('vi-VN')}</td>
                <td className="px-3">
                  <button role="switch" aria-checked={r.enabled} aria-label={`${r.enabled ? 'Tắt' : 'Bật'} rule ${r.id}: ${r.name}`} onClick={() => setToggleAsk(r)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${r.enabled ? 'bg-status-active' : 'bg-border-strong'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editor} onClose={() => { setEditor(false); setDry(null); }} width="max-w-2xl">
        <div className="p-space-md border-b border-border-subtle flex items-center justify-between"><h3 className="text-headline-md">Tạo rule mới</h3><button className="p-1 text-text-secondary" onClick={() => { setEditor(false); setDry(null); }}><Icon name="close" size={20} /></button></div>
        <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
          <label className="flex flex-col gap-1 text-label-md font-semibold">Tên rule<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Ra vào Phòng LAB 402 ngoài giờ" /></label>
          <div className="flex items-stretch gap-2">
            {[['group', 'Nhóm đối tượng', GROUPS, 'groups'], ['space', 'Phòng / Zone', SPACES, 'meeting_room'], ['time', 'Khung thời gian', TIMES, 'schedule'], ['action', 'Hành động', ACTIONS, 'bolt']].map(([k, l, opts, ic], i) => (
              <div key={k} className="flex items-center gap-2 flex-1">
                <label className="flex-1 min-w-0 self-stretch flex flex-col gap-1">
                  <span className="text-caption text-text-secondary flex items-center gap-1"><Icon name={ic} size={14} />{l}</span>
                  <Select wrap className="flex-1" label={l} value={form[k]} options={opts} onChange={(v) => { setForm({ ...form, [k]: v }); setDry(null); }} />
                </label>
                {i < 3 && <Icon name="arrow_forward" className="text-status-inactive" />}
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-dashed border-border-strong">
            <div className="flex items-center justify-between"><div className="text-label-md font-semibold flex items-center gap-1.5"><Icon name="science" className="text-ai-border" />Dry-Run (chạy thử ngầm trên 24h dữ liệu)</div><button className="btn-ghost" onClick={runDry}><Icon name="play_arrow" />Chạy thử</button></div>
            {dry && (
              <div className="grid grid-cols-3 gap-2 mt-3 anim-fade">
                <div className="p-2 rounded bg-surface-bright"><div className="text-caption text-text-secondary">Sự kiện đầu vào</div><div className="font-semibold tabular-nums">{dry.events.toLocaleString('vi-VN')}</div></div>
                <div className="p-2 rounded bg-surface-bright"><div className="text-caption text-text-secondary">Sẽ kích hoạt</div><div className="font-semibold tabular-nums">{dry.matched.toLocaleString('vi-VN')}</div></div>
                <div className={`p-2 rounded ${dry.conflicts ? 'bg-status-rejected/10' : 'bg-surface-bright'}`}><div className="text-caption text-text-secondary">Xung đột rule</div><div className={`font-semibold ${dry.conflicts ? 'text-status-rejected' : 'text-status-active'}`}>{dry.conflicts ? `${dry.conflicts} — xung đột R-004` : 'Không có'}</div></div>
              </div>
            )}
          </div>
        </div>
        <div className="p-space-md bg-surface-bright border-t border-border-subtle flex justify-end gap-2">
          <button className="btn-outline" onClick={() => save(false)}>Lưu ở chế độ Dry-Run</button>
          <button className="btn-primary disabled:opacity-40" disabled={!dry || dry.conflicts > 0} title={!dry ? 'Cần chạy Dry-Run trước' : ''} onClick={() => save(true)}><Icon name="check" />Áp dụng thật</button>
        </div>
      </Modal>

      <ConfirmReason open={!!toggleAsk} onClose={() => setToggleAsk(null)} danger={toggleAsk?.enabled} title={`${toggleAsk?.enabled ? 'Tắt' : 'Bật'} rule ${toggleAsk?.id}`} subtitle={toggleAsk?.name} confirmLabel={toggleAsk?.enabled ? 'Xác nhận tắt' : 'Xác nhận bật'}
        onConfirm={(reason) => { const r = toggleAsk; setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x))); log(`${r.enabled ? 'Tắt' : 'Bật'} rule ${r.id} — ${reason}`, r.id); toast(`Đã ${r.enabled ? 'tắt' : 'bật'} rule`, `${r.id} • ${r.name}`, r.enabled ? 'warn' : 'success'); setToggleAsk(null); }}>
        {toggleAsk?.enabled && toggleAsk.type === 'realtime' && <div className="p-3 rounded-lg bg-status-rejected/10 text-status-rejected text-body-sm">Đây là cảnh báo an ninh thời gian thực. Khi tắt, hệ thống sẽ không còi và không báo SOC cho tình huống này.</div>}
      </ConfirmReason>
    </div>
  );
}
