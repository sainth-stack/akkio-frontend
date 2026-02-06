import React, { useState } from 'react';

const ChatInterface = ({ onSendMessage, messages, isLoading }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput("");
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
                <h2>App Builder Chat</h2>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="message ai">
                        Hi! I'm your App Architect. Describe the app you want to build, and I'll generate the plan and code for you.
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai">
                        Thinking...
                    </div>
                )}
            </div>

            <div className="chat-input-area">
                <form onSubmit={handleSubmit} className="chat-input-wrapper">
                    <textarea
                        className="chat-input"
                        placeholder="Describe your app..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                    />
                    <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
