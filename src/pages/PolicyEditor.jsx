import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Banner, Chip, ChipToggleGroup, FieldError, Icon, Modal, Select, Switch, SourceBadge } from '../components/ui';
import { useApp } from '../store';
import { dryRunPolicy, savePolicy } from '../api/client';
import { ORG_TREE } from '../api/db';
import { SOURCE, SUBJECT_TYPE, TRIGGER_EVENT, TRIGGER_SHORT, TRIGGER_TARGET } from '../api/enums';
import { SOURCE_ALLOWED, TIME_PRESETS, diffConfig, stepOfError, validateOwnership, validatePolicy } from '../api/policyValidation';
import { SPACE_TREE, DEVICES } from '../data/mock';
import { fmtNumber, fmtRelative } from '../lib/format';
import { APPROVER_ROLES, DAYS, RESCAN_CHANNELS, fieldLabel, valueText } from '../lib/policyText';

const STEPS = [
  { n: 1, title: 'Phạm vi & đối tượng', icon: 'groups' },
  { n: 2, title: 'Không gian & thời gian', icon: 'schedule' },
  { n: 3, title: 'Thông số sinh trắc', icon: 'face' },
  { n: 4, title: 'Phê duyệt & sự kiện', icon: 'account_tree' },
  { n: 5, title: 'Xem lại & lưu', icon: 'fact_check' },
];

const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const set = (obj, path, value) => {
  const c = clone(obj);
  const keys = path.split('.');
  let cur = c;
  keys.slice(0, -1).forEach((k) => { cur = cur[k]; });
  cur[keys[keys.length - 1]] = value;
  return c;
};

const ZONE_TONE = { Public: 'status-active', Operational: 'primary', Restricted: 'status-pending', Forbidden: 'status-rejected' };
const ZONE_LABEL = { Public: 'Công cộng', Operational: 'Vận hành', Restricted: 'Hạn chế', Forbidden: 'Cấm' };

export default function PolicyEditor() {
  const { policyId } = useParams();
  const nav = useNavigate();
  const { data, call, toast, can } = useApp();
  const policy = data.policies.find((p) => p.policy_id === policyId);
  const base = policy && policy.versions.find((v) => v.version === policy.current_version).config;
  const [cfg, setCfg] = useState(() => clone(base));
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState(new Set([1]));
  const [reason, setReason] = useState('');
  const [dry, setDry] = useState(null);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [leaveAsk, setLeaveAsk] = useState(false);

  const errors = useMemo(() => (cfg ? { ...validatePolicy(cfg), ...validateOwnership(cfg, policyId, data.policies), ...serverErrors } : {}), [cfg, policyId, data.policies, serverErrors]);
  const changes = useMemo(() => (cfg ? diffConfig(base, cfg) : []), [base, cfg]);

  if (!policy) return <Banner tone="danger" title="Không tìm thấy chính sách.">Quay lại <Link className="underline" to="/chinh-sach">danh sách chính sách</Link>.</Banner>;
  if (!can('policy_write')) return <Banner tone="warn" icon="lock" title="Bạn không có quyền sửa chính sách.">Chỉ Quản trị hệ thống được sửa. Quay lại <Link className="underline" to="/chinh-sach">danh sách chính sách</Link>.</Banner>;

  const update = (path) => (value) => { setCfg((c) => set(c, path, value)); setDry(null); setServerErrors({}); };
  const stepErrors = (n) => Object.keys(errors).filter((k) => stepOfError(k) === n);
  const err = (key) => (touched.has(stepOfError(key)) ? errors[key] : null);
  const go = (n) => { setTouched((t) => new Set([...t, step, n])); setStep(n); };
  const totalErrors = Object.keys(errors).length;
  const nextVersion = (() => { const [maj, min] = policy.versions[policy.versions.length - 1].version.slice(1).split('.').map(Number); return `v${maj}.${min + 1}`; })();

  const runDry = async () => {
    setBusy(true);
    try { setDry(await call(dryRunPolicy, policyId, cfg)); } catch (e) { toast('Không chạy thử được', e.message, 'error'); }
    setBusy(false);
  };
  const save = async () => {
    setTouched(new Set([1, 2, 3, 4, 5]));
    if (totalErrors) { toast('Cấu hình còn lỗi', 'Sửa các mục đánh dấu đỏ trước khi lưu.', 'error'); return; }
    setBusy(true);
    try {
      const r = await call(savePolicy, policyId, cfg, reason);
      toast(`Đã lưu ${policy.policy_id} ${r.version}`, `${r.changes.length} thay đổi có hiệu lực ngay, không cần triển khai lại hệ thống.`, 'success');
      nav('/chinh-sach');
    } catch (e) {
      if (e.fields) setServerErrors(e.fields);
      toast('Không lưu được', e.message, 'error');
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-caption text-text-secondary"><Link to="/chinh-sach" className="hover:underline">Chính sách & quy tắc</Link><Icon name="chevron_right" size={14} /><span>{policy.policy_id}</span></div>
          <h1 className="text-headline-lg">Sửa chính sách: {policy.name}</h1>
          <p className="text-caption text-text-secondary">Đang sửa từ {policy.current_version}. Khi lưu sẽ tạo {nextVersion}; {policy.current_version} vẫn được giữ trong lịch sử.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-outline" onClick={() => (changes.length ? setLeaveAsk(true) : nav('/chinh-sach'))}>Hủy</button>
          <button className="btn-primary" onClick={() => go(5)} disabled={step === 5}><Icon name="fact_check" />Xem lại & lưu</button>
        </div>
      </div>

      <ol className="card grid grid-cols-5 overflow-hidden" aria-label="Các bước cấu hình">
        {STEPS.map((s) => {
          const bad = s.n < 5 && touched.has(s.n) && stepErrors(s.n).length > 0;
          const on = step === s.n;
          return (
            <li key={s.n} className="border-r border-border-subtle last:border-0">
              <button type="button" onClick={() => go(s.n)} aria-current={on ? 'step' : undefined}
                className={`w-full h-full px-3 py-2.5 flex items-center gap-2.5 text-left -outline-offset-2 ${on ? 'bg-primary-fixed shadow-[inset_0_-3px_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-semibold shrink-0 ${bad ? 'bg-status-rejected text-white' : on ? 'bg-primary-container text-white' : 'bg-surface-container text-text-secondary'}`}>{bad ? <Icon name="priority_high" size={16} /> : s.n}</span>
                <span className="min-w-0">
                  <span className={`block text-label-md ${on ? 'font-semibold text-primary-container' : ''}`}>{s.title}</span>
                  <span className={`block text-caption ${bad ? 'text-status-rejected' : 'text-text-secondary'}`}>{bad ? `${stepErrors(s.n).length} lỗi cần sửa` : s.n === 5 ? `${changes.length} thay đổi` : 'Bước ' + s.n}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="card p-space-lg">
        {step === 1 && <Step1 cfg={cfg} update={update} err={err} policy={policy} />}
        {step === 2 && <Step2 cfg={cfg} update={update} err={err} sources={data.sources} />}
        {step === 3 && <Step3 cfg={cfg} update={update} err={err} />}
        {step === 4 && <Step4 cfg={cfg} update={update} err={err} />}
        {step === 5 && <Step5 cfg={cfg} base={base} policy={policy} changes={changes} errors={errors} reason={reason} setReason={setReason} dry={dry} runDry={runDry} busy={busy} go={go} nextVersion={nextVersion} />}
      </section>

      <div className="flex items-center justify-between">
        <button className="btn-outline" disabled={step === 1} onClick={() => go(step - 1)}><Icon name="arrow_back" />Bước trước</button>
        {step < 5
          ? <button className="btn-primary" onClick={() => go(step + 1)}>Bước tiếp theo<Icon name="arrow_forward" /></button>
          : <button className="btn-primary" disabled={busy || totalErrors > 0 || !changes.length || reason.trim().length < 10} onClick={save}><Icon name="save" />Lưu cấu hình ({nextVersion})</button>}
      </div>

      <Modal open={leaveAsk} onClose={() => setLeaveAsk(false)} width="max-w-md">
        <div className="p-space-md flex flex-col gap-3">
          <h3 className="text-headline-md">Bỏ {changes.length} thay đổi chưa lưu?</h3>
          <p className="text-body-sm text-text-secondary">Chính sách giữ nguyên {policy.current_version}.</p>
          <div className="flex justify-end gap-2"><button className="btn-outline" onClick={() => setLeaveAsk(false)}>Tiếp tục sửa</button><button className="btn-danger" onClick={() => nav('/chinh-sach')}>Bỏ thay đổi</button></div>
        </div>
      </Modal>
    </div>
  );
}

const Section = ({ title, hint, children, error }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-headline-md mb-0.5">{title}</legend>
    {hint && <p className="text-caption text-text-secondary -mt-1">{hint}</p>}
    {children}
    <FieldError msg={error} />
  </fieldset>
);

// ---------- Bước 1 ----------
function OrgTree({ value, onChange, invalid }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : id === 'ALL' ? ['ALL'] : [...value.filter((x) => x !== 'ALL'), id]);
  const render = (nodes, depth, parentOn) => nodes.map((n) => {
    const on = value.includes(n.id);
    const inherited = parentOn && !on;
    return (
      <li key={n.id}>
        <label className={`flex items-center gap-2 h-9 px-2 rounded cursor-pointer hover:bg-surface-container-low ${inherited ? 'text-text-secondary' : ''}`} style={{ paddingLeft: 8 + depth * 20 }}>
          <input type="checkbox" className="w-4 h-4 accent-primary-container" checked={on || inherited} disabled={inherited} onChange={() => toggle(n.id)} />
          <Icon name={n.children ? 'folder' : 'apartment'} size={16} className="text-text-secondary" />
          <span className="text-body-sm">{n.name}</span>
          {inherited && <span className="text-caption">(theo đơn vị cha)</span>}
        </label>
        {n.children && <ul>{render(n.children, depth + 1, parentOn || on)}</ul>}
      </li>
    );
  });
  return <ul className={`max-h-[340px] overflow-y-auto rounded border p-1 ${invalid ? 'border-status-rejected' : 'border-border-control'}`} aria-label="Cây tổ chức">{render(ORG_TREE, 0, false)}</ul>;
}

function Step1({ cfg, update, err, policy }) {
  return (
    <div className="grid grid-cols-2 gap-space-xl">
      <div className="flex flex-col gap-space-lg">
        <Section title="Đơn vị vận hành" hint="Tenant sở hữu chính sách này.">
          <Select label="Đơn vị vận hành" value={cfg.scope.tenant} options={['Đại học Đại Nam', 'Ký túc xá Đại Nam']} onChange={update('scope.tenant')} />
        </Section>
        <Section title="Loại đối tượng áp dụng" hint="Mỗi loại chỉ thuộc một chính sách, để chính sách của sinh viên không áp nhầm sang nhà thầu." error={err('scope.subject_types')}>
          <ChipToggleGroup label="Loại đối tượng" invalid={!!err('scope.subject_types')} value={cfg.scope.subject_types} onChange={update('scope.subject_types')}
            options={Object.entries(SUBJECT_TYPE).map(([value, m]) => ({ value, label: m.label, icon: m.icon }))} />
          <p className="text-caption text-text-secondary">Chính sách này được tạo cho: <b>{SUBJECT_TYPE[policy.target_subject_type].label}</b>.</p>
        </Section>
      </div>
      <Section title="Phân vùng tổ chức" hint="Chọn toàn trường hoặc từng khoa, phòng. Chọn đơn vị cha là áp dụng cho mọi đơn vị con." error={err('scope.org_units')}>
        <OrgTree value={cfg.scope.org_units} onChange={update('scope.org_units')} invalid={!!err('scope.org_units')} />
      </Section>
    </div>
  );
}

// ---------- Bước 2 ----------
function Step2({ cfg, update, err, sources }) {
  const zones = cfg.spatial.zones;
  const tw = cfg.spatial.time_window;
  const toggleZone = (id) => update('spatial.zones')(zones.includes(id) ? zones.filter((z) => z !== id) : [...zones, id]);
  const picked = SPACE_TREE.flatMap((b) => b.children.flatMap((f) => f.children)).filter((r) => zones.includes(r.id));
  const devices = picked.flatMap((r) => r.devices.map((id) => ({ ...DEVICES.find((d) => d.id === id), room: r.id }))).filter((d) => d.id);
  const src = { TIMETABLE: sources.find((s) => s.id === 'EMS'), SHIFT: sources.find((s) => s.id === 'TIMEKEEPING') }[tw.preset];
  const needsRange = ['CUSTOM', 'OFFICE'].includes(tw.preset);
  const setTw = (k) => (v) => update('spatial.time_window')({ ...tw, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-space-xl">
      <Section title="Khu vực kiểm soát" hint="Chỉ khu vực đã duyệt hạ tầng mới nhận dữ liệu khuôn mặt." error={err('spatial.zones')}>
        <div className={`max-h-[300px] overflow-y-auto rounded border p-1 ${err('spatial.zones') ? 'border-status-rejected' : 'border-border-control'}`}>
          {SPACE_TREE.map((b) => (
            <div key={b.id}>
              <div className="px-2 pt-2 pb-1 text-label-sm text-text-secondary">{b.name}</div>
              {b.children.flatMap((f) => f.children.map((r) => (
                <label key={r.id} className={`flex items-center gap-2 h-9 px-2 rounded ${r.approved ? 'cursor-pointer hover:bg-surface-container-low' : 'opacity-60 cursor-not-allowed'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-primary-container" checked={zones.includes(r.id)} disabled={!r.approved && !zones.includes(r.id)} onChange={() => toggleZone(r.id)} />
                  <span className="font-mono text-caption w-12">{r.id}</span>
                  <span className="text-body-sm flex-1 truncate">{f.name} • {r.name}</span>
                  {!r.approved && <span className="text-caption text-status-pending">Chưa duyệt</span>}
                  <Chip color={ZONE_TONE[r.zone]}>{ZONE_LABEL[r.zone]}</Chip>
                </label>
              )))}
            </div>
          ))}
        </div>
        <div className="rounded border border-border-subtle">
          <div className="px-3 py-2 bg-surface-container-low text-label-sm text-text-secondary">Thiết bị thuộc khu vực đã chọn ({devices.length})</div>
          {devices.length === 0 ? <p className="px-3 py-2 text-caption text-text-secondary">Chưa có thiết bị.</p> : (
            <ul className="divide-y divide-border-subtle max-h-[160px] overflow-y-auto">
              {devices.map((d) => (
                <li key={d.id} className="px-3 py-1.5 flex items-center gap-2 text-body-sm">
                  <span className={`w-2 h-2 rounded-full ${d.online ? 'bg-status-active' : 'bg-status-rejected'}`} />
                  <span className="font-mono text-caption">{d.id}</span><span className="text-text-secondary truncate">{d.kind}</span>
                  <span className="ml-auto font-mono text-caption text-text-secondary">{d.room}</span>
                  {!d.online && <span className="text-caption text-status-rejected">Mất kết nối</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section title="Khung thời gian áp dụng" hint="Khi có lượt nhận diện, hệ thống kiểm tra thời điểm đó có nằm trong khung giờ của chính sách không." error={err('spatial.time_window')}>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Khung thời gian">
          {Object.entries(TIME_PRESETS).map(([k, p]) => {
            const on = tw.preset === k;
            return (
              <label key={k} className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer ${on ? (err('spatial.time_window') ? 'border-status-rejected bg-status-rejected/5' : 'border-primary-container bg-primary-fixed') : 'border-border-control hover:bg-surface-container-low'}`}>
                <input type="radio" name="preset" className="mt-1 accent-primary-container" checked={on} onChange={() => setTw('preset')(k)} />
                <span className="min-w-0"><span className="block text-body-sm font-medium">{p.label}</span><span className="block text-caption text-text-secondary">Dùng cho: {p.for.map((t) => SUBJECT_TYPE[t].label).join(', ')}</span></span>
              </label>
            );
          })}
        </div>
        {src && (
          <Banner tone={src.status === 'ERROR' ? 'danger' : 'info'} icon={src.status === 'ERROR' ? 'sync_problem' : 'sync'}>
            Lấy từ <b>{src.name}</b>, đồng bộ {fmtRelative(src.last_sync)}.{src.status === 'ERROR' && <> {src.note} <Link className="underline" to="/tich-hop">Xem nguồn dữ liệu</Link>.</>}
          </Banner>
        )}
        {needsRange && (
          <div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
            <div role="group" aria-label="Ngày trong tuần" className="flex gap-1.5">
              {DAYS.map(([d, l]) => {
                const on = tw.days.includes(d);
                return <button key={d} type="button" aria-pressed={on} onClick={() => setTw('days')(on ? tw.days.filter((x) => x !== d) : [...tw.days, d].sort())} className={`w-10 h-10 rounded border text-label-sm ${on ? 'bg-primary-container text-white border-primary-container' : 'bg-surface border-border-control'}`}>{l}</button>;
              })}
            </div>
            <FieldError msg={err('spatial.time_window.days')} />
            <div className="flex items-center gap-2 text-body-sm">
              <label className="flex items-center gap-2">Từ <input type="time" className="input !w-[130px]" value={tw.from} onChange={(e) => setTw('from')(e.target.value)} /></label>
              <label className="flex items-center gap-2">đến <input type="time" className={`input !w-[130px] ${err('spatial.time_window.range') ? '!border-status-rejected' : ''}`} value={tw.to} onChange={(e) => setTw('to')(e.target.value)} /></label>
            </div>
            <FieldError msg={err('spatial.time_window.range')} />
          </div>
        )}
      </Section>
    </div>
  );
}

// ---------- Bước 3 ----------
const NumberField = ({ label, value, onChange, min, max, suffix, error, id }) => (
  <label className="flex flex-col gap-1" htmlFor={id}>
    <span className="text-label-md">{label}</span>
    <span className="flex items-center gap-2">
      <input id={id} type="number" min={min} max={max} className={`input !w-[120px] tabular-nums ${error ? '!border-status-rejected' : ''}`} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} aria-invalid={!!error} />
      {suffix && <span className="text-body-sm text-text-secondary">{suffix}</span>}
    </span>
    <FieldError msg={error} />
  </label>
);

function Step3({ cfg, update, err }) {
  const b = cfg.biometric;
  const types = cfg.scope.subject_types;
  return (
    <div className="grid grid-cols-2 gap-space-xl">
      <div className="flex flex-col gap-space-lg">
        <Section title="Nguồn dữ liệu chấp nhận" hint="Nguồn phải phù hợp với loại đối tượng. Ví dụ nhà thầu và khách không có tài khoản App MyDaiNam." error={err('biometric.accepted_sources')}>
          <ChipToggleGroup label="Nguồn dữ liệu" invalid={!!err('biometric.accepted_sources')} value={b.accepted_sources} onChange={update('biometric.accepted_sources')}
            options={Object.entries(SOURCE).map(([value, m]) => ({ value, label: m.label, icon: m.icon, hint: `Dùng cho: ${SOURCE_ALLOWED[value].map((t) => SUBJECT_TYPE[t].label).join(', ')}` }))} />
          <p className="text-caption text-text-secondary">Đang áp dụng cho: {types.map((t) => SUBJECT_TYPE[t].label).join(', ') || '—'}</p>
        </Section>
        <Section title="Số tư thế yêu cầu" hint="Mặc định 6 tư thế cho sinh viên, 3 cho khách." error={err('biometric.pose_count')}>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={8} value={b.pose_count || 1} onChange={(e) => update('biometric.pose_count')(Number(e.target.value))} className="flex-1 accent-primary-container" aria-label="Số tư thế" />
            <span className="w-16 text-center text-k-title-md tabular-nums">{b.pose_count}</span>
          </div>
        </Section>
        <NumberField id="min_quality" label="Ngưỡng chất lượng ảnh tối thiểu" value={b.min_quality} onChange={update('biometric.min_quality')} min={50} max={100} suffix="/ 100" error={err('biometric.min_quality')} />
      </div>
      <div className="flex flex-col gap-space-lg">
        <Section title="AI tự duyệt" hint="Hồ sơ đạt ngưỡng sẽ không cần người duyệt. AI không bao giờ tự từ chối hay tự thu hồi.">
          <div className="flex items-center gap-3 p-3 rounded border border-border-subtle">
            <Switch checked={b.ai_auto_approve_enabled} onChange={update('biometric.ai_auto_approve_enabled')} label="Bật AI tự duyệt" />
            <span className="text-body-sm flex-1">{b.ai_auto_approve_enabled ? 'Đang bật' : 'Đang tắt: mọi hồ sơ do người duyệt'}</span>
          </div>
          {b.ai_auto_approve_enabled && <NumberField id="ai_th" label="Ngưỡng tự duyệt" value={b.ai_auto_approve_threshold} onChange={update('biometric.ai_auto_approve_threshold')} min={80} max={100} suffix="% điểm AI" error={err('biometric.ai_auto_approve_threshold')} />}
          {b.ai_auto_approve_enabled && <p className="text-caption text-text-secondary">Mỗi lượt tự duyệt được ghi nhật ký với mã AUTO_APPROVE_FACE_ID.</p>}
        </Section>
        <Section title="Chụp lại khi được duyệt">
          <div className="flex gap-space-lg">
            <NumberField id="rescan_h" label="Thời hạn" value={b.rescan_validity_hours} onChange={update('biometric.rescan_validity_hours')} min={1} max={168} suffix="giờ" error={err('biometric.rescan_validity_hours')} />
            <NumberField id="rescan_n" label="Số lần" value={b.rescan_max_uses} onChange={update('biometric.rescan_max_uses')} min={1} max={5} suffix="lần" error={err('biometric.rescan_max_uses')} />
          </div>
          <span className="text-label-md mt-1">Nơi được chụp lại</span>
          <ChipToggleGroup label="Nơi được chụp lại" invalid={!!err('biometric.rescan_channels')} value={b.rescan_channels} onChange={update('biometric.rescan_channels')}
            options={Object.entries(RESCAN_CHANNELS).map(([value, label]) => ({ value, label, icon: value === 'APP' ? 'smartphone' : 'photo_camera_front' }))} />
          <FieldError msg={err('biometric.rescan_channels')} />
        </Section>
      </div>
    </div>
  );
}

// ---------- Bước 4 ----------
function Step4({ cfg, update, err }) {
  const chain = cfg.workflow.approval_chain;
  const setChain = update('workflow.approval_chain');
  const move = (i, d) => { const c = [...chain]; [c[i], c[i + d]] = [c[i + d], c[i]]; setChain(c); };
  const setStep = (i, role) => setChain(chain.map((s, j) => (j === i ? { ...s, role, label: APPROVER_ROLES[role] } : s)));
  const setTrigger = (i, patch) => update('triggers')(cfg.triggers.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <div className="flex flex-col gap-space-xl">
      <Section title="Chuỗi phê duyệt" hint="Áp dụng cho yêu cầu chụp lại, đăng ký mới, gia hạn và thu hồi. Rút đồng ý luôn do cán bộ bảo vệ dữ liệu xác nhận." error={err('workflow.approval_chain')}>
        <div className="flex items-stretch gap-2 flex-wrap p-3 rounded bg-surface-container-low">
          <div className="px-3 py-2 rounded bg-surface border border-border-subtle text-body-sm flex items-center"><Icon name="person" size={16} className="mr-1.5" />Người gửi yêu cầu</div>
          {chain.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <Icon name="arrow_forward" className="text-text-secondary" />
              <div className="p-2 rounded bg-surface border border-primary-container/50 flex flex-col gap-1.5 w-[230px]">
                <div className="flex items-center justify-between text-caption text-text-secondary"><span>Bước {i + 1}</span>
                  <span className="flex gap-0.5">
                    <button type="button" className="w-7 h-7 rounded hover:bg-surface-container disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Đưa bước ${i + 1} lên trước`}><Icon name="arrow_back" size={16} /></button>
                    <button type="button" className="w-7 h-7 rounded hover:bg-surface-container disabled:opacity-30" disabled={i === chain.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa bước ${i + 1} ra sau`}><Icon name="arrow_forward" size={16} /></button>
                    <button type="button" className="w-7 h-7 rounded hover:bg-status-rejected/10 text-status-rejected" onClick={() => setChain(chain.filter((_, j) => j !== i))} aria-label={`Xóa bước ${i + 1}`}><Icon name="delete" size={16} /></button>
                  </span>
                </div>
                <Select label={`Người duyệt bước ${i + 1}`} value={s.role} onChange={(r) => setStep(i, r)} options={Object.entries(APPROVER_ROLES).map(([value, label]) => ({ value, label }))} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Icon name="arrow_forward" className="text-text-secondary" />
            <button type="button" className="btn-outline h-full min-h-[40px]" onClick={() => setChain([...chain, { id: `s${Date.now()}`, role: 'UNIT_HEAD', label: APPROVER_ROLES.UNIT_HEAD }])}><Icon name="add" />Thêm bước</button>
            <Icon name="arrow_forward" className="text-text-secondary" />
            <div className="px-3 py-2 rounded bg-status-active/10 text-status-active text-body-sm flex items-center">Hoàn tất</div>
          </div>
        </div>
        <div className="flex gap-space-xl items-start">
          <label className="flex items-center gap-3"><Switch checked={cfg.workflow.revoke_two_person} onChange={update('workflow.revoke_two_person')} label="Thu hồi cần 2 người xác nhận" /><span className="text-body-sm">Thu hồi quyền cần 2 cán bộ khác nhau xác nhận</span></label>
          <NumberField id="retention" label="Xóa dữ liệu sau khi rút đồng ý trong" value={cfg.workflow.retention_days_after_withdraw} onChange={update('workflow.retention_days_after_withdraw')} min={0} max={30} suffix="ngày" error={err('workflow.retention_days_after_withdraw')} />
        </div>
      </Section>

      <Section title="Sự kiện gửi sang hệ thống khác" hint="Gửi qua hàng đợi Kafka hoặc webhook mỗi khi sự kiện xảy ra. Tắt một dòng nghĩa là hệ thống kia không nhận sự kiện đó.">
        <div className="overflow-x-auto rounded border border-border-subtle">
          <table className="data-table">
            <thead><tr><th>Gửi tới</th><th>Khi nào</th><th>Cách gửi</th><th className="min-w-[280px]">Địa chỉ / topic</th><th>Dữ liệu gửi</th><th>Bật</th></tr></thead>
            <tbody>
              {cfg.triggers.map((t, i) => {
                const e = err(`triggers.${i}`);
                return (
                  <tr key={t.id} className={`align-top ${e ? 'bg-status-rejected/5' : ''}`}>
                    <td className="whitespace-nowrap"><span className="flex items-center gap-1.5 font-medium"><Icon name={TRIGGER_TARGET[t.target].icon} size={16} />{TRIGGER_TARGET[t.target].label}</span><span className="text-caption text-text-secondary">{TRIGGER_SHORT[t.id]}</span></td>
                    <td className="min-w-[200px] text-body-sm">{TRIGGER_EVENT[t.event]}</td>
                    <td><Select className="!w-[130px]" label={`Cách gửi ${t.id}`} value={t.transport} options={[{ value: 'KAFKA', label: 'Kafka' }, { value: 'WEBHOOK', label: 'Webhook' }]} onChange={(v) => setTrigger(i, { transport: v })} /></td>
                    <td><input className={`input font-mono !text-caption ${e ? '!border-status-rejected' : ''}`} aria-label={`Địa chỉ ${t.id}`} value={t.destination} onChange={(ev) => setTrigger(i, { destination: ev.target.value })} /><FieldError msg={e} /></td>
                    <td className="text-caption text-text-secondary min-w-[160px]">{t.payload.join(', ')}</td>
                    <td><Switch checked={t.enabled} onChange={(v) => setTrigger(i, { enabled: v })} label={`Bật ${t.id}`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ---------- Bước 5 ----------
function Step5({ cfg, policy, changes, errors, reason, setReason, dry, runDry, busy, go, nextVersion }) {
  const errorList = Object.entries(errors);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-space-xl">
      <div className="flex flex-col gap-space-lg min-w-0">
        {errorList.length > 0 && (
          <Banner tone="danger" title={`${errorList.length} lỗi cần sửa trước khi lưu.`}>
            <ul className="mt-1 flex flex-col gap-0.5">
              {errorList.map(([k, m]) => <li key={k}><button className="underline text-left" onClick={() => go(stepOfError(k))}>Bước {stepOfError(k)} • {fieldLabel(k.split('.').slice(0, 2).join('.'))}</button>: {m}</li>)}
            </ul>
          </Banner>
        )}
        <div>
          <h3 className="text-headline-md mb-2">Thay đổi so với {policy.current_version}</h3>
          {changes.length === 0 ? <p className="text-body-sm text-text-secondary">Chưa có thay đổi nào.</p> : (
            <table className="w-full text-body-sm border border-border-subtle rounded">
              <thead><tr className="bg-surface-container-low text-text-secondary text-label-sm"><th className="text-left px-3 py-2 font-medium">Trường</th><th className="text-left px-3 py-2 font-medium">Hiện tại ({policy.current_version})</th><th className="text-left px-3 py-2 font-medium">Mới ({nextVersion})</th></tr></thead>
              <tbody>{changes.map((d) => <tr key={d.path} className="border-t border-border-subtle align-top"><td className="px-3 py-2">{fieldLabel(d.path)}</td><td className="px-3 py-2 text-text-secondary line-through">{valueText(d.path, d.from)}</td><td className="px-3 py-2 font-medium">{valueText(d.path, d.to)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-headline-md">Chạy thử trên dữ liệu 24 giờ qua</h3>
            <button className="btn-outline" onClick={runDry} disabled={busy || !changes.length}><Icon name="science" />{dry ? 'Chạy lại' : 'Chạy thử'}</button>
          </div>
          {!dry ? <p className="text-body-sm text-text-secondary">Chạy thử để xem số người, thiết bị và yêu cầu bị ảnh hưởng. Không có dữ liệu nào bị thay đổi.</p> : (
            <div className="flex flex-col gap-2 anim-fade">
              <dl className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded bg-surface-container-low"><dt className="text-caption text-text-secondary">Người chịu ảnh hưởng</dt><dd className="text-k-title-md tabular-nums">{fmtNumber(dry.affected)}</dd></div>
                <div className="p-3 rounded bg-surface-container-low"><dt className="text-caption text-text-secondary">Thiết bị cần nạp lại</dt><dd className="text-k-title-md tabular-nums">{dry.devices}</dd></div>
                <div className="p-3 rounded bg-surface-container-low"><dt className="text-caption text-text-secondary">Yêu cầu đang chờ sẽ được AI tự duyệt</dt><dd className="text-k-title-md tabular-nums">{dry.auto_approve_before} → {dry.auto_approve_after}<span className="text-caption text-text-secondary"> / {dry.pending_considered}</span></dd></div>
              </dl>
              {dry.offline_devices.length > 0 && <Banner tone="warn">Thiết bị mất kết nối sẽ nhận cấu hình khi trực tuyến lại: <span className="font-mono">{dry.offline_devices.join(', ')}</span>.</Banner>}
              {dry.conflicts.map((c) => <Banner key={c} tone="danger" icon="report">{c}</Banner>)}
              {!dry.conflicts.length && <Banner icon="check_circle">Không phát hiện xung đột với chính sách khác hay khu vực chưa duyệt.</Banner>}
            </div>
          )}
        </div>
      </div>
      <aside className="flex flex-col gap-3 p-space-md rounded bg-surface-container-low self-start">
        <h3 className="text-headline-md">Lưu thành {nextVersion}</h3>
        <ul className="text-body-sm flex flex-col gap-1.5">
          <li className="flex gap-2"><Icon name="check" size={16} className="text-status-active mt-0.5" />Có hiệu lực ngay, không cần triển khai lại.</li>
          <li className="flex gap-2"><Icon name="check" size={16} className="text-status-active mt-0.5" />{policy.current_version} được giữ để khôi phục khi cần.</li>
          <li className="flex gap-2"><Icon name="check" size={16} className="text-status-active mt-0.5" />Người sửa và lý do được ghi vào nhật ký kiểm toán.</li>
        </ul>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-semibold">Lý do thay đổi <span className="text-status-rejected">*</span></span>
          <textarea className="input leading-relaxed" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: theo biên bản họp Phòng Đào tạo ngày…" />
          <span className="text-caption text-text-secondary">Tối thiểu 10 ký tự • {reason.trim().length} ký tự</span>
        </label>
        <div className="flex flex-wrap gap-1">{cfg.biometric.accepted_sources.map((s) => <SourceBadge key={s} source={s} poses={cfg.biometric.pose_count} />)}</div>
      </aside>
    </div>
  );
}
