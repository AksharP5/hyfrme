import { build } from "esbuild";
import { execFileSync } from "node:child_process";
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
const asciiRenderWrapperPath = resolve(
  upstream,
  "components/docs/examples/hyfrme-ascii-render-example.tsx",
);
await copyFile(
  resolve(root, "fixtures/remocn/ascii-render-example.tsx"),
  asciiRenderWrapperPath,
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
];
const canvasTransitionNames = new Set([
  "displacement",
  "ember-burn",
  "glitch-cut",
  "grid-wave",
  "particle-dissolve",
]);
const canvasFilterNames = new Set([
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
]);
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
    source: "components/docs/examples/hyfrme-ascii-render-example.tsx",
    originEntry: "components/docs/examples/ascii-render-recipes.tsx",
    originComponentName: "AsciiResolveExampleScene",
    componentName: "HyfrmeAsciiRenderExampleScene",
    durationInFrames: 96,
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
const interNames = new Set(["claude-chat", "chat-gpt", "v0", "x-follow-card"]);
const manropeNames = new Set([
  "github-sponsors",
  "github-stars",
  "x-followers-overview",
]);
const geistMonoNames = new Set(["github-stars"]);
const sourceTextRenderingNames = new Set([
  ...templateNames,
  "lens-zoom",
  "github-stars",
  "inline-word-roll",
  "shader-seam",
  "shader-spiral-pass",
]);
const caveatNames = new Set(["handwrite", "hand-count", "check-list"]);
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
  const manifests = additionManifests.filter((item) => item.components[name]);
  if (
    manifests.length &&
    !manifests.some((manifest) => upstreamCommit === manifest.upstream.commit)
  ) {
    throw new Error(
      `${name} requires source ${manifests.map((manifest) => manifest.upstream.commit).join(" or ")}. Select --only names from that pin.`,
    );
  }
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
          export const useCurrentFrame = () => useContext(LocalFrameContext) ?? currentFrame;
          export const useVideoConfig = () => videoConfig;
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
          export const Sequence = ({from = 0, durationInFrames = Infinity, children, layout, style, className}) => {
            const localFrame = useCurrentFrame() - from;
            if (localFrame < 0 || localFrame >= durationInFrames) return null;
            const content = React.createElement(LocalFrameContext.Provider, {value: localFrame}, children);
            if (layout === "none") return content;
            return React.createElement("div", {
              className,
              style: {position: "absolute", inset: 0, ...style},
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

const interPlugin = {
  name: "hyfrme-inter",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@remotion\/google-fonts\/Inter$/ }, () => ({
      path: "inter",
      namespace: "hyfrme-font",
    }));
    buildApi.onLoad({ filter: /^inter$/, namespace: "hyfrme-font" }, () => ({
      loader: "js",
      contents: `
        export const fontFamily = "Inter";
        export const loadFont = () => ({
          fontFamily,
          waitUntilDone: () => Promise.resolve(),
        });
      `,
    }));
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
          /registry\/remocn\/(github-sponsors|github-stars|x-follow-card|x-followers-overview)\/index\.tsx$/,
      },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        let contents = original
          .replaceAll(
            /https:\/\/avatars\.githubusercontent\.com\/u\/(\d+)\?v=4/g,
            "/assets/social/avatars/u$1.png",
          )
          .replaceAll(
            "const [errored, setErrored] = useState(false);",
            "const errored = false; const setErrored = () => {};",
          );
        if (args.path.includes("/github-stars/")) {
          // Odometer digits and scrolling rows intentionally cross their clipping zones.
          contents = contents
            .replaceAll(
              "<Odometer current={current} fontSize={counterSize} color={t.fg} />",
              '<span data-layout-ignore style={{display:"contents"}}><Odometer current={current} fontSize={counterSize} color={t.fg} /></span>',
            )
            .replace(
              "const listViewport = (\n    <div",
              "const listViewport = (\n    <div data-layout-allow-occlusion",
            )
            .replace(
              "<div\n            style={{\n              fontSize: loginSize,",
              "<div data-layout-allow-overflow\n            style={{\n              fontSize: loginSize,",
            );
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
          if (
            /\/(shader-seam|shader-spiral-pass)\/index\.tsx$/.test(args.path)
          ) {
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
        const contents = original.replace(
          /const \[handle\] = useState\(\(\) => delayRender\("shader-[^"]+"\)\);/,
          "const handle = 0;",
        );
        if (contents === original) {
          throw new Error(`Missing shader render gate in ${args.path}`);
        }
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
  value.replaceAll("&", "&amp;").replaceAll("'", "&#39;");

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
const fontSource = resolve(
  root,
  "registry",
  "blocks",
  "soft-blur-in",
  "Geist-SemiBold.woff2",
);
const geistLatinSource = resolve(root, "assets", "fonts", "Geist-Latin.woff2");
const jetBrainsMonoSource = resolve(
  root,
  "assets",
  "fonts",
  "JetBrainsMono-Latin.woff2",
);
const interSource = resolve(root, "assets", "fonts", "Inter-Latin.woff2");
const manropeSource = resolve(root, "assets", "fonts", "Manrope-Latin.woff2");
const geistMonoSource = resolve(
  root,
  "assets",
  "fonts",
  "GeistMono-Latin.woff2",
);
const caveatSource = resolve(root, "assets", "fonts", "Caveat-Latin.woff2");
let resolveControls;

for (const name of selectedNames) {
  const additionManifest = additionManifests.find(
    (item) => item.components[name] && item.upstream.commit === upstreamCommit,
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
  const usesVariableGeist =
    Boolean(addition) ||
    canvasTransitionNames.has(name) ||
    canvasFilterNames.has(name);
  const geistFamily = addition ? "Hyfrme Remocn Geist" : "Geist";
  const registryItem = upstreamRegistry.items.find(
    (item) => item.name === name,
  );
  const sourcePath = resolve(
    upstream,
    addition?.source ?? registryItem.files[0].path,
  );
  const sceneOverride = sceneOverrides[name];
  const renderSourcePath = sceneOverride
    ? resolve(upstream, sceneOverride.source)
    : sourcePath;
  const configPath = templateNames.includes(name)
    ? sourcePath
    : resolve(dirname(sourcePath), "config.ts");
  const sourceConfig = sceneOverride?.config ?? (await loadConfig(configPath));
  if (addition)
    resolveControls ??= await loadConfig(
      resolve(upstream, "lib/customizer-config.ts"),
      "resolveControls",
    );
  const config = addition
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
  if (name === "x-follow-card") {
    props.avatarUrl = "/assets/social/logo.svg";
    props.coverUrl = "/assets/social/imgs/x-cover.png";
  } else if (name === "x-followers-overview") {
    props.avatarUrl = "/assets/social/logo.svg";
  }
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
    const renderFrame = (frame) => {
      __setHyfrmeFrame(frame, config);
      flushSync(() => root.render(React.createElement(${renderComponentName}, props)));
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
      ${name === "kinetic-warp" ? "families.add(props.fontFamily);" : ""}
      await Promise.all(Array.from(document.fonts).filter(font => families.has(font.family.replaceAll('"', '').replaceAll("'", ''))).map(font => font.load()));
      await document.fonts.ready;
      renderFrame(0);
      await __waitForSource();
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
    ...(addition ? { supported: { "template-literal": false } } : {}),
    platform: "browser",
    plugins: [
      remotionPlugin,
      transitionsPlugin,
      jetBrainsMonoPlugin,
      interPlugin,
      socialFontsPlugin,
      caveatPlugin,
      socialAssetsPlugin,
      sourceAdjustmentsPlugin,
      shaderGatePlugin,
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
        control.type === "text"
          ? "string"
          : control.type === "select"
            ? "string"
            : control.type === "number-input"
              ? "number"
              : control.type,
      label: control.label ?? id,
      default: Object.hasOwn(props, id) ? props[id] : control.default,
    };
    if (Array.isArray(control.options)) variable.options = control.options;
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
    const packages = new Set(
      Object.keys(result.metafile.inputs)
        .filter((path) => path.includes("node_modules/"))
        .map((path) => {
          const parts = path.split("node_modules/").at(-1).split("/");
          return parts[0].startsWith("@")
            ? parts.slice(0, 2).join("/")
            : parts[0];
        }),
    );
    for (const packageName of packages) {
      const directory = resolve(upstream, "node_modules", packageName);
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
    packagedAssets.push({
      path: "logo.svg",
      target: "assets/social/logo.svg",
      source: resolve(root, "assets", "social", "logo.svg"),
    });
  }
  if (name === "x-follow-card") {
    packagedAssets.push({
      path: "imgs/x-cover.png",
      target: "assets/social/imgs/x-cover.png",
      source: resolve(root, "assets", "social", "imgs", "x-cover.png"),
    });
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
      @font-face { font-family: "${geistFamily}"; src: url("../assets/fonts/${usesVariableGeist ? "Geist-Latin.woff2" : "Geist-SemiBold.woff2"}") format("woff2"); font-style: normal; font-weight: ${usesVariableGeist ? "100 900" : "600"}; font-display: block; }
${jetBrainsMonoNames.has(name) ? '      @font-face { font-family: "JetBrains Mono"; src: url("../assets/fonts/JetBrainsMono-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 800; font-display: block; }' : ""}
${interNames.has(name) ? '      @font-face { font-family: "Inter"; src: url("../assets/fonts/Inter-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }' : ""}
${manropeNames.has(name) ? '      @font-face { font-family: "Manrope"; src: url("../assets/fonts/Manrope-Latin.woff2") format("woff2"); font-style: normal; font-weight: 200 800; font-display: block; }' : ""}
${geistMonoNames.has(name) ? '      @font-face { font-family: "Geist Mono"; src: url("../assets/fonts/GeistMono-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }' : ""}
${caveatNames.has(name) ? '      @font-face { font-family: "Caveat"; src: url("../assets/fonts/Caveat-Latin.woff2") format("woff2"); font-style: normal; font-weight: 400 700; font-display: block; }' : ""}
      * { box-sizing: border-box; }
      html, body { width: ${fixture.width}px; height: ${fixture.height}px; margin: 0; overflow: hidden; background: ${fixture.background}; }
      body { --font-geist-sans: "${geistFamily}"; font-family: "${geistFamily}", -apple-system, BlinkMacSystemFont, sans-serif; }
      #hyfrme-source-root { position: absolute; inset: 0; --font-geist-sans:"${geistFamily}";font-family:"${geistFamily}",sans-serif; background:${fixture.background}; }
${sourceTextRenderingNames.has(name) ? "      #hyfrme-source-root, #hyfrme-source-root * { text-rendering: auto; }" : ""}
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
  const geistFile = usesVariableGeist
    ? { source: geistLatinSource, name: "Geist-Latin.woff2" }
    : { source: fontSource, name: "Geist-SemiBold.woff2" };
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
  if (manropeNames.has(name)) {
    await copyFile(
      manropeSource,
      resolve(blockDirectory, "Manrope-Latin.woff2"),
    );
  }
  if (geistMonoNames.has(name)) {
    await copyFile(
      geistMonoSource,
      resolve(blockDirectory, "GeistMono-Latin.woff2"),
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
          : paperShaderNames.has(name)
            ? "MIT + PolyForm Shield 1.0.0"
            : "MIT",
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
                  path: "GeistMono-Latin.woff2",
                  target: "assets/fonts/GeistMono-Latin.woff2",
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
