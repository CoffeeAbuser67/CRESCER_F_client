import path from "path"
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // <--- ADICIONE ISSO

export default defineConfig({
  plugins: [
    tailwindcss(), // <--- ADICIONE ISSO
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})


