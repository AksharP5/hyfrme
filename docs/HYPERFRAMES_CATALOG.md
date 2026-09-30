# Official HyperFrames catalog

Hyfrme imports every item published in the official registry at
`daa44fcd753d9055aa3c954ad74f09a4e4389780`: 164 blocks, 222 HTML components,
and 8 project templates. The authoritative import record is
[`catalog/hyperframes-upstream.json`](../catalog/hyperframes-upstream.json).

## Import contract

Canonical HTML, JavaScript, media, fonts, and licenses retain the original bytes.
Every installed file has a SHA256 digest and origin. The import freezes the 410
hosted asset entries from 37 content-addressed URLs; no source assets need to be
fetched from those URLs while installing. Original names receive a `hyperframes-`
prefix in Hyfrme. Composition IDs and source-relative paths stay upstream-owned.
Native copies use hash verification rather than claiming a port SSIM result.

The native Whip Pan and Code Morph compositions use `hyperframes-` filenames
to avoid overwriting the existing Remocn ports. Nine root `TEMPLATE.md` files install
beside their own blocks under `compositions/hyperframes-<name>/`. Original targets
and reasons are recorded in the import evidence. Other canonical targets remain unchanged; project path configuration is honored at install.

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
`catalog/hyperframes-template-previews.json`. Two templates pass the full native check; six retain upstream layout, contrast,
transform, or optional-resource findings. These findings remain in the evidence; these previews do not assert passing port comparisons. Blocks and
components retain the official poster/video URLs where published and offer live source
previews on their detail pages. Items without an official poster display a source tile.

Official source-level network dependencies remain upstream-owned, including CDN
libraries, Google Fonts, a Kinetic Type video, and the Warm Grain paper texture.
Installing from the registry uses frozen declared assets; rendering these native sources
can still require network access, as in the official catalog.

## Refresh the pinned import

Use an isolated clean checkout at the script's pinned commit:

```bash
HYPERFRAMES_SOURCE=.work/hyperframes-daa44fcd npm run import:hyperframes
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
