import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ADJUST THIS PATH based on where you saved your Navbar file!
// If your structure is src/pages/dashboards/StudentDashboard.jsx
// and src/components/StudentNavbar.jsx, then this path is correct:
import StudentNavbar from '../../components/StudentNavbar';
import { getStoredUser } from '../../lib/auth';
import { logoutUser } from '../../lib/logout';

// ==========================================
// INTERNAL SUB-COMPONENTS
// ==========================================

const StatCard = ({ icon, label, value, color = 'bg-purple-100 text-purple-700' }) => (
  <div className={`flex flex-col items-center p-6 rounded-2xl ${color} shadow-sm`}>
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

const EventCard = ({ title, date, time, dept, type, price, imageUrl, isFree = false }) => (
  <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100 group">
    <div className="relative h-48 overflow-hidden">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium bg-white/90 shadow-sm backdrop-blur-sm z-10">
        {isFree ? 'Free' : `₹${price}`}
      </div>
    </div>
    <div className="p-5 flex-grow flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{title}</h3>
      </div>
      <div className="text-sm text-gray-600 mb-3">
        {date} • {time}
      </div>
      <div className="text-xs text-gray-400 mb-4">{dept}</div>
      
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            type === 'Technical' ? 'bg-blue-100 text-blue-700' : 
            type === 'Cultural' ? 'bg-pink-100 text-pink-700' : 
            type === 'Sports' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {type}
          </span>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 text-sm text-gray-600 hover:text-gray-900 font-medium">View Details</button>
          <button className="flex-1 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition shadow-sm">
            Register
          </button>
        </div>
      </div>
    </div>
  </div>
);



// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

const StudentDashboard = () => {
  const navigate = useNavigate();
  // --- STATE ---
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'events'
  const [showAllRecommended, setShowAllRecommended] = useState(false);

  // User Object (Mock Data)
  const user = getStoredUser() || {
    fullName: "Student",
    email: "student@college.com"
  };

  // Logout Handler
  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  // --- DATA ---
  const eventImages = {
    hackathon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format',
    quiz: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format',
    cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format',
    workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format',
    ai: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format',
  };

  const allEvents = [
    {
      title: "Hackathon 2025",
      date: "Today",
      time: "8:00 AM",
      dept: "Computer department",
      type: "Technical",
      price: "800",
      imageUrl: eventImages.hackathon,
      status: 'current'
    },
    {
      title: "Quiz Competition",
      date: "Dec 11, 2025",
      time: "12:00 PM",
      dept: "Various departments",
      type: "Technical",
      price: "0",
      imageUrl: eventImages.quiz,
      status: 'upcoming',
      isFree: true
    },
    {
      title: "Cultural Fest",
      date: "Feb 20, 2026",
      time: "9:00 AM",
      dept: "Cultural committee",
      type: "Cultural",
      price: "200",
      imageUrl: eventImages.cultural,
      status: 'upcoming'
    },
    {
      title: "Web Dev Workshop",
      date: "Nov 25, 2025",
      time: "10:00 AM",
      dept: "Training Dept",
      type: "Workshop",
      price: "500",
      imageUrl: eventImages.workshop,
      status: 'upcoming'
    },
    {
      title: "Future of AI Seminar",
      date: "Dec 05, 2025",
      time: "2:00 PM",
      dept: "Science Club",
      type: "Technical",
      price: "0",
      imageUrl: eventImages.ai,
      status: 'upcoming',
      isFree: true
    },
    {
      title: "Annual Sports Meet",
      date: "Jan 15, 2026",
      time: "8:00 AM",
      dept: "Sports Authority",
      type: "Sports",
      price: "100",
      imageUrl: eventImages.sports,
      status: 'upcoming'
    }
  ];

  const currentEvents = allEvents.filter(e => e.status === 'current');
  const upcomingEvents = allEvents.filter(e => e.status === 'upcoming');
  const displayedEvents = showAllRecommended ? allEvents : allEvents.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- NAVBAR --- */}
      {/* Ensure the props passed here match what the Navbar component expects */}
      <StudentNavbar 
        activePage={currentView} 
        setActivePage={setCurrentView} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow">
        
        {/* --- VIEW: HOME --- */}
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard icon="🔍" label="Browse Events" value="New activities" color="bg-blue-50 text-blue-700" />
              <StatCard icon="📅" label="My Events" value="3 registered" />
              <StatCard icon="🏆" label="My Certificates" value="1 issued" />
              <StatCard icon="💬" label="Feedback" value="2 pending" color="bg-orange-50 text-orange-700" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Left Column (Content) */}
              <div className="md:col-span-2">
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                      <p className="text-gray-600 mt-1">Based on your interests</p>
                    </div>
                    <button
                      onClick={() => setShowAllRecommended(!showAllRecommended)}
                      className="mt-3 sm:mt-0 px-5 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium flex items-center gap-2"
                    >
                      {showAllRecommended ? "Show Less" : "View All Events"}
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {displayedEvents.map((event, index) => (
                      <EventCard key={index} {...event} />
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column (Sidebar) */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-5 text-gray-900">Recent Activity</h2>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✓</div>
                      <div>
                        <p className="font-medium text-gray-900">Registered for "AI Workshop"</p>
                        <p className="text-sm text-gray-500">3 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl">🏆</div>
                      <div>
                        <p className="font-medium text-gray-900">Certificate Earned - Web Dev</p>
                        <p className="text-sm text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">👀</div>
                      <div>
                        <p className="font-medium text-gray-900">Viewed "Music Concert"</p>
                        <p className="text-sm text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Widget */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-3">Complete your profile</h2>
                    <p className="mb-6 text-purple-100 text-sm">
                      Add your skills and interests to get better event recommendations.
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>70% Completed</span>
                        <span>3 steps left</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[70%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-white text-purple-700 font-medium py-3 rounded-xl hover:bg-gray-100 transition">
                    Continue Setup →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: EVENTS (ALL EVENTS) --- */}
        {currentView === 'events' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Events</h1>
              <p className="text-gray-600">Explore current and upcoming campus activities.</p>
            </div>

            {/* Current Events Section */}
            {currentEvents.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-8 bg-green-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Current Events</h2>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">LIVE</span>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {currentEvents.map((event, index) => (
                    <EventCard key={`curr-${index}`} {...event} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-8 bg-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => (
                  <EventCard key={`up-${index}`} {...event} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

    </div>
  );
};

export default StudentDashboard;
