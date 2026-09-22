(function () {
    'use strict';

    const STORAGE_KEY = 'h-hotel-ai-chat-v3';
    const DEFAULT_CONFIG = { endpoint: '/api/chat', requestTimeout: 65000, sendHistory: true };

    class HotelChatWidget {
        constructor(config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...window.HOTEL_CHAT_CONFIG, ...config };
            this.isReplying = false;
            this.history = this.loadHistory();
            this.render();
            this.bindEvents();
            this.restoreHistory();
            this.setStatus('온라인', 'online');
        }

        render() {
            document.body.insertAdjacentHTML('beforeend', `
                <button type="button" id="h-chat-btn" aria-label="AI 컨시어지 열기" aria-expanded="false">
                    <span class="h-chat-btn-pulse" aria-hidden="true"></span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H5.2L4 17.2V4h16v12Z"/></svg>
                    <span class="h-chat-btn-label">AI 문의</span>
                </button>
                <section id="h-chat-window" role="dialog" aria-label="H Hotel AI 컨시어지" aria-hidden="true">
                    <header id="h-chat-header">
                        <div class="h-chat-agent">
                            <span class="h-chat-avatar">H</span>
                            <div><strong>AI 컨시어지</strong><span><i id="h-chat-status-dot"></i><b id="h-chat-status">준비 중</b></span></div>
                        </div>
                        <button type="button" id="h-chat-close" aria-label="채팅 닫기">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18.3 5.7-6.3 6.3-6.3-6.3-1.4 1.4 6.3 6.3-6.3 6.3 1.4 1.4 6.3-6.3 6.3 6.3 1.4-1.4-6.3-6.3 6.3-6.3-1.4-1.4Z"/></svg>
                        </button>
                    </header>
                    <div id="h-chat-messages" aria-live="polite"></div>
                    <div id="h-chat-quick" aria-label="빠른 질문"></div>
                    <form id="h-chat-form">
                        <label class="h-visually-hidden" for="h-chat-input">질문 입력</label>
                        <input type="text" id="h-chat-input" maxlength="500" placeholder="호텔 정보를 물어보세요" autocomplete="off">
                        <button type="submit" id="h-chat-send" aria-label="메시지 보내기">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.4 20.4 17.5-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.3 1.2L4 11l8 .9-8 .9-1.9 6.4a1 1 0 0 0 1.3 1.2Z"/></svg>
                        </button>
                    </form>
                    <p class="h-chat-notice">AI 답변은 부정확할 수 있으니 중요한 정보는 호텔에 확인해 주세요.</p>
                </section>
            `);

            this.elements = {
                button: document.getElementById('h-chat-btn'),
                window: document.getElementById('h-chat-window'),
                close: document.getElementById('h-chat-close'),
                messages: document.getElementById('h-chat-messages'),
                quick: document.getElementById('h-chat-quick'),
                form: document.getElementById('h-chat-form'),
                input: document.getElementById('h-chat-input'),
                send: document.getElementById('h-chat-send'),
                status: document.getElementById('h-chat-status'),
                statusDot: document.getElementById('h-chat-status-dot')
            };
        }

        bindEvents() {
            this.elements.button.addEventListener('click', () => this.open());
            this.elements.close.addEventListener('click', () => this.close());
            this.elements.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.sendMessage(this.elements.input.value);
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.elements.window.classList.contains('is-open')) this.close();
            });
        }

        open() {
            this.elements.window.classList.add('is-open');
            this.elements.window.setAttribute('aria-hidden', 'false');
            this.elements.button.setAttribute('aria-expanded', 'true');
            window.setTimeout(() => this.elements.input.focus(), 180);
        }

        close() {
            this.elements.window.classList.remove('is-open');
            this.elements.window.setAttribute('aria-hidden', 'true');
            this.elements.button.setAttribute('aria-expanded', 'false');
            this.elements.button.focus();
        }

        async sendMessage(rawText) {
            const text = rawText.trim();
            if (!text || this.isReplying) return;

            this.appendMessage(text, 'user');
            this.elements.input.value = '';
            this.setTyping(true);
            this.setStatus('답변 준비 중', 'connecting');

            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), this.config.requestTimeout);
            try {
                const messages = this.config.sendHistory
                    ? this.history.slice(-10).map((item) => ({
                        role: item.type === 'user' ? 'user' : 'assistant',
                        content: item.text
                    }))
                    : [{ role: 'user', content: text }];
                const response = await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages }),
                    signal: controller.signal
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || '서버 오류가 발생했습니다.');
                this.appendMessage(data.message, 'bot');
                this.setStatus('온라인', 'online');
            } catch (error) {
                const message = error.name === 'AbortError'
                    ? 'AI 답변 시간이 초과됐습니다. 다시 시도해 주세요.'
                    : error.message;
                this.appendSystem(message);
                this.setStatus('오프라인', 'error');
            } finally {
                window.clearTimeout(timer);
                this.setTyping(false);
                this.elements.input.focus();
            }
        }

        restoreHistory() {
            if (this.history.length) {
                this.history.forEach((message) => this.createMessageRow(message.text, message.type));
            } else {
                this.appendMessage('안녕하세요. H Hotel AI 컨시어지입니다. 호텔 이용에 궁금한 내용을 물어보세요.', 'bot');
            }
            this.renderQuickReplies(['체크인 시간은?', '조식 안내해줘', '주차 가능해?', '부대시설 알려줘']);
        }

        appendMessage(text, type) {
            if (!text) return;
            this.createMessageRow(text, type);
            this.saveMessage(text, type);
        }

        createMessageRow(text, type) {
            const row = document.createElement('div');
            row.className = `h-chat-row h-chat-row-${type}`;
            if (type === 'bot') {
                const avatar = document.createElement('span');
                avatar.className = 'h-message-avatar';
                avatar.textContent = 'H';
                row.appendChild(avatar);
            }
            const bubble = document.createElement('div');
            bubble.className = `h-chat-bubble h-chat-bubble-${type}`;
            bubble.textContent = text;
            row.appendChild(bubble);
            this.elements.messages.appendChild(row);
            this.scrollToBottom();
        }

        appendSystem(text) {
            const message = document.createElement('p');
            message.className = 'h-chat-system';
            message.textContent = text;
            this.elements.messages.appendChild(message);
            this.scrollToBottom();
        }

        saveMessage(text, type) {
            this.history.push({ text, type });
            this.history = this.history.slice(-30);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history)); } catch (_) {}
        }

        setTyping(active) {
            this.isReplying = active;
            this.elements.send.disabled = active;
            this.elements.input.disabled = active;
            document.getElementById('h-chat-typing')?.remove();
            if (!active) return;
            const indicator = document.createElement('div');
            indicator.id = 'h-chat-typing';
            indicator.className = 'h-chat-row h-chat-row-bot';
            indicator.innerHTML = '<span class="h-message-avatar">H</span><div class="h-chat-bubble h-chat-typing"><i></i><i></i><i></i></div>';
            this.elements.messages.appendChild(indicator);
            this.scrollToBottom();
        }

        setStatus(text, state) {
            this.elements.status.textContent = text;
            this.elements.statusDot.className = state;
            this.elements.button.classList.toggle('is-offline', state === 'error');
        }

        renderQuickReplies(items) {
            items.forEach((label) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.addEventListener('click', () => this.sendMessage(label));
                this.elements.quick.appendChild(button);
            });
        }

        scrollToBottom() {
            window.requestAnimationFrame(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            });
        }

        loadHistory() {
            try {
                const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
                return Array.isArray(value) ? value : [];
            } catch (_) {
                return [];
            }
        }
    }

    window.HotelChatWidget = HotelChatWidget;
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('h-chat-btn')) new HotelChatWidget();
    });
})();
