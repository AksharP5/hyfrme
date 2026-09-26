import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) {
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated, paired T3 Code fixture.");
}
const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const frames = 120;
const sendFrame = 30;
const prompt = "Build a four-second Hyfrme Logo Enter preview with a clean final hold.";
const work = resolve(root, ".work/t3-prompt-send-reference");
const reference = resolve(root, "parity/t3-prompt-send-reference.mkv");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", baseFixture.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", baseFixture.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", baseFixture.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned T3 Code build`);
  }
}
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
const phases = ["draft", "sent", "agent"];
const captureDom = async (page, phase) => {
  await writeFile(resolve(source, `prompt-send-${phase}.html`),
    await page.locator("#root").evaluate((element) => element.innerHTML));
};
const sampleFrames = { draft: 0, sent: 30, agent: 45 };
const status = {};
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.locator('button[data-slot="toast-close"]')
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.waitForTimeout(750);
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(650, 100);
  await page.waitForTimeout(250);
  await captureDom(page, "draft");
  await page.screenshot({ path: resolve(work, "sample-draft.png") });

  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText(prompt, { exact: true }).waitFor({ timeout: 15000 });
  await page.mouse.move(650, 100);
  await captureDom(page, "sent");
  await page.screenshot({ path: resolve(work, "sample-sent.png") });
  await page.getByText("Thinking", { exact: true }).first().waitFor({ timeout: 5000 });
  await page.waitForTimeout(300);
  await captureDom(page, "agent");
  const agentText = await page.locator("#root").innerText();
  if (agentText.includes("Reconnecting")) {
    throw new Error("The isolated provider failed before the native agent-start frame could be captured");
  }
  status.agent = agentText.match(/Working for \d+s/)?.[0] ?? "";
  await page.screenshot({ path: resolve(work, "sample-agent.png") });
} finally {
  await browser.close();
}
for (let frame = 0; frame < frames; frame++) {
  const phase = frame < sampleFrames.sent ? "draft" : frame < sampleFrames.agent ? "sent" : "agent";
  await copyFile(resolve(work, `sample-${phase}.png`), resolve(work, `frame-${String(frame).padStart(4, "0")}.png`));
}
const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "prompt-send-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  sendFrame,
  sampleFrames,
  referenceMode: "native-interaction-beats-held",
  prompt,
  status,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `prompt-send-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Prompt Send frames from the Hyfrme demo thread.`);
