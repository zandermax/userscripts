// ==UserScript==
// @name         Google domain filter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Filters specified domains from Google search (based on link destination)
// @author       You
// @match        http*://*.google.com/search*
// @icon         https://www.google.com/s2/favicons?domain=google.com
// @grant        none
// ==/UserScript==

const domains = ["lightrun.com", "pretagteam.com"];

const filter = () =>
  domains.forEach((d) =>
    document.querySelectorAll(`a[href*="${d}/"]:not([class])`).forEach((e) => {
      const placeHolder = (document.createElement("div").innerText =
        "[Filtered domain result removed]");
      e.closest("div[data-hveid]")?.replaceWith(placeHolder);
    })
  );

(function () {
  "use strict";
  // Watch for the relevant element to be present
  const observer = new MutationObserver(function (mutations, me) {
    const overlay = document.getElementById("search");
    if (overlay) {
      me.disconnect(); // stop observing
      filter();
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
})();

