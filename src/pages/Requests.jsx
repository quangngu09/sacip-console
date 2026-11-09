import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AiCard, Banner, Chip, ConfirmReason, DataBoundary, Empty, FaceThumb, Icon, PageHeader, SearchInput, Select, SourceBadge, StateBadge, SubjectTypeChip, Tabs, useCountdown } from '../components/ui';
import { useApp } from '../store';
import { approveRequest, cancelRequest, policyFor, rejectRequest, requestOriginalImage } from '../api/client';
import { REQUEST_STATUS, REQUEST_TYPE, TRIGGER_TARGET, canApproveStep, consentLabel, stepApproverText } from '../api/enums';
import { channelsText } from '../lib/policyText';
import { fmtDateTime, fmtPercent, fmtRelative, slaState } from '../lib/format';
import { contextLine } from './Profiles';

// Một hàng đợi chung cho mọi loại yêu cầu, lọc nhanh bằng tab trạng thái (Đặc tả IAM §2.3).
const TABS = [
  { key: 'pending', label: 'Chờ duyệt', tone: 'status-pending' },
  { key: 'rejected', label: 'Đã từ chối' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'all', label: 'Tất cả' },
];
const TYPE_FILTER = [{ value: 'all', label: 'Mọi loại yêu cầu' }, ...Object.entries(REQUEST_TYPE).map(([value, m]) => ({ value, label: m.label }))];
const PRIORITY = { URGENT: ['bg-status-rejected text-white', 'Khẩn cấp'], HIGH: ['bg-status-rejected/10 text-status-rejected', 'Cao'], LEGAL: ['bg-secondary-fixed text-on-secondary-fixed-variant', 'Pháp lý'] };

export default function Requests() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();
  // ?loai=RESCAN&tab=pending: liên kết từ Tổng quan mở sẵn đúng bộ lọc.
  const [tab, setTab] = useState(() => params.get('tab') || 'pending');
  const [type, setType] = useState(() => params.get('loai') || 'all');
  const [q, setQ] = useState('');
  const sel = params.get('id');
  const subjectOf = (r) => data.subjects.find((s) => s.subject_id === r.subject_id);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, t.key === 'all' ? data.requests.length : data.requests.filter((r) => r.status === t.key).length]));
  const list = useMemo(() => data.requests
    .filter((r) => tab === 'all' || r.status === tab)
    .filter((r) => type === 'all' || r.request_type === type)
    .filter((r) => { const s = subjectOf(r); return !q || `${r.request_id} ${s.name} ${s.code}`.toLowerCase().includes(q.toLowerCase()); })
    .sort((a, b) => (a.status === 'pending' && b.status === 'pending' ? (a.sla_due || '').localeCompare(b.sla_due || '') : b.submitted_at.localeCompare(a.submitted_at))),
  [data.requests, tab, type, q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi mở bằng liên kết ?id=, chuyển đúng tab của yêu cầu đó.
  useEffect(() => {
    const r = sel && data.requests.find((x) => x.request_id === sel);
    if (r && tab !== 'all' && r.status !== tab) setTab(r.status);
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = data.requests.find((r) => r.request_id === sel && (tab === 'all' || r.status === tab)) || list[0];
  const select = (id) => setParams({ id });

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Hộp yêu cầu" badge={counts.pending > 0 && <Chip color="status-pending">{counts.pending} việc cần làm</Chip>}
        desc="Mọi loại yêu cầu trong một hàng đợi • Chuỗi duyệt lấy từ chính sách của từng loại đối tượng • Từ chối bắt buộc nêu lý do" />

      <DataBoundary name="requests" label="hộp yêu cầu" fill skeleton="bar-split">
        <div className="card shrink-0 mb-space-md"><Tabs label="Trạng thái yêu cầu" className="px-2" value={tab} onChange={(t) => { setTab(t); setParams({}); }} items={TABS.map((t) => ({ ...t, count: counts[t.key] }))} /></div>
        <div className="flex-1 min-h-0 grid grid-cols-[400px_minmax(0,1fr)] gap-space-md">
          <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Danh sách yêu cầu">
            <div className="p-3 border-b border-border-subtle flex gap-2 shrink-0">
              <SearchInput className="flex-1 min-w-0" value={q} onChange={setQ} placeholder="Mã, tên, mã số" label="Tìm yêu cầu theo mã, tên, mã số" />
              <Select className="!w-[160px]" label="Loại yêu cầu" value={type} onChange={setType} options={TYPE_FILTER} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border-subtle">
              {list.length === 0 && <Empty title="Không có yêu cầu" desc="Hàng đợi trống với bộ lọc hiện tại." />}
              {list.map((r) => {
                const s = subjectOf(r);
                const active = cur && r.request_id === cur.request_id;
                const sla = r.status === 'pending' && slaState(r.sla_due);
                return (
                  <button key={r.request_id} onClick={() => select(r.request_id)} aria-current={active ? 'true' : undefined}
                    className={`w-full text-left px-3.5 py-3 flex flex-col gap-1 transition-colors -outline-offset-2 ${active ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-label-md font-semibold truncate ${r.status === 'cancelled' ? 'line-through text-text-secondary' : ''}`}>{s.name}</span>
                      {r.status === 'pending'
                        ? <span className={`shrink-0 flex items-center gap-1 text-caption whitespace-nowrap ${sla === 'over' || sla === 'soon' ? 'text-status-rejected font-semibold' : 'text-text-secondary'}`}><Icon name="schedule" size={14} />{sla === 'over' ? `Quá hạn ${fmtRelative(r.sla_due).replace(' trước', '')}` : fmtRelative(r.sla_due)}</span>
                        : <Chip color={REQUEST_STATUS[r.status].color} className="shrink-0">{r.auto_approved ? 'AI tự duyệt' : REQUEST_STATUS[r.status].label}</Chip>}
                    </div>
                    <div className="flex items-center gap-2 text-caption text-text-secondary">
                      <Icon name={REQUEST_TYPE[r.request_type].icon} size={14} />
                      <span className="truncate"><span className="font-mono">{r.request_id}</span> • {REQUEST_TYPE[r.request_type].label} • {s.code}</span>
                      {PRIORITY[r.priority] && <span className={`ml-auto shrink-0 px-1.5 rounded font-medium ${PRIORITY[r.priority][0]}`}>{PRIORITY[r.priority][1]}</span>}
                    </div>
                    <p className="text-body-sm text-text-secondary truncate">{r.reason_submitted}</p>
                  </button>
                );
              })}
            </div>
            <div className="h-10 px-3.5 border-t border-border-subtle text-caption text-text-secondary flex items-center shrink-0" aria-live="polite">Hiển thị {list.length} / {data.requests.length} yêu cầu</div>
          </section>

          <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Chi tiết yêu cầu">
            {cur ? <RequestDetail key={cur.request_id} r={cur} s={subjectOf(cur)} /> : <Empty title="Chưa có yêu cầu để xem" desc="Chi tiết hiển thị khi có yêu cầu trong danh sách." />}
          </section>
        </div>
      </DataBoundary>
    </div>
  );
}

const Field = ({ label, children }) => <div className="min-w-0"><dt className="text-caption text-text-secondary">{label}</dt><dd className="min-w-0">{children}</dd></div>;

const Metric = ({ label, value, sub, tone }) => (
  <div className="p-3 bg-surface rounded-lg border border-border-subtle">
    <div className="text-caption text-text-secondary">{label}</div>
    <div className={`text-k-title-md ${tone}`}>{value}</div>
    <div className="text-caption text-text-secondary">{sub}</div>
  </div>
);
const tone = (ok, warn) => (ok ? 'text-status-active' : warn ? 'text-status-pending' : 'text-status-rejected');

function RequestDetail({ r, s }) {
  const { data, call, toast, can, actor, role } = useApp();
  const [ask, setAsk] = useState(null);
  const [signed, setSigned] = useState(null);
  const left = useCountdown(signed?.expires_at, () => setSigned(null));
  const pol = policyFor(s.subject_type);
  const b = pol.config.biometric;
  const pending = r.status === 'pending';
  const isWithdraw = r.request_type === 'WITHDRAW_CONSENT';
  const consentGate = s.states.consent !== 'ACTIVE' && !['WITHDRAW_CONSENT', 'REVOKE'].includes(r.request_type);
  const stepIdx = r.approvals.findIndex((a) => !a.decision);
  const lastStep = stepIdx === r.approvals.length - 1;
  const awaitingSecond = r.two_person && lastStep && !!r.first_confirm;
  const step = r.approvals[stepIdx];
  const permOk = !!step && canApproveStep(role, step.role);
  const sameAsFirst = awaitingSecond && r.first_confirm.by_id === actor.id;
  const events = data.events.filter((e) => e.ref === r.request_id || (e.ref === s.code && e.at >= r.submitted_at)).sort((a, b2) => b2.at.localeCompare(a.at));
  const sla = pending && slaState(r.sla_due);
  const aiPass = r.ai && b.ai_auto_approve_enabled && r.ai.confidence >= b.ai_auto_approve_threshold;

  const approveLabel = isWithdraw ? 'Xác nhận rút đồng ý' : r.two_person && lastStep ? (awaitingSecond ? 'Xác nhận người thứ 2' : 'Xác nhận người thứ 1') : lastStep ? 'Phê duyệt' : `Duyệt bước ${stepIdx + 1}`;

  const outcome = {
    RESCAN: `Mở quyền chụp lại qua ${channelsText(b.rescan_channels)} trong ${b.rescan_validity_hours} giờ, ${b.rescan_max_uses} lần; gửi thông báo tới người gửi.`,
    NEW_REGISTRATION: `Kích hoạt hiệu lực Face ID; ${s.subject_type === 'STUDENT' ? 'báo Hệ thống Đào tạo trạng thái VERIFIED; ' : ''}nạp dữ liệu xuống thiết bị kiểm soát ra vào.`,
    REVOKE: 'Thu hồi quyền nhận diện tại mọi cổng và camera ngay lập tức.',
    EXTEND: 'Gia hạn hiệu lực đến 31/12/2027 và cập nhật thiết bị kiểm soát ra vào.',
    WITHDRAW_CONSENT: `Khóa tại mọi thiết bị, rồi xóa ảnh gốc và dữ liệu sinh trắc trong ${pol.config.workflow.retention_days_after_withdraw} ngày theo ${pol.policy_id}; gửi biên bản xác nhận cho người gửi.`,
  }[r.request_type];

  const run = async (kind, reason) => {
    try {
      if (kind === 'approve') {
        const res = await call(approveRequest, r.request_id, reason);
        if (res.stage === 'FIRST_CONFIRM') toast('Đã ghi nhận xác nhận thứ nhất', 'Cần một cán bộ khác xác nhận. Đổi vai trò ở góc trên bên phải để mô phỏng.', 'warn');
        else if (res.stage === 'STEP') toast(`Đã duyệt bước ${stepIdx + 1}`, `Chuyển tới: ${r.approvals[stepIdx + 1].label}.`, 'success');
        else toast(isWithdraw ? 'Đã xác nhận rút đồng ý' : 'Đã phê duyệt', `${r.request_id}: đã gửi ${res.events.length} sự kiện sang hệ thống khác.`, 'success');
      }
      if (kind === 'reject') { await call(rejectRequest, r.request_id, reason); toast('Đã từ chối', 'Lý do đã được gửi về App MyDaiNam cho người gửi.', 'info'); }
      if (kind === 'reveal') { setSigned(await call(requestOriginalImage, s.subject_id, reason)); toast('Đã mở ảnh gốc trong 60 giây', 'Lượt xem đã ghi nhật ký.', 'warn'); }
    } catch (e) { toast('Không thực hiện được', e.message, 'error'); }
    setAsk(null);
  };

  return (
    <>
      <header className="px-space-md py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-k-title-md truncate">{s.name}</h2><SubjectTypeChip type={s.subject_type} />
          <Chip color={REQUEST_STATUS[r.status].color} className="ml-auto shrink-0">{r.auto_approved ? 'AI tự duyệt' : REQUEST_STATUS[r.status].label}</Chip>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-caption text-text-secondary">
          <span><span className="font-mono">{r.request_id}</span> • {REQUEST_TYPE[r.request_type].label}</span>
          <span>Gửi lúc {fmtDateTime(r.submitted_at)} qua {r.channel === 'APP' ? 'App MyDaiNam' : r.channel === 'COUNTER' ? 'quầy đăng ký' : 'Console'}</span>
          <span>Theo {r.policy_ref.policy_id} {r.policy_ref.version}</span>
          {pending && <span className={`font-medium ${sla === 'ok' ? 'text-status-pending' : 'text-status-rejected'}`}>{sla === 'over' ? 'Đã quá hạn xử lý' : `Hạn xử lý: ${fmtRelative(r.sla_due)}`}</span>}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-space-md flex flex-col gap-space-md">
        {r.auto_approved && <Banner icon="smart_toy" title="AI tự duyệt.">Điểm {fmtPercent(r.ai.confidence)} đạt ngưỡng tự duyệt của {r.policy_ref.policy_id} {r.policy_ref.version}. Lượt này được ghi nhật ký với mã AUTO_APPROVE_FACE_ID. AI không có quyền tự từ chối hay thu hồi.</Banner>}
        {r.status === 'rejected' && <Banner tone="danger" icon="block" title="Lý do từ chối (công khai, đã gửi về App):">{r.rejection_reason}<div className="text-caption text-text-secondary mt-1">{r.approver_id} • {fmtDateTime(r.approved_at)}</div></Banner>}
        {r.status === 'completed' && !r.auto_approved && <Banner icon="task_alt" title="Đã hoàn thành.">Người duyệt cuối: {r.approver_id} lúc {fmtDateTime(r.approved_at)}.</Banner>}
        {r.status === 'cancelled' && <Banner tone="warn" title="Người gửi đã hủy yêu cầu trên App.">Không còn thao tác nào cho yêu cầu này.</Banner>}
        {pending && consentGate && <Banner tone="danger" icon="lock">{s.name} chưa có đồng ý hợp lệ. Có thể từ chối, nhưng phê duyệt sẽ bị chặn cho đến khi người này xác nhận điều khoản.</Banner>}

        <section className="flex flex-col gap-3">
          <h3 className="text-headline-md">Đối tượng và lý do</h3>
          <div className="flex gap-space-md items-start">
            <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              <Field label="Mã"><span className="font-mono">{s.code}</span> • <Link to="/ho-so" className="text-primary-container hover:underline">Hồ sơ</Link></Field>
              <Field label="Ngữ cảnh">{contextLine(s)}</Field>
              <Field label="Nguồn Face ID"><SourceBadge source={s.source} poses={s.source && s.poses.length} /></Field>
              <Field label="Đồng ý"><StateBadge dim="consent" value={s.states.consent} label={consentLabel(s)} /></Field>
              <div className="col-span-2">
                <dt className="text-caption text-text-secondary mb-1">Lý do người gửi nhập</dt>
                <dd className="p-2.5 rounded bg-surface-bright leading-relaxed border-l-2 border-l-primary-container">“{r.reason_submitted}”</dd>
              </div>
            </dl>
            {s.poses.length > 0 && (
              <div className="w-40 shrink-0 flex flex-col items-center gap-1.5">
                <FaceThumb seed={s.seed} size={140} round={false} revealed={left > 0} />
                {left > 0
                  ? <button className="btn-outline btn-sm w-full" onClick={() => setSigned(null)}>Làm mờ lại ({left} giây)</button>
                  : <button className="btn-outline btn-sm w-full" disabled={s.states.consent !== 'ACTIVE' || !can('view_original')} onClick={() => setAsk('reveal')}><Icon name="visibility" size={16} />Xem ảnh gốc</button>}
              </div>
            )}
          </div>
        </section>

        {r.ai && !isWithdraw && (
          <AiCard>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Chất lượng ảnh" value={`${r.ai.quality}/100`} tone={tone(r.ai.quality >= b.min_quality, r.ai.quality >= 70)} sub={`Ngưỡng tối thiểu ${b.min_quality}`} />
              <Metric label="Khớp ảnh CCCD / hồ sơ cũ" value={fmtPercent(r.ai.match)} tone={tone(r.ai.match >= 90, r.ai.match >= 80)} sub={r.ai.match >= 90 ? 'Cùng một người' : 'Cần đối chiếu thêm'} />
              <Metric label="Kiểm tra người thật" value={r.ai.liveness >= 90 ? 'Đạt' : 'Không đạt'} tone={tone(r.ai.liveness >= 90)} sub={fmtPercent(r.ai.liveness)} />
            </div>
            <p className="mt-2 text-body-sm">
              {b.ai_auto_approve_enabled
                ? aiPass ? `Điểm ${fmtPercent(r.ai.confidence)} đạt ngưỡng tự duyệt ${b.ai_auto_approve_threshold}%.` : `Điểm ${fmtPercent(r.ai.confidence)} thấp hơn ngưỡng tự duyệt ${b.ai_auto_approve_threshold}% nên cần người duyệt.`
                : `${pol.policy_id} không bật AI tự duyệt; người duyệt quyết định.`}
              {r.ai.liveness < 90 && ' Có dấu hiệu dùng ảnh in hoặc màn hình.'}
            </p>
          </AiCard>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-headline-md">Chuỗi phê duyệt</h3>
          <ol className="relative pl-7 flex flex-col gap-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
            <li className="relative"><span className="absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface bg-status-active text-white"><Icon name="check" size={13} /></span>
              <div className="p-2.5 rounded-lg bg-surface-bright"><div className="flex justify-between gap-2"><span className="text-label-md font-semibold">Người gửi yêu cầu</span><span className="text-caption text-text-secondary">{fmtDateTime(r.submitted_at)}</span></div></div></li>
            {r.auto_approved && <li className="relative"><span className="absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface bg-status-active text-white"><Icon name="smart_toy" size={13} /></span>
              <div className="p-2.5 rounded-lg bg-surface-bright"><div className="flex justify-between gap-2"><span className="text-label-md font-semibold">AI tự duyệt</span><span className="text-caption text-text-secondary">{fmtDateTime(r.approved_at)}</span></div></div></li>}
            {r.approvals.map((a, i) => {
              const state = a.decision === 'APPROVED' ? 'done' : a.decision === 'REJECTED' ? 'rejected' : pending && i === stepIdx ? 'current' : 'off';
              return (
                <li key={i} className={`relative ${state === 'off' ? 'opacity-60' : ''}`}>
                  <span className={`absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${state === 'done' ? 'bg-status-active text-white' : state === 'rejected' ? 'bg-status-rejected text-white' : state === 'current' ? 'bg-primary-container text-white' : 'bg-surface-container-high text-text-secondary'}`}>
                    <Icon name={state === 'done' ? 'check' : state === 'rejected' ? 'close' : state === 'current' ? 'edit' : 'more_horiz'} size={13} />
                  </span>
                  <div className={`p-2.5 rounded-lg ${state === 'current' ? 'bg-surface ring-1 ring-primary-container' : 'bg-surface-bright'}`}>
                    <div className="flex justify-between gap-2">
                      <span className={`text-label-md font-semibold ${state === 'current' ? 'text-primary-container' : ''}`}>Bước {i + 1}: {a.label}</span>
                      {a.approved_at ? <span className="text-caption text-text-secondary">{a.approver_id} • {fmtDateTime(a.approved_at)}</span> : state === 'current' && <Chip color="status-pending">Đang chờ</Chip>}
                    </div>
                    {a.note && <p className="text-body-sm text-text-secondary mt-0.5">“{a.note}”</p>}
                    {state === 'current' && r.two_person && lastStep && (
                      <p className="text-body-sm mt-1">{r.first_confirm ? <>Đã có xác nhận thứ nhất: <b>{r.first_confirm.by}</b> ({fmtDateTime(r.first_confirm.at)}). Cần một cán bộ khác xác nhận.</> : 'Cần 2 cán bộ khác nhau xác nhận.'}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {pending && <p className="text-caption text-text-secondary">Khi hoàn tất: {outcome}</p>}
        </section>

        {events.length > 0 && (
          <section>
            <h3 className="text-headline-md mb-2">Sự kiện đã gửi sang hệ thống khác</h3>
            <ul className="flex flex-col divide-y divide-border-subtle border border-border-subtle rounded">
              {events.map((e) => (
                <li key={e.event_id} className="px-3 py-2 text-body-sm flex items-start gap-2">
                  <Icon name={TRIGGER_TARGET[e.target].icon} size={16} className="mt-0.5 text-primary-container" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-medium">{TRIGGER_TARGET[e.target].label}</span><span className="font-mono text-caption text-text-secondary">{e.transport} • {e.destination}</span></div>
                    <code className="block font-mono text-caption text-text-secondary truncate">{JSON.stringify(e.payload)}</code>
                  </div>
                  <Chip color={e.status === 'DELIVERED' ? 'status-active' : 'status-pending'}>{e.status === 'DELIVERED' ? 'Đã gửi' : 'Đang thử lại'}</Chip>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {pending && (
        <footer className="px-space-md py-3 border-t border-border-subtle flex items-center gap-2 shrink-0">
          {!isWithdraw && <button className="btn-danger" disabled={!permOk} onClick={() => setAsk('reject')}><Icon name="close" />Từ chối</button>}
          {isWithdraw && <span className="text-caption text-text-secondary flex items-center gap-1"><Icon name="gavel" size={16} />Quyền rút đồng ý không thể bị từ chối.</span>}
          <button className="btn text-text-secondary hover:bg-surface-container-low" title="Mô phỏng người gửi tự hủy trên App" onClick={async () => { await call(cancelRequest, r.request_id); toast('Người gửi đã hủy yêu cầu', r.request_id, 'warn'); }}><Icon name="smartphone" />Mô phỏng người gửi hủy</button>
          <div className="ml-auto flex items-center gap-2">
            {!permOk && step && <span className="text-caption text-text-secondary">Bước này do {stepApproverText(step.role)} xác nhận.</span>}
            {sameAsFirst && <span className="text-caption text-status-pending">Bạn đã xác nhận lần 1.</span>}
            <button className="btn-primary" disabled={!permOk || sameAsFirst || consentGate} onClick={() => setAsk('approve')}><Icon name="check_circle" />{approveLabel}</button>
          </div>
        </footer>
      )}

      <ConfirmReason open={ask === 'approve'} onClose={() => setAsk(null)} onConfirm={(x) => run('approve', x)} title={approveLabel} subtitle={`${r.request_id} • ${s.name}`} confirmLabel={approveLabel}
        reasonLabel="Ghi chú phê duyệt" placeholder="Căn cứ phê duyệt, ví dụ: đã đối chiếu CCCD, GVCN đã xác nhận…">
        <Banner icon="info">{lastStep && !(r.two_person && !r.first_confirm) ? `Khi xác nhận: ${outcome}` : `Yêu cầu chuyển tiếp: ${r.two_person && lastStep ? 'chờ cán bộ thứ 2 xác nhận' : r.approvals[stepIdx + 1]?.label}.`}</Banner>
      </ConfirmReason>
      <ConfirmReason open={ask === 'reject'} onClose={() => setAsk(null)} onConfirm={(x) => run('reject', x)} danger title="Từ chối yêu cầu" subtitle={`${r.request_id} • ${s.name}`} confirmLabel="Từ chối và gửi lý do"
        reasonLabel="Lý do từ chối (gửi về App cho người gửi)" placeholder="Giải thích cụ thể vì sao từ chối và người gửi cần làm gì tiếp theo.">
        <Banner tone="warn">Lý do được lưu công khai trong nhật ký và gửi về App MyDaiNam. Không được từ chối mà không giải trình.</Banner>
      </ConfirmReason>
      <ConfirmReason open={ask === 'reveal'} onClose={() => setAsk(null)} onConfirm={(x) => run('reveal', x)} title="Xem ảnh gốc" subtitle={`${s.name} • ${s.code}`} minLength={5}>
        <Banner tone="warn">Ảnh mở qua link có thời hạn 60 giây. Lượt xem ghi bất biến với mã VIEW_ORIGINAL_IMAGE.</Banner>
      </ConfirmReason>
    </>
  );
}
