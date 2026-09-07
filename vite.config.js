import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSinglefile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  root: './src', // Mengarahkan root development ke folder src
  plugins: [vue(), viteSinglefile()],
  build: {
    outDir: '../deploy', // Hasil build singlefile akan otomatis masuk ke folder gas
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})