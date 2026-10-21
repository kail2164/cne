import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  publicDir: false,
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true,
  },
});
