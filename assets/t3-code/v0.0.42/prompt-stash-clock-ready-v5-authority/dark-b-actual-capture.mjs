import{capture}from"/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/whole-clock-v5.mjs";
import{afterClockHook,sample}from"/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/timer-policy.mjs";
import {paintedState,timerTrace,trackLayers} from "/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/diagnostics.mjs";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = "/home/akshar/dev/projects/hyfrme-audit";
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const originalSource = resolve(root, "assets/t3-code/v0.0.42");
const source = "/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/dark/native-whole-clock-v5-b/source";
const theme = "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const baseDir = "/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/dark/native-whole-clock-v5-b/backend";
const prefix = `prompt-stash-v0042-${theme}`;
const work = "/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/dark/native-whole-clock-v5-b/frames";
const reference = "/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/dark/native-whole-clock-v5-b/reference.mkv";
const base = JSON.parse(await readFile(resolve(originalSource, "brief-v0042-fixture.json"), "utf8"));
const prompt = "Make a Hyfrme Logo Enter cut with a longer final hold.";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Wrong capture browser");
}
await cp("/home/akshar/dev/projects/hyfrme-audit/.work/full-parity-audit/prompt-stash-diagnosis/dark/native-sidebar-seed-v2", baseDir,
  { recursive: true, errorOnExist: true, force: false });
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "4084" : "4085", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error("Official server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error("Official server did not produce a pairing URL");
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(`${key} differs from pinned official release`);
    }
  }
  const lazy=await fetch(new URL('/assets/ChatView-OmV_i9YI.js',pairingUrl));
  if(!lazy.ok||hash(Buffer.from(await lazy.arrayBuffer()))!=="2fd6770a07873db4e1494ac5486294bc328f2571948d11979bb68368040d70c2")throw Error('Actual native lazy ChatView chunk differs from pin');
  const frames = 120;
  const fps = 30;
  const phases = ["draft", "stashed", "menu", "persisted-menu", "recalled", "direct-stashed", "direct-recalled"];
  const events = { stash: 20, menu: 40, persistedMenu: 60, recall: 80, stashAgain: 100, directRecall: 110 };
  const observed = {};
  await mkdir(work, { recursive: false });
  await mkdir(source, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ] });
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });

    const states=[];
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    const layers = await trackLayers(page);
    const editor = page.locator('[data-testid="composer-editor"]');
    await editor.waitFor({ timeout: 20000 });
    await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" })
      .getByText("Build a logo intro", { exact: true }).click();
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => {window.__diagnosticDismissedToasts=buttons.map(button=>button.closest('[data-position]'));if(window.__diagnosticDismissedToasts.some(node=>!node))throw Error('Toast root absent');buttons.forEach(button=>button.click());});
    await page.evaluate(() => document.fonts.ready);
    if ((await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light")) !== theme) {
      throw new Error(`Official app displayed the wrong ${theme} theme`);
    }
    const badge = page.locator('[data-prompt-stash-badge="true"]');
    const drawer = page.locator('[data-composer-stash-drawer="true"]');
    const stashEntries = () => page.evaluate(() => {
      const raw = localStorage.getItem("t3code:prompt-stash:v2");
      return raw ? JSON.parse(raw).state.entries : [];
    });
    const clean = (html) => html.replaceAll(baseDir, "hyfrme-fixture").replaceAll("/home/akshar/dev/projects/hyfrme/.work/t3-v0042-sidebar-project", "hyfrme-project/.work/t3-v0042-sidebar-project").replaceAll(root, "hyfrme-project");
    const save = async (phase) => {
      const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      const entries = await stashEntries();
      const drawerVisible = await drawer.isVisible().catch(() => false);
      observed[phase] = {
        editorText: (await editor.innerText()).trim(),
        badgeVisible: await badge.isVisible().catch(() => false),
        stashCount: entries.length,
        stashedPrompt: entries[0]?.prompt ?? null,
        drawerVisible,
      };
      if (!drawerVisible) return;
      const layer = clean(await page.locator('[data-composer-drawer-layer="true"]').evaluate((element) => element.outerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(layer)) {
        throw new Error(`Private fixture data in ${phase} drawer`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), layer);
      observed[phase].drawerRect = await drawer.boundingBox();
      observed[phase].drawerText = await drawer.innerText();
    };
    await editor.fill(prompt);
    await editor.evaluate((element) => element.blur());
    await page.mouse.move(800, 60);
    await page.waitForTimeout(300);
    await page.waitForFunction(()=>window.__diagnosticDismissedToasts.every(node=>!node.isConnected)&&document.querySelectorAll('[data-slot="toast-viewport"] [data-ending-style]').length===0,undefined,{timeout:3000});
    await writeFile(resolve(source,'initial-toast-readiness.json'),JSON.stringify(await page.evaluate(()=>({performanceNow:performance.now(),dateNow:Date.now(),dismissedCount:window.__diagnosticDismissedToasts.length,allDetached:window.__diagnosticDismissedToasts.every(node=>!node.isConnected),exitingCount:document.querySelectorAll('[data-slot="toast-viewport"] [data-ending-style]').length})),null,2));
    const baseline = await page.evaluate(()=>({rows:Array.from(document.querySelectorAll('[data-testid="sidebar-row-card"]'),el=>el.textContent),editor:document.querySelector('[data-testid="composer-editor"]').textContent,model:document.querySelector('[data-chat-provider-model-picker-label="true"]')?.textContent,workspace:document.querySelector('[data-composer-shortcut="composer.workspace"]')?.textContent}));
    if(baseline.rows.length!==5||!baseline.rows[0].includes('Build a logo intro')||baseline.editor!==prompt)throw Error('Native synthetic initial source input drift: '+JSON.stringify(baseline));
    await writeFile(resolve(source,'baseline.json'),JSON.stringify(baseline,null,2));
    const expectedDraft = await readFile(resolve(originalSource, `prompt-stash-v0042-${theme}-draft.html`), 'utf8');
    const actualDraft = clean(await page.locator('#root').evaluate(el=>el.innerHTML));
    const normalizeIds=html=>{const ids=new Map();return html.replace(/_r_[^_]+_/g,id=>{if(!ids.has(id))ids.set(id,`_r_${ids.size}_`);return ids.get(id);});};
    let diagnosticExpected = normalizeIds(expectedDraft);
    const diagnosticActual = normalizeIds(actualDraft);
    const transitionDeltas = [];
    diagnosticExpected = diagnosticExpected.replace(/<li\b[^>]*>/g,tag=>{
      if(!tag.includes('style="transition: transform linear;"'))return tag;
      const isHeader=tag.includes('data-testid="sidebar-pinned-header"')||tag.includes('data-testid="sidebar-pinned-divider"');
      const isThread=tag.includes('data-thread-item="true"')&&tag.includes('class="list-none py-0.5 [content-visibility:auto] [contain-intrinsic-size:auto_78px]"');
      const isSettled=tag.includes('data-testid="sidebar-settled-header"')&&tag.includes('class="list-none mx-0.5 h-8 mt-auto"');
      if(!isHeader&&!isThread&&!isSettled)return tag;
      transitionDeltas.push({expected:tag,actual:tag.replace('style="transition: transform linear;"','style=""')});
      return diagnosticActual.includes(transitionDeltas.at(-1).actual)?transitionDeltas.at(-1).actual:tag;
    });
    if(transitionDeltas.length!==8)throw Error('Unexpected diagnostic sidebar transition delta count');
    const inertTransitions=await page.evaluate(()=>Array.from(document.querySelectorAll('li')).filter(el=>['','transition: transform linear;'].includes(el.getAttribute('style'))&&(el.matches('[data-thread-item="true"]')||['sidebar-pinned-header','sidebar-pinned-divider','sidebar-settled-header'].includes(el.dataset.testid))).map(el=>{const s=getComputedStyle(el);return{duration:s.transitionDuration,delay:s.transitionDelay,transform:s.transform,animations:el.getAnimations().length};}));
    await writeFile(resolve(source,'inert-live-measurements.json'),JSON.stringify(inertTransitions,null,2));
    await writeFile(resolve(source,'initial-raw-root.html'),actualDraft);
    if(inertTransitions.length!==8||inertTransitions.some(x=>x.duration!=='0s'||x.delay!=='0s'||x.transform!=='none'||x.animations!==0))throw Error('Diagnostic transition delta no longer measured inert');
    await writeFile(resolve(source,'diagnostic-transition-allowance.json'),JSON.stringify({kind:'Only eight explicitly measured inert native serialization deltas; diagnostic only; native CSS unchanged',transitionDeltas,inertTransitions},null,2));
    if(diagnosticActual!==diagnosticExpected) {
      await writeFile(resolve(source,'initial-drift.html'),actualDraft);
      const liTransitions = await page.evaluate(()=>Array.from(document.querySelectorAll('li'),el=>{const s=getComputedStyle(el);return{testId:el.dataset.testid,class:el.className,text:el.textContent,inline:el.getAttribute('style'),rect:el.getBoundingClientRect().toJSON(),property:s.transitionProperty,duration:s.transitionDuration,delay:s.transitionDelay,timing:s.transitionTimingFunction,transform:s.transform,animations:el.getAnimations().map(a=>({type:a.constructor.name,time:a.currentTime,playState:a.playState,timing:a.effect.getComputedTiming()}))};}));
      await writeFile(resolve(source,'initial-li-transition-measurements.json'),JSON.stringify(liTransitions,null,2));
      await writeFile(resolve(source,'initial-painted-state.json'),JSON.stringify(await paintedState(page),null,2));
      await page.screenshot({path:resolve(source,'initial-drift.png')});
      await writeFile(resolve(source,'initial-layers.json'),JSON.stringify(await layers.collect(),null,2));
      throw Error('Native initial Prompt root differs from recorded draft beyond generated IDs/known synthetic paths; retained measured li transitions, no normalization');
    }
    await writeFile(resolve(source,'initial-source-guard.json'),JSON.stringify({diagnosticExact:true,normalization:'bijective generated IDs, exact known synthetic workspace paths, and precisely eight measured inert sidebar inline transition deltas; native CSS untouched'},null,2));
    await save("draft");

    await capture({page,work,source,originalSource,prefix,theme,prompt,fps,frames,events,editor,badge,drawer,stashEntries,save,clean});
  }finally{await browser.close();}
}finally{if(server.exitCode===null){const exited=new Promise(resolve=>server.once('exit',resolve));server.kill('SIGTERM');await exited;}}
