# Official template audit

## October 15 refresh

All eight templates were rendered again from
`c694785df5993191fec42ec84e9d65ea69f98ad8` with released HyperFrames 0.8.159
and Chrome 152.0.7977.42. Their 3,000 rendered frames, dimensions, fps, duration,
installed-source hashes, and artifact hashes pass verification. Forty sampled
frames were inspected for scene mounting and visual completion.
The current evidence is in
[`catalog/hyperframes-template-previews.json`](../catalog/hyperframes-template-previews.json).

Decision Tree and Kinetic Type pass the full check with warnings. NYT Graph
retains a contrast finding. Play Mode retains one CSS/GSAP transform conflict;
its lint failure skips the browser audits. Product Promo's upstream transform
fixes now pass lint, exposing seven contrast findings in the full check.
Swiss Grid retains three automated clipping findings and one contrast finding;
Vignelli retains a text overlap; Warm Grain retains two contrast findings.
Successful rendering does not mark those checks as passing or establish that
every automated finding is a visible defect.

The source changes to four video scaffolds keep sound with their video instead
of a separate audio element. Their no-video preview fixtures still remove the
placeholder media. Decision Tree's unchanged source was remeasured with real
GSAP 3.14.2: `hold5` remains 6.25 seconds. Its compatibility fallback is now
guarded by the source hash rather than an unrelated repository commit.

## September 30 audit

Rechecked September 30, 2026 with HyperFrames 0.8.99 and Chrome Headless Shell
152.0.7977.42. The eight template manifests, declared sources/assets, and license
match all 38 corresponding paths in upstream commit
[`132b9909fa75617acac6c9c7ddfc63e5573b3a60`](https://github.com/heygen-com/hyperframes/commit/132b9909fa75617acac6c9c7ddfc63e5573b3a60).
The imported source pin remains unchanged.

Actual official CLI initialization of all eight examples produced the same HTML
and assets as Hyfrme's CLI installation. Decision Tree retains the documented
renderer label fallback; its real-GSAP value stays unchanged. No Hyfrme-specific
source regression was found.

### September 30 results

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

The preview manifest before the October 15 refresh recorded the original
HyperFrames 0.8.30 checks and renders. The September audit supplemented that
historical evidence without relabeling those artifacts as 0.8.99 renders or
claiming passing port comparisons.
