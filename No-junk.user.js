// ==UserScript==
// @name         No-junk
// @namespace    zandermax
// @version      0.2
// @description  Disable junk on websites
// @author       zandermaxwell@hey.com
// @match        *://*/*
// @grant        none
// ==/UserScript==

const waitForIt = (selectorText, callback) => {
	const observer = new MutationObserver(function (mutations, me) {
		const element = document.querySelector(selectorText);
		if (element) {
			me.disconnect(); // stop observing
			callback();
		}
	});
	observer.observe(document, {
		childList: true,
		subtree: true,
	});
};

const elementTypesToShow = 'p,a,h1,h2,h3,h4,h5,h6';

const logPreText = '[JunkSquasher]';

const junkSquashLog = (str) => {
	console.warn(`${logPreText} str`);
};

const collapse = (nonp) => {
	const squashMap = {};
	const details = document.createElement('details');
	const summary = document.createElement('summary');

	const tagName = nonp.tagName.toLowerCase();
	let numSquashed;

	if (tagName === 'figure') {
		summary.innerText = 'Figure';
	} else {
		summary.innerText = '[Hidden content]';
	}

	// Add label if present
	const labels = nonp.innerHTML.match(/\s(?:aria-label=(?:"([^"]+)"|(\S+)))/);
	if (labels) {
		const [, label, labelWithSpaces] = labels;
		if (label || labelWithSpaces) {
			summary.innerText += ` (${label || labelWithSpaces})`;
		}
	}

	if (nonp.querySelector('iframe')) {
		summary.innerText += ' - IFRAME';
		const iframesSquashed = squashMap.iframe ?? 0;
		squashMap.iframe = iframesSquashed + 1;
	}

	details.appendChild(summary);
	nonp.parentElement.replaceChild(details, nonp);
	details.appendChild(nonp);

	numSquashed = squashMap[tagName] ?? 0;
	squashMap[tagName] = numSquashed + 1;
	console.table(squashMap);
};

window.noJunk = {
	byeVideo() {
		stopAutoPlaying();
		document.querySelectorAll('.jw-media').forEach(collapse);
	},

	enableScrolling() {
		document
			.querySelectorAll("[overflow], [style~='overflow:']")
			.forEach((el) => {
				el.style['overflow'] = 'auto';
			});
	},

	/**
	 * [Attempts to] Hide non-text under a styled <details> element
	 *
	 * TODO do this on more than just a single level, since many sites are <div> crazy
	 */
	squash() {
		const mainContent =
			document.querySelector('main p') ?? document.querySelector('body p');
		if (!mainContent?.parentElement) {
			console.warn('[JunkSquasher] no main content found');
			return;
		}

		const bodyElement = document.querySelector('body');
		let mainParent = mainContent;
		let nonJunkStuff;
		while (!nonJunkStuff && nonJunkStuff !== bodyElement) {
			mainParent = mainParent.parentElement;
			if (!mainParent) break;
			nonJunkStuff = mainParent.querySelectorAll(
				`&>:not(${elementTypesToShow})`
			);
		}

		if (nonJunkStuff === bodyElement) {
			junkSquashLog('Nothing to hide...');
			return;
		}

		const visibleNonPs = [...nonJunkStuff].filter(
			(el) => el.offsetHeight !== 0 && el.offsetWidth !== 0
		);

		visibleNonPs.forEach(collapse);

		addStyles();
	},
};

const addStyles = () => {
	const styleElement = document.createElement('style');
	document.head.appendChild(styleElement);
	const styleSheet = styleElement.sheet;

	styleSheet.insertRule(`details { margin-block: 1ex; }`);
	styleSheet.insertRule(
		`summary {
		margin-bottom: 1em;
		font-size: 0.8em;
		font-style: italic;
	}`
	);
	styleSheet.insertRule(
		`summary:hover, summary:focus {
		cursor: pointer;
		outline: auto;
		outline-color: currentcolor;
	}`
	);
};

const stopAutoPlaying = () => {
	document.querySelectorAll('video').forEach((vid) => {
		vid.autoplay = false;
		vid.pause();
	});
};

// Should just do this regardless... auto-play should be illegal
waitForIt('video', stopAutoPlaying);

// I have yet to find any value in something created by jwplayer. Good riddance.
waitForIt("[class*='jwplayer']", () => {
	document
		.querySelectorAll("[class*='jwplayer']")
		.forEach((jwPlayerJunk) => jwPlayerJunk.remove());
});
