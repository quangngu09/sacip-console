// Định dạng hiển thị theo chuẩn Việt Nam: 23.430 và 95,2%.
export const fmtNumber = (n) => n.toLocaleString('vi-VN');
export const fmtPercent = (n) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/** Đưa "dd/mm/yyyy [giờ]" về dạng sắp xếp được; chuỗi khác giữ nguyên. */
export const sortableDate = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(.*)$/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}${m[4]}` : s;
};

const pad = (n) => String(n).padStart(2, '0');
/** ISO → "dd/mm/yyyy HH:MM" theo giờ máy. Chuỗi đã ở dạng dd/mm/yyyy giữ nguyên. */
export const fmtDateTime = (v, withSeconds = false) => {
  if (!v) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) return v;
  const d = new Date(v);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? `:${pad(d.getSeconds())}` : ''}`;
};
export const fmtDate = (v) => (v && !/^\d{2}\//.test(v) ? fmtDateTime(v).slice(0, 10) : v || '—');

/** Khoảng cách tới hiện tại: "5 phút trước", "còn 3 giờ 45 phút". */
export const fmtRelative = (v) => {
  if (!v) return '—';
  const diff = new Date(v).getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const text = m < 1 ? 'vài giây' : m < 60 ? `${m} phút` : m < 48 * 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}` : `${Math.round(m / 1440)} ngày`;
  return diff < 0 ? `${text} trước` : `còn ${text}`;
};

/** Thời hạn xử lý: quá hạn, sắp quá hạn (dưới 2 giờ) hay bình thường. */
export const slaState = (v) => {
  if (!v) return null;
  const left = new Date(v).getTime() - Date.now();
  return left < 0 ? 'over' : left < 2 * 3600 * 1000 ? 'soon' : 'ok';
};
