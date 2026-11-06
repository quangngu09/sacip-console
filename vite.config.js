import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const LOOPBACK = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

// Proxy gắn khóa ở phía máy chủ dev để khóa không vào bundle. Chỉ mở cho chính máy này vì npm run dev chạy với --host.
const faceDocumentsProxy = (env) => ({
  '/sacip-api/face-documents/search': {
    target: env.SACIP_API_BASE,
    changeOrigin: true,
    rewrite: () => `/api/process/${env.SACIP_PROCESS_ID}/business-documents/search`,
    headers: { authorization: `Bearer ${env.SACIP_BEARER_TOKEN}`, 'x-api-key': env.SACIP_API_KEY },
    bypass: (req) => (LOOPBACK.includes(req.socket.remoteAddress) ? undefined : false),
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'SACIP_');
  return {
    plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
    build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
    server: { port: 5173, proxy: env.SACIP_API_BASE ? faceDocumentsProxy(env) : undefined },
  };
});
