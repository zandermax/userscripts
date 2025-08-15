// ==UserScript==
// @name         Perplexity login pop-up remover (via DW; waitable)
// @namespace    https://zandermaxwell.dev/
// @version      1.1.0
// @author       Zander Maxwell (@zandermax)
// @description  Auto-close popup as the 2nd child under <main id="root">, waits for DW.
// @match        *://www.perplexity.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(async function () {
	// Wait for the helper to be ready no matter what loaded first.
	const DW =
		window.zander?.DW ||
		(await (window.DW_READY ||
			new Promise((res) => {
				const handler = () => {
					window.removeEventListener("DW:ready", handler);
					res(window.zander.DW);
				};
				window.addEventListener("DW:ready", handler);
			})));

	const { preHideCSS, onNthElementChild, clickIfExists, safeRemove } = DW;

	const ROOT = "main#root";
	const CLOSE_BTN = ".absolute.right-0.top-0 button";
	const USE_REMOVAL_FALLBACK = true;

	preHideCSS(`${ROOT} > :nth-child(2) { display: none !important; }`);

	function handlePopup(popupEl) {
		if (
			clickIfExists(popupEl, CLOSE_BTN) ||
			clickIfExists(document, CLOSE_BTN)
		) {
			popupEl.style?.setProperty("display", "none", "important");
			return;
		}
		if (USE_REMOVAL_FALLBACK) safeRemove(popupEl);
	}

	onNthElementChild(ROOT, 1, handlePopup);
})();
