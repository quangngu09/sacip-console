import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Banner, Chip, ConfirmReason, DataBoundary, Empty, Icon, MetricStrip, PageHeader, SearchInput, Select, StateBadge, SubjectTypeChip, Tabs } from '../components/ui';
import { PurposesTab, RetentionTab } from './ConsentPurposes';
import { useApp } from '../store';
import { advanceErasure, exportAudit, requestReconsent, resolveAnomaly, verifyAuditChain } from '../api/client';
import { ACTION, ROLES, consentLabel } from '../api/enums';
import { fmtDateTime, fmtNumber, fmtPercent, fmtRelative } from '../lib/format';

export function AiMonitor() {
  const { data, call, toast, can } = useApp();
  const [closing, setClosing] = useState(null);
  const models = [
    ['Phát hiện khuôn mặt', 'SCRFD', 'Thiết bị xử lý tại phòng', '8,2 ms', '99,1%'],
    ['Nhận diện khuôn mặt', 'ArcFace buffalo_l', 'Thiết bị xử lý và máy chủ', '21 ms', '98,7%'],
    ['Kiểm tra chất lượng ảnh', 'Quality Gating v3.2', 'Máy chủ tiếp nhận', '6 ms', '—'],
    ['Kiểm tra người thật', 'Anti-Spoofing v3.2', 'Thiết bị xử lý, quầy đăng ký và cổng', '14 ms', '99,4%'],
    ['Tìm kiếm khuôn mặt', 'pgvector HNSW', 'Cơ sở dữ liệu', '9 ms', '—'],
  ];
  const bl = data.backlog;
  const autoRate = (bl.auto_approved_7d / (bl.auto_approved_7d + bl.manual_approved_7d)) * 100;
  const bias = data.anomalies;
  const spoofOpen = data.incidents.filter((e) => e.category === 'SPOOF' && e.state !== 'closed').length;
  const canClose = can('audit') || can('*');
  return (
    <div>
      <PageHeader title="Giám sát AI" desc="Theo dõi chất lượng và độ công bằng của mô hình. AI chỉ đưa gợi ý, không có quyền tự động từ chối hay thu hồi." />
      <DataBoundary name="models" label="dữ liệu mô hình AI" scopeNote="global" skeleton="metrics-table">
      <MetricStrip className="mb-space-md" items={[
        { label: 'Thời gian nhận diện', value: '38 ms', sub: 'Mục tiêu dưới 50 ms' },
        { label: 'Độ chính xác nhận diện', value: '98,7%', sub: 'Mục tiêu từ 98%' },
        { label: 'AI tự duyệt (7 ngày)', value: fmtPercent(autoRate), sub: `${fmtNumber(bl.auto_approved_7d)} tự duyệt • ${fmtNumber(bl.manual_approved_7d)} người duyệt` },
        { label: 'Ảnh bị loại vì chất lượng', value: '6,4%', sub: 'Chủ yếu do chói và nghiêng', alert: true },
        { label: 'Nghi giả mạo đang mở', value: String(spoofOpen), sub: can('security') ? 'Bấm để xem ở Sự cố an ninh' : 'Trực an ninh xử lý', to: can('security') ? '/soc?loai=SPOOF' : undefined, alert: spoofOpen > 0 },
      ]} />
      <div className="card overflow-x-auto mb-space-md">
        <table className="data-table">
          <thead><tr>{['Mô hình', 'Vị trí chạy', 'Thời gian xử lý', 'Độ chính xác', 'Trạng thái'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{models.map(([m, tech, w, l, a]) => (
            <tr key={m} className="h-14"><td><div className="font-medium">{m}</div><div className="text-caption font-mono text-text-secondary">{tech}</div></td><td>{w}</td><td className="tabular-nums">{l}</td><td className="tabular-nums">{a}</td><td><Chip color="status-active">Hoạt động</Chip></td></tr>
          ))}</tbody>
        </table>
      </div>
      <div className="grid grid-cols-12 gap-space-md items-start">
        <section className="col-span-7 card overflow-hidden">
          <h2 className="text-headline-md px-space-md pt-3">Cảnh báo lệch chuẩn</h2>
          <p className="px-space-md pb-2 text-caption text-text-secondary">AI chấm điểm không đều giữa các điều kiện chụp, thiết bị hoặc nhóm đối tượng. Không dùng thuộc tính nhân khẩu học.</p>
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {bias.length === 0 && <li className="px-space-md py-3 text-body-sm text-text-secondary">Không có cảnh báo.</li>}
            {bias.map((a) => (
              <li key={a.id} className={`px-space-md py-2.5 flex gap-2.5 ${a.status === 'RESOLVED' ? 'opacity-70' : ''}`}>
                <Icon name="balance" size={18} className={a.severity === 'HIGH' ? 'text-status-rejected mt-0.5' : 'text-status-pending mt-0.5'} />
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-semibold">{a.title}</div>
                  <div className="text-caption text-text-secondary">{a.detail}</div>
                  {a.status === 'RESOLVED'
                    ? <div className="text-caption text-status-active mt-0.5">Đã đóng bởi {a.resolved_by}: {a.resolution}</div>
                    : canClose && <button className="mt-1 text-caption text-primary-container hover:underline" onClick={() => setClosing(a)}>Đóng cảnh báo</button>}
                </div>
                <div className="text-right shrink-0"><Chip color={a.status === 'RESOLVED' ? 'status-active' : 'secondary'}>{a.status === 'RESOLVED' ? 'Đã đóng' : 'Đang mở'}</Chip><div className="font-mono text-caption text-text-secondary mt-1">{a.ref}</div></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="col-span-5 card p-space-md">
          <h2 className="text-headline-md mb-2">Nguyên nhân ảnh bị loại (7 ngày)</h2>
          {[['Chói, phản quang', 41], ['Góc nghiêng trên 20°', 27], ['Thiếu sáng', 14], ['Bị che (khẩu trang, kính)', 11], ['Nghi giả mạo (ảnh in, màn hình)', 7]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-3 py-1.5 text-body-sm"><span className="w-48 shrink-0">{l}</span><div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${v * 2}%` }} /></div><span className="w-10 text-right tabular-nums">{v}%</span></div>
          ))}
        </section>
      </div>
      </DataBoundary>
      <ConfirmReason open={!!closing} onClose={() => setClosing(null)} title="Đóng cảnh báo lệch chuẩn" subtitle={closing?.title} confirmLabel="Đóng cảnh báo"
        reasonLabel="Đã xử lý thế nào" placeholder="Ví dụ: đã thay đèn trần tại phòng A102, tỷ lệ ảnh chói về mức bình thường."
        onConfirm={async (note) => { try { await call(resolveAnomaly, closing.id, note); toast('Đã đóng cảnh báo', closing.id, 'success'); } catch (e) { toast('Không thực hiện được', e.message, 'error'); } setClosing(null); }} />
    </div>
  );
}

// ---------- Kiểm toán ----------
const CODE_OPTIONS = [{ value: 'all', label: 'Mọi hành động' }, ...Object.entries(ACTION).map(([value, label]) => ({ value, label: `${label}` }))];
const SENSITIVE = new Set(['VIEW_ORIGINAL_IMAGE', 'MOVEMENT_JOURNEY_VIEWED', 'VIEW_INCIDENT_EVIDENCE', 'VIEW_SENSITIVE', 'AUTO_APPROVE_FACE_ID', 'DATA_ERASED', 'POLICY_VERSION_CREATED', 'POLICY_ROLLBACK']);

/** Nhật ký truy vết bất biến (Đặc tả IAM §2.6). */
export function AuditLog() {
  const { data, call, toast } = useApp();
  const [q, setQ] = useState('');
  const [code, setCode] = useState('all');
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState(false);
  const m = data.auditMetrics;
  const rows = useMemo(() => data.audit.filter((a) => code === 'all' || a.action_code === code)
    .filter((a) => !q || `${a.actor_name} ${a.target_subject_id} ${a.detail} ${a.log_id}`.toLowerCase().includes(q.toLowerCase())), [data.audit, code, q]);
  const views = data.audit.filter((a) => a.action_code === 'VIEW_ORIGINAL_IMAGE');
  const journeys = data.audit.filter((a) => a.action_code === 'MOVEMENT_JOURNEY_VIEWED' || a.action_code === 'VIEW_INCIDENT_EVIDENCE');
  const DAY = 24 * 3600 * 1000;
  const sensitive24h = data.audit.filter((a) => SENSITIVE.has(a.action_code) && Date.now() - new Date(a.timestamp) < DAY).length;

  const verify = async () => { setBusy(true); try { setCheck(await call(verifyAuditChain)); } finally { setBusy(false); } };
  const exportSigned = async () => {
    setBusy(true);
    try { const r = await call(exportAudit, rows); toast('Đã tạo tệp xuất có mã băm', `${r.file} • ${r.count} bản ghi • băm ${r.digest.slice(0, 16)}…`, 'success'); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Nhật ký truy vết" desc="Ghi lại ai đã làm gì, lúc nào, trên hồ sơ nào. Nhật ký bất biến: mỗi bản ghi mang mã băm của bản ghi trước, sửa một dòng là gãy cả chuỗi. Xuất kèm mã băm làm bằng chứng khi thanh tra hoặc điều tra sự cố."
        actions={<>
          <button className="btn-outline" disabled={busy} onClick={verify}><Icon name="verified" />Kiểm tra toàn vẹn</button>
          <button className="btn-primary" disabled={busy} onClick={exportSigned}><Icon name="download" />Xuất kèm mã băm ({rows.length})</button>
        </>} />
      <DataBoundary name="audit" label="nhật ký truy vết" scopeNote="global" skeleton="metrics-table">
        <MetricStrip className="mb-space-md" items={[
          { label: 'Lượt xem ảnh gốc (7 ngày)', value: fmtNumber(m.original_views_7d), sub: `Tuần trước ${m.original_views_prev_7d} • tăng ${fmtPercent(((m.original_views_7d - m.original_views_prev_7d) / m.original_views_prev_7d) * 100)}`, alert: m.original_views_7d > m.original_views_prev_7d * 1.3 },
          { label: 'Thao tác nhạy cảm (24 giờ)', value: fmtNumber(sensitive24h), sub: 'Xem ảnh gốc, hành trình, minh chứng, sửa chính sách…' },
          { label: 'Lượt xem hành trình và minh chứng', value: fmtNumber(journeys.length), sub: 'Trong nhật ký đang hiển thị' },
          { label: 'Bản ghi nhật ký', value: fmtNumber(data.audit.length), sub: `Mới nhất ${fmtRelative(data.audit[0]?.timestamp)}` },
        ]} />

        {check && (check.ok
          ? <Banner className="mb-space-md" icon="verified" title="Chuỗi nhật ký toàn vẹn.">Đã tính lại mã băm cho {check.count} bản ghi, không có bản ghi nào bị sửa hoặc xóa.</Banner>
          : <Banner className="mb-space-md" tone="danger" title="Chuỗi nhật ký bị gãy.">Bản ghi {check.broken_at} không khớp mã băm. Báo ngay cho cán bộ bảo vệ dữ liệu.</Banner>)}

        <div className="grid grid-cols-12 gap-space-md mb-space-md">
          <section className="col-span-6 card overflow-hidden">
            <h2 className="text-headline-md px-space-md pt-3 pb-2">Ai đã xem ảnh gốc <span className="font-normal text-caption text-text-secondary">trong nhật ký đang hiển thị</span></h2>
            {views.length === 0 ? <p className="px-space-md pb-3 text-body-sm text-text-secondary">Chưa có lượt xem.</p> : (
              <ul className="divide-y divide-border-subtle border-t border-border-subtle max-h-[260px] overflow-y-auto">
                {views.map((v) => (
                  <li key={v.log_id} className="px-space-md py-2 text-body-sm">
                    <div className="flex justify-between gap-2"><span className="font-medium">{v.actor_name}</span><span className="text-caption text-text-secondary">{fmtDateTime(v.timestamp)}</span></div>
                    <div className="text-caption text-text-secondary"><span className="font-mono">{v.target_subject_id}</span> • {v.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="col-span-6 card overflow-hidden">
            <h2 className="text-headline-md px-space-md pt-3 pb-2">Ai đã xem hành trình, minh chứng <span className="font-normal text-caption text-text-secondary">trong nhật ký đang hiển thị</span></h2>
            {journeys.length === 0 ? <p className="px-space-md pb-3 text-body-sm text-text-secondary">Chưa có lượt xem.</p> : (
              <ul className="divide-y divide-border-subtle border-t border-border-subtle max-h-[260px] overflow-y-auto">
                {journeys.map((v) => (
                  <li key={v.log_id} className="px-space-md py-2 text-body-sm">
                    <div className="flex justify-between gap-2"><span className="font-medium">{v.actor_name}</span><span className="text-caption text-text-secondary">{fmtDateTime(v.timestamp)}</span></div>
                    <div className="text-caption text-text-secondary">{ACTION[v.action_code]} • <span className="font-mono">{v.target_subject_id}</span> • {v.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card overflow-hidden">
          <div className="p-3 border-b border-border-subtle flex items-center gap-2">
            <h2 className="text-headline-md mr-2">Dòng nhật ký</h2>
            <SearchInput className="flex-1 max-w-sm" value={q} onChange={setQ} placeholder="Tìm theo người, đối tượng, nội dung" />
            <Select className="!w-[260px]" label="Hành động" value={code} options={CODE_OPTIONS} onChange={setCode} />
          </div>
          <div className="overflow-x-auto max-h-[560px]">
            <table className="data-table">
              <thead><tr>{['Thời điểm', 'Người thực hiện', 'Hành động', 'Đối tượng', 'Địa chỉ IP', 'Chi tiết', 'Mã băm'].map((h) => <th key={h} className="sticky top-0 z-10">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.log_id} className={`align-top ${SENSITIVE.has(a.action_code) ? 'bg-status-pending/5' : ''}`}>
                    <td className="whitespace-nowrap"><div>{fmtDateTime(a.timestamp, true)}</div><div className="font-mono text-caption text-text-secondary">{a.log_id}</div></td>
                    <td className="whitespace-nowrap"><div className="font-medium">{a.actor_name}</div><div className="text-caption text-text-secondary">{ROLES[a.actor_role]?.label || a.actor_id}</div></td>
                    <td className="whitespace-nowrap"><div>{ACTION[a.action_code] || a.action_code}</div><div className="font-mono text-caption text-text-secondary">{a.action_code}</div></td>
                    <td className="font-mono text-caption whitespace-nowrap">{a.target_subject_id || '—'}</td>
                    <td className="font-mono text-caption whitespace-nowrap">{a.ip_address}</td>
                    <td className="min-w-[260px]">{a.detail}</td>
                    <td className="font-mono text-caption whitespace-nowrap" title={`Trước: ${a.prev_hash}\nNày: ${a.immutable_hash}`}><span className="text-text-secondary">{a.prev_hash.slice(0, 6)}…</span> → {a.immutable_hash.slice(0, 10)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <Empty title="Không có bản ghi phù hợp" />}
          </div>
        </section>
      </DataBoundary>
    </div>
  );
}

// ---------- Đồng ý ----------
const ER_STEPS = [['lock', 'Khóa tại mọi thiết bị'], ['images', 'Xóa ảnh gốc'], ['template', 'Xóa dữ liệu sinh trắc'], ['notice', 'Gửi biên bản']];
const ER_STATUS = { PENDING_CONFIRM: ['status-pending', 'Chờ xác nhận'], IN_PROGRESS: ['status-pending', 'Đang xóa'], DONE: ['status-active', 'Đã xóa xong'] };

/** Quản lý đồng ý: phiên bản điều khoản, tỷ lệ đồng ý, quyền được lãng quên (Đặc tả IAM §2.5). */
export function Consents() {
  const { data, call, toast, can } = useApp();
  const [ask, setAsk] = useState(null);
  const cs = data.consentStats;
  const segs = [
    ['Đồng ý v1.2 (hiện hành)', cs.active_current, 'bg-primary-container'],
    ['Đồng ý điều khoản cũ', cs.active_old, 'bg-status-amber'],
    ['Chưa xác nhận', cs.pending, 'bg-border-strong'],
    ['Đã rút đồng ý', cs.withdrawn, 'bg-status-rejected'],
  ];
  const people = data.subjects.filter((s) => s.states.consent !== 'ACTIVE' || s.consent_version !== 'v1.2');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'status';

  return (
    <div>
      <PageHeader title="Bảo vệ dữ liệu cá nhân" desc="Không có sự đồng ý hợp lệ thì không xử lý sinh trắc. Quản lý đồng ý theo phiên bản điều khoản, mục đích xử lý, thời hạn lưu trữ và việc xóa dữ liệu khi có người rút đồng ý." />
      <Tabs label="Nội dung" className="mb-space-md border-b border-border-subtle" value={tab} onChange={(t) => setParams(t === 'status' ? {} : { tab: t })}
        items={[{ key: 'status', label: 'Trạng thái đồng ý' }, { key: 'purposes', label: 'Mục đích xử lý' }, { key: 'retention', label: 'Lưu trữ & DPIA' }]} />
      {tab === 'purposes' ? <PurposesTab /> : tab === 'retention' ? <RetentionTab /> : (
      <DataBoundary name="consents" label="dữ liệu đồng ý" scopeNote="global" skeleton="metrics-table">
        <MetricStrip className="mb-space-md" items={[
          { label: 'Tỷ lệ đồng ý toàn trường', value: fmtPercent(((cs.active_current + cs.active_old) / cs.total) * 100), sub: `${fmtNumber(cs.active_current + cs.active_old)} / ${fmtNumber(cs.total)} người` },
          { label: 'Theo điều khoản hiện hành v1.2', value: fmtPercent((cs.active_current / cs.total) * 100), sub: `${fmtNumber(cs.active_current)} người` },
          { label: 'Còn ở điều khoản cũ', value: fmtNumber(cs.active_old), sub: 'Chưa được dùng cho mục đích mới', alert: true },
          { label: 'Chưa xác nhận', value: fmtNumber(cs.pending), sub: 'Bị khóa mọi xử lý sinh trắc', alert: true },
          { label: 'Đã rút đồng ý', value: fmtNumber(cs.withdrawn), sub: `${data.erasures.filter((e) => e.status !== 'DONE').length} người đang chờ xóa dữ liệu` },
        ]} />

        <section className="card p-space-md mb-space-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-headline-md">Phân bố trạng thái đồng ý</h2>
            <div className="flex gap-2">
              <button className="btn-outline btn-sm" disabled={!can('consent')} onClick={() => setAsk('OLD_VERSION')}><Icon name="forward_to_inbox" size={16} />Mời {fmtNumber(cs.active_old)} người xác nhận v1.2</button>
              <button className="btn-outline btn-sm" disabled={!can('consent')} onClick={() => setAsk('PENDING')}><Icon name="notifications" size={16} />Nhắc {fmtNumber(cs.pending)} người chưa xác nhận</button>
            </div>
          </div>
          <div className="flex h-4 rounded overflow-hidden" role="img" aria-label={segs.map(([l, v]) => `${l}: ${v}`).join(', ')}>
            {segs.map(([l, v, c]) => <div key={l} className={c} style={{ width: `${(v / cs.total) * 100}%` }} title={`${l}: ${fmtNumber(v)}`} />)}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-caption">
            {segs.map(([l, v, c]) => <li key={l} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${c}`} />{l}: <b className="tabular-nums">{fmtNumber(v)}</b> ({fmtPercent((v / cs.total) * 100)})</li>)}
          </ul>
        </section>

        <div className="grid grid-cols-12 gap-space-md items-start">
          <section className="col-span-7 card overflow-hidden">
            <h2 className="text-headline-md px-space-md pt-3 pb-2">Phiên bản điều khoản</h2>
            <table className="data-table">
              <thead><tr><th>Phiên bản</th><th>Mục đích xử lý</th><th>Lưu trữ</th><th className="text-right">Người ký</th></tr></thead>
              <tbody>
                {[...data.consentVersions].reverse().map((v) => (
                  <tr key={v.version} className="align-top">
                    <td className="whitespace-nowrap"><div className="flex items-center gap-1.5"><b className="font-mono">{v.version}</b>{v.status === 'ACTIVE' ? <Chip color="status-active">Hiện hành</Chip> : <Chip color="status-inactive">Đã thay thế</Chip>}</div><div className="text-caption text-text-secondary">Ban hành {v.published_at}</div></td>
                    <td><ul className="list-disc pl-4">{v.purposes.map((p) => <li key={p}>{p}</li>)}</ul></td>
                    <td className="min-w-[160px]">{v.retention}</td>
                    <td className="text-right tabular-nums">{fmtNumber(v.signed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="col-span-5 card overflow-hidden">
            <h2 className="text-headline-md px-space-md pt-3">Quyền được lãng quên</h2>
            <p className="px-space-md pb-2 text-caption text-text-secondary">Người đã rút đồng ý. Dữ liệu phải xóa hết trước hạn theo chính sách của từng loại đối tượng.</p>
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {data.erasures.map((e) => {
                const done = ER_STEPS.filter(([k]) => e.steps[k]).length;
                const overdue = e.status !== 'DONE' && new Date(e.due_at) < new Date();
                return (
                  <li key={e.subject_id} className="px-space-md py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{e.name} <span className="font-mono text-caption text-text-secondary">{e.code}</span></span><Chip color={overdue ? 'status-rejected' : ER_STATUS[e.status][0]}>{overdue ? 'Quá hạn' : ER_STATUS[e.status][1]}</Chip></div>
                    <ol className="grid grid-cols-4 gap-1">
                      {ER_STEPS.map(([k, l]) => <li key={k} className={`h-1.5 rounded-full ${e.steps[k] ? 'bg-status-active' : 'bg-surface-container-high'}`} title={l} />)}
                    </ol>
                    <div className="flex items-center justify-between text-caption text-text-secondary">
                      <span>{done}/4: {ER_STEPS[Math.min(done, 3)][1]}{done < 4 ? ' (đang chờ)' : ''} • hạn {fmtDateTime(e.due_at).slice(0, 10)}</span>
                      {e.status === 'IN_PROGRESS' && can('consent') && <button className="btn-outline btn-sm" onClick={async () => { await call(advanceErasure, e.subject_id); toast('Đã thực hiện bước tiếp theo', `${e.code}`, 'success'); }}>Thực hiện bước tiếp</button>}
                      {e.status === 'PENDING_CONFIRM' && (() => {
                        const req = data.requests.find((r) => r.subject_id === e.subject_id && r.request_type === 'WITHDRAW_CONSENT' && r.status === 'pending');
                        return req && <Link className="text-primary-container hover:underline" to={`/yeu-cau?id=${req.request_id}`}>Xác nhận {req.request_id} trong Hộp yêu cầu</Link>;
                      })()}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="col-span-12 card overflow-hidden">
            <h2 className="text-headline-md px-space-md pt-3 pb-2">Người cần xử lý đồng ý <span className="font-normal text-caption text-text-secondary">trong dữ liệu mẫu</span></h2>
            <table className="data-table">
              <thead><tr><th>Họ tên</th><th>Loại</th><th>Đồng ý</th><th>Ảnh hưởng</th></tr></thead>
              <tbody>
                {people.map((s) => (
                  <tr key={s.subject_id}>
                    <td><Link to={`/ho-so?id=${s.subject_id}`} className="font-medium text-primary-container hover:underline">{s.name}</Link><div className="font-mono text-caption text-text-secondary">{s.code}</div></td>
                    <td><SubjectTypeChip type={s.subject_type} /></td>
                    <td><StateBadge dim="consent" value={s.states.consent} label={consentLabel(s)} /></td>
                    <td className="text-body-sm text-text-secondary">{s.states.consent === 'ACTIVE' ? 'Dùng được cho mục đích cũ, chưa dùng cho phát hành thẻ' : s.states.consent === 'WITHDRAWN' ? 'Đã khóa, đang xóa dữ liệu' : 'Khóa mọi xử lý sinh trắc'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </DataBoundary>
      )}

      <ConfirmReason open={!!ask} onClose={() => setAsk(null)} title={ask === 'OLD_VERSION' ? 'Mời xác nhận điều khoản v1.2' : 'Nhắc người chưa xác nhận'}
        subtitle={`${fmtNumber(ask === 'OLD_VERSION' ? cs.active_old : cs.pending)} người sẽ nhận thông báo trên App MyDaiNam`} confirmLabel="Gửi"
        onConfirm={async (reason) => { const r = await call(requestReconsent, ask); toast('Đã gửi', `${fmtNumber(r.recipients)} thông báo (${reason.slice(0, 40)}…)`, 'success'); setAsk(null); }}>
        <Banner>Thông báo chứa nội dung điều khoản v1.2 và mục đích mới (phát hành thẻ). Người nhận tự quyết định đồng ý hoặc không.</Banner>
      </ConfirmReason>
    </div>
  );
}
