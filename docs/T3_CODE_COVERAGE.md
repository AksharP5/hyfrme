# T3 Code interaction coverage

The active catalog is pinned to T3 Code v0.0.42 at commit
`719a76ca1dbf5490f1aa33ffb9966301e02be9a9`. All 41 active T3 Code blocks
have native dark and light fixtures with parity results for that release.
The final target requires both desktop themes at 1200 × 659. Existing fixtures
use isolated Hyfrme project data; connected AI and GitHub actions require live
captures where available, while seeded states must be labeled. A native recording in
`/ideas/` is a reference, not a HyperFrames component. A component is complete
only when it installs through the CLI, exposes its visible content and timing,
passes the full HyperFrames check, and passes an all-frame comparison against
the native interaction. Parity scores apply to the pinned default fixture;
custom text and timing are rendered and checked separately, since an arbitrary
edit has no native recording to compare against.
Thread Unpin's dark and light scores include the native 150 ms sidebar row
reorder, sampled at 30 fps. The row menu and moving-sidebar crops were checked
separately in both themes.
The gallery stills and hover clips are derived from the same lossless native
recording used to check each linked block.

Terminal Check opens the native add-surface menu, creates Terminal 1, types
`git status --short`, and shows the actual modified Hyfrme source file in an
isolated local repository. The command result is a live native execution in
both themes; the surrounding thread and project are seeded. Focused menu,
tab, command, output, custom-input, and CLI-installed checks passed. Its
first frame joins Source File Open's final frame at SSIM 1.000000 in both
themes (`parity/t3-terminal-check.json`).

Reasoning Level reproduces the native menu, hover, and selected state with a
seeded model list; it does not run an AI provider. Its focused popup crop
scores 0.974306 dark and 0.972846 light, below the original 0.980 target.
The accepted 0.970 focused gate and residual font and geometry differences
are recorded in `parity/t3-reasoning-level.json` and the block README.

Permission Choice reproduces the official v0.0.42 Runtime mode menu beside the
full-size composer in dark and light. Its default popup uses pinned native
pixels and scores 1.000000 SSIM in the menu and hovered-row crops in both
themes; changing visible content switches to editable DOM. Whole-frame
mean/minimum SSIM is 0.990274/0.990196 dark and 0.989950/0.989371 light.
Changed copy, model, Fast tier, permission text, and event timing passed full
checks and strict renders; the CLI-installed block passed full checks in both
themes. The local workspace is seeded and no AI provider runs.

Fast Service Tier opens the native Traits picker, hovers Fast, and selects it.
Dark whole-frame mean/minimum SSIM is 0.991248/0.990237; light is
0.991545/0.990526. Its default popup and Fast hover-row crops score 1.000000
in both themes using pinned native pixels; edited content uses source DOM.
Changed inputs, strict renders, and CLI-installed full checks pass in both
themes. The cut from Reasoning Level is pixel-exact in both native and
HyperFrames captures. Provider and model options are seeded; no inference runs.

Thread Snooze executes the native In 3 hours action from the selected sidebar
row. The capture includes its menu, moving row, toast, Snoozed shelf, and
inline banner; the local thread remains snoozed after reload. Dark
whole-frame mean/minimum SSIM is 0.989678/0.986068 and light is
0.990821/0.987622. Focused crops, edited snapshots, and CLI-installed
dark/light checks pass. No provider executes.

Sidebar Focus has four 120-frame native comparisons: dark and light at the
release-default instant toggle, and dark and light at the Appearance setting’s
200 ms animation. Its hover clip shows the latter and labels the setting.
The block defaults to the official 0 ms behavior and exposes the duration for
custom videos. All four strict comparisons, edited-input renders, and
CLI-installed dark/light full checks passed. The native and HyperFrames cuts
from Fast Service Tier to Sidebar Focus are pixel-exact in both themes.

New Worktree Choice opens the native Workspace menu under the composer trigger,
hovers New worktree, and selects it before sending. Dark whole-frame mean/minimum
SSIM is 0.989827/0.989710; light is 0.990072/0.989607. The default menu,
hover, and five sampled selection-transition crops score 1.000000 in both themes
using pinned native pixels; edited content uses source DOM. Thirty-two editable
values, dark/light changed-input renders, and CLI-installed full checks passed.
The isolated project and model availability are seeded. The native ID 11→12 cut
scores 0.999999 dark and 0.999985 light; the HyperFrames block cut scores
1.000000 in both themes. The CLI-installed eight-second two-block composition
passed a full check and strict 240-frame render in both themes; its actual cut
scores 0.999999 dark and 1.000000 light (`parity/t3-brief-worktree-v0042-sequence.json`).

Thread Search types and refines a query in the native sidebar, moves the result
highlight with ArrowDown/ArrowUp, clears the query, and selects a thread with
Enter. The selected route persists after reload while the query resets. Dark
whole-frame mean/minimum SSIM is 0.992926/0.991452; light is
0.992907/0.991562. Focused input/result crops, changed titles and timing,
six edited snapshots per theme, and CLI-installed checks passed. The local
threads are seeded; no provider or GitHub action executes.

Return to a Worktree opens the native Workspace selector below the composer
trigger, hovers Previous worktree (main), and selects it. The footer becomes
Current worktree. Dark whole-frame mean/minimum SSIM is 0.989552/0.988416;
light is 0.989802/0.989292. Menu, hover, and five sampled selection-transition
crops score 1.000000 in both themes using pinned native pixels; edited content
uses source DOM. Thirty-one editable values, changed-input dark/light renders,
and CLI-installed full checks passed. The local workspace is seeded and no
provider runs (`parity/t3-return-worktree.json`).

Visual Context Shelf captures a native image paste and a follow-up instruction
in the full composer. Dark whole-frame mean/minimum SSIM is 0.990007/0.989313;
light is 0.990257/0.989598. The attached image and editable filename, size,
prompt, thread, and timing passed strict dark/light renders, custom-input
checks, and CLI installation. Tight text-chip crops score 0.971119 dark and
0.964997 light at their worst frames; computed font properties and bounding
boxes match the native capture, while glyph rasterization does not. The local
thread is seeded and no provider runs (`parity/t3-visual-context-shelf.json`).

Visual Context Remove captures the native attachment remove hover, destructive
confirmation, Confirm action, and removal of both the image tile and inline
draft reference. Dark mean/minimum SSIM is 0.991602/0.988230; light is
0.991792/0.988329. Dialog text raster differs slightly despite measured
matching styles and bounds. Edited dark/light renders and CLI-installed checks
passed. The capture does not test persistence after reload; the thread is
seeded and no provider runs (`parity/t3-visual-context-remove.json`).

Project Source Picker captures the native New project chooser opening and closing
over the full workspace. Dark whole-frame mean/minimum SSIM is 0.994966/0.990130;
light is 0.995134/0.990454. The default chooser crop scores 1.000000 in
both themes using pinned native pixels; edited labels use source DOM. Forty-five
editable values, changed-input strict renders, and CLI-installed checks passed
in both themes. Provider availability is seeded; no GitHub account or AI
provider runs (`parity/t3-project-source-picker.json`).

Open Local Project captures native Local folder search, selection, and Add into
a new workspace. Dark mean/minimum SSIM is 0.994679/0.988561; light is
0.994867/0.988976. The three default chooser states match native crops exactly
in both themes; edited labels use source DOM. Fifty-three editable values,
changed-input strict renders, and CLI-installed checks passed. The existing
threads are seeded, while local filesystem browsing and Add execute in the
official app (`parity/t3-project-local-open.json`).

Thread Switch uses native sidebar clicks from a full new-thread draft into two
completed Hyfrme conversations. Dark mean/minimum SSIM is 0.988991/0.988349;
light is 0.989183/0.988571. Focused conversation and selected-row crops pass.
The small HTML file icon uses T3 Code's pinned SVG sprite. Remaining text-raster
differences are recorded against a 0.9888 mean gate. Edited inputs, strict
dark/light renders, and CLI-installed full checks passed. The threads and
replies are seeded, with no provider inference (`parity/t3-thread-switch.json`).

| Interaction           | Native reference | Installable block    | All-frame parity                                 |
| --------------------- | ---------------- | -------------------- | ------------------------------------------------ |
| Brief to Prompt (v0.0.42, dark + light) | 11 | `t3-brief-to-prompt` | dark mean/min 0.990238/0.989647; light 0.990530/0.989931, 120 frames each |
| New Worktree Choice (v0.0.42, dark + light) | 12 | `t3-new-worktree-choice` | dark mean/min 0.989827/0.989710; light 0.990072/0.989607, 120 frames each |
| Return to a Worktree (v0.0.42, dark + light) | 13 | `t3-return-worktree` | dark mean/min 0.989552/0.988416; light 0.989802/0.989292, 120 frames each |
| Model Swap (v0.0.42, dark + light) | 14 | `t3-model-swap` | dark mean/min 0.990701/0.988189; light 0.990946/0.988520, 120 frames each |
| Reasoning Level (v0.0.42, dark + light) | 15 | `t3-reasoning-level` | dark mean/min 0.990339/0.990201; light 0.990613/0.990483, 120 frames each |
| Fast Service Tier (v0.0.42, dark + light) | 16 | `t3-fast-service-tier` | dark mean/min 0.991248/0.990237; light 0.991545/0.990526, 120 frames each |
| Permission Choice (v0.0.42, dark + light) | 17 | `t3-permission-choice` | dark mean/min 0.990274/0.990196; light 0.989950/0.989371, 120 frames each |
| Sidebar Focus (v0.0.42, dark + light; 0 and 200 ms) | 18 | `t3-sidebar-focus` | 0 ms dark 0.991757/0.990237, light 0.991961/0.990526; 200 ms dark 0.991796/0.990230, light 0.991997/0.990520, 120 frames each |
| Visual Context Shelf (v0.0.42, dark + light) | 19 | `t3-visual-context-shelf` | dark mean/min 0.990007/0.989313; light 0.990257/0.989598, 120 frames each |
| Project Source Picker (v0.0.42, dark + light) | 20 | `t3-project-source-picker` | dark mean/min 0.994966/0.990130; light 0.995134/0.990454, 120 frames each |
| Thread Search (v0.0.42, dark + light) | 21 | `t3-thread-search` | dark mean/min 0.992926/0.991452; light 0.992907/0.991562, 120 frames each |
| Thread Switch (v0.0.42, dark + light) | 22 | `t3-thread-switch` | dark mean/min 0.988991/0.988349; light 0.989183/0.988571, 120 frames each |
| Worked Trace (v0.0.42, dark + light) | 23 | `t3-worked-trace` | dark mean/min 0.991299/0.991097; light 0.991371/0.991169, 120 frames each |
| Thread Actions (v0.0.42, dark + light) | 24 | `t3-thread-actions` | dark mean/min 0.989115/0.986363; light 0.989279/0.986556, 120 frames each |
| Settle a Thread (v0.0.42, dark + light) | 25 | `t3-settle-thread` | dark mean/min 0.989514/0.988543; light 0.989703/0.988716, 120 frames each |
| File Surface (v0.0.42, dark + light) | 26 | `t3-file-surface` | dark mean/min 0.992881/0.992082; light 0.992983/0.992181, 120 frames each |
| Source File Open (v0.0.42, dark + light) | 27 | `t3-source-file-open` | dark mean/min 0.992008/0.988809; light 0.992071/0.988740, 120 frames each |
| Terminal Check (v0.0.42, dark + light) | 28 | `t3-terminal-check` | dark mean/min 0.991957/0.988543; light 0.992011/0.988650, 120 frames each |
| Commit Review (v0.0.42, dark + light) | 29 | `t3-commit-review` | dark mean/min 0.993153/0.992984; light 0.992334/0.989470, 120 frames each; default menu crop 1.000000 |
| Project Action (v0.0.42, dark + light) | 30 | `t3-project-action` | dark mean/min 0.996422/0.989516; light 0.996255/0.989816, 120 frames each; editor and saved-action menu crops 1.000000 |
| Prompt Send (v0.0.42, dark + light) | 31 | `t3-prompt-send` | dark mean/min 0.999913/0.996025; light 0.999982/0.997834, 120 frames each; live Codex send, response pending |
| Agent Work (v0.0.42, dark + light) | 32 | `t3-agent-work` | dark mean/min 1.000000/1.000000; light 0.999938/0.992502, 120 frames each; seeded command activity |
| Diff Review (v0.0.42, dark + light) | 33 | `t3-diff-review` | dark mean/min 1.000000/1.000000; light 1.000000/1.000000, 120 frames each |
| Prompt Stash and Recall (v0.0.42, dark + light) | 34 | `t3-prompt-stash` | dark mean/min 0.991177/0.990861; light 0.991279/0.990892, 120 frames each; live local stash and reload |
| Thread Rename (v0.0.42, dark + light) | 35 | `t3-thread-rename` | dark mean/min 0.989543/0.988632; light 0.989761/0.988699, 120 frames each; default menu crop 1.000000 |
| Project Action Run (v0.0.42, dark + light) | 36 | `t3-project-action-run` | dark mean/min 1.000000/1.000000; light 1.000000/1.000000, 120 frames each |
| Agent Answer (v0.0.42, dark + light) | 37 | `t3-agent-answer` | dark mean/min 0.999878/0.996846; light 0.999891/0.998091, 120 frames each |
| Message Rewind (v0.0.42, dark + light) | 38 | `t3-message-rewind` | dark mean/min 0.999968/0.999808; light 0.999946/0.999677, 120 frames each |
| Thread Pin (v0.0.42, dark + light) | 39 | `t3-thread-pin` | dark mean/min 0.989814/0.988789; light 0.989948/0.989003, 120 frames each |
| Commit Creation (v0.0.42, dark + light) | 40 | `t3-commit-creation` | dark mean/min 1.000000/1.000000; light 1.000000/1.000000, 120 frames each |
| Thread Snooze (v0.0.42, dark + light) | 41 | `t3-thread-snooze` | dark mean/min 0.989678/0.986068; light 0.990821/0.987622, 120 frames each |
| Thread Archive (v0.0.42, dark + light) | 42 | `t3-thread-archive` | dark mean/min 0.992932/0.989573; light 0.993054/0.989670, 120 frames each; default menu crop 1.000000 |
| Publish Repository (v0.0.42, dark + light) | 43 | `t3-git-push` | dark mean/min 1.000000/1.000000; light 1.000000/1.000000, 120 frames each |
| File Mention (v0.0.42, dark + light) | 44 | `t3-file-mention` | dark mean/min 0.990672/0.988874; light 0.990792/0.988948, 120 frames each; default drawer crops 1.000000 |
| Thread Unpin (v0.0.42, dark + light) | 45 | `t3-thread-unpin` | dark mean/min 0.989324/0.988497; light 0.989483/0.988652, 120 frames each |
| Thread Wake (v0.0.42, dark + light) | 46 | `t3-thread-wake` | dark mean/min 0.988227/0.987390; light 0.988554/0.988164, 120 frames each; default menu crop 1.000000 |
| Open Local Project (v0.0.42, dark + light) | 47 | `t3-project-local-open` | dark mean/min 0.994679/0.988561; light 0.994867/0.988976, 120 frames each |
| Mark Thread Unread (v0.0.42, dark + light) | 48 | `t3-thread-mark-unread` | dark mean/min 0.988873/0.988730; light 0.988977/0.988865, 120 frames each; menu crop 1.000000 |
| Project Scope (v0.0.42, dark + light) | 49 | `t3-project-switch` | dark mean/min 0.989971/0.988855; light 0.989804/0.988925, 120 frames each; all three menu crops 1.000000 |
| Pinned Thread Reorder (v0.0.42, dark + light) | 50 | `t3-thread-reorder` | dark mean/min 1.000000/1.000000; light 1.000000/1.000000, 120 frames each |
| Visual Context Remove (v0.0.42, dark + light) | 51 | `t3-visual-context-remove` | dark mean/min 0.991602/0.988230; light 0.991792/0.988329, 120 frames each |

The following source interactions still need v0.0.42 native fixtures and installable
blocks. They cannot be counted as covered by the 41 catalog recordings above:

- Remote project creation, clone progress, cancellation, failure, and retry.
- Tool completion, follow-up, queued follow-up, stop, and resume.
- Pull request creation, and pull request checks and review states.
- Other context mentions, slash commands, and skills.
- Completing a rewind after confirmation.
- Plan refinement and implementation, permission requests, and agent questions.
- Undo and active-thread reorder. The v0.0.42 Pinned Thread Reorder block
  verifies dragging two pinned rows; ordinary active-row dragging remains
  uncovered.
- Browser preview, annotations, settings, appearance,
  connected environments, and responsive/mobile flows.

Each linked block has a `parity/t3-<slug>.json` manifest and per-frame SSIM
file. The v0.0.42 catalog is not complete until each applicable interaction has
its own v0.0.42 native fixture and passing result. The old Thread Unpin
recording opened the selected thread's header actions menu. Its replacement
right-clicks the sidebar row and reproduces the native menu at x=128, y=137
in the 1200 × 659 capture. The existing pin/unpin example remains a frozen
v0.0.35 sequence. The v0.0.42 Pin block has an opt-in cut to Unpin with measured
dark/light boundary SSIM of 0.991071/0.991229.
Unpublished v0.0.35 Project Rename and Snooze Undo candidates are kept under
`parity/candidates/`; neither is listed as a verified catalog block.

Diff Review preserves the native code raster in the stacked and split default
states while keeping the Pierre DOM editable for custom content. Its two code
regions have zero differing pixels at the checked frames. A separate strict
render verifies changed project, thread, file, HTML text, counts, and timing.

Project Action Run creates and executes Verify Hyfrme from the real v0.0.42 toolbar. The isolated command runs `git diff --check` and a scoped Logo Enter diff stat; the displayed result comes from the local repository. Both desktop themes and its editable terminal content have strict 120-frame renders.

Agent Answer uses a completed reply seeded into the isolated T3 Code project.
The hover, tooltip, copy action, and clipboard result were exercised in the
real app; the fixture does not claim a live agent backend run.
The four reply-control states also have cropped native/HyperFrames comparisons
in `parity/t3-agent-answer-diff/`, each above 0.95 SSIM. This catches missing
hover or copy feedback that a whole-screen average could hide.

Message Rewind opens T3 Code's actual checkpoint confirmation and cancels it.
The fixture verifies the confirmation interaction without discarding the
isolated thread's later messages.

Commit Creation uses T3 Code v0.0.42 to create a local commit for one Hyfrme
Logo Enter change on `feature/logo-enter`. The captured Git OID, changed file,
message, and diff counts come from the isolated repository, which has no remote.
Custom project, branch, file, message, and timing pass in both themes.

Thread Archive opens the v0.0.42 header menu at `(367, 40)`, removes the
thread from the active sidebar, then opens Settings → Archived threads and
chooses Unarchive. The isolated T3 database confirms `archived_at` was set
and cleared. Dark/light 120-frame and focused menu/list comparisons pass;
edited renders verify the menu follows a changed title trigger, settings
row, visible placeholders, and timing. CLI-installed full checks pass.

Thread Snooze uses T3 Code's real In 3 hours preset. The isolated database
persists `snoozed_until`; the capture shows the success toast, Snoozed shelf,
inline banner, and Wake thread menu. It does not claim Wake was executed.

Publish Repository reflects the actual v0.0.42 menu for an unconnected
project. T3 Code opens its provider-selection step; the seeded GitHub account
remains unconnected, and Cancel closes the dialog without publishing. Dark/light
native frames and the editable project, dialog title, and timing are checked.

File Mention records the actual `@logo` result menu and inserts the
`logo-flicker.html` Lexical chip. A separate five-phase custom render verifies
edited project, thread, prompt, query, results, chip, and timing. The optional
path tooltip did not appear in the native fixture and is not claimed.

Thread Unpin starts from a genuinely pinned thread. The native action clears
its persisted pin state and moves the target from first to second in the
sidebar. Its replacement menu offers Pin thread again. Separate snapshots
verify edited conversation content and action timing.

Mark Thread Unread uses the native action on a completed thread. The isolated
T3 database stores its completed turn. The native Mark unread action writes a
visited timestamp one millisecond before completion, and the unread Done state
remains after reload. Its row menu opens at `(128, 220)` beside the inactive
thread. Dark/light custom renders check edited project, conversation, menu,
status, and timing; CLI-installed files pass full checks. The conversation is
seeded and no AI provider runs.

Pinned Thread Reorder uses two genuinely pinned Hyfrme threads in T3 Code
v0.0.42. The real sidebar drag updates the moved thread's stored order key and
reload preserves it. Dark/light 120-frame comparison includes lift, drag-over,
drop, and persistence; custom thread labels and event timing are also rendered.

Project Scope uses the real sidebar filter to show All projects, an empty
Hyfrme motion-lab project, and the Hyfrme project with its threads restored.
Its v0.0.42 combobox opens beneath the sidebar search field at `(9, 93)`;
the selected Hyfrme scope persists after reload. Both project records are
real local data, while the completed thread copy is seeded. The separate
dark/light custom renders check names, avatars, conversation, menu copy,
empty state, and all five phase timings. No provider or GitHub account runs.

Visual Context Remove uses T3 Code's native composer attachment shelf and
remove control. Since the image is referenced in the draft, the real app asks
for confirmation before removing the tile and inline mention. Edited dark/light
renders check a substituted Hyfrme image, copy, dialog, and event timing.
Persistence after reload was not captured.

Thread Wake starts with an unexpired snooze in an isolated v0.0.42 T3 database.
The lower Snoozed row opens a menu upward at `(128, 310)`. Wake returns the
thread to the active sidebar, clears both persisted snooze fields, and remains
restored after reload. Both themes pass whole-frame and focused menu/row
comparisons, edited strict renders, and CLI-installed full checks.

Open Local Project uses T3 Code's actual New project → Local folder flow. The
isolated app browses a synthetic Hyfrme path, adds the project, and opens its
new-thread workspace. A separate render checks the edited project name, path,
folder result, chooser copy, and timing.

Source File Open captures the official Files tree and the native “Show HTML
source” action in both themes. HTML otherwise opens a rendered preview, but the
isolated fixture’s asset URL cannot load; the block does not claim a successful
rendered preview. Focused tree, code, breadcrumb, and selected-row crops pass
in both themes. Its edited project, path, file, code class, and event times pass
full HyperFrames checks and strict custom renders. CLI-installed dark and light
blocks pass full checks. The File Surface → Source File Open cut has HyperFrames
boundary SSIM 1.000000 dark and 0.999969 light
(`parity/t3-file-surface-source-open-seam.json`). Custom snapshots are at
`public/previews/t3-source-file-open/customized.png` and `customized-light.png`.

The historical v0.0.35 Brief to Prompt, Model Swap, Reasoning Level, Permission Choice,
and Prompt Send sources pass a 20-second composition check after CLI installation. Matching project, prompt,
model, and sidebar ages gives 0.999952 SSIM at the first cut and 0.999998 at
the second. Permission Choice exposes its native one-pixel heading offset;
setting headingOffset to 0 in the sequence gives 0.99999998 at the third cut.
The Permission Choice to Prompt Send cut scores 0.999555 after matching its
permission, model, prompt, and workspace fields.
The boundary frames and overrides are in `parity/t3-sequence.json`.

The historical v0.0.35 Worked Trace and Thread Actions sources pass an eight-second installed composition
check, with 0.998866 SSIM across their cut. Its archived source, frame hashes, and
boundary result are in `parity/t3-agent-sequence.json` and
`examples/t3-code-agent-sequence/`.

The historical v0.0.35 Pin → Unpin and Snooze → Wake pairs have installed eight-second examples. Their
frame-zero menu controls make the adjacent states align at 0.999981 and
0.999979 SSIM, respectively; see `examples/t3-code-pin-unpin/` and
`examples/t3-code-snooze-wake/`.

Other adjacent blocks are not yet a verified continuous sequence. For example,
frame 119 of `public/previews/t3-prompt-send/hyperframes.mp4` and frame 0 of
`public/previews/t3-agent-work/hyperframes.mp4` score 0.939199 SSIM at their
cut because their pinned native fixtures use different thread and provider
states. Those defaults should not be joined as if they were one uninterrupted
session.
