# Snapcn source and license audit

All 48 free visual components have fixtures in `catalog/snapcn-fixtures.json`.
The source inventory is `catalog/snapcn-upstream.json`. The existing 47 fixtures
use `def45f50ff9b7ee7353be0a0bbf636c84b311cc0`; Capture Reveal uses
`f31be8a493cd836bbef36ac4f5a182fc40ee983e`. Asset records retain their original
provenance pins alongside the current source refresh. Closed Pro items are
excluded.

Forty-four ports use the merged preview configs at their recorded source pins,
including the shared speed control and minimum-speed overrides. Caret, Input,
and Pulsing Border are published registry components outside that preview map.
Their fixtures use their individual configs. No private source was accessed.

## October 7 public component update

Public main at
[`f31be8a4`](https://github.com/snapcndev/snapcn/commit/f31be8a493cd836bbef36ac4f5a182fc40ee983e)
adds Capture Reveal. The published free registry has 48 visual components and
one shared runtime. Existing component sources and configs are unchanged from
the October 2 pin, so their fixture pins and assets stay unchanged.

Capture Reveal preserves the merged preview config's seven controls and its
1280 × 720, 30 fps, 130-frame fixture. Its screenshot and two DM Sans font
binaries are frozen without modification. The optical-size font comes from
the source's exact Fontsource 5.3.0 URL and retains the OFL license. Installed
source resolves those public URLs to packaged files and preserves the source's
font loading, image dimensions, SVG measurements, and subpixel text blending.
This addition has no Paper shader dependency. The public `/r/capture-reveal.json`
source matches the pinned Git source apart from its attribution comment.

The existing 620 controls and Capture Reveal's seven controls total 627.
Its complete 130-frame CLI-installed strict render matches the pinned native
source byte for byte in RGBA, with SSIM 1. The full HyperFrames 0.8.99 check
passes without errors or exceptions. Its two authored overflow warnings remain
in the parity report. The source grid extends beyond the viewport and the
browser window exits through its bottom edge.

## October 2 source refresh

Public main at
[`def45f50`](https://github.com/snapcndev/snapcn/commit/def45f50ff9b7ee7353be0a0bbf636c84b311cc0)
changes three published components. Count Grid and Orb Swarm now derive their
page, text, and card colors from the shared theme and expose a light/dark `mode`
selector. Orb Swarm also mirrors its measured word tints on dark pages. Their
removed palette controls are replaced by the exact current merged `CONFIGS`
controls and defaults. Screen Recording gives its footage the same `speed` as
its camera through `playbackRate`. All 47 ports have been regenerated from that
source, including Studio wrappers, URL resolution, and cleanup changes that
were previously left at older pins. The fixtures contain 620 controls.

Screen Recording's current config points at the public CDN's Answer Stream
demo. Its bytes differ from the older repository demo, so both are retained
under separate filenames. The new port packages an sRGB metadata adaptation of
the current demo while preserving its BT.709 matrix, primaries, and limited
range. No video or audio is re-encoded; all 300 decoded RGB frames match the
current original exactly. The asset manifest records the source URL, config
pin, hashes, command, license, and installed notice.

Laptop Frame uses that same current Answer Stream file. Hero Launch packages
the current Moodboard Reveal and Orbit Gallery demos, with metadata-only sRGB
adaptations preserving all 900 decoded RGB frames. Logo Collapse uses its six
current CDN posters. Reel Collage's 14 default slides preserve the current
nested source defaults, including five newly frozen posters. Phone Frame's
current CDN URL resolves to the same bytes as its existing frozen sample.
The source audit compares all 23 unique default media URLs, used 40 times,
against their frozen originals.

## September 30 source refresh

A comparison against each recorded port pin found 25 changed component entry
files at public main
[`d4419a8c`](https://github.com/snapcndev/snapcn/commit/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3).
Nine contained new controls or behavior and used that source pin before the
October 2 refresh:

| Port               | Imported change                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Announce Title     | Adds `inkColor` for the eyebrow and macro shots.                                                                                   |
| Card Rail          | Replaces `images`, `titles`, `notes`, and `tags` with `cards`; handles empty decks and transparent backgrounds.                    |
| Channel Thread     | Replaces `script`, `people`, `beats`, `opens`, and `avatars` with `messages`; supports per-message metadata and schedule defaults. |
| Terminal Simulator | Uses readable command and argument ink in light mode; removes the stage for transparent backgrounds.                               |
| Follower Rush      | Removes the scene background for transparent themes while keeping avatar rings.                                                    |
| Prompt Send        | Removes the full-frame color wash for transparent themes.                                                                          |
| Moodboard Reveal   | Removes the dotted grid and adjusts intro text and marker ink when both page colors are transparent.                               |
| Roster Grant       | Removes the backdrop for transparent themes.                                                                                       |
| Orbit Gallery      | Removes the title scrim for transparent backgrounds and no longer requires CORS headers from image hosts.                          |

Orb Swarm is the tenth refreshed port. Its component and individual config bytes
are unchanged, but the current
[merged configs](https://github.com/snapcndev/snapcn/blob/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3/registry/__configs__.ts)
now expose shared `speed`, with default 1, minimum 0.25, maximum 4, and step 0.25.
Its source accepts but does not use this control. Hyfrme preserves that behavior.
All ten fixtures retain their dimensions, frame rate, duration, and recorded
render backgrounds. Controls and their defaults come from the current merged
configs. That refresh contained 623 controls; before it the fixtures
contained 628.

The other 16 changed entry files concerned Studio selection, media URLs and path
resolution, React type compatibility, or unused-code cleanup. Before October 2,
their recorded source pins remained unchanged. Upstream's
[`Item`](https://github.com/snapcndev/snapcn/blob/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3/registry/snap-cn-ui/core/item.tsx)
returns its child unchanged when
there is no Studio host, so these selection changes add no wrapper DOM to a
normal render. The October 2 refresh now includes those entry changes and the
current default media, rather than treating URL migrations as equivalent to
the older frozen demos.

Card Rail uses nine current `media.snapcn.dev` posters. Each differs from its
older frozen copy, so the new files use `-d4419a8c.webp` filenames and keep
separate hashes. Older ports retain their original files. During compilation,
Hyfrme's Card Rail adapter resolves a frozen asset through `staticFile(src)`
before the upstream resolver returns an absolute URL. This lets the installed
block load the packaged poster for a current CDN URL. The upstream TypeScript
file stays unchanged.

Four published selectors (`theme` in Follower Rush, Roster Grant, Karaoke
Captions, and Wordmark Cut) declare a light/dark string, while their source
components expect `theme` to be a token map. The port maps those selector values
to the source's `mode` prop. Object-valued API themes remain token maps. This
repairs the visible selectors without changing the upstream control names or
defaults; Karaoke Captions and Wordmark Cut keep their recorded source pins.

For the seven sources that now support transparent stages, an explicitly
transparent stage also clears Hyfrme's fixture backdrop. Moodboard's color
interpolation accepts `transparent` and preserves its zero alpha. The source
files and frozen media remain unchanged by these compatibility fixes.

The adapters preload frozen images, preserve synchronous native image decoding,
and register current-image readiness through HyperFrames' `hf-seek.waitUntil`.
Removed images and replaced URLs cannot fail later seeks. A canceled decode may
leave a fully loaded valid current image, which the adapter accepts as the source
renderer does. Authored image-error fallbacks remain available; unhandled decode
failures still fail the render.

All 47 ports have been regenerated and pass all 6,569 canonical lossless frames
with exact alpha, weighted mean SSIM 0.999827, and minimum frame SSIM 0.984636.
Each was installed through the CLI, checked with HyperFrames 0.8.99, and strictly
rendered. Thirty-nine full checks have no errors. The other eight retain only
the explicitly reviewed source findings recorded in
`catalog/snapcn-check-exceptions.json`. No lint or runtime errors remain.
Logo Collapse now also packages the Inter Tight 500 font referenced by its
source; its installed render no longer depends on that font being available
elsewhere.

The current reference uses Remotion 4.0.473 `angle-egl` and the same Chrome 152
executable as HyperFrames hardware rendering. A controlled transparent Prompt
frame matched RGB and alpha exactly with this backend; `swangle` changed 15,730
alpha pixels in that same source frame. The comparison setup now records its GL
backend in the parity manifests. Earlier 0.8.30 results below remain historical
evidence for their recorded source pins.

Sixteen additional nondefault-input cases cover colored announcement ink,
structured cards and messages, empty cards, the four theme selectors, light-mode
terminal ink, and seven transparent-stage inputs. Their 140 selected frames and
exact inputs are recorded in
[`parity/snapcn-variants/summary.json`](../parity/snapcn-variants/summary.json).
All sixteen were freshly installed through the CLI and captured after the
image-readiness and inherited-text-style fixes, using Remotion 4.0.473
`angle-egl`, HyperFrames 0.8.99 hardware rendering, and Chrome 152. Their original
source pins, props, settings, API overrides, backgrounds, and frame selections
are unchanged. The summary records installed file hashes, source hashes, and
capture provenance. All cases have zero lint/runtime errors and meet the RGB
thresholds; sampled layout and contrast findings remain recorded separately.

Terminal, Follower, Prompt, and Moodboard transparent samples also match alpha
exactly. The original capture profile passed thirteen of the sixteen cases.
These three historical failures led to the capture corrections below:

| Variant       | RGB mean / minimum  | Lowest RGB frame | Differing alpha pixels | Maximum alpha delta |
| ------------- | ------------------- | ---------------- | ---------------------- | ------------------- |
| Roster Grant  | 0.999907 / 0.999259 | 45               | 128                    | 1                   |
| Orbit Gallery | 0.999923 / 0.999866 | 296              | 6,609                  | 9                   |
| Card Rail     | 0.993093 / 0.988291 | 52               | 2,211                  | 255                 |

The alpha values above use the 0–255 channel scale and were measured directly
from the fresh PNG alpha planes. The summary records every mismatched selected
frame. Orbit's maximum alpha delta across its selected frames is 15, at frames
185 and 222.

These measurements used the default HyperFrames snapshot mode, which captures
the viewport without an explicit clip. The pinned Remotion reference uses an
explicit full-canvas clip with beyond-viewport capture. The public HyperFrames
options `--zoom 0,0,1280,720 --zoom-scale 1` match that capture region without
changing the viewport, source, or installed files. Repeating all 26 selected
frames in the three cases with those options gives:

| Variant       | RGB mean / minimum  | Exact alpha                                                         |
| ------------- | ------------------- | ------------------------------------------------------------------- |
| Roster Grant  | 1.000000 / 1.000000 | Yes, all eight frames                                               |
| Orbit Gallery | 0.999923 / 0.999866 | No, the same edge differences remain                                |
| Card Rail     | 1.000000 / 1.000000 | No, four frames each differ at one alpha pixel by one channel value |

This isolates the large Card discrepancy to the snapshot capture region.
Roster passes these selected comparisons. Card and Orbit retained residual
differences in this earlier profile. The settings, image hashes, installed-file
hashes, and every frame's result are recorded in
[`parity/snapcn-variants/clipped-capture.json`](../parity/snapcn-variants/clipped-capture.json).
No thresholds were relaxed. Selected-frame results do not replace the
full-duration canonical fixture checks.

A separate comparison used software GL and disabled GPU compositing in both
renderers. Transparent Roster matches RGB and alpha exactly at all eight selected
frames in that profile. Orbit and Card still fail exact alpha. The settings and
per-frame results are recorded in
[`parity/snapcn-variants/software-compositor.json`](../parity/snapcn-variants/software-compositor.json).
This earlier diagnosis confirms that the capture profile affects these
comparisons; it does not replace the hardware results or establish the cause of
the residual differences.

A fresh encoder diagnostic captured unchanged Card frame 26 and Orbit frame 148
through Remotion's public `renderStill` API in PNG, WebP, PNG order. Card's two
PNG captures differ at one alpha pixel by one channel value, demonstrating that
the source capture itself is not stable at that precision in this test. Orbit's
two PNG alpha planes, WebP alpha plane, and stored reference agree exactly; the
port still differs at 6,139 pixels with maximum alpha delta 9. This rules out
PNG encoding as the cause of Orbit's measured difference. WebP RGB is lossy and
was not used for parity. The capture settings and image hashes are recorded in
[`parity/snapcn-variants/encoder-diagnosis.json`](../parity/snapcn-variants/encoder-diagnosis.json).

The remaining differences were caused by the comparison setup. Orbit's host
clipped `html`, `body`, and `#root`; Remotion leaves those paint bounds visible.
Changing only the host to `overflow:visible` preserves the authored shadows and
removes Orbit's mismatch. Neither a root-only nor a document-only override is
enough. Card's rounded corners vary by one alpha value under hardware
rasterization. Passing `--disable-gpu-rasterization` to both browser executables
removes that instability while retaining hardware GL and GPU compositing.

`npm run verify:snapcn-transparency` now repeats each pinned source's complete
PNG sequence, installs a fresh CLI fixture, runs the full HyperFrames check,
and compares every frame with identical full-canvas capture bounds. It uses
the same explicit source API theme overrides as the earlier cases. The source
files, installed component runtime, shadows, and acceptance thresholds remain
unchanged.

| Variant       | Frames | RGB mean / minimum  | Exact alpha |
| ------------- | ------ | ------------------- | ----------- |
| Card Rail     | 108    | 1.000000 / 1.000000 | Yes         |
| Orbit Gallery | 300    | 1.000000 / 1.000000 | Yes         |

Both full-duration source alpha sequences also repeat exactly. The results,
source pins, fixture inputs, file hashes, and capture profile are recorded in
[`parity/snapcn-variants/transparent-full-duration.json`](../parity/snapcn-variants/transparent-full-duration.json).
Per-frame alpha hashes and SSIM logs accompany the report. Snapshot filenames
are normalized by their numeric frame index before comparison, because the
CLI's two-digit padding would otherwise sort frame 100 before frame 11.
These full-duration checks resolve the Card and Orbit transparency findings.
The earlier reports retain their original measurements; canonical default
fixture reports remain separate.

The ports now restore the retained source's layered and inherited
`text-rendering` styles instead of inheriting HyperFrames' host defaults. This
preserves the source's glyph rendering without changing the upstream component
files.

Six additional CLI-installed color cases exercise Moodboard Reveal and Text
Highlight with `navy`/`white`, blue/red HSL, and
`rgba(200, 100, 50, 0.3)`/`transparent`. All 26 selected frames meet the same RGB
thresholds and match alpha exactly. The three Text Highlight presets (`color`,
`marker`, and `underline`) match RGB exactly; Moodboard's lowest frame SSIM is
0.999764. The parser preserves the pinned source's 8-bit alpha quantization,
including a starting interpolated alpha of 0.302 for the RGBA input. Exact
settings, source pins, frame selections, expected colors, and check findings are
recorded in
[`parity/color-interpolation-inputs.json`](../parity/color-interpolation-inputs.json).
All six have zero lint/runtime errors. The deliberately translucent underline
case retains one source/input layout finding for fully transparent text and
seven contrast findings; its full check is not marked passing. These results
cover the selected inputs and frames, not every supported CSS color or the
full composition durations.

## Public catalog audit, September 30, 2026

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

The component-source comparison for this catalog audit used the preceding
public head, `f915a5f88771bae15b09f5ef8396d5542fe360ee`, rather than every
individual port pin. Existing component sources were unchanged between those
two heads. The 47 rebuilt public registry manifests changed their documentation
field without changing embedded source. The current port refresh above records
the older changes missed by that comparison.
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
The audit compared authored source with public head `98809254`, rather than
each older port pin. No authored component source changed between those public
heads. Fixture and parity pins were left unchanged at that time; the current
refresh above separately reviews the historical source differences.

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
Rail originally used the pinned repository's preview posters, and Logo Collapse
reuses its logo image. Card Rail's current CDN posters are frozen separately.
These additions introduce no shader dependency.

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

The 103 frozen source media files include all 24 follower avatars, 16 Orbit Gallery
photographs, and nine new Card Rail CDN posters. Repository media is copied
unchanged from the pinned MIT source. The current CDN poster binaries are absent
from the public Git tree; upstream's public
[render](https://github.com/snapcndev/snapcn/blob/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3/scripts/render-previews.mts)
and
[upload](https://github.com/snapcndev/snapcn/blob/d4419a8c0366c4d6d3bf44d803e54593e8dd4ac3/scripts/media-upload.mts)
scripts produce
these catalog demos. Their records preserve the CDN URLs, exact hashes, source
commit, and MIT notice. Upstream does not document separate rights or provenance
for these individual files. This audit records that limitation rather than
asserting independent ownership verification. The external Orbit photographs
come from Picsum's
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

Laptop Frame, Screen Recording, and Hero Launch install derived copies of the
current Answer Stream, Moodboard Reveal, and Orbit Gallery demos. Native Chrome
playback and decoded-frame injection otherwise use different color paths. The
derived copies declare sRGB transfer while preserving each original color
matrix and range. All 1,200 decoded RGB frames match their originals exactly,
with no video or audio re-encoding. Each copy carries its source and derived
hashes, normalization command, and installed notice. Earlier originals and
adaptations remain frozen under separate filenames. Reference renders use the
original selected by the fixture's current source URL.

The current Answer Stream demo contains 300 frames at 60 fps. Laptop Frame keeps
showing it after its five-second duration. Hyfrme freezes its final decoded RGB
sample as an sRGB PNG so a 30 fps extraction cannot hold the preceding sample.
The video bytes stay unchanged. The final sample, timing, extraction command,
source hash, and copied asset hash are recorded and checked independently.

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
All 620 fixture controls preserve the pinned source defaults, labels, options,
and numeric bounds. The config audit also checks the source frame rate,
dimensions, duration, and background.

This audit does not establish visual parity. Layout measurement, font loading,
video seeking, and shader readiness must also pass deterministic render checks.
Per-component results belong in `parity/snapcn-*.json`; only passing verified
components may enter the published catalog.

`npm run setup:snapcn` prepares each source pin, including the published-audit pin
used for shared preview CSS. Generation and verification
group fixtures by their recorded commit, preserving existing ports when new
components arrive. Pass `-- --only snapcn-roster-grant` to either npm command
to select a component.

Shared preview CSS comes from `publishedAudit.commit` in
`catalog/snapcn-upstream.json`, falling back to the inventory's base pin when no
published audit exists. This source is independent of `--only`, so generating an
older port preserves classes required by newer ports. `SNAPCN_SOURCE` overrides
the CSS checkout only when the selected fixtures use that same source pin.

Verification requires every decoded RGBA frame to match upstream exactly, with
SSIM 1. Per-frame RGB and alpha diagnostics accompany the complete RGBA hashes.
`npm run check` rejects an invisible frame, a one-channel pixel change, missing
frame evidence, and source files modified after verification.

Reviewed findings for authored clipped labels, overlays, and source palettes
retain exact selectors and source evidence in
`catalog/snapcn-check-exceptions.json`; the full findings remain in each parity
report. Those findings do not relax the pixel-equality requirement.

Screen Recording's audio control also declares the native video audio track for
HyperFrames exports. An installed fixture with a synthetic tone confirms that
`audio=true` exports audible AAC and `audio=false` exports without audio. The
media regression in `npm run check` checks audio intent, trim, playback rate,
and volume at the native video boundary.
