import React, { useState, useRef, useEffect } from 'react';

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const ChatInterface = ({ onSendMessage, messages, isLoading, isUpdateMode }) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        const newHeight = Math.min(ta.scrollHeight, 120);
        ta.style.height = newHeight + 'px';
        // Only show scrollbar when content exceeds max height
        ta.style.overflowY = ta.scrollHeight > 120 ? 'auto' : 'hidden';
    }, [input]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-section">
            <div className="chat-header">
                <h2>{isUpdateMode ? '✏️ Update App' : '🤖 App Builder'}</h2>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="message ai">
                        {isUpdateMode
                            ? "Your app is ready! Describe any changes or new features you'd like to add."
                            : "Hi! I'm your App Architect. Describe the app you want to build, and I'll generate the plan and code for you."
                        }
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            display: 'inline-block',
                            width: 14,
                            height: 14,
                            border: '2px solid #cbd5e1',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                            flexShrink: 0
                        }} />
                        {isUpdateMode ? 'Updating code...' : 'Thinking...'}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <form onSubmit={handleSubmit} className="chat-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="chat-input"
                        placeholder={isUpdateMode ? "Describe what you'd like to change or add..." : "Describe your app..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button type="submit" className="send-button" disabled={isLoading || !input.trim()} title="Send (Enter)">
                        <SendIcon />
                    </button>
                </form>
                {!isUpdateMode && (
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        Press Enter to send · Shift+Enter for new line
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
