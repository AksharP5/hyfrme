# Hyfrme

Hyfrme is a copy-paste motion library for
[HyperFrames](https://hyperframes.heygen.com/). Browse 277 components,
customize one in the browser, then copy it into your project with one command.
You own the installed HTML, JavaScript, fonts, and assets.

## Why Hyfrme

- **Customize before you install.** Every component page turns supported
  variables into live controls and updates the command for your version.
- **Own the code.** Components are copied into your project instead of hidden
  behind a runtime dependency.
- **Verified motion.** Every port is rendered against its pinned
  [Remocn](https://github.com/Remocn/remocn) source and published only after
  passing the repository's visual parity checks.

## Installation

Start inside a HyperFrames project, then add any component from the
[catalog](https://hyfrme.vercel.app):

```bash
npx hyfrme@latest add soft-blur-in
```

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

Before contributing:

```bash
npm run check
npm run build
```

Composition ports follow the parity workflow in
[`docs/PORTING.md`](docs/PORTING.md). Contributor-specific agent instructions
live in [`AGENTS.md`](AGENTS.md).

## Website video storage

Catalog preview and showcase MP4s are served from public Vercel Blob storage.
Local development uses the original files in `public/previews/` and
`public/showcases/`. Registry assets and CLI installs stay self-contained.

After adding or re-rendering a website video, sync it before building:

```bash
# Set BLOB_READ_WRITE_TOKEN in the environment or an ignored .env.local file.
npm run sync:media
npm run check
npm run build
```

Commit the updated videos, `src/generated/media.json`, and `vercel.json`
together. Sync uploads changed videos to immutable paths containing their
SHA-256 hash, resumes interrupted uploads, and never removes remote files.
It generates temporary redirects for the original video URLs, preserving
existing links when a video changes. The site uses Blob URLs directly.

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

Hyfrme is an independent project, not an official Remocn or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

MIT licensed.
