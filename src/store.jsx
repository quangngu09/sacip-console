import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as api from './api/client';
import { ACTION, can as roleCan } from './api/enums';
import { TENANT_OPTIONS, UNIT_OPTIONS, SUBJECT_OPTIONS } from './lib/scope';

const Ctx = createContext(null);

const RAIL_KEY = 'sacip.railCollapsed';
const ROLE_KEY = 'sacip.role';
const readKey = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writeKey = (k, v) => { try { localStorage.setItem(k, v); } catch { /* Không lưu được thì chỉ giữ trong phiên này. */ } };

// Thao tác cũ gọi log(chữ mô tả, đối tượng, loại). Đổi loại sang action_code để nhật ký thống nhất một chuẩn.
const KIND_TO_CODE = { sensitive: 'VIEW_SENSITIVE', system: 'SYSTEM_EVENT', view: 'VIEW_SENSITIVE', user: 'ADMIN_ACTION' };

export function AppProvider({ children }) {
  const [scope, setScope] = useState({ tenant: TENANT_OPTIONS[0].value, unit: UNIT_OPTIONS[0].value, subject: SUBJECT_OPTIONS[0].value });
  const [railCollapsed, setRailCollapsed] = useState(() => readKey(RAIL_KEY, '0') === '1');
  const [role, setRoleState] = useState(() => {
    const r = readKey(ROLE_KEY, 'REGISTRAR');
    const ok = api.ACTORS[r] ? r : 'REGISTRAR';
    api.setActor(ok);
    return ok;
  });
  const [data, setData] = useState(() => api.snapshot());
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(() => data.notifications);

  const refresh = useCallback(() => setData(api.snapshot()), []);

  /** Gọi một endpoint rồi nạp lại dữ liệu, kể cả khi lỗi (máy chủ có thể đã ghi nhật ký). */
  const call = useCallback(async (fn, ...args) => {
    try { return await fn(...args); } finally { refresh(); }
  }, [refresh]);

  const log = useCallback((detail, target, kind = 'user') => {
    api.logAction(ACTION[kind] ? kind : KIND_TO_CODE[kind] || 'ADMIN_ACTION', target, detail);
    refresh();
  }, [refresh]);

  const toast = useCallback((title, desc, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const toggleRail = useCallback(() => {
    setRailCollapsed((c) => { writeKey(RAIL_KEY, c ? '0' : '1'); return !c; });
  }, []);

  const setRole = useCallback((r) => { api.setActor(r); writeKey(ROLE_KEY, r); setRoleState(r); }, []);
  const can = useCallback((perm) => roleCan(role, perm), [role]);

  const value = useMemo(() => ({
    scope, setScope, toasts, toast, railCollapsed, toggleRail,
    data, refresh, call, log,
    // Lối tắt cho các trang cũ.
    requests: data.requests, audit: data.audit,
    notifications, setNotifications,
    role, setRole, can, actor: api.ACTORS[role],
  }), [scope, toasts, toast, railCollapsed, toggleRail, data, refresh, call, log, notifications, role, setRole, can]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
