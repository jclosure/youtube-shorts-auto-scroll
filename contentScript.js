(() => {
  if (window.__ytShortsAutoScrollInitialized) return;
  window.__ytShortsAutoScrollInitialized = true;

  let advancedForCurrentVideo = false;
  let lastAdvanceAt = 0;

  function onShortsPage() {
    return location.pathname.startsWith('/shorts/');
  }

  function getVideo() {
    return (
      document.querySelector('[data-no-fullscreen="true"]') ||
      document.querySelector('ytd-reel-video-renderer video') ||
      document.querySelector('video')
    );
  }

  function getNextButton() {
    const selectors = [
      'button[aria-label="Next video"]',
      'button[aria-label*="Next"]',
      '#navigation-button-down button',
      'ytd-reel-player-overlay-renderer #navigation-button-down button',
      '.navigation-button + * button',
      '.navigation-container .navigation-button + * button'
    ];

    return selectors.map((s) => document.querySelector(s)).find(Boolean) || null;
  }

  function clickNext() {
    const nextBtn = getNextButton();
    if (!nextBtn) return false;

    // Some Firefox builds respond better to explicit pointer/mouse events.
    nextBtn.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
    );
    nextBtn.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    );
    nextBtn.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    );
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

    setTimeout(() => {
      if (!clickNext()) {
        // keyboard fallback (works in both Chrome and Firefox)
        const ev = {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true
        };
        window.dispatchEvent(new KeyboardEvent('keydown', ev));
        window.dispatchEvent(new KeyboardEvent('keyup', ev));
        document.dispatchEvent(new KeyboardEvent('keydown', ev));
        document.dispatchEvent(new KeyboardEvent('keyup', ev));
      }
    }, 500);
  }

  function attachVideoEvents() {
    const video = getVideo();
    if (!video || video.__ytShortsAutoScrollBound) return;
    video.__ytShortsAutoScrollBound = true;

    video.addEventListener('play', () => {
      if (video.currentTime < 0.5) advancedForCurrentVideo = false;
    });

    video.addEventListener('seeked', () => {
      if (video.currentTime < 0.5) advancedForCurrentVideo = false;
    });

    video.addEventListener('ended', () => {
      scheduleAdvance();
    });
  }

  function monitorPlayback() {
    if (!onShortsPage()) return;

    const video = getVideo();
    if (!video) return;

    attachVideoEvents();

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
