import {
  assertSidebarSourceEffect,
  assertSourceReversal,
  assertSourceEffectIdentity,
} from "./t3-snooze-source-contracts.mjs";
export async function installSourceClock(
  page,
  specification,
  sidebarSpecification,
) {
  await page.evaluate(
    ({
      specification,
      sidebarSpecification,
      sidebarScript,
      identityScript,
      reversalScript,
    }) => {
      const validateSidebar = (0, eval)("(" + sidebarScript + ")");
      const validate = (0, eval)("(" + identityScript + ")");
      const validateReversal = (0, eval)("(" + reversalScript + ")");
      window.__snoozeSourceClock = {
        frame: -1,
        effects: [],
        history: [],
        errors: [],
      };
      document.addEventListener(
        "transitionrun",
        (event) => {
          const clock = window.__snoozeSourceClock,
            target = event.target;
          if (!(target instanceof Element)) return;
          const sourceProperty =
            event.propertyName === "background-color"
              ? "backgroundColor"
              : event.propertyName;
          const controlled =
            (sourceProperty === "opacity" &&
              target.matches(
                '[data-message-role="user"] [class~="opacity-0"][class~="group-hover:opacity-100"]',
              )) ||
            (sourceProperty === "backgroundColor" &&
              target.matches("[data-chat-composer-main-surface]"));
          const row = target.closest('[data-testid="sidebar-row-slim"]');
          if (row && clock.frame === 85) {
            try {
              const matches = sidebarSpecification.filter((spec) =>
                [...row.querySelectorAll(spec.targetSelector)].includes(target),
              );
              if (matches.length !== 1)
                throw Error("Unrecognized native slim-row transition target");
              const spec = matches[0],
                native = target
                  .getAnimations()
                  .filter(
                    (animation) =>
                      animation instanceof CSSTransition &&
                      animation.transitionProperty === event.propertyName,
                  );
              if (
                native.length !== 1 ||
                clock.effects.some((entry) => entry.spec.event === spec.event)
              )
                throw Error("Native slim-row transition multiplicity changed");
              const animation = native[0],
                rows = [
                  ...document.querySelectorAll(
                    '[data-testid="sidebar-row-slim"]',
                  ),
                ].filter((node) => node.textContent.includes(spec.rowTitle)),
                actual = {
                  event: spec.event,
                  actionFrame: clock.frame,
                  targetSelector: spec.targetSelector,
                  targetClass: target.className,
                  targetTag: target.tagName,
                  property: sourceProperty,
                  rowTitle: rows.includes(row) ? spec.rowTitle : null,
                  rowClass: row.className,
                  rowTestId: row.getAttribute("data-testid"),
                  rowMatches: rows.length,
                  siblingMatches: row.querySelectorAll(spec.targetSelector)
                    .length,
                  rect: target.getBoundingClientRect().toJSON(),
                  type: animation.constructor.name,
                  playState: animation.playState,
                  timing: animation.effect.getTiming(),
                  keyframes: animation.effect.getKeyframes(),
                };
              clock.history.push({
                kind: "sidebar-native-before-validation",
                frame: clock.frame,
                actual,
                observedTimeNotUsedAsOffset: animation.currentTime,
              });
              validateSidebar(spec, actual);
              animation.pause();
              animation.currentTime = 0;
              clock.effects.push({ animation, spec });
              clock.history.push({
                kind: "sidebar-native-clocked",
                frame: clock.frame,
                actual,
              });
            } catch (error) {
              clock.errors.push(String(error));
            }
            return;
          }
          if (!controlled) return;
          clock.history.push({
            kind: "genuine-transitionrun-before-validation",
            frame: clock.frame,
            property: sourceProperty,
            targetTag: target.tagName,
            targetClass: target.className,
            targetText: target.textContent,
            rawTag: target.outerHTML.split(">")[0] + ">",
            groupHover: !!target.closest(".group")?.matches(":hover"),
            hover: target.matches(":hover"),
            sourceEffects: target.getAnimations().map((animation) => ({
              type: animation.constructor.name,
              property: animation.transitionProperty ?? null,
              currentTime: animation.currentTime,
              playState: animation.playState,
              timing: animation.effect?.getTiming(),
              keyframes: animation.effect?.getKeyframes(),
            })),
          });
          if (
            sourceProperty === "backgroundColor" &&
            clock.frame === 52 &&
            clock.action52NaturalTransaction === true
          ) {
            clock.history.push({
              kind: "action52-natural-unclocked",
              frame: 52,
              property: sourceProperty,
            });
            return;
          }
          try {
            const spec = specification.find(
              (s) =>
                s.actionFrame === clock.frame && s.property === sourceProperty,
            );
            if (!spec || !target.matches(spec.targetSelector))
              throw Error("Unscheduled genuine source transition target/frame");
            const native = target
              .getAnimations()
              .filter(
                (a) =>
                  a instanceof CSSTransition &&
                  a.transitionProperty === event.propertyName,
              );
            if (
              native.length !== 1 ||
              clock.effects.some((entry) => entry.spec.event === spec.event)
            )
              throw Error("Genuine transition multiplicity changed");
            const animation = native[0],
              actual = {
                event: spec.event,
                actionFrame: clock.frame,
                targetSelector: spec.targetSelector,
                targetClass: target.className,
                property: sourceProperty,
                timing: animation.effect.getTiming(),
                keyframes: animation.effect.getKeyframes(),
              };
            if (spec.actionFrame === 88) {
              const previous = clock.reversalPrior;
              const prior = previous
                ? { ...previous.report, sameTarget: previous.target === target }
                : null;
              clock.history.push({
                kind: "native-reversal-validation-input",
                frame: 88,
                prior,
                actual,
              });
              validateReversal(spec, actual, prior);
            } else validate(spec, actual);
            const observedTime = animation.currentTime;
            animation.pause();
            animation.currentTime = 0;
            clock.effects.push({ animation, spec });
            clock.history.push({
              kind: "genuine-transitionrun",
              frame: clock.frame,
              observedTimeNotUsedAsOffset: observedTime,
              actual,
            });
          } catch (error) {
            clock.errors.push(String(error));
          }
        },
        true,
      );
      for (const type of ["transitionend", "transitioncancel"])
        document.addEventListener(
          type,
          (event) => {
            const clock = window.__snoozeSourceClock,
              target = event.target;
            if (
              clock.frame === 52 &&
              event.propertyName === "background-color" &&
              target instanceof Element &&
              target.matches("[data-chat-composer-main-surface]")
            )
              clock.history.push({
                kind: "action52-native-" + type,
                frame: 52,
                targetClass: target.className,
                elapsedTime: event.elapsedTime,
                property: event.propertyName,
                connected: target.isConnected,
              });
          },
          true,
        );
    },
    {
      specification,
      sidebarSpecification,
      sidebarScript: assertSidebarSourceEffect.toString(),
      identityScript: assertSourceEffectIdentity.toString(),
      reversalScript: assertSourceReversal.toString(),
    },
  );
}
export async function setSourceFrame(page, frame) {
  await page.evaluate((frame) => {
    const clock = window.__snoozeSourceClock;
    if (frame === 88) {
      const entries = clock.effects.filter(
        (entry) =>
          entry.spec.actionFrame === 85 && entry.spec.event === "expanded",
      );
      if (entries.length !== 1)
        throw Error(
          "Native forward effect multiplicity changed before reversal",
        );
      const entry = entries[0],
        animation = entry.animation,
        target = animation.effect.target,
        style = getComputedStyle(target);
      clock.reversalPrior = {
        target,
        report: {
          sourceFrame: clock.frame,
          actionFrame: entry.spec.actionFrame,
          event: entry.spec.event,
          time: animation.currentTime,
          playState: animation.playState,
          progress: animation.effect.getComputedTiming().progress,
          timing: animation.effect.getTiming(),
          keyframes: animation.effect.getKeyframes(),
          opacity: style.opacity,
          cssDuration: style.transitionDuration,
          cssProperty: style.transitionProperty,
          cssEasing: style.transitionTimingFunction,
        },
      };
      clock.history.push({
        kind: "native-reversal-before-action",
        frame: 88,
        prior: clock.reversalPrior.report,
      });
    }
    clock.frame = frame;
  }, frame);
}
export async function seekSourceClock(page, frame) {
  await page.evaluate(async (frame) => {
    const clock = window.__snoozeSourceClock;
    if (clock.errors.length) throw Error(clock.errors.join("\n"));
    if (
      frame >= 85 &&
      clock.effects.filter((entry) =>
        entry.spec.event.startsWith("expanded-sidebar-"),
      ).length !== 3
    )
      throw Error("Expected three authentic sidebar fades absent");
    for (const { animation, spec } of clock.effects) {
      if (
        animation.playState === "idle" ||
        !animation.effect.target.isConnected
      )
        continue;
      await animation.ready;
      const elapsed = ((frame - spec.actionFrame) * 1000) / 30;
      animation.currentTime = elapsed;
      if (elapsed >= animation.effect.getTiming().duration) animation.finish();
    }
    clock.history.push({
      kind: "source-video-frame",
      frame,
      effects: clock.effects.map(({ animation, spec }) => ({
        event: spec.event,
        connected: animation.effect.target.isConnected,
        time: animation.currentTime,
        playState: animation.playState,
      })),
    });
  }, frame);
}

export async function readSnoozeSourceEffects(page) {
  return page.evaluate(() => {
    const clock = window.__snoozeSourceClock;
    if (clock.errors.length) throw new Error(clock.errors.join("\n"));
    const effects = clock.history
      .filter(
        (entry) =>
          entry.kind === "genuine-transitionrun" ||
          entry.kind === "sidebar-native-clocked",
      )
      .map((entry) => {
        const retained = clock.effects.find(
          ({ spec }) => spec.event === entry.actual.event,
        );
        if (!retained)
          throw new Error(
            "Genuine source effect was not retained: " + entry.actual.event,
          );
        const { animation } = retained;
        return {
          ...entry.actual,
          type: animation.constructor.name,
          sourceEnd: {
            connected: animation.effect.target.isConnected,
            playState: animation.playState,
          },
        };
      });
    return {
      effects,
      sourceReversal: clock.history.find(
        (entry) => entry.kind === "native-reversal-validation-input",
      )?.prior,
      history: clock.history,
    };
  });
}
