import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

const sourceSha256 =
  "94a7c5768fc21c49a9eadc9b31138efe1053210f881ccf5446260960ddfa0dd4";
const speedGuard =
  'if (newSpeed !== 0) throw new Error("Hyfrme Paper shaders require explicit frame time and library speed 0");';

// These source wrappers already use speed 0 and setFrame. Keep their GL renderer
// and redraw lifecycle while removing the unused autonomous animation clock.
export function adaptFrameDrivenPaper(source) {
  if (createHash("sha256").update(source).digest("hex") !== sourceSha256) {
    throw new Error("Unexpected Paper 0.0.76 shader-mount source");
  }
  const adapted = source
    .replace("  lastRenderTime = 0;\n", "")
    .replace("  render = (currentTime) => {", "  render = () => {")
    .replace(
      "    const dt = currentTime - this.lastRenderTime;\n    this.lastRenderTime = currentTime;\n    if (this.currentSpeed !== 0) {\n      this.currentFrame += dt * this.currentSpeed;\n    }\n",
      "",
    )
    .replace(
      "    if (this.currentSpeed !== 0) {\n      this.requestRender();\n    } else {\n      this.rafId = null;\n    }",
      "    this.rafId = null;",
    )
    .replace(
      /  requestRender = \(\) => \{[\s\S]*?\n  \};/,
      '  requestRender = () => { throw new Error("Hyfrme Paper shaders render from explicit frame time"); };',
    )
    .replace(
      "  setSpeed = (newSpeed = 1) => {",
      `  setSpeed = (newSpeed = 1) => { ${speedGuard}`,
    )
    .replace(
      /  setCurrentSpeed = \(newSpeed\) => \{[\s\S]*?\n  \};/,
      `  setCurrentSpeed = (newSpeed) => { ${speedGuard} this.currentSpeed = newSpeed; };`,
    )
    .replace("    this.lastRenderTime = performance.now();\n", "")
    .replaceAll("this.render(performance.now())", "this.render()");
  if (/performance\.now|requestAnimationFrame|lastRenderTime/.test(adapted)) {
    throw new Error("Paper frame adaptation left an autonomous clock");
  }
  return adapted;
}

export const frameDrivenPaperPlugin = {
  name: "hyfrme-frame-driven-paper",
  setup(buildApi) {
    buildApi.onLoad(
      {
        filter: /node_modules\/@paper-design\/shaders\/dist\/shader-mount\.js$/,
      },
      async ({ path }) => ({
        contents: adaptFrameDrivenPaper(await readFile(path, "utf8")),
        loader: "js",
        resolveDir: dirname(path),
      }),
    );
  },
};
