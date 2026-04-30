import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

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
    answer: "You have 5 financial goals:\n✅ Emergency Fund — Completed!\n🚀 Home Down Payment — Ahead of target (₹8.5L vs ₹8L goal)\n🚀 Europe Trip — Ahead (₹7L vs ₹5L goal)\n📈 Career Break Fund — On Track (₹4.8L of ₹12L)\n📈 Retirement Corpus — On Track (₹16.75L of ₹1Cr)",
  },
  {
    keywords: ['investment', 'invest', 'where invest', 'best investment'],
    answer: "Based on your current portfolio, Mutual Funds and Stocks are your top performers with 6.25% and 6.9% returns respectively. Gold has also done well at 5.9%. Consider increasing your SIP contributions to accelerate your retirement corpus goal.",
  },
  {
    keywords: ['rent', 'housing', 'house'],
    answer: "Rent at ₹25,000 is your largest expense, accounting for 45% of total monthly spending. This is within the recommended range of 30–50% of expenses for Indian metros. If possible, optimising to below 30% of income would significantly boost your savings.",
  },
  {
    keywords: ['mutual fund', 'mf', 'sip', 'mutual funds'],
    answer: "Your Mutual Funds portfolio stands at ₹4,25,000 with a return of 6.25% this period. SBI MF and HDFC MF are your current holdings. Continuing regular SIPs will compound your wealth over time — consider increasing contributions by 10% annually.",
  },
  {
    keywords: ['stocks', 'zerodha', 'equity', 'shares'],
    answer: "Your stock portfolio at Zerodha is valued at ₹3,10,000 with a 6.9% return. Stocks are your second-best performing asset. Diversifying across sectors can help reduce volatility — ensure you're not over-concentrated in any single sector.",
  },
  {
    keywords: ['epf', 'provident fund', 'pf'],
    answer: "Your EPF balance is ₹2,85,000 earning a guaranteed 8.25% per annum — this is your safest fixed-return asset. It's a solid foundation for long-term retirement planning.",
  },
  {
    keywords: ['gold', 'sgb', 'sovereign'],
    answer: "Your Gold holdings (SGB + Physical) are worth ₹1,80,000 and have appreciated by 12.5% over the past period — your best performing asset! Gold is a great hedge against inflation and currency risk.",
  },
  {
    keywords: ['tip', 'advice', 'suggest', 'recommendation', 'improve', 'better'],
    answer: "Here are 3 personalised tips for you:\n1. **Boost SIPs** — You're ahead on most goals; redirect ₹5,000/month extra into your Retirement Corpus SIP.\n2. **Reduce Dining Out** — ₹3,500 in dining can be trimmed to ₹2,000, saving ₹1,500/month.\n3. **Review Insurance** — ₹5,000 on Home Insurance looks high — compare plans annually to save.",
  },
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
    answer: "Hello! I'm your NestWorth AI assistant. I can help you with insights about your finances — try asking about your savings rate, net worth, expenses, goals, or investments!",
  },
  {
    keywords: ['thank', 'thanks', 'great', 'awesome'],
    answer: "You're welcome! Feel free to ask anything else about your finances. I'm here to help you achieve your financial goals.",
  },
];

const DEFAULT_ANSWER =
  "I don't have a specific answer for that yet. Try asking about your savings rate, net worth, expenses, goals, mutual funds, stocks, or tips to improve your finances!";

function getDummyAnswer(question) {
  const q = question.toLowerCase();
  for (const item of DUMMY_QA) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return item.answer;
    }
  }
  return DEFAULT_ANSWER;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-sage-600' : 'bg-gradient-to-br from-teal-500 to-blue-600'
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-sage-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

const SUGGESTED = [
  "What is my savings rate?",
  "Show my net worth breakdown",
  "How are my goals progressing?",
  "Give me financial tips",
];

const GPTAgent = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your NestWorth AI assistant. Ask me anything about your finances — savings, expenses, net worth, goals, or investments!",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const question = text.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const answer = getDummyAnswer(question);
      setTyping(false);
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    }, 800 + Math.random() * 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Finance Agent</h1>
          <p className="text-sm text-gray-500">Ask questions about your finances</p>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50 rounded-2xl p-4 overflow-y-auto space-y-4 border border-gray-200">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      <div className="flex gap-2 flex-wrap mt-3">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your savings, expenses, goals..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-teal-400 shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-sm"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default GPTAgent;
