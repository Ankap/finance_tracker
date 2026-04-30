import React, { useState, useRef, useEffect } from 'react';
import { Send, User, X, Sparkles } from 'lucide-react';

const DUMMY_QA = [
  {
    keywords: ['savings rate', 'saving rate', 'how much saving', 'savings'],
    answer: "Your current savings rate is 54.8% this month — well above the recommended 40% target. You're saving approximately ₹60,450 out of your combined income. Keep it up!",
  },
  {
    keywords: ['expenses', 'spending', 'spent', 'how much spend'],
    answer: "Your total expenses this month are ₹55,200. The biggest categories are:\n• Rent: ₹25,000 (45%)\n• Groceries: ₹6,000 (11%)\n• Shopping: ₹4,500 (8%)\n• Dining Out: ₹3,500 (6%)",
  },
  {
    keywords: ['net worth', 'networth', 'total wealth', 'wealth'],
    answer: "Your combined net worth is ₹16,75,000. It's distributed across:\n• Mutual Funds: ₹4,25,000\n• Fixed Deposits: ₹3,50,000\n• Stocks: ₹3,10,000\n• EPF: ₹2,85,000\n• Gold: ₹1,80,000\n• Bank Savings: ₹1,25,000",
  },
  {
    keywords: ['goals', 'goal', 'progress', 'target'],
    answer: "You have 5 financial goals:\n✅ Emergency Fund — Completed!\n🚀 Home Down Payment — Ahead (₹8.5L vs ₹8L goal)\n🚀 Europe Trip — Ahead (₹7L vs ₹5L goal)\n📈 Career Break Fund — On Track (₹4.8L of ₹12L)\n📈 Retirement Corpus — On Track (₹16.75L of ₹1Cr)",
  },
  {
    keywords: ['investment', 'invest', 'where invest', 'best investment'],
    answer: "Mutual Funds and Stocks are your top performers at 6.25% and 6.9% returns. Gold has done well at 5.9%. Consider increasing SIP contributions to accelerate your retirement corpus goal.",
  },
  {
    keywords: ['rent', 'housing', 'house'],
    answer: "Rent at ₹25,000 is your largest expense — 45% of total spending. This is within the recommended range for Indian metros. Optimising below 30% of income would significantly boost savings.",
  },
  {
    keywords: ['mutual fund', 'mf', 'sip', 'mutual funds'],
    answer: "Your Mutual Funds portfolio is ₹4,25,000 with 6.25% returns. SBI MF and HDFC MF are your current holdings. Consider increasing SIP by 10% annually to grow wealth through compounding.",
  },
  {
    keywords: ['stocks', 'zerodha', 'equity', 'shares'],
    answer: "Your Zerodha stock portfolio is ₹3,10,000 with 6.9% returns — your second-best performer. Diversify across sectors to reduce volatility.",
  },
  {
    keywords: ['epf', 'provident fund', 'pf'],
    answer: "Your EPF balance is ₹2,85,000 earning a guaranteed 8.25% p.a. — your safest fixed-return asset and a solid retirement foundation.",
  },
  {
    keywords: ['gold', 'sgb', 'sovereign'],
    answer: "Your Gold holdings (SGB + Physical) are ₹1,80,000 and appreciated 12.5% — your best performing asset! Gold is a great hedge against inflation.",
  },
  {
    keywords: ['tip', 'advice', 'suggest', 'recommendation', 'improve', 'better'],
    answer: "3 tips for you:\n1. Boost SIPs — redirect ₹5,000/month extra into your Retirement Corpus.\n2. Trim Dining Out — cut from ₹3,500 to ₹2,000 to save ₹1,500/month.\n3. Review Insurance — ₹5,000 on Home Insurance seems high; compare plans annually.",
  },
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
    answer: "Hello! I'm your NestWorth AI assistant. Ask me about your savings rate, net worth, expenses, goals, or investments!",
  },
  {
    keywords: ['thank', 'thanks', 'great', 'awesome'],
    answer: "You're welcome! Feel free to ask anything else about your finances.",
  },
];

const DEFAULT_ANSWER =
  "I don't have a specific answer for that yet. Try asking about your savings rate, net worth, expenses, goals, investments, or tips!";

function getDummyAnswer(question) {
  const q = question.toLowerCase();
  for (const item of DUMMY_QA) {
    if (item.keywords.some((kw) => q.includes(kw))) return item.answer;
  }
  return DEFAULT_ANSWER;
}

const SUGGESTED = [
  "What is my savings rate?",
  "Show net worth breakdown",
  "How are my goals?",
  "Give me financial tips",
];

function RobotFace({ size = 110 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left arm raised up */}
      <line x1="11" y1="26" x2="3" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="3" cy="10" r="3.5" fill="#4a594a" />
      {/* Right arm raised up */}
      <line x1="45" y1="26" x2="53" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="53" cy="10" r="3.5" fill="#4a594a" />
      {/* Antenna stem */}
      <line x1="28" y1="4" x2="28" y2="11" stroke="#4a594a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Antenna ball — primary green accent */}
      <circle cx="28" cy="3" r="3.2" fill="#22c55e" />
      {/* Head */}
      <rect x="10" y="11" width="36" height="30" rx="8" fill="url(#robotGrad)" />
      {/* Head outline */}
      <rect x="10" y="11" width="36" height="30" rx="8" stroke="#3c483c" strokeWidth="1.5" fill="none" />
      {/* Eye whites */}
      <circle cx="21" cy="24" r="5.5" fill="white" />
      <circle cx="35" cy="24" r="5.5" fill="white" />
      {/* Pupils — primary green */}
      <circle cx="22" cy="23" r="2.2" fill="#16a34a" />
      <circle cx="36" cy="23" r="2.2" fill="#16a34a" />
      {/* Pupil shine */}
      <circle cx="23.2" cy="21.8" r="0.9" fill="white" />
      <circle cx="37.2" cy="21.8" r="0.9" fill="white" />
      {/* Smile */}
      <path d="M19 32 Q28 38 37 32" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Ear bolts — primary green accent */}
      <circle cx="10" cy="27" r="2.8" fill="#22c55e" />
      <circle cx="46" cy="27" r="2.8" fill="#22c55e" />
      <defs>
        <linearGradient id="robotGrad" x1="10" y1="11" x2="46" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a594a" />
          <stop offset="100%" stopColor="#3c483c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
          isUser ? 'bg-teal-600' : 'bg-gradient-to-br from-teal-500 to-blue-600'
        }`}
      >
        {isUser ? <User size={12} className="text-white" /> : <RobotFace size={20} />}
      </div>
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-teal-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <RobotFace size={20} />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
        <div className="flex gap-1 items-center h-3">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: "Hi! I'm your NestWorth AI assistant. Ask me about your savings, expenses, goals, or investments!",
  },
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages, typing]);

  const sendMessage = (text) => {
    const question = text.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: 'assistant', text: getDummyAnswer(question) }]);
    }, 700 + Math.random() * 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex items-center justify-center bg-transparent border-none outline-none cursor-pointer p-0"
          style={{ animation: open ? 'none' : 'robotBounce 1.4s ease-in-out infinite' }}
          title="AI Finance Assistant"
        >
          {open
            ? <div style={{background:'#3c483c'}} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"><X size={22} className="text-white" /></div>
            : <RobotFace size={70 } />
          }
        </button>
        <style>{`
          @keyframes robotBounce {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            30%       { transform: translateY(-12px) rotate(-4deg); }
            50%       { transform: translateY(-8px) rotate(4deg); }
            70%       { transform: translateY(-4px) rotate(-2deg); }
          }
        `}</style>
      </div>

      {/* Chat modal */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">NestWorth AI</div>
              <div className="text-teal-100 text-xs">Finance Assistant</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white opacity-70 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-white">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggested chips */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap border-t border-gray-100 pt-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 px-3 pb-3 pt-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-teal-400 bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
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
