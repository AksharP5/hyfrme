import { frameMathSource } from "./hyfrme-frame-math.mjs";

// React retains the source's mount-time font/layout measurements. Only the
// frame clock and asset/render gates change; no Remotion runtime is shipped.
export const snapcnRuntimeSource = (scopeSvgIds = false) => `
import React, {useId} from "react";
${frameMathSource}
let frame = 0;
let config;
let assets;
let slug;
let nextHandle = 0;
${scopeSvgIds ? "let instanceId;\n" : ""}const pending = new Map();
const waiting = new Set();
export {Easing, interpolate, interpolateColors, random, spring};
export const useCurrentFrame = () => frame;
export const useVideoConfig = () => config;
export const useCurrentScale = () => {
  const root = document.getElementById(slug + '-source-root');
  return root?.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
};
export const getRemotionEnvironment = () => ({isRendering: true, isPlayer: false, isStudio: false, isClientSideRendering: false});
export const delayRender = (label) => {
  const handle = nextHandle++;
  pending.set(handle, label);
  return handle;
};
export const continueRender = (handle) => {
  pending.delete(handle);
  if (pending.size === 0) {
    for (const resolve of waiting) resolve();
    waiting.clear();
  }
};
export const __waitForSource = () => pending.size === 0 ? Promise.resolve() : new Promise(resolve => waiting.add(resolve));
export const __configure = (value, files, name) => {config = value; assets = files; slug = name;};
export const __setFrame = (value) => {frame = value;};
${scopeSvgIds ? `export const __instanceId = (id) => {
  instanceId ??= document.getElementById(slug + '-source-root').closest('[data-composition-file]')?.dataset.compositionId ?? slug;
  return instanceId + '-' + id;
};
` : ""}export const staticFile = (path) => assets?.[path] ?? assets?.['/' + path.replace(/^\\//, '')] ?? path;
export const AbsoluteFill = ({children, style, ...props}) => React.createElement('div', {
  ...props,
  style: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', ...style},
}, children);
export const Img = ({src, ...props}) => React.createElement('img', {...props, src: staticFile(src)});
export const OffthreadVideo = ({src, trimBefore = 0, startFrom = trimBefore, playbackRate = 1, volume, ...props}) => {
  const id = slug + '-video-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return React.createElement('video', {
    ...props, id, src: staticFile(src), preload: 'auto',
    'data-start': 0, 'data-duration': config.durationInFrames / config.fps,
    'data-track-index': 1, 'data-media-start': startFrom / config.fps,
    'data-playback-rate': playbackRate,
    ...(!props.muted ? {'data-has-audio': true} : {}),
    ...(typeof volume === 'number' ? {'data-volume': volume} : {}),
  });
};
`;
