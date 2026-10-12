import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
export const remocnFontManifest = JSON.parse(
  await readFile(resolve(root, "assets/remocn-fonts/manifest.json"), "utf8"),
);
export const remocnFonts = remocnFontManifest.fonts;
export const remocnFontUrls = new Map(
  remocnFonts.map((font) => [font.sourceUrl, `/${font.path}`]),
);

export async function assertRemocnFonts() {
  await Promise.all(
    remocnFonts.map(async (font) => {
      const bytes = await readFile(resolve(root, font.path));
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (bytes.length !== font.bytes || hash !== font.sha256) {
        throw new Error(`Frozen Remocn font differs from source: ${font.path}`);
      }
      await readFile(resolve(root, font.licensePath));
    }),
  );
}
