import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/project-video.js", import.meta.url), "utf8");

function preview({ reduced = false, observed = true } = {}) {
  const events = {};
  const observers = [];
  const sources = [{ dataset: { src: "av1.webm" } }, { dataset: { src: "vp9.webm" } }];
  const classes = new Set();
  const buttonClasses = new Set();
  const timers = new Map();
  let nextTimer = 0;
  const media = { classList: { add: (v) => classes.add(v), remove: (v) => classes.delete(v) } };
  const button = {
    hidden: true,
    setAttribute(key, value) { this[key] = value; },
    classList: {
      add: (value) => buttonClasses.add(value),
      remove: (value) => buttonClasses.delete(value),
      toggle(value, force) { if (force) buttonClasses.add(value); else buttonClasses.delete(value); },
    },
    addEventListener(name, fn) { events[name] = fn; },
  };
  const motion = {
    matches: reduced,
    addEventListener(name, fn) { events.motion = fn; },
  };
  const document = {
    hidden: false,
    getElementById(id) { return id === "wolf-preview" ? video : button; },
    addEventListener(name, fn) { events.visibility = fn; },
  };
  let resolvePlay;
  let rejectPlay;
  const video = {
    parentElement: media,
    paused: true,
    loads: 0,
    plays: 0,
    querySelectorAll: () => sources,
    addEventListener(name, fn) { events[name] = fn; },
    load() { this.loads++; },
    pause() { this.paused = true; },
    play() {
      this.plays++;
      return new Promise((resolve, reject) => {
        resolvePlay = () => { this.paused = false; events.playing(); resolve(); };
        rejectPlay = reject;
      });
    },
  };
  class Observer {
    constructor(callback, options) { observers.push({ callback, options }); }
    observe() {}
  }
  runInNewContext(source, {
    document,
    window: { matchMedia: () => motion, ...(observed ? { IntersectionObserver: Observer } : {}) },
    IntersectionObserver: Observer,
    setTimeout(callback, delay) { timers.set(++nextTimer, { callback, delay }); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  });
  return {
    video, button, sources, document, motion, events, classes, buttonClasses, timers,
    approach(value = true) { observers[0].callback([{ isIntersecting: value }]); },
    show(value = true, ratio = value ? 1 : 0) {
      observers[1].callback([{ isIntersecting: value, intersectionRatio: ratio }]);
    },
    resolve: () => resolvePlay(),
    reject: (name) => rejectPlay({ name }),
  };
}

test("initial page requests no video; approaching loads once and visibility starts playback", () => {
  const p = preview();
  expect(p.sources.every((item) => !item.src)).toBe(true);
  p.approach();
  p.approach();
  expect(p.video.loads).toBe(1);
  expect(p.video.plays).toBe(0);
  p.show();
  expect(p.video.plays).toBe(1);
  expect(p.video.muted).toBe(true);
});

test("a late play completion cannot restart an offscreen preview", async () => {
  const p = preview();
  p.show();
  p.show(false);
  p.resolve();
  await Promise.resolve();
  expect(p.video.paused).toBe(true);
  expect(p.classes.has("has-frames")).toBe(false);
});

test("manual pause persists across scrolling and tab visibility changes", async () => {
  const p = preview();
  p.show();
  p.resolve();
  await Promise.resolve();
  p.events.click();
  p.show(false);
  p.show();
  p.document.hidden = true;
  p.events.visibility();
  p.document.hidden = false;
  p.events.visibility();
  expect(p.video.paused).toBe(true);
  expect(p.video.plays).toBe(1);
  expect(p.button["aria-label"]).toBe("Play preview");
});

test("reduced motion keeps video unloaded until an explicit Play click", () => {
  const p = preview({ reduced: true });
  p.approach();
  p.show();
  expect(p.video.loads).toBe(0);
  expect(p.button["aria-label"]).toBe("Play preview");
  p.events.click();
  expect(p.video.loads).toBe(1);
  expect(p.video.plays).toBe(1);
  p.motion.matches = false;
  p.events.motion();
  p.motion.matches = true;
  p.events.motion();
  expect(p.video.paused).toBe(true);
  expect(p.classes.has("has-frames")).toBe(false);
});

test("blocked autoplay offers manual playback instead of repeated automatic attempts", async () => {
  const p = preview();
  p.show();
  p.reject("NotAllowedError");
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(p.button["aria-label"]).toBe("Play preview");
  p.show();
  expect(p.video.plays).toBe(1);
  p.events.click();
  expect(p.video.plays).toBe(2);
});

test("without observers, the static preview stays intact and the control stays hidden", () => {
  const p = preview({ observed: false });
  expect(p.sources.every((item) => !item.src)).toBe(true);
  expect(p.button.hidden).toBe(true);
});

test("playback starts on the first viewport intersection and pauses on exit", () => {
  const p = preview();
  p.show(true, 0.001);
  expect(p.video.plays).toBe(1);
  p.show(false);
  expect(p.video.paused).toBe(true);
});

test("touch feedback stays for one second and each tap restarts the timer", () => {
  const p = preview();
  expect(p.buttonClasses.has("is-revealed")).toBe(false);
  p.events.pointerdown({ pointerType: "touch" });
  p.events.click();
  expect(p.buttonClasses.has("is-touch")).toBe(true);
  expect(p.buttonClasses.has("is-revealed")).toBe(true);
  const first = [...p.timers.keys()][0];
  expect(p.timers.get(first).delay).toBe(1000);
  p.events.click();
  expect(p.timers.has(first)).toBe(false);
  expect(p.timers.size).toBe(1);
  [...p.timers.values()][0].callback();
  expect(p.buttonClasses.has("is-revealed")).toBe(false);
  expect(p.buttonClasses.has("is-touch")).toBe(true);
});

test("mouse and keyboard controls do not keep the touch-only visibility state", () => {
  const p = preview();
  p.events.pointerdown({ pointerType: "touch" });
  p.events.keydown();
  expect(p.buttonClasses.has("is-touch")).toBe(false);
  p.events.click();
  expect(p.timers.size).toBe(0);
  p.events.pointerdown({ pointerType: "touch" });
  p.events.pointerenter({ pointerType: "mouse" });
  expect(p.buttonClasses.has("is-touch")).toBe(false);
});
