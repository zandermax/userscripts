// ==UserScript==
// @name         Jira enhancements
// @namespace    http://tampermonkey.net/
// @version      2024-08-07
// @description  Jira enhancements
// @author       You
// @match        https://*.atlassian.net/browse/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

const mainTicketViewSelector = '[data-component-selector*="issue-details"]';
const saveButtonContainerSelector =
	'[data-testid="ak-editor-secondary-toolbar"]';
const inEditModeQuery =
	'[data-testid="issue.views.field.rich-text.editor-container"]';

let originalSaveButtonContainerStyle = null;

const waitForIt = ({ query, onAppear, onDisappear }) => {
	let elementPresent = false;

	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			const element = document.querySelector(query);

			if (element && !elementPresent) {
				elementPresent = true;
				if (onAppear) {
					onAppear(element);
				}
			} else if (!element && elementPresent) {
				elementPresent = false;
				if (onDisappear) {
					onDisappear();
				}
			}
		});
	});

	observer.observe(document, {
		childList: true,
		subtree: true
	});
};

const getLastChildWithHeight = parent => {
	const children = parent.children;
	for (let i = children.length - 1; i >= 0; i--) {
		if (children[i].offsetHeight > 0) {
			return children[i];
		}
	}
	return null;
};

const getChildWithZIndex = parent => {
	const children = parent.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const zIndex = window.getComputedStyle(child).zIndex;
		if (zIndex !== 'auto') {
			return child;
		}
		const foundChild = getChildWithZIndex(child);
		if (foundChild) {
			return foundChild;
		}
	}
	return null;
};

const getFirstChildWithBorder = parent => {
	const children = parent.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const borderWidth = window.getComputedStyle(child).borderWidth;
		if (borderWidth !== '0px') {
			return child;
		}
		const foundChild = getFirstChildWithBorder(child);
		if (foundChild) {
			return foundChild;
		}
	}
	return null;
};

const moveSaveContainer = saveButtonContainer => {
	const ticketViewContainer = document.querySelector(mainTicketViewSelector);
	const lastChild = getLastChildWithHeight(ticketViewContainer);
	const bottomContainer = getChildWithZIndex(lastChild);
	if (bottomContainer && saveButtonContainer) {
		const childWithBorder = getFirstChildWithBorder(bottomContainer);
		saveButtonContainer.style.border = getComputedStyle(childWithBorder).border;
		saveButtonContainer.style.paddingInlineStart = '1em';
		bottomContainer.insertBefore(
			saveButtonContainer,
			bottomContainer.firstChild
		);
		waitForIt({
			query: inEditModeQuery,
			onDisappear: () => {
				saveButtonContainer.remove();
			}
		});
	}
};

waitForIt({ query: saveButtonContainerSelector, onAppear: moveSaveContainer });
