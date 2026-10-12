---
name: hyfrme
description: >
  Discover, customize, install, and wire Hyfrme motion components into a
  HyperFrames project. Use when building a HyperFrames video or scene that
  needs a ready-made text animation, transition, shader, icon, UI primitive,
  product-demo block, social card, data visualization, or official template.
---

# Hyfrme

Hyfrme is a copy-paste component catalog for HyperFrames. Components install
as local HTML, JavaScript, font, image, and license files. The project owns the
installed source.

## Prerequisite

For component installs, work inside a HyperFrames project containing `hyperframes.json`.
For a complete official template, use `hyfrme init` as shown below.

```bash
npx hyperframes@latest init my-video
cd my-video
```

## Discover a component

Browse the visual catalog at <https://hyfrme.vercel.app>. The machine-readable
registry is at <https://hyfrme.vercel.app/registry/registry.json>.

Use the catalog's source filter to browse Hyfrme originals, Remocn/Snapcn ports,
and the official HyperFrames catalog. Official names start with `hyperframes-`. Snapcn block
names start with `snapcn-`, such as `snapcn-phone-frame`; copy the exact catalog
name into the install command.

Choose the smallest component that serves the scene:

| Category   | Use for                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| Components | Text motion, transitions, product-demo blocks, social cards, and data scenes |
| Primitives | Timeline-driven UI states such as buttons, dialogs, menus, inputs, and flows |
| Shaders    | Full-frame procedural backgrounds and transitions                            |
| Icons      | Small animated interface and status symbols                                  |
| Templates  | Complete official HyperFrames projects initialized in a new folder           |

Do not stack components only because they are available. Match motion, palette,
and density to the composition's existing visual language.

## Install

```bash
npx hyfrme@latest add <component-name>
```

Examples:

```bash
npx hyfrme@latest add soft-blur-in
npx hyfrme@latest add screen-lift --set 'chat2Message=Made this with Hyfrme.'
npx hyfrme@latest add icon-check
npx hyfrme@latest add matrix-decode --set 'text=SHIPPED' --set 'color=#22c55e'
```

Use `npx hyfrme@latest add --all` only when the project genuinely needs the
set of blocks and reusable components; templates use `init` separately. Prefer
a small set of named components for focused videos.

Use `--dir <project>` when targeting another directory and `--force` only when
replacing an existing installation intentionally.

The CLI:

1. Reads `hyperframes.json`.
2. Resolves the project's block, component, and asset paths.
3. Validates every `--set` value against the component metadata.
4. Copies the component and all required assets and licenses.
5. Prints complete `data-composition-src` markup for the host composition.

## Official components and templates

```bash
npx hyfrme@latest add hyperframes-data-chart hyperframes-spring-pop
npx hyfrme@latest init hyperframes-product-promo --dir ./product-promo
```

Use the registry item's type to choose the install path:

- `hyperframes:block`: `add`, then use the printed composition markup and original ID.
- `hyperframes:component`: `add`, then paste the installed snippet's markup, styles,
  and script into the host scene. It has no independent canvas dimensions or duration.
- `hyperframes:example`: `init` in a chosen project folder, then run
  `npx hyperframes preview` there. Verify `index.html` and `hyperframes.json` exist.

Template initialization creates missing configuration and refuses conflicting files
unless `--force` is explicit. Video scaffold templates use the official no-video
10-second default and remove placeholder media. Decision Tree initialization includes
a renderer compatibility fallback for its measured label timing. Canonical registry sources and
licenses remain unchanged.

## Wire the installed block

Use the markup printed by the installer. A block mount follows this shape:

```html
<div
  id="soft-blur-in"
  data-composition-id="soft-blur-in"
  data-composition-src="compositions/soft-blur-in.html"
  data-start="0"
  data-duration="2"
  data-track-index="1"
  data-width="1280"
  data-height="720"
></div>
```

Give each mount a unique `data-composition-id`, place it on the intended timeline
track, and use the exact installed path printed by the CLI. Multiple mounts can
reuse one installed source. Do not guess dimensions or duration.

## Customize

Prefer the component page's controls when exploring. The page updates its URL,
preview, usage code, and install command together.

For agent-driven installs, inspect the registry item or installed composition's
`data-composition-variables` metadata before adding `--set` values. Never invent
variable names. `--set` supports declared composition variables; edit official CSS
parameters without such bindings directly in the source. Per-instance overrides remain available through
`data-variable-values`.

## Quality and attribution

- Use deterministic HyperFrames timing; do not add `Math.random()`, timers, or
  non-seekable animation around the installed block.
- For video-containing Snapcn blocks, render with `--video-frame-format png`
  to preserve the lossless video extraction used for parity verification.
- Preserve copied license and attribution files.
- Hyfrme includes original components and independent ports of Remocn and Snapcn.
  Official HyperFrames items are copied from pinned native sources with file hashes
  and original licenses. They do not claim port SSIM.
  Original components have installation and render checks, without an upstream
  parity comparison.
- Treat the website preview as a selection tool, then run `hyperframes check`
  after wiring the installed source into a real composition.
