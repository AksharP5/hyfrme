# Developing Hyfrme

This guide covers contributing to the catalog and website. For installing components
in a video project, see the [README](../README.md).

## Local setup

No Blob token or access to the owner's Vercel account is needed. The development
server serves the video files committed in this repository.

```bash
npm install
npm run dev
```

Install FFmpeg and ffprobe for media generation and verification.

## Open a pull request

1. Make your changes and include updated renders, thumbnails, and parity evidence
   when editing a component.
2. Run the checks below. They work with unpublished videos and require no credentials.
3. Review the built site with `npm run preview` and include a short description of
   the change and verification results in your PR. Mention any changed video files.
4. Open the PR. This is the contributor's final step; the owner reviews it and
   handles [production publishing](PUBLISHING.md) before merging.

```bash
npm run check
npm run build
npm pack ./cli --dry-run
```

`npm run build` includes local videos in `dist/`. `npm run preview` serves those
files, including new renders. PR CI runs the same checks and build. No upload or
changes to `src/generated/media.json` or media redirects in `vercel.json` are
required from contributors.

Vercel skips hosted previews when videos have not been published yet. This does
not skip PR CI; use the local preview to review these contributions. Once the
owner publishes the videos, hosted previews can build again.

Follow the [porting workflow](PORTING.md) for composition ports and the
[project instructions](../AGENTS.md) when working with an agent.

## Updating Screen Lift

```bash
npm run verify:screen-lift
npm run sync:registry
npm run sync:catalog
npm run check
npm run build
npm run preview
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
