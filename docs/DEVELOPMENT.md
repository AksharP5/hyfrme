# Developing Hyfrme

This guide covers contributing to the catalog and website. For installing components
in a video project, see the [README](../README.md).

## Local setup

No Blob token or access to the owner’s Vercel account is needed. The development
server serves the video files committed in this repository.

```bash
npm install
npm run dev
```

Install FFmpeg and ffprobe for media generation and verification. For changes
that leave video files unchanged, run these checks before opening a pull request:

```bash
npm run check
npm run build
npm pack ./cli --dry-run
```

An unchanged checkout builds without credentials. If your changes add or
re-render videos, use `npm run dev` to preview them and include the videos in your
pull request. Run the other checks above; production builds and CI remain blocked
until the repository owner [publishes the changed videos](PUBLISHING.md) and runs
the final build before merging. You do not need a token or
changes to `src/generated/media.json` or `vercel.json`.

Follow the [porting workflow](PORTING.md) for composition ports and the
[project instructions](../AGENTS.md) when working with an agent.

## Updating Screen Lift

```bash
npm run verify:screen-lift
npm run sync:registry
npm run sync:catalog
npm run check
npm run dev
```

The verifier checks actual CLI installations, custom paths and variables, and
all 120 rendered frames. It compares the original Hyfrme source with the installed
result. Upstream port comparisons do not apply to this original component.

## Thumbnails

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
