import { useState } from 'react';
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

const current = (p) => p.versions.find((v) => v.version === p.current_version);

export default function Policies() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'biometric';
  return (
    <div>
      <PageHeader title="Chính sách & quy tắc" desc="Mọi tham số vận hành lấy từ đây; không cấu hình trong mã nguồn hay tệp .env. Mỗi lần lưu tạo một phiên bản mới." />
      <Tabs label="Loại cấu hình" className="mb-space-md border-b border-border-subtle" value={tab} onChange={(t) => setParams(t === 'biometric' ? {} : { tab: t })}
        items={[{ key: 'biometric', label: 'Chính sách sinh trắc' }, { key: 'rules', label: 'Quy tắc sự kiện' }]} />
      {tab === 'biometric' ? <BiometricPolicies /> : <EventRules />}
    </div>
  );
}

function BiometricPolicies() {
  const { data, can } = useApp();
  const [sel, setSel] = useState(data.policies[0].policy_id);
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
                </div>
              </button>
            );
          })}
        </nav>
        <PolicyDetail policy={policy} />
      </div>
    </DataBoundary>
  );
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 py-2 border-b border-border-subtle last:border-0">
    <dt className="text-text-secondary">{label}</dt><dd className="min-w-0">{children}</dd>
  </div>
);

function PolicyDetail({ policy }) {
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
