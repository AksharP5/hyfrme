# Catalog browser audit

Checked September 9, 2026 with Chrome Headless Shell 152.0.7977.42.
[Per-component results](../catalog/browser-audit.json) cover all 341 catalog
components: 302 Remocn and 39 Snapcn. Removed upstream components
`progress-steps` and `data-flow-pipes` are excluded.

| Check                               |  Coverage |
| ----------------------------------- | --------: |
| Preview starts and advances         | 341 / 341 |
| Live iframe previews                |       325 |
| Rendered default previews           |        16 |
| Pause and replay controls exercised |        60 |
| Customization and reset exercised   |         5 |
| Three-sample frame comparisons      |       975 |
| Samples at or above 0.95 SSIM       | 974 / 975 |
| Transition-boundary comparisons     |        16 |
| Backwards seeks                     |        14 |

The sampled SSIM mean is **0.997306**. The minimum is **0.928461** for
`icon-inbox`, frame 35. Different reference formats and normalization make the
aggregate mean descriptive; it is not an additional port acceptance threshold.
Full-frame port verification remains recorded in each `parity/<slug>.json`.

## What was checked

Every live preview was opened through its catalog component page and observed
advancing. Remocn checks captured page errors, failed requests and, where recorded,
image readiness. The 39 Snapcn checks also covered console and HTTP errors, image
and media readiness, pause and replay. Recorded error and broken-image counts
were zero. Omitted result fields mean unmeasured.

Frames were captured at canonical fixture dimensions after removing website
scaling and color filters. Most Remocn comparisons used frames decoded from the
pinned upstream reference video. The 100 icons explicitly used their pinned
384px showcase size and white background. Four shader transitions used pinned
upstream PNGs rendered in the same browser to control for GPU implementation
differences. Shader Color Panels was checked with hardware WebGL.

The five additions at `e3dc260ff1965440d1f64fb65a8c9a9373e78328` use pinned
lossless reference PNGs and NVIDIA ANGLE WebGL. All 15 samples and 16 additional
transition-boundary comparisons score **1.0 SSIM**. Both transitions also pass
seven backwards seeks. Each component's autoplay, Pause, Replay, customization,
and Reset were exercised at website size. Customization changes pixels; Reset
restores the identical default image.

Snapcn comparisons used pinned upstream lossless PNGs, with transparency
composited over the actual preview background. Playback controls were checked
at website size before resizing for comparison. The 117 Snapcn samples all
exceeded 0.95 SSIM: mean **0.997297**, minimum **0.967479**.

## Limits

Three sampled frames cannot establish full-duration parity. The existing
`icon-inbox` 384px showcase has full-frame mean SSIM **0.970517** and minimum
**0.811321**; its installed 48px fixture has mean **0.994187**. The browser result
preserves the observed mismatch instead of treating every sample as passing.

The 16 components requiring HTML-in-canvas display their verified default
HyperFrames render in ordinary Chrome. The audit checked playback, pausing,
resumption through Replay, and the default-settings notice. It does not claim
live customization or new browser SSIM measurements for these fallbacks.

The five newest checks used a local production preview server. Its Vercel
analytics and speed-insights endpoints return 404 because those routes require
Vercel hosting. These responses and navigation-cancelled requests are recorded
separately from component errors.

## Repairs verified during this audit

- Corrected packaged image paths in Reel and four social components, plus
  mislabeled fonts in affected chat and social blocks. The eight repaired
  Remocn ports pass 1,525 full-frame comparisons and exact alpha.
- Added lossless video color metadata for three Snapcn blocks. All 1,200 decoded
  source-video RGB frames remain unchanged, and native browser colors now match
  the reference. All 39 Snapcn previews pass the browser checks above.
- Preserved Stage's custom image control across the updated source pin. Its 300
  default frames pass SSIM and exact alpha, and custom images work in the browser
  and an actual CLI installation.
- Corrected showcase fonts and a one-frame clock error, and removed shadcn's
  unavailable avatar request while preserving its initials fallback. All six
  films pass the full HyperFrames check and 7,058 frame comparisons.
- The five newest Remocn ports pass the full HyperFrames check with all 594 RGB
  frames and alpha channels exactly matching their pinned references.

Additional browser checks cover visible autoplay errors, recovery through a
trusted Replay click, cached media failures on repeated page loads, and custom
relative image/video paths. Error messages reach the parent page without an
uncaught exception; corrected media requests load and advance.
URL customizations now initialize before the preview mounts. Ten consecutive
cached loads preserved the requested media URL in both the controls and the
loaded iframe, fixing an intermittent fallback to default media.

All four new shader previews were also checked with WebGL2 unavailable. Early
and delayed initialization failures display an error and pause playback. Play
and Replay preserve early errors; retries of delayed failures pause again without
an error loop. Two installed Shader Text Reveal instances retain independent
variables and return to identical frames after seeking backwards.
