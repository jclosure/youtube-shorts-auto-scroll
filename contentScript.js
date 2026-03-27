if (window.__ytShortsAutoScrollInitialized) {
  console.debug("YouTube Shorts Auto Scroll already initialized.");
} else {
  window.__ytShortsAutoScrollInitialized = true;

  const registeredVideos = new WeakSet();
  let lastAdvanceAt = 0;
  let lastVideoSignature = "";

  function onShortsPage() {
    return location.pathname.startsWith("/shorts/");
  }

  function getNextButton() {
    const selectors = [
      'button[aria-label="Next video"]',
      'ytd-reel-player-overlay-renderer button[aria-label*="Next"]',
      'button.yt-spec-button-shape-next[aria-label*="Next"]',
      '#navigation-button-down button',
      'ytd-reel-player-renderer #navigation-button-down button'
    ];

    return selectors
      .map((s) => document.querySelector(s))
      .find(Boolean);
  }

  function attemptKeyboardFallback() {
    const events = ["keydown", "keyup"];
    for (const type of events) {
      document.dispatchEvent(
        new KeyboardEvent(type, {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true
        })
      );
    }
  }

  function goNext(reason = "unknown") {
    if (!onShortsPage()) return;

    const now = Date.now();
    if (now - lastAdvanceAt < 900) return; // debounce
    lastAdvanceAt = now;

    const btn = getNextButton();
    if (btn) {
      btn.click();
      console.log(`YouTube Shorts Auto Scroll: next (${reason})`);
      return;
    }

    attemptKeyboardFallback();
    console.log(
      `YouTube Shorts Auto Scroll: next via keyboard fallback (${reason})`
    );
  }

  function registerVideo(video) {
    if (registeredVideos.has(video)) return;
    registeredVideos.add(video);
    video.addEventListener("ended", () => goNext("ended-event"));
  }

  function registerAllVideos() {
    if (!onShortsPage()) return;
    document.querySelectorAll("video").forEach(registerVideo);
  }

  function monitorPlayback() {
    if (!onShortsPage()) return;

    const video = document.querySelector("video");
    if (!video) return;

    registerVideo(video);

    const sig = `${location.pathname}|${Math.floor(video.currentTime)}|${Math.floor(
      video.duration || 0
    )}`;
    if (sig !== lastVideoSignature) lastVideoSignature = sig;

    if (
      Number.isFinite(video.duration) &&
      video.duration > 0 &&
      !video.paused &&
      video.currentTime >= video.duration - 0.12
    ) {
      goNext("time-threshold");
    }
  }

  function onRouteMaybeChanged() {
    setTimeout(registerAllVideos, 250);
    setTimeout(registerAllVideos, 1000);
  }

  const observer = new MutationObserver(() => {
    registerAllVideos();
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  // Handle YouTube SPA navigation updates
  window.addEventListener("yt-navigate-finish", onRouteMaybeChanged);
  window.addEventListener("popstate", onRouteMaybeChanged);

  if (document.readyState === "complete") {
    setTimeout(registerAllVideos, 700);
  } else {
    window.addEventListener(
      "load",
      () => setTimeout(registerAllVideos, 700),
      { once: true }
    );
  }

  // Backup monitor for cases where `ended` never fires.
  setInterval(monitorPlayback, 350);
}