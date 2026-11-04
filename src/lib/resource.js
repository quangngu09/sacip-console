import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const loaded = new Set();

// Thay thân hàm này bằng lời gọi API khi có backend; các trang không cần đổi.
const loadResource = (name, demo) => new Promise((resolve, reject) => {
  if (demo === 'loading') return;
  setTimeout(() => (demo === 'error' ? reject(new Error(`Không tải được ${name}`)) : resolve()), 150);
});

/** Trạng thái tải của một nguồn dữ liệu. Khi phát triển, thêm ?demo=loading hoặc ?demo=error vào đường dẫn để xem thử. */
export function useResource(name) {
  const { search } = useLocation();
  const demo = import.meta.env.DEV ? new URLSearchParams(search).get('demo') : null;
  const [status, setStatus] = useState(() => (loaded.has(name) && !demo ? 'ready' : 'loading'));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (loaded.has(name) && !demo) { setStatus('ready'); return undefined; }
    let live = true;
    setStatus('loading');
    // "Thử lại" luôn thành công ở chế độ xem thử để thấy được cả đường phục hồi.
    loadResource(name, attempt > 0 ? null : demo)
      .then(() => { if (live) { loaded.add(name); setStatus('ready'); } })
      .catch(() => { if (live) setStatus('error'); });
    return () => { live = false; };
  }, [name, demo, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { status, reload };
}
