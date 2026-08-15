import { createElement } from '../../../utils/dom';
import type { AIEngine } from '../../../ai/engine';
import { createLogger } from '../../../utils/logger';

const log = createLogger('AiAssistantPanel');

export class AiAssistantPanel {
  private panel: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private chatHistory: HTMLElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private visible = false;
  private aiEngine!: AIEngine;
  private isProcessing = false;

  init(parentId: string, aiEngine: AIEngine): void {
    this.aiEngine = aiEngine;
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.panel = createElement('div', {
      id: 'ai-assistant-panel',
      class: 'tn-panel',
      style: 'width: 380px; display: none; flex-direction: column; max-height: 80vh;'
    });

    // Header
    const header = createElement(
      'div',
      { class: 'tn-panel__header' },
      createElement('h2', { class: 'tn-panel__title' }, 'AI Earth Assistant (v0.6)'),
    );

    const closeBtn = createElement('button', {
      class: 'tn-panel__close',
      'aria-label': 'Close AI Assistant',
      type: 'button',
    }, '×');
    closeBtn.addEventListener('click', () => this.toggle());
    header.appendChild(closeBtn);

    // Chat History
    this.chatHistory = createElement('div', {
      class: 'tn-panel__content',
      style: 'flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 12px;'
    });
    
    // Initial welcome message
    this.appendMessage('system', 'Welcome to Atlas One AI. You can ask me to find earthquakes, show flights, or fly to any location.');

    // Input Area
    const inputContainer = createElement('div', {
      style: 'display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.2);'
    });

    this.input = createElement('input', {
      type: 'text',
      class: 'tn-search-panel__input',
      placeholder: 'Ask Atlas One...',
      style: 'flex: 1; margin: 0;'
    });

    this.submitBtn = createElement('button', {
      class: 'tn-button tn-button--primary',
      style: 'padding: 8px 16px;'
    }, 'Send');

    this.submitBtn.addEventListener('click', () => { void this.handleSubmit(); });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void this.handleSubmit();
    });

    inputContainer.appendChild(this.input);
    inputContainer.appendChild(this.submitBtn);

    this.panel.appendChild(header);
    this.panel.appendChild(this.chatHistory);
    this.panel.appendChild(inputContainer);
    parent.appendChild(this.panel);
  }

  private appendMessage(role: 'user' | 'system', text: string, isTemporary = false) {
    if (!this.chatHistory) return;

    const msgDiv = createElement('div', {
      style: `
        padding: 10px 14px; 
        border-radius: 8px; 
        max-width: 85%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
        ${role === 'user' 
          ? 'align-self: flex-end; background: var(--primary-color, #3b82f6); color: white;' 
          : 'align-self: flex-start; background: rgba(255,255,255,0.1); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.05);'
        }
      `
    });

    if (isTemporary) msgDiv.id = 'temp-processing-msg';
    msgDiv.textContent = text;
    this.chatHistory.appendChild(msgDiv);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  private removeTemporaryMessage() {
    if (!this.chatHistory) return;
    const temp = this.chatHistory.querySelector('#temp-processing-msg');
    if (temp) temp.remove();
  }

  private async handleSubmit() {
    if (this.isProcessing || !this.input || !this.input.value.trim()) return;

    const query = this.input.value.trim();
    this.input.value = '';
    
    this.appendMessage('user', query);
    this.appendMessage('system', 'Thinking...', true);
    
    this.isProcessing = true;
    if (this.submitBtn) this.submitBtn.disabled = true;

    try {
      const response = await this.aiEngine.processRequest(query, (progress) => {
        const temp = this.chatHistory?.querySelector('#temp-processing-msg');
        if (temp) temp.textContent = progress;
      });
      
      this.removeTemporaryMessage();
      this.appendMessage('system', response);
    } catch (e) {
      log.error('AI Processing error', e);
      this.removeTemporaryMessage();
      this.appendMessage('system', 'Sorry, I encountered an error while processing that request.');
    } finally {
      this.isProcessing = false;
      if (this.submitBtn) this.submitBtn.disabled = false;
      if (this.input) this.input.focus();
    }
  }

  toggle(): void {
    if (!this.panel) return;
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? 'flex' : 'none';
    if (this.visible && this.input) {
      setTimeout(() => this.input?.focus(), 50);
    }
  }

  show(): void {
    if (!this.visible) this.toggle();
  }

  isVisible(): boolean {
    return this.visible;
  }
}
