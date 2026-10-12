import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = process.cwd();
const run = process.env.T3_CAPTURE_RUN;
if (!run) throw new Error("T3_CAPTURE_RUN is required");
const userClockPolicy = process.env.T3_CAPTURE_POLICY === "user-clock";
const lifecycle = [];
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(run, "source");
const work = resolve(run, "frames");
const serverLog = resolve(run, "backend.log");
const reference = resolve(run, "reference.mkv");
const browserPath = process.env.HYFRME_CHROMIUM;
if (!browserPath) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated Thread Actions fixture server");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 release");
const chromeVersion = spawnSync(browserPath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong Chrome release");
const releaseFiles = { index: "client/index.html", css: "client/assets/main-x9o7QJ8O.css", js: "client/assets/index-BMH8bO9q.js" };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(releaseFiles).map(async ([key, path]) => [key, hash(await readFile(resolve(release, path)))])));
for (const [key, path] of Object.entries(releaseFiles)) {
  const served = await fetch(new URL(`/${path.replace(/^client\//, "")}`, pairingUrl));
  if (!served.ok || hash(Buffer.from(await served.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from official T3 release`);
}

const frames = 120;
const fps = 30;
const events = { open: 30, submenu: 60, close: 90 };
const phases = ["before", "menu", "snooze", "after"];
const targetThread = "Build a logo intro";
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let menuBox;
let submenuBox;
let rowBox;
let menuLabels;
let snoozeLabels;
const transitions = {};
const inertInitialization = {};
const compareSource = (original,current) => {
 const ids = html => {const seen=new Map();return html.replace(/_r_[^_]+_/g,id=>{if(!seen.has(id))seen.set(id,'_r_generated'+seen.size+'_');return seen.get(id);});};
 const old=ids(original),fresh=ids(current);if(old===fresh)return {equal:true,deltas:[]};
 const tags=[...old.matchAll(/<li\b[^>]*>/g)],newTags=[...fresh.matchAll(/<li\b[^>]*>/g)];
 if(tags.length!==newTags.length)return {equal:false,deltas:[]};let adjusted=fresh;const deltas=[];
 for(let i=0;i<tags.length;i++){
  const a=tags[i][0],b=newTags[i][0];if(a===b)continue;
  const allowed=/data-testid="sidebar-(?:pinned-header|pinned-divider|settled-header)"/.test(a)||/data-thread-item="true"/.test(a);
  const inert = tag => tag.replace('style="transition: transform linear;"','style=""');
  if(!allowed||inert(a)!==inert(b)||!((a.includes('style=""')&&b.includes('style="transition: transform linear;"'))||(b.includes('style=""')&&a.includes('style="transition: transform linear;"'))))return {equal:false,deltas};
  deltas.push({liIndex:i,old:a,current:b});adjusted=adjusted.replace(b,a);
 }
 return {equal:adjusted===old&&deltas.length<=8,deltas};
};
try {
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  const row = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: targetThread }).first();
  await row.click();
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(450);
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  const submenu = page.locator('.dropdown-glass[data-level="1"]');
  const saveRoot = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-v0042-actions-project"), "hyfrme-project")
      .replaceAll(resolve(root, ".work/t3-v0042-pin-project"), "hyfrme-project")
      .replaceAll(resolve(root, "../hyfrme"), "hyfrme-project").replaceAll(root, "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3917/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `thread-actions-${theme}-${phase}.html`), dom);
    inertInitialization[phase]=await page.locator('#root li').evaluateAll(nodes=>nodes.map((node,liIndex)=>({liIndex,tag:node.outerHTML.slice(0,node.outerHTML.indexOf('>')+1),rect:node.getBoundingClientRect().toJSON(),property:getComputedStyle(node).transitionProperty,duration:getComputedStyle(node).transitionDuration,delay:getComputedStyle(node).transitionDelay,transform:getComputedStyle(node).transform,animations:node.getAnimations().length})));
    await writeFile(resolve(run,'inert-initialization-metrics.json'),JSON.stringify({originalMetrics:'Not measured; original transform/zero-duration semantics derived from exact inline declaration and pinned CSS',phases:inertInitialization},null,2)+'\n');
  };
  const savePortal = async (phase) => {
    const html = await page.locator('.dropdown-glass[data-level]').evaluateAll((menus) => menus.map((element) => element.outerHTML).join(""));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private data in ${phase} portal`);
    await writeFile(resolve(source, `thread-actions-${theme}-${phase}-portal.html`), html);
  };
  const pauseTransitions = async (phase) => {
    transitions[phase] = await page.evaluate(({ name, userClockPolicy }) => {
      window.__threadActionAnimations ??= {};
      const animations = document.getAnimations().filter((animation) => {
        const target = animation.effect?.target;
        return target instanceof Element && (target.closest('.dropdown-glass, [data-thread-item="true"]') || (userClockPolicy && name === 'open' && animation instanceof CSSTransition && animation.transitionProperty === 'opacity' && target.matches('[data-message-role="user"] .opacity-0.transition-opacity')));
      });
      window.__threadActionAnimations[name] = animations;
      return animations.map((animation) => {
        const timing = animation.effect?.getComputedTiming();
        const target = animation.effect?.target;
        const record = {
          target: target?.getAttribute?.("class")?.slice(0, 140),
          row: target?.closest?.('[data-thread-item="true"]')?.querySelector?.('[data-testid="sidebar-row-card"]')?.textContent?.trim().slice(0, 100) ?? null,
          label: target?.closest?.("button")?.innerText?.trim() ?? null,
          menuLevel: target?.closest?.("[data-level]")?.getAttribute("data-level") ?? null,
          durationMs: timing?.duration,
          easing: animation.effect?.getTiming().easing,
          keyframes: animation.effect?.getKeyframes(),
        };
        if(userClockPolicy && target.closest('[data-message-role="user"]')){if(timing.duration!==200||record.easing!=='cubic-bezier(0.4, 0, 0.2, 1)')throw Error('Unexpected source user opacity transition');}
        animation.pause();
        animation.currentTime = 0;
        return record;
      });
    }, { name: phase, userClockPolicy });
  };
  await saveRoot("before");
  const normalizedIds = html => {
    const ids = new Map();
    return html.replace(/_r_[^_]+_/g, id => {
      if (!ids.has(id)) ids.set(id, '_r_generated' + ids.size + '_');
      return ids.get(id);
    });
  };
  const expectedBefore = await readFile(resolve(root, 'assets/t3-code/v0.0.42/thread-actions-' + theme + '-before.html'), 'utf8');
  const actualBefore = await readFile(resolve(source, 'thread-actions-' + theme + '-before.html'), 'utf8');
  const beforeComparison=compareSource(expectedBefore,actualBefore);
  for(const delta of beforeComparison.deltas){const metric=inertInitialization.before[delta.liIndex];if(!metric||metric.property!==(delta.current.includes('style=""')?'all':'transform')||metric.duration!=='0s'||metric.delay!=='0s'||metric.transform!=='none'||metric.animations!==0)throw Error('Inert initialization metric guard failed');}
  await writeFile(resolve(run,'initial-source-comparison.json'),JSON.stringify(beforeComparison,null,2)+'\n');
  if(!beforeComparison.equal)throw new Error('Initial source root drift; retain raw DOM and stop before frame 0');

  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.open) {
      await row.click({ button: "right" });
      await menu.waitFor();
      menuLabels = await menu.locator("button").allInnerTexts();
      for (const label of ["Pin thread", "Settle thread", "Snooze", "Rename thread", "Project settings", "Archive thread"]) {
        if (!menuLabels.includes(label)) throw new Error(`Native row menu lacks ${label}`);
      }
      rowBox = await row.boundingBox();
      menuBox = await menu.boundingBox();
      if (!rowBox || !menuBox || menuBox.x > rowBox.x + rowBox.width + 30 || menuBox.y < rowBox.y - 30) throw new Error("Menu is detached from its row");
      await saveRoot("menu");
      await savePortal("menu");
      await pauseTransitions("open");
    }
    if (frame === events.submenu) {
      await menu.getByRole("button", { name: "Snooze", exact: true }).hover();
      await submenu.waitFor();
      snoozeLabels = await submenu.locator("button").allInnerTexts();
      if (!snoozeLabels.some((label) => label.startsWith("Custom"))) throw new Error("Native custom Snooze option missing");
      submenuBox = await submenu.boundingBox();
      await saveRoot("snooze");
      await savePortal("snooze");
      await pauseTransitions("submenu");
    }
    if (frame === events.close) {
      await page.mouse.click(800, 350);
      await menu.waitFor({ state: "detached" });
      await page.waitForFunction(() => !document.querySelector('[data-testid="sidebar-row-card"][data-popup-open]'), null, { timeout: 1500 });
      await page.waitForTimeout(200);
      await saveRoot("after");
      await pauseTransitions("close");
    }
    for (const [name, start] of Object.entries(events)) {
      if(frame < start || frame > start + 6)continue;
      await page.evaluate(async ({name,ms,elapsed,userClockPolicy})=>{
        const ready=[];
        for(const animation of window.__threadActionAnimations?.[name]??[]){
          const user = userClockPolicy && animation.effect?.target?.matches('[data-message-role="user"] .opacity-0.transition-opacity');
          const finish = user ? 6 : 5;
          if(elapsed < finish){animation.currentTime=ms;ready.push(animation.ready);}
          else if(elapsed===finish)animation.cancel();
        }
        await Promise.all(ready);
      },{name,ms:(frame-start)*1000/fps,elapsed:frame-start,userClockPolicy});
    }
    const user = await page.evaluate(() => ({
      nodes: [...document.querySelectorAll('[data-message-role="user"] .opacity-0.transition-opacity')].map(node => ({class:node.className,opacity:getComputedStyle(node).opacity,rect:node.getBoundingClientRect().toJSON()})),
      animations: document.getAnimations().map(animation => ({type:animation.constructor.name,targetClass:animation.effect?.target?.className,targetSlot:animation.effect?.target?.getAttribute?.('data-slot'),inUser:!!animation.effect?.target?.closest?.('[data-message-role="user"]'),inComposer:!!animation.effect?.target?.closest?.('[data-testid="composer-editor"],fieldset'),rect:animation.effect?.target?.getBoundingClientRect?.().toJSON(),currentTime:animation.currentTime,playState:animation.playState,timing:animation.effect.getTiming(),computed:animation.effect.getComputedTiming(),keyframes:animation.effect.getKeyframes()}))
    }));
    lifecycle.push({frame,capturedAtMs:performance.now(),user});
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-actions-${theme}-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["menu", "snooze"].map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-actions-${theme}-${phase}-portal.html`)))])));
await writeFile(resolve(source, `thread-actions-${theme}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: "f504e931ee4406bfe76754147cb0e2a0f300d75c6c505a0e174a1e79f65ceea3",
  sourceHashes, viewport: { width: 1200, height: 659 }, fps, frames, phases, events, theme, targetThread,
  provenance: {
    app: "official desktop T3 Code v0.0.42 binary and bundled client",
    interaction: "live native sidebar row right-click, Snooze hover, and blank-workspace click to close",
    data: "seeded local Hyfrme project and conversation; provider unavailable",
    clock: "2026-09-25T11:30:00Z",
    pointerTarget: "sidebar-row-card for Build a logo intro",
  },
  rowBox, menuBox, submenuBox, menuLabels, snoozeLabels, transitions, sourceDomHashes, portalHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native v0.0.42 Thread Actions ${theme} frames with row menu and Snooze submenu.`);

await writeFile(resolve(run,"user-lifecycle.json"),JSON.stringify({policy:userClockPolicy?"user-clock":"original",frames:lifecycle},null,2)+"\n");

const semanticComparisons = [];
for (const phase of phases) {
  const stem = 'thread-actions-' + theme + '-' + phase;
  const parts = ['.html', ...( 'thread-actions' === 'settle-thread' || ['menu','snooze'].includes(phase) ? ['-portal.html'] : [])];
  const originals = await Promise.all(parts.map(part => readFile(resolve(root,'assets/t3-code/v0.0.42',stem+part),'utf8')));
  const current = await Promise.all(parts.map(part => readFile(resolve(source,stem+part),'utf8')));
  const normalize = html => { const ids=new Map(); return html.replace(/_r_[^_]+_/g,id=>{if(!ids.has(id))ids.set(id,'_r_generated'+ids.size+'_');return ids.get(id);}); };
  const comparison=compareSource(originals.join(''),current.join(''));
  for(const delta of comparison.deltas){const metric=inertInitialization[phase][delta.liIndex];if(!metric||metric.property!==(delta.current.includes('style=""')?'all':'transform')||metric.duration!=='0s'||metric.delay!=='0s'||metric.transform!=='none'||metric.animations!==0)throw Error('Phase inert initialization metric guard failed');}
  semanticComparisons.push({phase, initializationDeltas:comparison.deltas, rawOriginalSha256:hash(originals.join('')), rawCapturedSha256:hash(current.join('')), equalExceptGeneratedIdsAndExplicitInertInitialization:comparison.equal});
}
await writeFile(resolve(run,'source-semantic-comparison.json'),JSON.stringify(semanticComparisons,null,2)+'\n');
if(semanticComparisons.some(phase=>!phase.equalExceptGeneratedIdsAndExplicitInertInitialization))throw new Error('Source phase DOM drift; no authority selection permitted');
