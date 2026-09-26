import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hostedMedia } from "./scripts/media.mjs";

export default defineConfig(({ mode }) => ({
  server: {
    watch: {
      ignored: ["**/.work/**", "**/assets/t3-code/**", "**/parity/**", "**/registry/**"],
    },
  },
  plugins: [react(), mode === "hosted" && hostedMedia()],
}));
