// ==UserScript==
// @name         Jira enhancements - tickets
// @namespace    http://tampermonkey.net/
// @version      2024-08-07
// @description  Make interacting with Jira tickets easier
// @author       Zander Maxwell (zandermax)
// @match        https://*.atlassian.net/browse/*
// @match        https://*.atlassian.net/jira/software/c/projects/*/boards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

const selectors = {
	// Editor
	editorContainer: '[role="textbox"]',
	// Main container for the ticket view: the editable  ticket content on the ticke page, or the modal on the board page
	mainTicketView: '[data-component-selector*="issue-details"]',
	// Container for the save button, which we are attempting to move
	saveButtonContainer: '[data-testid="ak-editor-secondary-toolbar"]',
};

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

const scrollToBottom = (element) => {
	element.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

const findChild = ({ parent, condition, reverse = false }) => {
	if (!parent?.children) return null;
	const children = Array.from(parent.children);
	const length = children.length;

	for (let i = 0; i < length; i++) {
		const index = reverse ? length - 1 - i : i;
		const child = children[index];

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

const getSaveListener = (callback) => (event) => {
	if (event.ctrlKey && event.key.toLowerCase() === 's') {
		callback();
	}
};

const moveSaveContainer = (saveButtonContainer) => {
	const ticketViewContainer = document.querySelector(selectors.mainTicketView);
	const bottomContainer = findChild({
		parent: ticketViewContainer,
		condition: (child) =>
			hasInlineStyleValue({ element: child, value: 'sticky' }),
		reverse: true,
	});

	if (!bottomContainer || !saveButtonContainer) return null;

	// Make the whole area scrollable
	const toolbar = document.querySelector('[role="toolbar"]').parentElement;
	// Fix toolbar moving down
	toolbar.style.top = '0';

	let editor = toolbar;

	// Go up the tree until we find the element with border, this is the
	while (window.getComputedStyle(editor).borderWidth === '0px') {
		editor = editor.parentElement;
	}

	// Adjust save toolbar styles
	saveButtonContainer.style.backgroundColor =
		window.getComputedStyle(editor).backgroundColor;
	saveButtonContainer.style.padding = '0';
	saveButtonContainer.style.bottom = '0';
	saveButtonContainer.style.position = 'sticky';
	saveButtonContainer.style.borderTop = window.getComputedStyle(editor).border;
	saveButtonContainer.style.borderRadius =
		window.getComputedStyle(editor).borderRadius;

	// Make buttons span the whole width
	saveButtonContainer.firstElementChild.style.width = '100%';

	// Add save toolbar to the bottom of the editor's textbox
	const textBox = editor.querySelector('[role="textbox"]').parentElement;
	textBox.parentElement.appendChild(saveButtonContainer);

	// Set editor height
	editor.style.height = `${
		bottomContainer.getBoundingClientRect().top -
		editor.getBoundingClientRect().top
	}px`;
	editor.style.overflow = 'auto';

	// Ctrl + S to save
	const saveEditorContent = getSaveListener(() => {
		saveButtonContainer.querySelector('button').click();
	});
	editor.addEventListener('keydown', saveEditorContent);
	document.addEventListener('keydown', saveEditorContent);

	// TODO - scroll to the cursor in the contenteditable element

	waitForIt({
		query: inEditModeQuery,
		onDisappear: () => {
			editor.removeEventListener('keydown', saveEditorContent);
			document.removeEventListener('keydown', saveEditorContent);
			saveButtonContainer.remove();
		},
	});
};

// TODO: Add a button to collapse the right side panel
// const addCollapseToRightSide = (reSizerElement) => {
// 	// right side panel
// 	const rightSide = getVisibleSibling({ element: reSizerElement });

// 	// Fix unnecessary padding on the right side
// 	rightSide.style.padding = '0';

// 	// Animation is on this element
// 	const leftSide = document.querySelector(
// 		'[data-testid="ContextualNavigation"]'
// 	);

// 	// Duplicate the collapse button and add it to the right side
// 	// collapse button from the left side
// 	// const collapseButton = getVisibleSibling({
// 	// 	element: document.querySelector('[role="slider"]')
// 	// });
// 	// reSizer.prepend(collapseButton.cloneNode(true));
// };

// vertical re-sizers // right side is not a button...
const reSizerQuery =
	'[aria-orientation="vertical"][role="separator"]:not(button)';

const scrollToCursorInContentEditable = (container) => {
	const selection = window.getSelection();
	if (selection.rangeCount > 0) {
		const range = selection.getRangeAt(0);
		const cursorPosition = range.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		// Check if the cursor is outside the visible area of the container
		if (
			cursorPosition.bottom > containerRect.bottom ||
			cursorPosition.top < containerRect.top
		) {
			container.scrollTop += cursorPosition.top - containerRect.top;
		}
	}
};

waitForIt({
	query: selectors.saveButtonContainer,
	onAppear: moveSaveContainer,
});

// waitForIt({ query: reSizerQuery, onAppear: addCollapseToRightSide });

// TODO: change cursor on hover
// TODO see if can listen for Esc key to cancel editing
