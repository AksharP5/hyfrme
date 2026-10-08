# Upstream to HyperFrames porting contract

## Product shape

Hyfrme is HyperFrames-first. Remocn and Snapcn appear as attributed source references
and in the comparison lab; it is not the project's identity. Catalog cards and
component pages lead with the HyperFrames render, controls, source, and install
path.

The comparison lab uses pre-rendered, synchronized MP4s rather than loading both
framework runtimes in the browser. Both renders come from the same canonical
fixture.

## What “1:1” means

Every port has a parity manifest containing:

1. The upstream repository, pinned commit, and source path.
2. Canonical dimensions, fps, duration, font, background, and props.
3. The port classification: mechanical, native rewrite, or blocked.
4. HyperFrames check results and render-comparison metrics.
5. A documented gap whenever an API or behavior cannot map exactly.

“1:1” means equivalent rendered output and controls for the canonical fixture.
It does not pretend React and standalone HTML expose the same component API.

## Packaging

Each port ships as a standalone `hyperframes:block` first. A block preserves the
reference canvas and timing, supports HyperFrames variables, installs cleanly,
and can be rendered and compared in isolation. High-value effects may later
also receive lower-level snippet variants.

The website and validation script read `registry-item.json` and the matching
`parity/<slug>.json`; component metadata should not be maintained again in app
code.

## Validation pipeline

1. Inspect the upstream source for translation blockers.
2. Render the upstream at the pinned commit with PNG frames and a fixed color path.
3. Run `hyperframes check`, then render the port at identical dimensions/fps.
4. Compute SSIM and save the videos, summary, and frame strip. Use lossless PNG
   frames when full-frame noise makes independent video encoders the dominant
   source of error.
5. Gate simple and medium ports at 0.95 mean SSIM.
6. Publish the source attribution, metrics, and any documented gap.

## Verified catalog

The native `soft-blur-in` port exercises per-character timing, blur, an exact
cubic Bézier, bundled typography, and HyperFrames variables. It passes the 0.95
gate at 0.998647 mean SSIM across 60 frames.

The complete 100-item animated-icon family is also verified. Its source SVG,
easing, interpolation, spring, draw, and action math are compiled into a small
deterministic DOM runtime driven by the HyperFrames GSAP clock. Framework-neutral
Hyfrme frame math reproduces the reference behavior without bundling Remotion.
Each block is a standalone HTML composition with no React dependency at playback
time.

- All 100 strict renders passed.
- Five representative icons passed full HyperFrames lint, runtime, layout, and
  motion checks with zero errors or warnings.
- Family mean SSIM: 0.993872.
- Per-item range: 0.985560–0.998621.
- Canonical icon fixtures cover 60–90 frames at 30 fps.
- Website previews are independently rendered and compared at 384×384 (8×
  the canonical 48×48 fixture), so the vector strokes stay sharp when enlarged
  without changing the installable block or its canonical parity result.

Inbox's 384px showcase uses native 384px source props and canvas with render
scale 1. Enlarging a 48px render also enlarged its CSS translation, producing
the old mismatch. The corrected 48px and 384px installed fixtures pass all
140 lossless frames with exact RGBA and zero full-check warnings or errors.
The icon generator also initializes its renderer map for the published CLI's
inline-script namespacing.

The first 24-item typography/effect family is verified as exact compiled-source
ports. Each block preserves the upstream React component and editable controls,
uses Hyfrme-owned Remotion-compatible easing/interpolation behavior, and
re-renders from a HyperFrames-controlled frame clock. The runtime and Geist font
ship beside the HTML composition, so playback does not depend on a Remotion
installation or include Remotion runtime code.

- All 24 strict renders passed.
- Seven representative motion structures passed full HyperFrames lint, runtime,
  layout, motion, and contrast checks with zero errors or warnings.
- Family mean SSIM: 0.997021.
- Per-item range: 0.986619–0.999432.
- Canonical fixtures cover 60–120 frames at 30 fps and 1280×720.
- `marker-highlight`, `tracking-in`, and `slot-machine-roll` extend the family
  with deterministic spring motion; their mean SSIM scores are 0.997746,
  0.987158, and 0.995761 respectively.
- `shimmer-sweep` uses the supported intentional-occlusion annotation for its
  stacked base/shine text. Its animated clipped gradient passes strict render
  and SSIM; HyperFrames 0.7.64 does not fingerprint `background-position` as
  geometry motion, so no full-check claim is made for that item.

The original 85 composition/data items are verified with the same
compiled-source runtime.

- All 85 strict renders passed.
- Family mean SSIM: 0.994350.
- Per-item range: 0.952963–0.999848.
- Canonical fixtures cover 90–360 frames at 30 fps.
- Twelve overlapping-scene transitions use a Hyfrme-owned `TransitionSeries`
  timing adapter. Their mean is 0.992226, with a 0.971219–0.997838 range.
- Eighteen Paper shader scenes use frame-driven WebGL and remove Remotion's
  stateful render-gate handle. Their mean is 0.994955, with a
  0.983005–0.999021 range.
- Five AI-product scenes bundle only the normal Latin Inter or JetBrains Mono
  variable font they use. Their mean is 0.994679.
- Four social scenes package their default logo, cover, and GitHub avatars;
  image-error state is compiled out because the pinned files install with the
  block. Their mean is 0.991273.
- The Paper shader dependency retains its PolyForm Shield 1.0.0 terms. Every
  affected registry item declares the mixed license and installs the complete
  third-party license alongside the block.
- The previous pinned update added 19 user-facing components: the hand-drawn
  family, ASCII/Caret/Icon transitions, four shaders, and Reel. All 19 pass
  strict render parity with a 0.995755 family mean. Eighteen pass the full
  HyperFrames check; `shader-gem-smoke` passes runtime, motion, and contrast but
  retains the checker's documented `sweep_static` WebGL-canvas heuristic in its
  parity manifest.
- A previous upstream update adds `slide-swap` and `spring-settle`, plus the
  internal `scene-motion` helper used directly by `spring-settle`. Both public
  blocks pass the full HyperFrames check. Their mean SSIM scores are 0.997717
  and 0.998177 across 210 and 213 canonical frames respectively.
- `progress-steps`, number wheels, intentional overlay scenes, and static
  backdrops retain strict-render-only claims where the full checker reports
  known heuristic false positives. Per-item manifests state the exact result.
- A previous pin adds five WebGL transitions, ten continuous canvas filters,
  and TV Power Off. All 16 use Remocn's `canvas-presentation` helper through a
  deterministic HyperFrames frame clock. All 1,420 canonical frames now match
  the pinned upstream source with mean/minimum RGB SSIM of 1 and identical
  alpha. Every installed block passes the full HyperFrames check. Comparisons
  use lossless PNGs so independent H.264 encoders cannot distort the result.
  ASCII Render uses the same 90-frame primary example shown in Remocn's docs.
- Infinite Marquee and Perspective Marquee package upstream's variable Geist
  font instead of synthesizing every weight from a semibold file. All 420 frames
  match the source with mean/minimum RGB SSIM of 1 and identical alpha. Infinite
  Marquee passes the full check. Perspective Marquee retains five reviewed
  `text_occluded` findings: the inspector treats its transparent gradient center
  as opaque. Exact selectors and reasons are recorded in
  `catalog/remocn-check-exceptions.json` and its parity manifest.

The 18-component audit also compares decoded RGBA frame hashes. All 1,840 frames
are byte-for-byte identical. The hash files and source pins are listed in
`parity/remocn-preview-audit.json`.

The original 45 UI primitives and flows are verified.

- All 45 strict renders passed.
- Family mean SSIM: 0.999585.
- Per-item range: 0.995265–0.999995.
- Canonical fixtures cover 40–380 frames at 30 fps, including 432×768 chat
  flows and 1280×720 desktop scenes.
- Eight complete flows average 0.998608 and use the official Remocn showcase
  wrappers and durations.
- The static `field` family uses a Hyfrme verification wrapper composed only
  from the pinned Remocn Field exports; its strict score is 0.999856.
- Alert Dialog and Combobox retain strict-render-only claims because the full
  checker flags their intentional overlay and ghost-text layering.

## Coverage status

The audited Remocn inventory at
`7fa2db1cd29dfb36743e54e3d078dd9107c879a2` contains 307 public visual components.
The deprecated `progress-steps` and `data-flow-pipes` ports are removed.
The six helper entries,
`brush`, `canvas-presentation`, `icons-core`, `remocn-ui`, `scene-motion`, and
`stop-motion`, do not become catalog blocks.

Inventory reads the authored family registries referenced by `registry.json`.
This includes `select-menu`, whose published docs and family registry precede
its inclusion in the generated root registry. Unpublished source experiments
are excluded.

Hyfrme mirrors Remocn's minimum speed of 1 for the 11 progress-driven scenes
whose payoff depends on reaching the final frame. The maximum remains 4 and the
step remains 0.25 in the website customizer, installed metadata, and CLI.

Upstream changes should open a review issue; they must never overwrite a
passing port automatically.

## Latest Remocn additions

Release Teaser, Brand Guidelines, Workflow Console, Product Showcase
(`launch-anything`), and Order Flow (`fomo-limit-orders`) use commit
`7fa2db1cd29dfb36743e54e3d078dd9107c879a2`. They are customizable blocks under
Scenes / Product showcases. The same pin supplies Typed Split Wipe's Unicode
typing fix.

Template fonts, their original CSS, photographs, and licenses are frozen in
`assets/remocn-templates-7fa2db1/manifest.json`. The reference resolves the exact
upstream Fontsource imports; each template renders in an isolated font set.
Installed blocks include those fonts and image files. Embedded source JPEGs
become local assets, keeping each runtime below 240 KiB. Release Teaser retains
its exact `60000/1001` frame rate throughout rendering and encoding.
Scene photos decode before playback begins and remain preloaded. Image elements
request synchronous decoding, and the HyperFrames seek gate waits for newly
mounted or changed images. This prevents a previous photo from leaking into
Product Showcase's next scene during export.

Brand Guidelines' staged palette labels and overlapping collage/type layers,
and Workflow Console's clipped command text, have narrowly scoped layout
annotations. The original colors and motion remain intact. Brand Guidelines'
one contrast warning, Workflow Console's three chart entrance overlap warnings,
and Product Showcase's eleven contrast warnings remain visible in the full-check
reports.

[Installed-template checks](../catalog/template-installed-audit.json) exercise
all 17 exposed controls, 25 out-of-order seeks, and five exact default resets.
All sampled images and fonts load without request or runtime errors. The
HyperFrames preview shell quantizes seek times to its default frame grid;
repeatability is checked at identical requested times. Export parity uses the
authored frame rate and compares every frame separately.

All five pass the full HyperFrames check and strict rendering across 7,550
frames, with exact alpha. Frame-weighted mean SSIM is **0.999851** and the
lowest frame is **0.995845**. Release Teaser and Brand Guidelines match
every RGB frame exactly. Typed Split Wipe's Unicode fix passes its separate
75-frame fixture. Its website preview also preserves a supplementary-plane
character throughout typing, including the complete first character at frame zero.

Reproduce the templates and Unicode fix with:

```bash
export REMOCN_SOURCE=.work/remocn-7fa2db1cd29dfb36743e54e3d078dd9107c879a2
REMOCN_ASSET_MANIFEST=assets/remocn-templates-7fa2db1/manifest.json npm run setup:remocn-latest
node scripts/generate-text-ports.mjs --only release-teaser,brand-guidelines,workflow-console,launch-anything,fomo-limit-orders,typed-split-wipe
node scripts/verify-text-ports.mjs --lossless --only release-teaser,brand-guidelines,workflow-console,launch-anything,fomo-limit-orders,typed-split-wipe --browser-gpu
```

The earlier September 2026 update added 21 text effects, Lens Zoom, Radial Burst, Stage,
Search Reveal, and Select Menu at commit
`3e03565f5c0001e143c2ed941eea7c3181f13260`. Their canonical fixtures use
Remotion 4.0.513 and the source lockfile's exact dependencies. Fonts and images
are frozen locally with hashes, attribution, and licenses in
`assets/remocn-additions/manifest.json`.

All 26 pass strict rendering and exact alpha across 2,808 frames. Their
frame-weighted mean SSIM is 0.999026, the lowest component mean is 0.995460,
and the lowest frame scores 0.989160. Nineteen pass the full HyperFrames check;
seven retain the reviewed source findings described below.

Cursor Gravity and Type Fossil add another 388 verified frames at commit
`5a5f3a7d2524c01d050e20bfb8859c93f2b3f663`. Both pass the full HyperFrames
check and exact alpha comparison. Mean SSIM is 0.999666 and 0.999906,
respectively. Their separate asset manifest is
`assets/remocn-additions-2026-09-09/manifest.json`. Select it with
`REMOCN_ASSET_MANIFEST` when running `setup:remocn-latest`.

Inline Word Roll, Shader Text Reveal, Shader Light Tunnel, Shader Seam, and
Shader Spiral Pass use commit `e3dc260ff1965440d1f64fb65a8c9a9373e78328`.
Their manifest is `assets/remocn-additions-e3dc260/manifest.json`. These five
need no additional external assets. The transition fixtures use the pinned
upstream example compositions; earlier ports retain their existing pins.

All five pass the full HyperFrames check and strict rendering. All 594 RGB
frames match their pinned references exactly (SSIM 1.0), with exact alpha.

Reproduce these five ports with:

```bash
export REMOCN_SOURCE=.work/remocn-e3dc260ff1965440d1f64fb65a8c9a9373e78328
REMOCN_ASSET_MANIFEST=assets/remocn-additions-e3dc260/manifest.json npm run setup:remocn-latest
node scripts/generate-text-ports.mjs --only inline-word-roll,shader-text-reveal,shader-light-tunnel,shader-seam,shader-spiral-pass
node scripts/verify-text-ports.mjs --lossless --only inline-word-roll,shader-text-reveal,shader-light-tunnel,shader-seam,shader-spiral-pass --browser-gpu
```

Use the isolated checkout so older fixtures retain their original pins:

```bash
npm run setup:remocn-latest
export REMOCN_SOURCE=.work/remocn-3e03565f5c0001e143c2ed941eea7c3181f13260
node scripts/generate-text-ports.mjs --only lens-zoom,kinetic-warp
node scripts/verify-text-ports.mjs --lossless --only lens-zoom,kinetic-warp --browser-gpu
npm run build:catalog
npm run sync:registry
npm run sync:catalog
npm run check
npm run build
npm pack ./cli --dry-run
```

The lossless verifier installs through the CLI, runs the full HyperFrames check,
and compares every PNG frame. Remotion requests `angle-egl`, and HyperFrames
requests hardware rendering; software canvas downsampling changes alpha edges.
Hardware requests require a successful SDK hardware probe. The verifier retains
the first render output and log if that precondition fails, records the probe
separately from the requested mode, and binds its log SHA256 to the evidence.
The SDK probes a separate browser, so the actual capture backend remains
unobserved. Each component must reach 0.99 mean and 0.95
minimum frame SSIM with exact alpha. `--reuse-reference` reuses unchanged source
frames; `--resume` skips only fixtures whose source, installed files, checker
exceptions, browser, and verifier fingerprints still match.

Authored text overlays can trigger checker errors despite matching source
frames. Exact findings and source-specific reasons are retained in
`catalog/remocn-check-exceptions.json` and each parity manifest. SVG extrusion,
trails, and morph blends use intentional-overlap annotations on their text
layers. Other layout, contrast, and motion findings remain visible. Shared Speed
controls are omitted when the source does not read them. Kinetic Warp keeps
its transparent output, with a black website preview behind its white text.

## Remocn September 2026 additions

Remocn main at `7b1e6dadf21243bf6369f1392c8e898b8b40943e` adds 19 registry
entries. Hyfrme integrates all 19 with full-frame SSIM and exact-alpha
verification: Code Morph, Ring Text, Type Wall, Agent Run, Bauhaus Build, Echo Stack, Glyph Anatomy, Keystroke,
Mondrian Split, Outline Trace, Path Ride, Period Drop, Selection Snap, Speed
Lines, Squiggle, Stripe Type, Trim Burst, Truchet Flip, and Type Repeater.
Seven retain source-specific inspector findings for intentional overlaps or
muted source colors; exact origins and reasons are recorded in
`catalog/remocn-check-exceptions.json`.

Code Morph, Ring Text, and Type Wall now match all 468 frames exactly (SSIM
mean/minimum 1.0, identical RGBA hashes). Ring Text preserves the source's discrete
Inter font weights; Type Wall preserves automatic text rasterization; Code Morph's
reference includes the actual upstream Geist Mono font boundary. Frozen Inter, Anton,
and Geist Mono sources make the fixtures independent of live font downloads. Exact
source-palette checker findings remain recorded for Code Morph and Ring Text.

Glyph Anatomy and Outline Trace also package upstream's original Inter ExtraBold
TTF and its matching OFL notice. Both parse that TTF with opentype.js to build
glyph contours; the default `fontUrl` resolves to the installed frozen asset.
Source, controls and timing stay unchanged. The asset manifest records the exact
original URL, bytes and SHA256.

Their 171-frame lossless comparison passes full checks and strict rendering with
SSIM mean/minimum 1 and exact alpha. Outline Trace's 75 ordered RGBA hashes also
match exactly. Glyph Anatomy's standard capture differs in 7/96 frames, totaling
12 RGB pixels with maximum channel delta 1. A separate cold-browser diagnostic
differs in 5/96 frames, and its unchanged debug producer differs from the original
producer history in 4/96 frames. Glyph's independent exact RGBA gate remains
rejected. The [Glyph report](../parity/glyph-anatomy-diff/rgba-review.json) and
[Outline report](../parity/outline-trace-diff/rgba-review.json) retain the full
ordered hash files and measured residuals; the existing SSIM/alpha thresholds
and original standard-proof fingerprints are preserved.

All 326 public Remocn visual items are included. Snapcn's live public registry has
48 visual items, all included; private Pro-only source remains outside the public import.

Selection Snap's source easing overshoots its final padding at frames 22–27.
The resulting negative vertical padding is invalid CSS: the browser retains an
earlier style, so seeking directly from frame zero leaves a loose selection box
around the word. Its adapter caps only the padding progress at 1, keeping the box
tight on direct and backward seeks. The pinned source, easing, text, and badge
inputs remain unchanged. All 75 lossless frames pass with mean SSIM 0.994733,
minimum 0.980470, exact alpha, and zero full-check errors.

Spring Settle packages the same variable Geist font as the reference, preserving
both its semibold title and regular subtitle. A semibold-only file previously
made the subtitle heavier and wider. All 213 installed frames now pass with
SSIM 1.000000 at six-decimal precision and exact alpha, with zero full-check
errors. A decoded RGBA comparison finds 37 frames with differences of at most
one channel value, so this result is not a claim of pixel equality.

The source manifest is `assets/remocn-additions-2026-09-28/manifest.json`.
Reproduce the additions with:

```bash
export REMOCN_SOURCE=.work/remocn-audit-7b1e6dad
REMOCN_ASSET_MANIFEST=assets/remocn-additions-2026-09-28/manifest.json npm run setup:remocn-latest
node scripts/generate-text-ports.mjs --family text --only echo-stack,glyph-anatomy,outline-trace,path-ride,period-drop,selection-snap,stripe-type,type-repeater,ring-text,type-wall
node scripts/generate-text-ports.mjs --family core --only agent-run,bauhaus-build,keystroke,mondrian-split,speed-lines,squiggle,trim-burst,truchet-flip,code-morph
node scripts/verify-text-ports.mjs --lossless --only echo-stack,glyph-anatomy,outline-trace,path-ride,period-drop,selection-snap,stripe-type,type-repeater,ring-text,type-wall,agent-run,bauhaus-build,keystroke,mondrian-split,speed-lines,squiggle,trim-burst,truchet-flip
```

## Snapcn workflow

The original 47 pinned Snapcn visual components were verified across 6,569
frames, with frame-weighted mean SSIM 0.999827 and minimum 0.984636. Capture
Reveal adds 130 frames that match RGBA exactly and score SSIM 1. Together
with the 326 Remocn ports, the catalog now includes 374 upstream visual
components.

Forty Snapcn blocks pass the full HyperFrames check. Announce Title,
Answer Highlight, Follower Rush, Logo Drift, Prompt Zoom, Status Cycle, Word
Wheel, and Wordmark Cut retain narrowly reviewed findings from source contrast,
text layout, gradient text, or photo overlays. Their original appearance is
preserved; exact findings and reasons remain in the parity manifests and
`catalog/snapcn-check-exceptions.json`.

Snapcn has its own pinned inventory and fixtures under `catalog/snapcn-*.json`.
Its blocks use `snapcn-` names to preserve existing installations when names
overlap. Repository attribution and reference video paths flow from each parity
manifest into the website's badges, source filter, and comparison player.

```bash
npm run setup:snapcn
npm run generate:snapcn
npm run verify:snapcn
npm run build:catalog
npm run sync:registry
npm run sync:catalog
npm run check
npm run build
npm pack ./cli --dry-run
```

The setup and commands preserve each fixture's source pin, recorded in
`catalog/snapcn-fixtures.json`. The [Snapcn audit](SNAPCN_AUDIT.md) explains
which ports were refreshed and which retain earlier verified source pins.

For a focused edit, use `npm run generate:snapcn -- --only snapcn-text-reveal`
and `npm run verify:snapcn -- --only snapcn-text-reveal`. The verifier accepts `--reuse-reference` and `--resume`;
cached results must match the current fixture/source/artifact fingerprints.

Snapcn comparisons use every lossless frame at the upstream dimensions,
frame rate, duration, and defaults. RGB must reach at least 0.99 mean SSIM and
0.95 minimum frame SSIM; every alpha plane must match exactly. Verification
installs each block through the real CLI and renders the nested composition,
exercising paths and source initialization. Full HyperFrames check results,
per-frame alpha hashes, and a worst-frame comparison accompany each parity
manifest. The verifier uses one recorded Chromium executable for both engines.
Remotion uses `angle-egl` to match HyperFrames' hardware browser
compositing and `--video-frame-format png`.
Use PNG video extraction when rendering installed Snapcn video blocks to retain
this fidelity. Software compositing can change blur and image resampling.

Read [the Snapcn license audit](SNAPCN_AUDIT.md) before changing dependencies or
assets. Paper imports must resolve to the frozen Apache source, not the older
restricted npm archive. Run `npm run validate:snapcn` to verify the frozen
inventory, license texts, asset hashes, and installed copyright notices offline.

## Browser previews

The customizer resolves packaged images and fonts through each block manifest.
Verify the detail page as well as the saved render: a correct render does not
prove browser asset paths work. Browser video tests must use a server that
supports HTTP range requests, such as `vite preview`.

The 16 Remocn `html-in-canvas` blocks use the same capability check and browser
fallback as upstream. In standard Chrome, their detail pages show that fallback
and apply customized values. ASCII Render, Halftone Print, and Underwater Ripple
leave the scene unchanged in this mode, matching upstream. The comparison player
shows the full shader effect rendered with HTML-in-canvas enabled.

The frozen canvas demo environment includes upstream's Geist and Geist Mono
fonts, `cv11` and `ss01` features, text-rendering settings, and the preview
container's 14px font size and unitless `20 / 14` line height. Both the reference
and installed port must include them; a reference missing the same font or
inherited styles as a port can falsely verify a visible mismatch.

Lossless verification asserts that the source's HTML-in-canvas capability is
available. To verify its CSS fallback separately, run the same command with
`--browser-fallback` and browser executables that disable `CanvasDrawElement`.
This mode asserts that the capability is unavailable and writes its evidence
under `parity/remocn-browser-fallback/`, preserving canonical shader previews.
All 1,420 fallback frames pass the same thresholds with identical alpha.
TV Power Off's 62 fallback frames match exactly. Ember Burn and VHS Filter have
at most a one-level RGB difference in the 8-bit captures, with minimum SSIM of
0.999637 and 0.999999 respectively. Their source animation inputs match; these
fallbacks retain the recorded precision differences rather than claiming exact
pixel parity.

Official HyperFrames items without a verified browser fallback retain their
rendered default preview when HTML-in-canvas is unavailable.
