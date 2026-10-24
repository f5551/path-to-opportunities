import { resolve } from "path";
import fs from "fs";
import crypto from "crypto";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Use relative base so assets load correctly on GitHub Pages project subpaths
  base: "./",
  plugins: [
    tailwindcss(),
    {
      name: "opportunities-json-sync",
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
    {
      name: "sw-asset-injector",
      closeBundle() {
        const distDir = resolve(import.meta.dirname, "dist");
        const swPath = resolve(distDir, "sw.js");
        if (fs.existsSync(swPath)) {
          let content = fs.readFileSync(swPath, "utf8");

          // Recursively collect all dist files excluding sw.js and source maps
          const getDistFiles = (dir, base = "") => {
            let list = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const rel = base ? `${base}/${entry.name}` : entry.name;
              const full = resolve(dir, entry.name);
              if (entry.isDirectory()) {
                list = list.concat(getDistFiles(full, rel));
              } else if (entry.name !== "sw.js" && !entry.name.endsWith(".map")) {
                list.push({ rel, full });
              }
            }
            return list;
          };

          const allDistFiles = getDistFiles(distDir);

          // Hash all contents (HTML, JSON, images, fonts, JS, CSS) to guarantee cache version changes on ANY file change
          const hasher = crypto.createHash("sha256");
          for (const file of allDistFiles.sort((a, b) => a.rel.localeCompare(b.rel))) {
            hasher.update(file.rel);
            hasher.update(fs.readFileSync(file.full));
          }
          const buildHash = hasher.digest("hex").substring(0, 10);
          const cacheName = `pto-cache-${buildHash}`;

          // JS & CSS build bundles to precache
          const buildAssets = allDistFiles
            .filter((f) => f.rel.startsWith("assets/") && (f.rel.endsWith(".js") || f.rel.endsWith(".css")))
            .map((f) => f.rel);

          content = content.replace("/* __CACHE_NAME__ */ 'pto-cache-v1'", JSON.stringify(cacheName));
          content = content.replace("/* __BUILD_ASSETS__ */ []", JSON.stringify(buildAssets));
          fs.writeFileSync(swPath, content, "utf8");
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
