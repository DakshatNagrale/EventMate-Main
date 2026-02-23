// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
        {/* Brand Section - subtle lift on hover */}
        <div className="transform transition-all duration-500 hover:-translate-y-1">
          <h3 className="text-xl font-bold 
            bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent 
            transition-all duration-500">
            EventMate
          </h3>
          <p className="text-sm mt-2 text-gray-600 dark:text-gray-400 
            transform transition-all duration-700 opacity-0 translate-y-4 
            animate-fade-in delay-200">
            Making campus events smarter, simpler, and more rewarding for everyone.
          </p>
        </div>

        {/* Events Links - staggered slide-in + hover effect */}
        <div className="transform transition-all duration-500 hover:-translate-y-1">
          <h4 className="font-semibold mb-2 relative 
            after:absolute after:left-0 after:bottom-[-6px] after:w-0 after:h-0.5 
            after:bg-gradient-to-r after:from-indigo-600 after:to-purple-600 
            after:transition-all after:duration-500 hover:after:w-16">
            Events
          </h4>
          <ul className="space-y-1 text-sm">
            {["Sports", "Cultural", "Technical", "Workshops", "Seminars"].map((item, i) => (
              <li
                key={item}
                className="text-gray-600 dark:text-gray-400 
                  hover:text-indigo-600 dark:hover:text-indigo-400 
                  transform hover:translate-x-2 
                  transition-all duration-300 ease-out 
                  opacity-0 translate-y-4 animate-fade-in"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact - hover lift + icon pulse */}
        <div className="transform transition-all duration-500 hover:-translate-y-1">
          <h4 className="font-semibold mb-2 relative 
            after:absolute after:left-0 after:bottom-[-6px] after:w-0 after:h-0.5 
            after:bg-gradient-to-r after:from-indigo-600 after:to-purple-600 
            after:transition-all after:duration-500 hover:after:w-16">
            Contact
          </h4>
          <p className="text-sm flex items-center gap-2 
            transform transition-all duration-300 hover:translate-x-2 
            opacity-0 translate-y-4 animate-fade-in delay-500">
            <span className="animate-pulse">📧</span> eventmate@gmail.com
          </p>
          <p className="text-sm flex items-center gap-2 mt-2 
            transform transition-all duration-300 hover:translate-x-2 
            opacity-0 translate-y-4 animate-fade-in delay-600">
            <span className="animate-pulse">📍</span> 
            Balaji Ward, Near Fish Market, Chandrapur
          </p>
        </div>
      </div>

      {/* Bottom Bar - fade in + link scale */}
      <div className="border-t text-sm flex flex-col md:flex-row justify-between items-center px-6 py-4 
        opacity-0 translate-y-4 animate-fade-in delay-800">
        <p className="text-gray-600 dark:text-gray-400">
          © 2026 EventMate Inc. All rights reserved.
        </p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span className="text-gray-600 dark:text-gray-400 
            hover:text-indigo-600 dark:hover:text-indigo-400 
            transform hover:scale-110 transition-all duration-300 cursor-pointer">
            Privacy Policy
          </span>
          <span className="text-gray-600 dark:text-gray-400 
            hover:text-indigo-600 dark:hover:text-indigo-400 
            transform hover:scale-110 transition-all duration-300 cursor-pointer">
            Terms of Service
          </span>
        </div>
      </div>

      {/* Custom Animation Keyframes */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .delay-200 { animation-delay: 200ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        .delay-800 { animation-delay: 800ms; }
      `}</style>
    </footer>
  )
}
