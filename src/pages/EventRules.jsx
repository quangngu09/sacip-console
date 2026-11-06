import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, ConfirmReason, DataBoundary, Icon, Chip, Empty, Modal, Select, SortTh, Tabs, useSort } from '../components/ui';
import { useApp } from '../store';
import { RULES } from '../data/mock';
import { ALERT_KIND, ALERT_POLICIES, PURPOSES, alertPolicyOf, purposeOf, purposeReady } from '../data/attendance';
import { fmtNumber } from '../lib/format';

const SORTERS = { name: (r) => r.name, group: (r) => r.group, purpose: (r) => r.purpose, mode: (r) => r.mode, hits: (r) => r.hits };
const MODE = {
  active: ['status-active', 'Đang chạy', 'play_circle'],
  shadow: ['secondary', 'Chạy bóng', 'visibility'],
  off: ['status-inactive', 'Tắt', 'pause_circle'],
};
const TYPE_HINT = {
  all: 'Mỗi quy tắc gồm: đối tượng + không gian + thời gian → hành động, gắn một mục đích xử lý và một chính sách cảnh báo.',
  realtime: 'An ninh: phản ứng trong 2 giây, gửi bảo vệ của zone. "Người lạ" và "có hồ sơ nhưng không có quyền" là hai quy tắc riêng vì ngưỡng và cách xác minh khác nhau.',
  audit: 'Học vụ và vận hành: chỉ ghi nhận, chốt cuối tiết, không phát còi và không bao giờ gửi bảo vệ.',
  shadow: 'Chạy bóng: quy tắc đọc dữ liệu thật và ghi kết quả vào bảng riêng để so sánh, không phát cảnh báo, không đẩy về EMS.',
};

/** Thư viện mẫu. sentence: chuỗi chữ và tên ô cần điền. */
const TEMPLATES = [
  {
    key: 'stranger', group: 'Không khớp hồ sơ nào', icon: 'person_alert', name: 'Người lạ vào khu vực hạn chế', type: 'realtime', purpose: 'P-SECURITY', alert: 'AP-SEC-WARN',
    desc: 'Không khớp hồ sơ nào sau một khoảng theo dõi đủ dài. Gồm cả người chưa thu thập hoặc chưa đồng ý, nên cần bảo vệ xác nhận.',
    fields: { zone: ['Khu Hạn chế và Cấm', 'Chỉ khu Cấm', 'Phòng Server A501', 'Phòng thí nghiệm C202'], secs: ['3', '5', '10'], frames: ['3', '5'], act: ['báo bảo vệ zone kèm ảnh để xác nhận', 'phát còi ngay và báo bảo vệ'] },
    defaults: { zone: 'Khu Hạn chế và Cấm', secs: '3', frames: '3', act: 'báo bảo vệ zone kèm ảnh để xác nhận' },
    sentence: ['Khi một người', 'không khớp hồ sơ nào', 'xuất hiện tại', 'zone', 'liên tục ít nhất', 'secs', 'giây và', 'frames', 'khung hình đủ chất lượng, thì', 'act', '.'],
  },
  {
    key: 'noaccess', group: 'Có hồ sơ, không có quyền ra vào', icon: 'no_accounts', name: 'Có hồ sơ nhưng không có quyền vào', type: 'realtime', purpose: 'P-ACCESS', alert: 'AP-SEC-CRIT',
    desc: 'Chỉ phát khi nhận diện chắc chắn. Trước khi báo, kiểm tra quyền đang chờ duyệt để tránh báo nhầm do Nhân sự đồng bộ trễ.',
    fields: { zone: ['Khu Hạn chế và Cấm', 'Phòng Server A501', 'Phòng thí nghiệm C202'], frames: ['2', '3'], act: ['phát còi tại chỗ và báo bảo vệ + đơn vị quản lý zone', 'chỉ báo bảo vệ + đơn vị quản lý zone'] },
    defaults: { zone: 'Khu Hạn chế và Cấm', frames: '2', act: 'phát còi tại chỗ và báo bảo vệ + đơn vị quản lý zone' },
    sentence: ['Khi một người', 'được nhận diện chắc chắn', 'trong', 'frames', 'khung hình tại', 'zone', 'mà không có quyền ra vào hiệu lực, thì', 'act', '.'],
  },
  {
    key: 'midabsent', group: 'Sinh viên của lớp học phần', icon: 'directions_walk', name: 'Sinh viên rời lớp quá lâu', type: 'audit', purpose: 'P-ATT-CONT', alert: 'AP-ACAD-REPEAT',
    desc: 'Kết luận cuối tiết, không cảnh báo tức thời. Đi vệ sinh, nghe điện thoại dưới ngưỡng thì bỏ qua. Cần camera cửa để kết luận chắc chắn.',
    fields: { who: ['sinh viên của lớp học phần'], share: ['1/3 tiết', '1/2 tiết'], when: ['giờ tiết học, trừ giải lao và khoảng có phép'], act: ['ghi "Vắng giữa giờ" khi chốt tiết', 'chỉ ghi vào báo cáo'] },
    defaults: { who: 'sinh viên của lớp học phần', share: '1/3 tiết', when: 'giờ tiết học, trừ giải lao và khoảng có phép', act: 'ghi "Vắng giữa giờ" khi chốt tiết' },
    sentence: ['Khi', 'who', 'rời phòng của tiết với tổng thời gian vượt', 'share', 'trong', 'when', ', thì', 'act', '.'],
  },
  {
    key: 'teacher', group: 'Giảng viên phụ trách tiết', icon: 'co_present', name: 'Giảng viên chưa vào lớp', type: 'audit', purpose: 'P-LECTURER', alert: 'AP-TEACH',
    desc: 'Chỉ tạo danh sách ngoại lệ để GV giải trình trước, rồi mới tới Trưởng khoa. Không cảnh báo thời gian thực, không tự thành vi phạm.',
    fields: { mins: ['15', '20', '30'], act: ['đưa vào danh sách ngoại lệ chờ GV giải trình'] },
    defaults: { mins: '15', act: 'đưa vào danh sách ngoại lệ chờ GV giải trình' },
    sentence: ['Khi', 'giảng viên phụ trách', 'chưa được thấy tại phòng của tiết sau', 'mins', 'phút kể từ giờ bắt đầu, và không có đơn nghỉ / dạy bù, thì', 'act', '.'],
  },
];
const FIELD_LABEL = { zone: 'Khu vực', secs: 'Số giây', frames: 'Số khung hình', act: 'Hành động', who: 'Đối tượng', share: 'Ngưỡng', when: 'Khung giờ', mins: 'Số phút' };

/** Quy tắc sự kiện. Hiển thị như một tab của trang Chính sách & quy tắc. */
export default function EventRules() {
  const { log, toast, can } = useApp();
  const [rules, setRules] = useState(RULES);
  const [type, setType] = useState('all');
  const [editor, setEditor] = useState(false);
  const [modeAsk, setModeAsk] = useState(null);
  const rows = rules.filter((r) => type === 'all' || (type === 'shadow' ? r.mode === 'shadow' : r.type === type));
  const table = useSort(rows, SORTERS);
  const pendingCount = rules.filter((r) => r.pending).length;

  const approve = (r) => {
    setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, mode: 'active', pending: false } : x)));
    log(`Người thứ hai duyệt bật quy tắc ${r.id}`, r.id);
    toast('Đã duyệt bật quy tắc', `${r.id} • ${r.name}`, 'success');
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-space-sm">
        <p className="text-body-sm text-text-secondary">Việc hệ thống tự làm khi nhận diện được một đối tượng tại một không gian, trong một khung giờ. Người nhận và kênh gửi cấu hình ở tab <Link className="text-primary-container hover:underline" to="/chinh-sach?tab=alerts">Nhận cảnh báo</Link>.</p>
        <button className="btn-primary" disabled={!can('policy_write')} title={can('policy_write') ? undefined : 'Chỉ Quản trị hệ thống được tạo quy tắc'} onClick={() => setEditor(true)}><Icon name="add" />Tạo quy tắc từ mẫu</button>
      </div>

      {pendingCount > 0 && (
        <Banner className="mb-space-sm" tone="warn" icon="group" title={`${pendingCount} quy tắc chờ người thứ hai duyệt bật.`}>
          Bật một quy tắc cần 2 người: người soạn và Kiểm toán viên / người phụ trách bảo vệ dữ liệu. {can('audit') ? 'Bạn có thể duyệt ở cột Thao tác.' : 'Đổi sang vai trò Kiểm toán viên trưởng để duyệt.'}
        </Banner>
      )}

      <DataBoundary name="rules" label="danh sách quy tắc" scopeNote="global">
      <div className="card overflow-hidden">
        <Tabs label="Loại quy tắc" className="px-2 border-b border-border-subtle" value={type} onChange={setType} items={[
          { key: 'all', label: 'Tất cả', count: rules.length },
          { key: 'realtime', label: 'An ninh tức thời', count: rules.filter((r) => r.type === 'realtime').length },
          { key: 'audit', label: 'Ghi nhận học vụ / vận hành', count: rules.filter((r) => r.type === 'audit').length },
          { key: 'shadow', label: 'Đang chạy bóng', count: rules.filter((r) => r.mode === 'shadow').length },
        ]} />
        <p className="px-space-md py-2 text-caption text-text-secondary border-b border-border-subtle">{TYPE_HINT[type]}</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><SortTh k="name" table={table}>Quy tắc</SortTh><SortTh k="group" table={table}>Áp dụng cho</SortTh><th>Hành động</th><SortTh k="purpose" table={table}>Mục đích xử lý • nhận cảnh báo</SortTh><SortTh k="mode" table={table}>Chế độ</SortTh><SortTh k="hits" table={table}>Khớp 30 ngày</SortTh><th>Thao tác</th></tr></thead>
            <tbody>
              {table.sorted.map((r) => {
                const p = purposeOf(r.purpose);
                const ap = alertPolicyOf(r.alert);
                return (
                  <tr key={r.id} className="hover:bg-surface-container-low align-top">
                    <td className="min-w-[220px] py-3">
                      <div className="flex items-center gap-1.5 font-medium">{r.type === 'realtime' && <Icon name="bolt" size={16} className="text-status-rejected" />}{r.name}</div>
                      <div className="text-caption font-mono text-text-secondary">{r.id}</div>
                      {r.needs && <div className="mt-1 text-caption text-status-pending flex items-start gap-1"><Icon name="info" size={14} className="mt-0.5" />{r.needs}</div>}
                    </td>
                    <td className="min-w-[170px] py-3"><div>{r.group}</div><div className="text-caption text-text-secondary">{r.space} • {r.time}</div></td>
                    <td className="min-w-[200px] py-3">{r.action}{r.params && <div><Link to="/thoi-khoa-bieu?view=params" className="text-caption text-primary-container hover:underline">Theo Tham số điểm danh</Link></div>}</td>
                    <td className="min-w-[220px] py-3">
                      <div className="text-body-sm">{p?.name}</div>
                      {p && (p.status === 'active' ? <Chip color="status-active" icon="verified">{p.terms === 'Không cần' ? 'Không cần đồng ý' : `Có đồng ý ${p.terms}`}</Chip> : <Chip color="status-pending" icon="pending">Chờ {p.terms}</Chip>)}
                      <div className="mt-1.5 text-caption">{ap ? <Link to="/chinh-sach?tab=alerts" className="hover:underline text-text-secondary"><span className="flex items-start gap-1"><Icon name={ALERT_KIND[ap.kind][0]} size={14} className="mt-0.5" />{ap.name}</span></Link> : <span className="text-text-secondary">Không gửi cảnh báo</span>}</div>
                    </td>
                    <td className="whitespace-nowrap py-3"><Chip color={MODE[r.mode][0]} icon={MODE[r.mode][2]}>{MODE[r.mode][1]}</Chip>{r.pending && <div className="mt-1"><Chip color="status-pending" icon="group">Chờ duyệt bật</Chip></div>}</td>
                    <td className="tabular-nums whitespace-nowrap py-3">{fmtNumber(r.hits)}</td>
                    <td className="py-3 whitespace-nowrap">
                      {r.pending && can('audit')
                        ? <button className="btn-primary btn-sm" onClick={() => approve(r)}><Icon name="how_to_reg" size={16} />Duyệt bật</button>
                        : <button className="btn-outline btn-sm" disabled={!can('policy_write')} onClick={() => setModeAsk({ rule: r, mode: r.mode })}>Đổi chế độ</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty title="Chưa có quy tắc" />}
        </div>
      </div>
      </DataBoundary>

      <RuleEditor open={editor} onClose={() => setEditor(false)} nextId={`R-${String(rules.length + 1).padStart(3, '0')}`}
        onSave={(r) => { setRules((rs) => [...rs, r]); log(`${r.pending ? 'Gửi duyệt bật' : 'Lưu chạy bóng'} quy tắc ${r.id}: ${r.name}`, r.id); toast(r.pending ? 'Đã gửi duyệt bật' : 'Đã lưu ở chế độ chạy bóng', `${r.id} • ${r.name}`, 'success'); setEditor(false); }} />

      <ConfirmReason open={!!modeAsk} onClose={() => setModeAsk(null)} danger={modeAsk?.rule.mode === 'active' && modeAsk?.mode !== 'active'} title={`Đổi chế độ quy tắc ${modeAsk?.rule.id}`} subtitle={modeAsk?.rule.name}
        confirmLabel={modeAsk?.mode === 'active' ? 'Gửi duyệt bật' : 'Xác nhận'}
        onConfirm={(reason) => {
          const { rule: r, mode } = modeAsk;
          const toActive = mode === 'active' && r.mode !== 'active';
          setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, mode: toActive ? x.mode : mode, pending: toActive } : x)));
          log(`${toActive ? 'Gửi duyệt bật' : `Đổi chế độ sang ${MODE[mode][1]}`} quy tắc ${r.id}: ${reason}`, r.id);
          toast(toActive ? 'Đã gửi duyệt bật' : 'Đã đổi chế độ', `${r.id} • ${toActive ? 'chờ người thứ hai duyệt' : MODE[mode][1]}`, 'success');
          setModeAsk(null);
        }}>
        {modeAsk && (
          <div className="flex flex-col gap-2">
            <div role="radiogroup" aria-label="Chế độ" className="flex gap-2">
              {Object.entries(MODE).map(([k, m]) => {
                const blocked = k === 'active' && !purposeReady(modeAsk.rule.purpose);
                return (
                  <button key={k} type="button" role="radio" aria-checked={modeAsk.mode === k} disabled={blocked} onClick={() => setModeAsk({ ...modeAsk, mode: k })}
                    className={`flex-1 min-h-[40px] px-3 rounded border text-body-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${modeAsk.mode === k ? 'border-primary-container bg-primary-fixed text-primary-container font-medium' : 'border-border-control hover:bg-surface-container-low'}`}>
                    <Icon name={modeAsk.mode === k ? 'radio_button_checked' : 'radio_button_unchecked'} size={18} />{m[1]}
                  </button>
                );
              })}
            </div>
            {!purposeReady(modeAsk.rule.purpose) && <Banner tone="warn">Mục đích "{purposeOf(modeAsk.rule.purpose)?.name}" chưa có đồng ý hợp lệ, nên chỉ được chạy bóng hoặc tắt.</Banner>}
            {modeAsk.mode === 'active' && modeAsk.rule.mode !== 'active' && <Banner>Bật thật cần người thứ hai (Kiểm toán viên / người phụ trách bảo vệ dữ liệu) duyệt.</Banner>}
            {modeAsk.rule.mode === 'active' && modeAsk.rule.type === 'realtime' && modeAsk.mode !== 'active' && <Banner tone="danger">Đây là cảnh báo an ninh thời gian thực. Khi tắt, hệ thống sẽ không còi và không báo an ninh cho tình huống này.</Banner>}
          </div>
        )}
      </ConfirmReason>
    </div>
  );
}

function RuleEditor({ open, onClose, onSave, nextId }) {
  const [tpl, setTpl] = useState(null);
  const [vals, setVals] = useState({});
  const [purpose, setPurpose] = useState('');
  const [alert, setAlert] = useState('');
  const [dry, setDry] = useState(null);
  const close = () => { setTpl(null); setDry(null); onClose(); };
  const pick = (t) => { setTpl(t); setVals(t.defaults); setPurpose(t.purpose); setAlert(t.alert); setDry(null); };
  const set = (k, v) => { setVals((s) => ({ ...s, [k]: v })); setDry(null); };

  const ap = alertPolicyOf(alert);
  const checks = tpl ? [
    { ok: !!purpose, label: 'Đã chọn mục đích xử lý' },
    { ok: purposeReady(purpose), warn: true, label: purposeReady(purpose) ? 'Mục đích đã có đồng ý hợp lệ' : 'Mục đích chưa có đồng ý: chỉ được lưu chạy bóng' },
    { ok: !(tpl.type === 'audit' && ap?.kind === 'security'), label: tpl.type === 'audit' && ap?.kind === 'security' ? 'Sự kiện học vụ không được gửi bảo vệ' : 'Người nhận phù hợp với loại sự kiện' },
    { ok: true, label: tpl.type === 'audit' ? 'Người không dùng Face ID được điểm danh bằng QR / RFID, không bị tính vắng' : 'Có biển báo tại khu vực áp dụng' },
  ] : [];
  const blocking = checks.some((c) => !c.ok && !c.warn);
  const canActivate = dry && !blocking && purposeReady(purpose);
  const alertOptions = ALERT_POLICIES.filter((a) => (tpl?.type === 'realtime' ? a.kind === 'security' : a.kind !== 'security')).map((a) => ({ value: a.id, label: a.name }));

  const runDry = () => setDry(tpl.type === 'realtime'
    ? { matches: tpl.key === 'stranger' ? 9 : 2, people: tpl.key === 'stranger' ? 7 : 2, perDay: tpl.key === 'stranger' ? 1.3 : 0.3, extra: tpl.key === 'stranger' ? '5/7 người là người chưa thu thập Face ID' : 'Cả 2 có quyền đang chờ duyệt' }
    : { matches: tpl.key === 'midabsent' ? 412 : 23, people: tpl.key === 'midabsent' ? 37 : 9, perDay: tpl.key === 'midabsent' ? 59 : 3.3, extra: tpl.key === 'midabsent' ? '9 lớp; 61% kết quả là suy đoán vì phòng chưa có camera cửa' : '4 trường hợp có đơn công tác chưa đồng bộ' });

  const save = (live) => onSave({
    id: nextId, name: tpl.name, group: tpl.group, space: vals.zone || 'Phòng của tiết học', time: tpl.type === 'realtime' ? '24/7' : 'Theo lịch học',
    action: vals.act, type: tpl.type, purpose, alert, mode: 'shadow', pending: live, hits: 0,
  });

  return (
    <Modal open={open} onClose={close} width="max-w-3xl">
      <div className="p-space-md border-b border-border-subtle flex items-center justify-between">
        <div><h3 className="text-k-title-md">{tpl ? tpl.name : 'Chọn mẫu quy tắc'}</h3><p className="text-caption text-text-secondary">{tpl ? 'Điền các ô trong câu. Chạy bóng trên 7 ngày dữ liệu trước khi gửi duyệt bật.' : 'Chỉ Quản trị hệ thống được tạo quy tắc từ trang trắng; cán bộ nghiệp vụ bắt đầu từ mẫu.'}</p></div>
        <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container" onClick={close}><Icon name="close" size={20} /></button>
      </div>

      {!tpl ? (
        <div className="p-space-md grid grid-cols-2 gap-space-sm overflow-y-auto">
          {TEMPLATES.map((t) => (
            <button key={t.key} onClick={() => pick(t)} className="text-left p-3 rounded-lg border border-border-subtle hover:border-primary-container hover:bg-primary-fixed/40 flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-label-md font-semibold"><Icon name={t.icon} size={20} className="text-primary-container" />{t.name}</span>
              <span className="text-caption text-text-secondary">{t.desc}</span>
              <span className="flex gap-1.5 mt-auto">{t.type === 'realtime' ? <Chip color="status-rejected" icon="bolt">An ninh tức thời</Chip> : <Chip color="primary">Ghi nhận</Chip>}{!purposeReady(t.purpose) && <Chip color="status-pending">Chờ điều khoản v1.3</Chip>}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
          <section aria-label="Nội dung quy tắc" className="p-3 rounded-lg bg-surface-bright text-body-md leading-[2.4]">
            {tpl.sentence.map((part, i) => (tpl.fields[part]
              ? <span key={i} className="inline-block align-middle mx-1"><Select className="!h-8 !min-h-0 !w-auto font-semibold text-primary-container" label={FIELD_LABEL[part]} value={vals[part]} options={tpl.fields[part]} onChange={(v) => set(part, v)} /></span>
              : <span key={i}>{part} </span>))}
          </section>

          <div className="grid grid-cols-2 gap-space-md">
            <label className="flex flex-col gap-1 text-label-md font-semibold">Mục đích xử lý (bắt buộc)
              <Select wrap label="Mục đích xử lý" value={purpose} options={PURPOSES.map((p) => ({ value: p.id, label: `${p.name}${p.status === 'active' ? '' : ' (chờ đồng ý)'}` }))} onChange={(v) => { setPurpose(v); setDry(null); }} />
            </label>
            <label className="flex flex-col gap-1 text-label-md font-semibold">Chính sách cảnh báo
              <Select wrap label="Chính sách cảnh báo" value={alert} options={alertOptions} onChange={(v) => { setAlert(v); setDry(null); }} />
              {ap && <span className="text-caption font-normal text-text-secondary">Gửi: {ap.recipients.join(', ')} • {ap.channels.join(', ')}</span>}
            </label>
          </div>

          <section aria-label="Kiểm tra tuân thủ">
            <h4 className="text-label-md font-semibold mb-1">Kiểm tra tuân thủ</h4>
            <ul className="flex flex-col gap-1 text-body-sm">
              {checks.map((c) => <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? 'text-status-active' : c.warn ? 'text-status-pending' : 'text-status-rejected'}`}><Icon name={c.ok ? 'check_circle' : c.warn ? 'warning' : 'block'} size={16} />{c.label}</li>)}
            </ul>
          </section>

          <section className="p-3 rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between gap-3"><div><h4 className="text-label-md font-semibold">Chạy bóng trên 7 ngày gần nhất</h4><p className="text-caption text-text-secondary">Đọc lại sự kiện đã lưu, không phát cảnh báo, không tác động thật.</p></div><button className="btn-outline" disabled={blocking} onClick={runDry}><Icon name="play_arrow" />Chạy bóng</button></div>
            {dry && (
              <div className="anim-fade mt-3">
                <dl className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Sẽ khớp</dt><dd className="font-semibold tabular-nums">{fmtNumber(dry.matches)} lần</dd></div>
                  <div className="p-2 rounded bg-surface-bright"><dt className="text-caption text-text-secondary">Số người</dt><dd className="font-semibold tabular-nums">{fmtNumber(dry.people)}</dd></div>
                  <div className={`p-2 rounded ${dry.perDay > 20 ? 'bg-status-pending/10' : 'bg-surface-bright'}`}><dt className="text-caption text-text-secondary">Trung bình mỗi ngày</dt><dd className="font-semibold tabular-nums">{String(dry.perDay).replace('.', ',')}</dd></div>
                </dl>
                <p className="mt-2 text-caption text-text-secondary">{dry.extra}.{dry.perDay > 20 && ' Số lượng lớn: cân nhắc gộp thành bản tổng hợp thay vì từng thông báo.'}</p>
              </div>
            )}
          </section>
        </div>
      )}

      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between gap-3">
        {tpl ? <button className="btn-outline" onClick={() => { setTpl(null); setDry(null); }}><Icon name="arrow_back" />Chọn mẫu khác</button> : <span />}
        {tpl && (
          <div className="flex items-center gap-2">
            <span className="text-caption text-text-secondary">{!dry ? 'Cần chạy bóng trước.' : !purposeReady(purpose) ? 'Mục đích chưa có đồng ý: chỉ lưu chạy bóng.' : 'Bật thật cần người thứ hai duyệt.'}</span>
            <button className="btn-outline" disabled={!dry || blocking} onClick={() => save(false)}>Lưu chạy bóng</button>
            <button className="btn-primary" disabled={!canActivate} onClick={() => save(true)}><Icon name="group" />Gửi duyệt bật</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
