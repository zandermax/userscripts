// ==UserScript==
// @name         DOM Watch Helper (DW)
// @namespace    https://example.com/
// @version      1.1.0
// @match        *://*/*
// @description  DOM utilities for userscripts with a robust ready signal (event + promise).
// @author       Zander Maxwell (@zandermaxwell)
// @grant        none
// ==/UserScript==

(function () {
	"use strict";

	// --- small utils ---
	const noop = () => {};
	function addStyle(css) {
		const s = document.createElement("style");
		s.setAttribute("data-dw-style", "1");
		s.textContent = css;
		(
			document.documentElement ||
			document.head ||
			document.body ||
			document
		).appendChild(s);
		return s;
	}
	function safeHide(node) {
		try {
			node.style?.setProperty("display", "none", "important");
		} catch {}
	}
	function safeRemove(node) {
		try {
			safeHide(node);
			queueMicrotask(() => node.remove());
		} catch {}
	}
	function clickIfExists(root, selector) {
		try {
			const scope = root && root.querySelector ? root : document;
			const el = scope.querySelector(selector);
			if (el) {
				el.click();
				return true;
			}
		} catch {}
		return false;
	}

	// --- observers ---
	function onAdded(selector, cb, opts = {}) {
		const root = opts.root || document;
		const once = !!opts.once;
		const seen = new WeakSet();
		const invoke = (el) => {
			if (el instanceof Element && !seen.has(el)) {
				seen.add(el);
				cb(el);
			}
		};
		root.querySelectorAll(selector).forEach(invoke);
		const mo = new MutationObserver((muts) => {
			for (const m of muts) {
				m.addedNodes?.forEach((n) => {
					if (n.nodeType !== 1) return;
					const el = /** @type {Element} */ (n);
					if (el.matches?.(selector)) invoke(el);
					el.querySelectorAll?.(selector)?.forEach(invoke);
				});
			}
			if (once) mo.disconnect();
		});
		mo.observe(root === document ? document.documentElement : root, {
			childList: true,
			subtree: true,
		});
		return mo;
	}

	function onNthElementChild(parentSelector, index, cb) {
		const getChild = () => {
			const p = document.querySelector(parentSelector);
			if (!p) return null;
			return p.children[index] || null;
		};
		let last;
		const maybeCall = () => {
			const child = getChild();
			if (child && child !== last) {
				last = child;
				cb(child);
			}
		};
		const int = setInterval(maybeCall, 500);
		setTimeout(() => clearInterval(int), 15000);
		if (document.readyState !== "loading") maybeCall();
		else
			document.addEventListener("DOMContentLoaded", maybeCall, { once: true });
		const mo = new MutationObserver(maybeCall);
		mo.observe(document.documentElement, { childList: true, subtree: true });
		return mo;
	}

	function hotkeyToggle(combo, onToggle = noop, initial = true) {
		const parts = combo
			.toLowerCase()
			.split("+")
			.map((s) => s.trim());
		let state = !!initial;
		function matches(e) {
			const need = (k) => parts.includes(k);
			const key = parts[parts.length - 1];
			if (!!need("alt") !== !!e.altKey) return false;
			if (!!need("shift") !== !!e.shiftKey) return false;
			if (!!need("ctrl") !== !!e.ctrlKey) return false;
			return (e.key || "").toLowerCase() === key;
		}
		window.addEventListener("keydown", (e) => {
			if (matches(e)) {
				state = !state;
				onToggle(state);
				console.log(`[DW] ${combo} → ${state ? "enabled" : "disabled"}`);
			}
		});
		return {
			get enabled() {
				return state;
			},
			set enabled(v) {
				state = !!v;
				onToggle(state);
			},
		};
	}

	function preHideCSS(css) {
		return addStyle(css);
	}

	function removeIframes(predicate, opts = {}) {
		const kill = (ifr) => {
			if (predicate(ifr)) safeRemove(ifr);
		};
		document.querySelectorAll("iframe").forEach(kill);
		if (opts.observe !== false) onAdded("iframe", kill);
	}

	const DW = {
		version: "1.1.0",
		onAdded,
		onNthElementChild,
		preHideCSS,
		addStyle,
		safeRemove,
		safeHide,
		clickIfExists,
		hotkeyToggle,
		removeIframes,
		whenReady(cb) {
			// convenience
			if (window.DW === DW) cb(DW);
			else window.addEventListener("DW:ready", () => cb(DW), { once: true });
		},
	};

	// Expose immediately…
	window.zander = {
		DW,
	};

	// …and signal readiness both ways:
	// 1) Promise (idempotent)
	if (!window.DW_READY) {
		try {
			let _resolve;
			const p = new Promise((res) => {
				_resolve = res;
			});
			Object.defineProperty(window, "DW_READY", {
				value: p,
				writable: false,
				configurable: true,
			});
			// Resolve on next microtask to ensure listeners can attach first
			queueMicrotask(() => _resolve(DW));
		} catch {
			// Fallback: set a resolved promise
			window.DW_READY = Promise.resolve(DW);
		}
	} else {
		// If someone set it, try to resolve it (best-effort).
		if (typeof window.DW_READY.resolve === "function") {
			window.DW_READY.resolve(DW);
		}
	}

	// 2) Event (also on next microtask to avoid race)
	queueMicrotask(() => {
		try {
			window.dispatchEvent(
				new CustomEvent("DW:ready", { detail: { version: DW.version } }),
			);
		} catch {}
	});
})();
