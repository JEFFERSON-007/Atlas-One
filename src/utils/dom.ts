/**
 * DOM manipulation utilities.
 * Provides type-safe helpers for common DOM operations.
 */

/**
 * Queries a single element from the DOM with type safety.
 * Throws if the element is not found.
 *
 * @param selector - CSS selector string
 * @param parent - Optional parent element (defaults to document)
 * @returns The matched element
 */
export function querySelector<T extends HTMLElement>(
  selector: string,
  parent: ParentNode = document,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`[DOM] Element not found: ${selector}`);
  }
  return element;
}

/**
 * Safely queries an element, returning null if not found.
 *
 * @param selector - CSS selector string
 * @param parent - Optional parent element
 * @returns The matched element or null
 */
export function querySelectorSafe<T extends HTMLElement>(
  selector: string,
  parent: ParentNode = document,
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Creates an HTML element with optional attributes and children.
 *
 * @param tag - HTML tag name
 * @param attrs - Attribute key-value pairs
 * @param children - Child elements or text content
 * @returns The created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Sets the inner HTML of an element after sanitizing the content.
 * Only allows a safe subset of HTML.
 *
 * @param element - Target element
 * @param html - HTML string (will be text-escaped for safety)
 */
export function setTextContent(element: HTMLElement, text: string): void {
  element.textContent = text;
}

/**
 * Toggles a CSS class on an element.
 *
 * @param element - Target element
 * @param className - CSS class name
 * @param force - Optional force add/remove
 */
export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean,
): void {
  element.classList.toggle(className, force);
}

/**
 * Sets CSS custom properties on an element.
 *
 * @param element - Target element
 * @param properties - Map of CSS variable names to values
 */
export function setCssVars(
  element: HTMLElement,
  properties: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(properties)) {
    element.style.setProperty(key, value);
  }
}
