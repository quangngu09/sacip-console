import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Modal } from '../components/ui';
import { useApp } from '../store';
import { useCameras, grabFrame } from '../hooks/useCameras';

const QUEUE = [
  { no: '01', name: 'Trần Hoàng Minh', id: '2024-7890', unit: 'Khoa CNTT (K69A)', state: 'Đã có mặt' },
  { no: '02', name: 'Lê Thị Mai Anh', id: '2024-8114', unit: 'Khoa Kinh tế Đối ngoại', state: 'Đang gọi' },
  { no: '03', name: 'Phạm Quốc Hưng', id: '2024-8255', unit: 'Khoa Luật Quốc tế', state: 'Chờ đến lượt' },
];
const CAMS = [['CAM 1: Trực diện', 'Sẵn sàng'], ['CAM 2: Chúc 15°', 'Sẵn sàng'], ['CAM 3: Ngửa 15°', 'Sẵn sàng'], ['CAM TOP: Đỉnh đầu', 'Giám sát OK']];
const CHECKS = ['Độ sáng chuẩn', 'Khuôn mặt chính diện', 'Mắt nhìn thẳng', 'Không đeo kính râm', 'Độ phân giải đạt chuẩn'];

function CamView({ label, status, active, phase, slot, videoRef, big }) {
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
    <div className="relative rounded-[6px] overflow-hidden bg-inverse-surface aspect-video flex flex-col justify-between p-2">
      <video ref={ref} muted playsInline autoPlay className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${live ? '' : 'hidden'}`} />
      {!live && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1">
          <Icon name="videocam_off" size={big ? 40 : 26} />
          <span className="text-k-caption">{slot ? 'Đang mở camera…' : 'Chưa kết nối thiết bị'}</span>
        </div>
      )}
      {live && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`h-[62%] aspect-[3/4] rounded-[50%] border-2 ${phase === 'ok' ? 'border-status-active' : active ? 'border-ai-border' : 'border-white/40'}`} />
        </div>
      )}
      <div className="relative flex justify-between gap-2"><span className="px-2 py-0.5 rounded bg-black/60 text-white text-k-caption font-bold truncate">{label}</span><span className={`w-2 h-2 rounded-full shrink-0 ${live ? 'bg-status-active' : 'bg-status-inactive'}`} /></div>
      <div className="relative flex justify-between gap-2 text-white text-k-caption">
        <span className="px-1.5 rounded bg-black/40 truncate">{slot ? `${slot.label}${res ? ` • ${res}` : ''}` : '—'}</span>
        <span className="px-1.5 rounded bg-black/40 text-tertiary-fixed shrink-0">{live ? status : 'Offline'}</span>
      </div>
    </div>
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
  const mainVideo = useRef();
  const [shot, setShot] = useState(null);
  const cams = useCameras(4);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);

  const flash = useCallback((title, desc) => {
    setToast({ title, desc }); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback((s) => { setStudent(s); setPhase('ready'); flash('Đã nhận diện thẻ RFID/CCCD', `Đang nạp hồ sơ: ${s.name} (${s.id})`); log('Kiosk nạp hồ sơ sinh viên', s.id, 'system'); }, [flash, log]);
  const scan = useCallback(() => load(QUEUE[0]), [load]);

  const capture = () => {
    if (!cams.primary?.stream) { flash('Chưa có camera', cams.error || 'Không có luồng hình từ camera chính.'); return; }
    setPhase('counting'); setCount(3); setShot(null);
    let c = 3;
    const i = setInterval(() => {
      c -= 1; setCount(c);
      if (c === 0) {
        clearInterval(i);
        const f = grabFrame(mainVideo.current);
        setShot(f); setPhase('ok');
        log(`Kiosk chụp ảnh từ “${cams.primary.label}”${f ? ` (${f.width}×${f.height})` : ''}`, student.id, 'system');
      }
    }, 700);
  };

  const CamPicker = ({ className = '' }) => cams.devices.length > 0 && (
    <label className={`flex items-center gap-2 text-k-label-md ${className}`}>
      <Icon name="videocam" className="text-primary" />
      <select className="h-10 px-2 rounded-lg border-2 border-border-strong bg-white max-w-[280px] outline-none focus:border-primary-container" value={cams.primary?.deviceId || ''} onChange={(e) => { cams.choosePrimary(e.target.value); flash('Đã đổi camera chính', cams.devices.find((d) => d.deviceId === e.target.value)?.label); }}>
        {cams.devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}{d.external ? ' (thiết bị gắn ngoài)' : ' (camera của máy)'}</option>)}
      </select>
    </label>
  );

  useEffect(() => {
    const h = (e) => {
      if (manual) { if (e.key === 'Escape') setManual(false); return; }
      if (e.code === 'Space' && phase === 'idle') { e.preventDefault(); scan(); }
      if (e.key === 'F2') { e.preventDefault(); setManual(true); }
      if (e.key === 'F4') { e.preventDefault(); flash('Kiểm tra đèn Flash Studio', 'Đã nháy xung 5600K tại 4 góc đèn thành công!'); }
      if (e.key === 'Escape') { setStudent(null); setPhase('idle'); setShot(null); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [manual, phase, scan, flash]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] select-none" style={{ minWidth: 1280 }}>
      <header className="fixed top-0 left-0 w-full z-40 bg-white border-b border-border-subtle">
        <div className="h-7 bg-primary px-3 flex items-center justify-between text-white text-[12px] font-medium tracking-wide">
          <span className="flex items-center gap-2"><Icon name="badge" size={15} />HỆ THỐNG TRẠM THẺ & ĐĂNG KÝ SINH TRẮC HỌC (FACE ID) — DNU CAPTURE STUDIO</span>
          <Link to="/" className="flex items-center gap-1 hover:underline"><Icon name="arrow_back" size={14} />Về Console quản trị</Link>
        </div>
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center"><Icon name="school" size={24} /></div>
            <div><div className="text-k-label-lg tracking-tight">ĐẠI HỌC ĐẠI NAM — PHÒNG ĐÀO TẠO</div><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-surface-container-high text-primary text-k-caption font-bold border border-border-subtle">TRẠM CHỤP SỐ 03</span><span className="text-k-caption text-text-secondary">Room_ID: A102 • Nhà A1</span></div></div>
          </div>
          <nav className="flex gap-2">
            {['Thu Nhận Ảnh', 'Danh Sách Chờ', 'Phát Hành Thẻ', 'Chẩn Đoán Thiết Bị'].map((n, i) => <button key={n} className={`px-4 py-2 rounded-lg text-k-label-md ${i === 0 ? 'bg-primary-container text-white' : 'text-[#444651] hover:bg-surface-container-high'}`}>{n}</button>)}
          </nav>
          <div className="flex items-center gap-4"><div className="text-right"><div className="text-k-label-md">Nguyễn Văn Tuấn</div><div className="text-k-caption text-text-secondary">CB-2041 | Ca trực sáng</div></div><div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center"><Icon name="person" /></div></div>
        </div>
      </header>

      <main className="pt-[92px] pb-[72px] max-w-[1880px] mx-auto px-6">
        <div className="my-6 flex items-center justify-between bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center gap-4">
            <span className="relative flex items-center justify-center"><span className="w-4 h-4 rounded-full bg-status-active" /><span className="absolute w-6 h-6 rounded-full bg-status-active opacity-40 animate-ping" /></span>
            <div>
              <div className="flex items-center gap-3"><h1 className="text-k-headline-lg tracking-tight">{student ? 'ĐANG PHỤC VỤ SINH VIÊN' : 'TRẠM CHỤP SẴN SÀNG TIẾP NHẬN'}</h1><span className="px-3 py-1 rounded-full bg-status-active/10 text-status-active text-k-label-md flex items-center gap-1"><Icon name="check_circle" size={16} />HOẠT ĐỘNG CHUẨN</span></div>
              <p className="text-k-body text-text-secondary">Đồng bộ dữ liệu sinh viên K69 • Chuẩn ICAO 9303 • Liveness v3.2</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-surface-container-low text-right"><div className="text-k-caption text-text-secondary">THỜI GIAN TRẠM</div><div className="text-k-title-md font-mono font-bold">{clock}</div></div>
            <div className="px-4 py-2 rounded-lg bg-surface-container-low text-right"><div className="text-k-caption text-text-secondary">PHIÊN THU NHẬN</div><div className="text-k-title-md text-primary">#TR3-2025-041</div></div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          <section className="col-span-7 flex flex-col gap-6">
            {!student ? (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex justify-between mb-4"><span className="flex items-center gap-2 text-k-title-md font-bold"><Icon name="contactless" size={28} className="text-primary" />CỔNG TIẾP NHẬN SINH VIÊN TỰ ĐỘNG</span><span className="text-k-caption font-mono bg-surface-container-high px-2.5 py-1 rounded">SẴN SÀNG NHẬN TÍN HIỆU RFID/QR</span></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-xl bg-surface-container-low text-center"><div className="w-24 h-24 mx-auto rounded-2xl bg-white shadow-md flex items-center justify-center mb-4 relative"><Icon name="credit_card" size={52} className="text-primary" /><Icon name="wifi_tethering" size={24} className="text-secondary absolute -top-1 -right-1 animate-bounce" /></div><h3 className="text-k-title-md">1. Đặt Thẻ CCCD / Thẻ Cũ</h3><p className="text-k-body text-text-secondary mt-1">Áp thẻ chip vào khe đọc bên phải bàn máy để xác thực danh tính</p></div>
                  <div className="p-6 rounded-xl bg-surface-container-low text-center"><div className="w-24 h-24 mx-auto rounded-2xl bg-primary/80 shadow-md flex items-center justify-center mb-4"><Icon name="face" size={48} className="text-white" /></div><h3 className="text-k-title-md">2. Canh Chỉnh Khuôn Mặt</h3><p className="text-k-body text-text-secondary mt-1">Ngồi thẳng lưng, nhìn vào CAM 1. Tháo khẩu trang & nón</p></div>
                </div>
                <button onClick={scan} className="mt-6 w-full h-20 rounded-xl bg-primary hover:bg-primary-container text-white shadow-lg flex items-center justify-between px-6 active:scale-[0.99] transition">
                  <span className="flex items-center gap-4"><span className="w-14 h-14 rounded-lg bg-white/15 flex items-center justify-center"><Icon name="qr_code_scanner" size={32} /></span><span className="text-left"><span className="block text-k-headline-md">QUÉT MÃ VẠCH / ĐẶT CCCD ĐỂ BẮT ĐẦU</span><span className="block text-k-body text-on-primary-container">Tự động kích hoạt khi phát hiện thẻ chip hoặc nhấn nút này</span></span></span>
                  <span className="bg-white/20 px-3.5 py-1.5 rounded-lg font-mono text-k-label-md">PHÍM SPACE</span>
                </button>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button onClick={() => setManual(true)} className="h-16 rounded-xl bg-white border-2 border-border-strong hover:bg-surface-container-low flex items-center justify-between px-4"><span className="flex items-center gap-3"><Icon name="keyboard" size={28} className="text-primary" /><span className="text-left"><span className="block text-k-label-lg">Nhập Mã Sinh Viên Thủ Công</span><span className="block text-k-caption text-text-secondary">Tra cứu danh sách hồ sơ</span></span></span><kbd className="px-2.5 py-1 rounded bg-surface-container-high font-mono text-k-caption font-bold">F2</kbd></button>
                  <button onClick={() => flash('Hàng đợi trạm số 03', '6 sinh viên đang chờ tiếp nhận')} className="h-16 rounded-xl bg-white border-2 border-border-strong hover:bg-surface-container-low flex items-center justify-between px-4"><span className="flex items-center gap-3"><Icon name="format_list_numbered" size={28} className="text-secondary" /><span className="text-left"><span className="block text-k-label-lg">Xem Hàng Đợi Trạm 03</span><span className="block text-k-caption text-text-secondary">Còn 6 sinh viên đang chờ</span></span></span><kbd className="px-2.5 py-1 rounded bg-surface-container-high font-mono text-k-caption font-bold">F3</kbd></button>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2 text-primary mb-2"><Icon name="verified_user" /><span className="text-k-label-lg uppercase">Quy trình vận hành chuẩn cho cán bộ</span></div>
                  <ol className="space-y-2 text-k-body text-text-secondary">
                    {['Yêu cầu sinh viên xuất trình CCCD gắn chip hoặc VNeID trước khi chụp.', 'Hướng dẫn tháo kính râm, gọng dày phản quang; vén tóc lộ rõ vành tai và trán.', 'Hệ thống chụp đồng thời 4 camera, lưu 3 tư thế (trực diện, chúc 15°, ngửa 15°).'].map((s, i) => (
                      <li key={i} className="flex gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-k-caption shrink-0">{i + 1}</span>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-6 anim-fade">
                <div className="flex justify-between mb-4"><span className="text-k-title-lg flex items-center gap-2"><Icon name="photo_camera" className="text-primary" size={26} />Chụp ảnh đa góc</span>
                  <div className="flex items-center gap-2"><CamPicker /><button className="h-10 px-3 rounded-lg border-2 border-border-strong text-k-label-md flex items-center gap-1 whitespace-nowrap" onClick={() => { setStudent(null); setPhase('idle'); setShot(null); }}><Icon name="close" />Hủy phiên (Esc)</button></div></div>
                {cams.error && <div className="mb-3 p-3 rounded-lg bg-[#FEE2E2] border border-status-rejected text-status-rejected text-k-body flex items-center gap-2"><Icon name="videocam_off" />{cams.error}<button className="ml-auto underline text-k-label-md" onClick={cams.refresh}>Thử lại</button></div>}
                <div className="relative">
                  <CamView big videoRef={mainVideo} slot={cams.primary} label="CAM 1: Trực diện — LIVE" status={phase === 'ok' ? 'Đã chụp' : 'Đang căn chỉnh'} active phase={phase} />
                  {shot && <div className="absolute bottom-10 right-3 w-36 rounded-lg overflow-hidden border-2 border-status-active shadow-lg bg-black"><img src={shot.url} alt="Ảnh vừa chụp" className="w-full -scale-x-100" /><div className="text-[11px] text-white bg-status-active px-1.5 py-0.5">Ảnh vừa chụp • {shot.width}×{shot.height}</div></div>}
                  {phase === 'counting' && <div className="absolute inset-0 flex items-center justify-center text-white text-[96px] font-bold drop-shadow-lg">{count || ''}</div>}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-ai-surface border-2 border-ai-border">
                  <div className="text-k-label-md text-secondary mb-2 flex items-center gap-1.5"><Icon name="smart_toy" />Gợi ý của AI – Cán bộ duyệt quyết định</div>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECKS.map((c, i) => { const ok = phase === 'ok' || (phase !== 'ready' && i < 3) || (phase === 'ready' && i !== 1); return (
                      <div key={c} className="flex items-center gap-2 text-k-body"><Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} className={ok ? 'text-status-active' : 'text-status-pending'} />{c}{!ok && <span className="text-k-caption text-status-pending">— xoay mặt thẳng camera</span>}</div>
                    ); })}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button className="h-16 rounded-lg bg-primary-container hover:bg-[#172554] text-white text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-40" disabled={phase === 'counting'} onClick={capture}><Icon name="photo_camera" size={24} />{phase === 'ok' ? 'Chụp Lại' : 'Chụp Ảnh'}</button>
                  <button className="h-16 rounded-lg bg-white border-2 border-border-strong text-k-label-lg flex items-center justify-center gap-2 disabled:opacity-40" disabled={phase !== 'ok'} onClick={() => { setPrinted((p) => p - 1); setPhase('printed'); log('In thẻ sinh viên', student.id, 'system'); flash('Đang in thẻ', `Zebra ZC300 • còn ${printed - 1} phôi`); }}><Icon name="print" size={24} />In Thẻ</button>
                  <button className="h-16 rounded-lg bg-white border-2 border-border-strong text-k-label-lg flex items-center justify-center gap-2 disabled:opacity-40" disabled={phase !== 'ok' && phase !== 'printed'} onClick={() => { log('Lưu hồ sơ & đẩy ảnh qua API Ingestion', student.id, 'system'); flash('Đã lưu hồ sơ', 'Ảnh chuyển qua Quality Gating → trích xuất vector 512d.'); setStudent(null); setPhase('idle'); setShot(null); }}><Icon name="save" size={24} />Lưu Hồ Sơ</button>
                </div>
                <button className="mt-3 w-full h-14 rounded-lg bg-[#FEE2E2] border-2 border-status-rejected text-status-rejected text-k-label-lg flex items-center justify-center gap-2" onClick={() => flash('Đã ghi nhận lỗi', 'Báo lỗi gửi tới bộ phận kỹ thuật')}><Icon name="report" />Báo Lỗi Thiết Bị</button>
              </div>
            )}
          </section>

          <section className="col-span-5 flex flex-col gap-6">
            {student ? (
              <div className="bg-white rounded-xl shadow-soft p-6 anim-fade">
                <h2 className="text-k-title-lg mb-4">HỒ SƠ SINH VIÊN</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[['MÃ SV', student.id], ['HỌ VÀ TÊN', student.name], ['LỚP', 'K69A'], ['KHOA', student.unit]].map(([l, v]) => (
                    <div key={l}><div className="text-k-label-md text-text-secondary uppercase">{l}</div><div className="text-[18px] font-semibold">{v}</div></div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-surface-container-low flex items-center gap-4">
                  <div className="w-24 h-28 rounded-lg bg-slate-700/80 flex flex-col items-center justify-center text-white"><Icon name="visibility_off" size={28} /><span className="text-[11px] mt-1">Màn che riêng tư</span></div>
                  <div className="text-k-body text-text-secondary">Ảnh cũ được che khi màn hình chờ.<br /><button className="mt-2 h-10 px-3 rounded-lg bg-white border-2 border-border-strong text-k-label-md text-text-primary" onClick={() => { log('Kiosk: xem rõ ảnh cũ', student.id, 'sensitive'); flash('Đã ghi nhận nhật ký', 'Thao tác xem ảnh được lưu vết.'); }}>Xem rõ (ghi nhận nhật ký)</button></div>
                </div>
                {phase === 'printed' && <div className="mt-4 p-3 rounded-lg bg-status-active/10 text-status-active text-k-label-md flex items-center gap-2"><Icon name="check_circle" />Thẻ đã in — giao cho sinh viên và bấm “Lưu Hồ Sơ”.</div>}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex justify-between mb-4"><div><h2 className="text-k-title-lg">TỔNG QUAN HÀNG ĐỢI HÔM NAY</h2><p className="text-k-body text-text-secondary">Ca trực: 07:30 - 11:30 | Đợt nhập học K69</p></div><span className="text-k-headline-md text-primary font-bold">148<span className="text-k-title-md text-text-secondary font-normal">/250</span></span></div>
                <div className="flex justify-between text-k-label-md mb-1"><span>Tiến độ ca trực</span><span className="text-primary font-bold">59% hoàn tất</span></div>
                <div className="h-3 rounded-full bg-surface-container-high overflow-hidden mb-4"><div className="h-full bg-primary rounded-full" style={{ width: '59%' }} /></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-surface-container-low"><div className="text-k-caption text-text-secondary">Đang chờ tại trạm</div><div className="text-k-headline-md font-bold">6 <span className="text-k-body text-text-secondary font-normal">sinh viên</span></div></div>
                  <div className="p-3 rounded-lg bg-surface-container-low"><div className="text-k-caption text-text-secondary">Thẻ đã in & cấp</div><div className="text-k-headline-md font-bold text-secondary">{284 - printed} <span className="text-k-body text-text-secondary font-normal">thẻ</span></div></div>
                </div>
                <div className="text-k-caption text-text-secondary uppercase font-semibold mb-2">3 sinh viên tiếp theo</div>
                <div className="flex flex-col gap-2">
                  {QUEUE.map((s, i) => (
                    <button key={s.no} onClick={() => load(s)} className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left">
                      <span className="flex items-center gap-3"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-k-label-md ${i === 0 ? 'bg-primary text-white' : 'bg-surface-container-high'}`}>{s.no}</span><span><span className="block text-k-label-lg">{s.name}</span><span className="block text-k-caption text-text-secondary">MSSV: {s.id} • {s.unit}</span></span></span>
                      <span className={`px-2.5 py-1 rounded text-k-label-md ${i === 0 ? 'bg-status-active/10 text-status-active' : i === 1 ? 'bg-status-pending/10 text-status-pending' : 'bg-surface-container-high text-text-secondary'}`}>{s.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex justify-between mb-3"><div><h2 className="text-k-title-lg">TRẠNG THÁI 4 CAMERA</h2><p className="text-k-body text-text-secondary">Đồng bộ đa góc phục vụ trích xuất Face 3D</p></div>
                <button className="h-10 px-3 rounded-lg bg-surface-container-high text-k-label-md flex items-center gap-1.5" onClick={() => flash('Kiểm tra đèn Flash Studio', 'Đã nháy xung 5600K tại 4 góc đèn thành công!')}><Icon name="lightbulb" />Thử Flash [F4]</button></div>
              {cams.error && !student && <div className="mb-3 p-3 rounded-lg bg-[#FEE2E2] text-status-rejected text-k-caption flex items-center gap-2"><Icon name="videocam_off" />{cams.error}<button className="ml-auto underline" onClick={cams.refresh}>Thử lại</button></div>}
              {!cams.error && <p className="mb-3 text-k-caption text-text-secondary">Phát hiện {cams.devices.length} camera • {cams.devices.some((d) => d.external) ? 'ưu tiên thiết bị gắn ngoài' : 'đang dùng camera mặc định của máy'} • tự nhận khi cắm/rút</p>}
              <div className="grid grid-cols-2 gap-3">{CAMS.map(([l, s], i) => <CamView key={l} slot={cams.slots[i]} label={l} status={s} active={!!student} phase={phase} />)}</div>
            </div>
          </section>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-40 bg-[#0F172A] text-[#F8FAFC] h-14 px-6 flex items-center justify-between text-k-caption">
        <div className="flex items-center divide-x divide-slate-700">
          {[...['CAM 1', 'CAM 2', 'CAM 3', 'CAM TOP'].map((l, i) => [l, cams.slots[i]?.stream ? 'Sẵn sàng' : 'Không có', !!cams.slots[i]?.stream]), ['Đầu đọc thẻ RFID', student ? 'Đã quẹt thẻ' : 'USB OK', true], ['Máy in thẻ', `Sẵn sàng (còn ${printed} phôi)`, true], ['Mạng trường (LAN)', '1 Gbps', true]].map(([l, v, ok], i) => (
            <span key={l} className={`flex items-center gap-1.5 whitespace-nowrap ${i ? "px-2.5" : "pr-2.5"}`}><span className={`w-2 h-2 rounded-full ${ok ? 'bg-status-active' : 'bg-status-inactive'}`} /><b className="text-slate-200">{l}:</b><span className={ok ? 'text-emerald-400' : 'text-slate-400'}>{v}</span></span>
          ))}
        </div>
        <div className="hidden 2xl:flex gap-4 text-slate-400 font-mono text-[12px] whitespace-nowrap">{[['F2', 'Nhập mã'], ['F4', 'Flash'], ['Space', 'Quét thẻ'], ['Esc', 'Hủy']].map(([k, l]) => <span key={k}><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600">{k}</kbd> {l}</span>)}</div>
      </footer>

      {toast && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-xl shadow-2xl anim-fade">
          <Icon name="sync" size={26} className="text-tertiary-fixed animate-spin" />
          <div><div className="text-k-label-lg">{toast.title}</div><div className="text-k-body text-primary-fixed">{toast.desc}</div></div>
        </div>
      )}

      <Modal open={manual} onClose={() => setManual(false)}>
        <div className="p-8">
          <div className="flex justify-between pb-4"><div className="flex gap-3"><div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon name="badge" size={26} /></div><div><h3 className="text-k-headline-md">Nhập Mã Sinh Viên</h3><p className="text-k-body text-text-secondary">Tra cứu hồ sơ thủ công [F2]</p></div></div><button className="w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-container-high" onClick={() => setManual(false)}><Icon name="close" /></button></div>
          <form onSubmit={(e) => { e.preventDefault(); if (!mssv.trim()) return; setManual(false); load({ name: 'Sinh viên tra cứu', id: mssv.trim(), unit: 'Đang tải từ IAM' }); setMssv(''); }}>
            <label className="block text-k-label-lg mb-2">Mã số sinh viên (MSSV) hoặc số CCCD</label>
            <div className="relative"><Icon name="search" className="absolute left-4 top-4 text-text-secondary" size={22} /><input autoFocus value={mssv} onChange={(e) => setMssv(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-lg border-[1.5px] border-border-strong focus:border-2 focus:border-primary-container outline-none text-k-title-md" placeholder="Ví dụ: 2024-7890" /></div>
            <div className="mt-4 p-4 rounded-lg bg-ai-surface text-k-body flex gap-3"><Icon name="info" className="text-secondary" />Nhấn Enter để tải thông tin và kích hoạt giàn camera.</div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="h-14 px-6 rounded-lg bg-surface-container-high text-k-label-lg" onClick={() => setManual(false)}>Hủy Bỏ (Esc)</button><button className="h-14 px-8 rounded-lg bg-primary hover:bg-primary-container text-white text-k-label-lg flex items-center gap-2">Tiếp Nhận Chụp Ảnh<Icon name="arrow_forward" /></button></div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
