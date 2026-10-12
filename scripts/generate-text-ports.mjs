import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { frameMathSource, remocnMitBanner } from "./hyfrme-frame-math.mjs";
import { readRemocnRegistry } from "./remocn-registry.mjs";
import { frameRateArgument } from "./frame-rate.mjs";
import { annotateShaderSeam } from "./remocn-shader-seam.mjs";
import { frameDrivenPaperPlugin } from "./remocn-frame-driven-paper.mjs";
import {
  adaptSourcePaintGate,
  sourcePaintShim,
} from "./remocn-source-paint.mjs";
import {
  canvasTransitionNames,
  canvasFilterNames,
  sourcePreviewCss,
} from "./remocn-canvas.mjs";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, process.env.REMOCN_SOURCE ?? ".work/remocn");
const fieldWrapperPath = resolve(
  upstream,
  "components",
  "docs",
  "examples",
  "hyfrme-field-example.tsx",
);
await mkdir(dirname(fieldWrapperPath), { recursive: true });
await copyFile(
  resolve(root, "fixtures", "remocn", "field-example.tsx"),
  fieldWrapperPath,
);
await copyFile(
  resolve(root, "fixtures/remocn/stage-example.tsx"),
  resolve(upstream, "components/docs/examples/hyfrme-stage-example.tsx"),
);
const upstreamRegistry = await readRemocnRegistry(upstream);
const upstreamCommit = execFileSync(
  "git",
  ["-C", upstream, "rev-parse", "HEAD"],
  { encoding: "utf8" },
).trim();
const additionManifests = await Promise.all(
  [
    "remocn-additions",
    "remocn-additions-2026-09-09",
    "remocn-additions-e3dc260",
    "remocn-templates-7fa2db1",
    "remocn-additions-2026-09-28",
  ].map(async (directory) =>
    JSON.parse(
      await readFile(
        resolve(root, "assets", directory, "manifest.json"),
        "utf8",
      ),
    ),
  ),
);
const textNames = [
  "soft-blur-in",
  "per-character-rise",
  "bottom-up-letters",
  "top-down-letters",
  "spring-scale-in",
  "micro-scale-fade",
  "scale-down-fade",
  "blur-out-up",
  "focus-blur-resolve",
  "line-by-line-slide",
  "per-word-crossfade",
  "fade-through",
  "shared-axis-y",
  "shared-axis-z",
  "short-slide-right",
  "kinetic-center-build",
  "short-slide-down",
  "inline-highlight",
  "strikethrough-replace",
  "staggered-fade-up",
  "mask-reveal-up",
  "shimmer-sweep",
  "marker-highlight",
  "tracking-in",
  "slot-machine-roll",
  "word-stream",
  "word-push",
  "sheen-slide-in",
  "squeeze-in",
  "fog-rise",
  "caret-swap",
  "zoom-words",
  "centered-word-build",
  "inline-pill-takeover",
  "typed-split-wipe",
  "shadow-sweep-text",
  "outline-fill-track-text",
  "gradient-scale-cut-text",
  "rush-type",
  "extrude-pop",
  "kinetic-morph-text",
  "kinetic-warp",
  "stretch-in",
  "gooey-morph",
  "perspective-squeeze",
  "chromatic-wave",
  "type-fossil",
  "inline-word-roll",
  "shader-text-reveal",
  "echo-stack",
  "glyph-anatomy",
  "outline-trace",
  "path-ride",
  "period-drop",
  "ring-text",
  "selection-snap",
  "stripe-type",
  "type-repeater",
  "type-wall",
];
const templateNames = [
  "release-teaser",
  "brand-guidelines",
  "workflow-console",
  "launch-anything",
  "fomo-limit-orders",
];
const coreNames = [
  ...templateNames,
  "shader-light-tunnel",
  "shader-seam",
  "shader-spiral-pass",
  "cursor-gravity",
  "lens-zoom",
  "radial-burst",
  "stage",
  "search-reveal",
  "chat-to-preview-layout",
  "perspective-marquee",
  "live-code-compilation",
  "infinite-bento-pan",
  "infinite-marquee",
  "terminal-simulator",
  "terminal-cursor-zoom",
  "glass-code-block",
  "glass-code-walk",
  "animated-line-chart",
  "animated-bar-chart",
  "simulated-cursor",
  "logo-enter",
  "ecosystem-constellation",
  "matrix-decode",
  "rgb-glitch-text",
  "confetti",
  "backdrop",
  "drift",
  "rolodex-flip",
  "value-swap",
  "number-wheel",
  "rolling-number",
  "swirl-dissolve",
  "dither-dissolve",
  "perlin-dissolve",
  "smoke-dissolve",
  "wave-wipe",
  "ripple-zoom",
  "grain-dissolve",
  "warp-dissolve",
  "whip-pan",
  "push-through",
  "slide-swap",
  "spring-settle",
  "focus-pull",
  "zoom-blur",
  "claude-chat",
  "chat-gpt",
  "v0",
  "claude-code",
  "opencode",
  "github-sponsors",
  "github-stars",
  "x-follow-card",
  "x-followers-overview",
  "shader-mesh-gradient",
  "shader-grain-gradient",
  "shader-warp",
  "shader-swirl",
  "shader-water",
  "shader-spiral",
  "shader-liquid-metal",
  "shader-color-panels",
  "shader-neuro-noise",
  "shader-perlin-noise",
  "shader-simplex-noise",
  "shader-voronoi",
  "shader-dot-orbit",
  "shader-dithering",
  "shader-god-rays",
  "shader-smoke-ring",
  "shader-metaballs",
  "shader-pulsing-border",
  "handwrite",
  "ink-underline",
  "paper-wobble",
  "ink-arrow",
  "paper-sticker",
  "polaroid",
  "hand-count",
  "crumple-toss",
  "scribble-circle",
  "check-list",
  "page-turn",
  "ascii-dissolve",
  "caret-wipe",
  "icon-scatter",
  "shader-caustics",
  "shader-gem-smoke",
  "shader-strata",
  "shader-weave",
  "reel",
  "displacement",
  "ember-burn",
  "glitch-cut",
  "grid-wave",
  "particle-dissolve",
  "ascii-render",
  "camera-lens",
  "crt-screen",
  "halftone-print",
  "hologram",
  "pixelate-region",
  "security-cam",
  "sustained-glitch",
  "tv-power-off",
  "underwater-ripple",
  "vhs-filter",
  "agent-run",
  "bauhaus-build",
  "code-morph",
  "keystroke",
  "mondrian-split",
  "speed-lines",
  "squiggle",
  "trim-burst",
  "truchet-flip",
];
const speedMinOneNames = new Set([
  "chat-gpt",
  "claude-chat",
  "claude-code",
  "github-sponsors",
  "github-stars",
  "number-wheel",
  "opencode",
  "rolling-number",
  "v0",
  "x-follow-card",
  "x-followers-overview",
]);
const primitiveNames = [
  "select-menu",
  "caret",
  "skeleton-block",
  "spinner",
  "typing-indicator",
  "typewriter",
  "button",
  "accordion",
  "checkbox",
  "radio",
  "switch",
  "input",
  "alert-dialog",
  "dialog",
  "sheet",
  "drawer",
  "select",
  "dropdown-menu",
  "tabs",
  "cursor",
  "toast",
  "message-bubble",
  "command-menu",
  "tooltip",
  "progress",
  "skeleton",
  "slider",
  "combobox",
  "popover",
  "context-menu",
  "toggle-group",
  "stepper",
  "resizable",
  "blur-in",
  "signup-flow",
  "ai-prompt-flow",
  "checkout-flow",
  "onboarding-stepper-flow",
  "settings-toggle-flow",
  "chat-flow",
  "telegram-chat-flow",
  "imessage-chat-flow",
  "field",
  "select-item",
  "dropdown-menu-item",
  "command-menu-item",
];
const names = [...textNames, ...coreNames, ...primitiveNames];
const paperShaderNames = new Set([
  "shader-mesh-gradient",
  "shader-grain-gradient",
  "shader-warp",
  "shader-swirl",
  "shader-water",
  "shader-spiral",
  "shader-liquid-metal",
  "shader-color-panels",
  "shader-neuro-noise",
  "shader-perlin-noise",
  "shader-simplex-noise",
  "shader-voronoi",
  "shader-dot-orbit",
  "shader-dithering",
  "shader-god-rays",
  "shader-smoke-ring",
  "shader-metaballs",
  "shader-pulsing-border",
  "shader-gem-smoke",
  "swirl-dissolve",
  "dither-dissolve",
  "perlin-dissolve",
  "smoke-dissolve",
  "wave-wipe",
  "ripple-zoom",
  "grain-dissolve",
  "warp-dissolve",
]);
const paperShaderNotice = `/*!
 * Includes @paper-design/shaders-react 0.0.76 under the PolyForm Shield
 * License 1.0.0. The complete terms ship with this block under
 * THIRD_PARTY_LICENSES/Paper-Shaders-POLYFORM-SHIELD-1.0.0.md.
 */`;
const uiFlowConfig = (compositionWidth = 1280, compositionHeight = 720) => ({
  compositionWidth,
  compositionHeight,
  fps: 30,
  controls: {},
});
const sceneOverrides = {
  caret: {
    source: "registry/remocn-ui/caret/preview.tsx",
    componentName: "CaretPreview",
  },
  "skeleton-block": {
    source: "registry/remocn-ui/skeleton-block/preview.tsx",
    componentName: "SkeletonBlockPreview",
  },
  "typing-indicator": {
    source: "components/docs/examples/typing-indicator-example.tsx",
    componentName: "TypingIndicatorExampleScene",
    uiExample: true,
  },
  "soft-blur-in": {
    source: "registry/remocn/soft-blur-in/index.tsx",
    componentName: "SoftBlurIn",
    extraControls: {
      // Keep the numeric inputs accepted by published customizer links.
      fontWeight: { type: "number", default: 600, label: "Font weight" },
      blur: { type: "number", default: 12, label: "Blur" },
      fontSize: { type: "number", default: 72, label: "Font size" },
    },
  },
  "shader-seam": {
    source: "components/docs/examples/shader-seam-example.tsx",
    componentName: "ShaderSeamExampleScene",
  },
  "shader-spiral-pass": {
    source: "components/docs/examples/shader-spiral-pass-example.tsx",
    componentName: "ShaderSpiralPassExampleScene",
  },
  "lens-zoom": {
    source: "components/docs/examples/lens-zoom-example.tsx",
    componentName: "LensZoomExampleScene",
  },
  stage: {
    source: "components/docs/examples/hyfrme-stage-example.tsx",
    componentName: "HyfrmeStageExampleScene",
    originEntry: "components/docs/examples/stage-example.tsx",
    originComponentName: "StageExampleScene",
    extraControls: {
      imageUrl: {
        type: "text",
        default: "../assets/remocn-additions/stage-remocn-components.webp",
        label: "Image URL",
      },
    },
  },
  "select-menu": {
    source: "components/docs/examples/select-menu-example.tsx",
    componentName: "SelectMenuExampleScene",
    uiExample: true,
  },
  backdrop: {
    source: "components/docs/examples/backdrop-demo.tsx",
    componentName: "BackdropDemo",
  },
  drift: {
    source: "components/docs/examples/drift-example.tsx",
    componentName: "DriftExampleScene",
  },
  "rolodex-flip": {
    source: "components/docs/examples/rolodex-flip-example.tsx",
    componentName: "RolodexFlipExampleScene",
  },
  "value-swap": {
    source: "components/docs/examples/value-swap-example.tsx",
    componentName: "ValueSwapExampleScene",
  },
  "swirl-dissolve": {
    source: "components/docs/examples/swirl-dissolve-example.tsx",
    componentName: "SwirlDissolveExampleScene",
  },
  "dither-dissolve": {
    source: "components/docs/examples/dither-dissolve-example.tsx",
    componentName: "DitherDissolveExampleScene",
  },
  "perlin-dissolve": {
    source: "components/docs/examples/perlin-dissolve-example.tsx",
    componentName: "PerlinDissolveExampleScene",
  },
  "smoke-dissolve": {
    source: "components/docs/examples/smoke-dissolve-example.tsx",
    componentName: "SmokeDissolveExampleScene",
  },
  "wave-wipe": {
    source: "components/docs/examples/wave-wipe-example.tsx",
    componentName: "WaveWipeExampleScene",
  },
  "ripple-zoom": {
    source: "components/docs/examples/ripple-zoom-example.tsx",
    componentName: "RippleZoomExampleScene",
  },
  "grain-dissolve": {
    source: "components/docs/examples/grain-dissolve-example.tsx",
    componentName: "GrainDissolveExampleScene",
  },
  "warp-dissolve": {
    source: "components/docs/examples/warp-dissolve-example.tsx",
    componentName: "WarpDissolveExampleScene",
  },
  "whip-pan": {
    source: "components/docs/examples/whip-pan-example.tsx",
    componentName: "WhipPanExampleScene",
  },
  "push-through": {
    source: "components/docs/examples/push-through-example.tsx",
    componentName: "PushThroughExampleScene",
  },
  "slide-swap": {
    source: "components/docs/examples/slide-swap-example.tsx",
    componentName: "SlideSwapExampleScene",
  },
  "spring-settle": {
    source: "components/docs/examples/spring-settle-example.tsx",
    componentName: "SpringSettleExampleScene",
  },
  "focus-pull": {
    source: "components/docs/examples/focus-pull-example.tsx",
    componentName: "FocusPullExampleScene",
  },
  "zoom-blur": {
    source: "components/docs/examples/zoom-blur-example.tsx",
    componentName: "ZoomBlurExampleScene",
  },
  "ink-underline": {
    source: "components/docs/examples/ink-underline-example.tsx",
    componentName: "InkUnderlineExampleScene",
  },
  "paper-wobble": {
    source: "components/docs/examples/paper-wobble-example.tsx",
    componentName: "PaperWobbleExampleScene",
  },
  "ink-arrow": {
    source: "components/docs/examples/ink-arrow-example.tsx",
    componentName: "InkArrowExampleScene",
  },
  "paper-sticker": {
    source: "components/docs/examples/paper-sticker-example.tsx",
    componentName: "PaperStickerExampleScene",
  },
  polaroid: {
    source: "components/docs/examples/polaroid-example.tsx",
    componentName: "PolaroidExampleScene",
  },
  "crumple-toss": {
    source: "components/docs/examples/crumple-toss-example.tsx",
    componentName: "CrumpleTossExampleScene",
  },
  "scribble-circle": {
    source: "components/docs/examples/scribble-circle-example.tsx",
    componentName: "ScribbleCircleExampleScene",
  },
  "check-list": {
    source: "components/docs/examples/check-list-example.tsx",
    componentName: "CheckListExampleScene",
  },
  "page-turn": {
    source: "components/docs/examples/page-turn-example.tsx",
    componentName: "PageTurnExampleScene",
  },
  "ascii-dissolve": {
    source: "components/docs/examples/ascii-dissolve-example.tsx",
    componentName: "AsciiDissolveExampleScene",
  },
  "caret-wipe": {
    source: "components/docs/examples/caret-wipe-example.tsx",
    componentName: "CaretWipeExampleScene",
  },
  "icon-scatter": {
    source: "components/docs/examples/icon-scatter-example.tsx",
    componentName: "IconScatterExampleScene",
  },
  reel: {
    source: "components/docs/examples/reel-example.tsx",
    componentName: "ReelExampleScene",
  },
  displacement: {
    source: "components/docs/examples/displacement-example.tsx",
    componentName: "DisplacementExampleScene",
  },
  "ember-burn": {
    source: "components/docs/examples/ember-burn-example.tsx",
    componentName: "EmberBurnExampleScene",
  },
  "glitch-cut": {
    source: "components/docs/examples/glitch-cut-example.tsx",
    componentName: "GlitchCutExampleScene",
  },
  "grid-wave": {
    source: "components/docs/examples/grid-wave-example.tsx",
    componentName: "GridWaveExampleScene",
  },
  "particle-dissolve": {
    source: "components/docs/examples/particle-dissolve-example.tsx",
    componentName: "ParticleDissolveExampleScene",
  },
  "ascii-render": {
    source: "components/docs/examples/ascii-render-example.tsx",
    componentName: "AsciiRenderExampleScene",
  },
  "camera-lens": {
    source: "components/docs/examples/camera-lens-example.tsx",
    componentName: "CameraLensExampleScene",
  },
  "crt-screen": {
    source: "components/docs/examples/crt-screen-example.tsx",
    componentName: "CrtScreenExampleScene",
  },
  "halftone-print": {
    source: "components/docs/examples/halftone-print-example.tsx",
    componentName: "HalftonePrintExampleScene",
  },
  hologram: {
    source: "components/docs/examples/hologram-example.tsx",
    componentName: "HologramExampleScene",
  },
  "pixelate-region": {
    source: "components/docs/examples/pixelate-region-example.tsx",
    componentName: "PixelateRegionExampleScene",
  },
  "security-cam": {
    source: "components/docs/examples/security-cam-example.tsx",
    componentName: "SecurityCamExampleScene",
  },
  "sustained-glitch": {
    source: "components/docs/examples/sustained-glitch-example.tsx",
    componentName: "SustainedGlitchExampleScene",
  },
  "tv-power-off": {
    source: "components/docs/examples/tv-power-off-example.tsx",
    componentName: "TvPowerOffExampleScene",
  },
  "underwater-ripple": {
    source: "components/docs/examples/underwater-ripple-example.tsx",
    componentName: "UnderwaterRippleExampleScene",
  },
  "vhs-filter": {
    source: "components/docs/examples/vhs-filter-example.tsx",
    componentName: "VhsFilterExampleScene",
  },
  button: {
    source: "components/docs/examples/button-example.tsx",
    componentName: "ButtonExampleScene",
    controls: ["label", "variant", "size", "primary"],
    durationInFrames: 132,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  accordion: {
    source: "components/docs/examples/accordion-example.tsx",
    componentName: "AccordionExampleScene",
    controls: ["title", "content", "variant"],
    durationInFrames: 100,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  checkbox: {
    source: "components/docs/examples/checkbox-example.tsx",
    componentName: "CheckboxExampleScene",
    controls: ["label", "size", "primary"],
    durationInFrames: 100,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  radio: {
    source: "components/docs/examples/radio-example.tsx",
    componentName: "RadioExampleScene",
    controls: ["label", "size", "primary"],
    durationInFrames: 100,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  switch: {
    source: "components/docs/examples/switch-example.tsx",
    componentName: "SwitchExampleScene",
    controls: ["label", "size", "primary"],
    durationInFrames: 100,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  input: {
    source: "components/docs/examples/input-example.tsx",
    componentName: "InputExampleScene",
    controls: ["placeholder", "value", "size", "primary"],
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "alert-dialog": {
    source: "components/docs/examples/alert-dialog-example.tsx",
    componentName: "AlertDialogExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  dialog: {
    source: "components/docs/examples/dialog-example.tsx",
    componentName: "DialogExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  sheet: {
    source: "components/docs/examples/sheet-example.tsx",
    componentName: "SheetExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  drawer: {
    source: "components/docs/examples/drawer-example.tsx",
    componentName: "DrawerExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  select: {
    source: "components/docs/examples/select-example.tsx",
    componentName: "SelectExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "dropdown-menu": {
    source: "components/docs/examples/dropdown-menu-example.tsx",
    componentName: "DropdownMenuExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  tabs: {
    source: "components/docs/examples/tabs-example.tsx",
    componentName: "TabsExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  cursor: {
    source: "components/docs/examples/cursor-example.tsx",
    componentName: "CursorExampleScene",
    durationInFrames: 140,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  toast: {
    source: "components/docs/examples/toast-example.tsx",
    componentName: "ToastExampleScene",
    durationInFrames: 170,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "message-bubble": {
    source: "components/docs/examples/message-bubble-example.tsx",
    componentName: "MessageBubbleExampleScene",
    durationInFrames: 90,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "command-menu": {
    source: "components/docs/examples/command-menu-example.tsx",
    componentName: "CommandMenuExampleScene",
    durationInFrames: 130,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  tooltip: {
    source: "components/docs/examples/tooltip-example.tsx",
    componentName: "TooltipExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  progress: {
    source: "components/docs/examples/progress-example.tsx",
    componentName: "ProgressExampleScene",
    durationInFrames: 160,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  skeleton: {
    source: "components/docs/examples/skeleton-example.tsx",
    componentName: "SkeletonExampleScene",
    durationInFrames: 220,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  slider: {
    source: "components/docs/examples/slider-example.tsx",
    componentName: "SliderExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  combobox: {
    source: "components/docs/examples/combobox-example.tsx",
    componentName: "ComboboxExampleScene",
    durationInFrames: 120,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  popover: {
    source: "components/docs/examples/popover-example.tsx",
    componentName: "PopoverExampleScene",
    durationInFrames: 130,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "context-menu": {
    source: "components/docs/examples/context-menu-example.tsx",
    componentName: "ContextMenuExampleScene",
    durationInFrames: 135,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "toggle-group": {
    source: "components/docs/examples/toggle-group-example.tsx",
    componentName: "ToggleGroupExampleScene",
    durationInFrames: 115,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  stepper: {
    source: "components/docs/examples/stepper-example.tsx",
    componentName: "StepperExampleScene",
    durationInFrames: 150,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  resizable: {
    source: "components/docs/examples/resizable-example.tsx",
    componentName: "ResizableExampleScene",
    durationInFrames: 205,
    background: "oklch(1 0 0)",
    uiExample: true,
  },
  "blur-in": {
    source: "components/docs/examples/blur-in-example.tsx",
    componentName: "BlurInExampleScene",
    durationInFrames: 40,
    background: "#ffffff",
    uiExample: true,
  },
  "signup-flow": {
    source: "components/docs/examples/signup-flow-example.tsx",
    componentName: "SignupFlowExampleScene",
    controls: [],
    durationInFrames: 380,
    background: "oklch(0.97 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
  "ai-prompt-flow": {
    source: "components/docs/examples/ai-prompt-flow-example.tsx",
    componentName: "AiPromptFlowExampleScene",
    controls: [],
    durationInFrames: 230,
    background: "oklch(1 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
  "checkout-flow": {
    source: "components/docs/examples/checkout-flow-example.tsx",
    componentName: "CheckoutFlowExampleScene",
    controls: [],
    durationInFrames: 320,
    background: "oklch(0.97 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
  "onboarding-stepper-flow": {
    source: "components/docs/examples/onboarding-stepper-flow-example.tsx",
    componentName: "OnboardingStepperFlowExampleScene",
    controls: [],
    durationInFrames: 175,
    background: "oklch(1 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
  "settings-toggle-flow": {
    source: "components/docs/examples/settings-toggle-flow-example.tsx",
    componentName: "SettingsToggleFlowExampleScene",
    controls: [],
    durationInFrames: 320,
    background: "oklch(0.97 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
  "chat-flow": {
    source: "components/docs/examples/chat-flow-example.tsx",
    componentName: "ChatFlowExampleScene",
    controls: [],
    durationInFrames: 360,
    background: "oklch(1 0 0)",
    config: uiFlowConfig(432, 768),
    uiExample: true,
  },
  "telegram-chat-flow": {
    source: "components/docs/examples/telegram-chat-flow-example.tsx",
    componentName: "TelegramChatFlowExampleScene",
    controls: [],
    durationInFrames: 360,
    background: "linear-gradient(180deg, #cfe0ec 0%, #a7c6e0 100%)",
    config: uiFlowConfig(432, 768),
    uiExample: true,
  },
  "imessage-chat-flow": {
    source: "components/docs/examples/imessage-chat-flow-example.tsx",
    componentName: "ImessageChatFlowExampleScene",
    controls: [],
    durationInFrames: 360,
    background: "#ffffff",
    config: uiFlowConfig(432, 768),
    uiExample: true,
  },
  field: {
    source: "components/docs/examples/hyfrme-field-example.tsx",
    componentName: "HyfrmeFieldExampleScene",
    controls: [],
    durationInFrames: 90,
    background: "oklch(1 0 0)",
    config: uiFlowConfig(),
    uiExample: true,
  },
};
const jetBrainsMonoNames = new Set([
  "github-stars",
  "number-wheel",
  "rolling-number",
  "claude-code",
  "opencode",
]);
const interNames = new Set([
  "claude-chat",
  "chat-gpt",
  "v0",
  "x-follow-card",
  "echo-stack",
  "glyph-anatomy",
  "outline-trace",
  "path-ride",
  "period-drop",
  "ring-text",
  "selection-snap",
  "stripe-type",
  "type-repeater",
  "type-wall",
]);
const discreteInterNames = new Set([
  "echo-stack",
  "path-ride",
  "period-drop",
  "ring-text",
  "selection-snap",
  "stripe-type",
  "type-repeater",
]);
const bundledPackagesByName = new Map([
  ["imessage-chat-flow", ["lucide-react"]],
  ["glyph-anatomy", ["opentype.js"]],
  ["outline-trace", ["opentype.js"]],
  ["path-ride", ["@remotion/paths"]],
]);
const manropeNames = new Set([
  "github-sponsors",
  "github-stars",
  "x-followers-overview",
]);
const geistMonoNames = new Set([
  "agent-run",
  "github-stars",
  "live-code-compilation",
  "terminal-simulator",
  "terminal-cursor-zoom",
  "glass-code-block",
  "glass-code-walk",
  "matrix-decode",
  "rolodex-flip",
  "paper-sticker",
  "code-morph",
  "displacement",
  "ember-burn",
  "glitch-cut",
  "grid-wave",
  "particle-dissolve",
  "camera-lens",
  "crt-screen",
  "security-cam",
  "tv-power-off",
  "pixelate-region",
]);
const caveatNames = new Set([
  "handwrite",
  "hand-count",
  "check-list",
  "ink-underline",
  "polaroid",
]);
const sponsorAvatarIds = [
  1, 2, 3, 4, 70, 5, 6, 38, 14, 15, 18, 16, 9, 21, 22, 25, 26, 28, 30, 31, 7,
  12, 13, 19,
];
const starAvatarIds = [1, 2, 3, 4, 14, 18, 25, 26, 28, 30, 31, 21];
const familyIndex = process.argv.indexOf("--family");
const family = familyIndex === -1 ? null : process.argv[familyIndex + 1];
const familyNames =
  family === "text"
    ? textNames
    : family === "core"
      ? coreNames
      : family === "primitive"
        ? primitiveNames
        : family === null
          ? names
          : null;
if (!familyNames) throw new Error(`Unknown compiled family: ${family}`);
const onlyIndex = process.argv.indexOf("--only");
const only =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const selectedNames = only
  ? familyNames.filter((name) => only.has(name))
  : familyNames;

if (only && selectedNames.length !== only.size) {
  throw new Error(
    `Expected ${only.size} known names, found ${selectedNames.length}`,
  );
}
for (const name of selectedNames) {
  if (!upstreamRegistry.items.some((item) => item.name === name)) {
    throw new Error(
      `Source ${upstreamCommit} does not contain ${name}. Select --only names from one source pin.`,
    );
  }
}

const remotionPlugin = {
  name: "hyfrme-remotion-clock",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^remotion$/ }, () => ({
      path: "remotion",
      namespace: "hyfrme-remotion",
    }));
    buildApi.onResolve(
      { filter: /^culori\/fn$/, namespace: "hyfrme-remotion" },
      (args) =>
        buildApi.resolve(args.path, {
          resolveDir: root,
          kind: args.kind,
        }),
    );
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-remotion" }, () => ({
      loader: "js",
      resolveDir: upstream,
      contents: `
          import React, {createContext, useContext} from "react";
          ${frameMathSource}
          let currentFrame = 0;
          let videoConfig = {fps: 30, width: 1280, height: 720, durationInFrames: 60};
          let assetMap = {};
          let nextHandle = 0;
          const pending = new Map();
          const waiting = new Set();
          let sourceError;
          const LocalFrameContext = createContext(null);
          export {Easing, interpolate, interpolateColors, random, spring};
          export const delayRender = (label) => {
            const handle = nextHandle++;
            pending.set(handle, label);
            return handle;
          };
          export const continueRender = (handle) => {
            pending.delete(handle);
            if (pending.size === 0) {
              for (const {resolve} of waiting) resolve();
              waiting.clear();
            }
          };
          export const cancelRender = (error) => {
            sourceError = error instanceof Error ? error : new Error(String(error));
            for (const {reject} of waiting) reject(sourceError);
            waiting.clear();
            throw sourceError;
          };
          export const __waitForSource = () => sourceError ? Promise.reject(sourceError) : pending.size === 0 ? Promise.resolve() : new Promise((resolve, reject) => waiting.add({resolve, reject}));
          ${sourcePaintShim}
          export const __setHyfrmeAssets = (assets) => {assetMap = assets;};
          export const useDelayRender = () => ({delayRender, continueRender, cancelRender});
          export const isHtmlInCanvasSupported = () => {
            if (typeof document === "undefined") return false;
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            return typeof context?.drawElementImage === "function" &&
              typeof canvas.requestPaint === "function" &&
              typeof canvas.captureElementImage === "function" &&
              "transferControlToOffscreen" in HTMLCanvasElement.prototype;
          };
          export const useCurrentFrame = () => useContext(LocalFrameContext)?.frame ?? currentFrame;
          export const useVideoConfig = () => useContext(LocalFrameContext)?.config ?? videoConfig;
          export const AbsoluteFill = ({children, className, style, ...props}) => React.createElement("div", {
            ...props,
            className,
            style: {position: "absolute", inset: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style},
          }, children);
          export const Img = ({children, src, ...props}) => React.createElement("img", {decoding: "sync", ...props, src: assetMap[src] ?? src}, children);
          export const Audio = ({src, volume = 1}) => React.createElement("audio", {
            id: React.useId(), src: assetMap[src] ?? src,
            "data-start": 0, "data-duration": videoConfig.durationInFrames / videoConfig.fps, "data-volume": volume,
          });
          export const Interactive = {Div: ({name, children, ...props}) => React.createElement("div", props, children)};
          export const useRemotionEnvironment = () => ({isStudio: false, isRendering: true, isPlayer: false});
          export const staticFile = (path) => assetMap[path] ?? "/assets/" + path.replace(/^\\//, "");
          export const Sequence = ({from = 0, durationInFrames = Infinity, children, layout, style, className, width, height}) => {
            const localFrame = useCurrentFrame() - from;
            const parentConfig = useVideoConfig();
            if (localFrame < 0 || localFrame >= durationInFrames) return null;
            const content = React.createElement(LocalFrameContext.Provider, {value: {
              frame: localFrame,
              config: {
                ...parentConfig,
                width: width ?? parentConfig.width,
                height: height ?? parentConfig.height,
                durationInFrames: Math.max(0, Math.min(durationInFrames, parentConfig.durationInFrames - from)),
              },
            }}, children);
            if (layout === "none") return content;
            return React.createElement(AbsoluteFill, {
              className,
              style: {flexDirection: undefined, ...(width ? {width} : {}), ...(height ? {height} : {}), ...style},
            }, content);
          };
          export const __setHyfrmeFrame = (frame, config) => {
            currentFrame = frame;
            videoConfig = config;
          };
        `,
    }));
  },
};

const transitionsPlugin = {
  name: "hyfrme-transition-series",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@remotion\/transitions$/ }, () => ({
      path: "transitions",
      namespace: "hyfrme-transitions",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-transitions" }, () => ({
      loader: "jsx",
      resolveDir: upstream,
      contents: `
          import React from "react";
          import {Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";

          const Transition = () => null;
          const TransitionSequence = ({children}) => children;

          export const linearTiming = ({durationInFrames, easing}) => ({
            getDurationInFrames: () => durationInFrames,
            getProgress: ({frame}) => interpolate(frame, [0, durationInFrames], [0, 1], {
              easing,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          });

          export const TransitionSeries = ({children}) => {
            const frame = useCurrentFrame();
            const {fps} = useVideoConfig();
            const entries = React.Children.toArray(children);
            const outgoingImages = React.useRef({});
            const incomingImages = React.useRef({});
            let timelineCursor = 0;
            let transitionOffset = 0;
            const rendered = [];
            const progressUpdates = [];

            const drawIfSynced = (key) => {
              const outgoing = outgoingImages.current[key];
              const incoming = incomingImages.current[key];
              if (!incoming?.elementImage && outgoing?.elementImage) {
                incoming?.draw?.(null, null, 0);
                outgoing.draw(null, outgoing.elementImage, 0);
                return;
              }
              if (!outgoing?.elementImage && incoming?.elementImage) {
                outgoing?.draw?.(null, null, 0);
                incoming.draw(incoming.elementImage, null, 0);
                return;
              }
              if (!outgoing?.elementImage || !incoming?.elementImage) return;
              if (outgoing.progress !== incoming.progress) return;
              incoming.draw(
                incoming.elementImage,
                outgoing.elementImage,
                outgoing.progress,
              );
              outgoing.draw(null, null, 0);
            };

            const setOutgoing = (key, elementImage, progress, draw) => {
              outgoingImages.current[key] = {elementImage, progress, draw};
              drawIfSynced(key);
            };
            const setIncoming = (key, elementImage, progress, draw) => {
              incomingImages.current[key] = {elementImage, progress, draw};
              drawIfSynced(key);
            };

            for (let index = 0; index < entries.length; index += 1) {
              const entry = entries[index];
              if (!React.isValidElement(entry) || entry.type !== TransitionSequence) continue;
              const previous = entries[index - 1];
              const next = entries[index + 1];
              const previousTransition = React.isValidElement(previous) && previous.type === Transition ? previous : null;
              const nextTransition = React.isValidElement(next) && next.type === Transition ? next : null;
              const offset = entry.props.offset ?? 0;
              const rawStart = timelineCursor + offset;
              if (previousTransition) {
                transitionOffset -= previousTransition.props.timing.getDurationInFrames({fps});
              }
              const start = Math.max(0, rawStart + transitionOffset);
              timelineCursor += entry.props.durationInFrames + offset;
              let content = entry.props.children;

              if (nextTransition) {
                const duration = nextTransition.props.timing.getDurationInFrames({fps});
                const progress = nextTransition.props.timing.getProgress({
                  frame: frame - start - entry.props.durationInFrames + duration,
                  fps,
                });
                progressUpdates.push({kind: "outgoing", key: index + 1, progress});
                const presentation = nextTransition.props.presentation;
                const Presentation = presentation.component;
                content = <Presentation
                  passedProps={presentation.props ?? {}}
                  presentationDirection="exiting"
                  presentationProgress={progress}
                  presentationDurationInFrames={duration}
                  onElementImage={(elementImage, draw) => setOutgoing(index + 1, elementImage, progress, draw)}
                  onUnmount={() => setOutgoing(index + 1, null, null, null)}
                  bothEnteringAndExiting={false}
                >{content}</Presentation>;
              }

              if (previousTransition) {
                const duration = previousTransition.props.timing.getDurationInFrames({fps});
                const progress = previousTransition.props.timing.getProgress({
                  frame: frame - start,
                  fps,
                });
                progressUpdates.push({kind: "incoming", key: index - 1, progress});
                const presentation = previousTransition.props.presentation;
                const Presentation = presentation.component;
                content = <Presentation
                  passedProps={presentation.props ?? {}}
                  presentationDirection="entering"
                  presentationProgress={progress}
                  presentationDurationInFrames={duration}
                  onElementImage={(elementImage, draw) => setIncoming(index - 1, elementImage, progress, draw)}
                  onUnmount={() => setIncoming(index - 1, null, null, null)}
                  bothEnteringAndExiting={false}
                >{content}</Presentation>;
              }

              rendered.push(<Sequence key={index} from={start} durationInFrames={entry.props.durationInFrames}>{content}</Sequence>);
            }

            React.useLayoutEffect(() => {
              const keys = new Set();
              for (const update of progressUpdates) {
                const images = update.kind === "outgoing" ? outgoingImages : incomingImages;
                const image = images.current[update.key];
                if (image) image.progress = update.progress;
                keys.add(update.key);
              }
              for (const key of keys) drawIfSynced(key);
            }, [frame]);

            return <>{rendered}</>;
          };
          TransitionSeries.Sequence = TransitionSequence;
          TransitionSeries.Transition = Transition;
        `,
    }));
  },
};

const jetBrainsMonoPlugin = {
  name: "hyfrme-jetbrains-mono",
  setup(buildApi) {
    buildApi.onResolve(
      { filter: /^@remotion\/google-fonts\/JetBrainsMono$/ },
      () => ({ path: "jetbrains-mono", namespace: "hyfrme-font" }),
    );
    buildApi.onLoad(
      { filter: /^jetbrains-mono$/, namespace: "hyfrme-font" },
      () => ({
        loader: "js",
        contents: `
        export const fontFamily = "JetBrains Mono";
        export const loadFont = () => ({
          fontFamily,
          waitUntilDone: () => Promise.resolve(),
        });
      `,
      }),
    );
  },
};

const typographyFontsPlugin = {
  name: "hyfrme-typography-fonts",
  setup(buildApi) {
    buildApi.onResolve(
      { filter: /^@remotion\/google-fonts\/(Inter|Anton)$/ },
      (args) => ({
        path: args.path.split("/").at(-1),
        namespace: "hyfrme-font",
      }),
    );
    buildApi.onLoad(
      { filter: /^(Inter|Anton)$/, namespace: "hyfrme-font" },
      (args) => ({
        loader: "js",
        contents: `
        export const fontFamily = ${JSON.stringify(args.path)};
        export const loadFont = () => ({
          fontFamily,
          waitUntilDone: () => Promise.resolve(),
        });
      `,
      }),
    );
  },
};

const socialFontsPlugin = {
  name: "hyfrme-social-fonts",
  setup(buildApi) {
    const fonts = new Map([
      ["@remotion/google-fonts/Manrope", "Manrope"],
      ["@remotion/google-fonts/GeistMono", "Geist Mono"],
    ]);
    buildApi.onResolve(
      { filter: /^@remotion\/google-fonts\/(Manrope|GeistMono)$/ },
      (args) => ({
        path: fonts.get(args.path),
        namespace: "hyfrme-social-font",
      }),
    );
    buildApi.onLoad(
      { filter: /.*/, namespace: "hyfrme-social-font" },
      (args) => ({
        loader: "js",
        contents: `
          export const fontFamily = ${JSON.stringify(args.path)};
          export const loadFont = () => ({
            fontFamily,
            waitUntilDone: () => Promise.resolve(),
          });
        `,
      }),
    );
  },
};

const caveatPlugin = {
  name: "hyfrme-caveat",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@remotion\/google-fonts\/Caveat$/ }, () => ({
      path: "caveat",
      namespace: "hyfrme-font",
    }));
    buildApi.onLoad({ filter: /^caveat$/, namespace: "hyfrme-font" }, () => ({
      loader: "js",
      contents: `
          export const fontFamily = "Caveat";
          export const loadFont = () => ({
            fontFamily,
            waitUntilDone: () => Promise.resolve(),
          });
        `,
    }));
  },
};

const socialAssetsPlugin = {
  name: "hyfrme-social-assets",
  setup(buildApi) {
    buildApi.onLoad(
      {
        filter:
          /registry\/remocn-ui\/(chat-flow|telegram-chat-flow|imessage-chat-flow)\/index\.tsx$/,
      },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        const name = basename(dirname(args.path));
        const sourceHashes = {
          "chat-flow":
            "1e2e4d7787f7101071f0c3fae46d78a356f09fb8f5626e5d63c0a7872710b4cf",
          "telegram-chat-flow":
            "8471dfb2451fa08a475aff227bce09d66fb6dacea645226c5ea219bd6daef46a",
          "imessage-chat-flow":
            "f57a7ebec304c720c3142138dce199aaf084aa4b0da66be571f27188c2929be8",
        };
        const avatar = socialMedia.find((asset) =>
          asset.components.includes(name),
        );
        const image = "src={contact.avatar}";
        const imports =
          'import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";';
        if (
          !avatar ||
          createHash("sha256").update(source).digest("hex") !==
            sourceHashes[name] ||
          source.split(image).length !== 2 ||
          source.split(imports).length !== 2
        )
          throw new Error(`Unreviewed chat contact image source: ${args.path}`);
        return {
          contents: source
            .replace(imports, imports.replace("spring,", "spring, staticFile,"))
            .replace(
              image,
              `src={contact.avatar === ${JSON.stringify(avatar.sourceUrl)} ? staticFile(contact.avatar) : contact.avatar}`,
            ),
          loader: "tsx",
          resolveDir: dirname(args.path),
        };
      },
    );
    buildApi.onLoad(
      {
        filter:
          /registry\/remocn\/(github-sponsors|github-stars|x-follow-card|x-followers-overview)\/index\.tsx$/,
      },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        let contents = original.replaceAll(
          /https:\/\/avatars\.githubusercontent\.com\/u\/(\d+)\?v=4/g,
          "/assets/social/avatars/u$1.png",
        );
        if (args.path.includes("/github-stars/")) {
          if (
            createHash("sha256").update(original).digest("hex") !==
            "17df5fafc029c13f5337ff09a122a58c2cc01aad36a0613b938f11042ea0576a"
          )
            throw new Error(
              `Unreviewed GitHub Stars fade mask source: ${args.path}`,
            );
          // The authored fade masks cover scrolling row labels as they leave the viewport.
          for (const [needle, replacement] of [
            [
              "<div\n            style={{\n              fontSize: loginSize,",
              "<div data-layout-allow-overflow data-layout-allow-occlusion\n            style={{\n              fontSize: loginSize,",
            ],
            [
              "<div\n            style={{\n              fontSize: 18,\n              fontWeight: 400,\n              color: theme.fgMuted,",
              "<div data-layout-allow-occlusion\n            style={{\n              fontSize: 18,\n              fontWeight: 400,\n              color: theme.fgMuted,",
            ],
            [
              "<span>#{index + 1}</span>",
              "<span data-layout-allow-occlusion>#{index + 1}</span>",
            ],
          ]) {
            if (contents.split(needle).length !== 2)
              throw new Error(
                `Missing GitHub Stars scrolling row boundary: ${args.path}`,
              );
            contents = contents.replace(needle, replacement);
          }
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
  },
};

const sourceAdjustmentsPlugin = {
  name: "hyfrme-source-adjustments",
  setup(buildApi) {
    buildApi.onLoad(
      { filter: /registry\/remocn\/chat-to-preview-layout\/index\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        if (
          createHash("sha256").update(source).digest("hex") !==
          "e3b6bacecbe65583e4d3569bb498260638797dfa354a5f792be3e07770ba1ff1"
        )
          throw new Error("Pinned Chat to Preview Layout source changed");
        const bubble =
          "<div\n          key={i}\n          style={{\n            alignSelf: m.from";
        if (source.split(bubble).length !== 2)
          throw new Error("Expected one native chat bubble definition");
        // User bubbles remain under the preview as the fixed-width chat clips.
        const contents = source.replace(
          bubble,
          bubble.replace(
            "key={i}",
            'key={i} data-layout-allow-occlusion={m.from === "user" || undefined}',
          ),
        );
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );

    buildApi.onLoad(
      { filter: /registry\/remocn\/type-wall\/index\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        const contracts = [
          "<span key={i}>{token}</span>",
          "const NARROW_SCALE = 0.7275 / 0.8594;",
          "const rowHeight = Math.max(8, fontSize * unit);",
          "top: height / 2 + (row - 0.5) * rowHeight,\n              height: rowHeight,",
          "clipPath:\n                state.direction < 0\n                  ? `inset(0 0 0 ${hidden})`\n                  : `inset(0 ${hidden} 0 0)`,",
          'alignItems: "center",\n                whiteSpace: "pre",',
          "lineHeight: 1,\n                fontWeight: narrow ? 400 : 900,",
        ];
        if (contracts.some((contract) => source.split(contract).length !== 2))
          throw new Error(
            `Missing clipped upstream Type Wall row in ${args.path}`,
          );
        // Adjacent streamed rows clip full font boxes to their cap-height bands.
        const contents = source.replace(
          contracts[0],
          "<span data-layout-allow-overlap key={i}>{token}</span>",
        );
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );

    buildApi.onLoad(
      { filter: /registry\/remocn\/number-wheel\/index\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        if (
          createHash("sha256").update(source).digest("hex") !==
          "9c1ac7a6af5ac367a0c7b7928d2ec70326c111258b7bb32a2cf4d38d202dfbd5"
        )
          throw new Error(`Pinned Number Wheel source changed in ${args.path}`);
        const digit =
          "<span\n            key={i}\n            style={{ height: cellHeight, lineHeight: `${cellHeight}px` }}";
        if (source.split(digit).length !== 2)
          throw new Error(
            `Missing mapped upstream Number Wheel digit in ${args.path}`,
          );
        // Each wheel deliberately clips its translated eleven-digit stack to one cell.
        const contents = source.replace(
          digit,
          digit.replace(
            "key={i}",
            "key={i} data-layout-allow-overlap data-layout-allow-occlusion data-layout-allow-overflow",
          ),
        );
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );

    buildApi.onLoad(
      { filter: /registry\/remocn\/zoom-words\/index\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        const camera =
          '<span\n            className={className}\n            style={{\n              display: "inline-flex",\n              alignItems: "baseline",\n              transform: `translateX(-${cameraPct.toFixed(3)}%)`,';
        if (
          source.split(camera).length !== 2 ||
          !source.includes('overflow: "hidden",') ||
          !source.includes("scale: `${zoom}`,")
        )
          throw new Error(`Missing intentional source camera in ${args.path}`);
        // The upstream camera pans words through its clipped viewport.
        const contents = source.replace(
          camera,
          camera.replace("<span", "<span data-layout-allow-overflow"),
        );
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      {
        filter:
          /registry\/remocn\/(shimmer-sweep|infinite-bento-pan)\/index\.tsx$/,
      },
      async (args) => {
        let contents = await readFile(args.path, "utf8");
        // These text layers intentionally sit under the source's sheen or vignette.
        const edits = args.path.includes("/shimmer-sweep/")
          ? [
              [
                "<span style={{ ...textStyle, color: baseColor }}>",
                "<span data-layout-allow-occlusion style={{ ...textStyle, color: baseColor }}>",
              ],
            ]
          : [
              [
                "const labelEl = card.label ? (\n    <div\n",
                "const labelEl = card.label ? (\n    <div data-layout-allow-occlusion\n",
              ],
              [
                '<div\n          style={{\n            flex: 1,\n            display: "flex",\n            alignItems: "center",\n            justifyContent: "flex-start",',
                '<div data-layout-allow-occlusion\n          style={{\n            flex: 1,\n            display: "flex",\n            alignItems: "center",\n            justifyContent: "flex-start",',
              ],
              [
                "<div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>",
                "<div data-layout-allow-occlusion style={{ fontSize: 12, color: accent, fontWeight: 600 }}>",
              ],
              [
                '<div\n          style={{\n            flex: 1,\n            display: "flex",\n            alignItems: "center",\n            fontSize: 48,',
                '<div data-layout-allow-occlusion\n          style={{\n            flex: 1,\n            display: "flex",\n            alignItems: "center",\n            fontSize: 48,',
              ],
              [
                "<span\n            style={{\n              fontSize: 20,",
                "<span data-layout-allow-occlusion\n            style={{\n              fontSize: 20,",
              ],
              [
                "<div style={{ flex: 1 }}>\n          <ChartCard",
                "<div data-layout-allow-overflow style={{ flex: 1 }}>\n          <ChartCard",
              ],
            ];
        for (const [before, after] of edits) {
          if (!contents.includes(before))
            throw new Error(
              `Missing intentional source overlay in ${args.path}`,
            );
          contents = contents.replace(before, after);
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn\/ring-text\/index\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        // Adjacent character panels overlap when the 3D ring faces the camera.
        const contents = source.replace(
          "<span\n",
          "<span data-layout-allow-overlap\n",
        );
        if (contents === source)
          throw new Error(`Missing ring character layer in ${args.path}`);
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn-templates\/brand-guidelines\/ui\.tsx$/ },
      async (args) => {
        let contents = await readFile(args.path, "utf8");
        for (const [from, to] of [
          [
            "export function Label({\n  children,",
            "export function Label({\n  allowOverlap,\n  children,",
          ],
          [
            "  children: React.ReactNode;",
            "  allowOverlap?: boolean;\n  children: React.ReactNode;",
          ],
          [
            'name="Identity label"',
            'name="Identity label" data-layout-allow-overlap={allowOverlap || undefined}',
          ],
        ]) {
          if (!contents.includes(from))
            throw new Error(`Missing palette label adapter in ${args.path}`);
          contents = contents.replace(from, to);
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      {
        filter:
          /registry\/remocn-templates\/(brand-guidelines\/scenes\/(palette|collage|typography)|workflow-console\/ui)\.tsx$/,
      },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        // Preserve upstream's staged panels, overlapping collage, and clipped command text.
        const edits = args.path.endsWith("/palette.tsx")
          ? [
              "<Label\n            style=",
              "<Label allowOverlap\n            style=",
            ]
          : args.path.endsWith("/collage.tsx")
            ? [
                "<div\n        style={{\n          fontSize: fitSize(content.brandName,",
                "<div data-layout-allow-overlap\n        style={{\n          fontSize: fitSize(content.brandName,",
              ]
            : args.path.endsWith("/typography.tsx")
              ? [
                  "<span>\n          {state.caret",
                  "<span data-layout-allow-overlap>\n          {state.caret",
                ]
              : [
                  "<span>{written}</span>",
                  "<span data-layout-allow-overlap>{written}</span>",
                ];
        if (!source.includes(edits[0]))
          throw new Error(`Missing intentional layout layer in ${args.path}`);
        return {
          contents: source.replace(edits[0], edits[1]),
          loader: "tsx",
          resolveDir: dirname(args.path),
        };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn-templates\/[^/]+\/assets\.ts$/ },
      async (args) => {
        let contents = await readFile(args.path, "utf8");
        const assets = additionManifests
          .flatMap((manifest) => manifest.assets)
          .filter(
            (asset) => asset.embedded?.source === relative(upstream, args.path),
          );
        for (const asset of assets) {
          const bytes = await readFile(resolve(root, asset.path));
          const embedded = `data:image/jpeg;base64,${bytes.toString("base64")}`;
          if (!contents.includes(embedded))
            throw new Error(`Embedded image differs from ${asset.path}`);
          contents = contents.replaceAll(embedded, `/${asset.path}`);
        }
        return { contents, loader: "ts", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      { filter: /components\/docs\/examples\/shader-seam-example\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        const circle =
          '<div\n        style={{\n          position: "absolute",\n          right: -100,';
        if (!source.includes(circle))
          throw new Error(
            `Missing Shader Seam decorative rings in ${args.path}`,
          );
        return {
          contents: source.replace(
            circle,
            circle.replace("<div", "<div data-layout-allow-overflow"),
          ),
          loader: "tsx",
          resolveDir: dirname(args.path),
        };
      },
    );
    buildApi.onLoad(
      {
        filter:
          /registry\/remocn\/(extrude-pop|kinetic-morph-text|type-fossil)\/index\.tsx$/,
      },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        // These SVG text copies form extrusion faces, trails, contours, and morph blends.
        const contents = source.replace(
          /<text\b/g,
          '<text data-layout-allow-overlap=""',
        );
        if (contents === source)
          throw new Error(`Missing SVG text layers in ${args.path}`);
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn\/canvas-presentation\/index\.tsx$/ },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        const filterCaptureTrigger = `        const instance = instanceRef.current;
        if (!scene || !capture || !context || !instance) {
          return;
        }
        const elementImage = layout.captureElementImage(scene);`;
        const safeFilterCapture = `        const instance = instanceRef.current;
        if (!scene || !capture || !context || !instance) {
          return;
        }
        let elementImage;
        try {
          elementImage = layout.captureElementImage(scene);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "InvalidStateError" &&
            error.message.includes("No cached paint record")
          ) {
            return;
          }
          throw error;
        }`;
        const trigger = `    React.useLayoutEffect(() => {
      const layout = layoutRef.current;
      if (!layout) {
        return;
      }
      const handle = delayRender("canvas-presentation: filter paint");`;
        const replacement = `    React.useLayoutEffect(() => {
      const capture = captureRef.current;
      const instance = instanceRef.current;
      if (capture && instance && capture.width > 0 && capture.height > 0) {
        instance.draw({
          scene: capture,
          width: capture.width,
          height: capture.height,
          frame: frameRef.current,
          time: timeRef.current,
          passedProps: passedPropsRef.current,
        });
      }
      const layout = layoutRef.current;
      if (!layout) {
        return;
      }
      const handle = delayRender("canvas-presentation: filter paint");`;
        const contents = original
          .replace(filterCaptureTrigger, safeFilterCapture)
          .replace(trigger, replacement);
        if (
          !original.includes(filterCaptureTrigger) ||
          !original.includes(trigger)
        ) {
          throw new Error(
            `Missing expected filter paint effect in ${args.path}`,
          );
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn\/selection-snap\/index\.tsx$/ },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        const padding = "const pad = getSelectionSnapPadding(state.snap);";
        if (!original.includes(padding))
          throw new Error(`Missing Selection Snap padding in ${args.path}`);
        // The source's invalid overshoot padding retains the last valid frame.
        return {
          contents: original.replace(
            padding,
            `let pad = getSelectionSnapPadding(state.snap);
  for (let previousFrame = Math.ceil(frame) - 1;
    (pad.x < 0 || pad.y < 0) && previousFrame >= 0;
    previousFrame--) {
    const previousTime = getSelectionSnapTime(previousFrame, { fps, speed });
    pad = getSelectionSnapPadding(getSelectionSnapState(previousTime).snap);
  }`,
          ),
          loader: "tsx",
          resolveDir: dirname(args.path),
        };
      },
    );
    buildApi.onLoad(
      { filter: /registry\/remocn\/tracking-in\/index\.tsx$/ },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        const contents = original.replace(
          "const blurAmount = interpolate(t, [0, 1], [startBlur, 0]);",
          `const blurAmount = Math.max(
    0,
    interpolate(t, [0, 1], [startBlur, 0]),
  );`,
        );
        if (contents === original) {
          throw new Error(`Missing expected Tracking In blur in ${args.path}`);
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad(
      {
        filter:
          /components\/docs\/examples\/(paper-wobble|ink-arrow|crumple-toss|scribble-circle)-example\.tsx$/,
      },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        const contents = original
          .replace(
            "<div style={{ fontSize: 18, color: PENCIL, marginTop: 6 }}>",
            "<div data-layout-ignore style={{ fontSize: 18, color: PENCIL, marginTop: 6 }}>",
          )
          .replace(
            "<div style={{ fontSize: 15, color: PENCIL }}>{title}</div>",
            "<div data-layout-ignore style={{ fontSize: 15, color: PENCIL }}>{title}</div>",
          )
          .replace(
            '<span\n              style={{\n                display: "inline-block",',
            '<span\n              data-layout-ignore\n              style={{\n                display: "inline-block",',
          );
        if (contents === original) {
          throw new Error(`Missing expected low-contrast copy in ${args.path}`);
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
  },
};

const shaderGatePlugin = {
  name: "hyfrme-shader-render-gate",
  setup(buildApi) {
    buildApi.onLoad(
      { filter: /registry\/remocn\/shader-[^/]+\/index\.tsx$/ },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        if (/\buseDelayRender\b/.test(original)) {
          let contents = original.replace("/* @remocn", "/*! @remocn");
          if (/\/shader-seam\/index\.tsx$/.test(args.path)) {
            contents = annotateShaderSeam(original);
          } else if (/\/shader-spiral-pass\/index\.tsx$/.test(args.path)) {
            // The scene is intentionally covered while the transition is active.
            const scene =
              "<AbsoluteFill\n        style={{\n          visibility: entering !== phase.showNext";
            if (!contents.includes(scene))
              throw new Error(`Missing transition scene layer in ${args.path}`);
            contents = contents.replace(
              scene,
              scene.replace(
                "<AbsoluteFill",
                "<AbsoluteFill data-layout-allow-occlusion={active || undefined}",
              ),
            );
          }
          return {
            contents,
            loader: "tsx",
            resolveDir: dirname(args.path),
          };
        }
        const contents = adaptSourcePaintGate(original, args.path);
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
  },
};

const fontSourcePlugin = {
  name: "hyfrme-frozen-fontsource",
  setup(buildApi) {
    const imports = new Set(
      additionManifests.flatMap((manifest) =>
        manifest.assets
          .filter((asset) => asset.sourceImport)
          .map((asset) => asset.sourceImport),
      ),
    );
    buildApi.onResolve({ filter: /^@fontsource\/.*\.css$/ }, ({ path }) => {
      if (!imports.has(path))
        throw new Error(`Unfrozen font stylesheet: ${path}`);
      return { path, namespace: "hyfrme-fontsource" };
    });
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-fontsource" }, () => ({
      contents: "",
      loader: "js",
    }));
  },
};

const loadConfig = async (path, exportName) => {
  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    entryPoints: [path],
    format: "esm",
    platform: "node",
    plugins: [remotionPlugin, transitionsPlugin, fontSourcePlugin],
    tsconfig: resolve(upstream, "tsconfig.json"),
    write: false,
  });
  const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
  const exports = await import(url);
  if (exportName) return exports[exportName];
  const configs = Object.values(exports).filter(
    (value) =>
      value &&
      typeof value === "object" &&
      "controls" in value &&
      "componentName" in value,
  );
  if (configs.length !== 1)
    throw new Error(`Expected one component config in ${path}`);
  return configs[0];
};

const escapeHtmlAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const parseUiExampleControls = (source, name) => {
  const declaration = source.match(
    /export const \w+ExampleControls\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!declaration) throw new Error(`Missing honored controls for ${name}`);
  return [...declaration[1].matchAll(/["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
};

const fixtures = [];
const geistLatinSource = resolve(root, "assets", "fonts", "Geist-Latin.woff2");
const jetBrainsMonoSource = resolve(
  root,
  "assets",
  "fonts",
  "JetBrainsMono-Latin.woff2",
);
const interSource = resolve(root, "assets", "fonts", "Inter-Latin.woff2");
const antonSource = resolve(root, "assets", "fonts", "Anton-Latin.woff2");
const manropeSource = resolve(root, "assets", "fonts", "Manrope-Latin.woff2");
const geistMonoSource = resolve(
  root,
  "assets",
  "fonts",
  "GeistMono-Latin.woff2",
);
const caveatSource = resolve(
  root,
  "assets/remocn-fonts/Caveat-v23-Latin.woff2",
);
let resolveControls;
const socialMedia = JSON.parse(
  await readFile(resolve(root, "assets/social/manifest.json"), "utf8"),
).assets;
for (const asset of socialMedia) {
  const bytes = await readFile(resolve(root, asset.path));
  if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
    throw new Error(`Frozen social media checksum mismatch: ${asset.path}`);
}

for (const name of selectedNames) {
  const additionManifest = additionManifests.find(
    (item) => item.components[name],
  );
  const addition = additionManifest?.components[name];
  const selectedAssets = (additionManifest?.assets ?? []).filter(
    (asset) =>
      asset.components.includes(name) && asset.role !== "upstream-stylesheet",
  );
  const assetMap = Object.fromEntries(
    selectedAssets
      .filter((asset) =>
        ["font", "local-stylesheet", "image"].includes(asset.role),
      )
      .flatMap((asset) => [
        [asset.sourceUrl, `../${asset.path}`],
        ...(asset.role === "image"
          ? [[basename(asset.path), `../${asset.path}`]]
          : []),
      ]),
  );
  const geistFamily = addition ? "Hyfrme Remocn Geist" : "Geist";
  const monoFile =
    name === "github-stars"
      ? "GeistMono-v6-Latin.woff2"
      : "GeistMono-Latin.woff2";
  const registryItem = upstreamRegistry.items.find(
    (item) => item.name === name,
  );
  const sourcePath = resolve(
    upstream,
    addition?.source ?? registryItem.files[0].path,
  );
  if (discreteInterNames.has(name)) {
    const source = await readFile(sourcePath, "utf8");
    const fontRequest =
      'loadFont("normal", {\n  weights: ["100", "900"],\n  subsets: ["latin"],\n})';
    if (
      !source.includes('from "@remotion/google-fonts/Inter"') ||
      source.split(fontRequest).length !== 2
    )
      throw new Error(`Missing discrete upstream Inter faces in ${sourcePath}`);
  }
  const sceneOverride = sceneOverrides[name];
  const renderSourcePath = sceneOverride
    ? resolve(upstream, sceneOverride.source)
    : sourcePath;
  const configPath = templateNames.includes(name)
    ? sourcePath
    : resolve(dirname(sourcePath), "config.ts");
  const sourceConfig = sceneOverride?.config ?? (await loadConfig(configPath));
  if (!sceneOverride?.config)
    resolveControls ??= await loadConfig(
      resolve(upstream, "lib/customizer-config.ts"),
      "resolveControls",
    );
  const config = !sceneOverride?.config
    ? {
        ...sourceConfig,
        controls: resolveControls(name, sourceConfig.controls),
      }
    : sourceConfig;
  const renderComponentName =
    sceneOverride?.componentName ?? config.componentName;
  const renderSource = sceneOverride
    ? await readFile(renderSourcePath, "utf8")
    : null;
  const source = await readFile(sourcePath, "utf8");
  const interTtfUrl =
    ["glyph-anatomy", "outline-trace"].includes(name)
      ? source.match(/export const interExtraBoldTtf =\s*"([^"]+)";/)?.[1]
      : null;
  if (
    interTtfUrl !== null &&
    (!interTtfUrl ||
      !selectedAssets.some(
        (asset) =>
          asset.role === "font" &&
          asset.sourceUrl === interTtfUrl &&
          asset.path.endsWith(".ttf"),
      ))
  )
    throw new Error(`Missing frozen upstream Inter TTF in ${sourcePath}`);
  const controlKeys =
    sceneOverride?.controls ??
    (sceneOverride?.uiExample
      ? parseUiExampleControls(renderSource, name)
      : null);
  const controls = Object.fromEntries(
    Object.entries({
      ...config.controls,
      ...sceneOverride?.extraControls,
    }).filter(
      ([key]) =>
        (!controlKeys || controlKeys.includes(key)) &&
        (key !== "speed" ||
          !addition ||
          /\bspeed\b/.test(renderSource ?? source)),
    ),
  );
  const props = Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [key, control.default]),
  );
  if (
    /\bspeed\??:/.test(source) &&
    !("speed" in props) &&
    (!controlKeys || controlKeys.includes("speed"))
  )
    props.speed = 1;
  const fixture = {
    width: config.compositionWidth,
    height: config.compositionHeight,
    fps: config.fps,
    durationInFrames:
      sceneOverride?.durationInFrames ??
      (typeof config.durationInFrames === "function"
        ? config.durationInFrames(props)
        : config.durationInFrames),
    props,
    ...(config.previewBackdrop?.type === "image" && !sceneOverride
      ? { previewBackdrop: config.previewBackdrop }
      : {}),
    background:
      sceneOverride?.background ??
      (config.previewBackdrop?.type === "color" ||
      config.previewBackdrop?.type === "gradient"
        ? config.previewBackdrop.value
        : addition
          ? "transparent"
          : "#ffffff"),
  };
  const importPath = `./${relative(upstream, renderSourcePath).replaceAll("\\", "/")}`;
  const sceneImages = selectedAssets.filter(
    (asset) => asset.role === "image" && asset.embedded,
  );
  const entry = `
    import React from "react";
    import {flushSync} from "react-dom";
    import {createRoot} from "react-dom/client";
    import {__setHyfrmeFrame, __setHyfrmeAssets, __waitForSource} from "remotion";
    import {${renderComponentName}} from ${JSON.stringify(importPath)};
    ${fixture.previewBackdrop ? `import {Backdrop} from "./registry/remocn/backdrop/index.tsx";` : ""}
    const container = document.getElementById("hyfrme-source-root");
    const assets = JSON.parse(container.dataset.hyfrmeAssets ?? '{}');
    __setHyfrmeAssets(assets);
    ${
      sceneImages.length
        ? `
    // Retain decoded photos before later scenes mount their image elements.
    const imagePreloads = document.createElement('div');
    imagePreloads.hidden = true;
    const sceneImages = ${JSON.stringify(sceneImages.map((asset) => `/${asset.path}`))}.map(src => {
      const image = new Image();
      image.src = assets[src] ?? src;
      imagePreloads.append(image);
      return image;
    });
    container.before(imagePreloads);
    `
        : ""
    }
    const root = createRoot(container, {identifierPrefix: container.closest('[data-composition-file]')?.dataset.compositionId ?? ${JSON.stringify(name)}});
    const variables = window.__hyperframes.getVariables();
    const config = ${JSON.stringify({
      fps: fixture.fps,
      width: fixture.width,
      height: fixture.height,
      durationInFrames: fixture.durationInFrames,
    })};
    const props = ${JSON.stringify(Object.keys(props))}.reduce((result, key) => {
      result[key] = assets[variables[key]] ?? variables[key];
      return result;
    }, {});
    ${name === "stretch-in" ? `props.fontUrl = assets[${JSON.stringify(selectedAssets.find((asset) => asset.role === "font").sourceUrl)}];` : ""}
    ${interTtfUrl !== null ? `props.fontUrl ??= assets[${JSON.stringify(interTtfUrl)}];` : ""}
    const renderFrame = (frame) => {
      __setHyfrmeFrame(frame, config);
      flushSync(() => root.render(${fixture.previewBackdrop ? `React.createElement(Backdrop, {fill: ${JSON.stringify(fixture.previewBackdrop)}, padding: 0, radius: 0, shadow: ""}, React.createElement(${renderComponentName}, props))` : `React.createElement(${renderComponentName}, ${name === "animated-bar-chart" ? "{...props,key:frame}" : "props"})`}));
    };
    window.__hyfrmeRenderFrame = renderFrame;
    ${
      sceneImages.length
        ? `
    window.addEventListener('hf-seek', event => {
      event.detail.waitUntil(Promise.resolve().then(() =>
        Promise.all(Array.from(container.querySelectorAll('img')).map(image => image.decode()))
      ));
    });
    `
        : ""
    }
    window.__hyfrmeReady = (async () => {
      ${sceneImages.length ? "await Promise.all(sceneImages.map(image => image.decode()));" : ""}
      ${
        name === "kinetic-warp"
          ? `if (props.fontUrl && props.fontUrl !== assets[${JSON.stringify(selectedAssets.find((asset) => asset.role === "local-stylesheet").sourceUrl)}]) {
        await new Promise((resolve, reject) => {
          const stylesheet = document.createElement('link');
          stylesheet.rel = 'stylesheet';
          stylesheet.href = props.fontUrl;
          stylesheet.onload = resolve;
          stylesheet.onerror = () => reject(new Error('Could not load font stylesheet: ' + props.fontUrl));
          document.head.appendChild(stylesheet);
        });
      }`
          : ""
      }
      const families = new Set(${JSON.stringify([geistFamily, ...selectedAssets.filter((asset) => asset.family).map((asset) => asset.family)])});
      ${jetBrainsMonoNames.has(name) ? 'families.add("JetBrains Mono");' : ""}
      ${interNames.has(name) ? 'families.add("Inter");' : ""}
      ${name === "agent-run" ? 'families.add("Geist");' : ""}
      ${geistMonoNames.has(name) ? 'families.add("Geist Mono");' : ""}
      ${manropeNames.has(name) ? 'families.add("Manrope");' : ""}
      ${caveatNames.has(name) ? 'families.add("Caveat");' : ""}
      ${name === "type-wall" ? 'families.add("Anton");' : ""}
      ${name === "kinetic-warp" ? "families.add(props.fontFamily);" : ""}
      await Promise.all(Array.from(document.fonts).filter(font => families.has(font.family.replaceAll('"', '').replaceAll("'", ''))).map(font => font.load()));
      await document.fonts.ready;
      renderFrame(0);
      await __waitForSource();
      ${fixture.previewBackdrop ? "await Promise.all(Array.from(container.querySelectorAll('img')).map(image => image.decode()));" : ""}
      renderFrame(0);
      await Promise.all(Array.from(container.querySelectorAll('img')).map(image => image.decode()));
    })();
  `;
  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    format: "iife",
    minify: true,
    metafile: true,
    ...(addition || name.startsWith("shader-") || paperShaderNames.has(name)
      ? { supported: { "template-literal": false } }
      : {}),
    platform: "browser",
    plugins: [
      remotionPlugin,
      transitionsPlugin,
      jetBrainsMonoPlugin,
      typographyFontsPlugin,
      socialFontsPlugin,
      caveatPlugin,
      socialAssetsPlugin,
      sourceAdjustmentsPlugin,
      shaderGatePlugin,
      ...(paperShaderNames.has(name) ? [frameDrivenPaperPlugin] : []),
      fontSourcePlugin,
    ],
    stdin: {
      contents: entry,
      loader: "tsx",
      resolveDir: upstream,
      sourcefile: `${name}-hyfrme-entry.tsx`,
    },
    target: ["chrome120"],
    tsconfig: resolve(upstream, "tsconfig.json"),
    banner: {
      js: paperShaderNames.has(name)
        ? `${remocnMitBanner}\n${paperShaderNotice}`
        : remocnMitBanner,
    },
    write: false,
  });
  const runtime = result.outputFiles[0].text;
  const catalogFamily = textNames.includes(name)
    ? "text"
    : primitiveNames.includes(name)
      ? "primitive"
      : "core";
  const displayTitle =
    catalogFamily === "primitive"
      ? registryItem.title.replace(/^UI\s+/, "")
      : name.startsWith("shader-") &&
          !["shader-seam", "shader-spiral-pass", "shader-text-reveal"].includes(
            name,
          )
        ? registryItem.title.replace(/^Shader\s+/, "")
        : registryItem.title;
  const duration = fixture.durationInFrames / fixture.fps;
  const variables = Object.entries(controls).map(([id, control]) => {
    const variable = {
      id,
      type:
        control.type === "text" || control.type === "text-content"
          ? "string"
          : control.type === "select"
            ? "string"
            : control.type === "number-input"
              ? "number"
              : control.type,
      label: control.label ?? id,
      default: Object.hasOwn(props, id) ? props[id] : control.default,
    };
    // Published marquee links accept weights beyond the upstream control menu.
    const unrestrictedWeight =
      id === "fontWeight" &&
      (name === "infinite-marquee" || name === "perspective-marquee");
    if (Array.isArray(control.options) && !unrestrictedWeight)
      variable.options = control.options;
    if (!["string", "number", "boolean", "color"].includes(variable.type)) {
      throw new Error(
        `${name}.${id}: unsupported variable type ${variable.type}`,
      );
    }
    for (const key of ["min", "max", "step"]) {
      if (typeof control[key] === "number") variable[key] = control[key];
    }
    if (id === "speed" && speedMinOneNames.has(name)) {
      variable.min = 1;
      variable.max = 4;
      variable.step = 0.25;
    }
    return variable;
  });
  if (
    "speed" in props &&
    !variables.some((variable) => variable.id === "speed")
  ) {
    variables.push({
      id: "speed",
      type: "number",
      label: "Speed",
      default: 1,
      ...(speedMinOneNames.has(name) ? { min: 1, max: 4, step: 0.25 } : {}),
    });
  }
  const localFontCss = (
    await Promise.all(
      selectedAssets
        .filter((asset) => asset.role === "local-stylesheet")
        .map(async (asset) =>
          (await readFile(resolve(root, asset.path), "utf8")).replaceAll(
            "url(./",
            `url(../${dirname(asset.path)}/`,
          ),
        ),
    )
  ).join("\n");
  const blockDirectory = resolve(root, "registry", "blocks", name);
  await mkdir(blockDirectory, { recursive: true });
  const packagedAssets = [
    {
      path: "licenses/Geist-OFL.txt",
      target: addition
        ? "THIRD_PARTY_LICENSES/remocn/Geist-OFL.txt"
        : "THIRD_PARTY_LICENSES/Geist-OFL.txt",
      source: resolve(
        root,
        "assets",
        addition ? "remocn-additions" : "fonts",
        "Geist-OFL.txt",
      ),
    },
  ];
  const packageLicenses = new Set(["MIT", "OFL-1.1"]);
  const bundledDependencies = [];
  const bundledPackages = new Map(
    Object.values(result.metafile.outputs)
      .flatMap((output) => Object.entries(output.inputs))
      .filter(
        ([path, input]) =>
          path.includes("node_modules/") && input.bytesInOutput > 0,
      )
      .map(([path]) => {
        const parts = path.split("node_modules/").at(-1).split("/");
        const packageName = parts[0].startsWith("@")
          ? parts.slice(0, 2).join("/")
          : parts[0];
        return [
          packageName,
          resolve(
            upstream,
            path.slice(0, path.lastIndexOf("node_modules/")),
            "node_modules",
            packageName,
          ),
        ];
      }),
  );
  const requiredPackages = new Set(bundledPackagesByName.get(name) ?? []);
  if (bundledPackages.has("culori")) requiredPackages.add("culori");
  for (const packageName of requiredPackages) {
    const directory = bundledPackages.get(packageName);
    if (!directory) {
      throw new Error(`${name} did not bundle expected ${packageName}`);
    }
    const manifest = JSON.parse(
      await readFile(resolve(directory, "package.json"), "utf8"),
    );
    packageLicenses.add(manifest.license);
    bundledDependencies.push({
      name: packageName,
      version: manifest.version,
      license: manifest.license,
    });
    const licenses = (await readdir(directory)).filter((file) =>
      /^(license|copying|notice)([.-]|$)/i.test(file),
    );
    if (!licenses.length) throw new Error(`Missing ${packageName} license`);
    for (const license of licenses) {
      const filename = `${packageName.replaceAll("/", "-")}-${license}`;
      packagedAssets.push({
        path: `licenses/${filename}`,
        target: `THIRD_PARTY_LICENSES/remocn/${filename}`,
        source: resolve(directory, license),
      });
    }
  }
  if (addition) {
    packagedAssets.push({
      path: "licenses/Remocn-MIT.txt",
      target: "THIRD_PARTY_LICENSES/remocn/Remocn-MIT.txt",
      source: resolve(upstream, "LICENSE"),
    });
    for (const asset of selectedAssets) {
      if (
        asset.reused ||
        ["Geist-OFL.txt", "REMOCN-LICENSE.txt", "Remocn-MIT.txt"].includes(
          basename(asset.path),
        )
      )
        continue;
      const license = asset.role.includes("license");
      const assetPath = templateNames.includes(name)
        ? relative(resolve(root, "assets"), resolve(root, asset.path))
        : basename(asset.path);
      packagedAssets.push({
        path: `${license ? "licenses" : "remocn-additions"}/${assetPath}`,
        target: license
          ? `THIRD_PARTY_LICENSES/remocn/${assetPath}`
          : asset.path,
        source: resolve(root, asset.path),
      });
      if (asset.license) packageLicenses.add(asset.license);
    }
    for (const [packageName, directory] of bundledPackages) {
      if (requiredPackages.has(packageName)) continue;
      const manifest = JSON.parse(
        await readFile(resolve(directory, "package.json"), "utf8"),
      );
      packageLicenses.add(manifest.license);
      if (selectedAssets.some((asset) => asset.package === packageName))
        continue;
      const licenses = (await readdir(directory)).filter((file) =>
        /^(license|copying|notice)([.-]|$)/i.test(file),
      );
      if (!licenses.length) throw new Error(`Missing ${packageName} license`);
      for (const license of licenses) {
        const filename = `${packageName.replaceAll("/", "-")}-${license}`;
        packagedAssets.push({
          path: `licenses/${filename}`,
          target: `THIRD_PARTY_LICENSES/remocn/${filename}`,
          source: resolve(directory, license),
        });
      }
    }
  }
  if (jetBrainsMonoNames.has(name)) {
    packagedAssets.push({
      path: "licenses/JetBrainsMono-OFL.txt",
      target: "THIRD_PARTY_LICENSES/JetBrainsMono-OFL.txt",
      source: resolve(root, "assets", "fonts", "JetBrainsMono-OFL.txt"),
    });
  }
  if (interNames.has(name)) {
    packagedAssets.push({
      path: "licenses/Inter-OFL.txt",
      target: "THIRD_PARTY_LICENSES/Inter-OFL.txt",
      source: resolve(root, "assets", "fonts", "Inter-OFL.txt"),
    });
  }
  if (name === "type-wall") {
    packagedAssets.push({
      path: "licenses/Anton-OFL.txt",
      target: "THIRD_PARTY_LICENSES/Anton-OFL.txt",
      source: resolve(root, "assets", "fonts", "Anton-OFL.txt"),
    });
  }
  if (manropeNames.has(name)) {
    packagedAssets.push({
      path: "licenses/Manrope-OFL.txt",
      target: "THIRD_PARTY_LICENSES/Manrope-OFL.txt",
      source: resolve(root, "assets", "fonts", "Manrope-OFL.txt"),
    });
  }
  if (geistMonoNames.has(name)) {
    packagedAssets.push({
      path: "licenses/GeistMono-OFL.txt",
      target: "THIRD_PARTY_LICENSES/GeistMono-OFL.txt",
      source: resolve(root, "assets", "fonts", "GeistMono-OFL.txt"),
    });
  }
  if (caveatNames.has(name)) {
    packagedAssets.push({
      path: "licenses/Caveat-OFL.txt",
      target: "THIRD_PARTY_LICENSES/Caveat-OFL.txt",
      source: resolve(root, "assets", "fonts", "Caveat-OFL.txt"),
    });
  }
  if (paperShaderNames.has(name)) {
    packagedAssets.push({
      path: "licenses/Paper-Shaders-POLYFORM-SHIELD-1.0.0.md",
      target: "THIRD_PARTY_LICENSES/Paper-Shaders-POLYFORM-SHIELD-1.0.0.md",
      source: resolve(
        root,
        "assets",
        "licenses",
        "Paper-Shaders-POLYFORM-SHIELD-1.0.0.md",
      ),
    });
  }
  if (name === "github-stars") {
    packagedAssets.push({
      path: "licenses/Date-Fns-MIT.md",
      target: "THIRD_PARTY_LICENSES/Date-Fns-MIT.md",
      source: resolve(root, "assets", "licenses", "Date-Fns-MIT.md"),
    });
    const repoOwner = props.repo.split("/")[0] || props.repo;
    const avatar = socialMedia.find(
      (asset) => asset.sourceUrl === `https://unavatar.io/github/${repoOwner}`,
    );
    if (!avatar) throw new Error("Missing frozen upstream repository avatar");
    packagedAssets.push({
      path: "repository-avatar.png",
      target: avatar.path,
      source: resolve(root, avatar.path),
    });
    assetMap[avatar.sourceUrl] = `../${avatar.path}`;
  }
  if (
    ["chat-flow", "telegram-chat-flow", "imessage-chat-flow"].includes(name)
  ) {
    const avatar = socialMedia.find((asset) => asset.components.includes(name));
    if (!avatar) throw new Error(`Missing frozen chat contact avatar: ${name}`);
    packagedAssets.push({
      path: "contact-avatar.jpg",
      target: avatar.path,
      source: resolve(root, avatar.path),
    });
    assetMap[avatar.sourceUrl] = `../${avatar.path}`;
  }
  const avatarIds =
    name === "github-sponsors"
      ? sponsorAvatarIds
      : name === "github-stars"
        ? starAvatarIds
        : [];
  for (const id of avatarIds) {
    const path = `avatars/u${id}.png`;
    packagedAssets.push({
      path,
      target: `assets/social/${path}`,
      source: resolve(root, "assets", "social", path),
    });
  }
  if (name === "x-follow-card" || name === "x-followers-overview") {
    if (props.avatarUrl !== "/logo.svg")
      throw new Error(`${name}: pinned avatar default changed`);
    packagedAssets.push({
      path: "logo.svg",
      target: "assets/social/logo.svg",
      source: resolve(root, "assets", "social", "logo.svg"),
    });
    assetMap[props.avatarUrl] = "../assets/social/logo.svg";
  }
  if (name === "x-follow-card") {
    if (props.coverUrl !== "/imgs/x-cover.png")
      throw new Error("Pinned X Follow Card cover default changed");
    packagedAssets.push({
      path: "imgs/x-cover.png",
      target: "assets/social/imgs/x-cover.png",
      source: resolve(root, "assets", "social", "imgs", "x-cover.png"),
    });
    assetMap[props.coverUrl] = "../assets/social/imgs/x-cover.png";
  }
  if (name === "reel") {
    for (let index = 1; index <= 6; index += 1) {
      const path = `reel/reel-${index}.jpg`;
      packagedAssets.push({
        path,
        target: `assets/${path}`,
        source: resolve(upstream, "public", path),
      });
    }
  }
  if (name === "backdrop") {
    if (controls.image.default !== "/hero.png")
      throw new Error("Pinned Backdrop image default changed");
    packagedAssets.push({
      path: "preview/hero.png",
      target: "assets/remocn-preview/hero.png",
      source: resolve(upstream, "public/hero.png"),
    });
    assetMap["/hero.png"] = "../assets/remocn-preview/hero.png";
  }
  if (fixture.previewBackdrop) {
    const sourcePath = fixture.previewBackdrop.src;
    if (sourcePath !== "/bg.jpg")
      throw new Error(
        `${name}: unsupported preview backdrop asset ${sourcePath}`,
      );
    packagedAssets.push({
      path: "preview/bg.jpg",
      target: "assets/remocn-preview/bg.jpg",
      source: resolve(upstream, "public/bg.jpg"),
    });
    assetMap[sourcePath] = "../assets/remocn-preview/bg.jpg";
  }
  for (const asset of packagedAssets) {
    if (asset.target.startsWith("assets/")) {
      assetMap[`/${asset.target}`] = `../${asset.target}`;
    }
    const output = resolve(blockDirectory, asset.path);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(asset.source, output);
  }
  const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeHtmlAttribute(JSON.stringify(variables))}'>
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${localFontCss}
      @font-face { font-family: "${geistFamily}"; src: url("../assets/fonts/Geist-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }
${name === "agent-run" ? '      @font-face { font-family: "Geist"; src: url("../assets/fonts/Geist-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }' : ""}
${jetBrainsMonoNames.has(name) ? '      @font-face { font-family: "JetBrains Mono"; src: url("../assets/fonts/JetBrainsMono-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 800; font-display: block; }' : ""}
${interNames.has(name) ? (discreteInterNames.has(name) ? ["100", "900"] : ["100 900"]).map((weight) => `      @font-face { font-family: "Inter"; src: url("../assets/fonts/Inter-Latin.woff2") format("woff2"); font-style: normal; font-weight: ${weight}; font-display: block; }`).join("\n") : ""}
${name === "type-wall" ? '      @font-face { font-family: "Anton"; src: url("../assets/fonts/Anton-Latin.woff2") format("woff2"); font-style: normal; font-weight: 400; font-display: block; }' : ""}
${manropeNames.has(name) ? '      @font-face { font-family: "Manrope"; src: url("../assets/fonts/Manrope-Latin.woff2") format("woff2"); font-style: normal; font-weight: 200 800; font-display: block; }' : ""}
${geistMonoNames.has(name) ? `      @font-face { font-family: "Geist Mono"; src: url("../assets/fonts/${monoFile}") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }` : ""}
${caveatNames.has(name) ? '      @font-face { font-family: "Caveat"; src: url("../assets/fonts/Caveat-Latin.woff2") format("woff2"); font-style: normal; font-weight: 400 700; font-display: block; }' : ""}
      * { box-sizing: border-box; }
      html, body { width: ${fixture.width}px; height: ${fixture.height}px; margin: 0; overflow: hidden; background: ${fixture.background}; }
      body { --font-geist-sans: "${geistFamily}"; font-family: "${geistFamily}", -apple-system, BlinkMacSystemFont, sans-serif; }
      #hyfrme-source-root { position: absolute; inset: 0; --font-geist-sans:"${geistFamily}";font-family:"${geistFamily}",sans-serif; background:${fixture.background}; }
${geistMonoNames.has(name) ? '      #hyfrme-source-root { --font-geist-mono: "Geist Mono"; }' : ""}
${sourcePreviewCss}
${canvasTransitionNames.has(name) || canvasFilterNames.has(name) ? "      [data-hyfrme-seek-probe] { position: absolute; width: 1px; height: 1px; pointer-events: none; }" : ""}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${name}" data-start="0" data-duration="${duration}" data-fps="${frameRateArgument(fixture.fps)}" data-width="${fixture.width}" data-height="${fixture.height}">
${canvasTransitionNames.has(name) || canvasFilterNames.has(name) ? "      <canvas layoutsubtree hidden data-layout-ignore data-hyfrme-clock></canvas>" : "      <span hidden data-layout-ignore data-hyfrme-clock></span>"}
${canvasTransitionNames.has(name) || canvasFilterNames.has(name) ? '      <span data-hyfrme-seek-probe aria-hidden="true"></span>' : ""}
      <div id="hyfrme-source-stage" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        <div id="hyfrme-source-root" data-hyfrme-assets='${escapeHtmlAttribute(JSON.stringify(assetMap))}'${canvasTransitionNames.has(name) || canvasFilterNames.has(name) ? " data-layout-ignore data-layout-allow-occlusion data-layout-allow-overlap" : name === "shimmer-sweep" ? " data-layout-allow-occlusion" : ""}></div>
      </div>
    </div>
    <script src="./${name}.runtime.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const renderFrame = window.__hyfrmeRenderFrame;
      window.__hyfrmeReady.then(() => {
      const clock = document.querySelector('[data-composition-id="${name}"] [data-hyfrme-clock]');
      clock.frame = 0;
      const timeline = gsap.timeline({ paused: true });
      timeline.to('[data-composition-id="${name}"] [data-hyfrme-clock]', {
        frame: ${fixture.durationInFrames},
        duration: ${duration},
        ease: "none",
        onUpdate: () => renderFrame(Math.max(0, Math.min(${fixture.durationInFrames - 1}, Math.round(clock.frame)))),
      });
${canvasTransitionNames.has(name) || canvasFilterNames.has(name) ? `      timeline.to('[data-composition-id="${name}"] [data-hyfrme-seek-probe]', { x: 120, duration: ${duration}, ease: "none" }, 0);` : ""}
      window.__timelines["${name}"] = timeline;
      window.__hfForceTimelineRebind?.();
      });
    </script>
  </body>
</html>
`;
  await writeFile(resolve(blockDirectory, `${name}.html`), html);
  await writeFile(resolve(blockDirectory, `${name}.runtime.js`), runtime);
  const geistFile = { source: geistLatinSource, name: "Geist-Latin.woff2" };
  await copyFile(geistFile.source, resolve(blockDirectory, geistFile.name));
  if (jetBrainsMonoNames.has(name)) {
    await copyFile(
      jetBrainsMonoSource,
      resolve(blockDirectory, "JetBrainsMono-Latin.woff2"),
    );
  }
  if (interNames.has(name)) {
    await copyFile(interSource, resolve(blockDirectory, "Inter-Latin.woff2"));
  }
  if (name === "type-wall") {
    await copyFile(antonSource, resolve(blockDirectory, "Anton-Latin.woff2"));
  }
  if (manropeNames.has(name)) {
    await copyFile(
      manropeSource,
      resolve(blockDirectory, "Manrope-Latin.woff2"),
    );
  }
  if (geistMonoNames.has(name)) {
    await copyFile(
      name === "github-stars"
        ? resolve(root, "assets/remocn-fonts", monoFile)
        : geistMonoSource,
      resolve(blockDirectory, monoFile),
    );
  }
  if (caveatNames.has(name)) {
    await copyFile(caveatSource, resolve(blockDirectory, "Caveat-Latin.woff2"));
  }
  await writeFile(
    resolve(blockDirectory, "registry-item.json"),
    `${JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
        name,
        type: "hyperframes:block",
        title: displayTitle,
        description: `${registryItem.description} Compiled for deterministic HyperFrames playback by Hyfrme.`,
        tags:
          catalogFamily === "text"
            ? ["typography", "effect", "remocn-port"]
            : catalogFamily === "primitive"
              ? ["ui", "primitive", "remocn-port"]
              : canvasTransitionNames.has(name)
                ? ["transition", "html-in-canvas", "webgl", "remocn-port"]
                : canvasFilterNames.has(name)
                  ? ["filter", "html-in-canvas", "webgl", "remocn-port"]
                  : ["composition", "data", "remocn-port"],
        author: "Hyfrme",
        authorUrl: "https://github.com/AksharP5/hyfrme",
        license: addition
          ? [...packageLicenses].join(" AND ")
          : bundledDependencies.length
            ? [...new Set(["MIT", "OFL-1.1", ...packageLicenses])].join(" AND ")
            : paperShaderNames.has(name)
              ? "MIT + PolyForm Shield 1.0.0"
              : "MIT",
        ...(bundledDependencies.length ? { bundledDependencies } : {}),
        dimensions: { width: fixture.width, height: fixture.height },
        duration,
        files: [
          {
            path: `${name}.html`,
            target: `compositions/${name}.html`,
            type: "hyperframes:composition",
          },
          {
            path: `${name}.runtime.js`,
            target: `compositions/${name}.runtime.js`,
            type: "hyperframes:asset",
          },
          {
            path: geistFile.name,
            target: `assets/fonts/${geistFile.name}`,
            type: "hyperframes:asset",
          },
          ...(jetBrainsMonoNames.has(name)
            ? [
                {
                  path: "JetBrainsMono-Latin.woff2",
                  target: "assets/fonts/JetBrainsMono-Latin.woff2",
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...(interNames.has(name)
            ? [
                {
                  path: "Inter-Latin.woff2",
                  target: "assets/fonts/Inter-Latin.woff2",
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...(name === "type-wall"
            ? [
                {
                  path: "Anton-Latin.woff2",
                  target: "assets/fonts/Anton-Latin.woff2",
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...(manropeNames.has(name)
            ? [
                {
                  path: "Manrope-Latin.woff2",
                  target: "assets/fonts/Manrope-Latin.woff2",
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...(geistMonoNames.has(name)
            ? [
                {
                  path: monoFile,
                  target: `assets/fonts/${monoFile}`,
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...(caveatNames.has(name)
            ? [
                {
                  path: "Caveat-Latin.woff2",
                  target: "assets/fonts/Caveat-Latin.woff2",
                  type: "hyperframes:asset",
                },
              ]
            : []),
          ...packagedAssets.map((asset) => ({
            path: asset.path,
            target: asset.target,
            type: "hyperframes:asset",
          })),
        ],
      },
      null,
      2,
    )}\n`,
  );
  fixtures.push({
    slug: name,
    catalogFamily,
    title: displayTitle,
    description: registryItem.description,
    componentName: sceneOverride?.originComponentName ?? renderComponentName,
    origin: {
      repository: "https://github.com/Remocn/remocn",
      commit: upstreamCommit,
      source: relative(upstream, sourcePath),
      ...(sceneOverride
        ? { entry: sceneOverride.originEntry ?? sceneOverride.source }
        : {}),
      ...(sceneOverride?.config
        ? {}
        : { config: relative(upstream, configPath) }),
      license: "MIT",
    },
    fixture,
  });
  console.log(
    `Generated ${name}: ${fixture.durationInFrames} frames, ${Math.round(runtime.length / 1024)} KiB runtime`,
  );
}

const writeFixtures = async (catalogFamily, filename, orderedNames) => {
  if (family !== null && family !== catalogFamily) return;
  const generated = fixtures.filter(
    (entry) => entry.catalogFamily === catalogFamily,
  );
  if (!generated.length) return;
  let output = generated;
  if (only) {
    const existing = JSON.parse(
      await readFile(resolve(root, "catalog", filename), "utf8"),
    );
    const replacements = new Map(generated.map((entry) => [entry.slug, entry]));
    output = [
      ...existing
        .filter((entry) => !replacements.has(entry.slug))
        .map((entry) => [entry.slug, entry]),
      ...generated.map((entry) => [entry.slug, entry]),
    ]
      .sort(
        ([left], [right]) =>
          orderedNames.indexOf(left) - orderedNames.indexOf(right),
      )
      .map(([, entry]) => entry);
  }
  await writeFile(
    resolve(root, "catalog", filename),
    `${JSON.stringify(output, null, 2)}\n`,
  );
};

await writeFixtures("text", "text-fixtures.json", textNames);
await writeFixtures("core", "core-fixtures.json", coreNames);
await writeFixtures("primitive", "primitive-fixtures.json", primitiveNames);
