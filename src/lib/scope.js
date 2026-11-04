import { useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { TENANT } from '../api/db';
import { orgTreeLive } from '../api/client';
import { SUBJECT_TYPE } from '../api/enums';

const leaves = (nodes) => nodes.flatMap((n) => (n.children ? leaves(n.children) : [n]));

export const TENANT_OPTIONS = [{ value: TENANT, label: TENANT }, { value: 'CS2', label: 'Phân hiệu Cơ sở II' }];
// Cây đơn vị sửa được trên trang Đơn vị tổ chức, nên danh sách luôn tính lại từ dữ liệu hiện tại; đơn vị ngừng dùng không còn để chọn.
const activeLeaves = (nodes) => nodes.filter((n) => !n.inactive).flatMap((n) => (n.children?.length ? activeLeaves(n.children) : [n]));
export const unitOptions = () => [{ value: 'ALL', label: 'Tất cả khoa, phòng ban' }, ...activeLeaves(orgTreeLive()[0].children).map((n) => ({ value: n.id, label: n.name }))];
export const UNIT_OPTIONS = unitOptions();
export const SUBJECT_OPTIONS = [{ value: 'ALL', label: 'Mọi đối tượng' }, ...Object.entries(SUBJECT_TYPE).map(([value, m]) => ({ value, label: m.label }))];

/** Tên đơn vị theo mã, kể cả nút cha trong cây tổ chức. */
const flat = (nodes) => nodes.flatMap((n) => [n, ...(n.children ? flat(n.children) : [])]);
const allNodes = () => flat(orgTreeLive());
export const unitName = (id) => allNodes().find((n) => n.id === id)?.name || id;

/** Mã đơn vị và tất cả đơn vị con của nó. */
export const unitWithChildren = (id) => {
  const node = allNodes().find((n) => n.id === id);
  return node ? [node.id, ...(node.children ? leaves(node.children).map((n) => n.id) : [])] : [id];
};

const ALL_SCOPE = { tenant: TENANT, unit: 'ALL', subject: 'ALL' };

// Thanh chọn phạm vi chỉ có ở Tổng quan, nên các trang khác luôn hiển thị toàn bộ dữ liệu.
export function useScope() {
  const { scope: selected } = useApp();
  const { pathname } = useLocation();
  const scope = pathname === '/' ? selected : ALL_SCOPE;
  const allUnits = scope.unit === 'ALL';
  const allSubjects = scope.subject === 'ALL';
  return {
    scope,
    allUnits,
    allSubjects,
    primaryTenant: scope.tenant === TENANT,
    narrowed: !allUnits || !allSubjects,
    unitLabel: unitOptions().find((o) => o.value === scope.unit)?.label,
    matchUnit: (orgUnit) => allUnits || orgUnit === scope.unit,
    matchSubject: (type) => allSubjects || type === scope.subject,
  };
}
