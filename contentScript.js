(() => {
  if (window.__ytShortsAutoScrollInitialized) return;
  window.__ytShortsAutoScrollInitialized = true;

  let advancedForCurrentVideo = false;
  let lastAdvanceAt = 0;

  function onShortsPage() {
    return location.pathname.startsWith('/shorts/');
  }

  function getVideo() {
    return document.querySelector('[data-no-fullscreen="true"]');
  }

  function clickNext() {
    const nav = document.querySelector('.navigation-button');
    const nextWrap = nav?.nextElementSibling;
    const nextBtn = nextWrap?.querySelector('button');
    if (!nextBtn) return false;
    nextBtn.click();
    return true;
  }

  function scheduleAdvance() {
    if (!onShortsPage()) return;
    if (advancedForCurrentVideo) return;

    const now = Date.now();
    if (now - lastAdvanceAt < 1200) return;
    lastAdvanceAt = now;
    advancedForCurrentVideo = true;

    // Smooth transition: let current short finish, then move on.
    setTimeout(() => {
      clickNext();
    }, 500);
  }

  function attachVideoEvents() {
    const video = getVideo();
    if (!video || video.__ytShortsAutoScrollBound) return;
    video.__ytShortsAutoScrollBound = true;

    // Re-arm for a new short.
    video.addEventListener('play', () => {
      if (video.currentTime < 0.5) advancedForCurrentVideo = false;
    });

    video.addEventListener('seeked', () => {
      if (video.currentTime < 0.5) advancedForCurrentVideo = false;
    });

    // Primary path: wait for real ended event.
    video.addEventListener('ended', () => {
      scheduleAdvance();
    });
  }

  function monitorPlayback() {
    if (!onShortsPage()) return;

    const video = getVideo();
    if (!video) return;

    attachVideoEvents();

    // Fallback: some players don't reliably emit ended in all states.
    const duration = video.duration;
    const current = video.currentTime;
    if (
      !advancedForCurrentVideo &&
      Number.isFinite(duration) &&
      duration > 0 &&
      video.paused &&
      current >= duration - 0.05
    ) {
      scheduleAdvance();
    }
  }

  function bootstrap() {
    attachVideoEvents();
    monitorPlayback();
  }

  setInterval(bootstrap, 250);

  window.addEventListener('yt-navigate-finish', () => {
    advancedForCurrentVideo = false;
    bootstrap();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrap();
  } else {
    window.addEventListener('load', bootstrap, { once: true });
  }

  console.log('[YT-Shorts-AutoScroll] initialized');
})();
