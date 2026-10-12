import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hostedMedia } from "./scripts/media.mjs";

export default defineConfig(({ mode }) => ({
  server: {
    watch: {
      ignored: ["**/.work/**", "**/assets/t3-code/**", "**/parity/**", "**/registry/**"],
    },
  },
  plugins: [
    react(),
    mode === "hosted" && hostedMedia(),
    {
      name: "concept-gallery-route",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url ?? "/", "http://localhost");
          if (url.pathname === "/ideas") {
            response.writeHead(302, { Location: `/ideas/${url.search}` });
            response.end();
            return;
          }
          if (url.pathname === "/ideas/") request.url = `/ideas/index.html${url.search}`;
          next();
        });
      },
    },
  ],
}));
