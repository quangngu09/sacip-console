import { useCallback, useEffect, useRef, useState } from 'react';

// Camera tích hợp sẵn trên laptop thường có các tên này → xếp sau camera gắn ngoài (USB, capture card…)
const BUILT_IN = /integrated|built-?in|facetime|internal|tích hợp|ir camera/i;

const isBuiltIn = (d) => BUILT_IN.test(d.label || '');

const ASSIGN_KEY = 'sacip.kioskCameras';
const readAssigned = () => {
  try { const v = JSON.parse(localStorage.getItem(ASSIGN_KEY)); return Array.isArray(v) ? v : null; } catch { return null; }
};
const writeAssigned = (v) => {
  try { if (v) localStorage.setItem(ASSIGN_KEY, JSON.stringify(v)); else localStorage.removeItem(ASSIGN_KEY); } catch { /* Không lưu được thì chỉ giữ trong phiên này. */ }
};

// Nhiều camera cùng model có tên giống hệt nhau: đánh số để phân biệt khi chọn.
const numberDuplicates = (list) => {
  const seen = {};
  return list.map((d) => {
    const total = list.filter((x) => x.label === d.label).length;
    seen[d.label] = (seen[d.label] || 0) + 1;
    return total > 1 ? { ...d, label: `${d.label} #${seen[d.label]}` } : d;
  });
};

/**
 * Mở camera thật trên máy.
 * - Tự động: ưu tiên thiết bị gắn ngoài; slot i nhận thiết bị thứ i theo thứ tự ưu tiên.
 * - Thủ công: mỗi slot là một góc chụp cố định, nên thiết bị bị rút thì slot để trống, không lấy camera khác thế vào.
 * - Tự cập nhật khi cắm / rút thiết bị (sự kiện devicechange).
 * - Chỉ giữ luồng của thiết bị đang được gán.
 */
export function useCameras(slotCount = 4) {
  const [devices, setDevices] = useState([]); // [{deviceId,label,external}]
  const [streams, setStreams] = useState({}); // deviceId -> MediaStream
  const [assigned, setAssigned] = useState(readAssigned); // null = tự động; mảng deviceId|null theo slot = thủ công
  const [error, setError] = useState(null);
  const streamsRef = useRef({});
  const pendingRef = useRef({});
  const assignedRef = useRef(assigned);
  const savedChecked = useRef(false);

  const slotIds = useCallback((list, map) => Array.from({ length: slotCount }, (_, i) => {
    if (!map) return list[i]?.deviceId ?? null;
    return list.some((d) => d.deviceId === map[i]) ? map[i] : null;
  }), [slotCount]);

  // Nhiều lần refresh có thể chạy song song: dùng chung lượt mở đang chờ để không mở trùng rồi bỏ quên luồng.
  const openStream = useCallback((deviceId) => {
    if (streamsRef.current[deviceId]) return Promise.resolve(streamsRef.current[deviceId]);
    if (pendingRef.current[deviceId]) return pendingRef.current[deviceId];
    const opening = navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    }).then((s) => {
      streamsRef.current[deviceId] = s;
      return s;
    }).finally(() => { delete pendingRef.current[deviceId]; });
    pendingRef.current[deviceId] = opening;
    return opening;
  }, []);

  // Đóng luồng không còn được gán trước khi mở luồng mới, để không vượt băng thông cổng USB.
  const syncStreams = useCallback(async (list, map) => {
    const wanted = slotIds(list, map).filter(Boolean);
    Object.keys(streamsRef.current).forEach((id) => {
      if (!wanted.includes(id)) {
        streamsRef.current[id].getTracks().forEach((t) => t.stop());
        delete streamsRef.current[id];
      }
    });
    await Promise.all(wanted.map((id) => openStream(id).catch(() => null)));
    setStreams({ ...streamsRef.current });
  }, [openStream, slotIds]);

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
        if (id && !streamsRef.current[id]) streamsRef.current[id] = probe; else probe.getTracks().forEach((t) => t.stop());
      }
      const all = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      const list = numberDuplicates(all
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}`, external: !isBuiltIn(d) }))
        .sort((a, b) => Number(b.external) - Number(a.external)));

      // Cấu hình đã lưu không khớp thiết bị nào (máy khác, trình duyệt đã đổi mã thiết bị) thì quay về tự động.
      if (!savedChecked.current && list.length) {
        savedChecked.current = true;
        const saved = assignedRef.current;
        if (saved && !saved.some((id) => list.some((d) => d.deviceId === id))) {
          assignedRef.current = null;
          setAssigned(null);
          writeAssigned(null);
        }
      }

      await syncStreams(list, assignedRef.current);
      setDevices(list);
      setError(list.length ? null : 'Không tìm thấy camera nào trên máy.');
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Bạn chưa cho phép truy cập camera. Bấm biểu tượng camera trên thanh địa chỉ để cho phép.' : e.name === 'NotReadableError' ? 'Camera đang được ứng dụng khác sử dụng.' : `Không mở được camera: ${e.message}`);
    }
  }, [syncStreams]);

  const applyAssigned = useCallback((map) => {
    assignedRef.current = map;
    setAssigned(map);
    writeAssigned(map);
    return syncStreams(devices, map);
  }, [devices, syncStreams]);

  /** Gán thiết bị cho một slot (null = không dùng). Thiết bị đang ở slot khác thì hai slot đổi chỗ. Trả về false nếu không mở được. */
  const assign = useCallback(async (slot, deviceId) => {
    const next = assignedRef.current ? [...assignedRef.current] : slotIds(devices, null);
    const other = deviceId ? next.indexOf(deviceId) : -1;
    if (other >= 0 && other !== slot) next[other] = next[slot] ?? null;
    next[slot] = deviceId;
    await applyAssigned(next);
    return !deviceId || !!streamsRef.current[deviceId];
  }, [applyAssigned, devices, slotIds]);

  const choosePrimary = useCallback((deviceId) => assign(0, deviceId), [assign]);
  const resetAssigned = useCallback(() => applyAssigned(null), [applyAssigned]);

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

  // Slot 0 = camera chính
  const slots = slotIds(devices, assigned).map((id) => {
    const d = devices.find((x) => x.deviceId === id);
    return d ? { ...d, stream: streams[d.deviceId] || null } : null;
  });

  return { devices, slots, primary: slots[0], manual: !!assigned, error, refresh, assign, choosePrimary, resetAssigned };
}

/** Chụp 1 khung hình từ thẻ <video> → dataURL JPEG */
export function grabFrame(video) {
  if (!video || !video.videoWidth) return null;
  const c = document.createElement('canvas');
  c.width = video.videoWidth; c.height = video.videoHeight;
  c.getContext('2d').drawImage(video, 0, 0);
  return { url: c.toDataURL('image/jpeg', 0.92), width: c.width, height: c.height };
}
