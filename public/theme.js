// Run before the stylesheet so a saved preference is applied before first paint.
(() => {
  const root = document.documentElement;
  const storageKey = "portfolio-theme";
  const systemLight = window.matchMedia("(prefers-color-scheme: light)");
  const validTheme = (value) => value === "dark" || value === "light";
  let preference = null;
  let button;
  let previousDark;
  let transitionTimer;

  try {
    const saved = localStorage.getItem(storageKey);
    if (validTheme(saved)) preference = saved;
  } catch {
    // The toggle still works when browser storage is unavailable.
  }

  function applyTheme() {
    const dark = (preference ?? (systemLight.matches ? "light" : "dark")) === "dark";
    // Animate changes, not the initial saved preference. Restart the window on
    // rapid toggles so CSS can smoothly reverse from the current colors.
    if (previousDark !== undefined && dark !== previousDark) {
      root.dataset.themeTransition = "";
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        delete root.dataset.themeTransition;
      }, 700);
    }
    previousDark = dark;

    // Without an override, CSS follows the system even with JavaScript disabled.
    if (preference) root.dataset.theme = preference;
    else delete root.dataset.theme;

    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark
        ? "Frappé (dark). Switch to Latte (light)."
        : "Latte (light). Switch to Frappé (dark).";
    }
  }

  applyTheme();
  systemLight.addEventListener("change", applyTheme);
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validTheme(event.newValue) ? event.newValue : null;
    applyTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    button = document.getElementById("theme-toggle");
    button.hidden = false;
    applyTheme();
    button.addEventListener("click", () => {
      const current = preference ?? (systemLight.matches ? "light" : "dark");
      preference = current === "dark" ? "light" : "dark";
      applyTheme();
      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // Keep the in-memory preference for this visit.
      }
    });
  });
})();
