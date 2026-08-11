# Remocn to HyperFrames porting contract

## Product shape

Hyfrme is HyperFrames-first. Remocn appears as the attributed source reference
and in the comparison lab; it is not the project's identity. Catalog cards and
component pages lead with the HyperFrames render, controls, source, and install
path.

The comparison lab uses pre-rendered, synchronized MP4s rather than loading both
framework runtimes in the browser. Both renders come from the same canonical
fixture.

## What “1:1” means

Every port has a parity manifest containing:

1. The pinned Remocn commit and source path.
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
2. Render Remocn at the pinned commit with PNG frames and a fixed color path.
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

All 83 composition/data items are verified with the same
compiled-source runtime.

- All 83 strict renders passed.
- Family mean SSIM: 0.994234.
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
- A previous upstream update added `slide-swap` and `spring-settle`, plus the
  internal `scene-motion` helper used directly by `spring-settle`. Both public
  blocks pass the full HyperFrames check. Their mean SSIM scores are 0.997717
  and 0.998177 across 210 and 213 canonical frames respectively.
- Number wheels, intentional overlay scenes, and static backdrops retain
  strict-render-only claims where the full checker reports known heuristic
  false positives. Per-item manifests state the exact result.
- A previous pin added five WebGL transitions, ten continuous canvas filters,
  and TV Power Off. All 16 use Remocn's `canvas-presentation` helper through a
  deterministic HyperFrames frame clock. Their mean SSIM is 0.990547, with a
  0.967230–0.997402 range. Security Cam and VHS use lossless PNG comparisons
  because their full-frame noise is distorted differently by independent
  H.264 encoders.

All 45 UI primitives and flows are verified.

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

The pinned visual inventory at Remocn
`0797bfe319bd2dae06eea5a9f67591e1b31392e5` is complete: 269/269 ports have
passing parity manifests. The six non-visual upstream entries—`brush`,
`canvas-presentation`, `icons-core`, `remocn-ui`, `scene-motion`, and
`stop-motion`—are shared runtime helpers rather than catalog blocks.

The current pin removes `data-flow-pipes` and `progress-steps` after Remocn
withdrew both broken components from its public registry. Hyfrme removes their
catalog entries, installer files, previews, and parity manifests as well.

Hyfrme mirrors Remocn's minimum speed of 1 for the 11 progress-driven scenes
whose payoff depends on reaching the final frame. The maximum remains 4 and the
step remains 0.25 in the website customizer, installed metadata, and CLI.

Upstream changes should open a review issue; they must never overwrite a
passing port automatically.
