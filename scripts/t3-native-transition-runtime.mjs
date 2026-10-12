export const nativeTransitionRuntime = String.raw`
const sourceMotions = [];
function sourceTransition(element, property, from, to, start, duration) {
  sourceMotions.push({ element, property, from, to, start, duration, last: start + Math.ceil(duration * 30 / 1000) });
}
const nativeEffects = new Map();
async function seekNativeTransitions(stage, frame) {
  const elements = new Map();
  for (const motion of sourceMotions) {
    if (!stage.contains(motion.element)) continue;
    let properties = elements.get(motion.element);
    if (!properties) elements.set(motion.element, properties = new Map());
    const previous = properties.get(motion.property);
    if (!previous || (frame >= motion.start && motion.start > previous.start)) properties.set(motion.property, motion);
  }
  for (const [element, record] of nativeEffects) {
    if (elements.has(element)) continue;
    for (const animation of record.animations) animation.cancel();
    nativeEffects.delete(element);
  }
  const pending = [];
  for (const [element, properties] of elements) {
    const motions = [...properties.values()];
    const active = motions.filter((motion) => frame >= motion.start && frame <= motion.last);
    const signature = active.map(({ property, start }) => property + ':' + start).join(',');
    let record = nativeEffects.get(element);
    if (record?.signature !== signature) {
      for (const animation of record?.animations ?? []) animation.cancel();
      element.style.transitionProperty = 'none';
      for (const motion of motions) element.style[motion.property] = frame < motion.start ? motion.from : active.includes(motion) ? motion.from : motion.to;
      getComputedStyle(element).opacity;
      element.style.transitionProperty = active.map(({ property }) => property).join(',') || 'none';
      element.style.transitionDuration = active.map(({ duration }) => duration + 'ms').join(',');
      element.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';
      for (const motion of active) element.style[motion.property] = motion.to;
      getComputedStyle(element).opacity;
      const animations = element.getAnimations().filter((animation) => animation instanceof CSSTransition && active.some(({ property }) => property === animation.transitionProperty));
      if (animations.length !== active.length) throw new Error('Native T3 CSS transition did not start');
      for (const animation of animations) animation.pause();
      record = { signature, animations };
      nativeEffects.set(element, record);
    }
    for (const animation of record.animations) {
      const motion = properties.get(animation.transitionProperty);
      animation.currentTime = Math.max(0, Math.min(motion.duration, (frame - motion.start) * 1000 / 30));
      pending.push(animation.ready);
      if (animation.currentTime >= animation.effect.getComputedTiming().endTime) animation.finish();
    }
  }
  await Promise.all(pending);
}
`;
