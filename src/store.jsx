import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CURRENT_USER, INITIAL_AUDIT, PROFILES, REQUESTS, NOTIFICATIONS, TENANTS, ORG_UNITS, SUBJECT_TYPES } from './data/mock';

const Ctx = createContext(null);
const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour12: false })}`;
};

const RAIL_KEY = 'sacip.railCollapsed';
const readRail = () => {
  try { return localStorage.getItem(RAIL_KEY) === '1'; } catch { return false; }
};

export function AppProvider({ children }) {
  const [scope, setScope] = useState({ tenant: TENANTS[0], unit: ORG_UNITS[0], subject: SUBJECT_TYPES[0] });
  const [railCollapsed, setRailCollapsed] = useState(readRail);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [toasts, setToasts] = useState([]);
  const [profiles, setProfiles] = useState(PROFILES);
  const [requests, setRequests] = useState(REQUESTS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const log = useCallback((action, target, kind = 'user') => {
    setAudit((a) => [{ t: now(), actor: CURRENT_USER.name, action, target, kind }, ...a]);
  }, []);

  const toast = useCallback((title, desc, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const toggleRail = useCallback(() => {
    setRailCollapsed((c) => {
      try { localStorage.setItem(RAIL_KEY, c ? '0' : '1'); } catch { /* Không lưu được thì chỉ giữ trong phiên này. */ }
      return !c;
    });
  }, []);

  const value = useMemo(() => ({
    scope, setScope, audit, log, toasts, toast, railCollapsed, toggleRail,
    profiles, setProfiles, requests, setRequests, notifications, setNotifications,
  }), [scope, audit, log, toasts, toast, railCollapsed, toggleRail, profiles, requests, notifications]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
