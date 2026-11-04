import { useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { ORG_UNITS, SUBJECT_TYPES, TENANTS } from '../data/mock';

// Dữ liệu mẫu ghi tên đơn vị không thống nhất, nên đối chiếu theo mẫu. Khi có API sẽ lọc theo mã đơn vị.
const UNIT_PATTERN = {
  'Khoa Công nghệ Thông tin': /CNTT|Công nghệ Thông tin/,
  'Khoa Kinh tế & QTKD': /Kinh tế|QTKD/,
  'Khoa Điện - Điện tử': /Điện/,
  'Phòng Đào tạo': /^Phòng Đào tạo/,
  'Ban Quản lý KTX': /KTX/,
};
const SUBJECT_BY_PREFIX = { SV: 'Sinh viên', GV: 'Giảng viên', NV: 'Cán bộ', EXT: 'NV thuê ngoài', KTX: 'Cư dân KTX' };

const ALL_SCOPE = { tenant: TENANTS[0], unit: ORG_UNITS[0], subject: SUBJECT_TYPES[0] };

// Thanh chọn phạm vi chỉ có ở Tổng quan, nên các trang khác luôn hiển thị toàn bộ dữ liệu.
export function useScope() {
  const { scope: selected } = useApp();
  const { pathname } = useLocation();
  const scope = pathname === '/' ? selected : ALL_SCOPE;
  const allUnits = scope.unit === ORG_UNITS[0];
  const allSubjects = scope.subject === SUBJECT_TYPES[0];
  return {
    scope,
    allUnits,
    allSubjects,
    primaryTenant: scope.tenant === TENANTS[0],
    narrowed: !allUnits || !allSubjects,
    matchUnit: (text) => allUnits || UNIT_PATTERN[scope.unit].test(text || ''),
    matchSubject: (id) => allSubjects || SUBJECT_BY_PREFIX[(id || '').split('-')[0]] === scope.subject,
  };
}
