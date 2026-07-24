---
name: hyfrme
description: >
  Discover, customize, install, and wire Hyfrme motion components into a
  HyperFrames project. Use when building a HyperFrames video or scene that
  needs a ready-made text animation, transition, shader, icon, UI primitive,
  product-demo block, social card, or data visualization.
---

# Hyfrme

Hyfrme is a copy-paste component catalog for HyperFrames. Components install
as local HTML, JavaScript, font, image, and license files. The project owns the
installed source.

## Prerequisite

Work inside a HyperFrames project containing `hyperframes.json`.

```bash
npx hyperframes@latest init my-video
cd my-video
```

## Discover a component

Browse the visual catalog at <https://hyfrme.vercel.app>. The machine-readable
registry is at <https://hyfrme.vercel.app/registry/registry.json>.

Choose the smallest component that serves the scene:

| Category   | Use for                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| Components | Text motion, transitions, product-demo blocks, social cards, and data scenes |
| Primitives | Timeline-driven UI states such as buttons, dialogs, menus, inputs, and flows |
| Shaders    | Full-frame procedural backgrounds and transitions                            |
| Icons      | Small animated interface and status symbols                                  |

Do not stack components only because they are available. Match motion, palette,
and density to the composition's existing visual language.

## Install

```bash
npx hyfrme@latest add <component-name>
```

Examples:

```bash
npx hyfrme@latest add soft-blur-in
npx hyfrme@latest add icon-check
npx hyfrme@latest add matrix-decode --set 'text=SHIPPED' --set 'color=#22c55e'
```

Use `npx hyfrme@latest add --all` only when the project genuinely needs the
entire catalog; prefer a small set of named components for focused videos.

Use `--dir <project>` when targeting another directory and `--force` only when
replacing an existing installation intentionally.

The CLI:

1. Reads `hyperframes.json`.
2. Resolves the project's block, component, and asset paths.
3. Validates every `--set` value against the component metadata.
4. Copies the component and all required assets and licenses.
5. Prints complete `data-composition-src` markup for the host composition.

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

Keep `data-composition-id` aligned with the installed block, place the mount on
the intended timeline track, and use the exact installed path printed by the
CLI. Do not guess dimensions or duration.

## Customize

Prefer the component page's controls when exploring. The page updates its URL,
preview, usage code, and install command together.

For agent-driven installs, inspect the registry item or installed composition's
`data-composition-variables` metadata before adding `--set` values. Never invent
variable names. Per-instance overrides remain available through
`data-variable-values`.

## Quality and attribution

- Use deterministic HyperFrames timing; do not add `Math.random()`, timers, or
  non-seekable animation around the installed block.
- Preserve copied license and attribution files.
- Hyfrme ports Remocn components but is an independent HyperFrames project.
- Treat the website preview as a selection tool, then run `hyperframes check`
  after wiring the installed source into a real composition.
