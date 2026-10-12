export function assertSourceEffectIdentity(expected, actual) {
  for (const key of [
    "event",
    "actionFrame",
    "targetSelector",
    "targetClass",
    "property",
  ])
    if (actual[key] !== expected[key])
      throw Error("Source effect identity changed: " + key);
  for (const key of [
    "delay",
    "direction",
    "duration",
    "easing",
    "endDelay",
    "fill",
    "iterationStart",
    "iterations",
  ])
    if (actual.timing?.[key] !== expected.timing[key])
      throw Error("Source effect timing changed: " + key);
  if (JSON.stringify(actual.keyframes) !== JSON.stringify(expected.keyframes))
    throw Error("Source effect keyframes changed");
}
export function assertSourceReversal(expected, actual, prior) {
  if (
    expected.actionFrame !== 88 ||
    expected.property !== "opacity" ||
    actual.actionFrame !== 88 ||
    !prior ||
    prior.sameTarget !== true ||
    prior.sourceFrame !== 87 ||
    prior.actionFrame !== 85 ||
    prior.event !== "expanded" ||
    prior.time !== (2 * 1000) / 30 ||
    prior.playState !== "paused"
  )
    throw Error("Native reversal prior target/clock changed");
  if (
    prior.cssDuration !== "0.2s" ||
    prior.cssProperty !== "opacity" ||
    prior.cssEasing !== expected.timing.easing ||
    prior.timing.duration !== 200 ||
    prior.timing.easing !== expected.timing.easing ||
    prior.timing.fill !== expected.timing.fill ||
    !Number.isFinite(prior.progress) ||
    prior.progress <= 0 ||
    prior.progress >= 1
  )
    throw Error("Native reversal source CSS/progress changed");
  const inferredDuration = prior.timing.duration * prior.progress;
  const durationDifference = Math.abs(
    actual.timing.duration - inferredDuration,
  );
  const twoUlpBound =
    2 *
    Number.EPSILON *
    2 **
      Math.floor(
        Math.log2(
          Math.max(
            Math.abs(actual.timing.duration),
            Math.abs(inferredDuration),
          ),
        ),
      );
  const forward = [
    {
      offset: 0,
      easing: "linear",
      composite: "auto",
      opacity: "0",
      computedOffset: 0,
    },
    {
      offset: 1,
      easing: "linear",
      composite: "auto",
      opacity: "1",
      computedOffset: 1,
    },
  ];
  if (
    JSON.stringify(prior.keyframes) !== JSON.stringify(forward) ||
    !Number.isFinite(actual.timing.duration) ||
    durationDifference > twoUlpBound ||
    actual.keyframes.length !== 2 ||
    actual.keyframes[0].opacity !== prior.opacity ||
    actual.keyframes[1].opacity !== "0"
  )
    throw Error("Native reversal shortening/endpoints changed");
  for (const key of [
    "event",
    "actionFrame",
    "targetSelector",
    "targetClass",
    "property",
  ])
    if (actual[key] !== expected[key])
      throw Error("Native reversal source identity changed: " + key);
  for (const key of [
    "delay",
    "direction",
    "easing",
    "endDelay",
    "fill",
    "iterationStart",
    "iterations",
  ])
    if (actual.timing[key] !== expected.timing[key])
      throw Error("Native reversal timing changed: " + key);
  for (let index = 0; index < 2; index++)
    for (const key of ["offset", "easing", "composite", "computedOffset"])
      if (actual.keyframes[index][key] !== expected.keyframes[index][key])
        throw Error("Native reversal keyframe contract changed: " + key);
  return {
    prior,
    actual,
    nativeShortenedDuration: true,
    sourceComputedEndpoints: true,
    inferredDuration,
    durationDifference,
    twoUlpBound,
  };
}

export function assertSidebarSourceEffect(expected, actual) {
  for (const key of [
    "event",
    "actionFrame",
    "targetSelector",
    "targetClass",
    "targetTag",
    "property",
    "rowTitle",
    "rowClass",
    "rowTestId",
  ])
    if (actual[key] !== expected[key])
      throw Error("Native slim-row source identity changed: " + key);
  if (
    actual.siblingMatches !== 1 ||
    actual.rowMatches !== 1 ||
    actual.rect.x < 0 ||
    actual.rect.x + actual.rect.width > 256 ||
    actual.type !== "CSSTransition" ||
    actual.playState !== "running"
  )
    throw Error("Native slim-row scope/multiplicity changed");
  for (const key of [
    "delay",
    "direction",
    "duration",
    "easing",
    "endDelay",
    "fill",
    "iterationStart",
    "iterations",
  ])
    if (actual.timing[key] !== expected.timing[key])
      throw Error("Native slim-row finite timing changed: " + key);
  if (JSON.stringify(actual.keyframes) !== JSON.stringify(expected.keyframes))
    throw Error("Native slim-row keyframes changed");
}

export function assertCapturedSnoozeSourceEffects(fixture, definition) {
  const records = fixture.sourceEffects;
  const expected = [...definition.effects, ...definition.sidebarEffects];
  if (!Array.isArray(records) || records.length !== expected.length)
    throw new Error(
      "Capture the complete genuine Snooze source effects before generation",
    );
  for (const spec of expected) {
    const matches = records.filter((record) => record.event === spec.event);
    if (matches.length !== 1)
      throw new Error(
        "Captured Snooze source effect multiplicity changed: " + spec.event,
      );
    const actual = matches[0];
    if (actual.type !== "CSSTransition")
      throw new Error(
        "Captured Snooze source effect is not a native CSSTransition",
      );
    if (
      !actual.sourceEnd?.connected &&
      !["idle", "finished"].includes(actual.sourceEnd?.playState)
    )
      throw new Error("Captured Snooze source target detached while active");
    if (spec.event.startsWith("expanded-sidebar-"))
      assertSidebarSourceEffect(spec, actual);
    else if (spec.event === "closeToast")
      assertSourceReversal(spec, actual, fixture.sourceReversal);
    else assertSourceEffectIdentity(spec, actual);
  }
  return records;
}
