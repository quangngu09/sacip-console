import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

const loaded = new Set();

// Độ trễ giả lập mạng: lần đầu hiện khung tải, các lần sau làm mới ngầm. Bỏ khi có backend.
const FIRST_LOAD_MS = 700;
const REFRESH_MS = 350;

// Thay thân hàm này bằng lời gọi API khi có backend; các trang không cần đổi.
const loadResource = (name, demo, cached) => new Promise((resolve, reject) => {
  if (demo === 'loading') return;
  setTimeout(() => (demo === 'error' ? reject(new Error(`Không tải được ${name}`)) : resolve()), cached ? REFRESH_MS : FIRST_LOAD_MS);
});

// Số nguồn đang tải, để thanh tiến trình trên cùng phản ánh đúng việc tải thật.
let pending = 0;
const listeners = new Set();
const addPending = (delta) => { pending += delta; listeners.forEach((l) => l()); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export const useResourceLoading = () => useSyncExternalStore(subscribe, () => pending > 0);

/**
 * Trạng thái tải của một nguồn dữ liệu. Nguồn đã tải trong phiên này thì hiển thị ngay và làm mới ngầm.
 * Khi phát triển, thêm ?demo=loading hoặc ?demo=error vào đường dẫn để xem thử.
 */
export function useResource(name) {
  const { search } = useLocation();
  const demo = import.meta.env.DEV ? new URLSearchParams(search).get('demo') : null;
  const [status, setStatus] = useState(() => (loaded.has(name) && !demo ? 'ready' : 'loading'));
  const [attempt, setAttempt] = useState(0);

  // Chạy trước khi vẽ để đổi nguồn (ví dụ đổi đơn vị) không lộ một khung hình dữ liệu cũ.
  useLayoutEffect(() => {
    const cached = loaded.has(name) && !demo;
    let live = true;
    const finish = () => { if (live) { live = false; addPending(-1); } };
    setStatus(cached ? 'ready' : 'loading');
    addPending(1);
    // "Thử lại" luôn thành công ở chế độ xem thử để thấy được cả đường phục hồi.
    loadResource(name, attempt > 0 ? null : demo, cached)
      .then(() => { if (live) { loaded.add(name); setStatus('ready'); finish(); } })
      .catch(() => { if (live) { setStatus('error'); finish(); } });
    return finish;
  }, [name, demo, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { status, reload };
}
