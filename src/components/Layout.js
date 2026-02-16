import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Target, IndianRupee, Upload, X } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showEnlarged, setShowEnlarged] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/wealth', label: 'Wealth', icon: TrendingUp },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/expenses', label: 'Expenses', icon: IndianRupee },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 no-underline">
              {/* Photo Logo */}
              <img
                src="/photo.jpeg"
                alt="Anurag & Nidhi"
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-sage-200 transition-all duration-300 hover:scale-125 hover:shadow-lg hover:rounded-2xl cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEnlarged(true);
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-sage-800 leading-tight">
                  Nest<span className="text-sage-600">Worth</span>
                </h1>
                <p className="text-xs text-gray-400 tracking-wide">Anurag & Nidhi</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={
                    isActive(path) ? 'nav-link-active' : 'nav-link'
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                </Link>
              ))}
            </nav>

            <Link
              to="/update"
              className="btn-primary flex items-center gap-2"
            >
              <Upload size={18} />
              <span>Update Data</span>
            </Link>
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Enlarged Photo Modal */}
      {showEnlarged && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center cursor-pointer"
          onClick={() => setShowEnlarged(false)}
        >
          <div className="relative animate-scaleIn">
            <img
              src="/photo.jpeg"
              alt="Anurag & Nidhi"
              className="max-w-sm w-80 h-80 object-cover rounded-2xl shadow-2xl border-4 border-white"
            />
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
