import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Banner, Chip, ConfirmReason, DataBoundary, Icon, PageHeader, SourceBadge, SubjectTypeChip, Tabs } from '../components/ui';
import { useApp } from '../store';
import { TRIGGER_SHORT, TRIGGER_TARGET, transportLabel } from '../api/enums';
import { rollbackPolicy } from '../api/client';
import { diffConfig } from '../api/policyValidation';
import { fmtDateTime } from '../lib/format';
import { fieldLabel, timeWindowText, valueText } from '../lib/policyText';
import { unitName } from '../lib/scope';
import EventRules from './EventRules';
import AlertPolicies from './AlertPolicies';
import { attachRule, detachRule, excludeRule, excludedFor, includeRule, rulesForPolicy, useRules } from '../data/rulesStore';

const current = (p) => p.versions.find((v) => v.version === p.current_version);

export default function Policies() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'biometric';
  return (
    <div>
      <PageHeader title="Chính sách & quy tắc" desc="Mọi tham số vận hành lấy từ đây; không cấu hình trong mã nguồn hay tệp .env. Mỗi lần lưu tạo một phiên bản mới." />
      <Tabs label="Loại cấu hình" className="mb-space-md border-b border-border-subtle" value={tab} onChange={(t) => setParams(t === 'biometric' ? {} : { tab: t })}
        items={[{ key: 'biometric', label: 'Chính sách sinh trắc' }, { key: 'rules', label: 'Quy tắc sự kiện' }, { key: 'alerts', label: 'Nhận cảnh báo' }]} />
      {tab === 'biometric' ? <BiometricPolicies /> : tab === 'alerts' ? <AlertPolicies /> : <EventRules />}
    </div>
  );
}

function BiometricPolicies() {
  const { data, can } = useApp();
  const [params] = useSearchParams();
  const wanted = params.get('policy');
  const [rules] = useRules();
  const [sel, setSel] = useState(() => (data.policies.some((p) => p.policy_id === wanted) ? wanted : data.policies[0].policy_id));
  useEffect(() => { if (data.policies.some((p) => p.policy_id === wanted)) setSel(wanted); }, [wanted]); // eslint-disable-line react-hooks/exhaustive-deps
  const policy = data.policies.find((p) => p.policy_id === sel);
  return (
    <DataBoundary name="policies" label="danh sách chính sách" skeleton="split">
      {!can('policy_write') && <Banner className="mb-space-md" icon="lock" title="Chỉ xem.">Chỉ vai trò Quản trị hệ thống được sửa chính sách. Đổi vai trò ở góc trên bên phải để thử.</Banner>}
      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-space-md items-start">
        <nav aria-label="Danh sách chính sách" className="card overflow-hidden divide-y divide-border-subtle">
          {data.policies.map((p) => {
            const c = current(p).config;
            const on = p.policy_id === sel;
            return (
              <button key={p.policy_id} onClick={() => setSel(p.policy_id)} aria-current={on ? 'true' : undefined}
                className={`w-full text-left px-3.5 py-3 flex flex-col gap-1.5 -outline-offset-2 ${on ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label-md font-semibold">{p.name}</span>
                  <span className="font-mono text-caption text-text-secondary">{p.current_version}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SubjectTypeChip type={p.target_subject_type} />
                  <span className="text-caption text-text-secondary">{c.biometric.pose_count} tư thế</span>
                  <span className="text-caption text-text-secondary">• {c.biometric.ai_auto_approve_enabled ? `AI tự duyệt từ ${c.biometric.ai_auto_approve_threshold}%` : 'Duyệt tay'}</span>
                  <span className="text-caption text-text-secondary">• {rulesForPolicy(rules, p.policy_id).length} quy tắc</span>
                </div>
              </button>
            );
          })}
        </nav>
        <PolicyDetail policy={policy} rules={rules} />
      </div>
    </DataBoundary>
  );
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 py-2 border-b border-border-subtle last:border-0">
    <dt className="text-text-secondary">{label}</dt><dd className="min-w-0">{children}</dd>
  </div>
);

function PolicyDetail({ policy, rules }) {
  const { can, call, toast } = useApp();
  const [rollback, setRollback] = useState(null);
  const [openVer, setOpenVer] = useState(null);
  const v = current(policy);
  const c = v.config;
  const b = c.biometric;
  const versions = [...policy.versions].reverse();

  return (
    <section className="card overflow-hidden" aria-label={`Chính sách ${policy.name}`}>
      <header className="px-space-md py-3 border-b border-border-subtle flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><h2 className="text-k-title-md">{policy.name}</h2><Chip color="status-active">Đang áp dụng {policy.current_version}</Chip></div>
          <p className="text-caption text-text-secondary"><span className="font-mono">{policy.policy_id}</span> • Lưu bởi {v.saved_by} lúc {fmtDateTime(v.saved_at)}</p>
        </div>
        {can('policy_write')
          ? <Link to={`/chinh-sach/${policy.policy_id}/sua`} className="btn-primary shrink-0"><Icon name="edit" />Chỉnh sửa</Link>
          : <button className="btn-primary shrink-0" disabled title="Chỉ Quản trị hệ thống được sửa"><Icon name="edit" />Chỉnh sửa</button>}
      </header>

      <div className="p-space-md grid grid-cols-2 gap-x-space-lg">
        <div>
          <h3 className="section-title mb-1">Phạm vi, không gian, thời gian</h3>
          <dl className="text-body-sm">
            <Row label="Đối tượng">{c.scope.subject_types.map((t) => <SubjectTypeChip key={t} type={t} className="mr-1" />)}</Row>
            <Row label="Đơn vị">{c.scope.org_units.map(unitName).join(', ')}</Row>
            <Row label="Khu vực kiểm soát"><span className="font-mono">{c.spatial.zones.join(', ')}</span></Row>
            <Row label="Khung thời gian">{timeWindowText(c.spatial.time_window)}</Row>
          </dl>
        </div>
        <div>
          <h3 className="section-title mb-1">Thông số sinh trắc</h3>
          <dl className="text-body-sm">
            <Row label="Nguồn chấp nhận"><div className="flex flex-wrap gap-1">{b.accepted_sources.map((s) => <SourceBadge key={s} source={s} />)}</div></Row>
            <Row label="Số tư thế">{b.pose_count}</Row>
            <Row label="Chất lượng ảnh tối thiểu">{b.min_quality}/100</Row>
            <Row label="AI tự duyệt">{b.ai_auto_approve_enabled ? <>Bật, từ <b>{b.ai_auto_approve_threshold}%</b></> : 'Tắt, mọi hồ sơ do người duyệt'}</Row>
            <Row label="Chụp lại">{b.rescan_validity_hours} giờ, {b.rescan_max_uses} lần, qua {valueText('biometric.rescan_channels', b.rescan_channels)}</Row>
          </dl>
        </div>
        <div className="col-span-2 mt-space-md">
          <h3 className="section-title mb-2">Luồng phê duyệt và sự kiện gửi ra ngoài</h3>
          <div className="flex items-center gap-2 flex-wrap text-body-sm mb-3">
            <span className="px-2.5 py-1.5 rounded bg-surface-container-low">Người gửi yêu cầu</span>
            {c.workflow.approval_chain.map((s) => (<span key={s.id} className="flex items-center gap-2"><Icon name="arrow_forward" size={16} className="text-text-secondary" /><span className="px-2.5 py-1.5 rounded border border-primary-container/40 bg-primary-fixed text-primary-container font-medium">{s.label}</span></span>))}
            <Icon name="arrow_forward" size={16} className="text-text-secondary" /><span className="px-2.5 py-1.5 rounded bg-status-active/10 text-status-active">Hoàn tất</span>
            {c.workflow.revoke_two_person && <Chip color="status-pending" icon="group" className="ml-2">Thu hồi cần 2 người</Chip>}
            <span className="text-caption text-text-secondary ml-2">Xóa dữ liệu trong {c.workflow.retention_days_after_withdraw} ngày sau khi rút đồng ý</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.triggers.map((t) => (
              <span key={t.id} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-caption ${t.enabled ? 'border-border-strong' : 'border-border-subtle text-text-secondary line-through'}`}>
                <Icon name={TRIGGER_TARGET[t.target].icon} size={14} />{TRIGGER_SHORT[t.id]}<span className="font-mono text-text-secondary">{transportLabel(t.transport)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <PolicyRules key={policy.policy_id} policy={policy} all={rules} zones={c.spatial.zones} />

      <div className="border-t border-border-subtle">
        <h3 className="section-title px-space-md pt-3 pb-2">Lịch sử phiên bản</h3>
        <ol className="divide-y divide-border-subtle">
          {versions.map((ver, i) => {
            const prev = policy.versions[policy.versions.length - 2 - i];
            const changes = prev ? diffConfig(prev.config, ver.config) : [];
            const isCur = ver.version === policy.current_version;
            const open = openVer === ver.version;
            return (
              <li key={ver.version} className="px-space-md py-2.5">
                <div className="flex items-start gap-3">
                  <span className={`font-mono text-label-md w-12 shrink-0 ${isCur ? 'text-primary-container font-semibold' : 'text-text-secondary'}`}>{ver.version}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm">{ver.reason}</p>
                    <p className="text-caption text-text-secondary">{ver.saved_by} • {fmtDateTime(ver.saved_at)}{prev && <> • {changes.length} thay đổi so với {prev.version}</>}</p>
                    {open && changes.length > 0 && (
                      <table className="mt-2 w-full text-caption border border-border-subtle rounded">
                        <thead><tr className="bg-surface-container-low text-text-secondary"><th className="text-left px-2 py-1 font-medium">Trường</th><th className="text-left px-2 py-1 font-medium">Trước ({prev.version})</th><th className="text-left px-2 py-1 font-medium">Sau ({ver.version})</th></tr></thead>
                        <tbody>{changes.map((d) => <tr key={d.path} className="border-t border-border-subtle align-top"><td className="px-2 py-1">{fieldLabel(d.path)}</td><td className="px-2 py-1 text-status-rejected">{valueText(d.path, d.from)}</td><td className="px-2 py-1 text-status-active">{valueText(d.path, d.to)}</td></tr>)}</tbody>
                      </table>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isCur && <Chip color="status-active">Hiện hành</Chip>}
                    {prev && <button className="btn-outline btn-sm" aria-expanded={open} onClick={() => setOpenVer(open ? null : ver.version)}>{open ? 'Ẩn thay đổi' : 'Xem thay đổi'}</button>}
                    {!isCur && can('policy_write') && <button className="btn-outline btn-sm" onClick={() => setRollback(ver.version)}><Icon name="history" size={16} />Khôi phục</button>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ConfirmReason open={!!rollback} onClose={() => setRollback(null)} title={`Khôi phục cấu hình ${rollback}`} subtitle={`${policy.policy_id} • ${policy.name}`} confirmLabel="Khôi phục"
        onConfirm={async (reason) => {
          try { const r = await call(rollbackPolicy, policy.policy_id, rollback, reason); toast('Đã khôi phục', `Tạo phiên bản ${r.version} mang cấu hình ${rollback}. Phiên bản cũ vẫn được giữ.`, 'success'); } catch (e) { toast('Không khôi phục được', e.message, 'error'); }
          setRollback(null);
        }}>
        <Banner>Khôi phục không ghi đè lịch sử: hệ thống tạo phiên bản mới mang cấu hình của {rollback}.</Banner>
      </ConfirmReason>
    </section>
  );
}

const MODE_CHIP = { active: ['status-active', 'Đang chạy'], shadow: ['secondary', 'Chạy bóng'], off: ['status-inactive', 'Tắt'] };

/** Quy tắc sự kiện áp dụng cho nhóm đối tượng của chính sách này: gắn, gỡ, loại trừ ngay tại đây. */
function PolicyRules({ policy, all, zones }) {
  const { can, log, toast } = useApp();
  const id = policy.policy_id;
  const write = can('policy_write');
  const [ask, setAsk] = useState(null); // { kind: 'attach' | 'detach' | 'exclude' | 'include', rule }
  const [picked, setPicked] = useState([]);
  const applied = rulesForPolicy(all, id);
  const own = applied.filter((r) => Array.isArray(r.policies));
  const shared = applied.filter((r) => r.policies === 'ALL');
  const excluded = excludedFor(all, id);
  const candidates = all.filter((r) => Array.isArray(r.policies) && !r.policies.includes(id));
  const anonymous = all.filter((r) => r.policies === 'NONE');
  const noWrite = write ? undefined : 'Chỉ Quản trị hệ thống được thay đổi';

  const done = (msg, detail) => { log(`${msg} — ${detail}`, id); toast(msg, `${policy.name} (${id})`, 'success'); setAsk(null); setPicked([]); };
  const confirm = (reason) => {
    const r = ask.rule;
    if (ask.kind === 'attach') {
      if (!picked.length) { toast('Chưa chọn quy tắc', 'Chọn ít nhất một quy tắc để gắn.', 'error'); return; }
      picked.forEach((x) => attachRule(x, id));
      done(`Đã gắn ${picked.length} quy tắc`, `Gắn ${picked.join(', ')} vào ${id}: ${reason}`);
    } else if (ask.kind === 'detach') { detachRule(r.id, id); done(`Đã gỡ ${r.id}`, `Gỡ ${r.id} khỏi ${id}: ${reason}`); }
    else if (ask.kind === 'exclude') { excludeRule(r.id, id); done(`Đã loại trừ ${r.id}`, `Loại trừ ${id} khỏi ${r.id}: ${reason}`); }
    else { includeRule(r.id, id); done(`Đã áp dụng lại ${r.id}`, `Bỏ loại trừ ${id} khỏi ${r.id}: ${reason}`); }
  };

  const row = (r, action) => (
    <li key={r.id} className="px-space-md py-2.5 flex items-start gap-3">
      <span className="font-mono text-caption text-text-secondary w-14 shrink-0 pt-0.5">{r.id}</span>
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium flex items-center gap-1.5">{r.type === 'realtime' && <Icon name="bolt" size={16} className="text-status-rejected" />}{r.name}</div>
        <div className="text-caption text-text-secondary">{r.space} • {r.time} → {r.action}</div>
      </div>
      <Chip color={MODE_CHIP[r.mode][0]}>{MODE_CHIP[r.mode][1]}</Chip>
      {action}
    </li>
  );
  const btn = (label, icon, kind, r) => <button className="btn-outline btn-sm shrink-0" disabled={!write} title={noWrite} onClick={() => setAsk({ kind, rule: r })}><Icon name={icon} size={16} />{label}</button>;
  const title = ask && { attach: 'Gắn quy tắc vào chính sách', detach: `Gỡ ${ask.rule?.id} khỏi chính sách`, exclude: `Loại trừ chính sách khỏi ${ask.rule?.id}`, include: `Áp dụng lại ${ask.rule?.id}` }[ask.kind];

  return (
    <div className="border-t border-border-subtle">
      <div className="px-space-md pt-3 pb-1 flex flex-col gap-2">
        <div>
          <h3 className="section-title">Quy tắc sự kiện áp dụng ({applied.length})</h3>
          <p className="text-caption text-text-secondary">Chính sách quyết định ai có Face ID và mẫu khuôn mặt được nạp xuống khu vực nào (<span className="font-mono">{zones.join(', ')}</span>). Quy tắc quyết định hệ thống làm gì khi nhận diện được họ ở đó.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-outline btn-sm" disabled={!write || !candidates.length} title={noWrite || (!candidates.length ? 'Mọi quy tắc riêng đã được gắn' : undefined)} onClick={() => { setPicked([]); setAsk({ kind: 'attach' }); }}><Icon name="add_link" size={16} />Gắn quy tắc có sẵn</button>
          {write
            ? <Link to={`/chinh-sach?tab=rules&policy=${id}&new=1`} className="btn-outline btn-sm"><Icon name="add" size={16} />Tạo quy tắc mới</Link>
            : <button className="btn-outline btn-sm" disabled title={noWrite}><Icon name="add" size={16} />Tạo quy tắc mới</button>}
          <Link to={`/chinh-sach?tab=rules&policy=${id}`} className="btn-outline btn-sm"><Icon name="rule" size={16} />Xem trong Quy tắc sự kiện</Link>
        </div>
      </div>
      {!write && <p className="px-space-md text-caption text-text-secondary flex items-center gap-1"><Icon name="lock" size={14} />Chỉ xem. Đổi sang vai trò Quản trị hệ thống để gắn, gỡ hoặc loại trừ quy tắc.</p>}

      {applied.length === 0 && <p className="px-space-md py-2 text-body-sm text-text-secondary">Chưa có quy tắc nào. Người thuộc chính sách này chỉ được nhận diện để mở cửa, không có điểm danh hay cảnh báo.</p>}
      {own.length > 0 && <><p className="px-space-md pt-1 text-caption font-semibold text-text-secondary">Riêng cho chính sách này</p><ul className="divide-y divide-border-subtle">{own.map((r) => row(r, btn('Gỡ', 'link_off', 'detach', r)))}</ul></>}
      {shared.length > 0 && <><p className="px-space-md pt-2 text-caption font-semibold text-text-secondary">Áp dụng cho mọi chính sách</p><ul className="divide-y divide-border-subtle">{shared.map((r) => row(r, btn('Loại trừ', 'block', 'exclude', r)))}</ul></>}
      {excluded.length > 0 && <><p className="px-space-md pt-2 text-caption font-semibold text-text-secondary">Đã loại trừ khỏi chính sách này</p><ul className="divide-y divide-border-subtle opacity-75">{excluded.map((r) => row(r, btn('Áp dụng lại', 'undo', 'include', r)))}</ul></>}
      <div className="h-2" />

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} danger={ask?.kind === 'detach' || ask?.kind === 'exclude'} title={title} subtitle={`${policy.name} (${id})`}
        confirmLabel={ask?.kind === 'attach' ? `Gắn ${picked.length || ''} quy tắc` : ask?.kind === 'detach' ? 'Gỡ' : ask?.kind === 'exclude' ? 'Loại trừ' : 'Áp dụng lại'} onConfirm={confirm}>
        {ask?.kind === 'attach' && (
          <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
            {candidates.map((r) => {
              const on = picked.includes(r.id);
              return (
                <button key={r.id} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== r.id) : [...p, r.id]))}
                  className={`text-left p-2.5 rounded border flex items-start gap-2 ${on ? 'border-primary-container bg-primary-fixed' : 'border-border-subtle hover:bg-surface-container-low'}`}>
                  <Icon name={on ? 'check_box' : 'check_box_outline_blank'} size={18} className={on ? 'text-primary-container' : 'text-text-secondary'} />
                  <span className="flex-1 min-w-0">
                    <span className="text-body-sm font-medium"><span className="font-mono text-caption text-text-secondary mr-1.5">{r.id}</span>{r.name}</span>
                    <span className="block text-caption text-text-secondary">{r.space} • {r.time}{r.policies.length ? ` • đang áp dụng cho ${r.policies.join(', ')}` : ' • chưa gắn chính sách nào'}</span>
                  </span>
                  <Chip color={MODE_CHIP[r.mode][0]}>{MODE_CHIP[r.mode][1]}</Chip>
                </button>
              );
            })}
            {anonymous.length > 0 && <p className="text-caption text-text-secondary mt-1">Không gắn được: {anonymous.map((r) => r.id).join(', ')} vì không dựa trên hồ sơ Face ID (người lạ, đếm ẩn danh, khuôn mặt không khớp).</p>}
          </div>
        )}
        {ask?.kind === 'detach' && ask.rule.policies.length === 1 && <Banner tone="warn">{ask.rule.id} chỉ đang áp dụng cho chính sách này. Sau khi gỡ, quy tắc không còn áp dụng cho ai và tự chuyển sang Tắt.</Banner>}
        {(ask?.kind === 'detach' || ask?.kind === 'exclude') && ask.rule.type === 'realtime' && <Banner tone="danger">Đây là cảnh báo an ninh thời gian thực. Người thuộc {policy.name} sẽ không còn kích hoạt còi và báo an ninh theo quy tắc này.</Banner>}
        {ask?.kind === 'include' && <Banner>Người thuộc {policy.name} sẽ lại chịu quy tắc {ask.rule.id} như mọi chính sách khác.</Banner>}
      </ConfirmReason>
    </div>
  );
}
