import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import 'material-symbols/outlined.css';
import '@fontsource-variable/inter';
import './index.css';
import { AppProvider } from './store';
import Layout from './components/Layout';
import { Toasts } from './components/ui';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Requests from './pages/Requests';
import Spaces from './pages/Spaces';
import Devices from './pages/Devices';
import Schedule from './pages/Schedule';
import Policies from './pages/Policies';
import Soc from './pages/Soc';
import Kiosk from './pages/Kiosk';
import { AiMonitor, AuditLog, Consents } from './pages/Misc';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/kiosk" element={<Kiosk />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ho-so" element={<Profiles />} />
            <Route path="yeu-cau" element={<Requests />} />
            <Route path="dong-y" element={<Consents />} />
            <Route path="khong-gian" element={<Spaces />} />
            <Route path="thiet-bi" element={<Devices />} />
            <Route path="thoi-khoa-bieu" element={<Schedule />} />
            <Route path="chinh-sach" element={<Policies />} />
            <Route path="soc" element={<Soc />} />
            <Route path="giam-sat-ai" element={<AiMonitor />} />
            <Route path="nhat-ky" element={<AuditLog />} />
          </Route>
        </Routes>
        <Toasts />
      </HashRouter>
    </AppProvider>
  </React.StrictMode>
);
