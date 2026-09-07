import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve, join } from 'path'
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs'

/**
 * Custom Vite Plugin untuk sinkronisasi otomatis file backend Google Apps Script
 * dari direktori /gas dan .claspignore root ke direktori /deploy setelah build selesai.
 */
function gasDeploySyncPlugin() {
  return {
    name: 'gas-deploy-sync',
    closeBundle() {
      const rootDir = import.meta.dirname || resolve()
      const gasDir = resolve(rootDir, 'gas')
      const deployDir = resolve(rootDir, 'deploy')
      const rootClaspIgnore = resolve(rootDir, '.claspignore')
      const deployClaspIgnore = resolve(deployDir, '.claspignore')

      if (!existsSync(deployDir)) {
        mkdirSync(deployDir, { recursive: true })
      }

      // 1. Salin seluruh file Apps Script (.gs) dan manifest (appsscript.json) dari /gas ke /deploy
      if (existsSync(gasDir)) {
        const gasFiles = readdirSync(gasDir)
        for (const file of gasFiles) {
          if (file.endsWith('.gs') || file === 'appsscript.json') {
            const srcFile = join(gasDir, file)
            const destFile = join(deployDir, file)
            copyFileSync(srcFile, destFile)
          }
        }
      }

      // 2. Pastikan file .claspignore tersedia di folder /deploy agar clasp push tidak mengirim file sampah
      if (existsSync(rootClaspIgnore) && !existsSync(deployClaspIgnore)) {
        copyFileSync(rootClaspIgnore, deployClaspIgnore)
      }
    }
  }
}

export default defineConfig({
  root: './src', // Mengarahkan root development ke folder src
  plugins: [
    vue(),
    viteSingleFile(),
    gasDeploySyncPlugin()
  ],
  build: {
    outDir: '../deploy', // Hasil build singlefile akan otomatis masuk ke folder deploy
    emptyOutDir: false,  // Pertahankan file GAS yang ada di deploy
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})