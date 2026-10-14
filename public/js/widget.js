/**
 * GSXR-777 AI Chat Widget for WordPress
 */

(function() {
    'use strict';

    // Check if config is available
    if (typeof gsxr777Config === 'undefined') {
        console.error('GSXR-777 Chat Widget: Configuration not found');
        return;
    }

    const config = gsxr777Config;
    let sessionId = localStorage.getItem('gsxr777_session_id');
    
    if (!sessionId) {
        sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('gsxr777_session_id', sessionId);
    }

    // Chat history
    const HISTORY_KEY = 'gsxr777_history_' + sessionId;
    let chatMessages = [];
    
    // Rate limiting
    let lastMessageTime = 0;
    const MIN_MESSAGE_INTERVAL = 500;  // 500ms minimum between messages

    function saveHistory() {
        try {
            // Ограничить размер истории (максимум 50 сообщений)
            const maxMessages = 50;
            if (chatMessages.length > maxMessages) {
                chatMessages = chatMessages.slice(-maxMessages);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(chatMessages));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // localStorage переполнена, очистить и начать заново
                localStorage.removeItem(HISTORY_KEY);
                chatMessages = [];
                console.warn('Chat history cleared due to storage limit');
            } else {
                console.warn('Could not save chat history:', e);
            }
        }
    }

    function loadHistory() {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn('Could not load chat history:', e);
            localStorage.removeItem(HISTORY_KEY);  // Очистить повреждённые данные
            return [];
        }
    }

    // CSS Styles
    const styles = `
        .gsxr777-chat-widget {
            position: fixed;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .gsxr777-chat-widget.bottom-right { bottom: 20px; right: 20px; }
        .gsxr777-chat-widget.bottom-left { bottom: 20px; left: 20px; }
        .gsxr777-chat-widget.top-right { top: 20px; right: 20px; }
        .gsxr777-chat-widget.top-left { top: 20px; left: 20px; }

        .gsxr777-chat-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: none;
            background: ${config.primaryColor};
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
        }
        .gsxr777-chat-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .gsxr777-chat-toggle.has-selected::after {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            background: #4ade80;
            border: 2px solid white;
            border-radius: 50%;
            top: 0;
            right: 0;
            animation: gsxr777-pulse 2s infinite;
        }
        
        @keyframes gsxr777-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }

        .gsxr777-chat-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: ${config.width}px;
            height: ${config.height}px;
            max-height: 70vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        .gsxr777-chat-widget.bottom-left .gsxr777-chat-window { right: auto; left: 0; }
        .gsxr777-chat-widget.top-right .gsxr777-chat-window { bottom: auto; top: 70px; }
        .gsxr777-chat-widget.top-left .gsxr777-chat-window { bottom: auto; top: 70px; right: auto; left: 0; }

        .gsxr777-chat-header {
            padding: 16px 20px;
            background: ${config.primaryColor};
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        .gsxr777-chat-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .gsxr777-chat-context-indicator {
            display: none;
            font-size: 12px;
            opacity: 0.9;
            margin-top: 2px;
        }
        .gsxr777-chat-context-indicator.visible {
            display: block;
        }
        
        .gsxr777-chat-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .gsxr777-chat-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .gsxr777-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .gsxr777-chat-message {
            display: flex;
            max-width: 85%;
        }
        .gsxr777-chat-message.user { align-self: flex-end; }
        .gsxr777-chat-message.assistant { align-self: flex-start; }
        .gsxr777-chat-message-content {
            padding: 10px 14px;
            border-radius: 12px;
            line-height: 1.4;
            font-size: 14px;
            word-wrap: break-word;
        }
        .gsxr777-chat-message.user .gsxr777-chat-message-content {
            background: ${config.primaryColor};
            color: white;
            border-bottom-right-radius: 4px;
        }
        .gsxr777-chat-message.assistant .gsxr777-chat-message-content {
            background: #f0f0f0;
            color: #333;
            border-bottom-left-radius: 4px;
        }

        .gsxr777-chat-typing {
            display: flex;
            gap: 4px;
            padding: 10px 14px;
            background: #f0f0f0;
            border-radius: 12px;
            border-bottom-left-radius: 4px;
            align-self: flex-start;
        }
        .gsxr777-chat-typing span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #999;
            animation: gsxr777-typing 1.4s infinite;
        }
        .gsxr777-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .gsxr777-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes gsxr777-typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-8px); opacity: 1; }
        }

        .gsxr777-chat-input-container {
            padding: 12px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
            align-items: flex-end;
            flex-shrink: 0;
        }
        .gsxr777-chat-input {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
            resize: none;
            max-height: 100px;
            font-family: inherit;
            transition: border-color 0.2s;
        }
        .gsxr777-chat-input:focus {
            outline: none;
            border-color: ${config.primaryColor};
        }
        .gsxr777-chat-send {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            border: none;
            background: ${config.primaryColor};
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            flex-shrink: 0;
        }
        .gsxr777-chat-send:hover { transform: scale(1.05); }
        .gsxr777-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 480px) {
            .gsxr777-chat-widget {
                bottom: 10px !important;
                right: 10px !important;
                left: auto !important;
            }
            .gsxr777-chat-window {
                position: fixed !important;
                bottom: 70px !important;
                right: 10px !important;
                left: 10px !important;
                width: auto !important;
                height: 70vh;
                max-height: calc(100vh - 90px);
            }
        }
    `;

    // Create widget HTML
    function createWidget() {
        const widget = document.createElement('div');
        widget.className = `gsxr777-chat-widget ${config.position}`;
        widget.innerHTML = `
            <button class="gsxr777-chat-toggle" aria-label="${config.strings.close}" title="Open chat. Green dot indicates selected text on page.">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            <div class="gsxr777-chat-window">
                <div class="gsxr777-chat-header">
                    <div>
                        <h3>${config.title}</h3>
                        <div class="gsxr777-chat-context-indicator" title="Selected text from page will be included in your message">📍 Page context enabled</div>
                    </div>
                    <button class="gsxr777-chat-close" aria-label="${config.strings.close}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="gsxr777-chat-messages">
                    <div class="gsxr777-chat-message assistant">
                        <div class="gsxr777-chat-message-content">${config.welcome}</div>
                    </div>
                </div>
                <div class="gsxr777-chat-input-container">
                    <textarea class="gsxr777-chat-input" placeholder="${config.placeholder}" rows="1"></textarea>
                    <button class="gsxr777-chat-send" aria-label="${config.strings.send}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        return widget;
    }

    // Initialize widget
    function initWidget() {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Create widget
        const widget = createWidget();
        document.body.appendChild(widget);

        // Get elements
        const toggle = widget.querySelector('.gsxr777-chat-toggle');
        const closeBtn = widget.querySelector('.gsxr777-chat-close');
        const chatWindow = widget.querySelector('.gsxr777-chat-window');
        const messages = widget.querySelector('.gsxr777-chat-messages');
        const input = widget.querySelector('.gsxr777-chat-input');
        const sendBtn = widget.querySelector('.gsxr777-chat-send');

        // Track selected text on the page
        document.addEventListener('selectionchange', () => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText && selectedText.length > 0) {
                toggle.classList.add('has-selected');
            } else {
                toggle.classList.remove('has-selected');
            }
        });

        // Load chat history
        chatMessages = loadHistory();
        if (chatMessages.length > 0) {
            messages.innerHTML = '';
            chatMessages.forEach(msg => {
                renderMessage(msg.role, msg.content);
            });
        }

        // Event listeners
        toggle.addEventListener('click', () => {
            const isVisible = chatWindow.style.display === 'flex';
            chatWindow.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                input.focus();
                // Remove selected text indicator when opening chat
                toggle.classList.remove('has-selected');
            }
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
        });

        sendBtn.addEventListener('click', sendMessage);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        // Functions
        function renderMessage(role, content) {
            const messageEl = document.createElement('div');
            messageEl.className = `gsxr777-chat-message ${role}`;
            
            const contentEl = document.createElement('div');
            contentEl.className = 'gsxr777-chat-message-content';
            
            if (role === 'assistant') {
                contentEl.innerHTML = parseMarkdown(content);
            } else {
                contentEl.textContent = content;
            }
            
            messageEl.appendChild(contentEl);
            messages.appendChild(messageEl);
            messages.scrollTop = messages.scrollHeight;
        }

        function addMessage(role, content) {
            chatMessages.push({ role, content, timestamp: Date.now() });
            saveHistory();
            renderMessage(role, content);
        }

        function showTyping() {
            const typingEl = document.createElement('div');
            typingEl.className = 'gsxr777-chat-typing';
            typingEl.innerHTML = '<span></span><span></span><span></span>';
            messages.appendChild(typingEl);
            messages.scrollTop = messages.scrollHeight;
            return typingEl;
        }

        function getPageContext() {
            const selectedText = window.getSelection().toString().trim();
            const context = {
                url: window.location.href,
                title: document.title,
                content: document.body.innerText.substring(0, 2000),
                selectedText: selectedText
            };
            
            // Log selected text for debugging
            if (selectedText) {
                console.log('GSXR-777 Selected text captured:', selectedText.substring(0, 100));
            }
            
            return context;
        }

        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;
            
            // Check if Fetch API is available
            if (!window.fetch) {
                addMessage('assistant', 'Sorry, your browser is not supported. Please upgrade your browser.');
                return;
            }
            
            // Rate limiting on client (min 500ms between messages)
            const now = Date.now();
            if (now - lastMessageTime < MIN_MESSAGE_INTERVAL) {
                return;  // Too fast, ignore
            }
            lastMessageTime = now;

            // Disable input
            input.disabled = true;
            sendBtn.disabled = true;

            // Add user message
            addMessage('user', message);
            input.value = '';
            input.style.height = 'auto';

            // Show typing indicator
            const typingEl = showTyping();

            try {
                const response = await fetch(config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': config.nonce
                    },
                    body: JSON.stringify({
                        message: message,
                        session_id: sessionId,
                        context: getPageContext()
                    })
                });

                typingEl.remove();

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    addMessage('assistant', data.message);
                } else {
                    throw new Error(data.message || 'Unknown error');
                }

            } catch (error) {
                typingEl.remove();
                console.error('Chat error:', error);
                addMessage('assistant', config.strings.error);
            } finally {
                // Re-enable input
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }

        function parseMarkdown(text) {
            // First, escape HTML to prevent XSS
            let html = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            // Headings (H1-H6)
            html = html.replace(/^### (.*?)$/gm, '<h4 style="margin:8px 0 4px 0;font-size:14px;font-weight:600;">$1</h4>');
            html = html.replace(/^## (.*?)$/gm, '<h3 style="margin:8px 0 4px 0;font-size:15px;font-weight:600;">$1</h3>');
            html = html.replace(/^# (.*?)$/gm, '<h2 style="margin:8px 0 4px 0;font-size:16px;font-weight:600;">$1</h2>');

            // Code blocks with syntax highlighting awareness
            html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
                const escapedCode = code.trim();
                return '<pre style="background:#f4f4f4;padding:10px;border-radius:4px;overflow-x:auto;font-size:12px;line-height:1.4;margin:4px 0;">' + escapedCode + '</pre>';
            });
            
            // Inline code
            html = html.replace(/`([^`]+)`/g, '<code style="background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:12px;">$1</code>');
            
            // Bold and Italic (must be before individual bold/italic)
            html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            
            // Bold
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
            
            // Italic
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            html = html.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Links [text](url)
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:' + config.primaryColor + ';text-decoration:none;">$1</a>');
            
            // Unordered lists
            html = html.replace(/^\* (.+)$/gm, '<li style="margin-left:20px;">$1</li>');
            html = html.replace(/^\- (.+)$/gm, '<li style="margin-left:20px;">$1</li>');
            html = html.replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:20px;">$2</li>');
            html = html.replace(/(<li[^>]*>.*?<\/li>)/s, '<ul style="margin:4px 0;padding:0;">$1</ul>');
            
            // Blockquotes
            html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="margin:4px 0;padding-left:10px;border-left:3px solid ' + config.primaryColor + ';color:#666;">$1</blockquote>');
            
            // Horizontal rule
            html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr style="margin:8px 0;border:none;border-top:1px solid #ddd;">');
            
            // Line breaks (keep but convert to HTML br)
            html = html.replace(/\n\n/g, '</p><p>');
            html = html.replace(/\n/g, '<br>');
            
            // Wrap in paragraph if not already wrapped
            if (!html.startsWith('<')) {
                html = '<p style="margin:4px 0;">' + html + '</p>';
            }

            // Additional styling for better appearance
            html = '<div style="font-size:14px;line-height:1.6;color:#333;">' + html + '</div>';

            return html;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();