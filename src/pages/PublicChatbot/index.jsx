import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { FiPaperclip, FiMic, FiSend } from "react-icons/fi";
import { BsRobot } from "react-icons/bs";
import "./index.css";
import { akkiourl } from "../../utils/const";

const cleanHtmlContent = (html) => {
  if (!html) return html;
  let cleaned = html;
  cleaned = cleaned.replace(/\\n/g, "");
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "");
  cleaned = cleaned.replace(/>\s+</g, "><");
  return cleaned.trim();
};

const renderBotContent = (content) => {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    const answer = parsed?.answer || parsed?.multi_model_answer || parsed?.multi_model_metadata?.answer;
    if (answer && typeof answer === "string") {
      return <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(answer) }} />;
    }
    if (parsed?.answer) {
      return <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(parsed.answer) }} />;
    }
    return <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(String(content)) }} />;
  } catch {
    return <div dangerouslySetInnerHTML={{ __html: cleanHtmlContent(content) }} />;
  }
};

export default function PublicChatbot() {
  const { publicId } = useParams();
  const [title, setTitle] = useState("Chatbot");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", content: '{"answer":"Hi! How can I help you today?"}' },
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    setLoadingConfig(true);
    setError("");
    axios
      .get(`${akkiourl}/public/chatbot/${publicId}/config`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.status === "success") {
          setTitle(res.data.model_name || "Chatbot");
        } else {
          setError("Chatbot not found.");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.detail || "Chatbot not found.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingConfig(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const shareFooter = useMemo(() => {
    return (
      <div className="public-footer">
        <span>Powered by <a href="#" target="_blank" rel="noopener noreferrer">Akkio</a></span>
      </div>
    );
  }, []);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && message.trim()) {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !publicId) return;

    const nextUserMsg = { type: "user", content: message, question: true, isLoading: true };
    setMessages((prev) => [...prev, nextUserMsg]);
    setIsLoading(true);
    const msgToSend = message;
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const response = await axios.post(`${akkiourl}/public/chatbot/${publicId}/query`, {
        query: msgToSend,
        messages,
      });
      const botResponse = {
        type: "bot",
        content: typeof response.data === "object" ? JSON.stringify(response.data) : response.data,
      };
      setMessages((prev) => {
        // remove loading flag on last user message
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.type === "user") {
          updated[lastIdx] = { ...updated[lastIdx], isLoading: false };
        }
        return [...updated, botResponse];
      });
    } catch (err) {
      const detail = err?.response?.data?.detail || "Failed to send message.";
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.type === "user") {
          updated[lastIdx] = { ...updated[lastIdx], isLoading: false };
        }
        return [
          ...updated,
          { type: "bot", content: JSON.stringify({ answer: `<p>${detail}</p>` }) },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="public-page">
        <div className="public-loading">
          <Spinner animation="border" role="status" variant="secondary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-page">
        <div className="public-error">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Chatbot unavailable</h2>
          <p style={{ color: '#6b7280' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-container">

        <div className="public-header">
          <h1>{title}</h1>
        </div>

        <div className="public-chat">
          <div className="public-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`public-message-row ${msg.type === "user" ? "user" : "bot"}`}>

                {msg.type === "bot" && (
                  <div className="public-avatar">
                    <BsRobot size={20} />
                  </div>
                )}

                <div className={`public-bubble ${msg.type === "user" ? "user" : "bot"}`}>
                  {msg.type === "user" ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  ) : (
                    renderBotContent(msg.content)
                  )}
                </div>

                {msg.isLoading && (
                  <div className="public-inline-spinner">
                    <Spinner animation="border" size="sm" variant="secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="public-input-wrapper">
            <form onSubmit={handleSubmit} className="public-input-container">
              <div className="public-input-actions-left">
                <button type="button" className="public-icon-btn">
                  <FiMic size={20} />
                </button>
                <button type="button" className="public-icon-btn">
                  <FiPaperclip size={20} />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="public-input-field"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                disabled={isLoading}
              />

              <button
                type="submit"
                className={`public-send-btn ${message.trim() && !isLoading ? 'active' : ''}`}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? <Spinner animation="border" size="sm" variant="light" /> : <FiSend size={18} />}
              </button>
            </form>
          </div>

          {shareFooter}
        </div>
      </div>
    </div>
  );
}




