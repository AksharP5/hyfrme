# Hyfrme

Hyfrme ports open-source [Remocn](https://github.com/Remocn/remocn)
components to standalone [HyperFrames](https://hyperframes.heygen.com/) blocks
and publishes the source, fixture, and measured visual comparison for each
port.

A port is public only after it passes the fidelity contract in
[`docs/PORTING.md`](docs/PORTING.md).

## Available ports

- `soft-blur-in`: native mechanical port, 60 frames, 0.998647 mean SSIM.
- 21 typography and effect components: compiled source ports, 60–120 frames
  each, 0.986619–0.999432 mean SSIM (0.997517 family mean).
- 100 animated icons: compiled source ports, 60–90 frames each, 0.985560–0.998621
  mean SSIM (0.993872 family mean).

That is 122 verified blocks from the pinned Remocn commit. The exact score and
fixture for every item live under `parity/` and are visible in the catalog.

## Run the catalog locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. The catalog uses synchronized,
pre-rendered MP4s for comparison so visitors do not need either framework
runtime in their browser.

## Install a block

Run these commands from a HyperFrames project:

```bash
mkdir -p compositions assets/fonts
curl -fsSL https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/soft-blur-in/soft-blur-in.html -o compositions/soft-blur-in.html
curl -fsSL https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/soft-blur-in/Geist-SemiBold.woff2 -o assets/fonts/Geist-SemiBold.woff2
```

For an icon, the block is one standalone HTML file:

```bash
mkdir -p compositions
curl -fsSL https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/icon-check-circle/icon-check-circle.html -o compositions/icon-check-circle.html
```

Compiled typography/effect blocks include the HTML composition, source runtime,
and bundled font. The catalog generates all three install commands for the
selected block.

Manual installation does not replace a project's configured HyperFrames
registry. The website generates the exact command for every selected block.

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
npm run generate:text
npm run verify:text
npm run build:catalog
npm run generate:thumbnails
```

## Attribution

Hyfrme is an independent project and is not an official Remocn or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## License

Hyfrme is released under the [MIT License](LICENSE).
