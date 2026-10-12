# T3 Code v0.0.42: Brief to New Worktree

This eight-second HyperFrames project joins two CLI-installed T3 Code v0.0.42 blocks: Brief to Prompt and New Worktree Choice. It uses the full 1200 × 659 desktop workspace at 30 fps. `index.html` is dark; `index-light.html` shows the same two blocks with `theme: light` on both hosts. Change the project, thread, prompt, theme, and event timing through each block's variables. Keep shared values equal across the cut.

Both themes passed the full HyperFrames check and strict 240-frame render. The frame 120→121 cut scores 0.999999 SSIM in dark and 1.000000 in light. See [`parity/t3-brief-worktree-v0042-sequence.json`](../../parity/t3-brief-worktree-v0042-sequence.json) for the installed-source hashes and rendered videos. The local Hyfrme project and model availability are seeded; no AI provider runs, and choosing New worktree does not create it until a prompt is sent.

From this directory, run `npx hyperframes check .` or `npx hyperframes render . -o brief-worktree.mp4`. The composition and assets in `compositions/` were installed through the Hyfrme CLI and are owned by the project.
