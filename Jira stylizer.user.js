// ==UserScript==
// @name         Jira stylizer
// @namespace    http://tampermonkey.net/
// @version      2024-08-07
// @description  Jira style enhancements
// @author       Zander Maxwell (zandermax)
// @match        https://*.atlassian.net/jira/software/c/projects/*/boards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

const selectors = {
	columns: '[data-testid*="swimlane-columns"] [data-testid*="column"]',
	columnHeaders:
		'[data-drop-target-for-element]:has([data-testid*="column-header-container"] [data-testid*="column-title"])',
	sectionHeaders: '[data-testid*="swimlane"][aria-expanded][role="button"]',
	WITHIN: {
		cards: {
			flag: 'aria-label="Flagged"',
		},
		columns: {
			cards: '[draggable]',
			columnBackgrounds:
				'[data-drop-target-for-element]:has(ul[aria-labelledby])',
		},
	},
};

const CLASS_PREFIX = 'jira-stylizer-';
const headerNamesToClass = {
	'planned / todo': 'planned',
	'in progress': 'in-progress',
	'code review': 'code-review',
	acceptance: 'acceptance',
	'ready for release': 'ready-for-release',
	'on integration': 'on-integration',
};

/* -------------------------------------------------------------------------- */
/*                                 DOM helpers                                */
/* -------------------------------------------------------------------------- */
const waitForIt = ({ query, onAppear, onDisappear, once = false }) => {
	let elementPresent = false;

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			const element = document.querySelector(query);

			if (element && !elementPresent) {
				elementPresent = true;
				if (onAppear) {
					onAppear(element);
					if (once) {
						observer.disconnect();
					}
				}
			} else if (!element && elementPresent) {
				elementPresent = false;
				if (onDisappear) {
					onDisappear();
					if (once) {
						observer.disconnect();
					}
				}
			}
		});
	});

	observer.observe(document, {
		childList: true,
		subtree: true,
	});
};

const fixStyling = () => {
	// Make the section headers easier to read and use
	const style = document.createElement('style');
	const css = `
		${selectors.sectionHeaders} {
				justify-content: center;
				font-size: 1.5em;
		}
	`;

	style.appendChild(document.createTextNode(css));
	document.head.appendChild(style);

	// TODO
	// Get column types based on text content, and go through each and add the corresponding class
	// Column backgrounds should be set by class
	// const columnHeaders = document.querySelectorAll(selectors.columnHeaders);
	// columnHeaders.forEach((header) => {
	// 	// Set class based on text content that matches the headerNamesToClass object properties

	// 	// Extract the title,  number of cards and max number of cards from the element, ignoring elements that are hidden
	// 	const regex = /([^\d\n]+)\n(\d\n*)*MAX: (\d+)/;
	// 	const [columnName, numberOfCards, maxNumberOfCards] =
	// 		header.innerText.match(regex);

	// 	console.log(`Column: ${columnName}`);
	// 	console.log(`Number of cards: ${numberOfCards}`);
	// 	console.log(`Max number of cards: ${maxNumberOfCards}`);

	// 	// if (!numberOfCards > maxNumberOfCards) {
	// 	// 	// Determine which header name matches the header text
	// 	// 	const headerName = Object.keys(headerNamesToClass).find((name) =>
	// 	// 		headerText.includes(name)
	// 	// 	);
	// 	// 	// If a match is found, set the class
	// 	// 	if (headerName) {
	// 	// 		header.classList.add(CLASS_PREFIX + headerNamesToClass[headerName]);
	// 	// 	}
	// 	// }
	// });

	// Cards:
	// Each one that is flagged:
	// 	- add border of #FFD54F
	// 	- do not set class
	// Otherwise, set class based on respective column
};

waitForIt({ query: selectors.sectionHeaders, onAppear: fixStyling });
