import React, { useState, useRef, useEffect } from 'react';
import { Send, User, X, ChevronDown, ChevronRight } from 'lucide-react';

// ── Robot icon (reused from header) ──────────────────────────────────────────

function RobotFace({ size = 110 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <line x1="11" y1="26" x2="3" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="3" cy="10" r="3.5" fill="#4a594a" />
      <line x1="45" y1="26" x2="53" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="53" cy="10" r="3.5" fill="#4a594a" />
      <line x1="28" y1="4" x2="28" y2="11" stroke="#4a594a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="3" r="3.2" fill="#22c55e" />
      <rect x="10" y="11" width="36" height="30" rx="8" fill="url(#cwGrad)" />
      <rect x="10" y="11" width="36" height="30" rx="8" stroke="#3c483c" strokeWidth="1.5" fill="none" />
      <circle cx="21" cy="24" r="5.5" fill="white" />
      <circle cx="35" cy="24" r="5.5" fill="white" />
      <circle cx="22" cy="23" r="2.2" fill="#16a34a" />
      <circle cx="36" cy="23" r="2.2" fill="#16a34a" />
      <circle cx="23.2" cy="21.8" r="0.9" fill="white" />
      <circle cx="37.2" cy="21.8" r="0.9" fill="white" />
      <path d="M19 32 Q28 38 37 32" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="27" r="2.8" fill="#22c55e" />
      <circle cx="46" cy="27" r="2.8" fill="#22c55e" />
      <defs>
        <linearGradient id="cwGrad" x1="10" y1="11" x2="46" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a594a" />
          <stop offset="100%" stopColor="#3c483c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Thinking block (Claude-style) ─────────────────────────────────────────────

function ThinkingBlock({ steps, collapsed, onToggle }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <RobotFace size={20} />
      </div>
      <div className="flex-1 max-w-[78%]">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-1"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          <span className="italic">{collapsed ? 'Thought process' : 'Thinking...'}</span>
        </button>
        {!collapsed && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                <span>{step}</span>
              </div>
            ))}
            {/* Pulsing "still thinking" dot when last step is loading */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />
              <span className="animate-pulse">thinking…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const [thinkCollapsed, setThinkCollapsed] = useState(true);

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser ? 'bg-teal-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'
        }`}
      >
        {isUser ? <User size={12} className="text-white" /> : <RobotFace size={20} />}
      </div>
      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Collapsed thinking summary (after response is complete) */}
        {!isUser && msg.thinkingSteps?.length > 0 && (
          <button
            onClick={() => setThinkCollapsed(v => !v)}
            className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-500 transition-colors"
          >
            {thinkCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
            <span className="italic">Thought for a moment</span>
          </button>
        )}
        {!isUser && msg.thinkingSteps?.length > 0 && !thinkCollapsed && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 space-y-1 w-full">
            {msg.thinkingSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 flex-shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ── Streaming assistant turn ───────────────────────────────────────────────────

function StreamingTurn({ thinkingSteps, streamingText, thinkingDone }) {
  const [thinkCollapsed, setThinkCollapsed] = useState(false);

  // Auto-collapse thinking block once streaming text starts
  useEffect(() => {
    if (streamingText.length > 0) setThinkCollapsed(true);
  }, [streamingText.length > 0]);

  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <RobotFace size={20} />
      </div>
      <div className="flex flex-col gap-1.5 max-w-[78%] items-start">
        {/* Live thinking block */}
        {thinkingSteps.length > 0 && !thinkingDone && (
          <button
            onClick={() => setThinkCollapsed(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {thinkCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            <span className="italic">{streamingText ? 'Thought process' : 'Thinking…'}</span>
          </button>
        )}
        {thinkingSteps.length > 0 && !thinkCollapsed && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 space-y-1.5 w-full">
            {thinkingSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                <span>{step}</span>
              </div>
            ))}
            {!thinkingDone && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />
                <span className="animate-pulse">thinking…</span>
              </div>
            )}
          </div>
        )}

        {/* Streaming text */}
        {streamingText ? (
          <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-2xl rounded-bl-sm text-xs leading-relaxed whitespace-pre-line">
            {streamingText}
            <span className="inline-block w-0.5 h-3 bg-gray-500 ml-0.5 animate-pulse align-middle" />
          </div>
        ) : !thinkingDone ? null : (
          // Fallback dots while waiting for first token
          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
            <div className="flex gap-1 items-center h-3">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Initial greeting ───────────────────────────────────────────────────────────

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "Hi! I'm NestChat, your personal finance advisor. I have live access to your portfolio, expenses, goals, and income. Ask me anything!",
    thinkingSteps: [],
  },
];

// ── Main widget ────────────────────────────────────────────────────────────────

const ChatWidget = ({ isOpen, setIsOpen }) => {
  const open = isOpen !== undefined ? isOpen : false;
  const setOpen = setIsOpen || (() => {});

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [thinkingDone, setThinkingDone] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages, streamingText, thinkingSteps]);

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question || isStreaming) return;

    const userMsg = { role: 'user', content: question };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setThinkingSteps([]);
    setStreamingText('');
    setThinkingDone(false);

    // Build history for API (exclude the initial greeting to keep context clean)
    const historyForAPI = updatedMessages
      .filter((_, i) => i > 0) // skip initial greeting
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch('/api/nestchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForAPI }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalText = '';
      let finalSteps = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event;
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === 'thinking') {
            finalSteps = [...finalSteps, event.step];
            setThinkingSteps([...finalSteps]);
          } else if (event.type === 'stream_start') {
            setThinkingDone(true);
          } else if (event.type === 'text') {
            finalText += event.content;
            setStreamingText(finalText);
          } else if (event.type === 'done') {
            break;
          } else if (event.type === 'error') {
            finalText = `Sorry, something went wrong: ${event.message}`;
            setStreamingText(finalText);
          }
        }
      }

      // Commit streamed message to history
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: finalText, thinkingSteps: finalSteps },
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.', thinkingSteps: [] },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setThinkingSteps([]);
      setStreamingText('');
      setThinkingDone(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {open && (
        <div
          className="fixed top-[76px] bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 flex-shrink-0">
            <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
              <RobotFace size={22} />
            </div>
            <span className="flex-1 text-white text-xs font-medium tracking-wide truncate">
              NestChat: Your Personal AI Advisor
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 bg-white">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Live streaming turn */}
            {isStreaming && (
              <StreamingTurn
                thinkingSteps={thinkingSteps}
                streamingText={streamingText}
                thinkingDone={thinkingDone}
              />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? 'NestChat is thinking…' : 'Ask about your finances…'}
              disabled={isStreaming}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-teal-400 bg-gray-50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
