(() => {
  const video = document.getElementById("wolf-preview");
  const button = document.getElementById("wolf-playback");

  // Without scripting or visibility observation, keep the static image.
  if (!video || !button || !("IntersectionObserver" in window)) return;

  const media = video.parentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let loaded = false;
  let nearby = false;
  let visible = false;
  let pausedByUser = false;
  let manualPlayback = false;
  let failed = false;
  let pending = false;
  let playRequest = 0;
  let touchInteraction = false;
  let feedbackTimer;

  // Explicit Play permits motion; scrolling alone never overrides the preference.
  function enabled() {
    return !failed && !pausedByUser && (!reducedMotion.matches || manualPlayback);
  }

  function shouldPlay() {
    return enabled() && visible && !document.hidden;
  }

  function prepare() {
    if (loaded || !enabled() || document.hidden) return;
    loaded = true;
    for (const source of video.querySelectorAll("source[data-src]")) {
      source.src = source.dataset.src;
    }
    video.preload = "auto";
    video.load();
  }

  function update() {
    button.hidden = failed;
    button.setAttribute("aria-label", enabled() ? "Pause preview" : "Play preview");
    button.classList.toggle("is-paused", !enabled());

    if (nearby && enabled()) prepare();
    if (!shouldPlay()) {
      // Invalidate outstanding play promises when scrolling, pausing, or hiding.
      if (pending) playRequest++;
      pending = false;
      video.pause();
      return;
    }

    prepare();
    if (pending || !video.paused) return;
    pending = true;
    const request = ++playRequest;
    video.play().then(() => {
      if (!shouldPlay()) video.pause();
    }).catch((error) => {
      if (request !== playRequest || error.name === "AbortError") return;
      if (error.name === "NotSupportedError") {
        failed = true;
        media.classList.remove("has-frames");
      } else {
        // Autoplay can be blocked by browser policy; allow a direct Play click.
        pausedByUser = true;
      }
      update();
    }).finally(() => {
      if (request === playRequest) pending = false;
    });
  }

  video.muted = true;
  video.addEventListener("playing", () => {
    if (shouldPlay()) media.classList.add("has-frames");
    else video.pause();
  });
  video.addEventListener("error", () => {
    failed = true;
    media.classList.remove("has-frames");
    update();
  });

  function trackPointer(event) {
    touchInteraction = event.pointerType === "touch" || event.pointerType === "pen";
    button.classList.toggle("is-touch", touchInteraction);
  }

  button.addEventListener("pointerdown", trackPointer);
  button.addEventListener("pointerenter", trackPointer);
  button.addEventListener("keydown", () => {
    touchInteraction = false;
    button.classList.remove("is-touch");
  });
  button.addEventListener("click", () => {
    if (enabled()) {
      pausedByUser = true;
    } else {
      pausedByUser = false;
      manualPlayback = true;
    }
    update();
    if (touchInteraction) {
      // Each tap restarts the one-second hold; CSS handles the fade afterwards.
      button.classList.add("is-revealed");
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => {
        button.classList.remove("is-revealed");
      }, 1000);
    }
  });
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", () => {
    manualPlayback = false;
    if (reducedMotion.matches) media.classList.remove("has-frames");
    update();
  });

  new IntersectionObserver(([entry]) => {
    nearby = entry.isIntersecting;
    update();
  }, { rootMargin: "250px 0px" }).observe(media);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }, { threshold: 0 }).observe(media);

  update();
})();
