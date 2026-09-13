# Snapcn source and license audit

Snapcn's original 37 ports retain commit
`353803b506dba0cb7ca13bb45b0d099690400815`. Roster Grant and Wordmark Cut use
`bc5b59f3f0fad9657b338fa62349a55fa33f160f`, checked on September 8, 2026.
Word Gather, Word Wheel, Channel Thread, Logo Collapse, and Card Rail use
`1159369742d75d66ae89b3f83d45850861ccc63e`, checked on September 12, 2026.
All 44 free visual components have fixtures in `catalog/snapcn-fixtures.json`.
The source inventory is `catalog/snapcn-upstream.json`.

The 41 entries in the merged preview registry retain its exact control defaults,
shared speed control, and minimum-speed overrides. Caret, Input, and Pulsing
Border are published registry components outside that preview map. Their fixtures
use their individual configs. No private source was accessed.

## Published coverage, September 12, 2026

The [published registry](https://snapcn.dev/r/registry.json) lists 44 free visuals,
14 Pro visuals, and one shared runtime item. The public repository at
[`1159369742d75d66ae89b3f83d45850861ccc63e`](https://github.com/snapcndev/snapcn/commit/1159369742d75d66ae89b3f83d45850861ccc63e)
adds Word Gather, Word Wheel, Channel Thread, Logo Collapse, and Card Rail.
All five have source in the public Git tree and their `/r/<name>.json` endpoints
returned HTTP 200 with source content. Previously ported component sources are
unchanged since the September 9 audit at `099cb549`. Existing fixture pins and
render evidence remain unchanged.

The 14 Pro entries are Agent Chat, Agent Open, App Reveal, Chat Thread, LCD Type,
Manifesto, Phrase Swarm, Read Through, Sentence Set, Showcase Drift, Stretch Word,
Version Drop, Word Rush, and Word Settle. All are marked `access: "pro"`; their
advertised source files are absent from the public Git tree. Every corresponding
`/r/<name>.json` endpoint returned HTTP 402 with `error: "pro_component"`.

The [upstream registry route](https://github.com/snapcndev/snapcn/blob/1159369742d75d66ae89b3f83d45850861ccc63e/app/r/%5Bfile%5D/route.ts)
documents that Pro source stays outside the public repository. Its MIT license
does not establish redistribution rights for that unavailable private source.
Hyfrme excludes those 14 entries. The separate `publishedAudit` record in
`catalog/snapcn-upstream.json` preserves the published counts, source paths,
endpoint results, and source URLs alongside the pinned port inventory.

Dimensions, frame rate, duration, props, and background come from those configs.
The reference stage inherits Geist and defines `--font-geist-sans`, matching
Snapcn's own preview render root. Missing backdrops remain transparent. Input
also requires the upstream Tailwind utility styles.

## Copyright and licenses

Snapcn's source uses the MIT license with the notice
`Copyright (c) 2026 Sri Nath (snap-cn)`. Its complete license is preserved in
`assets/snapcn/SNAPCN-LICENSE.txt`; generated blocks install the complete text
and retain it in their JavaScript banner. The source grant is available at the
[pinned license](https://github.com/snapcndev/snapcn/blob/353803b506dba0cb7ca13bb45b0d099690400815/LICENSE).

`assets/snapcn/manifest.json` records source URLs, SHA256 hashes, and license paths
for every frozen font and media file. It also records the versions and complete
license files of bundled React, Tailwind CSS 4.3.2, and utility dependencies. The
complete Tailwind Labs MIT notice accompanies its compiled preflight and utility
styles. Installed block license
expressions include the terms of their bundled dependencies, fonts, and media.

Roster Grant includes an attributed Lucide pointer path. Its complete ISC notice
ships with that block. Roster Grant and Wordmark Cut reuse frozen Inter fonts
and introduce no new media or shader dependency.

The September 12 additions use Figtree, Jost, Barlow, and Inter Tight, each under
OFL-1.1. Channel Thread reuses two frozen avatar images. Logo Collapse and Card
Rail use the pinned repository's preview posters, and Logo Collapse reuses its
logo image. These additions introduce no shader dependency.

The 14 font families use unmodified Latin binaries selected from
`@remotion/google-fonts@4.0.473` metadata. Twenty-four unique binaries cover all
recorded styles and weights. Each family retains its original license text.
Ultra is Apache-2.0 and retains Brian J. Bonislawsky's copyright notice. The other
families use OFL-1.1. Google Sans was checked against Google's official font
download license rather than assuming its older proprietary terms still apply.
The port uses `Hyfrme Snapcn ...` CSS family aliases to avoid collisions with
fonts in a host composition. The font binaries and their embedded names remain
unchanged; public customization labels retain the original family names.

The 89 frozen media files include all 24 follower avatars and 16 Orbit Gallery
photographs. Repository media is copied unchanged from the pinned MIT source;
upstream does not document separate rights or provenance for those individual
files. This audit records that limitation rather than asserting independent
ownership verification. The external Orbit photographs come from Picsum's
Unsplash collection. Each records its photographer, original image URL, and
[Unsplash license](https://unsplash.com/license). They are identified as
`LicenseRef-Unsplash`, not MIT.

Phone Frame installs one derived sample video with sRGB transfer tags. This is a
stream-copy metadata change, with no video or audio re-encoding. All 201 decoded
RGB frames match the frozen original exactly. It prevents PNG color metadata
from changing the RGB values displayed by HyperFrames compared with Remotion's
unprofiled BMP frames. The original remains frozen and supplies the reference
render. Both hashes, the command, pixel-comparison evidence, and an installed
adaptation notice are recorded in the asset manifest.

Laptop Frame, Screen Recording, and Hero Launch also install derived copies of
`answer-stream.mp4`, `moodboard-reveal.mp4`, and `orbit-gallery.mp4`. Their source
videos leave transfer and color primaries unspecified. Native Chrome playback
darkens those videos compared with the reference's decoded RGB. The derived
copies declare sRGB transfer and Rec.709 primaries while retaining the original
BT.601 color matrix and full-range values. All 1,200 decoded RGB frames match
their originals exactly, with no video or audio re-encoding. Each copy carries
its source and derived hashes, normalization command, and an installed notice.
The original files continue to supply reference renders.

## Paper shader license

Snapcn pins Paper Shaders 0.0.76. That npm archive contains PolyForm Shield terms,
which restrict competing products. Those terms are not used to authorize
Hyfrme's distribution.

Paper subsequently published the required source under Apache-2.0. The audited
pin is [commit f9f2a8b2](https://github.com/paper-design/shaders/commit/f9f2a8b2edeb78ec59256c4dc571f5eaf943d798),
where the root license and both package-local licenses explicitly grant
Apache-2.0. The earlier root-only license change is insufficient evidence because
the nested package licenses still contained PolyForm terms.
The 13 runtime source files needed by Pulsing Border match the pinned npm source
maps byte for byte. Those Apache source files, their license, and the comparison
record are frozen under `assets/snapcn/paper-shaders/`. A supporting type-only
file is also copied from that commit. The port generator resolves Paper imports
to these frozen sources and rejects any Paper npm module in its build inputs.
Installed shader blocks retain the Apache license, provenance record, and a
notice describing Hyfrme's compilation and runtime adaptations. The original
project contains no separate NOTICE file at the audited commit.
During compilation, Hyfrme removes the shader mount's wall-clock update branch
and animation-frame scheduler, holds speed at zero, and supplies explicit frame
updates. The source shader's `u_time` calculation is preserved. The frozen
upstream TypeScript files remain unchanged.

## Verification boundary

Run `node scripts/validate-snapcn.mjs` for the offline inventory and license audit.
It checks fixture and generated-block coverage, asset and license hashes, Apache
source hashes, full installed copyright notices, declared dependency versions,
combined license expressions, and whether referenced assets are installed.
The audit covers generated blocks and frozen font/media assets, including the
original and derived videos. It checks the derived videos' actual
transfer, matrix, and primaries metadata with `ffprobe` to prevent browser color
regressions.
All 608 fixture controls preserve the pinned source defaults, labels, options,
and numeric bounds. The config audit also checks the source frame rate,
dimensions, duration, and background.

This audit does not establish visual parity. Layout measurement, font loading,
video seeking, and shader readiness must also pass deterministic render checks.
Per-component results belong in `parity/snapcn-*.json`; only passing verified
components may enter the published catalog.

`npm run setup:snapcn` prepares each source pin. Generation and verification
group fixtures by their recorded commit, preserving existing ports when new
components arrive. Pass `-- --only snapcn-roster-grant` to either npm command
to select a component.

Verification compares every frame's RGB with SSIM and requires exact alpha-plane
matches. Per-frame alpha hashes accompany the parity reports, so transparent
output cannot pass on RGB alone. `npm run check` includes a regression that
rejects an invisible frame with unchanged RGB.

The five September 12 additions pass all 385 lossless frame comparisons, with
weighted mean SSIM 0.998264, minimum 0.988421, and exact alpha. All five pass
strict rendering after CLI installation. Four pass the full HyperFrames check
without errors. Word Wheel retains one reviewed layout finding: adjacent reel
text boxes overlap in the unmodified upstream animation. Its exact source pin,
selectors, and comparison evidence are recorded in
`catalog/snapcn-check-exceptions.json` and its parity report.

Screen Recording's audio control also declares the native video audio track for
HyperFrames exports. An installed fixture with a synthetic tone confirms that
`audio=true` exports audible AAC and `audio=false` exports without audio. The
media regression in `npm run check` checks audio intent, trim, playback rate,
and volume at the native video boundary.
