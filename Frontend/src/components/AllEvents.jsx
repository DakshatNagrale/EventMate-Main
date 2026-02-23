import React, { useState } from 'react';
import './EventMate.css'; // Make sure to link the CSS file
import Footer from './Footer';

const eventsData = [
    {
        id: 1,
        title: "Hackathon 2020",
        date: "Oct 24, 2020 • 10:00 AM",
        desc: "Join us for 48 hours of coding, innovation, and fun. Build amazing projects with your team.",
        image: "https://picsum.photos/seed/hackathon/400/250",
        status: "upcoming",
        attendees: ["https://picsum.photos/seed/user1/50/50", "https://picsum.photos/seed/user2/50/50", "https://picsum.photos/seed/user3/50/50"],
        count: "+120 Joined"
    },
    {
        id: 2,
        title: "Quiz Competition",
        date: "Nov 05, 2020 • 02:00 PM",
        desc: "Test your knowledge in science, history, and pop culture. Exciting prizes await the winners!",
        image: "https://picsum.photos/seed/quiz/400/250",
        status: "upcoming",
        attendees: ["https://picsum.photos/seed/user4/50/50", "https://picsum.photos/seed/user5/50/50"],
        count: "+45 Joined"
    },
    {
        id: 3,
        title: "Cultural Fest",
        date: "Dec 12, 2020 • 05:00 PM",
        desc: "Celebrate diversity with music, dance, and food from around the world. Open to all.",
        image: "https://picsum.photos/seed/cultural/400/250",
        status: "upcoming",
        attendees: [],
        count: "Be the first to join!"
    },
    {
        id: 6,
        title: "Design Sprint",
        date: "Nov 20, 2020 • 10:00 AM",
        desc: "A 5-day process for answering critical business questions through design, prototyping, and testing ideas.",
        image: "https://picsum.photos/seed/design/400/250",
        status: "upcoming",
        attendees: ["https://picsum.photos/seed/user11/50/50", "https://picsum.photos/seed/user12/50/50"],
        count: "+30 Joined"
    },
    {
        id: 7,
        title: "AI Summit",
        date: "Dec 01, 2020 • 09:00 AM",
        desc: "Explore the future of Artificial Intelligence with keynotes from industry leaders and hands-on workshops.",
        image: "https://picsum.photos/seed/aisummit/400/250",
        status: "upcoming",
        attendees: ["https://picsum.photos/seed/user13/50/50", "https://picsum.photos/seed/user14/50/50"],
        count: "+150 Joined"
    },
    {
        id: 4,
        title: "Tech Workshop 2019",
        date: "Sep 10, 2019 • 09:00 AM",
        desc: "A deep dive into the latest web technologies. Hands-on sessions with industry experts.",
        image: "https://picsum.photos/seed/techwork/400/250",
        status: "completed",
        attendees: ["https://picsum.photos/seed/user6/50/50", "https://picsum.photos/seed/user7/50/50", "https://picsum.photos/seed/user8/50/50", "https://picsum.photos/seed/user9/50/50"],
        count: "200+ Attended"
    },
    {
        id: 5,
        title: "Alumni Meetup",
        date: "Jan 15, 2019 • 06:00 PM",
        desc: "Reconnect with old classmates and network with professionals from your alma mater.",
        image: "https://picsum.photos/seed/alumni/400/250",
        status: "completed",
        attendees: ["https://picsum.photos/seed/user10/50/50"],
        count: "85 Attended"
    },
    {
        id: 8,
        title: "Charity Run 2019",
        date: "Aug 20, 2019 • 06:00 AM",
        desc: "Run for a cause! All proceeds go to local community development programs.",
        image: "https://picsum.photos/seed/run/400/250",
        status: "completed",
        attendees: ["https://picsum.photos/seed/user15/50/50", "https://picsum.photos/seed/user16/50/50", "https://picsum.photos/seed/user17/50/50"],
        count: "300+ Participated"
    },
    {
        id: 9,
        title: "Music Festival 2019",
        date: "Jul 04, 2019 • 04:00 PM",
        desc: "An evening of live performances by local bands and artists. Food stalls and merchandise available.",
        image: "https://picsum.photos/seed/music/400/250",
        status: "completed",
        attendees: ["https://picsum.photos/seed/user18/50/50", "https://picsum.photos/seed/user19/50/50"],
        count: "500+ Attended"
    }
];

const EventMate = () => {
    const [modal, setModal] = useState({ open: false, title: '' });
    const [toast, setToast] = useState({ show: false, message: '' });
    const [userName, setUserName] = useState('');

    const openModal = (title) => {
        setModal({ open: true, title });
    };

    const closeModal = () => {
        setModal({ open: false, title: '' });
        setUserName('');
    };

    const handleRegistration = (e) => {
        e.preventDefault();
        closeModal();
        showToast(`Success! ${userName}, you are registered.`);
    };

    const viewDetails = (id) => {
        const event = eventsData.find(e => e.id === id);
        showToast(`Opening details for ${event.title}...`);
    };

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 3000);
    };

    const handleOutsideClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            closeModal();
        }
    };

    const renderCard = (event, index) => {
        const badge = event.status === 'upcoming' 
            ? <span className="status-badge status-upcoming">Open</span> 
            : <span className="status-badge status-completed">Closed</span>;
        
        const actionBtn = event.status === 'upcoming'
            ? <button className="btn-action btn-primary" onClick={() => openModal(event.title)}>Register</button>
            : <button className="btn-action btn-secondary" onClick={() => viewDetails(event.id)}>Details</button>;

        const attendeesHTML = event.attendees.map((url, i) => (
            <img key={i} src={url} alt="user" />
        ));

        return (
            <article className="event-card" key={event.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-image" style={{ backgroundImage: `url('${event.image}')` }}>
                    {badge}
                </div>
                <div className="card-content">
                    <div className="event-date"><i className="far fa-clock"></i> {event.date}</div>
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-desc">{event.desc}</p>
                    <div className="card-footer">
                        <div className="attendees">
                            {attendeesHTML}
                            <span className="attendee-count">{event.count}</span>
                        </div>
                        {actionBtn}
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header>
                <div className="logo">
                    <i className="fa-solid fa-calendar-check"></i>
                    EventMate
                </div>
                <nav>
                    <ul>
                        <li><a href="#" className="active">Home</a></li>
                        <li><a href="#upcoming">Events</a></li>
                        <li><a href="#">Dashboard</a></li>
                        <li><a href="#">About</a></li>
                    </ul>
                </nav>
                <button className="btn-login" onClick={() => showToast("Login functionality coming soon!")}>Login</button>
            </header>

            {/* Main Content */}
            <main>
                {/* Upcoming Section */}
                <section id="upcoming">
                    <div className="section-header">
                        <h2 className="section-title">Upcoming Events</h2>
                        <a href="#" style={{color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem'}}>View All</a>
                    </div>
                    <div className="events-grid">
                        {eventsData.filter(e => e.status === 'upcoming').map((event, i) => renderCard(event, i))}
                    </div>
                </section>

                {/* Completed Section */}
                <section id="completed">
                    <div className="section-header">
                        <h2 className="section-title">Completed Events</h2>
                        <a href="#" style={{color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem'}}>View Archive</a>
                    </div>
                    <div className="events-grid">
                        {eventsData.filter(e => e.status === 'completed').map((event, i) => renderCard(event, i))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />

            {/* Registration Modal */}
            {modal.open && (
                <div className="modal-overlay" onClick={handleOutsideClick}>
                    <div className="modal">
                        <button className="close-modal" onClick={closeModal}>&times;</button>
                        <div className="modal-header">
                            <h3 className="modal-title">Register for {modal.title}</h3>
                            <p style={{color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '5px'}}>Fill in your details to secure your spot.</p>
                        </div>
                        <form onSubmit={handleRegistration}>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    required 
                                    placeholder="John Doe"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" required placeholder="john@example.com" />
                            </div>
                            <button type="submit" className="btn-login" style={{width: '100%', borderRadius: '8px', padding: '12px'}}>Confirm Registration</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <div className="toast-container">
                {toast.show && (
                    <div className={`toast ${toast.show ? 'show' : ''}`}>
                        <i className="fas fa-check-circle"></i>
                        <span>{toast.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventMate;
