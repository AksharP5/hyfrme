# T3 Code: Model Swap

This four-second block reproduces the T3 Code v0.0.42 model picker in dark or light at 1200 × 659 and 30 fps. It starts with the same project and prompt as t3-brief-to-prompt, opens the picker, hovers a model, and selects GPT-6-Sol. The model list is a seeded T3 fixture with no provider configured; this capture exercises native picker UI and does not run AI inference.

Set the same theme, project, branch, thread, age, and prompt variables on adjacent T3 Code blocks for a continuous workspace. The picker opens at openFrame, highlights the next model at hoverFrame, and commits selection at selectFrame. Source: https://github.com/pingdotgg/t3code/tree/719a76ca1dbf5490f1aa33ffb9966301e02be9a9. The installed files include the T3 Code MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
