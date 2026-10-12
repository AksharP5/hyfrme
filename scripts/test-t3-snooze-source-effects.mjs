import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createContext, Script } from "node:vm";
import { assertCapturedSnoozeSourceEffects } from "./t3-snooze-source-contracts.mjs";
import { readSnoozeSourceEffects } from "./t3-snooze-source-clock.mjs";

const observed = JSON.parse(
  await readFile(new URL("./t3-snooze-observed-effects.json", import.meta.url)),
);

function capture(theme) {
  const definition = observed.themes[theme];
  return {
    sourceEffects: [...definition.effects, ...definition.sidebarEffects].map(
      (spec) => ({
        ...(spec.event === "closeToast"
          ? definition.capturedReversal.actual
          : spec),
        type: "CSSTransition",
        sourceEnd: { connected: true, playState: "finished" },
        ...(spec.event.startsWith("expanded-sidebar-")
          ? {
              rect: spec.sourceRect,
              rowMatches: 1,
              siblingMatches: 1,
              playState: "running",
            }
          : {}),
      }),
    ),
    sourceReversal: definition.capturedReversal.prior,
  };
}

test("both measured themes retain all ten source effects and the actual shortened reversal", () => {
  for (const theme of ["dark", "light"]) {
    const fixture = capture(theme);
    assert.equal(
      assertCapturedSnoozeSourceEffects(fixture, observed.themes[theme]).length,
      10,
    );
    const reversal = fixture.sourceEffects.find(
      (record) => record.event === "closeToast",
    );
    assert.equal(
      reversal.timing.duration,
      observed.themes[theme].capturedReversal.actual.timing.duration,
    );
    assert.notEqual(reversal.timing.duration, 200);
  }
});

test("rejects missing, duplicated, changed, or nonnative source effects", () => {
  const mutations = [
    (fixture) => fixture.sourceEffects.pop(),
    (fixture) => fixture.sourceEffects.push(fixture.sourceEffects[0]),
    (fixture) =>
      (fixture.sourceEffects[1].event = fixture.sourceEffects[0].event),
    (fixture) => (fixture.sourceEffects[0].type = "Animation"),
    (fixture) =>
      (fixture.sourceEffects[0].targetClass = "another source target"),
    (fixture) => (fixture.sourceEffects[0].timing.duration = 201),
    (fixture) => (fixture.sourceEffects[0].keyframes[0].opacity = "0.99"),
    (fixture) => (fixture.sourceReversal.sameTarget = false),
    (fixture) => (fixture.sourceEffects.at(-1).rect = { x: 260, width: 20 }),
    (fixture) => (fixture.sourceEffects.at(-1).siblingMatches = 2),
  ];
  for (const mutate of mutations) {
    const fixture = structuredClone(capture("dark"));
    mutate(fixture);
    assert.throws(() =>
      assertCapturedSnoozeSourceEffects(fixture, observed.themes.dark),
    );
  }
});

test("preserves legitimate canceled and finished target lifetimes, rejecting active detached targets", () => {
  for (const playState of ["idle", "finished"]) {
    const fixture = capture("dark");
    fixture.sourceEffects[0].sourceEnd = { connected: false, playState };
    assert.doesNotThrow(() =>
      assertCapturedSnoozeSourceEffects(fixture, observed.themes.dark),
    );
  }
  const fixture = capture("dark");
  fixture.sourceEffects[0].sourceEnd = {
    connected: false,
    playState: "paused",
  };
  assert.throws(
    () => assertCapturedSnoozeSourceEffects(fixture, observed.themes.dark),
    /detached while active/,
  );
});

test("serializes the retained native object and its lifetime after live enumeration loses it", async () => {
  const fixture = capture("dark");
  const world = createContext({ fixture });
  new Script(`
    globalThis.window = globalThis;
    class CSSTransition {
      constructor(record) {
        this.playState = record.sourceEnd.playState;
        this.effect = { target: { isConnected: record.sourceEnd.connected } };
      }
    }
    window.__snoozeSourceClock = {
      errors: [],
      effects: fixture.sourceEffects.map(record => ({ spec: record, animation: new CSSTransition(record) })),
      history: [
        ...fixture.sourceEffects.map(actual => ({ kind: actual.event.startsWith('expanded-sidebar-') ? 'sidebar-native-clocked' : 'genuine-transitionrun', actual })),
        { kind: 'native-reversal-validation-input', prior: fixture.sourceReversal },
      ],
    };
  `).runInContext(world);
  const page = {
    evaluate: async (callback) =>
      new Script("(" + callback + ")()").runInContext(world),
  };
  const actual = await readSnoozeSourceEffects(page);
  assert.deepEqual(
    JSON.parse(JSON.stringify(actual.effects)),
    fixture.sourceEffects,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(actual.sourceReversal)),
    fixture.sourceReversal,
  );
  new Script("__snoozeSourceClock.effects.pop()").runInContext(world);
  await assert.rejects(readSnoozeSourceEffects(page), /not retained/);
});
