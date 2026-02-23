import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import ContactUs from "../components/ContactUs";
import eventmateLogo from "../assets/eventmate-logo.png";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// --- Icons ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const CalendarIcon = () => (
  <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const MapPinIcon = () => (
  <svg className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ArrowRight = () => (
  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
);

const normalizeText = (value) => (value ?? "").toString().trim().toLowerCase();

// --- Animations ---
// 1. Staggered Text Reveal for Hero
const textReveal = {
  hidden: { opacity: 0, y: 50, filter: "blur(10px)", rotateX: -10 },
  show: { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};
const containerReveal = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.5 } }, // Wait for loader to finish
};

// 2. Standard Fade Up
const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

// --- Preloader Component ---
const Preloader = ({ onComplete }) => {
  const sparks = Array.from({ length: 12 });

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#05060f] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut", delay: 0.8 }}
    >
      <div className="absolute inset-0 preloader-aurora" />
      <div className="absolute inset-0 preloader-noise" />
      <motion.div
        className="absolute inset-0 preloader-sweep"
        initial={{ x: "-40%" }}
        animate={{ x: "40%" }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 preloader-halo" />
          <motion.div
            className="absolute inset-0 preloader-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[18%] rounded-full border border-indigo-500/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 preloader-orbit">
            {sparks.map((_, index) => (
              <span key={index} className="preloader-spark" style={{ "--i": index }} />
            ))}
          </div>
          <motion.div
            className="relative z-10 preloader-core"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={eventmateLogo}
              alt="Bajaj Chandrapur Polytechnic logo"
              className="preloader-logo"
              loading="eager"
              decoding="async"
            />
          </motion.div>
        </div>

        <motion.p
          className="mt-6 text-xs uppercase tracking-[0.45em] text-indigo-500 dark:text-indigo-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          EventMate
        </motion.p>

        <div className="mt-4 h-1.5 w-52 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
          <motion.span
            className="block h-full w-1/2 preloader-bar"
            animate={{ x: ["-60%", "140%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true); // Preloader State
  const reduceMotion = useReducedMotion();
  const location = useLocation();

  // --- Handle Preloader ---
  useEffect(() => {
    // Simulate loading data/assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200); // Time before preloader vanishes

    return () => clearTimeout(timer);
  }, []);

  // --- Parallax & Scroll Logic ---
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]); 
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const scaleX = useScroll().scrollYProgress;

  const events = [
    {
      id: 1,
      title: "Hackathon 2025",
      description: "Team up, hack smart, and solve real-world problems in our 24-hour innovation marathon.",
      date: "Nov 12, 2025",
      time: "9:00 AM",
      location: "PHP Lab, Computer Department",
      price: "₹300",
      category: "Technical",
      image:
        "https://media.istockphoto.com/id/1189873851/vector/hackathlon-vector-illustration-tiny-programmers-competition-person-concept.jpg?s=612x612&w=0&k=20&c=9aoMxVsaQSuiUAJB_rU1IsTd5Cxu8DZteerQeuYbabI=",
      link: "/hackathon",
    },
    {
      id: 2,
      title: "Quiz Competition",
      description: "Test your technical skills, battle best, and claim your victory in ultimate Tech Quiz Competition.",
      date: "Dec 11, 2025",
      time: "12:00 PM",
      location: "Audio Video Hall",
      price: "Free",
      category: "Technical",
      image: "https://www.shutterstock.com/image-vector/trophy-hand-light-bulb-creativity-260nw-2593630875.jpg",
    },
    {
      id: 3,
      title: "Cultural Fest",
      description: "Celebrate creativity and showcase your cultural spirit.",
      date: "Feb 21, 2025",
      time: "11:00 AM",
      location: "Multi-Purpose Hall",
      price: "₹200",
      category: "Cultural",
      image: "https://thumbs.dreamstime.com/b/crowd-enjoying-live-music-outdoor-festival-vibrant-stage-lighting-crowd-enjoying-live-music-outdoor-festival-345115016.jpg",
    },
  ];

  const categories = useMemo(() => {
    const seen = new Map();
    events.forEach((event) => {
      const raw = event?.category;
      const key = normalizeText(raw);
      if (!key) return;
      if (!seen.has(key)) {
        seen.set(key, raw.toString().trim());
      }
    });
    return ["All", ...Array.from(seen.values())];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = normalizeText(searchQuery);
    const selectedKey = normalizeText(selectedCategory);
    return events.filter((event) => {
      const title = normalizeText(event?.title);
      const description = normalizeText(event?.description);
      const matchesSearch =
        !query || title.includes(query) || description.includes(query);
      const matchesCategory = selectedKey === "all" || normalizeText(event?.category) === selectedKey;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  const handleRegister = (eventTitle) => {
    alert(`Registration for "${eventTitle}" is open! We'll notify you soon.`);
  };

  useEffect(() => {
    const { hash } = location;
    if (!hash) return;

    const target = document.querySelector(hash);
    if (!target) return;

    const scrollToTarget = () => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (isLoading) {
      const timer = setTimeout(scrollToTarget, 250);
      return () => clearTimeout(timer);
    }

    requestAnimationFrame(scrollToTarget);
  }, [location.hash, isLoading]);

  const viewportOnce = { once: true, amount: 0.25 };

  return (
    <div className="min-h-screen relative bg-white dark:bg-[#030712] text-gray-900 dark:text-white overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">
      
      {/* --- PRELOADER ANIMATION --- */}
      <AnimatePresence mode="wait">
        {isLoading && <Preloader />}
      </AnimatePresence>

      {/* --- SCROLL PROGRESS BAR --- */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 origin-left"
        style={{ scaleX: scaleX }}
      />

      {/* --- PARALLAX BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#0B1026] dark:to-[#000000]" />
        <div className="absolute inset-0 opacity-[0.3] dark:opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Parallax Blobs */}
        <motion.div style={{ y: y1 }} className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-[120px]" />
        <motion.div style={{ y: y2 }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-[120px]" />
        <motion.div style={{ y: y3 }} className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-pink-300/10 dark:bg-pink-600/10 rounded-full blur-[100px]" />
      </div>

      {/* --- HERO SECTION (Synced Animation) --- */}
      <section className="relative z-10 pt-32 pb-16 lg:pt-48 lg:pb-24 px-6">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="hero-spotlight hero-spotlight--one" />
          <div className="hero-spotlight hero-spotlight--two" />
          <div className="hero-spotlight hero-spotlight--three" />
          <div className="hero-stars" />
          <div className="hero-beam" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          
          {/* Only animate Hero content when Loading is False */}
          {!isLoading && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={containerReveal}
              className="w-full"
            >
              {/* Badge */}
              <motion.span
                variants={textReveal}
                className="inline-block py-1 px-4 rounded-full bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
              >
                Campus Event Management
              </motion.span>

              {/* Main Title (Word by word effect) */}
              <motion.h1
                variants={textReveal}
                className="hero-title text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/40"
              >
                Manage Campus Events <br />
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
                  className="hero-accent inline-block bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient"
                >
                  Seamlessly
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p variants={textReveal} className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                The all-in-one platform for students and organizers. Discover events, register instantly, check-in with QR codes, and earn digital certificates.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={textReveal} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link
                  to="/signup"
                  className="group relative p-[2px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[spin_4s_linear_infinite] cta-glow"
                >
                  <div className="relative bg-white dark:bg-[#030712] rounded-full px-8 py-4 group-hover:bg-opacity-0 transition-all duration-300">
                    <span className="relative z-10 text-gray-900 dark:text-white font-bold text-lg flex items-center">
                      Get Started Free <ArrowRight />
                    </span>
                  </div>
                </Link>

                <Link 
                  to="/login"
                  className="cta-secondary px-8 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-full font-bold text-lg transition-all"
                >
                  Login
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* --- INFINITE MARQUEE --- */}
      <section className="relative z-10 py-8 overflow-hidden border-y border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex whitespace-nowrap gap-12">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12 animate-[marquee_30s_linear_infinite] min-w-full justify-center">
              <span className="text-2xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">Hackathon</span>
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-500/20 uppercase tracking-widest">•</span>
              <span className="text-2xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">Quiz Competition</span>
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-500/20 uppercase tracking-widest">•</span>
              <span className="text-2xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">Cultural Fest</span>
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-500/20 uppercase tracking-widest">•</span>
              <span className="text-2xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">Workshop</span>
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-500/20 uppercase tracking-widest">•</span>
              <span className="text-2xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">Seminar</span>
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-500/20 uppercase tracking-widest">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.p variants={fadeUp} className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">How EventMate Works</motion.h2>
          <motion.div variants={fadeUp} className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            { icon: "🔍", title: "Discover Events", desc: "Browse all upcoming campus events with full details.", color: "from-indigo-100/50 to-transparent dark:from-indigo-500/20" },
            { icon: "📝", title: "Register Securely", desc: "Login → Select Event → Confirm Registration", color: "from-purple-100/50 to-transparent dark:from-purple-500/20" },
            { icon: "🎓", title: "Attend & Get Certified", desc: "QR Scan → Attendance Marked → Certificate Generated", color: "from-pink-100/50 to-transparent dark:from-pink-500/20" },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              whileHover={reduceMotion ? {} : { y: -10 }}
              className="group relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-10 border border-gray-200 dark:border-white/10 text-center overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{card.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- BENTO GRID LAYOUT (Why EventMate) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-16 text-center"
        >
          <motion.p variants={fadeUp} className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Why Choose Us</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">Why EventMate?</motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="grid md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]"
        >
          {/* Large Span Card */}
          <motion.div variants={fadeUp} whileHover={{ scale: 0.98 }} className="md:col-span-2 md:row-span-2 relative bg-indigo-50 dark:bg-indigo-600/10 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-indigo-100 dark:border-indigo-500/20 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent dark:from-indigo-600/20 opacity-0 group-hover:opacity-100 transition duration-500"></div>
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-white dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm dark:shadow-none">⚡</div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Lightning Fast</h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">Automated workflows that save hours of manual admin work. No more Excel sheets.</p>
                </div>
                <div className="mt-8">
                  <div className="w-full h-32 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                    <span className="text-4xl">⚡</span>
                  </div>
                </div>
             </div>
          </motion.div>

          {/* Standard Card 1 */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all">
             <div className="w-12 h-12 bg-white dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl mb-4 shadow-sm dark:shadow-none">🔐</div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Secure Access</h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Role-based protection ensures data stays safe.</p>
          </motion.div>

          {/* Standard Card 2 */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all">
             <div className="w-12 h-12 bg-white dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl mb-4 shadow-sm dark:shadow-none">🌱</div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Paperless</h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Digital tickets and certificates.</p>
          </motion.div>

          {/* Wide Card at Bottom */}
          <motion.div variants={fadeUp} whileHover={{ y: -5 }} className="md:col-span-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-white/10 dark:to-purple-900/20 backdrop-blur-xl rounded-[2rem] p-8 border border-transparent dark:border-white/10 flex items-center justify-between group">
             <div className="z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to transform your campus?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join 500+ clubs today.</p>
             </div>
             <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition shadow-md dark:shadow-none">
                <ArrowRight />
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- UPCOMING EVENTS --- */}
      <section id="events" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={stagger} className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Upcoming Events</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </div>

            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-4 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 border ${
                  selectedCategory === cat
                    ? "bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                    : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredEvents.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
              <p className="text-xl text-gray-500 dark:text-gray-400">No events found matching your search.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                variants={fadeUp}
                whileHover={reduceMotion ? {} : { y: -10 }}
                className="group relative bg-white dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-500 shadow-xl dark:shadow-none"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className={`absolute top-6 right-6 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg backdrop-blur-md ${
                    event.price === "Free" ? "bg-emerald-600" : "bg-indigo-600"
                  }`}>
                    {event.price}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                    {event.category}
                  </span>

                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 text-sm leading-relaxed">
                    {event.description}
                  </p>

                  <div className="space-y-3 mb-8 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center"><CalendarIcon /> {event.date} • {event.time}</div>
                    <div className="flex items-center"><MapPinIcon /> {event.location}</div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => handleRegister(event.title)}
                      className="flex-1 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition duration-300"
                    >
                      Register
                    </button>

                    <Link
                      to={event.link || "#"}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-center hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
                    >
                      Details <ArrowRight />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.h2 initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-4xl md:text-5xl font-black text-center mb-16 text-gray-900 dark:text-white">
          Everything you need to run events
        </motion.h2>

        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={stagger} className="grid md:grid-cols-3 gap-8">
          {[
            { icon: "📱", title: "QR Check-in", desc: "Fast, contactless attendance marking with real-time sync." },
            { icon: "🏆", title: "Instant Certificates", desc: "Auto-generated digital certificates after feedback." },
            { icon: "📊", title: "Real-time Analytics", desc: "Track registrations and attendance instantly." },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={reduceMotion ? {} : { y: -6 }}
              className="bg-gray-50 dark:bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-lg dark:shadow-none"
            >
              <div className="text-5xl mb-6">{f.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">Get in Touch</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Need to talk to us? Send us a message.</p>
          </motion.div>
          <ContactUs />
        </div>
      </section>                                                                                                                     

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes marquee {
          to { transform: translateX(-50%); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .animate-gradient {
          animation: gradient 5s ease infinite;
          background-size: 200% auto;
        }
        @keyframes auroraShift {
          0%, 100% { transform: translate3d(-4%, -2%, 0) scale(1); }
          50% { transform: translate3d(4%, 2%, 0) scale(1.05); }
        }
        @keyframes orbit {
          to { transform: rotate(360deg); }
        }
        @keyframes spark {
          0%, 100% { opacity: 0.4; transform: translateX(84px) scale(0.8); }
          50% { opacity: 1; transform: translateX(92px) scale(1); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -18px, 0); }
        }
        @keyframes starDrift {
          to { background-position: 200px 200px, -120px 160px; }
        }
        @keyframes beamSweep {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); opacity: 0.5; }
          50% { transform: translate3d(0, 40px, 0) rotate(2deg); opacity: 0.8; }
        }
        .preloader-aurora {
          background:
            radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 55%),
            radial-gradient(circle at 80% 30%, rgba(236,72,153,0.25), transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(168,85,247,0.25), transparent 55%);
          filter: blur(20px);
          animation: auroraShift 10s ease-in-out infinite;
        }
        .preloader-noise {
          background-image: radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px);
          background-size: 3px 3px;
          opacity: 0.12;
          mix-blend-mode: overlay;
        }
        .preloader-sweep {
          background: linear-gradient(120deg, transparent 10%, rgba(99,102,241,0.25), rgba(236,72,153,0.2), transparent 80%);
          opacity: 0.6;
        }
        .preloader-halo {
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(99,102,241,0.35), transparent 65%);
          filter: blur(18px);
        }
        .preloader-ring {
          border-radius: 9999px;
          border: 1px solid rgba(99,102,241,0.35);
          box-shadow: 0 0 40px rgba(99,102,241,0.25);
        }
        .preloader-orbit {
          position: absolute;
          inset: 0;
          animation: orbit 10s linear infinite;
        }
        .preloader-spark {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(99,102,241,0.9), rgba(236,72,153,0.8));
          transform: rotate(calc(var(--i) * 30deg)) translateX(84px);
          animation: spark 2.4s ease-in-out infinite;
          animation-delay: calc(var(--i) * -0.2s);
          box-shadow: 0 0 16px rgba(99,102,241,0.6);
        }
        .preloader-core {
          position: relative;
          width: 112px;
          height: 112px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9), rgba(255,255,255,0.05));
          box-shadow: 0 18px 45px rgba(99,102,241,0.3);
          backdrop-filter: blur(6px);
        }
        .preloader-core::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 36px;
          border: 1px solid rgba(99,102,241,0.35);
          box-shadow: 0 0 28px rgba(236,72,153,0.2);
          opacity: 0.75;
        }
        .preloader-logo {
          width: 92px;
          height: 92px;
          object-fit: contain;
          filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.35))
            drop-shadow(0 0 20px rgba(99, 102, 241, 0.35));
        }
        .preloader-bar {
          background: linear-gradient(90deg, rgba(99,102,241,0.9), rgba(236,72,153,0.9));
        }
        .hero-spotlight {
          position: absolute;
          border-radius: 9999px;
          filter: blur(40px);
          opacity: 0.65;
          animation: heroFloat 14s ease-in-out infinite;
        }
        .hero-spotlight--one {
          width: 420px;
          height: 420px;
          top: -120px;
          left: 8%;
          background: radial-gradient(circle, rgba(99,102,241,0.45), transparent 70%);
          animation-delay: -4s;
        }
        .hero-spotlight--two {
          width: 520px;
          height: 520px;
          bottom: -200px;
          right: 5%;
          background: radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%);
          animation-delay: -6s;
        }
        .hero-spotlight--three {
          width: 360px;
          height: 360px;
          top: 30%;
          right: 18%;
          background: radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%);
          animation-delay: -2s;
        }
        .hero-stars {
          position: absolute;
          inset: 0;
          opacity: 0.35;
          background-image:
            radial-gradient(rgba(99,102,241,0.45) 1px, transparent 1px),
            radial-gradient(rgba(236,72,153,0.35) 1px, transparent 1px);
          background-size: 140px 140px, 220px 220px;
          background-position: 0 0, 80px 100px;
          mix-blend-mode: screen;
          animation: starDrift 30s linear infinite;
        }
        .hero-beam {
          position: absolute;
          left: -10%;
          right: -10%;
          top: -30%;
          height: 280px;
          background: linear-gradient(120deg, rgba(99,102,241,0.18), rgba(236,72,153,0.2), transparent 70%);
          filter: blur(40px);
          animation: beamSweep 18s ease-in-out infinite;
        }
        .hero-title {
          text-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
        }
        .hero-accent {
          text-shadow: 0 0 30px rgba(99,102,241,0.45);
        }
        .cta-glow {
          box-shadow: 0 20px 40px rgba(99,102,241,0.25);
        }
        .cta-secondary {
          position: relative;
          overflow: hidden;
        }
        .cta-secondary::before {
          content: "";
          position: absolute;
          inset: -60%;
          background: radial-gradient(circle, rgba(99,102,241,0.2), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .cta-secondary:hover::before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
