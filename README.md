# Hyfrme

Hyfrme is a copy-paste motion library for
[HyperFrames](https://hyperframes.heygen.com/). Browse 271 components,
customize one in the browser, then copy it into your project with one command.
You own the installed HTML, JavaScript, fonts, and assets.

## Why Hyfrme

- **Customize before you install.** Every component page turns supported
  variables into live controls and updates the command for your version.
- **Own the code.** Components are copied into your project instead of hidden
  behind a runtime dependency.
- **Verified motion.** Every port is rendered against its pinned
  [Remocn](https://github.com/Remocn/remocn) source and published only after
  passing the repository's visual parity checks.

## Installation

Start inside a HyperFrames project, then add any component from the
[catalog](https://hyfrme.vercel.app):

```bash
npx hyfrme@latest add soft-blur-in
```

Install the full catalog when you want every block available locally:

```bash
npx hyfrme@latest add --all
```

Changed values from the browser are installed as the component's new defaults:

```bash
npx hyfrme@latest add matrix-decode \
  --set 'text=HELLO WORLD' \
  --set 'fontSize=31' \
  --set 'color=#22c55e'
```

The CLI respects the paths in `hyperframes.json`, copies every required file,
and prints the markup needed to mount the component.

## Setup with AI

Install the Hyfrme skill so your coding agent can discover, install, and wire
components correctly:

```bash
npx skills@latest add AksharP5/hyfrme --yes
```

Then ask:

```text
Use Hyfrme to add a motion component that fits this scene, customize it to the
project's visual style, and wire it into my HyperFrames composition.
```

## Develop locally

```bash
npm install
npm run dev
```

Before contributing:

```bash
npm run check
npm run build
```

Composition ports follow the parity workflow in
[`docs/PORTING.md`](docs/PORTING.md). Contributor-specific agent instructions
live in [`AGENTS.md`](AGENTS.md).

## Attribution

Hyfrme is an independent project, not an official Remocn or HyperFrames
project. Ported source remains attributed to its upstream implementation. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

MIT licensed.
