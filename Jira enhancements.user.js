// ==UserScript==
// @name         Jira enhancements
// @namespace    http://tampermonkey.net/
// @version      2024-08-07
// @description  Jira enhancements
// @author       Zander Maxwell (zandermax)
// @match        https://*.atlassian.net/browse/*
// @match        https://*.atlassian.net/jira/software/c/projects/*/boards/*?selectedIssue=*
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

const findChild = ({ parent, condition, reverse = false }) => {
	if (!parent?.children) return null;
	const children = Array.from(parent.children);
	const length = children.length;

	for (let i = 0; i < length; i++) {
		const index = reverse ? length - 1 - i : i;
		const child = children[index];
		console.log('processing child', child);

		if (condition(child)) {
			return child;
		}

		const foundChild = findChild({ parent: child, condition, reverse });
		if (foundChild) {
			return foundChild;
		}
	}
	return null;
};

const getVisibleSibling = ({ element, reverse = false }) => {
	let next = element.nextElementSibling;
	while (next && next.offsetHeight === 0) {
		next = reverse ? next.previousElementSibling : next.nextElementSibling;
	}
	return next;
};

const getVisibleChild = ({ parent, reverse = false }) => {
	return findChild({
		parent,
		condition: (child) => child.offsetHeight !== 0,
		reverse,
	});
};

const getChildWithProperty = ({
	parent,
	property,
	reverse = false,
	value = null,
}) => {
	// Create a temporary element to get the default value of the property
	const tempElement = document.createElement('div');
	document.body.appendChild(tempElement);
	const defaultValue = window.getComputedStyle(tempElement)[property];
	document.body.removeChild(tempElement);

	return findChild({
		parent,
		condition: (child) => {
			const computedStyle = window.getComputedStyle(child);
			return value !== null
				? computedStyle[property] === value
				: computedStyle[property] !== defaultValue;
		},
		reverse,
	});
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
		property,
	});
};

// Whatever Atlassian is using to style things, it sets a generated attribute on elements to then use for styling...
const hasInlineStyleValue = ({ element, value }) => {
	const inlineStyle = element.getAttribute('style');

	if (inlineStyle) {
		const properties = inlineStyle.split(';');
		return properties.some((property) => {
			const [, val] = property.split(':').map((item) => item.trim());
			return val === value;
		});
	}
};

/* -------------------------------------------------------------------------- */
/*                               Main functions                               */
/* -------------------------------------------------------------------------- */

const moveSaveContainer = (saveButtonContainer) => {
	const ticketViewContainer = document.querySelector(mainTicketViewSelector);
	const bottomContainer = findChild({
		parent: ticketViewContainer,
		condition: (child) =>
			hasInlineStyleValue({ element: child, value: 'sticky' }),
		reverse: true,
	});

	if (!bottomContainer || !saveButtonContainer) return null;
	const childWithBorder = getChildWithProperty({
		parent: bottomContainer,
		property: 'borderWidth',
	});
	saveButtonContainer.style.border = getComputedStyle(childWithBorder).border;
	saveButtonContainer.style.borderRadius =
		getComputedStyle(childWithBorder).borderRadius;
	saveButtonContainer.style.marginBlockStart = '1em';
	saveButtonContainer.style.paddingInlineStart = '1em';

	// Get rid of the box shadow on the first child, restore it after
	const boxShadowedElement = getChildWithProperty({
		parent: bottomContainer,
		property: 'boxShadow',
	});
	const boxShadow = getComputedStyle(boxShadowedElement).boxShadow;
	boxShadowedElement.style.boxShadow = 'none';
	bottomContainer.insertBefore(saveButtonContainer, bottomContainer.firstChild);
	waitForIt({
		query: inEditModeQuery,
		onDisappear: () => {
			saveButtonContainer.remove();
			boxShadowedElement.style.boxShadow = boxShadow;
		},
	});
};

// TODO: Add a button to collapse the right side panel
const addCollapseToRightSide = (reSizerElement) => {
	// right side panel
	const rightSide = getVisibleSibling({ element: reSizerElement });

	// Fix unnecessary padding on the right side
	rightSide.style.padding = '0';

	// Animation is on this element
	const leftSide = document.querySelector(
		'[data-testid="ContextualNavigation"]'
	);

	// Duplicate the collapse button and add it to the right side
	// collapse button from the left side
	// const collapseButton = getVisibleSibling({
	// 	element: document.querySelector('[role="slider"]')
	// });
	// reSizer.prepend(collapseButton.cloneNode(true));
};

// vertical re-sizers // right side is not a button...
const reSizerQuery =
	'[aria-orientation="vertical"][role="separator"]:not(button)';

waitForIt({ query: saveButtonContainerSelector, onAppear: moveSaveContainer });

waitForIt({ query: reSizerQuery, onAppear: addCollapseToRightSide });
