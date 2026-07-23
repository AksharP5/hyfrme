# Hyfrme

Hyfrme ports open-source [Remocn](https://github.com/Remocn/remocn)
components to standalone [HyperFrames](https://hyperframes.heygen.com/) blocks
and publishes the source, fixture, and measured visual comparison for each
port.

A port is public only after it passes the fidelity contract in
[`docs/PORTING.md`](docs/PORTING.md).

## Available ports

- `soft-blur-in`: native mechanical port, 60 frames, 0.998647 mean SSIM.
- 24 typography and effect components: compiled source ports, 60–120 frames
  each, 0.986619–0.999432 mean SSIM (0.997021 family mean).
- 83 composition, transition, shader, AI, social, and data scenes: compiled
  source ports, 90–360 frames each, 0.952963–0.999848 mean SSIM (0.994263
  family mean).
- 45 UI primitives and complete flows: compiled source ports, 40–380 frames
  each, 0.995265–0.999995 mean SSIM (0.999585 family mean).
- 100 animated icons: compiled source ports, 60–90 frames each, 0.985560–0.998621
  mean SSIM (0.993872 family mean).

Together with the native `soft-blur-in` port, that is all 253 visual blocks
from the current pinned Remocn commit. The exact score and fixture for every
item live under `parity/` and are visible in the catalog.

## Run the catalog locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. The catalog uses synchronized,
pre-rendered MP4s for comparison so visitors do not need either framework
runtime in their browser.

## Install a block

Open a component in the [catalog](https://hyfrme.vercel.app), then run its
one-line command from a HyperFrames project:

```bash
npx https://hyfrme.vercel.app/cli/v0.2.0 add soft-blur-in
```

The installer reads `hyperframes.json`, respects its configured composition and
asset paths, and copies every required HTML, runtime, font, image, and license
file. Standalone verified ports are converted into embeddable HyperFrames
sub-compositions during installation. Compiled runtimes are embedded and
namespaced per block so several Hyfrme components can mount reliably in the
same project. It does not replace the project's configured HyperFrames
registry. Use `--dir <project>` to target another directory or `--force` to
replace an existing installation.

Every control in the catalog can also become an installed default. The copied
command adds one `--set key=value` option per changed value:

```bash
npx https://hyfrme.vercel.app/cli/v0.2.0 add matrix-decode \
  --set 'text=HELLO WORLD' \
  --set 'fontSize=31' \
  --set 'color=#22c55e'
```

The CLI validates each setting against the block's embedded variable metadata
and writes the selected values into the copied composition. It also prints the
compact `data-composition-src` markup needed to mount the block in
`index.html`. Per-instance overrides remain available through HyperFrames'
`data-variable-values` attribute.

## Repository map

- `registry/` contains installable HyperFrames blocks and manifests.
- `parity/` contains the pinned source fixture and comparison measurements.
- `public/previews/` contains the synchronized reference and port renders.
- `src/` contains the public comparison catalog.
- `docs/PORTING.md` defines what “1:1” means and how new ports are admitted.

## Verification

```bash
npm run check
npm run build
npm run verify:installer
```

`npm run check` validates that every catalog item has its source files,
attribution, previews, and a passing parity manifest. Composition-level
HyperFrames checks and frame comparisons are run while producing each port;
their results are committed under `parity/`.

The repeatable icon and typography/effect pipelines are exposed as:

```bash
npm run audit:upstream
npm run generate:icons
npm run verify:icons
npm run generate:icon-previews
npm run generate:text
npm run verify:text
npm run generate:core
npm run verify:core
npm run generate:primitives
npm run verify:primitives
npm run build:catalog
npm run generate:thumbnails
```

## Attribution

Hyfrme is an independent project and is not an official Remocn or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## License

Hyfrme is released under the [MIT License](LICENSE).
