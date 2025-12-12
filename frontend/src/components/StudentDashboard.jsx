import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { 
  FaSignOutAlt, FaTicketAlt, FaCheckCircle, 
  FaHistory, FaTrashAlt, FaClock, FaUtensils, 
  FaBook, FaMicroscope, FaPenNib, FaTheaterMasks, FaBell,
  FaWalking, FaUserAlt
} from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Enhanced styles and icons
const socket = io('/', { transports: ['websocket'] });


const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { addToast } = useToast();
  
  // State
  const [queues, setQueues] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  
  // Specific Form States
  const [needPc, setNeedPc] = useState(false);
  const [cart, setCart] = useState([]); // Array of { name, price, qty, prepTime }
  const [currentCategory, setCurrentCategory] = useState('Snacks'); // For menu navigation

  // Profile Modal State
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef();

  // UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, canteen, lab, library, stationary

  // Refs
  const containerRef = useRef();
  const walkingManRef = useRef();

  useGSAP(() => {
    // Reveal Container content when tab changes
    if(containerRef.current) {
        gsap.fromTo(containerRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  }, [activeTab]);

  useGSAP(() => {
      if(showProfile && profileRef.current) {
          gsap.fromTo(profileRef.current, { opacity: 0, scale: 0.9, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
      }
  }, [showProfile]);

  useGSAP(() => {
    // Walking Man Animation
    if(walkingManRef.current) {
        // If serving, walk across
        if(myTokens.some(t => t.status === 'serving')) {
             gsap.to(walkingManRef.current, {
                 x: 200,
                 duration: 3,
                 repeat: -1,
                 ease: "linear"
             });
        } else {
             // If waiting, just pace a bit or pulse
             gsap.fromTo(walkingManRef.current, 
                 { x: 0, opacity: 0.5 },
                 { x: 50, opacity: 0.5, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" }
             );
        }
    }
  }, [myTokens]);


  useEffect(() => {
    if (!user || localStorage.getItem('userType') !== 'student') {
      navigate('/auth/student');
      return;
    }
    fetchQueues();
    fetchHistory();
    
    socket.on('queue_updated', () => fetchHistory());
    socket.on('token_called', (data) => {
        // Find if it's my token
        if(data.studentId === user.id) {
            addToast(`Your token ${data.displayToken} for ${data.queueName} is called!`, 'success');
        }
    }); 

    return () => {
        socket.off('queue_updated');
        socket.off('token_called');
    };
  }, []);

  const fetchQueues = () => axios.get('/api/queues').then(res => setQueues(res.data));
  const fetchHistory = () => {
      if(user) axios.get(`/api/student/history/${user.id}`).then(res => setMyTokens(res.data));
  }

  const generateToken = async () => {
    if (!selectedQueue) return;
    
    // Robustly get user ID
    const studentId = user?.id || user?._id;
    if (!studentId) {
        addToast('Invalid session. Please logout and login again.', 'error');
        return;
    }
    
    let reqs = {};
    if (selectedQueue.name === 'Lab') reqs.needPc = needPc;
    // Basic catch-all for orders for now
    if (selectedQueue.name.includes('Canteen') || selectedQueue.name === 'Stationary Shop') {
        if (cart.length === 0) {
            addToast('Please add items to your cart first.', 'error');
            return;
        }
        // Transform cart to orderItems
        // We need to send { name, qty } - backend will lookup price/prepTime, 
        // OR we send full data if trusted. Backend validation recommended.
        // Let's send simple:
        reqs = { category: 'Order', details: `${cart.length} Items` }; 
    }

    try {
      const res = await axios.post('/api/token/generate', {
        queueId: selectedQueue._id,
        studentId: studentId,
        requirements: reqs,
        orderItems: cart.map(i => ({ name: i.name, qty: i.qty }))
      });
      fetchHistory();
      setSelectedQueue(null);
      setCart([]); // Reset
      setActiveTab('dashboard'); 
      addToast(`Token ${res.data.token.displayToken} Generated Successfully!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error generating token', 'error');
    }
  };
  
  const cancelToken = async (tokenId) => {
      // Direct cancellation without blocking alert
      try {
          await axios.post('/api/token/cancel', { tokenId });
          fetchHistory();
          addToast('Token cancelled successfully.', 'success'); 
      } catch (err) { addToast(err.response?.data?.message || "Failed to cancel", 'error'); }
  };

  // Helper to get Icon based on name
  const getIcon = (name) => {
      if(name.includes('Canteen')) return <FaUtensils />;
      if(name.includes('Lab')) return <FaMicroscope />;
      if(name.includes('Library')) return <FaBook />;
      if(name.includes('Stationary')) return <FaPenNib />;
      if(name.includes('Auditorium')) return <FaTheaterMasks />;
      return <FaTicketAlt />;
  }

  // --- SUB-COMPONENTS ---

  // 1. Sidebar (Floating Glass)
  const Sidebar = () => (
      <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
          <div className="glass p-3 rounded-2xl flex flex-col items-center gap-6 shadow-xl border border-white/40">
            <div className="text-3xl font-black bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent p-2">Q</div>
            
            <div className="flex flex-col gap-3">
                <SideIcon icon={<FaUserAlt />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard" />
                <SideIcon icon={<FaUtensils />} active={activeTab === 'canteen'} onClick={() => setActiveTab('canteen')} tooltip="Food" />
                <SideIcon icon={<FaBook />} active={activeTab === 'library'} onClick={() => setActiveTab('library')} tooltip="Library" />
                <SideIcon icon={<FaMicroscope />} active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} tooltip="Labs" />
                <SideIcon icon={<FaPenNib />} active={activeTab === 'stationary'} onClick={() => setActiveTab('stationary')} tooltip="Stationary" />
            </div>

            <div className="w-8 h-[1px] bg-slate-200"></div>

            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all">
                <FaSignOutAlt />
            </button>
          </div>
      </nav>
  );

  const SideIcon = ({ icon, active, onClick, tooltip }) => (
      <button 
        onClick={onClick}
        className={`relative group p-3 rounded-xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'}`}
      >
          <span className="text-xl">{icon}</span>
          <span className="absolute left-14 bg-slate-800 text-white text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none translate-x-2 group-hover:translate-x-0 shadow-lg z-50">
              {tooltip}
          </span>
      </button>
  );

  // 2. Main Content
  return (
    <div className="min-h-screen text-slate-800 font-sans pl-24 md:pl-28 transition-all duration-500">
        <Sidebar />
        
        {/* Top Bar */}
        <header className="sticky top-0 z-30 px-6 py-4">
            <div className="glass rounded-2xl px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                <div>
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        Waitz<span className="font-light text-slate-400">Dashboard</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative w-10 h-10 rounded-xl bg-white/50 hover:bg-white flex items-center justify-center transition hover-lift">
                        <FaBell className="text-slate-500" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full"></span>
                    </button>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative">
                         <button 
                            onClick={() => setShowProfile(!showProfile)} 
                            className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer"
                         >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-700">{user?.name}</p>
                                <p className="text-xs text-slate-400 font-medium">Student</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-indigo-700 font-bold text-lg">
                                    {user?.name?.[0]}
                                </div>
                            </div>
                         </button>

                         {/* Profile Dropdown */}
                         {showProfile && (
                            <div 
                                ref={profileRef}
                                className="absolute right-0 top-full mt-4 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 origin-top-right"
                            >
                                <div className="text-center pb-4 border-b border-slate-50 mb-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl text-slate-300">
                                        {user?.name?.[0]}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800">{user?.name}</h3>
                                    <p className="text-sm text-slate-400">{user?.email}</p>
                                </div>
                                <div className="space-y-2">
                                     <div className="flex justify-between text-sm py-2 px-2 hover:bg-slate-50 rounded text-slate-600">
                                         <span>Roll No</span>
                                         <span className="font-bold text-slate-800">{user?.rollNo || 'N/A'}</span>
                                     </div>
                                     <div className="flex justify-between text-sm py-2 px-2 hover:bg-slate-50 rounded text-slate-600">
                                         <span>Wallet</span>
                                         <span className="font-bold text-emerald-600">₹{user?.walletBalance || 500}</span>
                                     </div>
                                     <button 
                                        onClick={() => { localStorage.clear(); navigate('/'); }} 
                                        className="w-full mt-2 bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2"
                                     >
                                        <FaSignOutAlt /> Sign Out
                                     </button>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto pb-20">
            
            {/* --- DASHBOARD VIEW --- */}
            {activeTab === 'dashboard' && (
                <div ref={containerRef} className="space-y-8">
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Active Tokens" 
                            value={myTokens.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length} 
                            icon={<FaTicketAlt />} 
                            gradient="from-blue-500 to-cyan-400"
                        />
                        <StatCard 
                            title="Estimated Wait" 
                            value={myTokens.length > 0 ? "12 mins" : "0 mins"} 
                            icon={<FaClock />} 
                            gradient="from-emerald-500 to-teal-400"
                        />
                        <StatCard 
                            title="Open Services" 
                            value={queues.filter(q => q.isActive).length} 
                            icon={<FaBuildingIcon />} 
                            gradient="from-orange-500 to-amber-400"
                        />
                         <StatCard 
                            title="Wallet Balance" 
                            value={`₹${user.walletBalance || 500}`} 
                            icon={<FaHistory />} 
                            gradient="from-purple-500 to-pink-500"
                        />
                    </div>

                    {/* Active Queue Animation Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Live Status Card - Main Hero */}
                        <div className="lg:col-span-2 bg-white rounded-[2rem] p-1 shadow-xl border border-white/50 relative overflow-hidden group">
                             <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2e] to-[#2d325a] z-0"></div>
                             {/* Decorative glow */}
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                             
                             <div className="relative z-10 p-8 h-full flex flex-col">
                                 <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">Live Status</h2>
                                        <p className="text-indigo-200 text-sm">Real-time queue tracking</p>
                                    </div>
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Online
                                    </span>
                                </div>


                            {/* Walking Animation Stage */}
                            <div className="h-40 bg-white/5 rounded-2xl mb-8 relative overflow-hidden flex items-end pb-4 px-8 border border-white/10">
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] w-full h-full"></div>
                                
                                <div ref={walkingManRef} className="text-5xl text-white z-10 relative drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                    {myTokens.some(t => t.status === 'serving') ? <FaWalking className="text-emerald-400" /> : <FaUserAlt />}
                                </div>

                                <div className="ml-auto flex gap-3 opacity-80">
                                     {[1,2,3].map(i => (
                                        <div key={i} className={`w-12 h-24 rounded-t-lg border-b-4 ${i===1 ? 'bg-indigo-500/30 border-indigo-400' : 'bg-slate-700/50 border-slate-600'}`}></div>
                                     ))}
                                </div>
                                <div className="absolute top-4 left-4 text-xs font-mono text-indigo-300/80">
                                    {myTokens.some(t => t.status === 'serving') ? ">> YOUR TURN <<" : ">> WAITING IN QUEUE..."}
                                </div>
                            </div>
                            
                            {/* My Tokens List */}
                            <div className="space-y-3">
                                {myTokens.length > 0 ? (
                                    myTokens.map(token => (
                                        <TokenCard key={token._id} token={token} onCancel={() => cancelToken(token._id)} />
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-indigo-200/50 border-2 dashed border-white/10 rounded-xl">
                                        <p>No active tokens found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                        {/* Quick Actions / Menu Preview */}
                        <div className="glass rounded-[2rem] p-8 h-fit">
                             <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                                Quick Join
                             </h3>
                             <div className="space-y-4">
                                 {queues.slice(0, 4).map(q => (
                                     <button 
                                        key={q._id}
                                        onClick={() => { setSelectedQueue(q); setActiveTab('generator'); }} 
                                        className="w-full flex items-center justify-between p-4 bg-white/50 hover:bg-white rounded-2xl transition-all duration-300 group hover:shadow-lg hover:shadow-indigo-500/10 border border-transparent hover:border-indigo-100"
                                    >
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                 {getIcon(q.name)}
                                             </div>
                                             <div className="text-left">
                                                 <p className="font-bold text-slate-800">{q.name}</p>
                                                 <p className="text-xs text-slate-500 font-medium">{q.category}</p>
                                             </div>
                                         </div>
                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition">
                                             +
                                         </div>
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- GENERATOR / SPECIFIC TAB VIEW --- */}
            {activeTab !== 'dashboard' && (
                <div ref={containerRef}>
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setActiveTab('dashboard')} className="text-gray-400 hover:text-gray-800">Back</button>
                        <h2 className="text-2xl font-bold capitalize">{activeTab === 'generator' ? selectedQueue?.name : activeTab}</h2>
                    </div>
                    
                    {/* Placeholder for now - normally would filter based on tab */}
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <p className="text-gray-500 mb-6">
                            {(activeTab === 'generator' && selectedQueue) ? 
                                `Generate a token for ${selectedQueue.name}.` : 
                                "Select a queue to join from the dashboard or quick menu."}
                        </p>
                        
                        {/* If we are in Generator Mode */}
                        {/* If we are in Generator Mode */}
                        {(activeTab === 'generator' && selectedQueue) && (
                            <div className="">

                                {(selectedQueue.name.includes('Canteen') || selectedQueue.name.includes('Stationary')) ? (
                                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                         {/* Menu Selection Side */}
                                         <div className="space-y-6">
                                             {/* Category Tabs */}
                                             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                 {['Snacks', 'Breakfast', 'Dinner/Thali', 'Beverages', 'Packed Items'].map(cat => (
                                                     <button 
                                                        key={cat}
                                                        onClick={() => setCurrentCategory(cat)}
                                                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${currentCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                     >
                                                         {cat}
                                                     </button>
                                                 ))}
                                             </div>

                                             {/* Menu Items Grid */}
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                 {selectedQueue.menu?.filter(i => i.category === currentCategory && i.isAvailable)?.map(item => (
                                                     <div key={item.name} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                                                         <div>
                                                             <div className="flex justify-between items-start">
                                                                 <h4 className="font-bold text-slate-800">{item.name}</h4>
                                                                 <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">₹{item.price}</span>
                                                             </div>
                                                             <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                                                                 ⏱ ~{item.prepTime || 0} min
                                                             </p>
                                                         </div>
                                                         <button 
                                                             onClick={() => {
                                                                 const existing = cart.find(c => c.name === item.name);
                                                                 if(existing) {
                                                                     setCart(cart.map(c => c.name === item.name ? { ...c, qty: c.qty + 1 } : c));
                                                                 } else {
                                                                     setCart([...cart, { ...item, qty: 1 }]);
                                                                 }
                                                             }}
                                                             className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition"
                                                         >
                                                             Add +
                                                         </button>
                                                     </div>
                                                 ))}
                                                 {selectedQueue.menu?.filter(i => i.category === currentCategory && i.isAvailable).length === 0 && (
                                                     <div className="col-span-2 text-center py-10 text-slate-400 italic">No items available in this category.</div>
                                                 )}
                                             </div>
                                         </div>

                                         {/* Cart / Summary Side */}
                                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col h-full">
                                             <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                                                 Current Order <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{cart.reduce((a,b) => a + b.qty, 0)} Items</span>
                                             </h3>
                                             
                                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                                                 {cart.map(item => (
                                                     <div key={item.name} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                                                         <div>
                                                             <p className="font-bold text-sm text-slate-700">{item.name}</p>
                                                             <p className="text-xs text-slate-400">₹{item.price} x {item.qty}</p>
                                                         </div>
                                                         <div className="flex items-center gap-3">
                                                             <span className="font-bold text-slate-800">₹{item.price * item.qty}</span>
                                                             <button 
                                                                onClick={() => {
                                                                    const newQty = item.qty - 1;
                                                                    if(newQty > 0) {
                                                                         setCart(cart.map(c => c.name === item.name ? { ...c, qty: newQty } : c));
                                                                    } else {
                                                                         setCart(cart.filter(c => c.name !== item.name));
                                                                    }
                                                                }}
                                                                className="w-6 h-6 bg-red-50 text-red-500 rounded flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                                                             >
                                                                 -
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ))}
                                                 {cart.length === 0 && (
                                                     <div className="text-center py-10 text-slate-400 text-sm">Your cart is empty.</div>
                                                 )}
                                             </div>

                                             <div className="border-t border-slate-200 pt-4 space-y-2">
                                                 <div className="flex justify-between text-sm">
                                                     <span className="text-slate-500">Queue Wait Time (Approx)</span>
                                                     <span className="font-bold text-slate-700">{selectedQueue.estimatedWaitTime || 0} min</span>
                                                 </div>
                                                 <div className="flex justify-between text-sm">
                                                     <span className="text-slate-500">Cooking/Packing Time</span>
                                                     <span className="font-bold text-indigo-600">+{cart.reduce((a,b) => a + ((b.prepTime||0)*b.qty), 0)} min</span>
                                                 </div>
                                                 <div className="flex justify-between text-lg font-black text-slate-800 pt-2 border-t border-slate-200/50">
                                                     <span>Total</span>
                                                     <span>₹{cart.reduce((a,b) => a + (b.price*b.qty), 0)}</span>
                                                 </div>
                                                 <p className="text-xs text-slate-400 text-center pb-2">
                                                     Est. Pickup in <span className="font-bold text-slate-800">{(selectedQueue.estimatedWaitTime || 0) + cart.reduce((a,b) => a + ((b.prepTime||0)*b.qty), 0)} mins</span>
                                                 </p>
                                                 
                                                 <button 
                                                     onClick={generateToken}
                                                     disabled={cart.length === 0}
                                                     className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                 >
                                                     Confirm Order
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                ) : (
                                    /* Legacy / Standard Queue Form */
                                    <div className="max-w-md">
                                        {/* ... (Keep existing layout for standard queue) ... */}
                                        <button 
                                            onClick={generateToken} 
                                            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:bg-blue-600 transition"
                                        >
                                            Confirm Token
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* If tab is specific facility without selection */}
                         {!selectedQueue && activeTab !== 'generator' && (
                             <div className="grid grid-cols-2 gap-4">
                                 {queues.filter(q => q.name.toLowerCase().includes(activeTab === 'stationary' ? 'stationary' : activeTab)).map(q => (
                                     <div key={q._id} onClick={() => { setSelectedQueue(q); setActiveTab('generator'); }} className="p-6 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200 transition">
                                         <h3 className="font-bold">{q.name}</h3>
                                         <p className="text-sm text-gray-500">Click to join queue</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                </div>
            )}
            
        </main>
    </div>
  );
};

// --- Sub Comps ---

const StatCard = ({ title, value, icon, gradient }) => {
    const cardRef = useRef();

    return (
        <div ref={cardRef} className="glass p-6 rounded-2xl relative overflow-hidden group hover:shadow-colored transition-all duration-500">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-150 group-hover:opacity-20`}></div>
            
            <div className="relative z-10 flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-xl shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">{title}</p>
                </div>
            </div>
        </div>
    );
}

const TokenCard = ({ token, onCancel }) => {
    const isService = token.status === 'serving';
    const cardRef = useRef();
    
    useGSAP(() => {
        gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.2)" });
    }, []);

    return (
        <div 
            ref={cardRef}
            className={`p-4 rounded-2xl border flex justify-between items-center relative overflow-hidden transition-all duration-300 group
            ${isService 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
        >
             
             <div className="flex items-center gap-5 relative z-10">
                 <div className={`text-3xl font-black tracking-tighter ${isService ? 'text-emerald-400' : 'text-white'}`}>
                     {token.displayToken}
                 </div>
                 <div className="h-10 w-[1px] bg-white/10"></div>
                 <div>
                     <p className={`font-bold text-sm ${isService ? 'text-emerald-300' : 'text-indigo-100'}`}>{token.queueId?.name || "Queue"}</p>
                     <p className="text-xs text-white/50 capitalize font-medium">
                        {token.status === 'serving' && (token.queueId?.name.includes('Canteen') || token.queueId?.name.includes('Stationary')) 
                            ? (token.queueId?.name.includes('Stationary') ? 'Processing / Packing...' : '👨‍🍳 Cooking / Preparing...') 
                            : (token.status === 'ready' ? '🍽 Order Ready!' : token.status)
                        }
                     </p>
                     {token.assignedResource && (
                        <span className="inline-block mt-1 text-[10px] bg-white/10 text-white px-2 py-0.5 rounded border border-white/10">
                            {token.assignedResource}
                        </span>
                     )}
                 </div>
             </div>

             <div className="flex items-center gap-3 relative z-10">
                {token.status === 'waiting' && (
                    <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition">
                        <FaTrashAlt className="text-xs" />
                    </button>
                )}
                 <div className={`w-2 h-2 rounded-full box-shadow-glow ${isService ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-indigo-400 shadow-[0_0_10px_#818cf8]'}`}></div>
             </div>
        </div>
    )
}

// Icon helper
const FaBuildingIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M432 48H80a48 48 0 0 0-48 48v368h448V96a48 48 0 0 0-48-48zM192 400h-64v-64h64zm0-128h-64v-64h64zm128 128h-64v-64h64zm0-128h-64v-64h64z"></path></svg>
);

export default StudentDashboard;
