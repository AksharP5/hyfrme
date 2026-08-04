# Third-party notices

## Remocn source reference

All 271 visual ports are derived from pinned Remocn implementations. Of these,
233 use commit `ea730a20b4ab09430ee7292aebc847c002375151`, 19 use commit
`32d10122d269bd3f8a1cfbc9bc89c8df4be7ff3c`, and three use commit
`16eef5d3727eb258ce345a305d67a86eeca02908`. The 16 canvas transitions,
filters, and effects use commit `92d7d1f2805ca9c05d5d117083e22577ecab70df`.
Every generated port names its
exact source file and fixture in its parity manifest.

Copyright (c) 2026 Remocn

Licensed under the MIT License. The full upstream license is available at
<https://github.com/Remocn/remocn/blob/main/LICENSE>.

The full Remocn MIT notice is also preserved inside every generated port that
contains derived source.

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
