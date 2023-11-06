// ==UserScript==
// @name         GeeksForGeeks anti-annoyance
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes anti-adblock and login popups on geeksforgeeks.com
// @author       zandermaxwell@hey.com
// @match        https://www.geeksforgeeks.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geeksforgeeks.org
// @grant        none
// @run-at       document-end
// ==/UserScript==

const waitForElement = (query, callback) => {
    const observer = new MutationObserver(function (mutations, me) {
    const element = document.querySelector(query);
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

const dismissAdblockPopup = () => {
    document.querySelector("#ad-blocker-div-continue-btn")?.click();
};

const dismissLoginPopup = () => {
    document.querySelector(".login-modal-div .close").click();
};

waitForElement("#ad-blocker-div-continue-btn", dismissAdblockPopup);
waitForElement(".login-modal-div", dismissLoginPopup)