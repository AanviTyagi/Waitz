import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FaUserGraduate, FaUserTie, FaArrowRight } from 'react-icons/fa';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ToastProvider } from './context/ToastContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/student" element={<Auth type="student" />} />
            <Route path="/auth/admin" element={<Auth type="admin" />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </ToastProvider>
    </Router>
  );
}

const Home = () => {
    const containerRef = useRef();
    const blob1Ref = useRef();
    const blob2Ref = useRef();
    const titleRef = useRef();
    const cardsRef = useRef();

    useGSAP(() => {
        // Blobs Animation
        gsap.to(blob1Ref.current, {
            scale: 1.2,
            opacity: 0.5,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        gsap.to(blob2Ref.current, {
            scale: 1.1,
            opacity: 0.5,
            duration: 5,
            delay: 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Entrance
        const tl = gsap.timeline();
        tl.fromTo(titleRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" })
          .fromTo(cardsRef.current.children, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.7)" }, "-=0.5");

    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#0F172A] text-white p-6 selection:bg-indigo-500 selection:text-white">
            {/* Background Circles */}
            <div 
               ref={blob1Ref}
               className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[120px] opacity-40 mix-blend-screen" 
            />
            <div 
               ref={blob2Ref}
               className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] opacity-40 mix-blend-screen" 
            />

            <div ref={titleRef} className="z-10 text-center mb-16 op-0 relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[80px] opacity-50"></div>
                <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-2xl">
                    Waitz<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Campus</span>
                </h1>
                <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
                    The smart way to manage campus queues. Join virtually, track in real-time.
                </p>
            </div>

            <div ref={cardsRef} className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                <Link to="/auth/student">
                    <HomeCard 
                        icon={<FaUserGraduate className="text-5xl text-indigo-400" />}
                        title="Student / Visitor"
                        desc="Join queues, track status, and save time."
                        action="Get Started"
                        colorClass="glass-dark hover:bg-white/5 border-white/10"
                        accentClass="bg-indigo-500/20 ring-1 ring-indigo-500/40"
                        textClass="text-indigo-300"
                    />
                </Link>

                <Link to="/auth/admin">
                    <HomeCard 
                        icon={<FaUserTie className="text-5xl text-purple-400" />}
                        title="Staff / Admin"
                        desc="Manage counters and optimize flow efficiently."
                        action="Staff Login"
                        colorClass="glass-dark hover:bg-white/5 border-white/10"
                        accentClass="bg-purple-500/20 ring-1 ring-purple-500/40"
                        textClass="text-purple-300"
                    />
                </Link>
            </div>
            
            <div className="absolute bottom-6 text-slate-500 text-sm font-medium tracking-wide">
                © {new Date().getFullYear()} Waitz Campus Solutions
            </div>
        </div>
    );
};

const HomeCard = ({ icon, title, desc, action, colorClass, accentClass, textClass }) => {
    const cardRef = useRef();

    useGSAP(() => {
        const el = cardRef.current;
        if(el) {
            const onEnter = () => gsap.to(el, { y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", scale: 1.02, duration: 0.3 });
            const onLeave = () => gsap.to(el, { y: 0, boxShadow: "none", scale: 1, duration: 0.3 });
            
            el.addEventListener('mouseenter', onEnter);
            el.addEventListener('mouseleave', onLeave);
            
            return () => {
                el.removeEventListener('mouseenter', onEnter);
                el.removeEventListener('mouseleave', onLeave);
            };
        }
    }, []);

    return (
        <div 
            ref={cardRef}
            className={`flex flex-col items-center p-10 rounded-[2.5rem] cursor-pointer transition-all duration-300 border backdrop-blur-xl group ${colorClass}`}
        >
            <div className={`p-6 rounded-2xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${accentClass}`}>
                {icon}
            </div>
            <div className="text-3xl font-bold mb-3 tracking-tight">{title}</div>
            <p className="text-slate-400 text-center mb-8 text-lg font-light leading-relaxed">{desc}</p>
            <div className={`flex items-center gap-3 font-bold uppercase tracking-wider text-sm ${textClass}`}>
                {action} <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
}

export default App;
