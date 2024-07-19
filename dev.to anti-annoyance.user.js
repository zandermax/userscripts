// ==UserScript==
// @name         Dev.to anti-annoyance
// @namespace    http://tampermonkey.net/
// @version      2024-06-13
// @description  Close big useless sponsorship notification on dev.to
// @author       zandermaxwell@hey.com
// @match        https://dev.to/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dev.to
// @grant        none
// ==/UserScript==

const query = '[id^="sponsorship-close-trigger"]'

const waitForIt = (selectorText, callback) => {
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



// Close big useless sponsorship notification
const goAway = () => {
    document.querySelector(query).click();
};

waitForIt(query, goAway);

