import { useSyncExternalStore } from 'react';
import { RULES } from './mock';

// Danh sách quy tắc dùng chung cho tab Quy tắc sự kiện và trang Chính sách sinh trắc,
// để quy tắc tạo / đổi chế độ ở một nơi hiện ngay ở nơi kia. Thay bằng API khi có backend.
let rules = RULES;
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const setRules = (fn) => { rules = typeof fn === 'function' ? fn(rules) : fn; listeners.forEach((l) => l()); };
export const useRules = () => [useSyncExternalStore(subscribe, () => rules), setRules];

/**
 * Quy tắc gắn với chính sách sinh trắc qua trường policies:
 * - mảng mã chính sách: chỉ áp dụng cho người thuộc các chính sách đó;
 * - 'ALL': mọi người đã có Face ID, bất kể chính sách;
 * - 'NONE': không dựa trên hồ sơ Face ID (người lạ, đếm ẩn danh, khuôn mặt không khớp).
 * Quy tắc 'ALL' có thể loại trừ một số chính sách qua trường except.
 */
export const appliesTo = (rule, policyId) => (rule.policies === 'ALL' ? !(rule.except || []).includes(policyId) : Array.isArray(rule.policies) && rule.policies.includes(policyId));
export const rulesForPolicy = (list, policyId) => list.filter((r) => appliesTo(r, policyId));
export const excludedFor = (list, policyId) => list.filter((r) => r.policies === 'ALL' && (r.except || []).includes(policyId));

const patch = (id, fn) => setRules((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));
/** Gắn quy tắc riêng vào chính sách. */
export const attachRule = (id, policyId) => patch(id, (r) => ({ ...r, policies: [...new Set([...(Array.isArray(r.policies) ? r.policies : []), policyId])] }));
/** Gỡ quy tắc riêng khỏi chính sách. Không còn chính sách nào thì quy tắc tự tắt. */
export const detachRule = (id, policyId) => patch(id, (r) => {
  const left = r.policies.filter((x) => x !== policyId);
  return { ...r, policies: left, mode: left.length ? r.mode : 'off', pending: left.length ? r.pending : false };
});
/** Loại trừ / bỏ loại trừ chính sách khỏi một quy tắc áp dụng cho mọi chính sách. */
export const excludeRule = (id, policyId) => patch(id, (r) => ({ ...r, except: [...new Set([...(r.except || []), policyId])] }));
export const includeRule = (id, policyId) => patch(id, (r) => ({ ...r, except: (r.except || []).filter((x) => x !== policyId) }));
