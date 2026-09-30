# Snapcn source and license audit

Snapcn's original ports other than Status Cycle retain commit
`353803b506dba0cb7ca13bb45b0d099690400815`. Roster Grant and Wordmark Cut use
`bc5b59f3f0fad9657b338fa62349a55fa33f160f`, checked on September 8, 2026.
Word Gather, Word Wheel, Channel Thread, Logo Collapse, and Card Rail use
`1159369742d75d66ae89b3f83d45850861ccc63e`, checked on September 12, 2026.
Status Cycle uses `0b30e76a3d1e4c9a49390d109a9630b118b1e100`, checked on
September 17, 2026. Its label roll now takes 0.5 seconds, with 30 frames between
statuses and a 198-frame fixture. Reel Collage uses
`7fd048cc7eee397a0e6cb1353c1537aefd245e2c`, checked on September 24, 2026.
Orb Swarm uses `98809254aa239edfd04119336ff6a774a2df776d`, checked on
September 27, 2026. Other component pins remain unchanged.
Check Cycle uses `d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3`, checked on
September 30, 2026. Existing component pins remain unchanged.
All 47 free visual components have fixtures in `catalog/snapcn-fixtures.json`.
The source inventory is `catalog/snapcn-upstream.json`.

The 44 entries in the merged preview registry retain its exact control defaults,
shared speed control, and minimum-speed overrides. Caret, Input, and Pulsing
Border are published registry components outside that preview map. Their fixtures
use their individual configs. No private source was accessed.

## Latest public audit, September 30, 2026

Public main at
[`d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3`](https://github.com/snapcndev/snapcn/commit/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3)
adds [Check Cycle](https://snapcn.dev/docs/text/check-cycle). The live and authored
registries contain 48 items: 47 free visuals and one shared runtime. Check Cycle's
fixture preserves the official 1280×720 canvas, 30 fps, 136-frame duration, light
theme, headline, word list, and shared speed control. It is grouped under
Typography / Dynamic Text in Hyfrme.

The exact Inter 3.19 font loaded by upstream's `FontFace` is frozen with its
OFL-1.1 notice. The port resolves it through the local asset map and scopes its
font name to Hyfrme; the reference loads the same unchanged binary. All 136
frames pass SSIM (mean 0.999991, minimum 0.999986) with identical alpha. The
installed block passes the full HyperFrames 0.8.30 check with no errors or warnings.
Upstream's shared speed control is present but unused by this component's source;
Hyfrme preserves that behavior.

Existing component source files are unchanged. The 47 rebuilt public registry
manifests changed their documentation field without changing embedded source.
The 51 advertised Pro components remain unavailable: their public source is absent,
and all unauthenticated component endpoints return HTTP 402. The current
`publishedAudit` records those results separately from the pinned port inventory.

Snapcn Pro stays excluded. Paid access alone does not make an item eligible for
Hyfrme; reconsider an item only if upstream publishes its source under a compatible
open-source license.

## Public audit, September 29, 2026

Public main remains
[`f915a5f88771bae15b09f5ef8396d5542fe360ee`](https://github.com/snapcndev/snapcn/commit/f915a5f88771bae15b09f5ef8396d5542fe360ee).
The [live registry](https://snapcn.dev/r/registry.json) and authored free registry
both contain 47 items: 46 visual components and one shared runtime. All 46 visuals
are ported. The site advertises 43 free preview components; Caret, Input, and
Pulsing Border account for the additional public visuals outside that preview map.
No authored component source changed after the Orb Swarm port at `98809254`.
Existing fixture and parity pins remain unchanged.

The latest generated `/r/orb-swarm.json` adds the -12° constellation turn that
was already present in the authored source at our port pin. Its current embedded
source matches that pinned authored source apart from an attribution comment.
This registry rebuild requires no composition change.

The [public Pro index](https://github.com/snapcndev/snapcn/blob/f915a5f88771bae15b09f5ef8396d5542fe360ee/lib/pro-catalogue.json)
and [live Pro page](https://snapcn.dev/pro) list 51 components. These are omitted
from the current public `/r/registry.json`; only their names and descriptions
are public. No Pro source is present in the public Git tree. All 51 unauthenticated
component endpoints returned HTTP 402 with `error: "pro_component"`.
The [registry route](https://github.com/snapcndev/snapcn/blob/f915a5f88771bae15b09f5ef8396d5542fe360ee/app/r/%5Bfile%5D/route.ts)
returns HTTP 200 to the shadcn User-Agent with an empty `files` array and upgrade
instructions. That response contains no source; Manifesto confirmed this behavior.
All 51 Pro components remain excluded, and `publishedAudit` records their endpoint
results separately from the pinned port inventory.

## Reel Collage, September 24, 2026

The [live registry](https://snapcn.dev/r/registry.json) has 45 free visuals.
[Reel Collage](https://github.com/snapcndev/snapcn/commit/7fd048cc7eee397a0e6cb1353c1537aefd245e2c)
is the new public source. Its eight reel posters and six collage posters are
frozen locally. The Status Cycle poster changed since the older ports, so Reel
Collage bundles the image from its own source pin without changing those ports.
The Pro catalogue remains excluded because its source is private.

## Orb Swarm, September 27, 2026

The [live registry](https://snapcn.dev/r/registry.json) has 46 free visuals.
[Orb Swarm](https://github.com/snapcndev/snapcn/commit/98809254aa239edfd04119336ff6a774a2df776d)
is public and its [`/r/orb-swarm.json` endpoint](https://snapcn.dev/r/orb-swarm.json)
returns HTTP 200. The pinned source includes the measured -12° constellation
turn added after the initial component commit. Its Inter Tight 500 Latin font
is frozen locally under its OFL license. The block uses no external image or
video assets; Pro sources remain excluded.

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
`@remotion/google-fonts@4.0.473` metadata, with a separate Inter 3.19 face from
the exact Fontsource URL used by Check Cycle. Twenty-six unique binaries cover
all recorded styles and weights. Each family retains its original license text.
Ultra is Apache-2.0 and retains Brian J. Bonislawsky's copyright notice. The other
families use OFL-1.1. Google Sans was checked against Google's official font
download license rather than assuming its older proprietary terms still apply.
The port uses `Hyfrme Snapcn ...` CSS family aliases to avoid collisions with
fonts in a host composition. The font binaries and their embedded names remain
unchanged; public customization labels retain the original family names.

The 93 frozen source media files include all 24 follower avatars and 16 Orbit Gallery
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
All 623 fixture controls preserve the pinned source defaults, labels, options,
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

The September 17 Status Cycle update passes all 198 lossless frame comparisons
with mean SSIM 0.999992, minimum 0.999936, and exact alpha. Its CLI-installed
fixture passes strict rendering. The full check reports three reviewed overlaps
between animated prefix glyphs and the clipped pill label, also present in the
pinned source. Exact selectors and source evidence are recorded in
`catalog/snapcn-check-exceptions.json`; the full findings remain in its parity
report.

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
