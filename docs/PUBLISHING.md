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
MP4s from `dist/`. They also omit original preview PNGs because the catalog uses
WebP posters. Keep the PNGs in `public/previews/` for local preview and parity
evidence; registry PNG assets are included in production. Missing or outdated
uploads fail the build. An unchanged checkout needs no Blob credentials. Keep
original videos for local
preview and parity checks. Never put Blob credentials in a `VITE_` variable.

## Storage cleanup

After a successful production deployment, check out its exact commit and run
`npm run prune:media` with your Blob credentials. This is a dry run. It lists
unused videos and their total size, retaining the checkout's media manifest and
all uploads from the last 14 days. It refuses to prune an empty manifest or a
store missing retained videos. Files outside Hyfrme's immutable media paths
remain untouched.

Preserve rollback or preview deployments by exporting their media manifests
and passing `--keep` for each one:

```bash
git show <retained-deployment-commit>:src/generated/media.json > /tmp/retained-media.json
npm run prune:media -- --keep /tmp/retained-media.json
npm run prune:media -- --keep /tmp/retained-media.json --delete
```

Review and back up the listed files before passing `--delete`. Older deployments
whose manifests are not retained may lose access to their videos. Run cleanup
after deployment, never during sync or a build, so the running site keeps its
current videos. Vercel's monthly average storage metric falls over time after
cleanup; it does not reset immediately.

## Delivery encoding

Sync compresses catalog preview videos of 5 MB or larger with FFmpeg, preserving
resolution, frame rate, duration, and audio. It uses H.264 CRF 16 and accepts a
derivative only when SSIM is at least 0.98 and the file is at least 10% smaller.
Otherwise it uploads the original. Showcase films keep their original encoding.

Delivery URLs include the source hash and an encoding version. Bump the version
when changing the encoding recipe. Original files and parity artifacts remain
untouched. FFmpeg and ffprobe are needed for new large previews, not builds.

When catalog pages depend on new CLI behavior, publish the corresponding CLI release
before deploying those pages. Official template commands require the release that
adds `hyfrme init`. The website build creates a local CLI archive; it does not publish
the npm package.
