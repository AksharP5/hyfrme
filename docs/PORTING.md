# Upstream to HyperFrames porting contract

## What 1:1 means

A port must reproduce every decoded RGBA frame of its pinned upstream fixture,
including RGB values in transparent pixels. Matching dimensions, timing, inputs,
fonts, media, and browser rendering is part of the fixture. SSIM is retained for
diagnosis; a high rounded score cannot substitute for pixel equality.

Each parity manifest records source attribution, the exact source commit,
fixture inputs, installed-file hashes, full HyperFrames check results, per-frame
hashes, and comparison artifacts. The website, registry, CLI, and installed
variables share their metadata. Users own the installed source, with no Hyfrme
runtime dependency.

The comparison player uses synchronized encoded previews of the verified
frames. Encoder differences are separate from the lossless port proof.

## Coverage and source pins

The Remocn authored registry supplies 326 visual items: 100 icons, 59 typography
and effect blocks, 121 composition and data blocks, and 46 UI primitives and
flows. The six shared libraries are dependencies rather than separate catalog
blocks. Inventory follows the authored family registries referenced by
`registry.json`, including published items absent from its generated root list.
Unpublished source experiments are excluded.

All Remocn fixtures use `8ae853e4c08108105684d4b8cac7f22400840d2a`.
Asset manifests retain the commits where those assets were originally frozen;
asset provenance does not choose the composition source checkout.

The 47 existing public Snapcn visual fixtures use
`def45f50ff9b7ee7353be0a0bbf636c84b311cc0`. Capture Reveal uses
`f31be8a493cd836bbef36ac4f5a182fc40ee983e`, bringing the public inventory to
48 visual components. Closed Pro items are excluded.
Snapcn blocks keep the `snapcn-` prefix where source names overlap.

Official HyperFrames items are imported source files, with source hashes and
upstream navigation order recorded in `catalog/hyperframes-upstream.json` and
`catalog/hyperframes-navigation.json`. Their import contract is described in
[the official catalog notes](HYPERFRAMES_CATALOG.md).

The 41 T3 Code blocks reproduce pinned official v0.0.42 interactions in dark and
light themes. Their synthetic workspace, captured application build, source DOM,
and native recordings are explicit fixtures. Default native-image modes and
customized source-DOM modes have separate verification boundaries. See
[the T3 development workflow](DEVELOPMENT.md#t3-code-ports).

The six existing Collections films have separate fixtures in
`catalog/showcase-fixtures.json`; they are not installable component blocks.
Their source pin is `bcccd3d3350320f12056fdb6e0f0d005f80fbd84`.

These six films have not yet been reverified under the full identical-RGBA
contract. The previous full Next.js audit found SVG edge differences; the
current compositions still need full-frame verification. Lifecycle diagnostics
do not establish complete equality, and earlier published results remain
historical evidence rather than current full parity proof.

A private ancestor-style diagnostic matched eight frames twice, but equivalent
authored CSS failed the larger canonical repeat check and was reverted. These
diagnostics do not justify promoting any media or proof metadata.

The shim retains upstream shader `delayRender` gates, including later scene
mounts. Their two nested mount-paint callbacks use the renderer's saved native
`requestAnimationFrame`, the same function used by its readiness stub. Animation
continues on HyperFrames' virtual clock. The public `hf-seek` completion barrier
waits for source handles and newly mounted image decoding before capture.

Using virtual rAF for these paint-only callbacks deadlocks under pinned
HyperFrames 0.8.99: a seek flushes one queued generation, then capture waits for
completion before another seek can release the nested callback. The scoped
paint adapter avoids that cycle without patching the SDK or advancing animation
time. Its CPU readiness regression passes; full exact rendered proofs are still
required before the affected ports and films can be promoted.

Frame-driven Paper sources already use library speed zero and explicit frame
time. The emitted adapter removes the unused autonomous clock and rejects
nonzero library speed while preserving frame uniforms, GL draws, and resize
redraws. It accepts only the exact pinned Paper 0.0.76 module bytes. Shader
strings use escaped string literals with identical contents so multiline GLSL
does not inflate the installed HTML's line count. Strict checks stay enabled.

`node scripts/verify-showcase-lossless.mjs --only introducing-nextjs` verifies
Collections films. Each film must pass a full HyperFrames CLI check and a
complete strict sequential CLI PNG render of the copied standalone project.
The sequential render is archived separately and is not labelled pixel-exact.

The exact frame proof uses native Remotion `renderStill` with a fresh page for
each frame and the production HyperFrames producer API with a fresh capture
session/page for each frame. The producer serves the actual CLI debug compiler
output and its materialized assets, with the unchanged CLI virtual-time shim,
through the same runtime and render-seek bridge used by the CLI. Dimensions,
frame rate, original composition duration, inputs, fonts, assets and browser
profile remain identical. Every decoded RGBA hash must match and every RGB SSIM
score must be 1 before media or proof metadata is promoted.

This capture lifecycle avoids measured native sequential raster history:
unchanged source captures differed on SVG boundary rows despite identical
DOM attributes, computed styles, geometry and loaded fonts. An earlier
eight-frame diagnostic matched the production producer; later full-frame
verification found the differences described above. Proofs record
the capture lifecycle, actual browser PIDs, tool and runtime hashes, browser binary and
wrapper hashes, served HTML hash, and complete frame coverage. Requesting the
producer browser pool does not imply reuse: releasing its last lease closes the
browser, and the observed browser count is recorded.
Resume requires complete passing check/capture results, every ordered RGBA
frame hash, SSIM 1, and unchanged input and artifact fingerprints.

For Remocn fixtures, `node scripts/verify-remocn-fresh.mjs --only <slug>` keeps
the mandatory full check and strict sequential render. The optional
`--cold-reference-browser` opens a native browser per frame and requires an
independent producer browser per frame. It preserves source inputs, clocks,
fonts, geometry, browser arguments and screenshot parameters. The capture
profile and helper hashes bind this lifecycle to the proof fingerprint.

The actual CLI debug render must match the preserved mandatory sequential
producer's ordered RGBA hashes. A changed native reference cannot establish
a change in producer history. Proofs separately disclose the original
reference versus original producer and fresh reference versus debug producer
mismatch lists, including any failed original sequential result.

Standard Remocn/Snapcn verification and the Remocn fresh verifier record the
requested GPU mode separately from each CLI stage's logged GPU probe. Hardware
requests require a successful hardware probe; the first output and log remain
retained if that precondition fails. Render, snapshot and debug logs are hashed
with their artifacts. The probe uses a separate browser, so the actual capture
backend remains unobserved.

Authored Remocn icon previews can use the same full fresh proof with
`node scripts/verify-icon-ports.mjs --icon-showcase --cold-reference-browser --only <slug>`.
This selects the separate 384-pixel showcase fixture and preserves its failed
history before capturing a new current baseline. Canonical 48-pixel icon proofs
continue through the existing sequential verifier.

Glyph Anatomy and Outline Trace package the original upstream Inter ExtraBold
TTF and its matching OFL notice. Their default contour font resolves to the
installed local asset; the frozen manifest records its original URL and SHA256.

Animated Bar Chart uses the requested frame as its React key so each new frame
mounts the source SVG subtree with its correct individual scale. Its full fresh
proof retains the actual strict CLI sequence and any sequential residuals.

## Verification

1. Confirm that the reference checkout is pristine at the fixture's source pin.
2. Render that source into lossless PNG frames with frozen fonts and media.
3. Install the block through the published CLI, then run the full HyperFrames
   check and a strict PNG render at the same dimensions, frame rate, and duration.
4. Require complete, identical decoded RGBA frame hashes and SSIM 1.
5. Save the check findings, file hashes, previews, thumbnail, and worst-frame
   comparison in the parity record.
6. Synchronize generated catalog and registry files, then run the repository
   checks, build, and CLI package dry run.

Saved proofs cannot validate modified source, runtime, fonts, or manifests.
`--resume` reuses only matching verification fingerprints and intact artifacts;
`--reuse-reference` reuses unchanged upstream frames.

Some authored overlays, gradients, clipped text, and source palettes trigger
inspector findings. Reviewed findings have exact source pins, selectors, and
reasons in `catalog/remocn-check-exceptions.json` or
`catalog/snapcn-check-exceptions.json`. The full findings remain in the proof.
These are checker findings, not evidence that upstream needs a bug report.
Unreviewed errors fail verification, and reviewed findings do not relax pixel
comparison.

iMessage and Telegram keep their pinned chat palettes. Their reviewed contrast
findings match the exact text, selector, foreground, background, and installed
source file. These exceptions cover the source placeholder, message, status,
date, timestamp, and reaction styles; they do not establish a passing render
proof.

Paper transitions retain their authored shader coverage of Scene A. Reviewed
findings identify the exact covered text and canvas. Perlin Dissolve also keeps
its source title color and shader palette. These scoped findings remain in the
check logs; all frames still require exact RGBA and SSIM 1.

Shader Seam annotates the text covered by its incoming transition canvas only
while that canvas is visible. The layout checker requires the allowance on each
text owner; it does not inherit the annotation from a parent.
Chat to Preview Layout marks the user bubbles clipped by its fixed-width chat
column. Its two pinned source contrast findings remain in the full check log.
Terminal Simulator and Terminal Cursor Zoom preserve their upstream title color,
`#71717a` on `#1a1a1a`. Their reviewed contrast findings include exact sample
times and remain visible in the check logs.
OpenCode preserves its upstream muted `#6B6B6B` labels on `#161616` and black.
The sixteen reviewed contrast findings retain their exact labels and sample times.
Number Wheel marks only its mapped digit spans as intentionally clipped and
layered inside each single-cell viewport. These annotations do not change styles.
GitHub Stars marks its scrolling login, date, and row number where the authored
fade masks cover them. Its odometer retains the original DOM and uses the same
digit annotations as Number Wheel.

Glass Code Block and Glass Code Walk include their configured upstream image
backdrop. Their fixtures record `previewBackdrop`, and both renderers use the
upstream Backdrop wrapper with zero padding, radius, and shadow. The installed
image is the pinned repository's `public/bg.jpg`; its bytes are included in
reference fingerprints and installed-file verification.
Backdrop also packages the pinned `public/hero.png` used by its image control,
even though the default gradient does not display that image.

Escape angle brackets in HTML metadata attributes. The installer must preserve
the decoded variable values, including Matrix Decode's literal `<>` charset and
Claude Code's `<filepath>` placeholder.

Social ports preserve upstream image-error fallbacks and the original X avatar
and cover defaults. Installer asset aliases resolve those URLs to packaged files.
`assets/social/manifest.json` dates and hashes the original GitHub avatar responses,
the default Remocn repository avatar, and the three chat demos' shared contact image.
Chat image aliases apply only to the original contact URL. These snapshots are separate
from the code commit; they do not inherit the repository's code license. Both
renderers use the same frozen bytes. The default repository avatar alias applies
only to its original URL; custom owners and URLs retain upstream behavior.

Use the authored preview or docs scene when upstream presents a component in a
demo wrapper. Caret and Skeleton Block use their registry previews; Typing
Indicator uses its docs scene and its published three controls. Agent Run keeps
its literal Geist and Geist Mono fallback faces with the same frozen font bytes
as the native fixture.
Field has no authored upstream preview. Its checked-in local demo renders the
unchanged upstream primitives in both reference and port; it is not an upstream
demo scene.

Nested Remocn sequences expose their local frame and remaining duration, clipped
by the parent sequence, and inherit its dimensions. Their default wrapper uses
the upstream full-size flex layout. `npm run test:remocn-sequence` checks these
contracts against values captured from Remotion 4.0.513. Changes to this adapter
require fresh proofs for direct and transitive Sequence consumers.

The shared frame math preserves the pinned source's floating-point evaluation
order: sampled Bézier inversion and spring position/velocity updates at each
frame timestamp. Algebraically equivalent formulas can change rasterized edge
pixels. `npm run test:frame-math` includes exact reference values for these cases;
any shared math change requires fresh proofs for the affected ports.

## Remocn workflow

`npm run setup:remocn-latest` prepares the inventory's current source pin and its
isolated reference dependencies. Set `REMOCN_SOURCE` to that checkout for
subsequent commands. The reference requires Remotion 4.0.513.
The reference explicitly honors the pinned `react-jsx` compiler setting. This
prevents TypeScript 7's missing CommonJS `sys` API from silently selecting classic
JSX and failing on source modules that import only React types.

```bash
export REMOCN_SOURCE=.work/remocn-8ae853e4c08108105684d4b8cac7f22400840d2a
npm run setup:remocn-latest
node scripts/generate-text-ports.mjs --only tv-power-off,soft-blur-in,selection-snap
node scripts/verify-text-ports.mjs --lossless --only tv-power-off,soft-blur-in,selection-snap
node scripts/generate-icon-ports.mjs
node scripts/verify-text-ports.mjs --lossless --only icon-inbox
node scripts/verify-text-ports.mjs --lossless --icon-showcase --only icon-inbox
```

Icons have independent 48px canonical and 384px website proofs. The 384px fixture
uses native 384px source props and canvas at render scale 1. Scaling the 48px
canvas would also scale CSS translations and is not equivalent.
These fixtures are not the upstream gallery's 80px player, which centers a
48px glyph and inherits the gallery's state-dependent foreground color.

Icon packages preserve the full Remocn MIT banner and include the original
`@remotion/paths` MIT notice, Lucide ISC and Feather MIT notice for the derived
paths, and the Bézier implementation's MIT attribution. The package metadata
lists `@remotion/paths` as bundled code; it does not claim a Lucide runtime.

Compiled ports preserve the upstream component and control values, using
the shared easing and frame math driven by the HyperFrames clock. They do not
bundle a Remotion runtime. Soft Blur In uses the same compiled-source path.
Selection Snap reconstructs the last valid upstream padding when its spring
overshoots into invalid CSS, so direct and reverse seeks match sequential
playback without changing its easing.

Fonts must match source bytes, face descriptors, weights, and inherited styles.
The shared source environment includes variable Geist, `cv11` and `ss01`, a 14px
font size, and a unitless `20 / 14` line height. Google fonts are frozen in
`assets/remocn-fonts/manifest.json`; template fonts, photographs, original CSS,
and licenses remain in their attributed asset manifests. Images decode before
playback and after newly mounted scene changes. Release Teaser retains its
`60000/1001` frame rate through rendering and encoding.

Legacy Remocn Paper shader ports retain their recorded mixed license and the
complete installed PolyForm Shield terms. Preserve those notices when updating
an existing port.

## Snapcn workflow

```bash
npm run setup:snapcn
npm run generate:snapcn
npm run verify:snapcn -- --resume
```

For one block, pass `-- --only snapcn-screen-recording`. Source grouping follows
fixture commits. Shared preview CSS retains its separately recorded published
pin; the source audit also checks that those CSS bytes match current main.

The verifier uses the same recorded Chromium executable for both engines,
`angle-egl`, and PNG video extraction. Full-canvas snapshots preserve source
output extending beyond the composition's layout box. Video opacity and filters
stay on an outer DOM layer so extraction cannot round their computed values.

Read [the Snapcn source and license audit](SNAPCN_AUDIT.md) before changing
assets or dependencies. Paper imports resolve to the frozen Apache source;
new Snapcn blocks must not bundle the restricted npm archive. Run
`npm run validate:snapcn` for the offline asset, source, and license audit.

## Browser previews

Verify the detail page as well as the exported frames. Packaged fonts and images
resolve through the block manifest. Video checks require a server supporting
HTTP range requests, such as `vite preview`.

The 16 Remocn HTML-in-canvas effects preserve upstream's capability check and
browser fallback. The reference asserts which path is active. Verify fallback
separately with `--browser-fallback` and a Chromium wrapper that disables
`CanvasDrawElement`. Those proofs live in `parity/remocn-browser-fallback/` and
use the same exact RGBA requirement without replacing canonical shader previews.
ASCII Render, Halftone Print, and Underwater Ripple leave the scene unchanged
when that capability is unavailable, matching upstream.

Official HyperFrames items without a verified browser fallback retain their
rendered default preview when HTML-in-canvas is unavailable.

## Catalog update

```bash
npm run build:catalog
npm run sync:registry
npm run sync:catalog
npm run check
npm run build
npm pack ./cli --dry-run
```

Run `node scripts/audit-catalog-source-parity.mjs` to compare current public
inventories, source inputs, defaults, media hashes, native payloads, and grouping.
This source audit complements the render proofs; it does not establish visual
parity on its own.
