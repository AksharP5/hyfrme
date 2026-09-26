import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-agent-answer";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks/t3-agent-answer"));
const project = resolve(root, ".work/t3-agent-answer-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "logo/answer",
  threadOne: "Review Logo Flicker",
  userMessage: "Review Hyfrme Logo Flicker and hold its last rendered frame.",
  replyLead: "I checked the Logo Flicker timing in",
  replyFile: "logo-flicker.html",
  replyFilePath: "registry/blocks/logo-flicker/logo-flicker.html",
  replyTail: ". The last frame can stay on screen for 24 frames.",
  replyTime: "today at 10:42 AM",
  copyTooltip: "Copy answer",
  copiedFeedback: "Answer copied!",
  composerPlaceholder: "Ask Hyfrme for another pass",
  hoverFrame: 15,
  tooltipFrame: 40,
  copyFrame: 65,
  clearFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-agent-answer-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-agent-answer-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,0.9,1.7,2.5,3.7", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
console.log(result.stdout.trim());
