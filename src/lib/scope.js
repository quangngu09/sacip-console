import { useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { ORG_TREE, TENANT } from '../api/db';
import { SUBJECT_TYPE } from '../api/enums';

const leaves = (nodes) => nodes.flatMap((n) => (n.children ? leaves(n.children) : [n]));

export const TENANT_OPTIONS = [{ value: TENANT, label: TENANT }, { value: 'CS2', label: 'Phân hiệu Cơ sở II' }];
export const UNIT_OPTIONS = [{ value: 'ALL', label: 'Tất cả khoa, phòng ban' }, ...leaves(ORG_TREE[0].children).map((n) => ({ value: n.id, label: n.name }))];
export const SUBJECT_OPTIONS = [{ value: 'ALL', label: 'Mọi đối tượng' }, ...Object.entries(SUBJECT_TYPE).map(([value, m]) => ({ value, label: m.label }))];

/** Tên đơn vị theo mã, kể cả nút cha trong cây tổ chức. */
const ALL_NODES = (function flat(nodes) { return nodes.flatMap((n) => [n, ...(n.children ? flat(n.children) : [])]); })(ORG_TREE);
export const unitName = (id) => ALL_NODES.find((n) => n.id === id)?.name || id;

/** Mã đơn vị và tất cả đơn vị con của nó. */
export const unitWithChildren = (id) => {
  const node = ALL_NODES.find((n) => n.id === id);
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
    unitLabel: UNIT_OPTIONS.find((o) => o.value === scope.unit)?.label,
    matchUnit: (orgUnit) => allUnits || orgUnit === scope.unit,
    matchSubject: (type) => allSubjects || type === scope.subject,
  };
}
