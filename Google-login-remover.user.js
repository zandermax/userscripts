// ==UserScript==
// @name         Nuke Google Login / One Tap Iframes (via DW; waitable)
// @namespace    https://example.com/
// @version      1.1.0
// @author       Zander Maxwell (@zandermaxwell)
// @description  Remove Google login/One Tap iframes & overlays; waits for DW.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
	function start(DW) {
		const { preHideCSS, removeIframes, onAdded, safeRemove } = DW;

		preHideCSS(`
      iframe[src*="accounts.google.com/gsi/"],
      iframe[src*="accounts.google.com/signin"],
      iframe[src*="accounts.google.com/picker"],
      iframe[src*="ogs.google.com"],
      iframe[id^="gsi_"], iframe[name^="__gsi"],
      #credential_picker_container, #oneTapDialog {
        display: none !important;
      }
    `);

		const isGoogleAuthIframe = (ifr) => {
			const src = (ifr.getAttribute("src") || "").toLowerCase();
			const id = (ifr.id || "").toLowerCase();
			const name = (ifr.name || "").toLowerCase();
			const title = (ifr.title || "").toLowerCase();
			return (
				/accounts\.google\.com\/(gsi|signin|picker)/.test(src) ||
				/ogs\.google\.com/.test(src) ||
				id.startsWith("gsi_") ||
				name.startsWith("__gsi") ||
				/one\s*tap|sign-?in|login/.test(title)
			);
		};

		removeIframes(isGoogleAuthIframe, { observe: true });
		onAdded(
			'#credential_picker_container, #oneTapDialog, div[class*="oneTap"], div[class*="one-tap"]',
			safeRemove,
		);
	}

	if (window.DW) start(window.DW);
	else if (window.DW_READY) window.DW_READY.then(start);
	else
		window.addEventListener("DW:ready", () => start(window.DW), { once: true });
})();
