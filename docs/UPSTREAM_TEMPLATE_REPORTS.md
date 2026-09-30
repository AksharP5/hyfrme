# Upstream template report drafts

These are local drafts. None has been filed. See the [audit scope and current results](TEMPLATE_AUDIT.md). Verification used npm HyperFrames 0.8.99, Chrome 152, and canonical registry source identical to upstream commit `132b9909fa75617acac6c9c7ddfc63e5573b3a60`. Video scaffold fixtures follow the official no-video initialization, including duration 10 and removal of placeholder video/audio tags. Findings below come from current check reports plus visual inspection, not just older automated results.

Suggested upstream scaffold command, replacing `<example>` and `<repro>` with the relevant name:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes@0.8.99 init <repro> --example <example> --non-interactive
cd <repro>
npx hyperframes@0.8.99 check --snapshots --json
```

## Swiss Grid clips a default caption and its gold statistics fail contrast

Example: `swiss-grid`.

At 3.889 seconds, the default line `MOTION GRAPHICS, SIXTY-TWO PERCENT SAID` clips the right edge of its final `D`. Its measured text width exceeds 1600px by 16px. The template groups five words, renders them uppercase at 72px, and caps the nonwrapping text box at 1600px with hidden overflow.

The default gold statistics also measure 2.12:1 against their off-white panels, below the 3:1 large-text threshold. This follows directly from source colors `#d4a017` and `#f2f2f2`.

Expected: the supplied caption fits without losing glyphs, and the large statistics meet the checker's stated contrast threshold. Consider grouping by measured width or allowing the caption to fit, and adjusting the statistic color. The other 7px vertical caption findings do not visibly cut uppercase glyphs and should not be treated as additional demonstrated clipping defects.

Sources: [caption constraints](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/swiss-grid/compositions/captions.html#L40-L49), [grouping](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/swiss-grid/compositions/captions.html#L113-L144), [panel and statistic colors](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/swiss-grid/compositions/graphics.html#L53-L85).

Evidence: [caption clipping](template-audit/2026-09-30/swiss-grid-caption.png), [statistic contrast](template-audit/2026-09-30/swiss-grid-statistic.png).

## Vignelli captions obscure the full-canvas statistic label

Example: `vignelli`.

Around 4.75 and 6.5 seconds, the caption bar crosses `CONTENT` in the full-canvas `STATIC CONTENT` label. The checker observes each collision for 625 ms. The crop visibly shows the white caption background and black caption text covering the statistic label.

Expected: captions and the large statistic label occupy separate zones. The captions remain at `bottom:672px` for the whole film, with z-index 30 above the statistic overlay's 20. The full-canvas statistic occupies that same vertical zone from 3.799 to 7.299 seconds. Move the caption zone during this shot or reserve space in the statistic layout.

Sources: [caption placement](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/vignelli/compositions/captions.html#L28-L54), [statistic label](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/vignelli/compositions/overlays.html#L133-L155), [stacking order](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/vignelli/index.html#L76-L82).

Evidence: [caption collision](template-audit/2026-09-30/vignelli-overlap.png). The old optional `caption-overrides.json` request errors are already fixed in 0.8.99 and are unrelated to this report.

## NYT Graph's June conversion label overlaps the revenue bar

Example: `nyt-graph`.

After the labels appear, the bottom of the June `4.2%` label lies over the grey `$22K` bar. Current checks at 10.833 and 14.167 seconds report 4.16:1 contrast against the mixed paper/bar background, below 4.5:1 for this small text. The finding crop confirms the overlap.

The geometry explains it. June revenue 22 at max 25 gives a bar top of 160. Conversion 4.2 at max 5 gives a line point at 180. Its label baseline is placed 15px above that point, at 165, still below the bar top. The blue label color passes 5.02:1 on paper but has 1.27:1 contrast on the grey bar.

Expected: the conversion label remains clear of the revenue bar. Position labels using both plotted series or add a readable background; changing the blue alone would miss the placement cause.

Sources: [values and scales](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/nyt-graph/compositions/nyt-chart.html#L190-L209), [conversion label position](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/nyt-graph/compositions/nyt-chart.html#L266-L272).

Evidence: [June conversion label](template-audit/2026-09-30/nyt-graph-label.png).

## Decision Tree resolves the selection-border tween before creating its target

Example: `decision-tree`.

Initializing the timeline emits `GSAP target  not found. https://gsap.com`. After the cursor clicks away, the Python node still has its blue selection border. The 9.4-second snapshot shows the corrected Python text, thumbs-up, and retained selection outline together.

The border is appended by a later timeline callback, but the deselection tween resolves `.selection-border` during initial timeline construction, when that element does not exist. The tween therefore has no target to fade.

Related upstream [issue #3261](https://github.com/heygen-com/hyperframes/issues/3261) is closed and describes the same lifecycle problem in the Flowchart block variants. This Decision Tree example reproduction adds current evidence to that report; avoid opening a duplicate general selection-border issue.

Expected: the border disappears on deselection and initialization produces no missing-target warning. Create the border before constructing its tweens, or resolve and apply the deselection in the timed callback.

Sources: [border creation](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/decision-tree/compositions/decision_tree.html#L349-L359), [deselection tween](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/decision-tree/compositions/decision_tree.html#L408-L418).

Evidence: [selection still visible at 9.4 seconds](template-audit/2026-09-30/decision-tree-selection.png).

## Warm Grain's ochre statistic fails large-text contrast

Example: `warm-grain`.

The white `62%` statistic on its ochre pill fails the current large-text contrast check at 5 and 7.222 seconds. Measured ratios are 2.77:1 and 2.86:1, below 3:1. The unchanged source pair white/`#cc8832` is 2.943:1 before texture effects, so the failure does not depend on missing video media.

An earlier [fix PR #2258](https://github.com/heygen-com/hyperframes/pull/2258) covered contrast and no-video warnings. Upstream closed it without merging during a backlog review and asked for current reproduction evidence before reconsidering priority. This packet supplies that evidence; reference the existing PR rather than treating the finding as previously unknown.

Expected: the large statistic meets 3:1 against the composited pill background. Adjust the pill/text colors with the grain layer included. The intro subtitle also uses ochre on forest green, whose solid color pair is 2.505:1; its current entrance sample is a warning rather than a held error. The caption's steady cream-on-brown pair passes 5.022:1, so its exit-fade warning is not evidence of a steady-state contrast defect.

Sources: [white text](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/warm-grain/compositions/graphics.html#L29-L36), [ochre pill](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/warm-grain/compositions/graphics.html#L73-L80), [intro colors](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/warm-grain/compositions/intro.html#L22-L45).

Evidence: [ochre statistic](template-audit/2026-09-30/warm-grain-statistic.png). Supplying the official sample video with its 14.722-second duration reproduces the same 2.77:1 and 2.86:1 measurements when checking `--at 5,7.222`.

## Optional separate cleanup: Warm Grain targets video removed by no-video initialization

Example: `warm-grain`, initialized without `--video`.

The official initializer removes the placeholder `<video id="a-roll">`, but the template retains one `gsap.set` and five timeline calls targeting it. The current checker records six `GSAP target #a-roll not found` warnings. Supplying video removes all six warnings. Both cases have zero runtime errors, so this is an empty-scaffold cleanup, not a missing installed video or a broken supplied-video render.

Expected: no-video initialization skips the video framing tweens, avoiding warnings for an explicitly omitted input.

Sources: [no-video removal](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/packages/cli/src/commands/init.ts#L351-L375), [video setup and tweens](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/warm-grain/index.html#L189-L268).

Play Mode and Product Promo have a checker compatibility draft below. Their failed full checks must remain recorded because runtime/layout/contrast are skipped after lint errors. Transform lint alone does not establish a visual break. No issue is drafted for intentional transition overflow, negative-z-index heuristics, or the fixed optional caption-sidecar requests.

## Official Play Mode and Product Promo templates fail transform lint on 0.8.99

Local upstream checker compatibility report draft. Not filed.

The unchanged official templates fail `hyperframes check` on npm HyperFrames 0.8.99 with these `gsap_css_transform_conflict` errors:

| Template      | Selector                                                                                | CSS transform           | Animated properties |
| ------------- | --------------------------------------------------------------------------------------- | ----------------------- | ------------------- |
| Play Mode     | `#moment-3`                                                                             | `scale(0) rotate(3deg)` | `scale`             |
| Product Promo | `.dragged-card`                                                                         | `scale(0.9)`            | `x/y/scale`         |
| Product Promo | `.stamped-cards`                                                                        | `translate(-50%, -50%)` | `y`                 |
| Product Promo | `.checkmark`                                                                            | `scale(0)`              | `scale`             |
| Product Promo | `.web-frame, .cursor, .dragged-card, .stamped-cards, .comment-container, .assets-panel` | `translate(-50%, -50%)` | `x`                 |

Each error says GSAP will overwrite the full CSS transform, discarding centering or the CSS scale value. The templates therefore have failed complete checks. Runtime, layout, and contrast audits are skipped after these lint errors; their zero counts do not mean those audits passed.

The source uses intentional CSS starting values. Product Promo's dragged card starts at scale 0.9 and later animates to scale 1. Its checkmark starts at scale 0 and later animates to scale 1. The linter treats any CSS scale combined with a `to`/`set` scale property as a hard conflict, without testing the resulting geometry.

Current diagnostic snapshots taken without editing canonical source show Play Mode's third statistic visible at 9.7 seconds with a slight tilt, and Product Promo's sampled web frame centered. Play Mode's actual third-stat start comes from transcript word `three` at 8.88 seconds; the nearby comment saying approximately 13 seconds is stale. These images do not establish correctness across every frame, but they do not show the blanket loss of transforms asserted by the lint message.

GSAP's [CSS documentation](https://gsap.com/docs/v3/GSAP/CorePlugins/CSS/#transforms) describes cached individual transform properties, so changing one component does not inherently discard the others. GSAP 3.14.2's [CSSPlugin source](https://cdn.jsdelivr.net/npm/gsap@3.14.2/src/CSSPlugin.js) reads the existing matrix at line 621, caches scale/rotation/percent translations at lines 740–756, and renders the combined components at lines 774–822. This is reason to review the rule's broad assumption, not proof that the HyperFrames capture path never differs.

Expected: official templates and their checker should agree on supported transform initialization. Please reproduce these failures and determine whether the templates need changes for the capture path or the lint rule needs narrower matching/severity. If this remains a static heuristic, the message should avoid asserting a visual break without runtime evidence.

Suggested reproduction:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes@0.8.99 init play-mode-repro --example play-mode --non-interactive
cd play-mode-repro
npx hyperframes@0.8.99 check --json
```

Repeat in a fresh directory with example `product-promo`. The error count is one for Play Mode and four for Product Promo.

Sources: [Play Mode CSS](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/play-mode/compositions/stats.html#L56), [Play Mode tween](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/play-mode/compositions/stats.html#L339-L348), [Product Promo CSS](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/product-promo/compositions/scene2-4-canvas.html#L327-L404), [Product Promo tweens](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/registry/examples/product-promo/compositions/scene2-4-canvas.html#L523-L566), [lint matching and error text](https://github.com/heygen-com/hyperframes/blob/132b9909fa75617acac6c9c7ddfc63e5573b3a60/packages/lint/src/rules/gsap.ts#L1330-L1373).

Evidence: [Play Mode diagnostic snapshots](template-audit/2026-09-30/play-mode-diagnostic.jpg), [Product Promo diagnostic snapshots](template-audit/2026-09-30/product-promo-diagnostic.jpg). Keep these findings classified as unresolved lint compatibility. Do not change canonical template source merely to silence the rule.
