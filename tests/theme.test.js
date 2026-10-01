import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/theme.js", import.meta.url), "utf8");

function page({ saved = null, light = false, storageBlocked = false } = {}) {
  const events = {};
  const timers = new Map();
  let nextTimer = 0;
  const root = { dataset: {} };
  const button = {
    hidden: true,
    setAttribute(key, value) { this[key] = value; },
    addEventListener(name, handler) { events[name] = handler; },
  };
  const system = {
    matches: light,
    addEventListener(name, handler) { events.systemChange = handler; },
  };
  let stored = saved;
  runInNewContext(source, {
    setTimeout(callback, delay) {
      timers.set(++nextTimer, { callback, delay });
      return nextTimer;
    },
    clearTimeout(id) { timers.delete(id); },
    document: {
      documentElement: root,
      getElementById: () => button,
      addEventListener(name, handler) { events[name] = handler; },
    },
    window: {
      matchMedia: () => system,
      addEventListener(name, handler) { events[name] = handler; },
    },
    localStorage: {
      getItem() { if (storageBlocked) throw Error("blocked"); return stored; },
      setItem(key, value) { if (storageBlocked) throw Error("blocked"); stored = value; },
    },
  });
  return { root, button, system, events, timers, stored: () => stored };
}

test("saved theme is applied before DOM content loads", () => {
  const p = page({ saved: "light" });
  expect(p.root.dataset.theme).toBe("light");
  expect(p.button.hidden).toBe(true);
  p.events.DOMContentLoaded();
  expect(p.button.hidden).toBe(false);
  expect(p.button["aria-pressed"]).toBe("false");
});

test("automatic mode follows system changes without saving an override", () => {
  const p = page();
  p.events.DOMContentLoaded();
  expect(p.button["aria-pressed"]).toBe("true");
  p.system.matches = true;
  p.events.systemChange();
  expect(p.button["aria-pressed"]).toBe("false");
  expect(p.root.dataset.theme).toBeUndefined();
  expect(p.stored()).toBeNull();
});

test("toggle overrides system, persists across visits, and toggles back", () => {
  const p = page({ light: true });
  p.events.DOMContentLoaded();
  p.events.click();
  expect(p.root.dataset.theme).toBe("dark");
  expect(p.stored()).toBe("dark");
  p.events.systemChange();
  expect(p.button["aria-pressed"]).toBe("true");
  expect(page({ saved: p.stored(), light: true }).root.dataset.theme).toBe("dark");
  p.events.click();
  expect(p.root.dataset.theme).toBe("light");
  expect(p.stored()).toBe("light");
});

test("storage updates sync tabs; clearing restores system preference", () => {
  const p = page({ saved: "dark", light: true });
  p.events.DOMContentLoaded();
  p.events.storage({ key: "unrelated", newValue: "light" });
  expect(p.root.dataset.theme).toBe("dark");
  p.events.storage({ key: "portfolio-theme", newValue: "light" });
  expect(p.root.dataset.theme).toBe("light");
  p.events.storage({ key: null, newValue: null });
  expect(p.root.dataset.theme).toBeUndefined();
  expect(p.button["aria-pressed"]).toBe("false");
});

test("invalid stored values fall back to system", () => {
  expect(page({ saved: "invalid" }).root.dataset.theme).toBeUndefined();
});

test("blocked storage does not break toggling", () => {
  const p = page({ storageBlocked: true });
  p.events.DOMContentLoaded();
  p.events.click();
  expect(p.root.dataset.theme).toBe("light");
  p.events.click();
  expect(p.root.dataset.theme).toBe("dark");
});

test("initial load is immediate; theme changes fade for 700 ms and restart on reversal", () => {
  const p = page({ saved: "dark" });
  p.events.DOMContentLoaded();
  expect(p.root.dataset.themeTransition).toBeUndefined();
  expect(p.timers.size).toBe(0);
  p.events.click();
  expect(p.root.dataset.themeTransition).toBe("");
  const firstTimer = [...p.timers.keys()][0];
  p.events.click();
  expect(p.timers.has(firstTimer)).toBe(false);
  expect(p.timers.size).toBe(1);
  const timer = [...p.timers.values()][0];
  expect(timer.delay).toBe(700);
  timer.callback();
  expect(p.root.dataset.themeTransition).toBeUndefined();
});
