import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmReason, FaceThumb, Icon, Modal, Select } from '../components/ui';
import { useApp } from '../store';
import { useCameras, grabFrame } from '../hooks/useCameras';

const QUEUE = [
  { no: '01', name: 'Trần Hoàng Minh', id: '2024-7890', unit: 'Khoa CNTT (K69A)', state: 'Đã có mặt', tone: 'bg-status-active/10 text-status-active' },
  { no: '02', name: 'Lê Thị Mai Anh', id: '2024-8114', unit: 'Khoa Kinh tế Đối ngoại', state: 'Đang gọi', tone: 'bg-status-pending/10 text-status-pending' },
  { no: '03', name: 'Phạm Quốc Hưng', id: '2024-8255', unit: 'Khoa Luật Quốc tế', state: 'Chờ đến lượt', tone: 'bg-surface-container text-text-secondary' },
];
const CAMS = [['CAM 1: Trực diện', 'Sẵn sàng'], ['CAM 2: Chúc 15°', 'Sẵn sàng'], ['CAM 3: Ngửa 15°', 'Sẵn sàng'], ['CAM TOP: Đỉnh đầu', 'Giám sát OK']];
const CHECKS = ['Độ sáng chuẩn', 'Khuôn mặt chính diện', 'Mắt nhìn thẳng', 'Không đeo kính râm', 'Độ phân giải đạt chuẩn'];
const SOP = ['Yêu cầu sinh viên xuất trình CCCD gắn chip hoặc VNeID trước khi chụp.', 'Hướng dẫn tháo kính râm, gọng dày phản quang, khẩu trang và nón; vén tóc lộ rõ vành tai và trán.', 'Sinh viên ngồi thẳng lưng, nhìn vào CAM 1.', 'Hệ thống chụp đồng thời 4 camera, lưu 3 tư thế (trực diện, chúc 15°, ngửa 15°).'];
const STEPS = ['Nhận diện', 'Chụp ảnh', 'In thẻ', 'Lưu hồ sơ'];
const STEP_OF = { idle: 0, ready: 1, counting: 1, ok: 2, printed: 3 };
const TOAST_ICON = { info: ['info', 'text-primary-container'], success: ['check_circle', 'text-status-active'], warn: ['warning', 'text-status-pending'] };

const Kbd = ({ children, onDark }) => <kbd className={`px-1.5 py-0.5 rounded font-mono text-caption ${onDark ? 'bg-white/20 text-white' : 'bg-surface-container text-text-secondary'}`}>{children}</kbd>;

const actionBtn = (primary) => `h-14 px-4 rounded-lg text-k-label-lg flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-text-secondary disabled:border-transparent ${primary ? 'bg-primary-container text-on-primary hover:bg-primary border border-transparent' : 'bg-surface text-text-primary border border-border-strong hover:bg-surface-container-low'}`;

const CamPicker = ({ cams, onPicked }) => cams.devices.length > 0 && (
  <label className="flex items-center gap-2 text-k-label-md">
    <Icon name="videocam" className="text-text-secondary" />
    <Select className="min-h-[40px] w-[280px] text-k-label-md" label="Camera chính" value={cams.primary?.deviceId || ''} options={cams.devices.map((d) => ({ value: d.deviceId, label: `${d.label}${d.external ? ' (thiết bị gắn ngoài)' : ' (camera của máy)'}` }))}
      onChange={(id) => { cams.choosePrimary(id); onPicked(cams.devices.find((d) => d.deviceId === id)?.label); }} />
  </label>
);

function CamView({ label, status, phase, slot, videoRef, big }) {
  const localRef = useRef();
  const ref = videoRef || localRef;
  const [res, setRes] = useState('');
  const stream = slot?.stream;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream || null;
    if (stream) {
      v.play().catch(() => {});
      const s = stream.getVideoTracks()[0]?.getSettings() || {};
      setRes(s.height ? `${s.height}p${s.frameRate ? ` @ ${Math.round(s.frameRate)} FPS` : ''}` : '');
    }
  }, [stream, ref]);
  const live = !!stream;
  return (
    <div className="relative rounded-lg overflow-hidden bg-rail aspect-video flex flex-col justify-between p-2 text-caption">
      <video ref={ref} muted playsInline autoPlay className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${live ? '' : 'hidden'}`} />
      {!live && (
        <div className={`absolute inset-0 flex flex-col items-center gap-1 text-rail-text ${big ? 'justify-center' : 'justify-end pb-2'}`}>
          {big && <Icon name="videocam_off" size={40} />}
          <span>{slot ? 'Đang mở camera…' : 'Chưa kết nối'}</span>
        </div>
      )}
      {live && big && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`h-[62%] aspect-[3/4] rounded-[50%] border-2 ${phase === 'ok' || phase === 'printed' ? 'border-green-400' : 'border-white/70'}`} />
        </div>
      )}
      <div className="relative flex items-center justify-between gap-2 text-white">
        <span className="px-1.5 py-0.5 rounded bg-black/60 font-medium truncate">{label}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 ${live ? 'bg-green-500' : 'bg-rail-muted'}`} />
      </div>
      {(big || live) && (
        <div className="relative flex justify-between gap-2 text-white">
          <span className="px-1.5 py-0.5 rounded bg-black/60 truncate">{slot ? `${slot.label}${res ? ` • ${res}` : ''}` : '—'}</span>
          {big && <span className="px-1.5 py-0.5 rounded bg-black/60 shrink-0">{live ? status : 'Offline'}</span>}
        </div>
      )}
    </div>
  );
}

function Stepper({ current }) {
  return (
    <ol className="flex items-center gap-2 text-k-label-md" aria-label="Tiến trình phục vụ">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i === current ? 'step' : undefined} className="flex items-center gap-2">
          {i > 0 && <span className={`w-6 h-px ${i <= current ? 'bg-primary-container' : 'bg-border-strong'}`} />}
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-semibold ${i < current ? 'bg-primary-fixed text-primary' : i === current ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-text-secondary'}`}>
            {i < current ? <Icon name="check" size={14} /> : i + 1}
          </span>
          <span className={i === current ? 'font-semibold' : 'font-normal text-text-secondary'}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Kiosk() {
  const { log } = useApp();
  const [clock, setClock] = useState('');
  const [manual, setManual] = useState(false);
  const [mssv, setMssv] = useState('');
  const [toast, setToast] = useState(null);
  const [student, setStudent] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | ready | counting | ok | printed
  const [count, setCount] = useState(3);
  const [printed, setPrinted] = useState(142);
  const tRef = useRef();
  const countRef = useRef();
  const mainVideo = useRef();
  const [shot, setShot] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [revealAsk, setRevealAsk] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const cams = useCameras(4);
  const liveCount = cams.slots.filter((s) => s?.stream).length;

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);
  useEffect(() => () => { clearInterval(countRef.current); clearTimeout(tRef.current); }, []);

  const flash = useCallback((title, desc, tone = 'info') => {
    setToast({ title, desc, tone }); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 3000);
  }, []);
  const testFlash = useCallback(() => flash('Kiểm tra đèn Flash Studio', 'Đã nháy xung 5600K tại 4 góc đèn thành công!', 'success'), [flash]);

  const load = useCallback((s, title = 'Đã nạp hồ sơ') => { setStudent(s); setPhase('ready'); flash(title, `${s.name} (${s.id})`, 'success'); log('Kiosk nạp hồ sơ sinh viên', s.id, 'system'); }, [flash, log]);
  const scan = useCallback(() => load(QUEUE[0], 'Đã nhận diện thẻ RFID/CCCD'), [load]);
  const reset = useCallback(() => { clearInterval(countRef.current); setStudent(null); setPhase('idle'); setShot(null); setRevealed(false); setCancelAsk(false); }, []);
  // Đã có ảnh chưa lưu thì phải hỏi lại, tránh mất ảnh khi lỡ bấm Esc.
  const requestCancel = useCallback(() => { if (shot) setCancelAsk(true); else reset(); }, [shot, reset]);

  const capture = () => {
    if (!cams.primary?.stream) { flash('Chưa có camera', cams.error || 'Không có luồng hình từ camera chính.', 'warn'); return; }
    setPhase('counting'); setCount(3); setShot(null);
    let c = 3;
    countRef.current = setInterval(() => {
      c -= 1; setCount(c);
      if (c === 0) {
        clearInterval(countRef.current);
        const f = grabFrame(mainVideo.current);
        setShot(f); setPhase('ok');
        log(`Kiosk chụp ảnh từ “${cams.primary.label}”${f ? ` (${f.width}×${f.height})` : ''}`, student.id, 'system');
      }
    }, 700);
  };
  const print = () => { setPrinted((p) => p - 1); setPhase('printed'); log('In thẻ sinh viên', student.id, 'system'); flash('Đang in thẻ', `Zebra ZC300 • còn ${printed - 1} phôi`); };
  const save = () => { log('Lưu hồ sơ & đẩy ảnh qua API Ingestion', student.id, 'system'); flash('Đã lưu hồ sơ', 'Ảnh chuyển qua Quality Gating → trích xuất vector 512d.', 'success'); reset(); };

  useEffect(() => {
    const h = (e) => {
      if (manual || revealAsk || cancelAsk) return; // hộp thoại đang mở tự xử lý phím của nó
      // Space trên nút/ô đang focus phải kích hoạt chính phần tử đó, không phải quét thẻ.
      if (e.code === 'Space' && phase === 'idle' && !e.target.closest?.('button, a, input, textarea')) { e.preventDefault(); scan(); }
      if (e.key === 'F2') { e.preventDefault(); setManual(true); }
      if (e.key === 'F4') { e.preventDefault(); testFlash(); }
      if (e.key === 'Escape') requestCancel();
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [manual, revealAsk, cancelAsk, phase, scan, testFlash, requestCancel]);

  const done = phase === 'ok' || phase === 'printed';

  return (
    <div className="min-h-screen flex flex-col bg-background select-none" style={{ minWidth: 1280 }}>
      <header className="sticky top-0 z-40 h-14 px-6 bg-rail flex items-center justify-between gap-6 text-white">
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <div className="text-body-md font-semibold leading-tight">Trạm chụp số 03</div>
            <div className="text-caption text-rail-muted">DNU Capture Studio</div>
          </div>
          <span className="w-px h-7 bg-rail-line" />
          <div className="text-caption text-rail-text truncate">Đại học Đại Nam — Phòng Đào tạo<br />Room_ID: A102 • Nhà A1</div>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right"><div className="text-caption text-rail-muted">Phiên thu nhận</div><div className="text-caption font-mono">#TR3-2025-041</div></div>
          <div className="text-right"><div className="text-caption text-rail-muted">Thời gian trạm</div><div className="text-caption font-mono">{clock}</div></div>
          <span className="w-px h-7 bg-rail-line" />
          <div className="text-right"><div className="text-label-md leading-tight">Nguyễn Văn Tuấn</div><div className="text-caption text-rail-muted">CB-2041 | Ca trực sáng</div></div>
          <Link to="/" className="h-9 px-3 rounded flex items-center gap-1.5 text-label-md text-rail-text hover:bg-rail-hover hover:text-white focus-visible:outline-white"><Icon name="arrow_back" size={16} />Về Console</Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1880px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="min-w-0">
            <h1 className="text-k-headline-md truncate">{student ? `Đang phục vụ: ${student.name}` : liveCount ? 'Trạm sẵn sàng tiếp nhận' : cams.error ? 'Trạm chưa có camera' : 'Đang kiểm tra camera…'}</h1>
            <p className="text-caption text-text-secondary">Đồng bộ dữ liệu sinh viên K69 • Chuẩn ICAO 9303 • Liveness v3.2</p>
          </div>
          <Stepper current={STEP_OF[phase]} />
        </div>

        {cams.error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-k-label-md flex items-center gap-2" role="alert">
            <Icon name="videocam_off" />{cams.error}<button className="ml-auto h-9 px-3 rounded border border-status-rejected/40 hover:bg-status-rejected/10" onClick={cams.refresh}>Thử lại</button>
          </div>
        )}

        {!student ? (
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-7 flex flex-col gap-4">
              <section className="card p-6">
                <h2 className="text-k-headline-lg">Đặt CCCD hoặc quét mã để bắt đầu</h2>
                <p className="text-k-body text-text-secondary mt-1">Áp thẻ chip vào khe đọc bên phải bàn máy. Trạm tự kích hoạt khi phát hiện thẻ.</p>
                <div className="grid grid-cols-[3fr_2fr] gap-3 mt-5">
                  <button onClick={scan} className={`${actionBtn(true)} !h-16 !text-k-title-md`}><Icon name="contactless" size={24} />Quét thẻ<Kbd onDark>Space</Kbd></button>
                  <button onClick={() => setManual(true)} className={`${actionBtn(false)} !h-16`}><Icon name="keyboard" size={22} />Nhập mã sinh viên<Kbd>F2</Kbd></button>
                </div>
                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <h3 className="text-k-label-lg mb-2">Trước khi chụp</h3>
                  <ol className="list-decimal pl-5 space-y-1 text-k-caption font-normal text-text-secondary marker:text-text-secondary">
                    {SOP.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              </section>

              <section className="card p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="text-k-label-lg">Trạng thái 4 camera <span className="ml-1 font-normal font-mono text-text-secondary">{liveCount}/4</span></h2>
                    {!cams.error && <p className="text-caption text-text-secondary truncate">Phát hiện {cams.devices.length} camera • {cams.devices.some((d) => d.external) ? 'ưu tiên thiết bị gắn ngoài' : 'đang dùng camera mặc định của máy'} • tự nhận khi cắm/rút</p>}
                  </div>
                  <button className="h-10 px-3 rounded-lg border border-border-strong hover:bg-surface-container-low text-k-label-md flex items-center gap-1.5 shrink-0" onClick={testFlash}><Icon name="lightbulb" />Thử Flash<Kbd>F4</Kbd></button>
                </div>
                <div className="grid grid-cols-4 gap-2">{CAMS.map(([l, s], i) => <CamView key={l} slot={cams.slots[i]} label={l} status={s} phase={phase} />)}</div>
              </section>
            </div>

            <section className="col-span-5 card">
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-k-title-md">Hàng đợi hôm nay</h2>
                  <span className="text-k-caption font-normal text-text-secondary">Ca trực 07:30 - 11:30 • Đợt nhập học K69</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border-subtle mt-3">
                  {[['Đã hoàn tất', <>148<span className="text-k-body font-normal text-text-secondary">/250</span></>], ['Đang chờ tại trạm', '6'], ['Thẻ đã in & cấp', 284 - printed]].map(([l, v], i) => (
                    <div key={l} className={i ? 'pl-4' : ''}><div className="text-caption text-text-secondary">{l}</div><div className="text-k-headline-md tabular-nums">{v}</div></div>
                  ))}
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-surface-container overflow-hidden" role="progressbar" aria-label="Tiến độ ca trực" aria-valuenow={59} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-primary-container" style={{ width: '59%' }} /></div>
                <div className="mt-1 text-caption text-text-secondary">Tiến độ ca trực: 59%</div>
              </div>
              <h3 className="px-4 pb-2 text-k-label-md">3 sinh viên tiếp theo</h3>
              <div className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
                {QUEUE.map((s) => (
                  <button key={s.no} onClick={() => load(s)} className="min-h-[64px] px-4 py-2.5 hover:bg-surface-container-low flex items-center gap-3 text-left">
                    <span className="font-mono text-k-label-md text-text-secondary">{s.no}</span>
                    <span className="flex-1 min-w-0"><span className="block text-k-label-lg truncate">{s.name}</span><span className="block text-caption text-text-secondary truncate">MSSV: {s.id} • {s.unit}</span></span>
                    <span className={`px-2 py-1 rounded text-label-sm whitespace-nowrap ${s.tone}`}>{s.state}</span>
                    <Icon name="chevron_right" className="text-status-inactive" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 items-start anim-fade">
            <section className="col-span-8 card p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-k-title-md">Chụp ảnh đa góc</h2>
                <div className="flex items-center gap-2"><CamPicker cams={cams} onPicked={(name) => flash('Đã đổi camera chính', name)} /><button className="h-10 px-3 rounded-lg border border-border-strong hover:bg-surface-container-low text-k-label-md flex items-center gap-1.5 whitespace-nowrap" onClick={requestCancel}>Hủy phiên<Kbd>Esc</Kbd></button></div>
              </div>
              <div className="relative">
                <CamView big videoRef={mainVideo} slot={cams.primary} label="CAM 1: Trực diện" status={done ? 'Đã chụp' : 'Đang căn chỉnh'} phase={phase} />
                {shot && <div className="absolute bottom-10 right-2 w-44 rounded overflow-hidden border border-white/60 bg-black"><img src={shot.url} alt="Ảnh vừa chụp" className="w-full -scale-x-100" /><div className="text-caption text-white bg-black/70 px-1.5 py-0.5">Ảnh vừa chụp • {shot.width}×{shot.height}</div></div>}
                {phase === 'counting' && <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-[96px] font-semibold tabular-nums" aria-live="assertive">{count || ''}</div>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <button className={actionBtn(!done)} disabled={phase === 'counting'} onClick={capture}><Icon name="photo_camera" size={22} />{done ? 'Chụp lại' : 'Chụp ảnh'}</button>
                <button className={actionBtn(phase === 'ok')} disabled={phase !== 'ok'} onClick={print}><Icon name="print" size={22} />In thẻ</button>
                <button className={actionBtn(phase === 'printed')} disabled={!done} onClick={save}><Icon name="save" size={22} />Lưu hồ sơ</button>
              </div>
            </section>

            <div className="col-span-4 flex flex-col gap-4">
              <section className="card p-4">
                <div className="text-k-title-md">{student.name}</div>
                <div className="text-k-caption font-normal text-text-secondary"><span className="font-mono text-text-primary">{student.id}</span> • K69A • {student.unit}</div>
                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-3">
                  <FaceThumb seed={student.no ? Number(student.no) : 1} size={64} round={false} revealed={revealed} />
                  <div className="min-w-0">
                    <div className="text-caption text-text-secondary">{revealed ? 'Đang hiển thị ảnh cũ. Thao tác đã ghi nhật ký.' : 'Ảnh cũ được che khi màn hình chờ.'}</div>
                    {revealed
                      ? <button className="mt-1.5 h-9 px-3 rounded border border-border-strong hover:bg-surface-container-low text-label-md" onClick={() => setRevealed(false)}>Làm mờ lại</button>
                      : <button className="mt-1.5 h-9 px-3 rounded border border-border-strong hover:bg-surface-container-low text-label-md" onClick={() => setRevealAsk(true)}>Xem rõ (ghi nhật ký)</button>}
                  </div>
                </div>
                {phase === 'printed' && <div className="mt-3 p-2.5 rounded bg-status-active/10 text-status-active text-k-label-md flex items-center gap-2" role="status"><Icon name="check_circle" />Thẻ đã in — giao cho sinh viên và bấm “Lưu hồ sơ”.</div>}
              </section>

              <section className="card p-4">
                <h2 className="text-k-label-md font-semibold mb-2">Gợi ý của AI – Cán bộ duyệt quyết định</h2>
                <ul className="flex flex-col gap-1.5">
                  {CHECKS.map((c, i) => { const ok = done || (phase !== 'ready' && i < 3) || (phase === 'ready' && i !== 1); return (
                    <li key={c} className="flex items-start gap-2 text-k-caption font-normal"><Icon name={ok ? 'check_circle' : 'error'} size={18} className={ok ? 'text-status-active' : 'text-status-pending'} /><span>{c}{!ok && <span className="block text-caption text-status-pending">Xoay mặt thẳng camera</span>}</span></li>
                  ); })}
                </ul>
              </section>

              <section className="card p-4">
                <h2 className="text-k-label-md font-semibold mb-2">Camera phụ</h2>
                <div className="grid grid-cols-3 gap-2">{CAMS.slice(1).map(([l, s], i) => <CamView key={l} slot={cams.slots[i + 1]} label={l.split(':')[0]} status={s} phase={phase} />)}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button className="h-9 px-3 rounded border border-border-strong hover:bg-surface-container-low text-label-md flex items-center gap-1.5" onClick={testFlash}><Icon name="lightbulb" size={16} />Thử Flash<Kbd>F4</Kbd></button>
                  <button className="h-9 px-3 rounded text-label-md text-text-secondary hover:bg-surface-container-low hover:text-status-rejected flex items-center gap-1.5" onClick={() => flash('Đã ghi nhận lỗi', 'Báo lỗi gửi tới bộ phận kỹ thuật')}><Icon name="report" size={16} />Báo lỗi thiết bị</button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-40 h-9 px-6 bg-rail text-caption flex items-center gap-4 overflow-hidden">
        {[...['CAM 1', 'CAM 2', 'CAM 3', 'CAM TOP'].map((l, i) => [l, cams.slots[i]?.stream ? 'Sẵn sàng' : 'Không có', !!cams.slots[i]?.stream]), ['Đầu đọc thẻ RFID', student ? 'Đã quẹt thẻ' : 'USB OK', true], ['Máy in thẻ', `Sẵn sàng (còn ${printed} phôi)`, true], ['Mạng trường (LAN)', '1 Gbps', true]].map(([l, v, ok]) => (
          <span key={l} className="flex items-center gap-1.5 whitespace-nowrap"><span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-rail-muted'}`} /><span className="text-rail-muted">{l}:</span><span className={ok ? 'text-white' : 'text-rail-text'}>{v}</span></span>
        ))}
      </footer>

      {toast && (
        <div className="fixed top-[68px] right-6 z-50 w-[360px] bg-surface border border-border-subtle rounded-lg shadow-lg p-3 flex gap-2.5 anim-fade" role="status">
          <Icon name={TOAST_ICON[toast.tone][0]} size={22} className={TOAST_ICON[toast.tone][1]} />
          <div className="min-w-0"><div className="text-k-label-md">{toast.title}</div>{toast.desc && <div className="text-caption text-text-secondary">{toast.desc}</div>}</div>
        </div>
      )}

      <ConfirmReason open={revealAsk} onClose={() => setRevealAsk(false)} title="Xem rõ ảnh cũ" subtitle={student && `${student.name} • ${student.id}`} minLength={5}
        onConfirm={(reason) => { setRevealed(true); setRevealAsk(false); log(`Kiosk: xem rõ ảnh cũ — ${reason}`, student.id, 'sensitive'); flash('Đã giải mờ ảnh', 'Thao tác đã được ghi nhật ký.', 'warn'); }} />

      <Modal open={cancelAsk} onClose={() => setCancelAsk(false)} width="max-w-md">
        <div className="p-6">
          <h3 className="text-k-title-lg">Hủy phiên chụp?</h3>
          <p className="text-k-body text-text-secondary mt-1">Ảnh vừa chụp của {student?.name} chưa được lưu và sẽ bị xóa.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button className={actionBtn(false)} onClick={() => setCancelAsk(false)}>Tiếp tục phiên</button>
            <button className="h-14 px-4 rounded-lg text-k-label-lg bg-status-rejected text-white hover:bg-red-800" onClick={reset}>Hủy và xóa ảnh</button>
          </div>
        </div>
      </Modal>

      <Modal open={manual} onClose={() => setManual(false)}>
        <form className="p-6" onSubmit={(e) => { e.preventDefault(); if (!mssv.trim()) return; setManual(false); load({ name: 'Sinh viên tra cứu', id: mssv.trim(), unit: 'Đang tải từ IAM' }); setMssv(''); }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-k-headline-md">Nhập mã sinh viên</h3>
            <button type="button" aria-label="Đóng" className="w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-container flex items-center justify-center" onClick={() => setManual(false)}><Icon name="close" /></button>
          </div>
          <label className="block text-k-label-md mb-1.5" htmlFor="kiosk-mssv">Mã số sinh viên (MSSV) hoặc số CCCD</label>
          <input id="kiosk-mssv" autoFocus value={mssv} onChange={(e) => setMssv(e.target.value)} className="input !h-12 text-k-title-md font-mono select-text" placeholder="Ví dụ: 2024-7890" />
          <p className="mt-1.5 text-caption text-text-secondary">Nhấn Enter để tải thông tin và kích hoạt giàn camera.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className={actionBtn(false)} onClick={() => setManual(false)}>Hủy bỏ<Kbd>Esc</Kbd></button>
            <button className={actionBtn(true)} disabled={!mssv.trim()}>Tiếp nhận chụp ảnh<Icon name="arrow_forward" /></button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
