import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hostedMedia } from "./scripts/media.mjs";

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "hosted" && hostedMedia()],
}));
