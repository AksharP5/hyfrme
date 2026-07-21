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
4. Compute SSIM and save the videos, summary, and frame strip.
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

The first 21-item typography/effect family is verified as exact compiled-source
ports. Each block preserves the upstream React component and editable controls,
uses Hyfrme-owned Remotion-compatible easing/interpolation behavior, and
re-renders from a HyperFrames-controlled frame clock. The runtime and Geist font
ship beside the HTML composition, so playback does not depend on a Remotion
installation or include Remotion runtime code.

- All 21 strict renders passed.
- Four representative motion structures passed full HyperFrames lint, runtime,
  layout, motion, and contrast checks with zero errors or warnings.
- Family mean SSIM: 0.997517.
- Per-item range: 0.986619–0.999432.
- Canonical fixtures cover 60–120 frames at 30 fps and 1280×720.
- `shimmer-sweep` uses the supported intentional-occlusion annotation for its
  stacked base/shine text. Its animated clipped gradient passes strict render
  and SSIM; HyperFrames 0.7.64 does not fingerprint `background-position` as
  geometry motion, so no full-check claim is made for that item.

Ten composition/data scenes are verified with the same compiled-source runtime:
`chat-to-preview-layout`, `data-flow-pipes`, `perspective-marquee`,
`live-code-compilation`, `infinite-bento-pan`, `infinite-marquee`,
`terminal-simulator`, `terminal-cursor-zoom`, `glass-code-block`, and
`glass-code-walk`.

- All ten strict renders passed.
- `data-flow-pipes` passed the full HyperFrames check with zero errors or
  warnings.
- Family mean SSIM: 0.988678.
- Per-item range: 0.952963–0.999109.
- Canonical fixtures cover 90–300 frames at 30 fps and 1280×720.
- The continuous text marquees are the lower-scoring members because subpixel
  text movement changes raster antialiasing; their exact scores remain above
  the 0.95 gate and are published per item.
- `terminal-simulator` preserves the upstream dim chrome title exactly. Its
  strict render passes at 0.998785 mean SSIM; no full-check claim is made
  because the source title color measures 3.6:1 contrast.
- The local-frame `Sequence` and `AbsoluteFill` adapters are also exercised by
  the three nested scenes. Their strict-render scores are 0.997342 for
  `terminal-cursor-zoom`, 0.997430 for `glass-code-block`, and 0.994836 for
  `glass-code-walk`.

Five direct UI primitives are verified: `caret`, `skeleton-block`, `spinner`,
`typing-indicator`, and `typewriter`.

- All five strict renders passed.
- `caret`, `spinner`, `typing-indicator`, and `typewriter` passed full
  HyperFrames checks with zero errors or warnings.
- Family mean SSIM: 0.999486.
- Per-item range: 0.997724–0.999995.
- Canonical fixtures cover 90–120 frames at 30 fps and 1280×720.
- `skeleton-block` preserves an animated gradient sweep and passes strict render
  plus SSIM. HyperFrames 0.7.64 does not fingerprint `background-position` as
  geometry motion, so no full-check claim is made for it.

The next bench candidates deliberately widen coverage:

- `number-wheel`: data-driven numbers and custom easing.
- `rolling-number`: place-value motion and bundled monospace typography.
- `focus-pull`: paired-scene transition semantics.
- `button`: shared UI dependency and lifecycle states.

## Rollout order

1. Typography and simple effects.
2. Number and data components.
3. UI primitives and flows.
4. Transitions.
5. Native shader rewrites.
6. Social components with documented state/runtime gaps.

Upstream changes should open a review issue; they must never overwrite a
passing port automatically.
