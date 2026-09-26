# T3 Code sequence

This 20-second HyperFrames composition combines five installable T3 Code blocks: Brief to Prompt, Model Swap, Reasoning Level, Permission Choice, and Prompt Send. It runs at 1200 × 659 and 30 fps. The installed source stays editable in `compositions/`.

From the repository root, run `npm run dev`. In another shell:

```bash
cd examples/t3-code-sequence
export HYFRME_REGISTRY_URL=http://127.0.0.1:5173/registry
node ../../cli/bin/hyfrme.mjs add t3-brief-to-prompt --dir .
node ../../cli/bin/hyfrme.mjs add t3-model-swap --dir . \
  --set threadOneAge=2h --set threadTwoAge=4h \
  --set threadThreeAge=9h --set settledAge=1h
node ../../cli/bin/hyfrme.mjs add t3-reasoning-level --dir . \
  --set threadOneAge=2h --set threadTwoAge=4h \
  --set threadThreeAge=9h --set settledAge=1h \
  --set modelName=GPT-6-Sol --set reasoningBefore=Medium \
  --set 'prompt=Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.'
node ../../cli/bin/hyfrme.mjs add t3-permission-choice --dir . \
  --set threadOneAge=2h --set threadTwoAge=4h \
  --set threadThreeAge=9h --set settledAge=1h \
  --set modelName=GPT-6-Sol --set reasoningLevel=High \
  --set 'prompt=Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.' \
  --set headingOffset=0
node ../../cli/bin/hyfrme.mjs add t3-prompt-send --dir . \
  --set threadOneAge=2h --set threadTwoAge=4h \
  --set threadThreeAge=9h --set settledAge=1h \
  --set modelName=GPT-6-Sol --set reasoningLevel=High \
  --set permissionMode='Auto-accept edits' --set draftWorkspace='Current checkout' \
  --set 'prompt=Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.'
npx hyperframes check .
npx hyperframes render . -o t3-code-sequence.mp4
```

The heading offset aligns Permission Choice with the previous block at the cut. The five-block check and all four boundary comparisons are recorded in [`parity/t3-sequence.json`](../../parity/t3-sequence.json). Match shared variables when replacing the Hyfrme fixture with your own project and thread content.

For another instance of the same block, set its content on the composition host in `index.html`, for example `data-variable-values='{"projectName":"hyfrme","modelName":"GPT-6-Sol"}'`. HyperFrames applies those values to that instance; render-time `--variables` targets the root composition. The `hyfrme add --set` commands above change the installed block's defaults.
