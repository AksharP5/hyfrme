# Hyfrme

Hyfrme is a copy-paste motion library for
[HyperFrames](https://hyperframes.heygen.com/). Browse Hyfrme originals and ports from Remocn and Snapcn,
customize one in the browser, then copy it into your project with one command.
You own the installed HTML, JavaScript, fonts, and assets.

## Why Hyfrme

- **Customize before you install.** Every component page turns supported
  variables into live controls and updates the command for your version.
- **Own the code.** Components are copied into your project instead of hidden
  behind a runtime dependency.
- **Verified motion.** Every port is rendered against its pinned
  [Remocn](https://github.com/Remocn/remocn) or [Snapcn](https://github.com/snapcndev/snapcn) source and published only after
  passing the repository's visual parity checks.
- **Original components.** Hyfrme originals are checked and rendered through the
  installer. They do not claim visual parity with an upstream library.

## Installation

Start inside a HyperFrames project, then add any component from the
[catalog](https://hyfrme.vercel.app):

```bash
npx hyfrme@latest add soft-blur-in
```

Filter the catalog by Hyfrme, Remocn, or Snapcn to browse a source. Snapcn names
carry a prefix so similarly named components remain distinct:

```bash
npx hyfrme@latest add snapcn-phone-frame
```

Screen Lift is a Hyfrme original: a 4-second phone close-up with two raised
HTML chat rows and light across the glass.

```bash
npx hyfrme@latest add screen-lift
```

Customize its chat text, avatar photos, colors, lift depth, and camera angle
in the catalog or with `--set`. See the [component guide](registry/blocks/screen-lift/README.md).

Install the full catalog when you want every block available locally:

```bash
npx hyfrme@latest add --all
```

Changed values from the browser are installed as the component's new defaults:

```bash
npx hyfrme@latest add matrix-decode \
  --set 'text=HELLO WORLD' \
  --set 'fontSize=31' \
  --set 'color=#22c55e'
```

The CLI respects the paths in `hyperframes.json`, copies every required file,
and prints the markup needed to mount the component.

## Setup with AI

Install the Hyfrme skill so your coding agent can discover, install, and wire
components correctly:

```bash
npx skills@latest add AksharP5/hyfrme --yes
```

Then ask:

```text
Use Hyfrme to add a motion component that fits this scene, customize it to the
project's visual style, and wire it into my HyperFrames composition.
```

## Develop locally

```bash
npm install
npm run dev
```

Before contributing, ensure FFmpeg is on your PATH, then run:

```bash
npm run check
npm run build
```

Composition ports follow the parity workflow in
[`docs/PORTING.md`](docs/PORTING.md). Contributor-specific agent instructions
live in [`AGENTS.md`](AGENTS.md).

After editing Screen Lift, run `npm run verify:screen-lift` to check the actual
CLI installation, custom paths and variables, and all 120 rendered frames.
Then run `npm run sync:registry`, `npm run sync:catalog`, and `npm run sync:media`
before the regular checks and build. Its installation comparison measures the
original source against the installed result, not an upstream port.

## Website video storage

Catalog preview and showcase MP4s are served from public Vercel Blob storage.
Local development uses the original files in `public/previews/` and
`public/showcases/`. Registry assets and CLI installs stay self-contained.

After adding or re-rendering a website video, sync it before building:

```bash
# Set BLOB_READ_WRITE_TOKEN in the environment or an ignored .env.local file.
npm run sync:media
npm run optimize:thumbnails
npm run check
npm run build
```

Commit the updated videos, `src/generated/media.json`, and `vercel.json`
together. Sync uploads changed videos to immutable paths containing their
SHA-256 hash, resumes interrupted uploads, and never removes remote files.
It generates temporary redirects for the original video URLs, preserving
existing links when a video changes. The site follows these redirects when a
video is requested, so the initial JavaScript does not include the full media
manifest. `vite preview` serves the same redirects; development serves local
videos directly.

Catalog pages load only component summaries. Opening a component fetches its
registry metadata and verification details together in `catalog.json`, alongside
the HTML source. These files are generated under `public/registry/` by
`npm run sync:catalog`; `predev` and `prebuild` run this automatically.
The editor loads only on component pages. With 351 components, initial
JavaScript is 393 KB, or 102 KB gzipped, compared with 668 KB and 153 KB before
these optimizations. Comparison-player code remains deferred until the
verification panel opens.

The website uses `thumbnail.webp` for component images and video posters.
`npm run optimize:thumbnails` generates these from the original PNGs using
lossless WebP, resizing images wider than 1024px. Smaller images keep their
original dimensions. Generation converts PNG color metadata to sRGB and
preserves transparent edges when resizing. Run it after updating thumbnails
and commit both formats. `npm run generate:thumbnails` runs it automatically.
FFmpeg and ffprobe are required for generation, but not for builds.
Across 351 components, WebP reduces thumbnail bytes from 15.33 MB to 7.91 MB.
Browser-rendered comparisons on light and dark backgrounds at up to 650px
wide have a minimum SSIM of 0.990754.

Sync compresses preview videos of 5 MB or larger with FFmpeg, keeping the
original resolution, frame rate, duration, and audio. It uses H.264 CRF 16 and
accepts the delivery copy only when SSIM is at least 0.98 and the file is at
least 10% smaller. Otherwise it uploads the original. Install `ffmpeg` and
`ffprobe` before syncing a new large preview. They are not needed for builds.
Delivery URLs include the source hash and an encoding version; change that
version when changing the encoding recipe. Original files and parity artifacts
stay untouched. Showcase films retain their original encoding.

Showcase cards load video on hover or keyboard focus. Homepage family cards
load when visible and respect reduced motion.

Production builds verify every video's hash and redirect before omitting those
MP4s from `dist/`. Missing or outdated uploads fail the build. Building an
unchanged checkout needs no Blob credentials. Keep the original videos for local
development and parity checks. Do not put Blob credentials in a `VITE_` variable.

## Attribution

Hyfrme is an independent project, not an official Remocn, Snapcn, or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Hyfrme’s own code is MIT licensed. Installed blocks retain the third-party
licenses listed in their manifests and copied notices.
