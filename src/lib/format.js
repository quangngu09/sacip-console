// Định dạng hiển thị theo chuẩn Việt Nam: 23.430 và 95,2%.
export const fmtNumber = (n) => n.toLocaleString('vi-VN');
export const fmtPercent = (n) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/** Đưa "dd/mm/yyyy [giờ]" về dạng sắp xếp được; chuỗi khác giữ nguyên. */
export const sortableDate = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(.*)$/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}${m[4]}` : s;
};
