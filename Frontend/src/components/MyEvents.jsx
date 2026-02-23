import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Download, 
  CheckCircle, 
  Award 
} from 'lucide-react';
import StudentNavbar from '../../components/StudentNavbar'; // Adjust path if needed

// ==========================================
// SUB-COMPONENTS
// ==========================================

const MyEventCard = ({ event }) => {
  const isUpcoming = event.status === 'upcoming';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="h-40 overflow-hidden relative">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover" 
        />
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
          isUpcoming 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {isUpcoming ? 'Registered' : 'Completed'}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{event.title}</h3>
        
        <div className="space-y-2 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-purple-500" />
            <span>{event.date} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-purple-500" />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="mt-auto">
          {isUpcoming ? (
            <button className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
              <Ticket size={18} /> View Ticket
            </button>
          ) : (
            <button className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Download size={18} /> Download Certificate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};



// ==========================================
// MAIN COMPONENT
// ==========================================

const MyEvents = () => {
  // State for Tabs: 'upcoming' or 'past'
  const [activeTab, setActiveTab] = useState('upcoming');

  const user = { name: "Rajesh Kumar", email: "rajesh@college.com" };
  const handleLogout = () => alert("Logged out!");

  // Mock Data for Student's Events
  const myEvents = [
    {
      id: 1,
      title: "Hackathon 2025",
      date: "Nov 12, 2025",
      time: "9:00 AM",
      location: "Computer Lab 2",
      status: "upcoming",
      image: "https://images.unsplash.com/photo-1504384308090-c54be3852f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Web Development Bootcamp",
      date: "Oct 15, 2024",
      time: "10:00 AM",
      location: "Auditorium A",
      status: "completed",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format"
    },
    {
      id: 3,
      title: "AI Seminar",
      date: "Sep 20, 2024",
      time: "2:00 PM",
      location: "Online",
      status: "completed",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format"
    },
    {
      id: 4,
      title: "Cultural Fest",
      date: "Dec 01, 2025",
      time: "5:00 PM",
      location: "Main Ground",
      status: "upcoming",
      image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  // Filter events based on tab
  const filteredEvents = myEvents.filter(event => event.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 1. NAVBAR */}
      {/* Note: activePage is set to 'my-events' to highlight the nav item */}
      <StudentNavbar 
        activePage="my-events" 
        setActivePage={() => {}} // No-op since this is a separate page file, or pass a router function
        user={user} 
        onLogout={handleLogout} 
      />

      {/* 2. MAIN CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">Manage your registrations and access past certificates.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-4 px-1 text-sm font-semibold transition-colors ${
              activeTab === 'upcoming' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            Upcoming ({myEvents.filter(e => e.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-4 px-1 text-sm font-semibold transition-colors ${
              activeTab === 'past' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            Past Events ({myEvents.filter(e => e.status === 'completed').length})
          </button>
        </div>

        {/* Event Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <MyEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="text-gray-500">You don't have any {activeTab} events yet.</p>
          </div>
        )}

      </main>

    </div>
  );
};

export default MyEvents;