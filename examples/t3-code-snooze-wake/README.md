# T3 Code snooze and wake

This eight-second HyperFrames composition joins the real Snooze and Wake thread actions at 1200 × 659 and 30 fps. Both blocks are installed source. Wake begins with its Snoozed menu open to continue the prior block, with a 0.999979 SSIM boundary; see [`parity/t3-snooze-wake-sequence.json`](../../parity/t3-snooze-wake-sequence.json).

From the repository root, run `npm run dev`. In another shell:

```bash
cd examples/t3-code-snooze-wake
export HYFRME_REGISTRY_URL=http://127.0.0.1:5173/registry
node ../../cli/bin/hyfrme.mjs add t3-thread-snooze --dir .
node ../../cli/bin/hyfrme.mjs add t3-thread-wake --dir .
npx hyperframes check .
npx hyperframes render . -o t3-code-snooze-wake.mp4
```

Edit the installed HTML in `compositions/`. Set `data-variable-values` on either host in `index.html` to change that instance; keep shared project and thread values aligned across the cut.
