# T3 Code: Sidebar Focus

This four-second block reproduces the T3 Code v0.0.42 sidebar collapse and restore at 1200 × 659 and 30 fps. It uses pinned official workspace DOM and CSS around a Hyfrme source request in dark or light appearance.

The release-default transitionMs is 0, so the sidebar toggles instantly. Nonzero durations seek the five official CSS transitions directly with the native cubic-bezier(0, 0, 0.2, 1) curve. The pinned 200 ms captures skip virtualized thread-row contents for the first sampled frame after restore; the source's nonvirtualized Settled header stays visible. This browser content-visibility paint behavior is retained for frame seeking. Set it to 200 ms to use the Appearance setting's native cubic-bezier(0, 0, 0.2, 1) transition; the official slider ranges from 0 to 400 ms in 25 ms steps. Customize project, branch, thread names and ages, prompt, provider label, reasoning, service tier, permission, workspace, sidebar width, and action frames for a continuous Hyfrme video. Provider/model options in the fixture are seeded; no AI inference runs.

Source: https://github.com/pingdotgg/t3code/tree/719a76ca1dbf5490f1aa33ffb9966301e02be9a9. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
