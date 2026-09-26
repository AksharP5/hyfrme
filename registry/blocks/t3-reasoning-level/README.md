# T3 Code: Reasoning Level

This four-second block reproduces the T3 Code v0.0.42 Reasoning menu in dark or light at 1200 × 659 and 30 fps. The reference opens the native menu, hovers High, and selects it; the block mirrors those states. The model and reasoning options are seeded in an isolated local Hyfrme workspace with no provider configured; this capture exercises native controls and does not run AI inference.

Set the same theme, project, branch, thread, age, and prompt variables on adjacent T3 Code blocks for a continuous workspace. The menu opens at openFrame, highlights a reasoning option at hoverFrame, and commits selection at selectFrame. Source: https://github.com/pingdotgg/t3code/tree/719a76ca1dbf5490f1aa33ffb9966301e02be9a9. Installed files include the T3 Code MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.

Parity limit: the menu-only mean SSIM is 0.974306 dark and 0.972846 light, below the original 0.980 target. The parity manifest records the 0.970 acceptance gate and focused evidence. This menu is not pixel-identical.
