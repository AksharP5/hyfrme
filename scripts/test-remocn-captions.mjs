import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";
import {
  createRemocnCaptionsPlugin,
  createTikTokStyleCaptions,
} from "./remocn-captions.mjs";

const caption = (text, startMs, endMs, extra = {}) => ({
  text,
  startMs,
  endMs,
  timestampMs: null,
  confidence: null,
  ...extra,
});

test("caption paging crosses the duration limit only at a new word", () => {
  const { pages } = createTikTokStyleCaptions({
    captions: [
      caption(" Hy", 0, 200),
      caption("frme", 200, 400),
      caption(" keeps", 400, 600),
      caption(" pace", 600, 800),
    ],
    combineTokensWithinMilliseconds: 400,
  });
  assert.deepEqual(
    pages.map((page) => page.text),
    ["Hyfrme keeps", "pace"],
  );
  assert.deepEqual(
    pages.map((page) => page.durationMs),
    [600, 200],
  );
  assert.deepEqual(pages[0].tokens, [
    { text: "Hy", fromMs: 0, toMs: 200 },
    { text: "frme", fromMs: 200, toMs: 400 },
    { text: " keeps", fromMs: 400, toMs: 600 },
  ]);
});

test("silence breaks at the threshold and preserves sub-word tokens", () => {
  const { pages } = createTikTokStyleCaptions({
    captions: [
      caption(" Hy", 0, 100),
      caption("frme", 700, 800),
      caption(" captions", 1400, 1600),
    ],
    combineTokensWithinMilliseconds: 3000,
    breakOnSilenceAfterMilliseconds: 600,
  });
  assert.deepEqual(
    pages.map((page) => page.text),
    ["Hyfrme", "captions"],
  );
  assert.deepEqual(
    pages.map((page) => page.durationMs),
    [1400, 200],
  );
});

test("explicit breaks preserve token markers and leave transcripts unchanged", () => {
  const captions = [
    caption(" Ready.", 300, 600, { speaker: "host", pageBreakAfter: false }),
    caption(" Go\n", 600, 900, { speaker: "host", pageBreakAfter: true }),
    caption(" Done", 1000, 1200, { speaker: "guest", pageBreakAfter: true }),
  ];
  const before = structuredClone(captions);
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 3000,
  });
  assert.deepEqual(
    pages.map((page) => page.text),
    ["Ready. Go", "Done"],
  );
  assert.deepEqual(
    pages.map((page) => page.durationMs),
    [700, 200],
  );
  assert.deepEqual(pages[0].tokens[1], {
    text: " Go\n",
    fromMs: 600,
    toMs: 900,
    pageBreakAfter: true,
  });
  assert.deepEqual(captions, before);
});

test("empty transcripts and whitespace do not produce spoken tokens", () => {
  assert.deepEqual(
    createTikTokStyleCaptions({
      captions: [],
      combineTokensWithinMilliseconds: 0,
    }),
    { pages: [] },
  );
  const { pages } = createTikTokStyleCaptions({
    captions: [
      caption(" ", 0, 100),
      caption(" Hyfrme", 100, 300),
      caption(" ", 300, 350),
      caption("\n", 350, 400),
    ],
    combineTokensWithinMilliseconds: 3000,
  });
  assert.deepEqual(pages, [
    {
      text: "Hyfrme ",
      startMs: 100,
      tokens: [{ text: "Hyfrme", fromMs: 100, toMs: 300 }],
      durationMs: 300,
    },
  ]);
});

test("compiled caption imports use Hyfrme paging and pinned caption-core", async () => {
  const sourceRoot = await mkdtemp(resolve(tmpdir(), "hyfrme-captions-"));
  try {
    const core = resolve(sourceRoot, "registry/remocn/caption-core/index.ts");
    await mkdir(resolve(core, ".."), { recursive: true });
    await writeFile(
      core,
      'export {createTikTokStyleCaptions as pageCaptions} from "@remotion/captions";',
    );
    const result = await build({
      bundle: true,
      format: "esm",
      platform: "node",
      metafile: true,
      write: false,
      plugins: [createRemocnCaptionsPlugin(sourceRoot)],
      stdin: {
        contents: 'export {pageCaptions} from "@/lib/remocn/caption-core";',
        resolveDir: sourceRoot,
      },
    });
    const { pageCaptions } = await import(
      `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
    );
    assert.deepEqual(
      pageCaptions({
        captions: [
          caption(" Hyfrme", 0, 100, { pageBreakAfter: true }),
          caption(" captions", 100, 300),
        ],
        combineTokensWithinMilliseconds: 3000,
      }).pages.map((page) => page.text),
      ["Hyfrme", "captions"],
    );
    const inputs = Object.keys(result.metafile.inputs);
    assert.ok(
      inputs.some((path) =>
        path.endsWith("registry/remocn/caption-core/index.ts"),
      ),
    );
    assert.ok(inputs.includes("hyfrme-captions:caption-pages"));
    assert.ok(inputs.every((path) => !path.includes("node_modules")));
  } finally {
    await rm(sourceRoot, { recursive: true, force: true });
  }
});
