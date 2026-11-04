import { useEffect, useMemo, useState } from 'react';
import { Icon, Chip, FaceThumb, Modal, ConfirmReason, AiCard, Empty, Select } from '../components/ui';
import { useApp } from '../store';
import { CURRENT_USER } from '../data/mock';

const TABS = [
  ['all', 'Tất cả'], ['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối'], ['cancelled', 'Đã hủy'],
];
const kindColor = { rescan: 'primary', new: 'neutral', revoke: 'status-rejected', consent: 'secondary', extend: 'neutral' };
const prioColor = { 'Khẩn cấp': 'bg-status-rejected text-white', Cao: 'bg-status-rejected/10 text-status-rejected' };
const FORWARD_TARGETS = ['Trưởng Phòng Đào tạo', 'Phòng Pháp chế', 'Ban Quản lý KTX'];

export default function Requests() {
  const { requests, setRequests, log, toast } = useApp();
  const [tab, setTab] = useState('all');
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
    <div className="flex flex-col gap-space-md">
      <div className="card p-space-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary-container"><Icon name="inbox" size={22} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-headline-md">Hộp yêu cầu phê duyệt</h1>
              <Chip color="status-pending" className="text-label-sm">{counts.pending} việc cần làm</Chip>
              <Chip color="ai" icon="bolt" className="text-label-sm">SLA trung bình 1.8h</Chip>
            </div>
            <p className="text-caption text-text-secondary truncate">Chuỗi phê duyệt nhiều bước theo Nghị định 13/2023/NĐ-CP • Mọi quyết định do con người ký số</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-surface-container-low px-2.5 py-1.5 rounded-lg text-caption text-text-secondary"><Icon name="sync" size={16} className="text-status-active" />Đồng bộ Kiosk: <b>Vừa xong</b></span>
          <button className="btn-ghost"><Icon name="tune" />Bộ lọc nâng cao</button>
          <button className="btn-ghost"><Icon name="history" />Lịch sử ca trực</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-space-md items-start">
        {/* LEFT list */}
        <div className="col-span-5 card overflow-hidden flex flex-col">
          <div className="p-space-md pb-0">
            <div className="flex items-center gap-1 border-b border-border-subtle pb-2 overflow-x-auto">
              {TABS.map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1.5 rounded-lg text-label-sm shrink-0 flex items-center gap-1.5 ${tab === k ? 'bg-primary-container text-white' : 'text-text-secondary hover:bg-surface-container-low hover:text-text-primary'}`}>
                  {l}<span className={`px-1.5 rounded-full text-caption font-semibold ${tab === k ? 'bg-white/20' : 'bg-surface-container'}`}>{counts[k]}</span>
                </button>
              ))}
            </div>
            <div className="py-2 relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input className="input pl-9 pr-8" placeholder="Tìm theo Mã YC, Họ tên, Mã SV..." value={q} onChange={(e) => setQ(e.target.value)} />
              {q && <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary" onClick={() => setQ('')}><Icon name="close" size={16} /></button>}
            </div>
          </div>
          <div className="divide-y divide-border-subtle max-h-[calc(100vh-280px)] overflow-y-auto">
            {list.length === 0 && <Empty title="Không có yêu cầu" desc="Hộp yêu cầu trống với bộ lọc hiện tại." />}
            {list.map((r) => {
              const active = r.id === sel;
              const closed = r.status !== 'pending';
              return (
                <button key={r.id} onClick={() => setSel(r.id)} className={`w-full text-left p-space-md flex flex-col gap-2 transition-colors border-l-4 ${active ? 'bg-surface-container-low border-l-primary-container' : 'border-l-transparent hover:bg-surface-container-low/50'} ${r.status === 'cancelled' ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-label-md font-semibold ${active ? 'text-primary-container' : ''} ${r.status === 'cancelled' ? 'line-through text-text-secondary' : ''}`}>{r.id}</span>
                      <Chip color={kindColor[r.kind]}>{r.kindLabel}</Chip>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {closed ? <StatusPill status={r.status} /> : <>
                        <span className={`chip ${r.slaUrgent ? 'bg-status-rejected/10 text-status-rejected' :'bg-surface-container text-text-secondary'}`}><Icon name="alarm" size={13} />{r.sla}</span>
                        {prioColor[r.priority] && <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${prioColor[r.priority]}`}>{r.priority}</span>}
                      </>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-semibold text-primary shrink-0">{r.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-1"><span className="text-label-md font-semibold truncate">{r.name}</span><span className="text-caption text-text-secondary shrink-0">{r.time}</span></div>
                      <p className="text-body-sm text-text-secondary truncate">{r.subjectId} • {r.unit}</p>
                      <p className="text-caption text-text-secondary italic truncate">“{r.note}”</p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1 text-caption text-text-secondary border-t border-border-subtle/60">
                    {r.kind === 'consent' ? <span className="text-secondary font-medium flex items-center gap-1"><Icon name="verified_user" size={14} />Quyền tuyệt đối theo NĐ 13</span>
                      : r.ai ? <span className="text-ai-border font-medium flex items-center gap-1"><Icon name="psychology" size={14} />AI gợi ý: {r.ai.confidence}% tin cậy</span> : <span />}
                    <span>{r.status === 'cancelled' ? 'Thao tác đã đóng' : r.footer}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-space-sm bg-surface-bright border-t border-border-subtle text-caption text-text-secondary flex justify-between"><span>Hiển thị {list.length} / {requests.length} yêu cầu</span><span>Trang 1 / 1</span></div>
        </div>

        {/* RIGHT detail */}
        <div className="col-span-7 card overflow-hidden flex flex-col">
          {!cur ? <Empty title="Chọn một yêu cầu" /> : cur.kind === 'consent'
            ? <ConsentDetail r={cur} onDone={() => { update(cur.id, { status: 'approved', footer: 'Hoàn tất xóa dữ liệu' }); log('Xác nhận đã xử lý rút đồng ý (xóa ảnh + vector)', cur.subjectId); toast('Đã hoàn tất rút đồng ý', 'Ảnh gốc & vector 512d đã xóa; đã gửi biên bản cho sinh viên.', 'success'); }} />
            : <ApprovalDetail r={cur} onApprove={() => setApproveOpen(true)} onReject={() => setRejectOpen(true)} onForward={() => setForwardOpen(true)}
                onSimulateCancel={() => { update(cur.id, { status: 'cancelled' }); log('Đối tượng tự hủy yêu cầu qua App', cur.id, 'system'); toast('Yêu cầu đã bị đối tượng hủy', `${cur.id} — quyền chụp tự động thu hồi.`, 'warn'); }} />}
        </div>
      </div>

      {cur && <ApproveModal open={approveOpen} r={cur} onClose={() => setApproveOpen(false)} onConfirm={(reason) => {
        if (cur.twoPerson && !cur.firstApproval) {
          update(cur.id, { firstApproval: CURRENT_USER.name, footer: 'Chờ người thứ 2 xác nhận' });
          log(`Xác nhận người thứ 1 — ${reason}`, cur.id);
          toast('Đã ghi nhận xác nhận thứ nhất', 'Cần một cán bộ khác xác nhận để thực thi.', 'warn');
        } else {
          update(cur.id, { status: 'approved', footer: 'Đã phê duyệt' });
          log(`Phê duyệt yêu cầu — ${reason}`, cur.id);
          toast('Đã phê duyệt', `${cur.id} • Kiosk đã nhận token mở khóa & QR gửi tới App MyDaiNam.`, 'success');
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
  return <Chip color={m[0]}>{m[1]}</Chip>;
}

function ApprovalDetail({ r, onApprove, onReject, onForward, onSimulateCancel }) {
  const { log, toast } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [revealAsk, setRevealAsk] = useState(false);
  useEffect(() => setRevealed(false), [r.id]);
  const closed = r.status !== 'pending';
  const steps = [
    { t: 'Bước 1: Đối tượng gửi yêu cầu', d: `${r.name} nộp đơn qua App MyDaiNam • xác thực OTP`, time: r.created },
    { t: 'Bước 2: Cố vấn học tập / Trưởng đơn vị', d: 'ThS. Nguyễn Văn An: “Xác nhận cần cập nhật ảnh chuẩn để phục vụ điểm danh thi.”', time: '15:10 24/10/2025' },
    { t: `Bước 3: Phòng Đào tạo${r.twoPerson ? ' (2 người xác nhận)' : ''}`, d: r.firstApproval ? `Đã có xác nhận thứ nhất: ${r.firstApproval}. Chờ cán bộ thứ 2.` : `Phân công thẩm định: ${CURRENT_USER.name}`, current: true },
    { t: 'Bước 4: Tự động kích hoạt Kiosk & gửi QR', d: 'Hệ thống đẩy token mở khóa Kiosk 01, 02, 03 và gửi mã QR vào App MyDaiNam.' },
  ];
  const stepState = (i) => (r.status === 'approved' ? 'done' : r.status !== 'pending' ? (i < 2 ? 'done' : 'off') : i < r.step - 1 ? 'done' : i === r.step - 1 ? 'current' : 'off');

  return (
    <>
      <div className="p-space-md border-b border-border-subtle flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><span className="text-headline-md">{r.id}</span>{r.status === 'pending' ? <Chip color="status-pending" className="text-label-sm">Đang chờ Phòng Đào tạo duyệt</Chip> : <StatusPill status={r.status} />}</div>
          <div className="flex gap-1 text-text-secondary">
            <button className="p-1.5 rounded-lg hover:bg-surface-container-low" title="In phiếu xác nhận"><Icon name="print" size={20} /></button>
            <button className="p-1.5 rounded-lg hover:bg-surface-container-low" title="Sao chép liên kết"><Icon name="share" size={20} /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
          <span className="flex items-center gap-1"><Icon name="category" size={16} />Loại: <b>{r.kindLabel}</b></span>
          <span className="flex items-center gap-1"><Icon name="schedule" size={16} />Tạo lúc: {r.created}</span>
          {!closed && <span className="flex items-center gap-1 text-status-pending font-medium"><Icon name="hourglass_top" size={16} />SLA: <b>{r.sla}</b></span>}
        </div>
      </div>

      <div className="p-space-md flex flex-col gap-space-lg max-h-[calc(100vh-330px)] overflow-y-auto">
        {r.status === 'cancelled' && (
          <div className="p-3.5 rounded-lg bg-status-pending/10 border border-status-pending/30 flex gap-3 text-body-sm"><Icon name="warning" size={22} className="text-status-pending" /><div><b className="text-status-pending">Đối tượng đã hủy yêu cầu.</b> Mọi thao tác cấp quyền đã bị khóa; quyền chụp tự động thu hồi.</div></div>
        )}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between"><h2 className="section-title">1. Thông tin đối tượng & lý do</h2><Chip color="ai">Hồ sơ chuẩn ICAO 9303</Chip></div>
          <div className="bg-surface-bright p-space-md rounded-lg flex gap-space-md items-start">
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              <Field label="Họ và tên" value={<b className="text-body-md">{r.name}</b>} />
              <Field label="Mã đối tượng" value={<b className="text-primary-container font-mono">{r.subjectId}</b>} />
              <Field label="Đơn vị" value={`${r.unit}${r.cls ? ` • ${r.cls}` : ''}`} />
              <Field label="Đối chiếu CCCD" value={<span className="font-mono text-caption">••••••••8921 (Đã xác thực chip)</span>} />
              <div className="col-span-2 pt-2 border-t border-border-subtle">
                <span className="text-caption text-text-secondary block mb-1">Nội dung đề nghị:</span>
                <div className="p-2.5 rounded bg-surface leading-relaxed border-l-2 border-l-primary-container">“{r.note}”</div>
              </div>
            </div>
            <div className="w-52 shrink-0 flex flex-col gap-2">
              <div className="text-caption text-text-secondary font-medium flex justify-between"><span>Ảnh hiện tại</span>{r.ai && <span className={r.ai.quality < 70 ? 'text-status-rejected font-semibold' : 'text-status-active font-semibold'}>Chỉ số: {r.ai.quality}%</span>}</div>
              <div className="relative h-44 rounded-lg overflow-hidden bg-inverse-surface flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center"><FaceThumb seed={r.id.length + 2} size={176} round={false} revealed={revealed} /></div>
                {!revealed && (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-3 text-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white mb-2"><Icon name="visibility_off" /></div>
                    <span className="text-white text-[11px] font-medium mb-2.5">Hình ảnh sinh trắc được mã hóa bảo mật</span>
                    <button className="px-2.5 py-1 bg-surface text-[11px] font-semibold rounded shadow flex items-center gap-1" onClick={() => setRevealAsk(true)}><Icon name="remove_red_eye" size={14} />Xem rõ (sẽ được ghi log)</button>
                    <span className="text-slate-300 text-[10px] mt-1.5 flex items-center gap-0.5"><Icon name="shield" size={10} />Admin ID: {CURRENT_USER.id}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-text-secondary text-center">Trạm chụp: Kiosk #03 • 09:14 24/10/2025</span>
            </div>
          </div>
        </section>

        {r.ai && (
          <AiCard>
            <div className="flex justify-end -mt-8 mb-2"><span className="px-2 py-0.5 rounded bg-ai-border/10 text-ai-border text-[11px] font-semibold">Độ tin cậy mô hình: {r.ai.confidence}%</span></div>
            <div className="grid grid-cols-3 gap-space-sm">
              <Metric label="Chất lượng ảnh trực diện" value={`${r.ai.quality} / 100`} good={r.ai.quality >= 85} warn={r.ai.quality >= 60} sub={r.ai.quality < 85 ? 'Specular glare trán 38% • Lệch yaw 22°' : 'Đạt chuẩn ICAO'} />
              <Metric label="Khớp khuôn mặt CCCD" value={`${r.ai.match}%`} good={r.ai.match >= 90} sub={r.ai.match >= 90 ? 'Không phát hiện mạo danh' : 'Độ khớp thấp'} />
              <Metric label="Liveness / Deepfake" value={r.ai.liveness >= 90 ? 'PASS' : 'FAIL'} good={r.ai.liveness >= 90} sub={`${r.ai.liveness}% người thật`} />
            </div>
            <div className="mt-3 p-2.5 bg-surface/80 rounded text-body-sm leading-relaxed border-l-2 border-l-ai-border"><b>Nhận định hệ thống:</b> {r.ai.verdict}</div>
          </AiCard>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="section-title">2. Tiến trình phê duyệt</h2>
          <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
            {steps.map((s, i) => {
              const st = stepState(i);
              return (
                <div key={i} className={`relative ${st === 'off' ? 'opacity-60' : ''}`}>
                  <span className={`absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${st === 'done' ? 'bg-status-active text-white' : st === 'current' ? 'bg-primary-container text-white' : 'bg-surface-container-high text-text-secondary'}`}>
                    <Icon name={st === 'done' ? 'check' : st === 'current' ? 'edit' : 'lock_clock'} size={13} />
                  </span>
                  <div className={`p-3 rounded-lg ${st === 'current' ? 'bg-surface ring-1 ring-primary-container' : 'bg-surface-bright'}`}>
                    <div className="flex justify-between gap-2">
                      <span className={`text-label-md font-semibold ${st === 'current' ? 'text-primary-container' : ''}`}>{s.t}</span>
                      {st === 'current' ? <Chip color="status-pending">Chờ bạn phê duyệt</Chip> : s.time && <span className="text-caption text-text-secondary">{s.time}</span>}
                    </div>
                    <p className="text-body-sm text-text-secondary mt-0.5">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pt-2 border-t border-border-subtle">
          <div className="flex justify-between text-caption mb-2"><span className="font-semibold text-text-secondary uppercase">Nhật ký truy vết (Audit Trail)</span><span className="text-primary-container">Xem toàn bộ tại Nhật ký & Báo cáo</span></div>
          <div className="bg-surface-bright rounded p-2.5 text-caption font-mono text-text-secondary space-y-1.5">
            <div>[14:20:12] BIO-CLIENT KIOSK_03: Capture failed (specular highlight &gt; 35%)</div>
            <div>[14:20:45] REQUEST-SUBMIT: {r.subjectId} tạo {r.id}</div>
            <div className="text-ai-border">[14:21:03] AI-ENGINE: confidence {r.ai?.confidence ?? '—'}% (chỉ gợi ý)</div>
          </div>
        </section>
      </div>

      <div className="p-space-md border-t border-border-subtle flex items-center justify-between gap-space-md mt-auto">
        <div className="flex gap-2">
          <button className="btn-outline" disabled={closed} onClick={onForward}><Icon name="forward" />Chuyển cấp</button>
          <button className="btn border border-status-rejected/30 text-status-rejected hover:bg-status-rejected/10 disabled:opacity-40" disabled={closed} onClick={onReject}><Icon name="close" />Từ chối</button>
        </div>
        <div className="flex gap-2">
          {!closed && <button className="btn text-text-secondary hover:text-text-primary" title="Mô phỏng: sinh viên tự hủy qua App" onClick={onSimulateCancel}><Icon name="smartphone" />Mô phỏng hủy</button>}
          <button className="btn bg-primary-container text-white hover:bg-primary px-5 py-2 font-semibold disabled:opacity-40" disabled={closed} onClick={onApprove}>
            <Icon name="check_circle" />{r.twoPerson ? (r.firstApproval ? 'Xác nhận người thứ 2' : 'Xác nhận người thứ 1') : 'Phê duyệt yêu cầu'}
          </button>
        </div>
      </div>

      <ConfirmReason open={revealAsk} onClose={() => setRevealAsk(false)} title="Xem rõ ảnh khuôn mặt" subtitle={`${r.name} • ${r.subjectId}`} minLength={5}
        onConfirm={(reason) => { setRevealed(true); setRevealAsk(false); log(`Xem rõ ảnh khuôn mặt — ${reason}`, r.subjectId, 'sensitive'); toast('Đã giải mờ ảnh', 'Thao tác đã được ghi log.', 'warn'); }} />
    </>
  );
}

const Field = ({ label, value }) => <div><span className="text-caption text-text-secondary block">{label}</span><span>{value}</span></div>;
const Metric = ({ label, value, sub, good, warn }) => {
  const c = good ? 'text-status-active' : warn ? 'text-status-pending' : 'text-status-rejected';
  return (
    <div className="p-2.5 bg-surface rounded flex flex-col gap-1 shadow-soft">
      <span className="text-caption text-text-secondary">{label}</span>
      <span className={`text-headline-md font-bold ${c}`}>{value}</span>
      <span className="text-[11px] text-text-secondary">{sub}</span>
    </div>
  );
};

function ApproveModal({ open, r, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [sms, setSms] = useState(true);
  const [keep, setKeep] = useState(true);
  useEffect(() => { if (open) setReason(''); }, [open, r]);
  const ok = reason.trim().length >= 10;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-space-md border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary-container"><Icon name="verified_user" size={22} /></div>
          <div><h3 className="text-headline-md">Phê duyệt: {r.kindLabel}</h3><p className="text-caption text-text-secondary">Mã hồ sơ: <span className="font-mono font-medium text-text-primary">{r.id}</span> • {r.name}</p></div>
        </div>
        <button className="p-1 rounded-lg hover:bg-surface-container text-text-secondary" onClick={onClose}><Icon name="close" size={20} /></button>
      </div>
      <div className="p-space-md flex flex-col gap-space-md overflow-y-auto">
        <div className="p-3.5 rounded-lg bg-surface-bright flex gap-3 text-body-sm">
          <Icon name="info" size={20} className="text-primary-container mt-0.5" />
          <div>Xác nhận cho phép <b>{r.name} ({r.subjectId})</b> thực hiện thao tác “{r.kindLabel}”.<span className="text-text-secondary block mt-1">Lệnh phê duyệt sẽ được ghi vào Sổ cái kiểm toán (Immutable Audit Log).</span></div>
        </div>
        {r.twoPerson && <div className="p-3 rounded-lg bg-status-rejected/10 text-status-rejected text-body-sm flex gap-2"><Icon name="group" />Thao tác thu hồi yêu cầu 2 cán bộ độc lập xác nhận. {r.firstApproval ? `Xác nhận thứ nhất: ${r.firstApproval}.` : 'Bạn là người xác nhận thứ nhất.'}</div>}
        <div className="grid grid-cols-2 gap-space-sm bg-surface-container-low p-3.5 rounded-lg text-body-sm">
          <Field label="Trạm Kiosk áp dụng" value={<span className="font-medium flex items-center gap-1.5"><Icon name="point_of_sale" size={16} className="text-ai-border" />Kiosk 01, 02, 03</span>} />
          <Field label="Thời hạn hiệu lực" value={<span className="font-medium flex items-center gap-1.5"><Icon name="timelapse" size={16} className="text-status-pending" />48 giờ</span>} />
          <Field label="Số lần chụp tối đa" value={<span className="font-medium">01 lần (one-time slot)</span>} />
          <Field label="Thuật toán đối soát bắt buộc" value={<span className="font-mono text-[12px] font-medium">Liveness v3.2 + ICAO-9303</span>} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-semibold flex justify-between"><span>Lý do phê duyệt / Ghi chú kiểm toán <span className="text-status-rejected">*</span></span><span className="text-caption text-text-secondary font-normal">Bắt buộc theo ISO 27701</span></span>
          <textarea className="input leading-relaxed" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập căn cứ phê duyệt..." />
        </label>
        <label className="flex gap-2.5 text-body-sm cursor-pointer"><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-1 w-4 h-4 accent-primary-container" />Gửi SMS & thông báo đẩy qua App <b>MyDaiNam</b> kèm mã QR mở Kiosk.</label>
        <label className="flex gap-2.5 text-body-sm text-text-secondary cursor-pointer"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-1 w-4 h-4 accent-primary-container" />Lưu ảnh cũ vào kho đối soát lịch sử (Snapshot Retention 90 ngày).</label>
      </div>
      <div className="p-space-md bg-surface-bright border-t border-border-subtle flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="lock" size={16} className="text-ai-border" />Ký số định danh: <b>{CURRENT_USER.name} (PĐT)</b></span>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={onClose}>Hủy bỏ</button>
          <button className="btn bg-primary-container text-white hover:bg-primary px-5 font-semibold disabled:opacity-40" disabled={!ok} onClick={() => onConfirm(reason.trim())}><Icon name="check" />Xác nhận phê duyệt</button>
        </div>
      </div>
    </Modal>
  );
}

function ConsentDetail({ r, onDone }) {
  const done = r.status !== 'pending';
  const steps = [
    ['Khóa hồ sơ Face ID tại toàn bộ Kiosk & Edge Box', 'Vô hiệu hóa quyền quét tại cổng A, B, C và KTX', 'done'],
    ['Xóa ảnh chân dung gốc', 'Purge tệp ảnh khỏi server đệm và Blob Storage', 'done'],
    ['Xóa template sinh trắc (vector 512d)', 'Ghi đè embedding trong pgvector + đồng bộ xóa tập 1:K trên Edge', done ? 'done' : 'running'],
    ['Gửi biên bản xác nhận tới sinh viên', 'Email biên bản số xác nhận xóa dữ liệu vĩnh viễn', done ? 'done' : 'wait'],
  ];
  return (
    <>
      <div className="p-space-md border-b border-border-subtle flex flex-col gap-space-sm">
        <div className="flex items-center gap-2"><span className="text-headline-md font-bold">{r.id}</span><Chip color="secondary" className="text-label-sm">Rút đồng ý xử lý dữ liệu sinh trắc</Chip>{done && <Chip color="status-active">Hoàn tất</Chip>}</div>
        <div className="flex flex-wrap gap-x-4 text-caption text-text-secondary">
          <span className="flex items-center gap-1"><Icon name="gavel" size={16} />Căn cứ: <b>Nghị định 13/2023/NĐ-CP</b></span>
          <span className="flex items-center gap-1"><Icon name="schedule" size={16} />Gửi lúc: {r.created}</span>
          <span className="flex items-center gap-1 text-status-pending font-medium"><Icon name="timer" size={16} />Thực thi trong <b>72 giờ</b></span>
        </div>
      </div>
      <div className="p-space-md flex flex-col gap-space-md max-h-[calc(100vh-330px)] overflow-y-auto">
        <div className="bg-surface-bright p-space-md rounded-lg grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
          <Field label="Chủ thể dữ liệu" value={<b className="text-body-md">{r.name}</b>} />
          <Field label="Mã số sinh viên" value={<b className="font-mono text-primary-container">{r.subjectId}</b>} />
          <Field label="Khoa" value={r.unit} />
          <Field label="Xác thực chữ ký số OTP" value={<span className="font-mono text-caption font-semibold text-status-active">#OTP-9942 (Đã ký)</span>} />
          <div className="col-span-2 pt-2 border-t border-border-subtle"><span className="text-caption text-text-secondary block mb-1">Lý do rút chấp thuận:</span><div className="p-2.5 rounded bg-surface leading-relaxed border-l-2 border-l-secondary">“{r.note}”</div></div>
        </div>
        <section className="flex flex-col gap-3">
          <div className="flex justify-between"><h2 className="section-title">Tiến trình 4 bước tự động</h2><Chip color="ai">Quy chuẩn xóa dữ liệu ISO/IEC 27701</Chip></div>
          <div className="relative pl-7 space-y-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
            {steps.map(([t, d, s], i) => (
              <div key={t} className={`relative ${s === 'wait' ? 'opacity-70' : ''}`}>
                <span className={`absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${s === 'done' ? 'bg-status-active text-white' : s === 'running' ? 'bg-primary-container text-white animate-pulse' : 'bg-surface-container-high text-text-secondary'}`}><Icon name={s === 'done' ? 'check' : s === 'running' ? 'autorenew' : 'schedule'} size={13} /></span>
                <div className={`p-3 rounded-lg flex items-center justify-between gap-2 ${s === 'running' ? 'bg-surface ring-1 ring-primary-container' : 'bg-surface-bright'}`}>
                  <div><div className={`text-label-md font-semibold ${s === 'running' ? 'text-primary-container' : ''}`}>{i + 1}. {t}</div><div className="text-caption text-text-secondary">{d}</div></div>
                  {s === 'done' ? <Chip color="status-active">Đã hoàn thành</Chip> : s === 'running' ? <Chip color="primary">Đang xử lý (80%)</Chip> : <Chip color="neutral">Chờ bước 3</Chip>}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="p-space-md rounded-lg border border-border-subtle">
          <div className="flex items-center gap-2 mb-1"><Icon name="credit_card" size={22} className="text-secondary" /><h3 className="text-label-md font-bold">Phương án thay thế (phi sinh trắc)</h3></div>
          <p className="text-body-sm text-text-secondary">Bảo đảm đầy đủ quyền lợi học tập cho sinh viên theo luật định:</p>
          <div className="grid grid-cols-2 gap-space-sm mt-2">
            <div className="p-3 rounded-lg bg-surface-bright border border-border-subtle flex gap-2.5"><Icon name="contactless" className="text-primary-container" /><div><b className="text-label-sm block">Thẻ sinh viên RFID + PIN</b><span className="text-caption text-text-secondary">Chip Mifare DESFire, kiểm soát truy cập tại cổng.</span></div></div>
            <div className="p-3 rounded-lg bg-surface-bright border border-border-subtle flex gap-2.5"><Icon name="how_to_reg" className="text-status-active" /><div><b className="text-label-sm block">Điểm danh thủ công / BLE</b><span className="text-caption text-text-secondary">Giám thị đối soát thẻ + CCCD, không dùng camera khuôn mặt.</span></div></div>
          </div>
        </section>
      </div>
      <div className="p-space-md border-t border-border-subtle flex items-center justify-between mt-auto">
        <span className="flex items-center gap-1.5 text-caption text-text-secondary"><Icon name="gavel" size={16} className="text-secondary" />Quyền rút đồng ý không thể bị từ chối — không có nút từ chối.</span>
        <button className="btn bg-secondary text-white hover:opacity-90 px-6 py-2.5 font-semibold disabled:opacity-40" disabled={done} onClick={onDone}><Icon name="verified" />{done ? 'Đã xử lý' : 'Xác nhận đã xử lý'}</button>
      </div>
    </>
  );
}
