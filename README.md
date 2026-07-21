# Hyfrme

Hyfrme ports open-source [Remocn](https://github.com/Remocn/remocn)
components to native [HyperFrames](https://hyperframes.heygen.com/) blocks and
publishes the source, fixture, and measured visual comparison for each port.

The catalog is intentionally small at first. A port is public only after it
passes the fidelity contract in [`docs/PORTING.md`](docs/PORTING.md).

## Available ports

| Block          | Classification | Frames | Mean SSIM | Status   |
| -------------- | -------------- | -----: | --------: | -------- |
| `soft-blur-in` | Mechanical     |     60 |  0.998647 | Verified |

## Run the catalog locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. The catalog uses synchronized,
pre-rendered MP4s for comparison so visitors do not need either framework
runtime in their browser.

## Install the first block

Run these commands from a HyperFrames project:

```bash
mkdir -p compositions assets/fonts
curl -fsSL https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/soft-blur-in/soft-blur-in.html -o compositions/soft-blur-in.html
curl -fsSL https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/soft-blur-in/Geist-SemiBold.woff2 -o assets/fonts/Geist-SemiBold.woff2
```

The manual install is deliberate for the first release: it does not replace a
project's configured HyperFrames registry. A small Hyfrme installer can be
added once the catalog shape is stable.

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

## Attribution

Hyfrme is an independent project and is not an official Remocn or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## License

Hyfrme is released under the [MIT License](LICENSE).
