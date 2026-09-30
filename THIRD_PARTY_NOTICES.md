# Third-party notices

## T3 Code reference assets

The internal reference archive at `parity/t3-gallery/` retains unmodified
OpenAI, Claude, OpenCode, Cursor, Grok, and Antigravity provider SVG marks from
the [T3 Code harness page](https://t3.codes/harnesses/). They identify the
providers illustrated in T3 Code. The marks remain the
property of their respective owners and do not ship with Hyfrme blocks.

The archived T3 wordmark is copied from
[T3Wordmark.tsx](https://github.com/pingdotgg/t3code/blob/f925d639421844f02b3166d29281905dbba6d529/apps/web/src/components/T3Wordmark.tsx).
The T3 Code frames and recordings at `parity/t3-gallery/t3-frames/` and
`parity/t3-gallery/t3-clips/` were captured from an isolated T3 Code v0.0.42
instance with synthetic Hyfrme content. T3 Code is
MIT-licensed, Copyright (c) 2026 T3 Tools Inc. Its complete license is
preserved at parity/t3-gallery/assets/T3-CODE-LICENSE.txt.

Installable blocks tagged `t3-code` use captured DOM and styles from the pinned
v0.0.42 build. Their installed files include the complete T3 Code MIT
license. The blocks include GSAP 3.14.2 for offline frame control under the
[GSAP Standard License](https://gsap.com/standard-license/); its source retains
the copyright notice.

The `t3-visual-context-shelf` block includes a still from Hyfrme's Logo Enter
port of Remocn. Its installed source preserves the Remocn license alongside
the T3 Code license.

The `t3-terminal-check` block also includes six captured Ghostty canvas stills
from the pinned T3 Code interaction. They preserve the terminal text and cursor
states in the default fixture; editable terminal content is rendered by the
installed HyperFrames source.

The `t3-file-surface` block includes the native file tree's shadow DOM and
styles from `@pierre/trees` 1.0.0-beta.4. Its installed files retain the
package's Apache-2.0 license and NOTICE, plus T3 Code's third-party notices
for the file icons.

The `t3-source-file-open` block also includes the native source editor's
shadow DOM and styles from `@pierre/diffs` 1.3.0-beta.10. Its installed files
retain the Apache-2.0 license for that package, the file tree's license and
NOTICE, and T3 Code's third-party notices for the file icons.

The `t3-commit-review` block includes T3 Code's native Git review dialog and
file icon. Its installed files retain T3 Code's third-party icon notice.

## Remocn source reference

The original 271 Remocn visual ports are derived from pinned Remocn implementations. Of these,
233 use commit `ea730a20b4ab09430ee7292aebc847c002375151`, 19 use commit
`32d10122d269bd3f8a1cfbc9bc89c8df4be7ff3c`, and three use commit
`16eef5d3727eb258ce345a305d67a86eeca02908`. The 16 canvas transitions,
filters, and effects use commit `92d7d1f2805ca9c05d5d117083e22577ecab70df`.
Every generated port names its
exact source file and fixture in its parity manifest.

The September 8 additions use commit
`3e03565f5c0001e143c2ed941eea7c3181f13260`. Their exact fonts, Stage image,
source URLs, hashes, and license notices are recorded in
`assets/remocn-additions/manifest.json`. The new ports retain complete source
and dependency licenses. Anton, Passion One, and Geist use OFL-1.1; Stretch In
also includes opentype.js 2.0.0 under MIT.

Copyright (c) 2026 Remocn

Licensed under the MIT License. The full upstream license is available at
<https://github.com/Remocn/remocn/blob/main/LICENSE>.

The full Remocn MIT notice is also preserved inside every generated port that
contains derived source.

## Snapcn source reference

Snapcn ports derive from `snapcndev/snapcn` at commit
`353803b506dba0cb7ca13bb45b0d099690400815`. Roster Grant and Wordmark Cut use
`bc5b59f3f0fad9657b338fa62349a55fa33f160f`. Roster Grant's attributed Lucide
pointer path retains its ISC notice.
Word Gather, Word Wheel, Channel Thread, Logo Collapse, and Card Rail use
`1159369742d75d66ae89b3f83d45850861ccc63e`.
Status Cycle uses `0b30e76a3d1e4c9a49390d109a9630b118b1e100`.

Copyright (c) 2026 Sri Nath (snap-cn).

The full MIT license ships inside each generated runtime and installs at
`THIRD_PARTY_LICENSES/snapcn/Snapcn-MIT.txt`. Each block records its exact
source and bundled dependencies. Font licenses, dependency licenses, and media
credits install alongside it. Orbit Gallery photographs retain the Unsplash
license and photographer credits; they are not licensed under MIT.

Snapcn's Pulsing Border uses Paper source from Apache-2.0 commit
`f9f2a8b2edeb78ec59256c4dc571f5eaf943d798`, verified byte-for-byte against the
required upstream runtime sources. It does not bundle the PolyForm-licensed
npm archive. Its full Apache license and provenance record install with the block.

See [the source and license audit](docs/SNAPCN_AUDIT.md) and
`assets/snapcn/manifest.json` for the complete frozen asset and license inventory.

## Remocn showcase source

The six showcase films are HyperFrames translations of source published in
`Remocn/remocn-collections`. Remocn's product site describes the project as
MIT-licensed, and the collection README expressly presents every demo as
reusable and installable into another project. The collection repository does
not contain a separate `LICENSE` file at the pinned commits.

Copyright (c) 2026 Remocn

Each translated film records its exact upstream commit and source path in
`catalog/showcases.json` and its parity manifest. See
<https://github.com/Remocn/remocn-collections> and
<https://www.remocn.dev/>.

## Paper Shaders

Twenty-seven shader and shader-transition runtimes bundle
`@paper-design/shaders-react` 0.0.76.

Paper Shaders is licensed under the PolyForm Shield License 1.0.0, not MIT.
Affected registry items declare `MIT + PolyForm Shield 1.0.0`, preserve a
runtime notice, and install the complete terms at
`THIRD_PARTY_LICENSES/Paper-Shaders-POLYFORM-SHIELD-1.0.0.md`. The source copy is
also preserved at
`assets/licenses/Paper-Shaders-POLYFORM-SHIELD-1.0.0.md`.

## React and ReactDOM

The compiled typography/effect, composition/data, and UI primitive runtimes
bundle React and ReactDOM 19.2.4.

Copyright (c) Meta Platforms, Inc. and affiliates.

Licensed under the MIT License. Esbuild preserves the upstream React license
notices inside every generated runtime. The full license is available at
<https://github.com/facebook/react/blob/main/LICENSE>.

## Remotion reference tooling

Remotion is used only to render the pinned reference videos in the local parity
bench. Remotion code is not bundled into Hyfrme's published blocks. Remotion has
its own license terms, available at
<https://github.com/remotion-dev/remotion/blob/main/LICENSE.md>.

## Geist font

Copyright (c) 2023 Vercel, in collaboration with basement.studio.

Geist is licensed under the SIL Open Font License, Version 1.1. The bundled
font is unmodified. The full license is preserved at
`assets/fonts/Geist-OFL.txt` and installs with each compiled block.

## JetBrains Mono font

Copyright (c) 2020 The JetBrains Mono Project Authors.

JetBrains Mono is licensed under the SIL Open Font License, Version 1.1. The
bundled Latin variable font is unmodified, and its full license is preserved at
`assets/fonts/JetBrainsMono-OFL.txt`.

## Inter, Manrope, and Geist Mono fonts

The AI and social compositions bundle unmodified normal Latin variable fonts
from Google Fonts. Inter, Manrope, and Geist Mono are each licensed under the
SIL Open Font License, Version 1.1. Their complete terms are preserved at
`assets/fonts/Inter-OFL.txt`, `assets/fonts/Manrope-OFL.txt`, and
`assets/fonts/GeistMono-OFL.txt`, and install with each block that uses them.

## Caveat font

The hand-drawn compositions bundle the unmodified normal Latin Caveat variable
font from Google Fonts. Caveat is licensed under the SIL Open Font License,
Version 1.1. Its complete terms are preserved at
`assets/fonts/Caveat-OFL.txt` and install with each block that uses it.

## date-fns

The `github-stars` runtime bundles date-fns 4.1.0 under the MIT License.
Its complete license installs at `THIRD_PARTY_LICENSES/Date-Fns-MIT.md` and is
preserved at `assets/licenses/Date-Fns-MIT.md`.

## Official HyperFrames catalog

The `hyperframes-*` blocks, HTML components, and templates are copied from
[heygen-com/hyperframes at daa44fcd753d9055aa3c954ad74f09a4e4389780](https://github.com/heygen-com/hyperframes/tree/daa44fcd753d9055aa3c954ad74f09a4e4389780/registry).
The original catalog source is Apache 2.0 licensed. Each item includes the exact
root license, installed at `THIRD_PARTY_LICENSES/hyperframes/LICENSE`, and its
per-item third-party license/notice files. Vendored dependencies keep their own
licenses, including the GSAP Standard License and three.js MIT license. See the
[pinned upstream credits](https://github.com/heygen-com/hyperframes/blob/daa44fcd753d9055aa3c954ad74f09a4e4389780/CREDITS.md).

Hosted source assets are frozen locally and verified against their content-addressed
URLs. Original and installed names, file targets, hashes, and collision
avoidance targets for Whip Pan, Code Morph, and template documentation are recorded in `catalog/hyperframes-upstream.json`.
