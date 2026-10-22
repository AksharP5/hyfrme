import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hostedMedia } from "./scripts/media.mjs";

export default defineConfig(({ mode }) => ({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "catalog-native",
              test: /\/src\/generated\/catalog-native\.json$/,
            },
            {
              name: "catalog-ports",
              test: /\/src\/generated\/catalog-ports\.json$/,
            },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    watch: {
      ignored: [
        "**/.work/**",
        "**/assets/t3-code/**",
        "**/parity/**",
        "**/registry/**",
      ],
    },
  },
  plugins: [react(), mode === "hosted" && hostedMedia()],
}));
