export async function installSnoozeTransitionReadiness(page) {
  await page.evaluate(() => {
    const scope =
      'ul[role="list"].relative, .dropdown-glass[data-level], [data-slot="toast-portal"], [data-composer-banner-drawer]';
    window.__snoozeReadiness = { scope, phase: null, observed: {}, errors: [] };
    document.addEventListener(
      "transitionrun",
      (event) => {
        const capture = window.__snoozeReadiness;
        if (
          !capture.phase ||
          !(event.target instanceof Element) ||
          !event.target.closest(scope)
        )
          return;
        const effects = event.target
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === event.propertyName,
          );
        if (effects.length !== 1) {
          capture.errors.push(
            `Native ${capture.phase} transition multiplicity changed: ${event.propertyName}`,
          );
          return;
        }
        const animation = effects[0];
        const observed = capture.observed[capture.phase];
        if (observed.some((entry) => entry.animation === animation)) return;
        observed.push({
          animation,
          target: event.target,
          observedTimeMs: animation.currentTime,
          timing: JSON.stringify(animation.effect.getTiming()),
          keyframes: JSON.stringify(animation.effect.getKeyframes()),
        });
        animation.pause();
        animation.currentTime = 0;
      },
      true,
    );
  });
}

export async function beginSnoozeTransitions(page, phase) {
  await page.evaluate((phase) => {
    const capture = window.__snoozeReadiness;
    if (capture.phase)
      throw new Error(`Native phase ${capture.phase} is still active`);
    capture.phase = phase;
    capture.observed[phase] = [];
    window.__snoozeListAnimations = [];
  }, phase);
}

export async function awaitSnoozeTransitions(page, phase) {
  await page.evaluate(async (phase) => {
    const capture = window.__snoozeReadiness;
    if (capture.phase !== phase)
      throw new Error(`Native transition phase changed: ${phase}`);
    const previous = new Set(
      Object.values(window.__snoozeAnimations ?? {}).flat(),
    );
    // getAnimations applies pending source styles before transitionrun can dispatch.
    const created = document.getAnimations().filter((animation) => {
      const target = animation.effect?.target;
      return (
        animation instanceof CSSTransition &&
        !previous.has(animation) &&
        target instanceof Element &&
        !!target.closest(capture.scope)
      );
    });
    // CSS transitionrun is dispatched by a rendering update, after the native pointer action.
    await new Promise((done) =>
      requestAnimationFrame(() => requestAnimationFrame(done)),
    );
    if (capture.errors.length) throw new Error(capture.errors.join("\n"));
    for (const animation of created) {
      if (animation.playState === "idle") continue;
      if (
        !capture.observed[phase].some((entry) => entry.animation === animation)
      )
        throw new Error(
          `Native ${phase} transition was not observed at creation`,
        );
    }
    for (const entry of capture.observed[phase]) {
      const { animation, target, timing, keyframes } = entry;
      if (animation.playState === "idle") continue;
      if (!target.isConnected || animation.effect.target !== target)
        throw new Error(`Native ${phase} transition target was replaced`);
      await animation.ready;
      if (
        animation.pending ||
        animation.playState !== "paused" ||
        animation.currentTime !== 0
      ) {
        throw new Error(
          `Native ${phase} transition did not acknowledge its pause`,
        );
      }
      if (
        JSON.stringify(animation.effect.getTiming()) !== timing ||
        JSON.stringify(animation.effect.getKeyframes()) !== keyframes
      ) {
        throw new Error(`Native ${phase} transition definition changed`);
      }
    }
  }, phase);
}
