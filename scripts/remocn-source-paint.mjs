// Mount readiness needs actual browser paints, while composition animation stays
// on HyperFrames' virtual clock. The pinned renderer uses this same native RAF
// for its own readiness stub.
export const sourcePaintShim = `
  let sourcePaintListenerRegistered = false;
  export const __sourcePaintFrame = (callback) => {
    if (!sourcePaintListenerRegistered) {
      window.addEventListener("hf-seek", (event) => {
        event.detail.waitUntil(Promise.resolve().then(__waitForSource));
      });
      sourcePaintListenerRegistered = true;
    }
    const paint = window.__HF_VIRTUAL_TIME__?.originalRequestAnimationFrame
      ?? window.requestAnimationFrame.bind(window);
    return paint(callback);
  };
`;

export function adaptSourcePaintGate(source, path) {
  const gate =
    /requestAnimationFrame\(\(\) =>\s*requestAnimationFrame\(\(\) => continueRender\(handle\)\),\s*\);/;
  if (!gate.test(source))
    throw new Error(`Missing expected shader paint gate in ${path}`);
  return `import {__sourcePaintFrame} from "remotion";\n${source.replace(
    gate,
    "__sourcePaintFrame(() => __sourcePaintFrame(() => continueRender(handle)));",
  )}`;
}
