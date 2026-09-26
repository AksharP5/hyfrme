# T3 Code agent sequence

This eight-second HyperFrames composition joins the native Worked Trace and Thread Actions states at 1200 × 659 and 30 fps. The two blocks use the same Hyfrme project and selected thread. The installed two-block strict render passes the full HyperFrames check, with 0.998866 SSIM at the cut. Its boundary evidence is in [`parity/t3-agent-sequence.json`](../../parity/t3-agent-sequence.json).

From the repository root, run `npm run dev`. In another shell:

```bash
cd examples/t3-code-agent-sequence
export HYFRME_REGISTRY_URL=http://127.0.0.1:5173/registry
node ../../cli/bin/hyfrme.mjs add t3-worked-trace --dir .
node ../../cli/bin/hyfrme.mjs add t3-thread-actions --dir .
npx hyperframes check .
npx hyperframes render . -o t3-code-agent-sequence.mp4
```

The installed source stays editable in `compositions/`. Keep project, thread, message, and sidebar values aligned when changing either block. Set `data-variable-values` on a composition host in `index.html` for per-instance overrides.
