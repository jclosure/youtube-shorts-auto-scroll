if (window.__ytShortsAutoScrollInitialized) {
  console.debug("YouTube Shorts Auto Scroll already initialized.");
} else {
  window.__ytShortsAutoScrollInitialized = true;

  const registeredVideos = new WeakSet();

  function getNextButton() {
    const selectors = [
      'button[aria-label="Next video"]',
      'ytd-reel-player-overlay-renderer button[aria-label*="Next"]',
      'button.yt-spec-button-shape-next[aria-label*="Next"]'
    ];

    return selectors
      .map((s) => document.querySelector(s))
      .find(Boolean);
  }

  function goNext() {
    const btn = getNextButton();
    if (!btn) {
      console.debug("YouTube Shorts next button not found.");
      return;
    }
    btn.click();
    console.log("YouTube Shorts Auto Scroll: moved to next video.");
  }

  function registerVideo(video) {
    if (registeredVideos.has(video)) return;
    registeredVideos.add(video);
    video.addEventListener("ended", goNext);
  }

  function registerAllVideos() {
    document.querySelectorAll("video").forEach(registerVideo);
  }

  const observer = new MutationObserver(() => {
    registerAllVideos();
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  if (document.readyState === "complete") {
    setTimeout(registerAllVideos, 1000);
  } else {
    window.addEventListener(
      "load",
      () => setTimeout(registerAllVideos, 1000),
      { once: true }
    );
  }
}
