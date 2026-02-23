import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom'; // 1. Import Link

const Navbar = ({ activePage, setActivePage, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isStudent = user?.role === "STUDENT";
  const displayName = user?.fullName || user?.name || 'Student';

  if (!isStudent) {
    return null;
  }

  // Handle navigation for internal dashboard views (Home, Events)
  const handleNavClick = (pageName) => {
    if (typeof setActivePage === "function") {
      setActivePage(pageName);
    }
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Helper to check if a link is active
  const isActive = (pageName) => activePage === pageName 
    ? "text-purple-600 border-b-2 border-purple-600" 
    : "text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-gray-300";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* --- LEFT SIDE: Logo & Desktop Nav --- */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
              <div className="bg-purple-600 p-1.5 rounded-lg mr-2">
                <Calendar className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-2xl text-gray-900 tracking-tight">
                Event<span className="text-purple-600">Mate</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <button
                onClick={() => handleNavClick('home')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('home')}`}
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick('events')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('events')}`}
              >
                Events
              </button>
              <button
                onClick={() => handleNavClick('my-events')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('my-events')}`}
              >
                My Events
              </button>
              
              {/* --- UPDATED: Contact Us Link --- */}
              <Link 
                to="/contact-us" // Ensure this route exists in your Router
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('contact-us')}`}
              >
                Contact us
              </Link>
            </div>
          </div>

          {/* --- RIGHT SIDE: Search, Notifications, User --- */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              </div>
              <input 
                type="text" 
                className="block w-48 lg:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200" 
                placeholder="Search events..."
              />
            </div>

            {/* Notifications Bell */}
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-purple-300 transition duration-150 ease-in-out"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </button>
              </div>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-down">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-900 font-bold">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'student@college.com'}</p>
                  </div>
                  
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- MOBILE MENU BUTTON --- */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU PANEL --- */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full text-left block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${isActive('home') === 'text-purple-600 border-purple-600' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('events')}
              className={`w-full text-left block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${isActive('events') === 'text-purple-600 border-purple-600' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Events
            </button>
            <button
              onClick={() => handleNavClick('my-events')}
              className={`w-full text-left block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${isActive('my-events') === 'text-purple-600 border-purple-600' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            >
              My Events
            </button>
            
            {/* --- UPDATED: Mobile Contact Us Link --- */}
            <Link
              to="/contact-us"
              className={`w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${isActive('contact-us') ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            >
              Contact us
            </Link>
          </div>
          
          <div className="pt-4 pb-4 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{displayName}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email || 'student@college.com'}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800 flex items-center gap-2"
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
