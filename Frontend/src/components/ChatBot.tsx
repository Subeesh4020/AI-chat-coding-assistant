import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBot.module.css';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI typing response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `You said: "${userMessage.text}". This is a simulated GPT response.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <header className={styles.chatHeader}>
        <div className={styles.avatar}>AI</div>
        <div>
          <h2 className={styles.chatTitle}>ChatGPT Mirror</h2>
          <p className={styles.chatStatus}>Online</p>
        </div>
      </header>

      {/* Message List */}
      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${
              msg.sender === 'user' ? styles.userRow : styles.botRow
            }`}
          >
            {msg.sender === 'bot' && <div className={styles.msgAvatar}>AI</div>}
            <div className={styles.messageBubble}>
              <p className={styles.messageText}>{msg.text}</p>
              <span className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Message ChatGPT..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={styles.chatInput}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={styles.sendButton}
          >
            ▲
          </button>
        </div>
      </form>
    </div>
  );
};
