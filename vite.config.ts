import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { hostedMedia } from "./scripts/media.mjs";

export default defineConfig({
  plugins: [react(), hostedMedia()],
});
