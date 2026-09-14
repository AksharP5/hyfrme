# Developing Hyfrme

This guide covers maintaining the catalog and website. For installing components
in a video project, see the [README](../README.md).

## Local setup

```bash
npm install
npm run dev
```

Install FFmpeg and ffprobe for media generation and verification. Before shipping
changes, run:

```bash
npm run check
npm run build
npm pack ./cli --dry-run
```

Follow the [porting workflow](PORTING.md) for composition ports and the
[project instructions](../AGENTS.md) when working with an agent.

## Updating Screen Lift

```bash
npm run verify:screen-lift
npm run sync:registry
npm run sync:catalog
npm run sync:media
npm run check
npm run build
```

The verifier checks actual CLI installations, custom paths and variables, and
all 120 rendered frames. It compares the original Hyfrme source with the installed
result. Upstream port comparisons do not apply to this original component.

## Publishing website videos

Catalog previews and showcase MP4s are served from public Vercel Blob storage.
Development uses the original files in `public/previews/` and
`public/showcases/`. Registry assets and CLI installs remain self-contained.

After adding or re-rendering a website video:

```bash
# Set BLOB_READ_WRITE_TOKEN in the environment or an ignored .env.local file.
npm run sync:media
npm run optimize:thumbnails
npm run check
npm run build
```

Commit updated videos, `src/generated/media.json`, and `vercel.json` together.
Sync uploads changed videos to immutable paths containing their SHA-256 hash,
resumes interrupted uploads, and never removes remote files. Temporary redirects
preserve the original video URLs. `vite preview` uses these redirects;
`npm run dev` serves local videos directly.

Production builds verify every video's hash and redirect before omitting those
MP4s from `dist/`. Missing or outdated uploads fail the build. Building an
unchanged checkout needs no Blob credentials. Keep original videos for local
preview and parity checks. Never put Blob credentials in a `VITE_` variable.

### Delivery encoding

Sync compresses catalog preview videos of 5 MB or larger with FFmpeg, preserving
resolution, frame rate, duration, and audio. It uses H.264 CRF 16 and accepts a
derivative only when SSIM is at least 0.98 and the file is at least 10% smaller.
Otherwise it uploads the original. Showcase films keep their original encoding.

Delivery URLs include the source hash and an encoding version. Bump the version
when changing the encoding recipe. Original files and parity artifacts remain
untouched. FFmpeg and ffprobe are needed for new large previews, not builds.

### Thumbnails

The website uses `thumbnail.webp` for component images and video posters.
`npm run optimize:thumbnails` generates lossless WebP from the original PNGs,
resizing images wider than 1024px. It converts PNG color metadata to sRGB and
preserves transparent edges during resizing. Commit both formats after updating
thumbnails. `npm run generate:thumbnails` runs optimization automatically.

## Catalog loading

Catalog pages load component summaries. Opening a component loads its HTML and
`catalog.json`, which contains registry metadata and verification details.
`npm run sync:catalog` generates these files under `public/registry/`; `predev`
and `prebuild` run it automatically. Keep generated catalog files synchronized
with component manifests.

The editor loads only on component pages, and the comparison player loads when
its panel opens. Showcase cards load video on hover or keyboard focus. Homepage
family cards load when visible and respect reduced motion.
