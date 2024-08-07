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

/* -------------------------------------------------------------------------- */
/*                                 DOM helpers                                */
/* -------------------------------------------------------------------------- */
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

const getVisibleSibling = ({ element, reverse = false }) => {
	let next = element.nextElementSibling;
	while (next && next.offsetHeight === 0) {
		next = reverse ? next.previousElementSibling : next.nextElementSibling;
	}
	return next;
};

const getVisibleChild = ({ parent, reverse = false }) => {
	let next = reverse ? parent.lastChild : parent.firstChild;
	while (next && next.offsetHeight === 0) {
		next = reverse ? next.previousElementSibling : next.nextElementSibling;
	}
	return next;
};

const getChildWithProperty = ({ parent, property, reverse = false }) => {
	// Create a temporary element to get the default value of the property
	const tempElement = document.createElement('div');
	document.body.appendChild(tempElement);
	const defaultValue = window.getComputedStyle(tempElement)[property];
	document.body.removeChild(tempElement);

	const children = Array.from(parent.children);
	const length = children.length;
	for (let i = 0; i < length; i++) {
		const index = reverse ? length - 1 - i : i;
		const child = children[index];
		const propertyValue = window.getComputedStyle(child)[property];
		if (propertyValue !== defaultValue) {
			return child;
		}
		const foundChild = getChildWithProperty({
			parent: child,
			property,
			reverse
		});
		if (foundChild) {
			return foundChild;
		}
	}
	return null;
};

const getElementWithTransitionProperty = ({ element, property }) => {
	if (!element) {
		return null;
	}
	const computedStyle = window.getComputedStyle(element);
	if (computedStyle.transitionProperty.includes(property)) {
		return element;
	}
	return getElementWithTransitionProperty({
		element: element.parentElement,
		property
	});
};

/* -------------------------------------------------------------------------- */
/*                               Main functions                               */
/* -------------------------------------------------------------------------- */

const moveSaveContainer = saveButtonContainer => {
	const ticketViewContainer = document.querySelector(mainTicketViewSelector);
	const lastChild = getVisibleChild({
		parent: ticketViewContainer,
		reverse: true
	}); // getLastChildWithHeight(ticketViewContainer);
	const bottomContainer = getChildWithProperty({
		parent: lastChild,
		property: 'zIndex'
	});
	if (bottomContainer && saveButtonContainer) {
		const childWithBorder = getChildWithProperty({
			parent: bottomContainer,
			property: 'borderWidth'
		});
		saveButtonContainer.style.border = getComputedStyle(childWithBorder).border;
		saveButtonContainer.style.marginBlockStart = '1em';
		saveButtonContainer.style.paddingInlineStart = '1em';

		// Get rid of the box shadow on the first child, restore it after
		const firstChild = bottomContainer.firstChild;
		const boxShadow = getComputedStyle(firstChild).boxShadow;
		firstChild.style.boxShadow = 'none';
		bottomContainer.insertBefore(saveButtonContainer, firstChild);
		waitForIt({
			query: inEditModeQuery,
			onDisappear: () => {
				saveButtonContainer.remove();
				firstChild.style.boxShadow = boxShadow;
			}
		});
	}
};

// TODO: Add a button to collapse the right side panel
const addCollapseToRightSide = () => {
	// collapse button from the left side
	const collapseButton = getVisibleSibling({
		element: document.querySelector('[role="slider"]')
	});

	// vertical re-sizers // right side is not a button...
	const reSizer = document.querySelector(
		'[aria-orientation="vertical"][role="separator"]:not(button'
	);
	// right side panel
	const rightSide = getVisibleSibling({ element: reSizer.nextElementSibling });

	// Animation is on this element
	const leftSide = document.querySelector(
		'[data-testid="ContextualNavigation"]'
	);

	// Duplicate the collapse button and add it to the right side
	reSizer.prepend(collapseButton.cloneNode(true));
};

waitForIt({ query: saveButtonContainerSelector, onAppear: moveSaveContainer });
