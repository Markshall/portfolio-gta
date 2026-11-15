import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

// `<!-- @include path/to/file.html -->` in a page is replaced with that file, so the home page and the
// 404 page draw the same sunset scene from one copy of its markup.
function includes(): Plugin {
  const pattern = /<!--\s*@include\s+(\S+)\s*-->/g;
  return {
    name: "html-includes",
    transformIndexHtml: {
      order: "pre",
      handler: html => html.replace(pattern, (_, file: string) => readFileSync(resolve(root, file), "utf8")),
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(resolve(root, "src/partials"))) server.ws.send({ type: "full-reload" });
    },
  };
}

export default defineConfig({
  plugins: [includes()],
  build: {
    rolldownOptions: {
      input: {
        main: resolve(root, "index.html"),
        notFound: resolve(root, "404.html"),
      },
    },
  },
});
