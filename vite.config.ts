/// <reference types="node" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
  },
  root: path.resolve("./client"),
  build: {
    outDir: path.resolve("./dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"], // Tách React
          ui: ["@radix-ui/react-slot", "@radix-ui/react-icons"], // Tách Radix UI (nếu dùng)
        },
      },
    },
    chunkSizeWarningLimit: 600, // Tạm thời tăng ngưỡng
  },
});