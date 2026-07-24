# Hyfrme

Hyfrme is a copy-paste component catalog for HyperFrames. It ports Remocn
motion into standalone HTML blocks, lets users customize supported variables
in the browser, and installs the selected source into their project.

## Product rules

- Users own the installed source; do not turn Hyfrme into a runtime dependency.
- The website, CLI, registry manifest, and installed files must describe the
  same component names and variables.
- Keep Hyfrme's own identity while preserving required Remocn attribution.
- A port is verified by deterministic renders and SSIM, never by visual
  inspection alone.

## Repository map

- `registry/blocks/` — installable source and per-component manifests.
- `parity/` — pinned upstream fixtures and visual comparison results.
- `public/previews/` — reference, HyperFrames, and thumbnail renders.
- `src/` — the Vite catalog and browser customizer.
- `cli/` — the `hyfrme` npm CLI.
- `skills/hyfrme/` — user-facing agent instructions.

## Workflows

Start with the `hyperframes` skill before changing a composition. Use
`remotion-to-hyperframes` for ports and `hyperframes-registry` for registry or
installer metadata.

After editing a composition:

1. Render the pinned Remocn fixture.
2. Run the full HyperFrames check on the installed block fixture.
3. Render Hyfrme with identical dimensions, fps, duration, and inputs.
4. Recompute SSIM and update the parity manifest and artifacts.
5. Run `npm run check` and `npm run build`.

For website, documentation, CLI, or agent-skill-only changes, run:

```bash
npm run check
npm run build
npm pack ./cli --dry-run
```

Keep generated registry and catalog artifacts synchronized. Preserve
third-party notices, license files, and the exact pinned upstream commit.
