const sourceEffects = SOURCE_EFFECTS;
let sourceSignature;
let ownedSourceEffects = [];

function sourceTarget(section, record) {
  const scope = record.event.startsWith("expanded-sidebar-")
    ? [...section.querySelectorAll('[data-testid="sidebar-row-slim"]')].find(
        (row) => row.textContent.includes(options.snoozeThread),
      )
    : section;
  const matches = scope?.querySelectorAll(record.targetSelector);
  if (matches?.length !== 1 || matches[0].className !== record.targetClass)
    throw new Error("Captured Snooze source target changed: " + record.event);
  const target = matches[0];
  target.setAttribute("data-t3-snooze-source-effect", "");
  return target;
}

function sourceCssTransition(target, record) {
  const property = record.property.replace(
    /[A-Z]/g,
    (letter) => "-" + letter.toLowerCase(),
  );
  target.style.transitionProperty = "none";
  target.style[record.property] = record.keyframes[0][record.property];
  getComputedStyle(target)[record.property];
  target.style.removeProperty("transition-property");
  target.style[record.property] = record.keyframes.at(-1)[record.property];
  getComputedStyle(target)[record.property];
  const effects = target
    .getAnimations()
    .filter(
      (animation) =>
        animation instanceof CSSTransition &&
        animation.transitionProperty === property,
    );
  if (effects.length !== 1)
    throw new Error(
      "Captured Snooze source transition did not start: " + record.event,
    );
  const animation = effects[0];
  const timing = animation.effect.getTiming();
  for (const key of [
    "delay",
    "direction",
    "duration",
    "easing",
    "endDelay",
    "fill",
    "iterationStart",
    "iterations",
  ]) {
    if (timing[key] !== record.timing[key])
      throw new Error(
        "Captured Snooze source timing changed: " + record.event + "/" + key,
      );
  }
  if (
    JSON.stringify(animation.effect.getKeyframes()) !==
    JSON.stringify(record.keyframes)
  )
    throw new Error(
      "Captured Snooze source keyframes changed: " + record.event,
    );
  animation.pause();
  animation.currentTime = 0;
  return animation;
}

async function sourceCssReversal(target, record, forward, beats) {
  const animation = sourceCssTransition(target, forward);
  await animation.ready;
  animation.currentTime = Math.max(
    0,
    ((beats.closeToast - 1 - (beats.expand + 7)) * 1000) / 30,
  );
  const timing = animation.effect.getTiming();
  const progress =
    animation.effect.getComputedTiming().progress ??
    (animation.currentTime >= timing.duration ? 1 : 0);
  const opacity = getComputedStyle(target).opacity;
  target.style.opacity = "0";
  getComputedStyle(target).opacity;
  if (progress === 0) {
    animation.cancel();
    return null;
  }
  const effects = target
    .getAnimations()
    .filter(
      (effect) =>
        effect instanceof CSSTransition &&
        effect.transitionProperty === "opacity",
    );
  if (effects.length !== 1 || effects[0] === animation)
    throw new Error("Captured Snooze source reversal did not start");
  const reversal = effects[0];
  const actual = reversal.effect.getTiming();
  const keyframes = reversal.effect.getKeyframes();
  const inferred = timing.duration * progress;
  const spacing =
    Number.EPSILON *
    2 **
      Math.floor(
        Math.log2(Math.max(Math.abs(actual.duration), Math.abs(inferred))),
      );
  if (
    Math.abs(actual.duration - inferred) > 2 * spacing ||
    keyframes[0].opacity !== opacity ||
    keyframes.at(-1).opacity !== "0"
  )
    throw new Error("Captured Snooze source reversal shortening changed");
  for (const key of [
    "delay",
    "direction",
    "easing",
    "endDelay",
    "fill",
    "iterationStart",
    "iterations",
  ]) {
    if (actual[key] !== record.timing[key])
      throw new Error("Captured Snooze source reversal timing changed: " + key);
  }
  if (
    beats.expand === defaults.expandFrame &&
    beats.closeToast === defaults.closeToastFrame
  ) {
    if (
      actual.duration !== record.timing.duration ||
      JSON.stringify(keyframes) !== JSON.stringify(record.keyframes)
    )
      throw new Error("Captured Snooze source reversal definition changed");
  }
  reversal.pause();
  reversal.currentTime = 0;
  return reversal;
}

async function seekSourceEffects(frame, phase, beats) {
  const theme = options.theme === "light" ? 1 : 0;
  const section = sections[theme][phase];
  const records = sourceEffects[theme];
  let event = "menu",
    start = beats.menu;
  if (frame >= beats.openThread) {
    event = "openThread";
    start = beats.openThread;
  } else if (frame >= beats.closeToast + 16) {
    event = "toastClosed";
    start = beats.closeToast + 16;
  } else if (frame >= beats.closeToast) {
    event = "closeToast";
    start = beats.closeToast;
  } else if (frame >= beats.expand + 7) {
    event = "expanded";
    start = beats.expand + 7;
  } else if (frame >= beats.expand) {
    event = "expand";
    start = beats.expand;
  } else if (frame >= beats.snooze + 15) {
    event = "postSnooze";
    start = beats.snooze + 15;
  }
  const signature = [
    theme,
    phase,
    event,
    start,
    beats.expand,
    beats.closeToast,
  ].join("/");
  if (signature !== sourceSignature) {
    for (const { animation } of ownedSourceEffects) animation.cancel();
    ownedSourceEffects = [];
    sourceSignature = signature;
    if (frame < beats.menu) {
      if (timestampGroups[theme][phase])
        timestampGroups[theme][phase].style.opacity = "1";
      return;
    }
    const record = records.find((record) => record.event === event);
    const target = sourceTarget(section, record);
    const animation =
      event === "closeToast"
        ? await sourceCssReversal(
            target,
            record,
            records.find((record) => record.event === "expanded"),
            beats,
          )
        : sourceCssTransition(target, record);
    if (animation) ownedSourceEffects.push({ animation, start });
    if (frame >= beats.expand + 7 && frame < beats.openThread) {
      for (const record of records.filter((record) =>
        record.event.startsWith("expanded-sidebar-"),
      )) {
        ownedSourceEffects.push({
          animation: sourceCssTransition(sourceTarget(section, record), record),
          start: beats.expand + 7,
        });
      }
    }
  }
  for (const { animation, start } of ownedSourceEffects) {
    await animation.ready;
    animation.pause();
    animation.currentTime = Math.max(0, ((frame - start) * 1000) / 30);
    if (animation.currentTime >= animation.effect.getTiming().duration)
      animation.finish();
  }
}
