# Publishing website assets

This workflow is for the repository owner, who controls the production Blob
credentials. Contributors follow [DEVELOPMENT.md](DEVELOPMENT.md) and submit
changed video files without uploading them.

Catalog previews and showcase MP4s are served from public Vercel Blob storage.
Development uses the original files in `public/previews/` and
`public/showcases/`. Production registry downloads come from a pinned
public GitHub commit through the same `/registry/` URLs. Installed source and
assets remain self-contained.

After approving a PR, check out the reviewed changes locally. If it changes
website videos, run `npm run sync:media` using your existing local credentials.
If it changes `registry/`, commit and push those files, then run:

```bash
npm run pin:registry -- <full-reviewed-commit-sha>
```

This checks that the registry matches the public commit and updates
`src/generated/registry-source.json` and the route in `vercel.json`.
Unchanged registry files reuse the existing pin. This step needs no publishing
credentials and uploads no extra copies.

Then validate the result:

```bash
npm run check
npm run build:production
npm pack ./cli --dry-run
```

Commit any generated changes to `src/generated/media.json`,
`src/generated/registry-source.json`, and `vercel.json`
with the reviewed contribution, then merge or push the completed change to
`main`. If the fork does not allow maintainer edits, integrate it on a local
branch and include the publishing commit there before merging.

PR CI uses the contributor build and does not need uploads. After a push to
`main`, CI also runs `npm run build:production`. Vercel uses this production
build for deployments and rejects unpublished media. Hosted previews with
unpublished videos are skipped until the owner completes this step.

After a successful preview, pushes that only change root `README.md` or
`AGENTS.md`, `docs/`, `fixtures/`, `examples/`, `.github/`, or nested `parity/`
evidence skip another hosted build. Root parity JSON, CLI files, media, registry,
website, and build changes still require a preview. The comparison uses Vercel's
last successful deployment for the branch, so earlier unpublished changes remain
included. A first preview, missing Git history, or a deliberate redeploy still
runs the publishing checks. PR CI and production builds always run.

Sync uploads changed videos to immutable paths containing their SHA-256 hash,
resumes interrupted uploads, and never removes remote files. Temporary redirects
preserve the original video URLs. To inspect a production build locally, run
`npm run preview -- --mode hosted`. Regular builds and previews use local videos.

Production builds verify every video's hash and redirect before omitting those
MP4s from `dist/`. They also omit original preview PNGs because the catalog uses
WebP posters. Registry source and assets are omitted after their fingerprint and
routing match the pinned commit; generated `catalog.json` details stay local.
The GitHub route supplies JavaScript, fonts, images, and other files with
their original MIME types. Vercel rewrite caching is disabled because cached
responses can restore GitHub's plain-text and sandbox headers. Browser requests
revalidate, so they receive current registry files when the pin changes.
Direct HTML previews retain
same-origin scripting and framing.

Keep original PNGs, videos, and registry files for local preview, installation,
and parity checks. Missing or outdated publishing data fails the production
build. An unchanged checkout needs no publishing credentials. Never put Blob
credentials in a `VITE_` variable.

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
