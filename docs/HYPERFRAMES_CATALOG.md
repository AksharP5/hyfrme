# Official HyperFrames catalog

Hyfrme imports every item published in the official registry at
`c694785df5993191fec42ec84e9d65ea69f98ad8`: 210 blocks, 237 HTML components,
and 8 project templates, for 455 official items total. The authoritative import record is
[`catalog/hyperframes-upstream.json`](../catalog/hyperframes-upstream.json).

The October 15 refresh adds 60 items, including 36 shader backgrounds, 3D scenes,
cursor actors and actions, typography, and transitions. It also imports upstream
corrections to Motion Blur, Shutter Slam, Play Mode, Product Promo, Swiss Grid,
Vignelli, and Warm Grain. All 1,679 installed files have verified source hashes.
The old documentation-only Simulated Cursor was removed upstream and is retired
here; the new Cursors group includes Agent Cursor, Dart Cursor, Magnetic Cursor,
and cursor action snippets. The Remocn Simulated Cursor port remains available.

## Browse by upstream group

The website preserves the official catalog's category labels, subgroup labels,
item membership, and order. Blocks and HTML snippets stay together when upstream
places them together, such as Captions and Code Animations. Select the HyperFrames
source to browse only these groups; templates remain a separate collection.

[`catalog/hyperframes-navigation.json`](../catalog/hyperframes-navigation.json)
freezes the Catalog navigation from upstream `docs/docs.json` at
`c694785df5993191fec42ec84e9d65ea69f98ad8`, with its source SHA256. Its eleven
groups cover every imported block and component. Week in Merges now appears in
the published registry, and Colorama Wipe belongs to Typography & Text.

Refresh navigation from an exact upstream commit, then review coverage and run the usual checks:

```bash
node scripts/sync-hyperframes-navigation.mjs <upstream-commit-sha>
npm run test:taxonomy
```

## Import contract

Canonical HTML, JavaScript, media, fonts, and licenses retain the original bytes.
Every installed file has a SHA256 digest and origin. The import freezes the 410
hosted asset entries from 37 content-addressed URLs; no source assets need to be
fetched from those URLs while installing. Original names receive a `hyperframes-`
prefix in Hyfrme. Composition IDs and source-relative paths stay upstream-owned.
Native copies use hash verification rather than claiming a port SSIM result.

The native Whip Pan, Code Morph, and Hologram compositions use `hyperframes-` filenames
to avoid overwriting the existing Remocn ports. Nine root `TEMPLATE.md` files install
beside their own blocks under `compositions/hyperframes-<name>/`. Original targets
and reasons are recorded in the import evidence. Other canonical targets remain unchanged; project path configuration is honored at install.
The shader blocks include upstream's MIT-licensed shader bundle and its notices.
Identical shared install targets retain identical bytes.

## Install and preview

```bash
npx hyfrme@latest add hyperframes-data-chart hyperframes-spring-pop
npx hyfrme@latest init hyperframes-product-promo --dir ./product-promo
```

Blocks provide composition markup. Components provide HTML snippets to paste into
an existing scene. Templates create complete projects and missing `hyperframes.json`.
`add --all` includes blocks and components; it skips templates to avoid replacing a
project's root `index.html`.

Four video scaffold templates (Warm Grain, Swiss Grid, Play Mode, Vignelli) follow
the official no-video initialization: duration 10 seconds and placeholder video/audio
elements removed from the installed copy. Decision Tree initialization also applies a renderer compatibility fallback for
`tl.labels["hold5"]`, using its measured real-GSAP value of 6.25 seconds when the
compiled renderer proxy lacks label access. Real-GSAP timing stays unchanged. Other
source files stay unchanged.

Preview videos for all eight templates are generated locally. Their source and fixture
hashes, initialization transforms, render settings, and check results are recorded in
`catalog/hyperframes-template-previews.json`. These records distinguish successful
renders from full-check results; native sources can retain upstream layout or contrast
findings. The previews do not assert passing port comparisons. Blocks and
components retain the official poster/video URLs where published and offer live source
previews on their detail pages. Items without an official poster display a source tile.

Live shader previews wait for native build readiness and use the official seek
events. Browsers without WebGPU show the upstream default video with a notice.
HTML snippets mount at composition dimensions; Pendulum Swing's preview supplies
the documented 2.9-second host tween. These preview adaptations do not change
installed source.

Warm Grain's missing-video warning was reproduced on September 30, 2026 with
HyperFrames 0.8.81 and Chrome 152. The official no-video initializer removes
`<video id="a-roll">`, but the template keeps its six GSAP calls targeting
`#a-roll`. The resulting six `GSAP target #a-roll not found` warnings disappear
when a video is supplied. Both fixtures have zero runtime errors; separate contrast
findings remain. This is an empty-scaffold warning, not a missing installed video
file. The [September template audit](TEMPLATE_AUDIT.md) rechecked all eight examples
with HyperFrames 0.8.99, verifies actual official initialization against Hyfrme's
installed source, and separates confirmed defects from unresolved checker findings.
It includes supplied-video checks and [upstream report drafts](UPSTREAM_TEMPLATE_REPORTS.md).
Vignelli's optional `caption-overrides.json` request errors no longer occur on
0.8.99; its verified caption overlap is a separate source layout defect.

Official source-level network dependencies remain upstream-owned, including CDN
libraries, Google Fonts, a Kinetic Type video, and the Warm Grain paper texture.
Installing from the registry uses frozen declared assets; rendering these native sources
can still require network access, as in the official catalog.

Week in Merges was also checked with HyperFrames 0.8.75. It passes lint, runtime,
and motion checks; its unchanged
upstream source retains layout and contrast findings. Source-copy verification does
not claim those upstream findings have been repaired.

## Refresh the pinned import

Use an isolated clean checkout at the script's pinned commit. Include `registry/`,
`examples/`, `docs/docs.json`, and `docs/catalog/` when using a sparse checkout:

```bash
HYPERFRAMES_SOURCE=.work/hyperframes-c694785d npm run import:hyperframes
node scripts/sync-hyperframes-navigation.mjs c694785df5993191fec42ec84e9d65ea69f98ad8
npm run preview:templates
npm run build:catalog
npm run sync:registry
npm run sync:catalog
npm run check
npm run build
npm pack ./cli --dry-run
```

The importer rejects a different commit or modified tracked source and fails when any
published file is unavailable. Updating the pin requires a new complete import record,
source review, regenerated previews, and the same checks. Media publishing follows
[the publishing guide](PUBLISHING.md).
