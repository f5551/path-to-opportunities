import { resolve } from "path";
import fs from "fs";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: "opportunities-json-sync",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const reqPath = req.url ? req.url.split("?")[0] : "";
          if (reqPath.endsWith("/opportunities.json")) {
            const filePath = resolve(import.meta.dirname, "opportunities.json");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "application/json");
              res.end(fs.readFileSync(filePath, "utf8"));
              return;
            }
          }
          next();
        });
      },
      generateBundle() {
        const filePath = resolve(import.meta.dirname, "opportunities.json");
        if (fs.existsSync(filePath)) {
          this.emitFile({
            type: "asset",
            fileName: "opportunities.json",
            source: fs.readFileSync(filePath, "utf8"),
          });
        }
      },
    },
  ],

  // Static assets (fonts, etc.) live in /public — served at root
  publicDir: "public",

  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        opportunities: resolve(import.meta.dirname, "opportunities.html"),
        detail: resolve(import.meta.dirname, "detail.html"),
        guide: resolve(import.meta.dirname, "guide.html"),
        login: resolve(import.meta.dirname, "login.html"),
        register: resolve(import.meta.dirname, "register.html"),
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },
});
