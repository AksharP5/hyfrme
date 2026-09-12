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
  deterministic HyperFrames frame clock. Their mean SSIM is 0.990547, with a
  0.967230–0.997402 range. Security Cam and VHS use lossless PNG comparisons
  because their full-frame noise is distorted differently by independent
  H.264 encoders.

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
and compares every PNG frame. Remotion uses `angle-egl` to match the hardware
HyperFrames renderer; software canvas downsampling changes alpha edges. Each component must reach 0.99 mean and 0.95
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

## Snapcn workflow

All 39 pinned Snapcn visual components are verified across 5,744 frames. The
frame-weighted mean SSIM is 0.998594; every component averages at least 0.990681,
and the lowest individual frame scores 0.957827. Together with the 307 Remocn
ports, the catalog contains 346 components.

Thirty-three Snapcn blocks pass the full HyperFrames check. Answer Highlight,
Announce Title, Logo Drift, Follower Rush, Roster Grant, and Wordmark Cut retain narrowly reviewed findings
from the source's contrast choices, gradient text, or photo overlays. Their
original appearance is preserved; exact findings and reasons remain in the
parity manifests and `catalog/snapcn-check-exceptions.json`.

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

The setup and commands preserve each fixture's source pin. The original 37 use
`353803b506dba0cb7ca13bb45b0d099690400815`; Roster Grant and Wordmark Cut use
`bc5b59f3f0fad9657b338fa62349a55fa33f160f`.

For a focused edit, use `npm run generate:snapcn -- --only snapcn-text-reveal`
and `npm run verify:snapcn -- --only snapcn-text-reveal`. The verifier accepts `--reuse-reference` and `--resume`;
cached results must match the current fixture/source/artifact fingerprints.

Snapcn comparisons use every lossless frame at the upstream dimensions,
frame rate, duration, and defaults. RGB must reach at least 0.99 mean SSIM and
0.95 minimum frame SSIM; every alpha plane must match exactly. Verification
installs each block through the real CLI and renders the nested composition,
exercising paths and source initialization. Full HyperFrames check results,
per-frame alpha hashes, and a worst-frame comparison accompany each parity
manifest. The verifier uses one recorded Chromium executable for
both engines, hardware browser compositing, and `--video-frame-format png`.
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

The 16 `html-in-canvas` blocks require browser capture APIs unavailable in
standard Chrome. When these APIs are absent, the detail page plays the verified
HyperFrames render and labels it as default settings. Customized values still
appear in the install command, but cannot be previewed live in that browser.
