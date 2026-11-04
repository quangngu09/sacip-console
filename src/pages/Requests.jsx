import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Chip, FaceThumb, Modal, ConfirmReason, AiCard, Empty, PageHeader, SearchInput, Select } from '../components/ui';
import { useApp } from '../store';
import { CURRENT_USER } from '../data/mock';

const TABS = [
  ['pending', 'Chờ duyệt'], ['all', 'Tất cả'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối'], ['cancelled', 'Đã hủy'],
];
const prioColor = { 'Khẩn cấp': 'bg-status-rejected text-white', Cao: 'bg-status-rejected/10 text-status-rejected' };
const FORWARD_TARGETS = ['Trưởng Phòng Đào tạo', 'Phòng Pháp chế', 'Ban Quản lý KTX'];

export default function Requests() {
  const { requests, setRequests, log, toast } = useApp();
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState('YC-2025-0842');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardTo, setForwardTo] = useState(FORWARD_TARGETS[0]);

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, k === 'all' ? requests.length : requests.filter((r) => r.status === k).length])), [requests]);
  const list = requests.filter((r) => tab === 'all' || r.status === tab).filter((r) => !q || `${r.id} ${r.name} ${r.subjectId}`.toLowerCase().includes(q.toLowerCase()));
  const cur = requests.find((r) => r.id === sel);

  const update = (id, patch) => setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="page-fill flex flex-col">
      <PageHeader title="Hộp yêu cầu" badge={counts.pending > 0 && <Chip color="status-pending">{counts.pending} việc cần làm</Chip>}
        desc="Mọi quyết định do cán bộ ký số • Thời gian xử lý trung bình 1.8 giờ • Kiosk vừa đồng bộ" />

      <div className="flex-1 min-h-0 grid grid-cols-[380px_minmax(0,1fr)] gap-space-md">
        <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Danh sách yêu cầu">
          <div className="p-3 border-b border-border-subtle flex gap-2 shrink-0">
            <SearchInput className="flex-1 min-w-0" value={q} onChange={setQ} placeholder="Mã, tên, mã số" label="Tìm yêu cầu theo mã, tên, mã số" />
            <Select className="!w-[148px]" label="Lọc theo trạng thái" value={tab} onChange={setTab} options={TABS.map(([k, l]) => ({ value: k, label: `${l} (${counts[k]})` }))} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border-subtle">
            {list.length === 0 && <Empty title="Không có yêu cầu" desc="Hộp yêu cầu trống với bộ lọc hiện tại." />}
            {list.map((r) => {
              const active = r.id === sel;
              return (
                <button key={r.id} onClick={() => setSel(r.id)} aria-current={active ? 'true' : undefined} className={`w-full text-left px-3.5 py-3 flex flex-col gap-1 transition-colors -outline-offset-2 ${active ? 'bg-primary-fixed shadow-[inset_3px_0_0_theme(colors.primary-container)]' : 'hover:bg-surface-container-low'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-label-md font-semibold truncate ${r.status === 'cancelled' ? 'line-through text-text-secondary' : ''}`}>{r.name}</span>
                    {r.status === 'pending'
                      ? <span className={`shrink-0 flex items-center gap-1 text-caption whitespace-nowrap ${r.slaUrgent ? 'text-status-rejected font-semibold' : 'text-text-secondary'}`}><Icon name="schedule" size={14} />{r.sla}</span>
                      : <StatusPill status={r.status} />}
                  </div>
                  <div className="flex items-center gap-2 text-caption text-text-secondary">
                    <span className="truncate"><span className="font-mono">{r.id}</span> • {r.kindLabel}</span>
                    {prioColor[r.priority] && <span className={`ml-auto shrink-0 px-1.5 rounded font-medium ${prioColor[r.priority]}`}>{r.priority}</span>}
                  </div>
                  <p className="text-body-sm text-text-secondary truncate">{r.note}</p>
                </button>
              );
            })}
          </div>
          <div className="h-10 px-3.5 border-t border-border-subtle text-caption text-text-secondary flex items-center shrink-0" aria-live="polite">Hiển thị {list.length} / {requests.length} yêu cầu</div>
        </section>

        <section className="card overflow-hidden flex flex-col min-h-0" aria-label="Chi tiết yêu cầu">
          {!cur ? <Empty title="Chọn một yêu cầu" /> : cur.kind === 'consent'
            ? <ConsentDetail r={cur} onDone={() => { update(cur.id, { status: 'approved', footer: 'Hoàn tất xóa dữ liệu' }); log('Xác nhận đã xử lý rút đồng ý (xóa ảnh + vector)', cur.subjectId); toast('Đã hoàn tất rút đồng ý', 'Ảnh gốc và dữ liệu sinh trắc đã xóa; đã gửi biên bản cho sinh viên.', 'success'); }} />
            : <ApprovalDetail r={cur} onApprove={() => setApproveOpen(true)} onReject={() => setRejectOpen(true)} onForward={() => setForwardOpen(true)}
                onSimulateCancel={() => { update(cur.id, { status: 'cancelled' }); log('Đối tượng tự hủy yêu cầu qua App', cur.id, 'system'); toast('Yêu cầu đã bị đối tượng hủy', `${cur.id}: quyền chụp tự động thu hồi.`, 'warn'); }} />}
        </section>
      </div>

      {cur && <ApproveModal open={approveOpen} r={cur} onClose={() => setApproveOpen(false)} onConfirm={(reason) => {
        if (cur.twoPerson && !cur.firstApproval) {
          update(cur.id, { firstApproval: CURRENT_USER.name, footer: 'Chờ người thứ 2 xác nhận' });
          log(`Xác nhận người thứ 1 — ${reason}`, cur.id);
          toast('Đã ghi nhận xác nhận thứ nhất', 'Cần một cán bộ khác xác nhận để thực thi.', 'warn');
        } else {
          update(cur.id, { status: 'approved', footer: 'Đã phê duyệt' });
          log(`Phê duyệt yêu cầu — ${reason}`, cur.id);
          toast('Đã phê duyệt', `${cur.id}: Kiosk đã mở quyền và mã QR đã gửi tới App MyDaiNam.`, 'success');
        }
        setApproveOpen(false);
      }} />}
      <ConfirmReason open={rejectOpen} onClose={() => setRejectOpen(false)} danger title="Từ chối yêu cầu" subtitle={cur && `${cur.id} • ${cur.name}`} confirmLabel="Xác nhận từ chối"
        onConfirm={(reason) => { update(cur.id, { status: 'rejected', footer: 'Đã từ chối' }); log(`Từ chối yêu cầu — ${reason}`, cur.id); toast('Đã từ chối yêu cầu', 'Đối tượng sẽ nhận thông báo kèm lý do.', 'info'); setRejectOpen(false); }} />
      <ConfirmReason open={forwardOpen} onClose={() => setForwardOpen(false)} title="Chuyển cấp duyệt" subtitle={cur && cur.id} confirmLabel="Chuyển"
        onConfirm={(reason) => { log(`Chuyển cấp duyệt tới ${forwardTo} — ${reason}`, cur.id); toast('Đã chuyển cấp duyệt', `Yêu cầu chuyển tới ${forwardTo}.`, 'success'); setForwardOpen(false); }}>
        <label className="flex flex-col gap-1 text-label-md font-semibold">Chuyển tới
          <Select className="font-normal" label="Chuyển tới" value={forwardTo} options={FORWARD_TARGETS} onChange={setForwardTo} />
        </label>
      </ConfirmReason>
    </div>
  );
}

function StatusPill({ status }) {
  const m = { approved: ['status-active', 'Đã duyệt'], rejected: ['status-rejected', 'Từ chối'], cancelled: ['status-inactive', 'Đối tượng đã hủy'], pending: ['status-pending', 'Chờ duyệt'] }[status];
  return <Chip color={m[0]} className="shrink-0">{m[1]}</Chip>;
}

const Field = ({ label, value }) => <div className="min-w-0"><dt className="text-caption text-text-secondary">{label}</dt><dd>{value}</dd></div>;

const Metric = ({ label, value, sub, good, warn }) => {
  const c = good ? 'text-status-active' : warn ? 'text-status-pending' : 'text-status-rejected';
  return (
    <div className="p-3 bg-surface rounded-lg border border-border-subtle">
      <div className="text-caption text-text-secondary">{label}</div>
      <div className={`text-k-title-md ${c}`}>{value}</div>
      <div className="text-caption text-text-secondary">{sub}</div>
    </div>
  );
};

function ApprovalDetail({ r, onApprove, onReject, onForward, onSimulateCancel }) {
  const { log, toast } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [revealAsk, setRevealAsk] = useState(false);
  useEffect(() => setRevealed(false), [r.id]);
  const closed = r.status !== 'pending';
  const steps = [
    { t: 'Đối tượng gửi yêu cầu', d: `${r.name} nộp đơn qua App MyDaiNam, xác thực OTP.`, time: r.created },
    { t: 'Cố vấn học tập / Trưởng đơn vị', d: 'ThS. Nguyễn Văn An: “Xác nhận cần cập nhật ảnh chuẩn để phục vụ điểm danh thi.”', time: '15:10 24/10/2025' },
    { t: `Phòng Đào tạo${r.twoPerson ? ' (2 người xác nhận)' : ''}`, d: r.firstApproval ? `Đã có xác nhận thứ nhất: ${r.firstApproval}. Chờ cán bộ thứ 2.` : `Phân công thẩm định: ${CURRENT_USER.name}.` },
    { t: 'Tự động mở quyền Kiosk và gửi mã QR', d: 'Hệ thống mở quyền tại Kiosk 01, 02, 03 và gửi mã QR vào App MyDaiNam.' },
  ];
  const stepState = (i) => (r.status === 'approved' ? 'done' : r.status !== 'pending' ? (i < 2 ? 'done' : 'off') : i < r.step - 1 ? 'done' : i === r.step - 1 ? 'current' : 'off');
  const quality = r.ai?.quality;

  return (
    <>
      <header className="px-space-md py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-k-title-md truncate">{r.name}</h2>
          {r.status === 'pending' ? <Chip color="status-pending" className="shrink-0">Chờ Phòng Đào tạo duyệt</Chip> : <StatusPill status={r.status} />}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-caption text-text-secondary">
          <span><span className="font-mono">{r.id}</span> • {r.kindLabel}</span>
          <span>Tạo lúc {r.created}</span>
          {!closed && <span className={`font-medium ${r.slaUrgent ? 'text-status-rejected' : 'text-status-pending'}`}>{r.sla} để xử lý</span>}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-space-md flex flex-col gap-space-md">
        {r.status === 'cancelled' && (
          <div className="p-3 rounded-lg bg-status-pending/10 border border-status-pending/30 flex gap-2 text-body-sm"><Icon name="warning" size={20} className="text-status-pending" /><div><b className="text-status-pending">Đối tượng đã hủy yêu cầu.</b> Mọi thao tác cấp quyền đã bị khóa; quyền chụp tự động thu hồi.</div></div>
        )}

        <section className="flex gap-space-md items-start">
          <div className="w-[120px] shrink-0 flex flex-col gap-1.5">
            <FaceThumb seed={r.id.length + 2} size={120} round={false} revealed={revealed} />
            {revealed
              ? <button className="btn-outline btn-sm w-full" onClick={() => setRevealed(false)}>Làm mờ lại</button>
              : <button className="btn-outline btn-sm w-full !px-1" onClick={() => setRevealAsk(true)}><Icon name="visibility" size={16} />Xem rõ</button>}
            <span className="text-caption text-text-secondary text-center">Kiosk #03<br />09:14 24/10/2025</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-body-sm">
              <Field label="Mã đối tượng" value={<span className="font-mono font-medium">{r.subjectId}</span>} />
              <Field label="Đơn vị" value={`${r.unit}${r.cls ? ` • ${r.cls}` : ''}`} />
              <Field label="Đối chiếu CCCD" value={<span><span className="font-mono">••••8921</span> (đã xác thực chip)</span>} />
            </dl>
            <div>
              <div className="text-caption text-text-secondary mb-0.5">Nội dung đề nghị</div>
              <p className="text-body-md">{r.note}</p>
            </div>
          </div>
        </section>

        {r.ai && (
          <AiCard>
            <p className="text-body-sm mb-3">{r.ai.verdict}</p>
            <div className="grid grid-cols-3 gap-space-sm">
              <Metric label="Chất lượng ảnh chân dung" value={`${quality}/100`} good={quality >= 85} warn={quality >= 60} sub={quality >= 85 ? 'Đạt chuẩn ICAO' : 'Chưa đạt: chói trán 38%, nghiêng đầu 22°'} />
              <Metric label="Khớp với ảnh CCCD" value={`${r.ai.match}%`} good={r.ai.match >= 90} sub={r.ai.match >= 90 ? 'Không phát hiện mạo danh' : 'Độ khớp thấp'} />
              <Metric label="Kiểm tra người thật" value={r.ai.liveness >= 90 ? 'Đạt' : 'Không đạt'} good={r.ai.liveness >= 90} sub={`Xác suất người thật ${r.ai.liveness}%`} />
            </div>
            <p className="text-caption text-text-secondary mt-2">AI chắc chắn {r.ai.confidence}% về nhận định trên. Con số này không phải điểm chất lượng ảnh.</p>
          </AiCard>
        )}

        <section>
          <h3 className="section-title mb-2">Tiến trình phê duyệt</h3>
          <ol className="flex flex-col">
            {steps.map((s, i) => {
              const st = stepState(i);
              return (
                <li key={s.t} className="flex gap-3" aria-current={st === 'current' ? 'step' : undefined}>
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-semibold shrink-0 ${st === 'done' ? 'bg-primary-fixed text-primary-container' : st === 'current' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-text-secondary'}`}>{st === 'done' ? <Icon name="check" size={14} /> : i + 1}</span>
                    {i < steps.length - 1 && <span className="w-px flex-1 bg-border-strong" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-label-md ${st === 'current' ? 'font-semibold' : st === 'off' ? 'text-text-secondary' : ''}`}>{s.t}</span>
                      {st === 'current' ? <Chip color="status-pending">Chờ bạn xử lý</Chip> : s.time && <span className="text-caption text-text-secondary whitespace-nowrap">{s.time}</span>}
                    </div>
                    <p className="text-caption text-text-secondary">{s.d}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-1.5"><h3 className="text-label-md font-semibold">Nhật ký truy vết</h3><Link to="/nhat-ky" className="text-label-sm text-primary-container hover:underline">Xem toàn bộ</Link></div>
          <div className="rounded bg-surface-bright p-2.5 text-caption font-mono text-text-secondary space-y-1">
            <div>[14:20:12] KIOSK_03: Chụp lỗi (vùng chói &gt; 35%)</div>
            <div>[14:20:45] {r.subjectId} tạo {r.id}</div>
            <div>[14:21:03] AI: độ chắc chắn {r.ai?.confidence ?? '—'}% (chỉ gợi ý)</div>
          </div>
        </section>
      </div>

      <footer className="px-space-md py-3 border-t border-border-subtle flex items-center justify-between gap-2 shrink-0">
        <div className="flex gap-2">
          <button className="btn-danger" disabled={closed} onClick={onReject}><Icon name="close" />Từ chối</button>
          <button className="btn-outline" disabled={closed} onClick={onForward}><Icon name="forward" />Chuyển cấp</button>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && !closed && <button className="btn text-text-secondary hover:bg-surface-container-low" title="Chỉ có khi phát triển: giả lập sinh viên tự hủy qua App" onClick={onSimulateCancel}>Giả lập SV hủy</button>}
          <button className="btn-primary btn-lg" disabled={closed} onClick={onApprove}>
            <Icon name="check_circle" size={20} />{r.twoPerson ? (r.firstApproval ? 'Xác nhận người thứ 2' : 'Xác nhận người thứ 1') : 'Phê duyệt yêu cầu'}
          </button>
        </div>
      </footer>

      <ConfirmReason open={revealAsk} onClose={() => setRevealAsk(false)} title="Xem rõ ảnh khuôn mặt" subtitle={`${r.name} • ${r.subjectId}`} minLength={5}
        onConfirm={(reason) => { setRevealed(true); setRevealAsk(false); log(`Xem rõ ảnh khuôn mặt — ${reason}`, r.subjectId, 'sensitive'); toast('Đã giải mờ ảnh', 'Thao tác đã được ghi nhật ký.', 'warn'); }} />
    </>
  );
}

function ApproveModal({ open, r, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [sms, setSms] = useState(true);
  const [keep, setKeep] = useState(true);
  useEffect(() => { if (open) setReason(''); }, [open, r]);
  const ok = reason.trim().length >= 10;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-space-md border-b border-border-subtle flex items-center justify-between gap-3">
        <div className="min-w-0"><h3 className="text-k-title-md">Phê duyệt: {r.kindLabel}</h3><p className="text-caption text-text-secondary"><span className="font-mono">{r.id}</span> • {r.name} ({r.subjectId})</p></div>
        <button aria-label="Đóng" className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container text-text-secondary shrink-0" onClick={onClose}><Icon name="close" size={20} /></button>
      </div>
      <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
        {r.twoPerson && <div className="p-3 rounded-lg bg-status-rejected/10 text-status-rejected text-body-sm flex gap-2"><Icon name="group" size={20} />Thao tác thu hồi cần 2 cán bộ độc lập xác nhận. {r.firstApproval ? `Xác nhận thứ nhất: ${r.firstApproval}.` : 'Bạn là người xác nhận thứ nhất.'}</div>}
        <dl className="grid grid-cols-2 gap-3 bg-surface-bright p-3 rounded-lg text-body-sm">
          <Field label="Trạm Kiosk áp dụng" value={<b className="font-medium">Kiosk 01, 02, 03</b>} />
          <Field label="Thời hạn hiệu lực" value={<b className="font-medium">48 giờ</b>} />
          <Field label="Số lần chụp tối đa" value={<b className="font-medium">1 lần</b>} />
          <Field label="Kiểm tra bắt buộc" value={<b className="font-medium">Người thật v3.2, chuẩn ICAO 9303</b>} />
        </dl>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-semibold flex justify-between gap-2"><span>Lý do phê duyệt <span className="text-status-rejected">*</span></span><span className="text-caption text-text-secondary font-normal">Tối thiểu 10 ký tự • Ghi vào nhật ký kiểm toán</span></span>
          <textarea className="input leading-relaxed" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập căn cứ phê duyệt…" autoFocus />
        </label>
        <label className="flex gap-2.5 text-body-sm cursor-pointer"><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary-container" />Gửi SMS và thông báo qua App MyDaiNam kèm mã QR mở Kiosk.</label>
        <label className="flex gap-2.5 text-body-sm cursor-pointer"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary-container" />Lưu ảnh cũ vào kho đối soát trong 90 ngày.</label>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between gap-3">
        <span className="text-caption text-text-secondary">Ký số bởi <b className="font-medium">{CURRENT_USER.name}</b></span>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Hủy bỏ</button>
          <button className="btn-primary" disabled={!ok} onClick={() => onConfirm(reason.trim())}><Icon name="check" />Xác nhận phê duyệt</button>
        </div>
      </div>
    </Modal>
  );
}

function ConsentDetail({ r, onDone }) {
  const done = r.status !== 'pending';
  const steps = [
    ['Khóa hồ sơ Face ID tại toàn bộ Kiosk và cổng', 'Vô hiệu hóa quyền quét tại cổng A, B, C và KTX', 'done'],
    ['Xóa ảnh chân dung gốc', 'Xóa tệp ảnh khỏi máy chủ đệm và kho lưu trữ', 'done'],
    ['Xóa dữ liệu sinh trắc', 'Ghi đè vector khuôn mặt và đồng bộ xóa tại các thiết bị', done ? 'done' : 'running'],
    ['Gửi biên bản xác nhận tới sinh viên', 'Email biên bản xác nhận xóa dữ liệu vĩnh viễn', done ? 'done' : 'wait'],
  ];
  return (
    <>
      <header className="px-space-md py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 min-w-0"><h2 className="text-k-title-md truncate">{r.name}</h2><Chip color="secondary" className="shrink-0">Rút đồng ý dữ liệu sinh trắc</Chip>{done && <Chip color="status-active" className="shrink-0">Hoàn tất</Chip>}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-caption text-text-secondary">
          <span><span className="font-mono">{r.id}</span> • Căn cứ Nghị định 13/2023/NĐ-CP</span>
          <span>Gửi lúc {r.created}</span>
          <span className="font-medium text-status-pending">Thực hiện trong 72 giờ</span>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-space-md flex flex-col gap-space-md">
        <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-body-sm">
          <Field label="Mã số sinh viên" value={<span className="font-mono font-medium">{r.subjectId}</span>} />
          <Field label="Khoa" value={r.unit} />
          <Field label="Xác thực OTP" value={<span className="font-mono">#OTP-9942 (đã ký)</span>} />
        </dl>
        <div>
          <div className="text-caption text-text-secondary mb-0.5">Lý do rút đồng ý</div>
          <p className="text-body-md">{r.note}</p>
        </div>
        <section>
          <h3 className="section-title mb-2">Tiến trình xóa dữ liệu</h3>
          <ol className="flex flex-col gap-2">
            {steps.map(([t, d, s], i) => (
              <li key={t} className="p-3 rounded-lg border border-border-subtle flex items-center justify-between gap-3">
                <div className="min-w-0"><div className="text-label-md font-semibold">{i + 1}. {t}</div><div className="text-caption text-text-secondary">{d}</div></div>
                {s === 'done' ? <Chip color="status-active" className="shrink-0">Đã hoàn thành</Chip> : s === 'running' ? <Chip color="primary" className="shrink-0">Đang xử lý (80%)</Chip> : <Chip color="neutral" className="shrink-0">Chờ bước 3</Chip>}
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="section-title mb-1">Phương án thay thế không dùng sinh trắc</h3>
          <p className="text-body-sm text-text-secondary mb-2">Bảo đảm đầy đủ quyền lợi học tập của sinh viên theo luật định.</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-surface-bright"><b className="text-label-md block">Thẻ sinh viên RFID + PIN</b><span className="text-caption text-text-secondary">Kiểm soát ra vào tại cổng bằng thẻ chip.</span></div>
            <div className="p-3 rounded-lg bg-surface-bright"><b className="text-label-md block">Điểm danh thủ công / BLE</b><span className="text-caption text-text-secondary">Giám thị đối soát thẻ và CCCD, không dùng camera khuôn mặt.</span></div>
          </div>
        </section>
      </div>
      <footer className="px-space-md py-3 border-t border-border-subtle flex items-center justify-between gap-3 shrink-0">
        <span className="text-caption text-text-secondary">Quyền rút đồng ý không thể bị từ chối.</span>
        <button className="btn-primary btn-lg" disabled={done} onClick={onDone}><Icon name="verified" size={20} />{done ? 'Đã xử lý' : 'Xác nhận đã xử lý'}</button>
      </footer>
    </>
  );
}
