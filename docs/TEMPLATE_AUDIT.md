# Official template audit

Rechecked September 30, 2026 with HyperFrames 0.8.99 and Chrome Headless Shell
152.0.7977.42. The eight template manifests, declared sources/assets, and license
match all 38 corresponding paths in upstream commit
[`132b9909fa75617acac6c9c7ddfc63e5573b3a60`](https://github.com/heygen-com/hyperframes/commit/132b9909fa75617acac6c9c7ddfc63e5573b3a60).
The imported source pin remains unchanged.

Actual official CLI initialization of all eight examples produced the same HTML
and assets as Hyfrme's CLI installation. Decision Tree retains the documented
renderer label fallback; its real-GSAP value stays unchanged. No Hyfrme-specific
source regression was found.

## Current results

| Template      | Full check                  | Verified result                                                                                                                                              |
| ------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Decision Tree | Passes with warnings        | The selection border remains after deselection. The missing-target warning identifies a tween built before its target exists.                                |
| Kinetic Type  | Passes with warnings        | No confirmed defect. Transition overflow and negative-z-index warnings do not establish broken output.                                                       |
| NYT Graph     | Fails contrast              | The bottom of the June `4.2%` label crosses the revenue bar. Blue on paper passes contrast; the label's placement causes the failure.                        |
| Play Mode     | Blocked by one lint error   | CSS/GSAP transform conflict. Diagnostic snapshots retain the third statistic's rotation. A visual transform failure is not established.                      |
| Product Promo | Blocked by four lint errors | CSS/GSAP transform conflicts. Diagnostic snapshots retain the centered web frame. A visual transform failure is not established.                             |
| Swiss Grid    | Fails layout and contrast   | One default caption visibly clips its final glyph. Gold statistics measure 2.12:1 against off-white panels.                                                  |
| Vignelli      | Fails layout                | Caption bars obscure the large `STATIC CONTENT` label. The old optional caption-sidecar runtime errors no longer occur.                                      |
| Warm Grain    | Fails contrast              | White `62%` text on the ochre pill measures 2.77–2.86:1, below the 3:1 large-text threshold. No-video initialization also emits six missing-target warnings. |

Lint failures prevent runtime, layout, and contrast audits from running. Zero
counts in those sections for Play Mode and Product Promo are not passing results.
Their snapshots were captured separately for diagnosis, without changing source
or suppressing lint.

The four video scaffold templates were also checked with a supplied public video
from the official Kinetic Type example. The fixture used its intrinsic 14.722-second
duration and retained the official video/audio elements. It was not transcribed,
so the supplied default template captions remained the test inputs. The verified
Swiss Grid and Vignelli defects persist with video. Warm Grain's six missing-target
warnings disappear. Targeted sampling of its ochre statistic remains necessary:
five evenly spaced contrast samples can miss this short beat in a longer project.

Some automated findings need context. Swiss Grid also reports vertical overflow
from tight font metrics without visible glyph loss in two sampled captions. That
does not establish two additional caption defects. Entrance/exit contrast warnings
and intentional transition overflow were not promoted to confirmed defects.

## Evidence and reproduction

The [upstream report drafts](UPSTREAM_TEMPLATE_REPORTS.md) include expected versus
actual behavior, source links, commands, and the screenshots below. They have not
been submitted upstream.

Existing upstream reports are linked where relevant. The Decision Tree finding
is related to closed Flowchart issue #3261, and closed, unmerged Warm Grain PR
#2258 already proposed fixes. Current reproductions can support revisiting those
reports instead of opening duplicates.

- [Swiss Grid caption clipping](template-audit/2026-09-30/swiss-grid-caption.png)
- [Swiss Grid statistic contrast](template-audit/2026-09-30/swiss-grid-statistic.png)
- [Vignelli caption overlap](template-audit/2026-09-30/vignelli-overlap.png)
- [NYT Graph conversion label](template-audit/2026-09-30/nyt-graph-label.png)
- [Decision Tree retained selection](template-audit/2026-09-30/decision-tree-selection.png)
- [Warm Grain statistic contrast](template-audit/2026-09-30/warm-grain-statistic.png)

The earlier preview manifest records its original HyperFrames 0.8.30 checks and
renders. This audit supplements that historical evidence; it does not relabel
those media artifacts as 0.8.99 renders or claim passing port comparisons.
