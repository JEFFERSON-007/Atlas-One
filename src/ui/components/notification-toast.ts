/**
 * NotificationToast — Non-intrusive toast notifications.
 * Supports info, warning, and error messages with auto-dismiss.
 */

import { eventBus } from '../../hooks/use-event-bus';
import { createElement } from '../../utils/dom';
import { createLogger } from '../../utils/logger';

const log = createLogger('NotificationToast');

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 5000;

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warn' | 'error';
  element: HTMLElement;
  timer: ReturnType<typeof setTimeout>;
}

const activeToasts: Toast[] = [];
let container: HTMLElement | null = null;
let toastCounter = 0;

/**
 * Initializes the notification toast system.
 */
export function initNotificationToast(): void {
  container = createElement('div', {
    id: 'toast-container',
    class: 'tn-toast-container',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  document.body.appendChild(container);

  eventBus.on('notification:show', ({ message, type }) => {
    showToast(message, type);
  });

  log.info('Notification toast initialized');
}

/**
 * Shows a toast notification.
 *
 * @param message - Notification message
 * @param type - Notification type (info, warn, error)
 */
function showToast(
  message: string,
  type: 'info' | 'warn' | 'error' = 'info',
): void {
  if (!container) return;

  // Deduplicate active toasts with exact same message and type
  const existing = activeToasts.find((t) => t.message === message && t.type === type);
  if (existing) {
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => {
      dismissToast(existing);
    }, AUTO_DISMISS_MS);
    return;
  }

  // Remove oldest if at max
  while (activeToasts.length >= MAX_VISIBLE) {
    const oldest = activeToasts.shift();
    if (oldest) dismissToast(oldest);
  }

  const id = `toast-${++toastCounter}`;

  const icons: Record<string, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };

  const el = createElement(
    'div',
    {
      class: `tn-toast tn-toast--${type}`,
      role: 'alert',
      id,
    },
    createElement('span', { class: 'tn-toast__icon', 'aria-hidden': 'true' }, icons[type] ?? 'ℹ️'),
    createElement('span', { class: 'tn-toast__message' }, message),
  );

  // Close button
  const closeBtn = createElement('button', {
    class: 'tn-toast__close',
    'aria-label': 'Dismiss notification',
    type: 'button',
  }, '×');
  closeBtn.addEventListener('click', () => {
    const toast = activeToasts.find((t) => t.id === id);
    if (toast) dismissToast(toast);
  });
  el.appendChild(closeBtn);

  container.appendChild(el);

  // Trigger enter animation
  requestAnimationFrame(() => {
    el.classList.add('tn-toast--visible');
  });

  const timer = setTimeout(() => {
    const toast = activeToasts.find((t) => t.id === id);
    if (toast) dismissToast(toast);
  }, AUTO_DISMISS_MS);

  activeToasts.push({ id, message, type, element: el, timer });
}

function dismissToast(toast: Toast): void {
  clearTimeout(toast.timer);
  toast.element.classList.remove('tn-toast--visible');
  toast.element.classList.add('tn-toast--exit');

  setTimeout(() => {
    toast.element.remove();
    const idx = activeToasts.indexOf(toast);
    if (idx >= 0) activeToasts.splice(idx, 1);
  }, 300);
}
