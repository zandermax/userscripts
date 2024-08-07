// ==UserScript==
// @name         LinkCopier
// @namespace    zandermax
// @version      2023-12-28
// @description  Copy title and link of current page, using ctrl + shift + c
// @author       Zander Maxwell (zandermax)
// @match        *://*/*
// @grant        GM.setClipboard
// ==/UserScript==

const logPrefix = 'LinkCopier';

const log = text => {
	console.log(`[${logPrefix}] ${text}`);
};

document.addEventListener('keydown', event => {
	if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c') {
		const title = document.title || '[NO TITLE]';
		let url = window.location.href;
		// Replace all parentheses with URI encoded versions
		// This is necessary because the markdown link will be pasted into a URL field
		url = url.replace(/\(/g, '%28').replace(/\)/g, '%29');
		const md = `[${title}](${url})`;

		GM.setClipboard(md);
		log(`copied link: ${md}`);
	}
});
