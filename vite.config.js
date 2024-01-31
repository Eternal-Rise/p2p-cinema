import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/p2p-cinema' : '/',
  plugins: [basicSsl(), vue()],
  server: {
    https: true,
  }
}));
