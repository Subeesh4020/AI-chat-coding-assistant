import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Choose your preferred code theme

import { publicApi } from '../utils/axios-instance';
import { useApp } from '../contexts/AppContext';
import { CodeBlockWithCopy } from './CodeBlockWithCopy';
import { Spinner } from './Spinner';
import styles from './GptChat.module.css';

interface Message {
  id: string;
  sender: 'user' | 'AI coding assistant';
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  sessionMsg: Message[];
}

export const GptChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), sender: 'AI coding assistant', text: 'Hello! I am your AI coding assistant. How can I help you build today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEnable, setIsEnable] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const curSessionIdRef = useRef<string>('');
  const messageSessionIdRef = useRef<string>('');
  const isNewSessionRef = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Define line metrics matching our CSS styling
  const MAX_HEIGHT = 200;

  const { anonId } = useApp();


  const handleAiResEvent = (event: CustomEvent<{ result: string, msgSession: string }>) => {
    const aiRes: Message = {
      id: crypto.randomUUID(),
      sender: 'AI coding assistant',
      text: event.detail.result
    };
    console.log('curSessionIdRef.current - ', curSessionIdRef.current);
    console.log('event.detail.msgSession - ', event.detail.msgSession);
    // Mimic incoming streaming latency
    setTimeout(() => {
      if (curSessionIdRef.current === event.detail.msgSession) {
        setMessages((prev) => [
          ...prev,
          aiRes,
        ]);
      }
    }, 1200);

    setSessions((prev) => 
      prev.map((s) => s.id === messageSessionIdRef.current ? { ...s, sessionMsg: [...s.sessionMsg, aiRes] } : s)
    );
    setIsEnable(false);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height so it can shrink when deleting text
    textarea.style.height = "auto";

    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * 6; // 6 lines
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    // Enable scrolling after reaching max height
    textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [input]); // Re-run calculations every single time the text input strings modify

  // Keeps the chat focus pinned to the newest entries
  useEffect(() => {

    // For message sessions
    // msgIdRef.current = crypto.randomUUID();
      
    window.addEventListener('gptChatRes', handleAiResEvent as EventListener);

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    return () => {
      window.removeEventListener('gptChatRes', handleAiResEvent as EventListener);
    };

  }, [messages, isTyping]);

  const handleNewChat = () => {
    setIsEnable(false);
    isNewSessionRef.current = true;
    setMessages([
      { id: crypto.randomUUID(), sender: 'AI coding assistant', text: 'Hello! I am your AI assistant. How can I help you build today?' }
    ]);
  };
  
  const handleClickOnOldMsgs = (id: string) => {
    const activeSession = sessions.find((s) => s.id === id);
    if (activeSession) {
      setMessages(
        activeSession.sessionMsg,
      );
      curSessionIdRef.current = id;
    }
  };
  
  const handleSubmit = async(e: React.SubmitEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsEnable(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: input,
    };

    if (isNewSessionRef.current) {
      curSessionIdRef.current = crypto.randomUUID();
      setSessions((prev) => [...prev, {
        id: curSessionIdRef.current,
        title: input.slice(0, 30) + ' ...',
        sessionMsg: [userMsg]
      }]);
      isNewSessionRef.current = false;
    } else {
      setSessions((prev) => 
        prev.map((s) => s.id === curSessionIdRef.current ? { ...s, sessionMsg: [...s.sessionMsg, userMsg] } : s)
      );

    }

    messageSessionIdRef.current = curSessionIdRef.current;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);


    const res = await publicApi.post('/users/aichat',
      { 
        aiInput: userMsg.text,
        msgSession: curSessionIdRef.current
       },
      {
        headers: {
          'x-anonuser-id': anonId,
        },
      }
    );
    
    setIsTyping(false);
    if (res?.status === 200) { 
      console.log('Your propmt has been submitted, It may take a while to get response.');
    } else {
      console.log('Error submitting prompt, Please try again later!');
    }
    
  };

  return (
    <div className={styles.appWrapper}>
      {/* Sidebar - Chat History Logs */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <span>+</span> New chat
          </button>
          <button onClick={() => setSidebarOpen(false)} className={styles.toggleCollapseBtn}>
            ◂
          </button>
        </div>
        <nav className={styles.historyList}>
          <div className={styles.historySectionTitle}>Recent Conversations</div>
          {sessions.map((session) => (
            <div key={session.id} className={styles.historyItem} onClick={() => handleClickOnOldMsgs(session.id)}>
                  <span className={styles.chatIcon}>💬</span>
                  <span className={styles.chatTitle}>{session.title}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Interaction Canvas */}
      <main className={styles.mainCanvas}>
        {/* Top Minimal Action Row */}
        <header className={styles.topBar}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className={styles.menuExpandBtn}>
              ▸
            </button>
          )}
          <div className={styles.modelBadge}>Qwen2.5 coder ✨</div>
        </header>

        {/* Dynamic Message Scroll Container */}
        <div className={styles.scrollContainer}>
          <div className={styles.contentConstrain}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userAlign : styles.assistantAlign}`}
              >
                {/* Left Side: Layout Avatar block */}
                <div className={`${styles.avatarIcon} ${msg.sender === 'user' ? styles.userAvatar : styles.assistantAvatar}`}>
                  {msg.sender === 'user' ? 'U' : 'AI'}
                </div>
                
                {/* Right Side: Text & Sender Label Block */}
                <div className={styles.messageContentBlock}>
                  <div className={styles.senderLabel}>
                    {msg.sender === 'user' ? 'You' : 'AI Chat'}
                  </div>
                  <div className={styles.bubblePayload}>
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            // Intercept anchor elements ('a') and inject target properties
                            a: ({ ...props }) => (
                              <a 
                                {...props} 
                                target="_blank"             // Opens in a new tab
                                rel="noopener noreferrer"   // Security best practice for new tabs
                                className="text-blue-400 underline hover:text-blue-300 cursor-pointer" 
                              />
                            ),
                          
                            // Intercept the standard HTML pre tags to inject our wrapper
                            pre: ({ children }) => <CodeBlockWithCopy>{children}</CodeBlockWithCopy>
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>                      
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Simulated Stream Typing Indicator */}
            {isTyping && (
              <div className={`${styles.messageRow} ${styles.assistantAlign}`}>
                <div className={`${styles.avatarIcon} ${styles.assistantAvatar}`}>AI</div>
                <div className={styles.messageContentBlock}>
                  <div className={styles.senderLabel}>AI Chat</div>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {isEnable && (
          <div className={styles.spinnerCont}>
            <Spinner />
          </div>
        )}

        {/* Input Dock Area */}
        <footer className={styles.dockFooter}>
          <div className={styles.dockConstrain}>
            <form onSubmit={handleSubmit} className={styles.inputFormBox}>
              <textarea
                disabled={isEnable}
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit({ preventDefault: () => {} } as React.SubmitEvent);
                  }
                }}
                placeholder="Message AI Chat..."
                rows={1}
                className={styles.textField}
                wrap="soft" /* 💡 FORCES TEXT TO WRAP AT THE RIGHT EDGE */
              />
              <button type="submit" disabled={!input.trim()} className={styles.actionSendBtn}>
                <ArrowRight />
              </button>
            </form>
            <p className={styles.disclaimerText}>
              {/* AI Chat can make mistakes. Check important info. */}
              AI Chat may make mistakes.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};
