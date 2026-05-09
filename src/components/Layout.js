import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Target, IndianRupee, Upload, X } from 'lucide-react';
import ChatWidget from './ChatWidget';

function RobotFaceHeader() {
  return (
    <svg width="22" height="22" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="11" y1="26" x2="3" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="3" cy="10" r="3.5" fill="#4a594a" />
      <line x1="45" y1="26" x2="53" y2="12" stroke="#5f6f5f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="53" cy="10" r="3.5" fill="#4a594a" />
      <line x1="28" y1="4" x2="28" y2="11" stroke="#4a594a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="3" r="3.2" fill="#22c55e" />
      <rect x="10" y="11" width="36" height="30" rx="8" fill="url(#rgh)" />
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
        <linearGradient id="rgh" x1="10" y1="11" x2="46" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a594a" />
          <stop offset="100%" stopColor="#3c483c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const Layout = ({ children }) => {
  const location = useLocation();
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [showGhibli, setShowGhibli] = useState(false);
  const [ghibliMissing, setGhibliMissing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/wealth', label: 'Wealth', icon: TrendingUp },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/expenses', label: 'Expenses', icon: IndianRupee },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 no-underline">
              {/* Photo Logo */}
              <img
                src="/photo.jpeg"
                alt="Anurag & Nidhi"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-sage-200 transition-all duration-300 hover:scale-125 hover:shadow-lg hover:rounded-2xl cursor-pointer flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  setShowGhibli(false);
                  setShowEnlarged(true);
                }}
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-sage-800 leading-tight">
                  Nest<span className="text-sage-600">Worth</span>
                </h1>
                <p className="text-xs text-gray-400 tracking-wide hidden sm:block">Anurag & Nidhi</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={
                    isActive(path) ? 'nav-link-active' : 'nav-link'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatOpen(v => !v)}
                title="AI Finance Assistant"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  chatOpen
                    ? 'bg-sage-800 text-white border-sage-800'
                    : 'bg-white text-sage-700 border-sage-200 hover:bg-sage-50 hover:border-sage-300'
                }`}
              >
                <RobotFaceHeader />
                <span className="hidden sm:inline">NestChat</span>
              </button>
              <Link
                to="/update"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Update Data</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <nav className="flex items-center justify-around py-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  isActive(path)
                    ? 'text-sage-700'
                    : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>

      {/* AI Chat Widget (controlled from header) */}
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />

      {/* Enlarged Photo Modal */}
      {showEnlarged && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center"
          onClick={() => setShowEnlarged(false)}
        >
          <div className="relative animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Toggle tabs */}
            <div className="flex mb-3 bg-white bg-opacity-10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setShowGhibli(false)}
                className={`flex-1 py-1.5 px-4 rounded-lg text-sm font-semibold transition-all ${!showGhibli ? 'bg-white text-gray-800 shadow' : 'text-white hover:bg-white hover:bg-opacity-10'}`}
              >
                Original
              </button>
              <button
                onClick={() => { setGhibliMissing(false); setShowGhibli(true); }}
                className={`flex-1 py-1.5 px-4 rounded-lg text-sm font-semibold transition-all ${showGhibli ? 'bg-white text-gray-800 shadow' : 'text-white hover:bg-white hover:bg-opacity-10'}`}
              >
                ✦ Ghibli
              </button>
            </div>
            {showGhibli && ghibliMissing ? (
              <div style={{ width: 'min(480px, 85vw)', height: 'min(480px, 85vw)', background: "rgba(255,255,255,0.08)", borderRadius: 16, border: "2px dashed rgba(255,255,255,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 12 }}>
                <div style={{ fontSize: 48 }}>🎨</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Ghibli photo not found</div>
                <div style={{ fontSize: 13, opacity: 0.7, textAlign: "center", maxWidth: 300 }}>Add your Ghibli version at<br /><code style={{ background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 4 }}>public/photo-ghibli.jpeg</code></div>
              </div>
            ) : (
              <img
                src={showGhibli ? "/photo-ghibli.jpeg" : "/photo.jpeg"}
                alt="Anurag & Nidhi"
                style={{ width: 'min(480px, 85vw)', height: 'min(480px, 85vw)' }}
                className="object-cover rounded-2xl shadow-2xl border-4 border-white"
                onError={() => { if (showGhibli) setGhibliMissing(true); }}
              />
            )}
            <button
              onClick={() => setShowEnlarged(false)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
