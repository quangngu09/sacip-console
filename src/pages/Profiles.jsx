import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AiCard, Banner, Chip, ConfirmReason, DataBoundary, Drawer, Empty, FaceThumb, Icon, PageHeader, ScoreBar, SearchInput, Select, SortTh, SourceBadge, StateBadge, SubjectTypeChip, Tabs, useCountdown, useSort } from '../components/ui';
import { useApp } from '../store';
import { bulkAction, createRequest, policyFor, requestOriginalImage, setValidity } from '../api/client';
import { REQUEST_STATUS, REQUEST_TYPE, SOURCE, STATE, SUBJECT_TYPE, consentLabel, stateMeta } from '../api/enums';
import { fmtDateTime, fmtNumber, fmtRelative } from '../lib/format';
import { unitName } from '../lib/scope';

/** Dòng ngữ cảnh thay đổi theo loại đối tượng (Đặc tả IAM §2.2: sinh viên có khoa/lớp, nhà thầu có hợp đồng). */
export const contextLine = (s) => {
  const c = s.context;
  return {
    STUDENT: `${unitName(s.org_unit)} • Lớp ${c.class}`,
    STAFF: `${c.role_title}, ${unitName(s.org_unit)}`,
    CONTRACTOR: `${c.company} • HĐ ${c.contract_no}, hết hạn ${c.contract_until}`,
    RESIDENT: `${c.building} ${c.room} • lưu trú đến ${c.stay_until}`,
    GUEST: `Bảo lãnh: ${c.host} • đến ${c.visit_until}`,
  }[s.subject_type];
};

const VIEWS = [
  { key: 'all', label: 'Tất cả', f: () => true },
  { key: 'not_collected', label: 'Chưa thu thập', f: (s) => ['NOT_STARTED', 'IN_PROGRESS'].includes(s.states.collection) },
  { key: 'consent', label: 'Chưa có đồng ý', f: (s) => s.states.consent !== 'ACTIVE', tone: 'status-pending' },
  { key: 'risk', label: 'Có cờ rủi ro', f: (s) => s.states.risk !== 'NONE', tone: 'status-rejected' },
  { key: 'request', label: 'Có yêu cầu mở', f: (s) => s.states.request === 'OPEN', tone: 'status-pending' },
  { key: 'expiring', label: 'Sắp hết hạn', f: (s) => s.states.validity === 'EXPIRING', tone: 'status-pending' },
];

const opts = (allLabel, entries) => [{ value: 'all', label: allLabel }, ...entries];
const TYPE_OPTIONS = opts('Mọi loại đối tượng', Object.entries(SUBJECT_TYPE).map(([value, m]) => ({ value, label: m.label })));
const SOURCE_OPTIONS = opts('Mọi nguồn', [...Object.entries(SOURCE).map(([value, m]) => ({ value, label: m.label })), { value: 'none', label: 'Chưa có nguồn' }]);
const dimOptions = (dim, all) => opts(all, Object.entries(STATE[dim].values).map(([value, m]) => ({ value, label: m.label })));
const VALIDITY_OPTIONS = dimOptions('validity', 'Mọi hiệu lực');
const CONSENT_OPTIONS = dimOptions('consent', 'Mọi trạng thái đồng ý');
const NO_FILTERS = { type: 'all', source: 'all', validity: 'all', consent: 'all' };
const SORTERS = { name: (s) => s.name, type: (s) => SUBJECT_TYPE[s.subject_type].label, score: (s) => s.ai_score, collection: (s) => s.states.collection, validity: (s) => s.states.validity, consent: (s) => s.states.consent };

const BULK = [
  { key: 'RESCAN', icon: 'replay', label: 'Yêu cầu chụp lại', perm: 'profile_write' },
  { key: 'ACTIVATE', icon: 'check_circle', label: 'Kích hoạt hiệu lực', perm: 'profile_write' },
  { key: 'REMIND', icon: 'forward_to_inbox', label: 'Nhắc thu thập', perm: 'profile_write' },
  { key: 'LOCK', icon: 'block', label: 'Khóa', danger: true, perm: 'lock' },
];

export default function Profiles() {
  const { data, call, toast, can } = useApp();
  const subjects = data.subjects;
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [selected, setSelected] = useState(new Set());
  const [detailId, setDetailId] = useState(null);
  const [bulk, setBulk] = useState(null);

  const rows = useMemo(() => {
    const v = VIEWS.find((x) => x.key === view);
    const f = filters;
    const needle = q.trim().toLowerCase();
    return subjects.filter(v.f)
      .filter((s) => f.type === 'all' || s.subject_type === f.type)
      .filter((s) => f.source === 'all' || (f.source === 'none' ? !s.source : s.source === f.source))
      .filter((s) => f.validity === 'all' || s.states.validity === f.validity)
      .filter((s) => f.consent === 'all' || s.states.consent === f.consent)
      .filter((s) => !needle || `${s.code} ${s.name} ${s.email}`.toLowerCase().includes(needle));
  }, [subjects, view, q, filters]);
  const table = useSort(rows, SORTERS);
  const tabs = VIEWS.map((v) => ({ ...v, count: fmtNumber(subjects.filter(v.f).length) }));
  const canReset = view !== 'all' || !!q || Object.values(filters).some((x) => x !== 'all');
  const reset = () => { setFilters(NO_FILTERS); setView('all'); setQ(''); };
  const setFilter = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.subject_id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.subject_id)));
  const detail = subjects.find((s) => s.subject_id === detailId);
  const blockedInSelection = subjects.filter((s) => selected.has(s.subject_id) && s.states.consent !== 'ACTIVE');

  const runBulk = async (reason) => {
    try {
      const r = await call(bulkAction, [...selected], bulk.key, reason);
      if (r.done.length) toast(bulk.label, `Đã áp dụng cho ${r.done.length} hồ sơ và ghi nhật ký kiểm toán.`, 'success');
      if (r.skipped.length) toast(`Bỏ qua ${r.skipped.length} hồ sơ`, r.skipped.map((x) => `${x.code}: ${x.why}`).join(' • '), 'warn');
    } catch (e) { toast('Không thực hiện được', e.message, 'error'); }
    setBulk(null);
    setSelected(new Set());
  };

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Hồ sơ định danh" desc="Một bảng cho mọi đối tượng: sinh viên, cán bộ, nhà thầu, cư dân KTX, khách. Năm trạng thái được theo dõi riêng."
        actions={<Link to="/tich-hop" className="btn-outline"><Icon name="sync" />Nguồn dữ liệu</Link>} />

      <DataBoundary name="profiles" label="danh sách hồ sơ" fill>
        <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
          <Tabs label="Nhóm hồ sơ" className="px-2 border-b border-border-subtle shrink-0" value={view} onChange={setView} items={tabs} />

          {selected.size > 0 ? (
            <div className="min-h-[64px] px-3 py-2 bg-primary-fixed border-b border-border-subtle flex items-center gap-2 shrink-0 anim-fade flex-wrap" role="region" aria-label="Thao tác hàng loạt">
              <span className="text-label-md font-semibold text-primary-container mr-2 whitespace-nowrap">Đã chọn {selected.size} hồ sơ</span>
              {BULK.filter((b) => can(b.perm)).map((b) => <button key={b.key} onClick={() => setBulk(b)} className={`${b.danger ? 'btn-danger' : 'btn-outline'} btn-sm`}><Icon name={b.icon} size={16} />{b.label}</button>)}
              {blockedInSelection.length > 0 && <span className="text-caption text-status-pending flex items-center gap-1"><Icon name="lock" size={14} />{blockedInSelection.length} hồ sơ chưa có đồng ý sẽ bị bỏ qua</span>}
              <button onClick={() => setSelected(new Set())} className="btn-sm btn ml-auto text-text-secondary hover:bg-surface-container"><Icon name="close" size={16} />Bỏ chọn</button>
            </div>
          ) : (
            <div className="min-h-[64px] px-3 py-3 border-b border-border-subtle flex items-center gap-2 shrink-0">
              <SearchInput className="flex-1 min-w-[180px] max-w-xs" value={q} onChange={setQ} placeholder="Tìm theo mã, tên, email" />
              <Select className="!w-[170px]" label="Loại đối tượng" value={filters.type} options={TYPE_OPTIONS} onChange={setFilter('type')} />
              <Select className="!w-[160px]" label="Nguồn Face ID" value={filters.source} options={SOURCE_OPTIONS} onChange={setFilter('source')} />
              <Select className="!w-[150px]" label="Hiệu lực" value={filters.validity} options={VALIDITY_OPTIONS} onChange={setFilter('validity')} />
              <Select className="!w-[180px]" label="Đồng ý" value={filters.consent} options={CONSENT_OPTIONS} onChange={setFilter('consent')} />
              {canReset && <button className="btn text-text-secondary hover:bg-surface-container-low" onClick={reset}><Icon name="restart_alt" size={16} />Đặt lại</button>}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 w-12 !px-2"><label className="w-8 h-8 flex items-center justify-center cursor-pointer"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-primary-container" aria-label="Chọn tất cả" /></label></th>
                  <SortTh k="name" table={table} className="sticky top-0 left-12 z-20 min-w-[210px]">Họ tên và mã</SortTh>
                  <SortTh k="type" table={table} className="sticky top-0 z-10">Loại và ngữ cảnh</SortTh>
                  <SortTh k="consent" table={table} className="sticky top-0 z-10">Đồng ý</SortTh>
                  <SortTh k="collection" table={table} className="sticky top-0 z-10">Thu thập</SortTh>
                  <SortTh k="validity" table={table} className="sticky top-0 z-10">Hiệu lực</SortTh>
                  <th className="sticky top-0 z-10">Yêu cầu</th>
                  <th className="sticky top-0 z-10">Rủi ro</th>
                  <th className="sticky top-0 z-10">Nguồn</th>
                  <SortTh k="score" table={table} className="sticky top-0 z-10 hidden min-[1500px]:table-cell">Điểm AI</SortTh>
                  <th className="sticky top-0 right-0 z-20 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.sorted.map((s) => (
                  <tr key={s.subject_id} onClick={() => setDetailId(s.subject_id)} className={`h-14 cursor-pointer transition-colors ${selected.has(s.subject_id) ? 'bg-primary-fixed' : 'bg-surface hover:bg-surface-container-low'}`}>
                    <td className="sticky left-0 z-[5] bg-inherit !px-2" onClick={(e) => e.stopPropagation()}><label className="w-8 h-8 flex items-center justify-center cursor-pointer"><input type="checkbox" checked={selected.has(s.subject_id)} onChange={() => toggle(s.subject_id)} className="w-4 h-4 accent-primary-container" aria-label={`Chọn ${s.code}`} /></label></td>
                    <td className="sticky left-12 z-[5] bg-inherit">
                      <div className="flex items-center gap-space-sm">
                        <FaceThumb seed={s.seed} missing={!s.poses.length} />
                        <div className="min-w-0"><div className="text-label-md font-semibold whitespace-nowrap">{s.name}</div><div className="text-caption font-mono text-text-secondary whitespace-nowrap">{s.code}</div></div>
                      </div>
                    </td>
                    <td><SubjectTypeChip type={s.subject_type} /><div className="text-caption text-text-secondary mt-0.5 max-w-[210px] truncate" title={contextLine(s)}>{contextLine(s)}</div></td>
                    <td className="whitespace-nowrap">
                      <StateBadge dim="consent" value={s.states.consent} label={consentLabel(s)} />
                      {s.states.consent === 'ACTIVE' && s.consent_version !== 'v1.2' && <div className="text-caption text-status-pending">Điều khoản cũ</div>}
                      {s.states.consent !== 'ACTIVE' && <div className="text-caption text-text-secondary flex items-center gap-1"><Icon name="lock" size={12} />Khóa sinh trắc</div>}
                    </td>
                    <td className="whitespace-nowrap"><StateBadge dim="collection" value={s.states.collection} /></td>
                    <td className="whitespace-nowrap"><StateBadge dim="validity" value={s.states.validity} />{s.valid_until && ['ACTIVE', 'EXPIRING'].includes(s.states.validity) && <div className="text-caption text-text-secondary">đến {s.valid_until}</div>}</td>
                    <td className="whitespace-nowrap"><StateBadge dim="request" value={s.states.request} /></td>
                    <td className="whitespace-nowrap"><StateBadge dim="risk" value={s.states.risk} />{s.risk_flags[0] && <div className="text-caption text-text-secondary max-w-[150px] truncate" title={s.risk_flags.join('; ')}>{s.risk_flags[0]}</div>}</td>

                    <td title={s.source ? `${s.poses.length} tư thế` : undefined}><SourceBadge source={s.source} /></td>
                    <td className="whitespace-nowrap hidden min-[1500px]:table-cell"><ScoreBar value={s.ai_score} /></td>
                    <td className="sticky right-0 z-[5] bg-inherit text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-outline btn-sm" aria-label={`Xem chi tiết ${s.name}`} onClick={() => setDetailId(s.subject_id)}>Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="flex flex-col items-center">
                <Empty icon="search_off" title="Không có hồ sơ phù hợp" desc="Thử bỏ bớt bộ lọc." />
                {canReset && <button className="btn-outline -mt-6 mb-8" onClick={reset}>Đặt lại bộ lọc</button>}
              </div>
            )}
          </div>

          <div className="h-12 px-space-md border-t border-border-subtle flex items-center justify-between text-body-sm text-text-secondary shrink-0">
            <span aria-live="polite">Hiển thị <b className="text-text-primary font-medium">{rows.length}</b> / {subjects.length} hồ sơ mẫu <span className="text-caption">(toàn hệ thống {fmtNumber(24850)})</span></span>
            <span className="text-caption">Dữ liệu giả lập qua src/api/client.js</span>
          </div>
        </div>
      </DataBoundary>

      {detail && <ProfileDrawer s={detail} onClose={() => setDetailId(null)} />}
      <ConfirmReason open={!!bulk} onClose={() => setBulk(null)} onConfirm={runBulk} danger={bulk?.danger}
        title={bulk?.label} subtitle={`Áp dụng cho ${selected.size} hồ sơ đã chọn`} confirmLabel="Xác nhận áp dụng">
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm">Danh sách: <span className="font-mono text-caption">{subjects.filter((s) => selected.has(s.subject_id)).map((s) => s.code).join(', ')}</span></div>
        {blockedInSelection.length > 0 && bulk?.key !== 'LOCK' && <Banner tone="warn" icon="lock">{blockedInSelection.map((s) => s.code).join(', ')} chưa có đồng ý hợp lệ nên sẽ bị bỏ qua.</Banner>}
      </ConfirmReason>
    </div>
  );
}

const StateGrid = ({ s }) => (
  <dl className="grid grid-cols-5 gap-1.5">
    {Object.keys(STATE).map((dim) => {
      const m = stateMeta(dim, s.states[dim]);
      const bg = { 'status-active': 'bg-status-active/10', 'status-pending': 'bg-status-pending/10', 'status-rejected': 'bg-status-rejected/10', 'status-inactive': 'bg-surface-container-low' }[m.color];
      return (
        <div key={dim} className={`p-2 rounded ${bg}`}>
          <dt className="text-caption text-text-secondary">{STATE[dim].title}</dt>
          <dd className={`text-label-sm font-semibold text-${m.color}`}>{dim === 'consent' ? consentLabel(s) : m.label}</dd>
        </div>
      );
    })}
  </dl>
);

function ProfileDrawer({ s, onClose }) {
  const { data, call, toast, can, log } = useApp();
  const [ask, setAsk] = useState(null);
  const [signed, setSigned] = useState(null);
  const left = useCountdown(signed?.expires_at, () => setSigned(null));
  const revealed = !!signed && left > 0;
  const pol = policyFor(s.subject_type);
  const consentOk = s.states.consent === 'ACTIVE';
  const history = data.requests.filter((r) => r.subject_id === s.subject_id);
  const locked = ['LOCKED', 'REVOKED'].includes(s.states.validity);
  const writable = can('profile_write');
  const scoreColor = (x) => (x >= 85 ? 'text-status-active' : x >= 70 ? 'text-status-pending' : 'text-status-rejected');

  const act = async (kind, reason) => {
    try {
      if (kind === 'reveal') { setSigned(await call(requestOriginalImage, s.subject_id, reason)); toast('Đã mở ảnh gốc trong 60 giây', 'Lượt xem đã ghi nhật ký với mã VIEW_ORIGINAL_IMAGE.', 'warn'); }
      if (kind === 'lock' || kind === 'unlock' || kind === 'activate') {
        const r = await call(setValidity, s.subject_id, kind.toUpperCase(), reason);
        toast({ lock: 'Đã khóa hồ sơ', unlock: 'Đã mở khóa hồ sơ', activate: 'Đã kích hoạt hiệu lực' }[kind], r.event ? `Đã gửi cập nhật tới ${r.event.payload.devices} thiết bị kiểm soát ra vào.` : s.code, 'success');
      }
      if (kind === 'revoke') { const r = await call(createRequest, s.subject_id, 'REVOKE', reason); toast('Đã tạo yêu cầu thu hồi', `${r.request_id} cần ${r.two_person ? '2 cán bộ' : 'người duyệt'} xác nhận.`, 'warn'); }
      if (kind === 'rescan') { const r = await call(createRequest, s.subject_id, 'RESCAN', reason); toast('Đã tạo yêu cầu chụp lại', `${r.request_id} đã vào Hộp yêu cầu.`, 'success'); }
      if (kind === 'reconsent') { log(`Gửi yêu cầu xác nhận điều khoản v1.2 — ${reason}`, s.code, 'CONSENT_RECONFIRM_REQUESTED'); toast('Đã gửi yêu cầu xác nhận', `${s.name} sẽ nhận thông báo trên App MyDaiNam.`, 'success'); }
    } catch (e) { toast('Không thực hiện được', e.message, 'error'); }
    setAsk(null);
  };

  return (
    <Drawer open onClose={onClose} width={560}>
      <div className="px-space-md py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h2 className="text-k-title-md truncate">{s.name}</h2><SubjectTypeChip type={s.subject_type} /></div>
            <div className="text-caption text-text-secondary"><span className="font-mono">{s.code}</span> • {s.email}</div>
            <div className="text-caption text-text-secondary">{contextLine(s)}</div>
          </div>
          <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center text-text-secondary hover:bg-surface-container-low shrink-0" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <div className="mt-2.5"><StateGrid s={s} /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-md">
        {!consentOk && (
          <Banner tone="danger" icon="lock" title="Chưa có xác nhận đồng ý hợp lệ."
            action={s.states.consent === 'PENDING' && writable && <button className="btn-outline btn-sm" onClick={() => setAsk('reconsent')}>Gửi yêu cầu xác nhận</button>}>
            Mọi thao tác sinh trắc (xem ảnh, chụp lại, kích hoạt) bị khóa cho đến khi {s.name} xác nhận điều khoản v1.2.
          </Banner>
        )}
        {consentOk && s.consent_version !== 'v1.2' && <Banner tone="warn">Đang đồng ý theo điều khoản cũ {s.consent_version}. Mục đích mới (phát hành thẻ) chưa được phép cho đến khi xác nhận v1.2.</Banner>}
        {s.ai_hint && <AiCard><p className="text-body-sm">{s.ai_hint}</p></AiCard>}

        <section>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-headline-md">Ảnh khuôn mặt <span className="font-normal text-caption text-text-secondary">{s.poses.length}/{pol.config.biometric.pose_count} tư thế theo {pol.policy_id} {pol.version}</span></h3>
            {s.poses.length > 0 && (revealed
              ? <button className="btn-outline btn-sm" onClick={() => setSigned(null)}><Icon name="visibility_off" size={16} />Làm mờ lại ({left} giây)</button>
              : <button className="btn-outline btn-sm" disabled={!consentOk || !can('view_original')} title={!consentOk ? 'Chưa có đồng ý hợp lệ' : !can('view_original') ? 'Vai trò hiện tại không được xem ảnh gốc' : undefined} onClick={() => setAsk('reveal')}><Icon name="visibility" size={16} />Xem ảnh gốc (ghi nhật ký)</button>)}
          </div>
          {s.poses.length === 0 ? <p className="text-body-sm text-text-secondary">Chưa có ảnh.</p> : (
            <div className="grid grid-cols-3 gap-2">
              {s.poses.map((p, i) => (
                <div key={p.name} className="p-2 rounded-lg border border-border-subtle flex flex-col items-center text-center">
                  <FaceThumb seed={s.seed + i * 0.15} size={88} round={false} revealed={revealed} />
                  <span className="text-caption font-medium mt-1">{p.name}</span>
                  <span className={`text-caption ${scoreColor(p.score)}`}>{p.score}/100</span>
                </div>
              ))}
            </div>
          )}
          {revealed && (
            <div className="mt-2 p-2 rounded bg-status-pending/10 text-caption flex flex-col gap-0.5">
              <span className="text-status-pending font-medium">Link ký có thời hạn, tự hết hiệu lực sau {left} giây</span>
              <code className="font-mono break-all text-text-secondary">{signed.signed_url}</code>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-headline-md mb-2">Nguồn và kết quả kiểm tra</h3>
          <dl className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-surface-bright"><dt className="text-caption text-text-secondary">Nguồn</dt><dd className="mt-0.5"><SourceBadge source={s.source} poses={s.source && s.poses.length} /></dd></div>
            <div className="p-2.5 rounded-lg bg-surface-bright"><dt className="text-caption text-text-secondary">Điểm AI</dt><dd className={`font-semibold ${s.ai_score != null ? scoreColor(s.ai_score) : ''}`}>{s.ai_score != null ? `${s.ai_score}/100` : '—'}</dd></div>
            <div className="p-2.5 rounded-lg bg-surface-bright"><dt className="text-caption text-text-secondary">Ngưỡng tự duyệt</dt><dd className="font-semibold">{pol.config.biometric.ai_auto_approve_enabled ? `${pol.config.biometric.ai_auto_approve_threshold}%` : 'Tắt'}</dd></div>
          </dl>
          {s.risk_flags.length > 0 && <ul className="mt-2 flex flex-col gap-1">{s.risk_flags.map((f) => <li key={f} className="text-body-sm text-status-rejected flex items-center gap-1.5"><Icon name="flag" size={16} />{f}</li>)}</ul>}
        </section>

        {s.rescan_grant && s.states.request === 'RESCAN_GRANTED' && (
          <Banner icon="replay" title="Đang được phép chụp lại.">Qua {s.rescan_grant.channels.map((c) => (c === 'APP' ? 'App MyDaiNam' : 'Kiosk')).join(', ')}, còn {s.rescan_grant.uses_left} lần, hết hạn {fmtDateTime(s.rescan_grant.expires_at)} ({fmtRelative(s.rescan_grant.expires_at)}).</Banner>
        )}

        <section>
          <h3 className="text-headline-md mb-1">Tra soát khiếu nại</h3>
          <p className="text-caption text-text-secondary mb-2">Tín hiệu Wi-Fi và beacon gần nhất, dùng khi trả lời “tại sao không nhận diện được”.</p>
          {s.bssid_metadata ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-body-sm p-3 rounded bg-surface-bright">
              <div><dt className="text-caption text-text-secondary">Vị trí</dt><dd>{s.bssid_metadata.location}</dd></div>
              <div><dt className="text-caption text-text-secondary">Thời điểm</dt><dd>{fmtDateTime(s.bssid_metadata.seen_at)} ({fmtRelative(s.bssid_metadata.seen_at)})</dd></div>
              <div><dt className="text-caption text-text-secondary">Điểm phát Wi-Fi</dt><dd><span className="font-mono text-caption">{s.bssid_metadata.ap_name} • {s.bssid_metadata.bssid}</span></dd></div>
              <div><dt className="text-caption text-text-secondary">Cường độ, beacon</dt><dd><span className={s.bssid_metadata.rssi < -70 ? 'text-status-pending' : ''}>{s.bssid_metadata.rssi} dBm{s.bssid_metadata.rssi < -70 ? ' (yếu)' : ''}</span>{s.bssid_metadata.beacon && <> • {s.bssid_metadata.beacon}</>}</dd></div>
            </dl>
          ) : <p className="text-body-sm text-text-secondary">Chưa ghi nhận tín hiệu nào.</p>}
        </section>

        <section>
          <h3 className="text-headline-md mb-2">Yêu cầu liên quan</h3>
          {history.length === 0 ? <p className="text-body-sm text-text-secondary">Chưa có yêu cầu.</p> : (
            <ul className="flex flex-col divide-y divide-border-subtle border border-border-subtle rounded">
              {history.map((r) => (
                <li key={r.request_id} className="px-3 py-2 flex items-center gap-2 text-body-sm">
                  <span className="font-mono text-caption">{r.request_id}</span><span>{REQUEST_TYPE[r.request_type].label}</span>
                  <Chip color={REQUEST_STATUS[r.status].color} className="ml-auto">{REQUEST_STATUS[r.status].label}</Chip>
                  <Link to={`/yeu-cau?id=${r.request_id}`} className="text-primary-container text-caption hover:underline">Mở</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="p-space-md border-t border-border-subtle shrink-0">
        <div className="flex gap-2 flex-wrap">
          {locked
            ? <button className="btn-outline" disabled={!writable || !consentOk || s.states.validity === 'REVOKED'} onClick={() => setAsk('unlock')}><Icon name="lock_open" size={16} />Mở khóa</button>
            : <button className="btn-outline" disabled={!can('lock')} onClick={() => setAsk('lock')}><Icon name="lock" size={16} />Khóa</button>}
          {s.states.validity === 'PENDING_ACTIVATION' && <button className="btn-outline" disabled={!writable || !consentOk} onClick={() => setAsk('activate')}><Icon name="check_circle" size={16} />Kích hoạt</button>}
          <button className="btn-danger" disabled={!writable || s.states.validity === 'REVOKED'} onClick={() => setAsk('revoke')}><Icon name="cancel" size={16} />Thu hồi</button>
          <button className="btn-primary flex-1" disabled={!writable || !consentOk} onClick={() => setAsk('rescan')}><Icon name="add_task" size={16} />Tạo yêu cầu chụp lại</button>
        </div>
        <p className="text-caption text-text-secondary text-center mt-2">{writable ? 'Thao tác của cán bộ được ký số và ghi nhật ký.' : 'Vai trò hiện tại chỉ được xem.'}</p>
      </div>

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} onConfirm={(r) => act(ask, r)} danger={['revoke', 'lock'].includes(ask)}
        title={{ reveal: 'Xem ảnh gốc', lock: 'Khóa hồ sơ', unlock: 'Mở khóa hồ sơ', activate: 'Kích hoạt hiệu lực', revoke: 'Thu hồi quyền Face ID', rescan: 'Tạo yêu cầu chụp lại', reconsent: 'Gửi yêu cầu xác nhận điều khoản' }[ask]}
        subtitle={`${s.name} • ${s.code}`} minLength={ask === 'reveal' ? 5 : 10}>
        {ask === 'reveal' && <Banner tone="warn">Ảnh mở qua link có thời hạn 60 giây, sau đó tự làm mờ lại. Lượt xem được ghi bất biến với mã VIEW_ORIGINAL_IMAGE.</Banner>}
        {['lock', 'unlock', 'activate'].includes(ask) && <Banner>Quyền nhận diện tại cổng và camera thuộc {pol.config.spatial.zones.length} khu vực của {pol.policy_id} được cập nhật ngay.</Banner>}
        {ask === 'revoke' && <Banner tone="danger">{pol.config.workflow.revoke_two_person ? 'Thu hồi cần 2 cán bộ khác nhau xác nhận.' : 'Thu hồi cần người duyệt xác nhận.'} Yêu cầu sẽ chuyển sang Hộp yêu cầu.</Banner>}
        {ask === 'rescan' && <Banner>Khi được duyệt, {s.name} được chụp lại qua {pol.config.biometric.rescan_channels.map((c) => (c === 'APP' ? 'App MyDaiNam' : 'Kiosk')).join(', ')} trong {pol.config.biometric.rescan_validity_hours} giờ, {pol.config.biometric.rescan_max_uses} lần.</Banner>}
      </ConfirmReason>
    </Drawer>
  );
}
