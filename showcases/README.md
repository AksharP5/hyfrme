# Hyfrme showcases

These compositions translate the six videos published at
[remocn.dev/showcases](https://remocn.dev/showcases) to a HyperFrames-owned
frame clock. The browser runtimes bundle React and the source component tree,
but do not bundle or execute Remotion.

The source references are pinned in `catalog/showcases.json`. Tenkit uses the
historical commit that matches the public 1,152-frame showcase; the other five
use the current 2026-07-24 source pin.

Generate the compositions after cloning the public source fixture:

```bash
git clone https://github.com/Remocn/remocn-collections .work/remocn-collections
git -C .work/remocn-collections checkout 2ec2e52e38854da2b6b6e7a90477dce1a3d742a5
npm --prefix .work/remocn-collections ci
npm run generate:showcases
```

The generator removes the stateful shader readiness handle already excluded
from Hyfrme's verified component ports. It also fixes the shadcn responsive
hook to the canonical 1280×720 desktop branch. See `TRANSLATION_NOTES.md`.
