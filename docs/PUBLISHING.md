# Publishing website videos

This workflow is for the repository owner, who controls the production Blob
credentials. Contributors follow [DEVELOPMENT.md](DEVELOPMENT.md) and submit
changed video files without uploading them.

Catalog previews and showcase MP4s are served from public Vercel Blob storage.
Development uses the original files in `public/previews/` and
`public/showcases/`. Registry assets and CLI installs remain self-contained.

After approving a PR, check out the reviewed changes locally. If it changes
website videos, run `npm run sync:media` using your existing local credentials.
Then validate the result:

```bash
npm run check
npm run build:production
npm pack ./cli --dry-run
```

Commit any generated changes to `src/generated/media.json` and `vercel.json`
with the reviewed contribution, then merge or push the completed change to
`main`. If the fork does not allow maintainer edits, integrate it on a local
branch and include the publishing commit there before merging.

PR CI uses the contributor build and does not need uploads. After a push to
`main`, CI also runs `npm run build:production`. Vercel uses this production
build for deployments and rejects unpublished media. Hosted previews with
unpublished videos are skipped until the owner completes this step.

Sync uploads changed videos to immutable paths containing their SHA-256 hash,
resumes interrupted uploads, and never removes remote files. Temporary redirects
preserve the original video URLs. To inspect a production build locally, run
`npm run preview -- --mode hosted`. Regular builds and previews use local videos.

Production builds verify every video's hash and redirect before omitting those
MP4s from `dist/`. Missing or outdated uploads fail the build. Building an
unchanged checkout needs no Blob credentials. Keep original videos for local
preview and parity checks. Never put Blob credentials in a `VITE_` variable.

## Delivery encoding

Sync compresses catalog preview videos of 5 MB or larger with FFmpeg, preserving
resolution, frame rate, duration, and audio. It uses H.264 CRF 16 and accepts a
derivative only when SSIM is at least 0.98 and the file is at least 10% smaller.
Otherwise it uploads the original. Showcase films keep their original encoding.

Delivery URLs include the source hash and an encoding version. Bump the version
when changing the encoding recipe. Original files and parity artifacts remain
untouched. FFmpeg and ffprobe are needed for new large previews, not builds.
