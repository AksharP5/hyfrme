# T3 Code interaction coverage

The active catalog is pinned to T3 Code v0.0.42 at commit
`719a76ca1dbf5490f1aa33ffb9966301e02be9a9`. All 41 active T3 Code blocks
have native dark and light fixtures with parity results for that release.
The final target requires both desktop themes at 1200 × 659. Existing fixtures
use isolated Hyfrme project data; connected AI and GitHub actions require live
captures where available, while seeded states must be labeled. The recordings in
`parity/t3-gallery/` are internal references. A component is complete
only when it installs through the CLI, exposes its visible content and timing,
passes the full HyperFrames check, and passes an all-frame comparison against
the native interaction. Parity scores apply to the pinned default fixture;
custom text and timing are rendered and checked separately, since an arbitrary
edit has no native recording to compare against.
Thread Unpin's dark and light scores include the native 150 ms sidebar row
reorder, sampled at 30 fps. The row menu and moving-sidebar crops were checked
separately in both themes.
The archived stills and clips are derived from the same lossless native
recording used to check each linked block.

Terminal Check opens the native add-surface menu, creates Terminal 1, types
`git status --short`, and shows the actual modified Hyfrme source file in an
isolated local repository. The command result is a live native execution in
both themes; the surrounding thread and project are seeded. Focused menu,
tab, command, output, custom-input, and CLI-installed checks passed. Its
first frame joins Source File Open's final frame at SSIM 1.000000 in both
themes (`parity/t3-terminal-check.json`).

Reasoning Level reproduces the native menu, hover, and selected state with a
seeded model list. Both themes match all 120 frames exactly; no AI provider runs.

Permission Choice reproduces the Runtime mode menu beside the full composer.
Fast Service Tier opens the Traits picker, hovers Fast, and selects it. Both
blocks match all 120 frames in each theme. Changed inputs use editable DOM;
provider and model availability remain seeded.

Thread Snooze captures the In 3 hours action, moving row, toast, Snoozed shelf,
and inline banner. Native state persists after reload. Its current exact
all-frame proof remains pending while source transition timing is investigated.
No provider executes.

Sidebar Focus verifies the release-default instant toggle with exact RGBA for
all 120 frames in each theme. The Appearance setting's 200 ms variant has a
separate fixture; its final proof and publication must be checked separately.
The block defaults to the official 0 ms behavior and exposes the duration.

New Worktree Choice opens the native Workspace menu, hovers New worktree, and
selects it before sending. Both themes match all 120 frames exactly. The
isolated project and model availability are seeded. The separate eight-second
Brief to Prompt sequence is recorded in
`parity/t3-brief-worktree-v0042-sequence.json`.

Thread Search types and refines a query, moves the result highlight with
ArrowDown/ArrowUp, clears the query, and selects a thread with Enter. The route
persists after reload while the query resets. Both themes match all 120 frames
exactly. Threads are seeded; no provider or GitHub action executes.

Return to a Worktree opens the Workspace selector, hovers Previous worktree
(main), and selects it. The footer becomes Current worktree. Both themes match
all 120 frames exactly. The workspace is seeded and no provider runs.

Visual Context Shelf captures a native image paste and a follow-up instruction
in the full composer. Both themes match all 120 native frames exactly in RGBA,
with mean/minimum SSIM 1.000000. The expanded preview uses the upstream
256-pixel square thumbnail pipeline while the inline chip retains the original
image. Strict renders, full checks, and CLI installation passed, including
the preview asset in custom block directories. The local thread is seeded and
no provider runs (`parity/t3-visual-context-shelf.json`).

Visual Context Remove captures the attachment remove hover, destructive
confirmation, Confirm action, and removal of the image tile and inline draft
reference. Exact all-frame parity remains pending. The capture does not test
persistence after reload; the thread is seeded and no provider runs.

Project Source Picker captures the New project chooser opening and closing.
Both themes match all 120 frames exactly. Edited labels use source DOM.
Provider availability is seeded; no GitHub account or AI provider runs.

Open Local Project captures Local folder search, selection, and Add into a new
workspace. Both themes match all 120 frames exactly. Existing threads are
seeded; filesystem browsing and Add execute in the official app.

Thread Switch uses native sidebar clicks from a new-thread draft into two
completed Hyfrme conversations. Both themes match all 120 frames exactly.
The HTML file icon uses the pinned SVG sprite. Threads and replies are seeded,
with no provider inference.

| Interaction           | Native reference | Installable block    | Default all-frame parity                         |
| --------------------- | ---------------- | -------------------- | ------------------------------------------------ |
| Brief to Prompt (v0.0.42, dark + light) | 11 | `t3-brief-to-prompt` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| New Worktree Choice (v0.0.42, dark + light) | 12 | `t3-new-worktree-choice` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Return to a Worktree (v0.0.42, dark + light) | 13 | `t3-return-worktree` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Model Swap (v0.0.42, dark + light) | 14 | `t3-model-swap` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Reasoning Level (v0.0.42, dark + light) | 15 | `t3-reasoning-level` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Fast Service Tier (v0.0.42, dark + light) | 16 | `t3-fast-service-tier` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Permission Choice (v0.0.42, dark + light) | 17 | `t3-permission-choice` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Sidebar Focus (v0.0.42, dark + light; 0 and 200 ms) | 18 | `t3-sidebar-focus` | Instant default: exact RGBA and SSIM 1.000000, all 120 frames in each theme. Final publication of the 200 ms variant remains pending. |
| Visual Context Shelf (v0.0.42, dark + light) | 19 | `t3-visual-context-shelf` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Project Source Picker (v0.0.42, dark + light) | 20 | `t3-project-source-picker` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Search (v0.0.42, dark + light) | 21 | `t3-thread-search` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Switch (v0.0.42, dark + light) | 22 | `t3-thread-switch` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Worked Trace (v0.0.42, dark + light) | 23 | `t3-worked-trace` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Actions (v0.0.42, dark + light) | 24 | `t3-thread-actions` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Settle a Thread (v0.0.42, dark + light) | 25 | `t3-settle-thread` | Exact all-frame parity pending; see current parity manifest |
| File Surface (v0.0.42, dark + light) | 26 | `t3-file-surface` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Source File Open (v0.0.42, dark + light) | 27 | `t3-source-file-open` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Terminal Check (v0.0.42, dark + light) | 28 | `t3-terminal-check` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Commit Review (v0.0.42, dark + light) | 29 | `t3-commit-review` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Project Action (v0.0.42, dark + light) | 30 | `t3-project-action` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Prompt Send (v0.0.42, dark + light) | 31 | `t3-prompt-send` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Agent Work (v0.0.42, dark + light) | 32 | `t3-agent-work` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Diff Review (v0.0.42, dark + light) | 33 | `t3-diff-review` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Prompt Stash and Recall (v0.0.42, dark + light) | 34 | `t3-prompt-stash` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Rename (v0.0.42, dark + light) | 35 | `t3-thread-rename` | Exact all-frame parity pending; see current parity manifest |
| Project Action Run (v0.0.42, dark + light) | 36 | `t3-project-action-run` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Agent Answer (v0.0.42, dark + light) | 37 | `t3-agent-answer` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Message Rewind (v0.0.42, dark + light) | 38 | `t3-message-rewind` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Pin (v0.0.42, dark + light) | 39 | `t3-thread-pin` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Commit Creation (v0.0.42, dark + light) | 40 | `t3-commit-creation` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Snooze (v0.0.42, dark + light) | 41 | `t3-thread-snooze` | Exact all-frame parity pending; see current parity manifest |
| Thread Archive (v0.0.42, dark + light) | 42 | `t3-thread-archive` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Publish Repository (v0.0.42, dark + light) | 43 | `t3-git-push` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| File Mention (v0.0.42, dark + light) | 44 | `t3-file-mention` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Unpin (v0.0.42, dark + light) | 45 | `t3-thread-unpin` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Thread Wake (v0.0.42, dark + light) | 46 | `t3-thread-wake` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Open Local Project (v0.0.42, dark + light) | 47 | `t3-project-local-open` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Mark Thread Unread (v0.0.42, dark + light) | 48 | `t3-thread-mark-unread` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Project Scope (v0.0.42, dark + light) | 49 | `t3-project-switch` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Pinned Thread Reorder (v0.0.42, dark + light) | 50 | `t3-thread-reorder` | Exact RGBA and mean/min SSIM 1.000000, all 120 frames in each theme |
| Visual Context Remove (v0.0.42, dark + light) | 51 | `t3-visual-context-remove` | Exact all-frame parity pending; see current parity manifest |

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

Agent Answer recreates T3 Code v0.0.42's seeded completed reply. The visible
pointer reaches the assistant's Copy link control, shows its native tooltip,
presses it, and displays the captured Copied toast. The native capture confirms
the seeded reply reached the clipboard; the HyperFrames block uses a seekable
timeline for those visual states and runs without an AI provider.

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
