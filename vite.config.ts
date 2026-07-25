import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const basePath = process.env.VITE_BASE_PATH ?? '/Atlas-One/';

export default defineConfig({
  base: basePath,

  plugins: [
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers',
          dest: 'cesiumStatic',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty',
          dest: 'cesiumStatic',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets',
          dest: 'cesiumStatic',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets',
          dest: 'cesiumStatic',
        },
      ],
    }),
  ],

  define: {
    CESIUM_BASE_URL: JSON.stringify(`${basePath}cesiumStatic/`),
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          cesium: ['cesium'],
          gsap: ['gsap'],
        },
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },
});
