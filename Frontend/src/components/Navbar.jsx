import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Calendar,
  Moon,
  Sun
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ activePage, setActivePage, user, onLogout, variant = "auto" }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // useLocation helps us highlight the active link based on the URL
  const location = useLocation();
  const isPublic = variant === "public";
  const isAuthenticated = !isPublic && Boolean(user?.role);
  const isAdmin = isAuthenticated && user?.role === "MAIN_ADMIN";
  const isOrganizer = isAuthenticated && user?.role === "ORGANIZER";
  const isPrivileged = isAdmin || isOrganizer;
  const displayName = user?.fullName || user?.name || 'User';
  const avatarUrl = user?.avatar || "";
  const isDark = theme === "dark";

  const handleNavClick = (pageName) => {
    if (typeof setActivePage === "function") {
      setActivePage(pageName);
    }
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Helper to check active state
  const isActive = (pageName) => {
    if (pageName === 'my-events') {
      return location.pathname === '/my-events' ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-gray-300";
    }
    // For internal dashboard views (Home/Events), use the prop state
    return activePage === pageName 
      ? "text-purple-600 border-b-2 border-purple-600" 
      : "text-gray-600 hover:text-purple-600 border-b-2 border-transparent hover:border-gray-300";
  };

  const navClass = isPublic
    ? "relative bg-white border-b border-gray-200 sticky top-0 z-50"
    : isPrivileged
      ? "relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-50"
    : "relative bg-white/85 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/60 dark:border-white/10 sticky top-0 z-50 shadow-[0_12px_30px_-20px_rgba(79,70,229,0.6)]"

  return (
    <nav className={navClass}>
      {!isPublic && !isPrivileged && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />
          <div className="absolute -top-24 right-10 w-40 h-40 bg-indigo-400/15 blur-3xl rounded-full pointer-events-none" />
        </>
      )}
      {isAdmin && (
        <>
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 opacity-80 animate-admin-line pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />
          <div className="absolute -top-24 left-1/3 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl animate-admin-glow pointer-events-none" />
          <div className="absolute -top-28 right-24 h-48 w-48 rounded-full bg-purple-400/15 blur-3xl animate-admin-glow-delay pointer-events-none" />
        </>
      )}
      {isOrganizer && (
        <>
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 opacity-70 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none" />
        </>
      )}
      {isPublic && !isPrivileged && (
        <>
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80 animate-nav-beam" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </>
      )}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* LEFT SIDE: Logo & Desktop Nav */}
          <div className="flex items-center gap-4">
            {/* Logo - Links to Home */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
              {!isPublic && !isPrivileged && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-[0_8px_18px_-10px_rgba(79,70,229,0.8)]">
                  <Calendar className="text-white h-5 w-5" />
                </div>
              )}
              <span className="font-extrabold text-2xl tracking-tight relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-nav-gradient">
                  EventMate
                </span>
                {isPublic && !isPrivileged && <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-indigo-400/25 blur-lg animate-logo-glow" />}
              </span>
            </div>

            {/* Desktop Navigation Links */}
            {!isPublic && !isPrivileged && (
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
                
                {/* --- UPDATED: My Events Link --- */}
                {isAuthenticated && (
                  <Link 
                    to="/my-events"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('my-events')}`}
                  >
                    My Events
                  </Link>
                )}

                <Link 
                  to="/#contact"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 ${isActive('contact-us')}`}
                >
                  Contact us
                </Link>
              </div>
            )}
          </div>

          {isPublic && !isPrivileged && (
            <div className="hidden md:flex flex-1 items-center justify-center gap-8">
              {[
                { label: "Home", to: "/" , key: "home" },
                { label: "Events", to: "/#events", key: "events" },
                { label: "Contact us", to: "/#contact", key: "contact" },
              ].map((item) => {
                const isCurrent =
                  (item.key === "home" && location.pathname === "/" && !location.hash) ||
                  (item.key === "events" && location.hash === "#events") ||
                  (item.key === "contact" && location.hash === "#contact");

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`relative text-sm font-medium transition-all duration-300 ${
                      isCurrent ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <span
                      className={`absolute -bottom-2 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ${
                        isCurrent ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {isAdmin && (
            <div className="hidden md:flex flex-1 items-center justify-center gap-6">
              {[
                { label: "Home", to: "/admin-dashboard", key: "home" },
                { label: "System Oversight", to: "/admin-dashboard#system", key: "system" },
                { label: "User Management", to: "/admin-dashboard#users", key: "users" },
                { label: "Certificates & Audit Logs", to: "/admin-dashboard#certificates", key: "certificates" },
                { label: "Security & Reports", to: "/admin-dashboard#security", key: "security" },
              ].map((item) => {
                const isCurrent =
                  (item.key === "home" && location.pathname === "/admin-dashboard" && !location.hash) ||
                  (item.key === "system" && location.hash === "#system") ||
                  (item.key === "users" && location.hash === "#users") ||
                  (item.key === "certificates" && location.hash === "#certificates") ||
                  (item.key === "security" && location.hash === "#security");

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`group relative text-sm font-medium transition-all duration-300 ${
                      isCurrent
                        ? "text-indigo-600"
                        : "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <span
                      className={`absolute -bottom-2 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 transition-all duration-300 ${
                        isCurrent ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          )}
          {isOrganizer && (
            <div className="hidden md:flex flex-1 items-center justify-center gap-8">
              {[
                { label: "Home", to: "/organizer-dashboard", key: "home" },
                { label: "My Events", to: "/organizer-dashboard#my-events", key: "my-events" },
                { label: "Contact Admin", to: "/organizer-dashboard#contact-admin", key: "contact-admin" },
              ].map((item) => {
                const isCurrent =
                  (item.key === "home" && location.pathname === "/organizer-dashboard" && !location.hash) ||
                  (item.key === "my-events" && location.hash === "#my-events") ||
                  (item.key === "contact-admin" && location.hash === "#contact-admin");

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`text-sm font-medium transition-colors ${
                      isCurrent ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* RIGHT SIDE: Search, Notifications, User */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {isAdmin ? (
              <>
                <button className="relative p-2 rounded-full text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300 transition" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500 animate-admin-ping" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                </button>
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300 transition"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <div className="relative h-9 w-9">
                  <span className="absolute inset-0 rounded-full bg-indigo-400/20 blur-md animate-admin-avatar" />
                  <div className="relative h-9 w-9 rounded-full border border-indigo-300 text-indigo-700 bg-indigo-50 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      (displayName || "AD")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                    )}
                  </div>
                </div>
              </>
            ) : isOrganizer ? (
              <>
                <button className="p-2 rounded-full text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300 transition" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300 transition"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <div className="h-9 w-9 rounded-full border border-indigo-300 text-indigo-700 bg-indigo-50 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (displayName || "OR")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>
              </>
            ) : isAuthenticated ? (
              <>
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
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                </button>
              </div>

              {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-900 font-bold">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'student@college.com'}</p>
                      </div>
                      
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                      <button
                        onClick={() => { onLogout?.(); setIsUserMenuOpen(false); }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="relative px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition"
                >
                  <span className="relative z-10">Sign Up</span>
                  <span className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition login-cta-sheen" />
                </Link>
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-900 hover:text-indigo-600 transition hover:scale-105"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU PANEL --- */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-white/10 backdrop-blur">
          <div className="pt-2 pb-3 space-y-1">
            {isAdmin ? (
              <>
                <Link to="/admin-dashboard" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Home
                </Link>
                <Link to="/admin-dashboard#system" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  System Oversight
                </Link>
                <Link to="/admin-dashboard#users" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  User Management
                </Link>
                <Link to="/admin-dashboard#certificates" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Certificates & Audit Logs
                </Link>
                <Link to="/admin-dashboard#security" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Security & Reports
                </Link>
              </>
            ) : isOrganizer ? (
              <>
                <Link to="/organizer-dashboard" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Home
                </Link>
                <Link to="/organizer-dashboard#my-events" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  My Events
                </Link>
                <Link to="/organizer-dashboard#contact-admin" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 hover:bg-gray-50">
                  Contact Admin
                </Link>
              </>
            ) : (
              <>
                <button onClick={() => handleNavClick('home')} className="w-full text-left block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">Home</button>
                <button onClick={() => handleNavClick('events')} className="w-full text-left block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">Events</button>
                
                {/* --- UPDATED: Mobile My Events Link --- */}
                {isAuthenticated && (
                  <Link to="/my-events" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                    My Events
                  </Link>
                )}

                <Link to="/#contact" className="w-full block pl-3 pr-4 py-3 border-l-4 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                  Contact us
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{displayName}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email || 'student@college.com'}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800 flex items-center gap-2">
                    <LogOut size={18} /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 space-y-2">
                <Link to="/login" className="block w-full text-center px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                  Login
                </Link>
                <Link to="/signup" className="block w-full text-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  Sign Up
                </Link>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  Toggle theme
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isPublic && (
        <style jsx>{`
        .animate-nav-gradient {
          background-size: 200% 200%;
          animation: navGradient 6s ease infinite;
        }
        .animate-button-sheen {
          background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.7), transparent);
          background-size: 200% 100%;
          animation: buttonSheen 2.6s ease infinite;
        }
        @keyframes navGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes buttonSheen {
          0% { background-position: 0% 0%; opacity: 0.2; }
          50% { background-position: 100% 0%; opacity: 0.6; }
          100% { background-position: 0% 0%; opacity: 0.2; }
        }
      `}</style>
      )}
      {isPublic && (
        <style jsx>{`
        .animate-nav-gradient {
          background-size: 200% 200%;
          animation: navGradient 6s ease infinite;
        }
        .login-cta-sheen {
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.7), transparent);
          background-size: 200% 100%;
          animation: ctaSheen 3.2s ease infinite;
        }
        .animate-nav-beam {
          animation: navBeam 6s ease-in-out infinite;
          background-size: 200% 100%;
        }
        .animate-logo-glow {
          animation: logoGlow 4s ease-in-out infinite;
        }
        @keyframes navGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaSheen {
          0% { background-position: 0% 0%; opacity: 0.2; }
          50% { background-position: 100% 0%; opacity: 0.7; }
          100% { background-position: 0% 0%; opacity: 0.2; }
        }
        @keyframes navBeam {
          0% { filter: hue-rotate(0deg); opacity: 0.7; }
          50% { filter: hue-rotate(20deg); opacity: 1; }
          100% { filter: hue-rotate(0deg); opacity: 0.7; }
        }
        @keyframes logoGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
      `}</style>
      )}
      {isAdmin && (
        <style jsx>{`
        .animate-admin-line {
          background-size: 200% 100%;
          animation: adminLine 6s ease-in-out infinite;
        }
        .animate-admin-glow {
          animation: adminGlow 10s ease-in-out infinite;
        }
        .animate-admin-glow-delay {
          animation: adminGlow 12s ease-in-out infinite 2s;
        }
        .animate-admin-ping {
          animation: adminPing 1.8s ease-out infinite;
        }
        .animate-admin-avatar {
          animation: adminAvatar 3s ease-in-out infinite;
        }
        @keyframes adminLine {
          0% { filter: hue-rotate(0deg); opacity: 0.7; }
          50% { filter: hue-rotate(20deg); opacity: 1; }
          100% { filter: hue-rotate(0deg); opacity: 0.7; }
        }
        @keyframes adminGlow {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(10px); opacity: 1; }
        }
        @keyframes adminPing {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes adminAvatar {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
      `}</style>
      )}
    </nav>
  );
};

export default Navbar;
