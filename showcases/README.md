# Hyfrme showcases

These compositions translate the six videos published at
[remocn.dev/showcases](https://remocn.dev/showcases) to a HyperFrames-owned
frame clock. The browser runtimes bundle React and the source component tree,
but do not bundle or execute Remotion.

All six source references are pinned to
`bcccd3d3350320f12056fdb6e0f0d005f80fbd84` in
`catalog/showcase-fixtures.json`. The generated project includes GSAP 3.14.2
locally in `assets/gsap.min.js`.

Generate the compositions after cloning the public source fixture:

```bash
git clone https://github.com/Remocn/remocn-collections .work/remocn-collections
git -C .work/remocn-collections checkout bcccd3d3350320f12056fdb6e0f0d005f80fbd84
npm --prefix .work/remocn-collections ci
npm run generate:showcases
node scripts/verify-showcase-lossless.mjs
```

The generator removes the stateful shader readiness handle already excluded
from Hyfrme's verified component ports. It also fixes the shadcn responsive
hook to the canonical 1280×720 desktop branch. See `TRANSLATION_NOTES.md`.
