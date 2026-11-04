import { useCallback, useEffect, useRef, useState } from 'react';

// Camera tích hợp sẵn trên laptop thường có các tên này → xếp sau camera gắn ngoài (USB, capture card…)
const BUILT_IN = /integrated|built-?in|facetime|internal|tích hợp|ir camera/i;

const isBuiltIn = (d) => BUILT_IN.test(d.label || '');

/**
 * Mở camera thật trên máy.
 * - Ưu tiên thiết bị gắn ngoài; không có thì dùng camera mặc định của máy.
 * - Tự cập nhật khi cắm / rút thiết bị (sự kiện devicechange).
 * - Mỗi thiết bị mở 1 luồng; slot i nhận thiết bị thứ i theo thứ tự ưu tiên.
 */
export function useCameras(slotCount = 4) {
  const [devices, setDevices] = useState([]); // [{deviceId,label,external}]
  const [streams, setStreams] = useState({}); // deviceId -> MediaStream
  const [primaryId, setPrimaryId] = useState(null);
  const [error, setError] = useState(null);
  const streamsRef = useRef({});
  const manualRef = useRef(false);

  const openStream = useCallback(async (deviceId) => {
    if (streamsRef.current[deviceId]) return streamsRef.current[deviceId];
    const s = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    streamsRef.current[deviceId] = s;
    return s;
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ camera (cần mở qua http://localhost hoặc https).');
      return;
    }
    try {
      // Xin quyền một lần để trình duyệt trả về tên thiết bị
      if (!Object.keys(streamsRef.current).length) {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const id = probe.getVideoTracks()[0]?.getSettings().deviceId;
        if (id) streamsRef.current[id] = probe; else probe.getTracks().forEach((t) => t.stop());
      }
      const all = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      const list = all
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}`, external: !isBuiltIn(d) }))
        .sort((a, b) => Number(b.external) - Number(a.external));

      // Đóng luồng của thiết bị đã rút ra
      Object.keys(streamsRef.current).forEach((id) => {
        if (!list.some((d) => d.deviceId === id)) {
          streamsRef.current[id].getTracks().forEach((t) => t.stop());
          delete streamsRef.current[id];
        }
      });

      const wanted = list.slice(0, slotCount);
      await Promise.all(wanted.map((d) => openStream(d.deviceId).catch(() => null)));
      setDevices(list);
      setStreams({ ...streamsRef.current });
      setPrimaryId((cur) => (manualRef.current && list.some((d) => d.deviceId === cur) ? cur : list[0]?.deviceId ?? null));
      setError(list.length ? null : 'Không tìm thấy camera nào trên máy.');
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Bạn chưa cho phép truy cập camera. Bấm biểu tượng camera trên thanh địa chỉ để cho phép.' : e.name === 'NotReadableError' ? 'Camera đang được ứng dụng khác sử dụng.' : `Không mở được camera: ${e.message}`);
    }
  }, [openStream, slotCount]);

  const choosePrimary = useCallback(async (deviceId) => {
    manualRef.current = true;
    try { await openStream(deviceId); setStreams({ ...streamsRef.current }); } catch { /* giữ nguyên */ }
    setPrimaryId(deviceId);
  }, [openStream]);

  useEffect(() => {
    refresh();
    const md = navigator.mediaDevices;
    md?.addEventListener?.('devicechange', refresh);
    return () => {
      md?.removeEventListener?.('devicechange', refresh);
      Object.values(streamsRef.current).forEach((s) => s.getTracks().forEach((t) => t.stop()));
      streamsRef.current = {};
    };
  }, [refresh]);

  // Slot 0 = camera chính; các slot còn lại lần lượt là thiết bị khác
  const ordered = [devices.find((d) => d.deviceId === primaryId), ...devices.filter((d) => d.deviceId !== primaryId)].filter(Boolean);
  const slots = Array.from({ length: slotCount }, (_, i) => {
    const d = ordered[i];
    return d ? { ...d, stream: streams[d.deviceId] || null } : null;
  });

  return { devices, slots, primary: slots[0], error, refresh, choosePrimary };
}

/** Chụp 1 khung hình từ thẻ <video> → dataURL JPEG */
export function grabFrame(video) {
  if (!video || !video.videoWidth) return null;
  const c = document.createElement('canvas');
  c.width = video.videoWidth; c.height = video.videoHeight;
  c.getContext('2d').drawImage(video, 0, 0);
  return { url: c.toDataURL('image/jpeg', 0.92), width: c.width, height: c.height };
}
