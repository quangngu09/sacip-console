import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import 'material-symbols/outlined.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './index.css';
import { AppProvider } from './store';
import Layout from './components/Layout';
import { RequirePerm, Toasts } from './components/ui';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Requests from './pages/Requests';
import Spaces from './pages/Spaces';
import Devices from './pages/Devices';
import Schedule from './pages/Schedule';
import Policies from './pages/Policies';
import PolicyEditor from './pages/PolicyEditor';
import Integrations from './pages/Integrations';
import OrgUnits from './pages/OrgUnits';
import Soc from './pages/Soc';
import MovementLog from './pages/MovementLog';
import { AiMonitor, AuditLog, Consents } from './pages/Misc';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ho-so" element={<Profiles />} />
            <Route path="yeu-cau" element={<Requests />} />
            <Route path="dong-y" element={<RequirePerm perm="consent"><Consents /></RequirePerm>} />
            <Route path="don-vi" element={<OrgUnits />} />
            <Route path="khong-gian" element={<Spaces />} />
            <Route path="thiet-bi" element={<Devices />} />
            <Route path="thoi-khoa-bieu" element={<Schedule />} />
            <Route path="chinh-sach" element={<Policies />} />
            <Route path="chinh-sach/:policyId/sua" element={<PolicyEditor />} />
            <Route path="tich-hop" element={<Integrations />} />
            <Route path="soc" element={<RequirePerm perm="security"><Soc /></RequirePerm>} />
            <Route path="giam-sat-ai" element={<AiMonitor />} />
            <Route path="di-lai" element={<RequirePerm perm="movement"><MovementLog /></RequirePerm>} />
            <Route path="nhat-ky" element={<RequirePerm perm="audit"><AuditLog /></RequirePerm>} />
          </Route>
        </Routes>
        <Toasts />
      </HashRouter>
    </AppProvider>
  </React.StrictMode>
);
