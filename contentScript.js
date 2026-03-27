if (window.__ytShortsAutoScrollInitialized) {
  console.debug("[YT-Shorts-AutoScroll] already initialized");
} else {
  window.__ytShortsAutoScrollInitialized = true;

  const registeredVideos = new WeakSet();
  let lastAdvanceAt = 0;

  const state = {
    currentVideo: null,
    lastTime: 0,
    nearEnd: false,
    lastPath: location.pathname
  };

  function log(...args) {
    console.debug("[YT-Shorts-AutoScroll]", ...args);
  }

  function onShortsPage() {
    return location.pathname.startsWith("/shorts/");
  }

  function getNextButton() {
    const selectors = [
      'button[aria-label="Next video"]',
      'button[aria-label*="Next video"]',
      '#navigation-button-down button',
      'ytd-reel-player-overlay-renderer #navigation-button-down button',
      'ytd-reel-player-overlay-renderer button.yt-spec-button-shape-next'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function keyboardFallback() {
    const evInit = {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
      which: 40,
      bubbles: true,
      cancelable: true
    };

    window.dispatchEvent(new KeyboardEvent("keydown", evInit));
    window.dispatchEvent(new KeyboardEvent("keyup", evInit));
    document.dispatchEvent(new KeyboardEvent("keydown", evInit));
    document.dispatchEvent(new KeyboardEvent("keyup", evInit));
  }

  function advance(reason) {
    if (!onShortsPage()) return;

    const now = Date.now();
    if (now - lastAdvanceAt < 1200) return;
    lastAdvanceAt = now;

    const btn = getNextButton();
    if (btn) {
      btn.click();
      log(`advanced via button (${reason})`);
      return;
    }

    keyboardFallback();
    log(`advanced via keyboard fallback (${reason})`);
  }

  function handleVideoEnded() {
    advance("ended-event");
  }

  function registerVideo(video) {
    if (!video || registeredVideos.has(video)) return;
    registeredVideos.add(video);
    video.addEventListener("ended", handleVideoEnded);
    log("registered video ended listener");
  }

  function findActiveVideo() {
    const videos = Array.from(document.querySelectorAll("video"));
    if (!videos.length) return null;

    // Prefer currently playing, else first visible.
    const playing = videos.find((v) => !v.paused && v.readyState >= 2);
    if (playing) return playing;

    const visible = videos.find((v) => {
      const r = v.getBoundingClientRect();
      return r.width > 100 && r.height > 100 && r.bottom > 0 && r.top < innerHeight;
    });

    return visible || videos[0];
  }

  function monitorPlayback() {
    if (!onShortsPage()) return;

    const v = findActiveVideo();
    if (!v) return;

    registerVideo(v);

    if (state.currentVideo !== v) {
      state.currentVideo = v;
      state.lastTime = v.currentTime || 0;
      state.nearEnd = false;
      log("active video changed");
      return;
    }

    const duration = v.duration;
    const t = v.currentTime || 0;

    if (Number.isFinite(duration) && duration > 1) {
      // If we get near the end, mark it. Some Shorts loop and never emit `ended`.
      if (t >= duration - 0.25) {
        state.nearEnd = true;
      }

      // If video time resets after near-end (loop), move to next.
      if (state.nearEnd && t < 0.7 && state.lastTime > duration - 0.25) {
        state.nearEnd = false;
        advance("loop-reset");
      }

      // Threshold fallback for edge cases.
      if (!v.paused && t >= duration - 0.08) {
        advance("threshold");
      }
    }

    state.lastTime = t;
  }

  function bootstrap() {
    if (!onShortsPage()) return;
    const videos = document.querySelectorAll("video");
    videos.forEach(registerVideo);
    if (!videos.length) log("no videos found yet");
  }

  function routeChanged() {
    if (location.pathname !== state.lastPath) {
      state.lastPath = location.pathname;
      state.currentVideo = null;
      state.lastTime = 0;
      state.nearEnd = false;
      log("route changed", location.pathname);
      setTimeout(bootstrap, 300);
      setTimeout(bootstrap, 1200);
    }
  }

  const mo = new MutationObserver(() => {
    bootstrap();
  });
  mo.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener("yt-navigate-finish", () => {
    routeChanged();
    bootstrap();
  });
  window.addEventListener("popstate", routeChanged);

  if (document.readyState === "loading") {
    window.addEventListener("load", () => setTimeout(bootstrap, 800), { once: true });
  } else {
    setTimeout(bootstrap, 800);
  }

  setInterval(() => {
    routeChanged();
    monitorPlayback();
  }, 250);

  log("initialized");
}