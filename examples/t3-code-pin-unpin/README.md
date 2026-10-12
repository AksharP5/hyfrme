# T3 Code pin and unpin

This archived v0.0.35 eight-second HyperFrames composition joins pinned-thread actions at 1200 × 659 and 30 fps. Both blocks are frozen installed source. The second block starts with its action menu open, and the shared thread copy and sidebar ages align at the cut. The boundary frames score 0.999981 SSIM; see [`parity/t3-pin-unpin-sequence.json`](../../parity/t3-pin-unpin-sequence.json). The current standalone Thread Unpin block is v0.0.42 and uses the sidebar row menu, so reinstalling it into this example changes the cut.

From the repository root, run `npm run dev`. In another shell:

```bash
cd examples/t3-code-pin-unpin
npx hyperframes check .
npx hyperframes render . -o t3-code-pin-unpin.mp4
```

Edit the installed HTML in `compositions/`. Set `data-variable-values` on either host in `index.html` to change that instance; keep shared project, thread, and sidebar values aligned across the cut.
