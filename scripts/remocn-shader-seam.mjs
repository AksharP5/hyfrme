import { createHash } from "node:crypto";

function annotateSceneText(node, active) {
  if (!node) return;
  const marker = "native shader transition canvas";
  for (const element of [node, ...node.querySelectorAll("*")]) {
    const ownsText = [...element.childNodes].some(
      (child) => child.nodeType === 3 && child.textContent.trim(),
    );
    if (!ownsText) continue;
    if (active && !element.hasAttribute("data-layout-allow-occlusion"))
      element.setAttribute("data-layout-allow-occlusion", marker);
    if (!active && element.getAttribute("data-layout-allow-occlusion") === marker)
      element.removeAttribute("data-layout-allow-occlusion");
  }
}

export function annotateShaderSeam(source) {
  const pinnedSha =
    "aece920c8325afff48d98bf7b663ba8d7e745f179c38fc321139422206df0f5e";
  if (createHash("sha256").update(source).digest("hex") !== pinnedSha)
    throw new Error("Pinned Shader Seam source changed");
  const scene =
    "<AbsoluteFill\n        style={{\n          visibility: entering !== phase.showNext";
  if (source.split(scene).length !== 2)
    throw new Error("Expected one Shader Seam scene layer");
  const ref = ` ref={(node: HTMLDivElement | null) => (${annotateSceneText.toString()})(node, entering && active)}`;
  return source
    .replace("/* @remocn", "/*! @remocn")
    .replace(scene, scene.replace("<AbsoluteFill", `<AbsoluteFill${ref}`));
}
