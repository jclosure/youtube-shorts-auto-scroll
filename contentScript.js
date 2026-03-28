let activeVideo = null;
let progressInterval = null;

function getVisibleVideo() {
	const videos = Array.from(document.querySelectorAll("video"));
	if (!videos.length) return null;

	const visible = videos.find((video) => {
		const rect = video.getBoundingClientRect();
		return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
	});

	return visible || videos[0];
}

function getNextButton() {
	const selectors = [
		'button[aria-label="Next video"]',
		'button[aria-label*="Next"]',
		"ytd-reel-player-overlay-renderer #navigation-button-down button",
		".navigation-button + * button"
	];

	for (const selector of selectors) {
		const button = document.querySelector(selector);
		if (button) return button;
	}

	return null;
}

function goToNextShort() {
	const nextButton = getNextButton();
	if (nextButton) {
		nextButton.click();
		return;
	}

	// Fallback when YouTube changes button DOM.
	document.dispatchEvent(
		new KeyboardEvent("keydown", {
			key: "ArrowDown",
			code: "ArrowDown",
			keyCode: 40,
			which: 40,
			bubbles: true
		})
	);
}

function clearProgressInterval() {
	if (progressInterval) {
		clearInterval(progressInterval);
		progressInterval = null;
	}
}

function onVideoEnded() {
	clearProgressInterval();
	setTimeout(goToNextShort, 10);
}

function watchVideo(video) {
	if (!video || video === activeVideo) return;

	if (activeVideo) {
		activeVideo.removeEventListener("ended", onVideoEnded);
	}

	clearProgressInterval();
	activeVideo = video;
	activeVideo.addEventListener("ended", onVideoEnded);

	progressInterval = setInterval(() => {
		if (!activeVideo || !Number.isFinite(activeVideo.duration) || activeVideo.duration <= 0) return;

		const remaining = activeVideo.duration - activeVideo.currentTime;
		if (remaining <= 0.25) {
			onVideoEnded();
		}
	}, 500);
}

function attachToCurrentVideo() {
	const video = getVisibleVideo();
	if (!video) {
		setTimeout(attachToCurrentVideo, 300);
		return;
	}

	if (video.readyState >= 1 && Number.isFinite(video.duration)) {
		watchVideo(video);
		return;
	}

	video.addEventListener("loadedmetadata", () => watchVideo(video), { once: true });
}

const observer = new MutationObserver(() => {
	attachToCurrentVideo();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("yt-navigate-finish", attachToCurrentVideo);
window.addEventListener("popstate", () => setTimeout(attachToCurrentVideo, 100));

attachToCurrentVideo();