import { useState } from 'react';
import { Icon, Chip, Empty, PageHeader, Modal, Select, ConfirmReason, Tabs } from '../components/ui';
import { useApp } from '../store';
import { RULES } from '../data/mock';

const GROUPS = ['Sinh viên lớp học phần', 'Giảng viên phụ trách môn', 'Danh sách cấm', 'Không có quyền', 'Cán bộ hành chính', 'Khách tham quan'];
const SPACES = ['Phòng học (Tòa C)', 'Phòng Server A501', 'Cổng & sảnh', 'KTX Tòa B', 'Phòng LAB 402'];
const TIMES = ['Theo lịch học, ±15 phút', '24/7', 'Giờ hành chính (07:30–17:00)', '06:00–21:00'];
const ACTIONS = ['Ghi có mặt / đi muộn', 'Còi tại chỗ + báo an ninh (≤2s)', 'Ghi nhật ký kiểm toán', 'Bật/tắt ghi hình', 'Cho phép mở cửa'];
const BLANK = { name: '', group: GROUPS[0], space: SPACES[0], time: TIMES[0], action: ACTIONS[0] };
const TYPE_HINT = {
  all: 'Mỗi quy tắc gồm: đối tượng + không gian + thời gian → hành động.',
  realtime: 'Phản ứng trong 2 giây: còi tại chỗ và báo an ninh khi có người trong danh sách cấm hoặc người lạ ở khu vực hạn chế.',
  audit: 'Chỉ ghi nhận: điểm danh, nhật ký ra vào, thống kê mật độ, phục vụ báo cáo và thanh tra.',
};

export default function Policies() {
  const { log, toast } = useApp();
  const [rules, setRules] = useState(RULES);
  const [type, setType] = useState('all');
  const [editor, setEditor] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [dry, setDry] = useState(null);
  const [toggleAsk, setToggleAsk] = useState(null);
  const rows = rules.filter((r) => type === 'all' || r.type === type);

  const runDry = () => {
    const rt = form.action.includes('báo an ninh');
    setDry({ events: rt ? 4 : 1840, matched: rt ? 2 : 1712, conflicts: form.space.includes('Server') && form.action.includes('mở cửa') ? 1 : 0, rt });
  };
  const closeEditor = () => { setEditor(false); setDry(null); };
  const save = (live) => {
    const r = { id: `R-${String(rules.length + 1).padStart(3, '0')}`, ...form, name: form.name || 'Quy tắc mới', type: form.action.includes('báo an ninh') ? 'realtime' : 'audit', enabled: live, hits: 0 };
    setRules((rs) => [...rs, r]);
    log(`${live ? 'Áp dụng' : 'Lưu chạy thử'} quy tắc ${r.id}: ${r.name}`, r.id);
    toast(live ? 'Đã áp dụng quy tắc' : 'Đã lưu ở chế độ chạy thử', `${r.id} • ${r.name}`, 'success');
    closeEditor(); setForm(BLANK);
  };

  return (
    <div>
      <PageHeader title="Quy tắc & chính sách" desc="Thiết lập việc hệ thống tự làm khi nhận diện được một đối tượng tại một không gian, trong một khung giờ."
        actions={<button className="btn-primary" onClick={() => setEditor(true)}><Icon name="add" />Tạo quy tắc</button>} />

      <div className="card overflow-hidden">
        <Tabs label="Loại quy tắc" className="px-2 border-b border-border-subtle" value={type} onChange={setType} items={[
          { key: 'all', label: 'Tất cả', count: rules.length },
          { key: 'realtime', label: 'Cảnh báo tức thời', count: rules.filter((r) => r.type === 'realtime').length },
          { key: 'audit', label: 'Ghi nhận', count: rules.filter((r) => r.type === 'audit').length },
        ]} />
        <p className="px-space-md py-2 text-caption text-text-secondary border-b border-border-subtle">{TYPE_HINT[type]}</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>{['Quy tắc', 'Áp dụng cho', 'Hành động', 'Loại', 'Lượt khớp 30 ngày', 'Bật / tắt'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="h-16 hover:bg-surface-container-low">
                  <td className="min-w-[220px]"><div className="font-medium">{r.name}</div><div className="text-caption font-mono text-text-secondary">{r.id}</div></td>
                  <td className="min-w-[220px]"><div>{r.group}</div><div className="text-caption text-text-secondary">{r.space} • {r.time}</div></td>
                  <td>{r.action}</td>
                  <td className="whitespace-nowrap">{r.type === 'realtime' ? <Chip color="status-rejected" icon="bolt">Tức thời</Chip> : <Chip color="primary">Ghi nhận</Chip>}</td>
                  <td className="tabular-nums whitespace-nowrap">{r.hits.toLocaleString('vi-VN')}</td>
                  <td>
                    <button role="switch" aria-checked={r.enabled} aria-label={`${r.enabled ? 'Tắt' : 'Bật'} quy tắc ${r.id}: ${r.name}`} onClick={() => setToggleAsk(r)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${r.enabled ? 'bg-status-active' : 'bg-border-control'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty title="Chưa có quy tắc" />}
        </div>
      </div>

      <Modal open={editor} onClose={closeEditor} width="max-w-2xl">
        <div className="p-space-md border-b border-border-subtle flex items-center justify-between"><h3 className="text-k-title-md">Tạo quy tắc mới</h3><button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={closeEditor}><Icon name="close" size={20} /></button></div>
        <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
          <label className="flex flex-col gap-1 text-label-md font-semibold">Tên quy tắc<input className="input font-normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Ra vào Phòng LAB 402 ngoài giờ" /></label>
          <div className="flex items-stretch gap-2">
            {[['group', 'Nhóm đối tượng', GROUPS, 'groups'], ['space', 'Phòng / khu vực', SPACES, 'meeting_room'], ['time', 'Khung thời gian', TIMES, 'schedule'], ['action', 'Hành động', ACTIONS, 'bolt']].map(([k, l, opts, ic], i) => (
              <div key={k} className="flex items-center gap-2 flex-1">
                <label className="flex-1 min-w-0 self-stretch flex flex-col gap-1">
                  <span className="text-caption text-text-secondary flex items-center gap-1"><Icon name={ic} size={14} />{l}</span>
                  <Select wrap className="flex-1" label={l} value={form[k]} options={opts} onChange={(v) => { setForm({ ...form, [k]: v }); setDry(null); }} />
                </label>
                {i < 3 && <Icon name="arrow_forward" className="text-status-inactive" />}
              </div>
            ))}
          </div>
          <section className="p-3 rounded-lg bg-surface-bright">
            <div className="flex items-center justify-between gap-3"><div><h4 className="text-label-md font-semibold">Chạy thử</h4><p className="text-caption text-text-secondary">Thử trên dữ liệu 24 giờ gần nhất, không tác động thật.</p></div><button className="btn-outline" onClick={runDry}><Icon name="play_arrow" />Chạy thử</button></div>
            {dry && (
              <dl className="grid grid-cols-3 gap-2 mt-3 anim-fade">
                <div className="p-2 rounded bg-surface"><dt className="text-caption text-text-secondary">Sự kiện đầu vào</dt><dd className="font-semibold tabular-nums">{dry.events.toLocaleString('vi-VN')}</dd></div>
                <div className="p-2 rounded bg-surface"><dt className="text-caption text-text-secondary">Sẽ kích hoạt</dt><dd className="font-semibold tabular-nums">{dry.matched.toLocaleString('vi-VN')}</dd></div>
                <div className={`p-2 rounded ${dry.conflicts ? 'bg-status-rejected/10' : 'bg-surface'}`}><dt className="text-caption text-text-secondary">Xung đột quy tắc</dt><dd className={`font-semibold ${dry.conflicts ? 'text-status-rejected' : 'text-status-active'}`}>{dry.conflicts ? `${dry.conflicts}: xung đột R-004` : 'Không có'}</dd></div>
              </dl>
            )}
          </section>
        </div>
        <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between gap-3">
          <span className="text-caption text-text-secondary">{!dry ? 'Cần chạy thử trước khi áp dụng.' : dry.conflicts ? 'Cần xử lý xung đột trước khi áp dụng.' : 'Có thể áp dụng.'}</span>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => save(false)}>Lưu để chạy thử</button>
            <button className="btn-primary" disabled={!dry || dry.conflicts > 0} onClick={() => save(true)}><Icon name="check" />Áp dụng</button>
          </div>
        </div>
      </Modal>

      <ConfirmReason open={!!toggleAsk} onClose={() => setToggleAsk(null)} danger={toggleAsk?.enabled} title={`${toggleAsk?.enabled ? 'Tắt' : 'Bật'} quy tắc ${toggleAsk?.id}`} subtitle={toggleAsk?.name} confirmLabel={toggleAsk?.enabled ? 'Xác nhận tắt' : 'Xác nhận bật'}
        onConfirm={(reason) => { const r = toggleAsk; setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x))); log(`${r.enabled ? 'Tắt' : 'Bật'} quy tắc ${r.id} — ${reason}`, r.id); toast(`Đã ${r.enabled ? 'tắt' : 'bật'} quy tắc`, `${r.id} • ${r.name}`, r.enabled ? 'warn' : 'success'); setToggleAsk(null); }}>
        {toggleAsk?.enabled && toggleAsk.type === 'realtime' && <div className="p-3 rounded-lg bg-status-rejected/10 text-status-rejected text-body-sm">Đây là cảnh báo an ninh thời gian thực. Khi tắt, hệ thống sẽ không còi và không báo an ninh cho tình huống này.</div>}
      </ConfirmReason>
    </div>
  );
}
