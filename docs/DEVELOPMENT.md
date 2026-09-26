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

## T3 Code ports

The active T3 Code blocks use the pinned v0.0.42 official binary and source fixture
under `.work/t3-v0042-bin/` and `assets/t3-code/v0.0.42/`. Their capture scripts
read the pairing URL from their own local v0.0.42 server log instead of using
`T3_REFERENCE_URL`. Never commit or print a pairing URL. Each migrated block
requires separate dark and light native captures, strict 120-frame comparisons,
focused interaction crops, custom-value checks, and a CLI-installed check.

Historical v0.0.35 captures use a local fixture containing only synthetic
Hyfrme projects and threads. Set `T3_REFERENCE_URL` to that isolated server,
`T3_STORAGE_STATE` to its paired Playwright state, and
`HYFRME_PLAYWRIGHT_CORE` to an installed `playwright-core` package. Set
`HYFRME_CHROMIUM` to Chrome Headless Shell 152.0.7977.30 so the native capture
uses the same renderer as HyperFrames.

On a host with a small `/tmp` quota, set `TMPDIR` to a disk-backed directory
before capture or verification. The browser profiles and lossless frame sequences
can exhaust a memory-backed temporary filesystem.

Then run:

```bash
node scripts/capture-t3-brief-reference.mjs
node scripts/generate-t3-brief-port.mjs
node scripts/verify-t3-port.mjs brief
node scripts/capture-t3-new-worktree-choice-reference.mjs
node scripts/generate-t3-new-worktree-choice-port.mjs
node scripts/verify-t3-port.mjs new-worktree-choice
node scripts/capture-t3-return-worktree-reference.mjs
node scripts/generate-t3-return-worktree-port.mjs
node scripts/verify-t3-port.mjs return-worktree
node scripts/capture-t3-model-swap-reference.mjs
node scripts/generate-t3-model-swap-port.mjs
node scripts/verify-t3-port.mjs model-swap
node scripts/capture-t3-reasoning-level-reference.mjs
node scripts/generate-t3-reasoning-level-port.mjs
node scripts/verify-t3-port.mjs reasoning-level
node scripts/capture-t3-fast-service-tier-reference.mjs
node scripts/generate-t3-fast-service-tier-port.mjs
node scripts/verify-t3-port.mjs fast-service-tier
node scripts/capture-t3-permission-choice-reference.mjs
node scripts/generate-t3-permission-choice-port.mjs
node scripts/verify-t3-port.mjs permission-choice
node scripts/capture-t3-sidebar-focus-reference.mjs
node scripts/generate-t3-sidebar-focus-port.mjs
node scripts/verify-t3-port.mjs sidebar-focus
node scripts/capture-t3-visual-context-shelf-reference.mjs
node scripts/generate-t3-visual-context-shelf-port.mjs
node scripts/verify-t3-port.mjs visual-context-shelf
node scripts/capture-t3-project-source-picker-reference.mjs
node scripts/generate-t3-project-source-picker-port.mjs
node scripts/verify-t3-project-source-picker-port.mjs
node scripts/capture-t3-thread-search-reference.mjs
node scripts/generate-t3-thread-search-port.mjs
node scripts/verify-t3-port.mjs thread-search
node scripts/capture-t3-thread-switch-reference.mjs
node scripts/generate-t3-thread-switch-port.mjs
node scripts/verify-t3-port.mjs thread-switch
node scripts/capture-t3-worked-trace-v0042-reference.mjs
node scripts/generate-t3-worked-trace-v0042-port.mjs
node scripts/verify-t3-worked-trace-v0042-port.mjs
node scripts/snapshot-t3-worked-trace-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-worked-trace
node scripts/publish-t3-worked-trace-v0042.mjs
node scripts/capture-t3-thread-actions-reference.mjs
node scripts/generate-t3-thread-actions-port.mjs
node scripts/verify-t3-thread-actions-port.mjs
node scripts/capture-t3-settle-thread-reference.mjs
node scripts/generate-t3-settle-thread-port.mjs
node scripts/verify-t3-settle-thread-port.mjs
node scripts/capture-t3-file-surface-reference.mjs
node scripts/generate-t3-file-surface-port.mjs
node scripts/verify-t3-file-surface-port.mjs
node scripts/capture-t3-source-file-open-reference.mjs
node scripts/generate-t3-source-file-open-port.mjs
node scripts/verify-t3-source-file-open-port.mjs
node scripts/capture-t3-terminal-check-reference.mjs
node scripts/generate-t3-terminal-check-port.mjs
node scripts/verify-t3-terminal-check-port.mjs
node scripts/capture-t3-commit-review-v0042-reference.mjs
node scripts/generate-t3-commit-review-v0042-port.mjs
node scripts/verify-t3-commit-review-v0042-port.mjs
node scripts/snapshot-t3-commit-review-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-commit-review
node scripts/publish-t3-commit-review-v0042.mjs
node scripts/capture-t3-project-action-reference.mjs
node scripts/generate-t3-project-action-port.mjs
node scripts/verify-t3-project-action-port.mjs
node scripts/capture-t3-prompt-send-reference.mjs
node scripts/generate-t3-prompt-send-port.mjs
node scripts/verify-t3-prompt-send-port.mjs
node scripts/capture-t3-agent-work-reference.mjs
node scripts/generate-t3-agent-work-port.mjs
node scripts/verify-t3-agent-work-port.mjs
node scripts/capture-t3-diff-review-reference.mjs
node scripts/generate-t3-diff-review-port.mjs
node scripts/verify-t3-diff-review-port.mjs
node scripts/snapshot-t3-diff-review-custom.mjs
node scripts/capture-t3-agent-answer-reference.mjs
node scripts/generate-t3-agent-answer-port.mjs
node scripts/verify-t3-agent-answer-port.mjs
node scripts/capture-t3-prompt-stash-v0042-reference.mjs
node scripts/generate-t3-prompt-stash-v0042-port.mjs
node scripts/verify-t3-prompt-stash-v0042-port.mjs
node scripts/snapshot-t3-prompt-stash-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-prompt-stash
node scripts/publish-t3-prompt-stash-v0042.mjs
node scripts/capture-t3-thread-rename-reference.mjs
node scripts/generate-t3-thread-rename-port.mjs
node scripts/verify-t3-thread-rename-port.mjs
node scripts/capture-t3-project-action-run-reference.mjs
node scripts/generate-t3-project-action-run-port.mjs
node scripts/verify-t3-project-action-run-port.mjs
node scripts/snapshot-t3-project-action-run-custom.mjs
node scripts/capture-t3-message-rewind-reference.mjs
node scripts/generate-t3-message-rewind-port.mjs
node scripts/verify-t3-message-rewind-port.mjs
node scripts/snapshot-t3-message-rewind-custom.mjs
node scripts/capture-t3-thread-pin-reference.mjs
node scripts/generate-t3-thread-pin-port.mjs
node scripts/verify-t3-thread-pin-port.mjs
node scripts/snapshot-t3-thread-pin-custom.mjs
node scripts/capture-t3-commit-creation-reference.mjs
node scripts/generate-t3-commit-creation-port.mjs
node scripts/verify-t3-commit-creation-port.mjs
node scripts/snapshot-t3-commit-creation-custom.mjs
node scripts/capture-t3-thread-snooze-reference.mjs
node scripts/generate-t3-thread-snooze-port.mjs
node scripts/verify-t3-thread-snooze-port.mjs
node scripts/snapshot-t3-thread-snooze-custom.mjs
node scripts/capture-t3-thread-archive-v0042-reference.mjs
node scripts/generate-t3-thread-archive-v0042-port.mjs
node scripts/verify-t3-thread-archive-v0042-port.mjs
node scripts/snapshot-t3-thread-archive-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-thread-archive
node scripts/publish-t3-thread-archive-v0042.mjs
node scripts/capture-t3-git-push-reference.mjs
node scripts/generate-t3-git-push-port.mjs
node scripts/verify-t3-git-push-port.mjs
node scripts/snapshot-t3-git-push-custom.mjs
node scripts/capture-t3-file-mention-v0042-reference.mjs
node scripts/generate-t3-file-mention-v0042-port.mjs
node scripts/verify-t3-file-mention-v0042-port.mjs
node scripts/snapshot-t3-file-mention-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-file-mention
node scripts/publish-t3-file-mention-v0042.mjs
node scripts/capture-t3-thread-unpin-v0042-reference.mjs
node scripts/generate-t3-thread-unpin-v0042-port.mjs
node scripts/verify-t3-thread-unpin-v0042-port.mjs
node scripts/publish-t3-thread-unpin-v0042.mjs
node scripts/capture-t3-thread-wake-v0042-reference.mjs
node scripts/generate-t3-thread-wake-v0042-port.mjs
node scripts/verify-t3-thread-wake-v0042-port.mjs
node scripts/snapshot-t3-thread-wake-v0042-custom.mjs
node scripts/install-t3-v0042-candidate-cli.mjs t3-thread-wake
node scripts/publish-t3-thread-wake-v0042.mjs
node scripts/capture-t3-project-local-open-reference.mjs
node scripts/generate-t3-project-local-open-port.mjs
node scripts/verify-t3-project-local-open-port.mjs
node scripts/snapshot-t3-project-local-open-custom.mjs
node scripts/capture-t3-thread-mark-unread-reference.mjs
node scripts/generate-t3-thread-mark-unread-port.mjs
node scripts/verify-t3-thread-mark-unread-port.mjs
node scripts/snapshot-t3-thread-mark-unread-custom.mjs
node scripts/capture-t3-project-switch-reference.mjs
node scripts/generate-t3-project-switch-port.mjs
node scripts/verify-t3-project-switch-port.mjs
node scripts/snapshot-t3-project-switch-custom.mjs
node scripts/capture-t3-thread-reorder-reference.mjs
node scripts/generate-t3-thread-reorder-port.mjs
node scripts/verify-t3-thread-reorder-port.mjs
node scripts/snapshot-t3-thread-reorder-custom.mjs
node scripts/capture-t3-visual-context-remove-reference.mjs
node scripts/generate-t3-visual-context-remove-port.mjs
node scripts/verify-t3-visual-context-remove-port.mjs
node scripts/snapshot-t3-visual-context-remove-custom.mjs
node scripts/sync-t3-gallery-fixtures.mjs <idea-id>
npm run optimize:thumbnails
```

The verifier runs the full HyperFrames check and strict render, then compares
all 120 PNG frames against the lossless native capture. The pin, frame scores,
and preview paths are recorded in each block's parity manifest. The
recordings under `parity/t3-gallery/` are internal reference material; only a block with a passing
manifest is installable.

The published v0.0.42 Commit Review, Worked Trace, Prompt Stash, File Mention, Thread Switch, Thread Rename, Thread Archive, Thread Wake, Open Local Project, Mark Thread Unread, Project Scope, and Visual Context Remove fixtures use
their `*-v0042-*` capture, generator, verifier, custom snapshot, CLI install,
and guarded publisher scripts. Unversioned scripts remain only as older
v0.0.35 workflows. Capture both
`T3_REFERENCE_THEME=dark` and `light`, verify with both `T3_VERIFY_THEME`
values, then run both `T3_CUSTOM_THEME` snapshots and the CLI check before
publishing. See `docs/T3_V0042_AUDIT.md` for the required evidence.

After a new block passes, run `npm run build:catalog`, `npm run sync:registry`,
and `npm run sync:catalog` in that order. The catalog builder discovers verified
T3 Code blocks by their `t3-code` tag.

`examples/t3-code-sequence/` preserves five installed v0.0.35 T3 Code blocks in one
HyperFrames timeline, with shared values matched across the cuts.
`examples/t3-code-agent-sequence/` joins the historical v0.0.35 Worked Trace and Thread Actions
with a measured boundary between their full-size workspace states.
`examples/t3-code-pin-unpin/` and `examples/t3-code-snooze-wake/` are pinned
v0.0.35 two-block timelines with measured cut frames. The standalone Thread
Pin and Thread Unpin blocks have since moved to v0.0.42; the old example source
remains frozen. The v0.0.42 Pin manifest includes a measured opt-in cut to the
new Unpin block in both desktop themes.

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
