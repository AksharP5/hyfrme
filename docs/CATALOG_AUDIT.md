# Catalog browser audit

Checked September 9, 2026 with Chrome Headless Shell 152.0.7977.42.
[Per-component results](../catalog/browser-audit.json) cover all 336 catalog
components: 297 Remocn and 39 Snapcn. Removed upstream components
`progress-steps` and `data-flow-pipes` are excluded.

| Check                               |  Coverage |
| ----------------------------------- | --------: |
| Preview starts and advances         | 336 / 336 |
| Live iframe previews                |       320 |
| Rendered default previews           |        16 |
| Pause and replay controls exercised |        55 |
| Browser frame comparisons           |       960 |
| Samples at or above 0.95 SSIM       | 959 / 960 |

The sampled SSIM mean is **0.997264**. The minimum is **0.928461** for
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

Additional browser checks cover visible autoplay errors, recovery through a
trusted Replay click, cached media failures on repeated page loads, and custom
relative image/video paths. Error messages reach the parent page without an
uncaught exception; corrected media requests load and advance.
