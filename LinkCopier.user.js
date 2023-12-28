// ==UserScript==
// @name         LinkCopier
// @namespace    zandermax
// @version      2023-12-28
// @description  Copy title and link of current page, using ctrl + shift + c
// @author       zandermaxwell@hey.com
// @match        *://*/*
// @grant        GM.setClipboard
// ==/UserScript==

const logPrefix = "LinkCopier"

const log = (text) => {
    console.log(`[${logPrefix}] ${text}`);
};

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c") {
        const title = document.title || "[NO TITLE]";
        const url = window.location.href;
        const md = `[${title}](${url})`;

        GM.setClipboard(md);
        log(`copied link: ${md}`);
    }
});