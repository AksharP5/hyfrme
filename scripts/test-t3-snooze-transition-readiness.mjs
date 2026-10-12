import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createContext, Script } from "node:vm";
import {
  installSnoozeTransitionReadiness,
  beginSnoozeTransitions,
  awaitSnoozeTransitions,
} from "./t3-snooze-transition-readiness.mjs";

const fixture = JSON.parse(
  await readFile(
    new URL(
      "../assets/t3-code/v0.0.42/thread-snooze-dark-fixture.json",
      import.meta.url,
    ),
  ),
);
const measured = fixture.transitions.menu[0];

async function nativeHarness() {
  const world = createContext({ setImmediate, structuredClone, measured });
  new Script(`
    globalThis.window = globalThis;
    const listeners = {};
    let renderingUpdates = 0;
    globalThis.document = {
      addEventListener: (name, callback) => listeners[name] = callback,
      getAnimations: () => target.effects,
    };
    globalThis.requestAnimationFrame = (callback) => setImmediate(() => { renderingUpdates++; callback(); });
    globalThis.Element = class {
      isConnected = true;
      effects = [];
      inScope = true;
      closest() { return this.inScope ? this : null; }
      getAnimations() { return this.effects; }
    };
    globalThis.CSSTransition = class {
      transitionProperty = 'opacity';
      currentTime = 16.7;
      playState = 'running';
      pending = false;
      constructor(target) {
        this.timing = { duration: measured.durationMs, easing: measured.easing };
        this.keyframes = structuredClone(measured.keyframes);
        this.effect = { target, getTiming: () => this.timing, getKeyframes: () => this.keyframes };
        this.ready = Promise.resolve(this);
        target.effects.push(this);
      }
      pause() { this.playState = 'paused'; }
    };
    globalThis.target = new Element();
    globalThis.animation = new CSSTransition(target);
    globalThis.dispatch = () => listeners.transitionrun({ target, propertyName: 'opacity' });
    globalThis.updateCount = () => renderingUpdates;
  `).runInContext(world);
  const page = {
    evaluate: async (callback, argument) => {
      world.argument = argument;
      return new Script(`(${callback})(argument)`).runInContext(world);
    },
  };
  await installSnoozeTransitionReadiness(page);
  await beginSnoozeTransitions(page, "menu");
  const run = (code) => new Script(code).runInContext(world);
  return { page, run };
}

test("retains the genuine effect independently of subsequent live enumeration", async () => {
  const { page, run } = await nativeHarness();
  run("dispatch(); target.effects = [];");
  await awaitSnoozeTransitions(page, "menu");
  assert.equal(
    run("__snoozeReadiness.observed.menu[0].animation === animation"),
    true,
  );
  assert.equal(run("__snoozeReadiness.observed.menu[0].observedTimeMs"), 16.7);
  assert.equal(run("animation.currentTime"), 0);
  assert.equal(run("updateCount()"), 2);
  assert.equal(
    run("JSON.stringify(animation.keyframes)"),
    JSON.stringify(measured.keyframes),
  );
  assert.equal(run("animation.timing.duration"), measured.durationMs);
});

test("flushes pending source styles before awaiting the genuine transitionrun object", async () => {
  const { page, run } = await nativeHarness();
  run(`
    target.effects = [];
    let flushed = false;
    document.getAnimations = () => {
      if (!flushed) {
        flushed = true;
        target.effects = [animation];
        setImmediate(dispatch);
      }
      return target.effects;
    };
  `);
  await awaitSnoozeTransitions(page, "menu");
  assert.equal(run("__snoozeReadiness.observed.menu.length"), 1);
  assert.equal(
    run("__snoozeReadiness.observed.menu[0].animation === animation"),
    true,
  );
  assert.equal(run("animation.currentTime"), 0);
  assert.equal(run("updateCount()"), 2);
  assert.equal(run("animation.timing.duration"), measured.durationMs);
});

test("rejects an active detached or replaced source target", async () => {
  for (const mutation of [
    "target.isConnected = false",
    "animation.effect.target = new Element()",
  ]) {
    const { page, run } = await nativeHarness();
    run(`dispatch(); ${mutation}`);
    await assert.rejects(
      awaitSnoozeTransitions(page, "menu"),
      /target was replaced/,
    );
  }
});

test("rejects altered source timing, keyframes, or unacknowledged pause", async () => {
  for (const mutation of [
    "animation.timing.duration++",
    'animation.keyframes[0].opacity = "0.125"',
    "animation.pending = true",
    "animation.currentTime = 1",
  ]) {
    const { page, run } = await nativeHarness();
    run(`dispatch(); ${mutation}`);
    await assert.rejects(
      awaitSnoozeTransitions(page, "menu"),
      /definition changed|acknowledge its pause/,
    );
  }
});

test("preserves native cancellation and excludes source effects outside the existing scope", async () => {
  const { page, run } = await nativeHarness();
  run('dispatch(); animation.playState = "idle"; target.isConnected = false;');
  await awaitSnoozeTransitions(page, "menu");
  const unrelated = await nativeHarness();
  unrelated.run("target.inScope = false; dispatch();");
  assert.equal(unrelated.run("__snoozeReadiness.observed.menu.length"), 0);
  assert.equal(unrelated.run("animation.playState"), "running");
});

test("rejects multiple effects for the same actual transitionrun property", async () => {
  const { page, run } = await nativeHarness();
  run("new CSSTransition(target); dispatch();");
  await assert.rejects(
    awaitSnoozeTransitions(page, "menu"),
    /multiplicity changed/,
  );
});
