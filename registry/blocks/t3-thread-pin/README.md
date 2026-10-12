# T3 Code: Thread Pin

This four-second, 1200 × 659 block reproduces T3 Code v0.0.42 at 30 fps. Right-clicking the unpinned row opens its sidebar context menu beside the row. Pin moves the thread to the top through the native 150 ms row transition, shows the hovered third thread's details, and then offers Unpin thread. The theme variable selects independently captured dark or light source states.

Unchanged content and timing use the native recording frame for frame through one canvas and 20 deduplicated lossless native PNG frames per theme. Editing content, timing, or continuity settings automatically uses editable DOM. Set renderMode to editable DOM to use native source markup explicitly. The editable path preserves the row transitions and hover-card lifecycle.

Customize theme, project, branch, thread titles and ages, conversation content, composer copy, menu actions, and the three interaction beats through HyperFrames variables. Match the project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/719a76ca1dbf5490f1aa33ffb9966301e02be9a9. Installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
