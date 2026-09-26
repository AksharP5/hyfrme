import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core",
);

const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) {
  throw new Error(
    "Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated, paired T3 Code v0.0.35 fixture.",
  );
}

const source = {
  index: [
    "/",
    "76dc31527cb322caa7fcd43540428d561294ae70edd6e58a7d4ea219460126b8",
  ],
  css: [
    "/assets/index-DSuALXPn.css",
    "7e8c650997b043793b8b073da6b524f7c7460fd70ced779291bca6b66264005c",
  ],
  js: [
    "/assets/index-CI6tzIRc.js",
    "990874e9806303c06edff2bd0b9af98453c64843db74b5a0609974a2d686be07",
  ],
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const inputs = await Promise.all(
  Object.entries(source).map(async ([name, [path, expected]]) => {
    const response = await fetch(new URL(path, url));
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (hash(bytes) !== expected)
      throw new Error(`${name} differs from the pinned T3 Code v0.0.35 build`);
    return [name, bytes];
  }),
);
const assets = Object.fromEntries(inputs);

const prompt =
  "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.";
const typingStart = 10;
const typingEnd = 101;
const frames = 120;
const work = resolve(root, ".work/t3-brief-reference");
const assetsDir = resolve(root, "assets/t3-code/v0.0.35");
const reference = resolve(root, "parity/t3-brief-to-prompt-reference.mkv");
await mkdir(work, { recursive: true });
await mkdir(assetsDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--font-render-hinting=none",
    "--force-color-profile=srgb",
    "--use-gl=angle",
    "--use-angle=gl-egl",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 659 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const dismissNotifications = async () => {
    const count = await page
      .locator('button[data-slot="toast-close"]')
      .evaluateAll((buttons) => {
        buttons.forEach((button) => button.click());
        return buttons.length;
      });
    if (count) await page.waitForTimeout(600);
  };
  await dismissNotifications();
  await page.evaluate(() => document.fonts.ready);

  const html = await page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll("script").forEach((script) => script.remove());
    return `<!doctype html>${clone.outerHTML}`;
  });
  if (/\/home\/|\/tmp\/|bearer|authorization|pairing token/i.test(html)) {
    throw new Error(
      "Captured DOM may contain private or machine-specific content",
    );
  }
  await writeFile(resolve(assetsDir, "brief-base.html"), html);
  await writeFile(resolve(assetsDir, "t3.css"), assets.css);
  const { shell, theme } = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      shell: document.querySelector("#root").innerHTML,
      theme: Object.fromEntries(
        Array.from(style)
          .filter((name) => name.startsWith("--"))
          .map((name) => [name, style.getPropertyValue(name).trim()]),
      ),
    };
  });
  await writeFile(resolve(assetsDir, "brief-shell.html"), shell);
  await writeFile(
    resolve(assetsDir, "dark-theme.json"),
    `${JSON.stringify(theme, null, 2)}\n`,
  );

  let previousCount = 0;
  for (let frame = 0; frame < frames; frame++) {
    await dismissNotifications();
    const progress = Math.max(
      0,
      Math.min(1, (frame - typingStart) / (typingEnd - typingStart)),
    );
    const count = Math.round(prompt.length * progress);
    if (count !== previousCount) {
      await editor.fill(prompt.slice(0, count));
      await editor.evaluate((element) => element.blur());
      previousCount = count;
    }
    await page.screenshot({
      path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
    });
  }
} finally {
  await browser.close();
}

const encode = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    "30",
    "-i",
    resolve(work, "frame-%04d.png"),
    "-c:v",
    "ffv1",
    "-level",
    "3",
    "-pix_fmt",
    "gbrp",
    reference,
  ],
  { encoding: "utf8" },
);
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(
  resolve(assetsDir, "brief-fixture.json"),
  `${JSON.stringify(
    {
      sourceTag: "v0.0.35",
      sourceCommit: "f925d639421844f02b3166d29281905dbba6d529",
      sourceHashes: Object.fromEntries(
        Object.entries(source).map(([name, [, sha256]]) => [name, sha256]),
      ),
      viewport: { width: 1200, height: 659 },
      fps: 30,
      frames,
      prompt,
      typingStart,
      typingEnd,
      domSha256: hash(await readFile(resolve(assetsDir, "brief-base.html"))),
      shellSha256: hash(await readFile(resolve(assetsDir, "brief-shell.html"))),
      themeSha256: hash(await readFile(resolve(assetsDir, "dark-theme.json"))),
      referenceSha256: hash(await readFile(reference)),
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Captured ${frames} native T3 Code frames and pinned the v0.0.35 DOM/CSS.`,
);
