import { useState } from "react"
import { Download, ArrowLeft, Eye } from "lucide-react"


export default function MyCertificates() {
  const [selectedCertificate, setSelectedCertificate] = useState(null)


  // Mock certificates data
  const certificates = [
    {
      id: 1,
      eventName: "Inter-College Quiz Competition",
      eventType: "Seminar",
      date: "2025-01-15",
      time: "2:00 PM - 5:00 PM",
      location: "Multi-Purpose Hall",
      status: "Attended",
      certificateColor: "bg-teal-500",
      description: "Test your technical skills, battle the best, and claim your victory.",
      certificateUrl: "/certificates/quiz-2025.pdf",
      attendanceDate: "Jan 15, 2025",
      certificateImage: "https://via.placeholder.com/200x150?text=Certificate"
    },
    {
      id: 2,
      eventName: "Web Development Bootcamp",
      eventType: "Workshop",
      date: "2024-10-20",
      time: "10:00 AM - 4:00 PM",
      location: "Computer Lab A",
      status: "Completed",
      certificateColor: "bg-indigo-500",
      description: "Learn modern web development with HTML, CSS, JavaScript, and React.",
      certificateUrl: "/certificates/webdev-2024.pdf",
      attendanceDate: "Oct 20, 2024",
      certificateImage: "https://via.placeholder.com/200x150?text=Certificate"
    },
    {
      id: 3,
      eventName: "UI/UX Design Workshop",
      eventType: "Workshop",
      date: "2024-09-10",
      time: "1:00 PM - 5:00 PM",
      location: "Design Studio",
      status: "Completed",
      certificateColor: "bg-purple-500",
      description: "Master the principles of user experience and interface design.",
      certificateUrl: "/certificates/uiux-2024.pdf",
      attendanceDate: "Sep 10, 2024",
      certificateImage: "https://via.placeholder.com/200x150?text=Certificate"
    },
    {
      id: 4,
      eventName: "Digital Marketing Seminar",
      eventType: "Seminar",
      date: "2024-08-05",
      time: "2:00 PM - 4:00 PM",
      location: "Auditorium",
      status: "Completed",
      certificateColor: "bg-green-500",
      description: "Learn the latest strategies in digital marketing and social media.",
      certificateUrl: "/certificates/marketing-2024.pdf",
      attendanceDate: "Aug 5, 2024",
      certificateImage: "https://via.placeholder.com/200x150?text=Certificate"
    },
    {
      id: 5,
      eventName: "AI & Machine Learning Workshop",
      eventType: "Workshop",
      date: "2024-07-15",
      time: "10:00 AM - 3:00 PM",
      location: "Computer Lab B",
      status: "Completed",
      certificateColor: "bg-blue-500",
      description: "Introduction to AI, ML algorithms, and practical implementation.",
      certificateUrl: "/certificates/ai-2024.pdf",
      attendanceDate: "Jul 15, 2024",
      certificateImage: "https://via.placeholder.com/200x150?text=Certificate"
    }
  ]


  const handleDownload = (certificateName) => {
    alert(`Downloading: ${certificateName}`)
    // In production, this would trigger actual download
    // window.open(certificateUrl)
  }


  const handleViewDetails = (cert) => {
    setSelectedCertificate(cert)
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">


        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href="/student-dashboard"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="text-gray-600 dark:text-gray-400" size={24} />
          </a>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              My Certificates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your registrations, attendance, and download certificates.
            </p>
          </div>
        </div>


        {/* Certificates Grid */}
        <div className="grid gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-200 dark:border-gray-700 group"
            >
              <div className="grid md:grid-cols-4 gap-6 p-6">


                {/* Certificate Visual */}
                <div className="md:col-span-1">
                  <div className={`${cert.certificateColor} rounded-xl h-48 md:h-56 flex items-center justify-center overflow-hidden group-hover:scale-105 transition`}>
                    <div className="text-center text-white">
                      <div className="text-5xl mb-2">🏆</div>
                      <p className="font-bold text-sm">CERTIFICATE</p>
                      <p className="text-xs opacity-80">{cert.eventType}</p>
                    </div>
                  </div>
                </div>


                {/* Certificate Details */}
                <div className="md:col-span-3 flex flex-col justify-between">
                  <div>
                    {/* Title and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {cert.eventName}
                        </h2>
                        <div className="flex gap-3 items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            cert.status === "Attended"
                              ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
                              : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                          }`}>
                            {cert.status}
                          </span>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            {cert.eventType}
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Event Info */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {cert.description}
                    </p>


                    {/* Event Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">📅 Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(cert.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">🕐 Time</p>
                        <p className="font-medium text-gray-900 dark:text-white">{cert.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">📍 Location</p>
                        <p className="font-medium text-gray-900 dark:text-white">{cert.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">✓ Attended</p>
                        <p className="font-medium text-gray-900 dark:text-white">{cert.attendanceDate}</p>
                      </div>
                    </div>
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(cert.eventName)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                    >
                      <Download size={18} />
                      Download Certificate
                    </button>
                    <button
                      onClick={() => handleViewDetails(cert)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Empty State (if no certificates) */}
        {certificates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Register for events and attend them to earn certificates!
            </p>
            <a
              href="/student-dashboard"
              className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Browse Events
            </a>
          </div>
        )}
      </div>


      {/* FOOTER SECTION */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Brand Section */}
            <div>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                EventMate
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Making campus events smarter, simpler, and more rewarding for everyone.
              </p>
            </div>

            {/* Events Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Events</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition">Sports</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition">Cultural</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition">Technical</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">📧 eventmate@gmail.com</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">📍 Chandrapur</p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2026 EventMate Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
