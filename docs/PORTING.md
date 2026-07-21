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
deterministic DOM runtime driven by the HyperFrames GSAP clock. Each block is a
standalone HTML composition with no React dependency at playback time.

- All 100 strict renders passed.
- Five representative icons passed full HyperFrames lint, runtime, layout, and
  motion checks with zero errors or warnings.
- Family mean SSIM: 0.993872.
- Per-item range: 0.985560–0.998621.
- Canonical icon fixtures cover 60–90 frames at 30 fps.

The next bench candidates deliberately widen coverage:

- `number-wheel`: data-driven numbers and custom easing.
- `terminal-simulator`: longer deterministic step timing and text reveal.
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
