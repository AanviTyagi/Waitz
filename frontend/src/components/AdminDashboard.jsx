import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaSignOutAlt, FaBullhorn, FaCheckDouble, FaUserCircle, FaKeyboard, FaChair, FaSpinner } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const socket = io('/', { transports: ['websocket'] });

const AdminDashboard = () => {
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [nextToken, setNextToken] = useState(null);
  const [resource, setResource] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  
  // New States
  const [activeTab, setActiveTab] = useState('live'); // live | history
  const [history, setHistory] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  
  const { addToast } = useToast();

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userType = localStorage.getItem('userType');

  // Refs
  const profileRef = useRef();
  const mainContentRef = useRef();
  const nextTokenRef = useRef();
  const resourceInputRef = useRef();


  useEffect(() => {
    if (!user || userType !== 'admin') {
      navigate('/auth/admin');
      return;
    }
    fetchQueues();
  }, []);

  useEffect(() => {
      if(activeTab === 'history' && selectedQueue) {
          fetchHistory();
      }
  }, [activeTab, selectedQueue]);

  // Animations
  useGSAP(() => {
    if(showProfile && profileRef.current) {
        gsap.fromTo(profileRef.current, { opacity: 0, scale: 0.9, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
    }
  }, [showProfile]);

  useGSAP(() => {
    if(mainContentRef.current) {
        gsap.fromTo(mainContentRef.current, { opacity: 0, x: activeTab === 'live' ? -20 : 20 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" });
    }
  }, [activeTab]);

  useGSAP(() => {
    if(nextToken && nextTokenRef.current) {
        gsap.fromTo(nextTokenRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.6)" });
    }
  }, [nextToken]);
  
  useGSAP(() => {
      if(selectedQueue && resourceInputRef.current) {
          gsap.fromTo(resourceInputRef.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3 });
      }
  }, [selectedQueue]);


  const fetchQueues = async () => {
    try {
        const res = await axios.get('/api/queues');
        const allQueues = res.data;
        setQueues(allQueues);
        if (user.department) {
            const myQueue = allQueues.find(q => q.name.includes(user.department) || q.name === user.department);
            if(myQueue) setSelectedQueue(myQueue);
        }
    } catch (e) { addToast('Failed to load queues', 'error'); }
  };

  const fetchHistory = async () => {
      if(!selectedQueue) return;
      try {
          const res = await axios.get(`/api/admin/history/${selectedQueue._id}`);
          setHistory(res.data);
      } catch (e) { addToast('Failed to fetch history', 'error'); }
  }

  const callNext = async () => {
    if (!selectedQueue) {
        addToast('Please select a queue first', 'error');
        return;
    }
    setIsCalling(true);
    try {
      const res = await axios.post('/api/admin/call-next', { 
          queueId: selectedQueue._id,
          assignedResource: resource 
      });
      setNextToken(res.data.token);
      setResource(''); 
      addToast(`Called Token ${res.data.token.displayToken}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error calling next', 'error');
    } finally {
      setIsCalling(false);
    }
  };

  const markComplete = async () => {
      if(!nextToken) return;
      try {
          await axios.post('/api/admin/complete', { tokenId: nextToken._id });
          setNextToken(null);
          addToast('Token marked as completed', 'success');
          if(activeTab === 'history') fetchHistory(); // Refresh if looking at history
      } catch (err) {
          console.error(err);
          addToast('Action failed', 'error');
      }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
       {/* Navbar */}
       <header className="sticky top-0 z-40 px-6 py-4">
         <div className="glass rounded-2xl max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                    A
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none">Staff Portal</h1>
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
                        {user?.department || 'General'}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                 {/* Tabs */}
                 <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
                      <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'live' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Live Console</button>
                      <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>History</button>
                 </div>

                 <div className="relative">
                    <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-400">Admin</p>
                        </div>
                        <FaUserCircle className="text-3xl text-gray-300" />
                    </button>
                    
                    {/* Profile Modal */}
                    {showProfile && (
                        <div 
                            ref={profileRef}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-40 origin-top-right"
                        >
                            <div className="text-center pb-4 border-b border-gray-100 mb-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl text-gray-300">
                                    <FaUserCircle />
                                </div>
                                <h3 className="font-bold text-lg">{user?.name}</h3>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                            <div className="space-y-2">
                                    <div className="flex justify-between text-sm py-2 px-2 hover:bg-gray-50 rounded">
                                        <span className="text-gray-500">Department</span>
                                        <span className="font-semibold">{user?.department || 'N/A'}</span>
                                    </div>
                                    <button 
                                    onClick={() => { localStorage.clear(); navigate('/'); }} 
                                    className="w-full mt-2 bg-red-50 text-red-600 font-bold py-2 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
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

       <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-20">
           {activeTab === 'live' ? (
                <div 
                    ref={mainContentRef}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full"
                >
                    {/* Controls Panel */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="glass rounded-[2rem] p-8">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-1.5 rounded-full bg-indigo-500"></span> Controls
                            </h2>
                            
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Active Counter</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-4 bg-white/50 border border-white/40 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-slate-700 appearance-none shadow-sm"
                                        value={selectedQueue?._id || ''}
                                        onChange={(e) => setSelectedQueue(queues.find(q => q._id === e.target.value))}
                                    >
                                        <option value="">Select Counter...</option>
                                        {queues.map(q => <option key={q._id} value={q._id}>{q.name}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>

                            {selectedQueue && (
                                <div ref={resourceInputRef} className="overflow-hidden">
                                    <div className="mb-6">
                                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            {selectedQueue.name === 'Lab' ? 'Assign PC No.' : selectedQueue.name === 'Library' ? 'Locker No.' : 'Assign Resource'}
                                         </label>
                                         <div className="relative">
                                             <div className="absolute top-3 left-4 text-gray-400"><FaChair /></div>
                                             <input 
                                                 type="text" 
                                                 className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                 placeholder="Resource ID (Optional)"
                                                 value={resource}
                                                 onChange={e => setResource(e.target.value)}
                                             />
                                         </div>
                                    </div>
                                    
                                    <button 
                                        onClick={callNext}
                                        disabled={isCalling}
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition flex justify-center items-center gap-2 text-lg"
                                    >
                                        {isCalling ? <FaSpinner className="animate-spin" /> : <><FaBullhorn /> Call Next</>}
                                    </button>
                                </div>
                            )}

                            {/* Canteen Settings (Menu Toggle) */}
                            {(selectedQueue && (selectedQueue.name.includes('Canteen') || selectedQueue.name.includes('Stationary'))) && (
                                <div className="mt-8 border-t border-slate-200 pt-6">
                                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">Menu Availability</h3>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedQueue.menu?.map(item => (
                                            <div key={item.name} className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/50">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-slate-700">{item.name}</span>
                                                    <span className="text-xs text-slate-400">{item.category}</span>
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post('/api/queue/menu/toggle', { 
                                                                queueId: selectedQueue._id, 
                                                                itemName: item.name, 
                                                                isAvailable: !item.isAvailable 
                                                            });
                                                            fetchQueues(); // Refresh
                                                        } catch(e) { addToast('Error updating menu', 'error'); }
                                                    }}
                                                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${item.isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        ))}
                                        {(!selectedQueue.menu || selectedQueue.menu.length === 0) && (
                                            <div className="text-xs text-slate-400 text-center italic">No menu items configured.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedQueue && (
                            <div className="rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
                                <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:scale-110 transition duration-700">
                                    <FaCheckDouble className="text-9xl text-white" />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="font-bold opacity-80 mb-2">{selectedQueue.name} Stats</h3>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-5xl font-black tracking-tighter">{selectedQueue.currentNumber || 0}</div>
                                            <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Last Called</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-3 py-1 bg-white/20 rounded-lg text-sm font-bold backdrop-blur-sm border border-white/10">
                                                {queues.find(q => q._id === selectedQueue._id)?.isActive ? 'Online' : 'Offline'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Display Panel */}
                    <div className="md:col-span-8">
                        {(selectedQueue && (selectedQueue.name.includes('Canteen') || selectedQueue.name.includes('Stationary'))) ? (
                            <CanteenOrderManager selectedQueue={selectedQueue} />
                        ) : (
                            /* Standard Queue Display */
                            <div className="glass rounded-[2rem] p-12 h-[600px] flex flex-col items-center justify-center relative overflow-hidden text-center group">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                                
                                {nextToken ? (
                                    <div className="relative z-10 w-full max-w-xl">
                                        <div ref={nextTokenRef} className="mb-10">
                                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-sm tracking-widest uppercase mb-8 border border-emerald-500/20">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Serving Now
                                            </div>
                                            <div className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-400 drop-shadow-2xl select-none tracking-tighter">
                                                {nextToken.displayToken}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/50 mb-10 grid grid-cols-2 gap-8 text-left shadow-lg">
                                             <div>
                                                 <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Name</label>
                                                 <p className="font-black text-xl text-slate-800 mt-1">{nextToken.userName}</p>
                                             </div>
                                             <div>
                                                 <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Roll No</label>
                                                 <p className="font-black text-xl text-slate-800 mt-1">{nextToken.rollNo}</p>
                                             </div>
                                             
                                             {(nextToken.requirements?.category || nextToken.requirements?.needPc) && (
                                                 <div className="col-span-2 pt-6 border-t border-slate-200/50 mt-2">
                                                     <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Requirements</label>
                                                     <div className="flex flex-wrap gap-3 mt-3">
                                                         {nextToken.requirements.needPc && (
                                                             <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 shadow-sm">💻 Needs PC</span>
                                                         )}
                                                         {nextToken.requirements.category && (
                                                             <span className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold border border-orange-100 shadow-sm">🍽 {nextToken.requirements.category} • {nextToken.requirements.details}</span>
                                                         )}
                                                     </div>
                                                 </div>
                                             )}
                                        </div>

                                        <button 
                                            onClick={markComplete}
                                            className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3"
                                        >
                                            <FaCheckDouble /> Mark as Completed
                                        </button>
                                    </div>
                                 ) : (
                                     <div className="text-center text-slate-300">
                                         <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mx-auto mb-8 text-7xl shadow-xl shadow-indigo-500/5 ring-4 ring-white">
                                             ☕
                                         </div>
                                         <h3 className="text-3xl font-black text-slate-300">No Active Token</h3>
                                         <p className="max-w-xs mx-auto mt-4 text-slate-400 font-medium">Select a counter from the left and call the next token to start serving.</p>
                                     </div>
                                 )}
                            </div>
                        )}
                    </div>
                </div>
           ) : (
               <div 
                    ref={mainContentRef}
                    className="glass rounded-[2rem] shadow-sm border border-white/50 p-6 min-h-[600px]"
               >
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-slate-800">History Log</h2>
                       <button onClick={fetchHistory} className="text-indigo-600 font-bold hover:underline">Refresh</button>
                   </div>
                   
                   {!selectedQueue ? (
                       <div className="text-center py-20 text-slate-400">Please select a counter first.</div>
                   ) : (
                       <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                               <thead>
                                   <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                                       <th className="pb-4 pl-4">Token</th>
                                       <th className="pb-4">Student</th>
                                       <th className="pb-4">Served At</th>
                                       <th className="pb-4">Completed At</th>
                                       <th className="pb-4">Status</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {history.map((h) => (
                                       <tr key={h._id} className="hover:bg-indigo-50/50 transition duration-200">
                                           <td className="py-4 pl-4 font-black text-slate-800">{h.displayToken}</td>
                                           <td className="py-4">
                                               <div className="font-bold text-slate-700">{h.userName}</div>
                                               <div className="text-xs text-slate-400">{h.rollNo}</div>
                                           </td>
                                           <td className="py-4 text-sm text-slate-500">{h.servedAt ? new Date(h.servedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                           <td className="py-4 text-sm text-slate-500">{h.completedAt ? new Date(h.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                           <td className="py-4">
                                               <span className={`px-3 py-1 rounded-full text-xs font-bold border ${h.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                   {h.status}
                                               </span>
                                           </td>
                                       </tr>
                                   ))}
                                   {history.length === 0 && (
                                       <tr>
                                           <td colSpan="5" className="text-center py-10 text-slate-400">No history found for this session.</td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   )}
               </div>
           )} 
       </main>
    </div>
  );
};

const CanteenOrderManager = ({ selectedQueue }) => {
    const [orders, setOrders] = useState([]);
    const { addToast } = useToast();

    useEffect(() => {
        fetchOrders();
        // Setup specialized listener
        socket.on('queue_updated', () => fetchOrders());
        return () => { socket.off('queue_updated'); };
    }, [selectedQueue]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`/api/queue/${selectedQueue._id}/active-orders`);
            setOrders(res.data);
        } catch (e) { }
    };

    const updateStatus = async (tokenId, status) => {
        try {
            await axios.post('/api/token/update-status', { tokenId, status });
            fetchOrders();
            addToast(`Order marked as ${status}`, 'success');
        } catch (e) { addToast('Update failed', 'error'); }
    };

    const waiting = orders.filter(o => o.status === 'waiting');
    const preparing = orders.filter(o => o.status === 'serving');
    const ready = orders.filter(o => o.status === 'ready');

    return (
        <div className="h-full grid grid-cols-3 gap-6">
            <OrderColumn title="New Orders" orders={waiting} color="blue" actionLabel="Accept" onAction={(id) => updateStatus(id, 'serving')} />
            <OrderColumn title="Cooking / Preparing" orders={preparing} color="orange" actionLabel="Mark Ready" onAction={(id) => updateStatus(id, 'ready')} />
            <OrderColumn title="Ready for Pickup" orders={ready} color="emerald" actionLabel="Complete" onAction={(id) => updateStatus(id, 'completed')} />
        </div>
    );
};

const OrderColumn = ({ title, orders, color, actionLabel, onAction }) => {
    const styles = {
        blue: { border: 'border-blue-500', text: 'text-blue-600', btn: 'bg-blue-500 shadow-blue-500/20' },
        orange: { border: 'border-orange-500', text: 'text-orange-600', btn: 'bg-orange-500 shadow-orange-500/20' },
        emerald: { border: 'border-emerald-500', text: 'text-emerald-600', btn: 'bg-emerald-500 shadow-emerald-500/20' }
    };
    const s = styles[color];

    return (
        <div className={`glass rounded-2xl p-4 flex flex-col h-[600px] border-t-4 ${s.border}`}>
            <h3 className={`font-bold text-lg mb-4 ${s.text} flex items-center gap-2`}>
                {title} <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm border border-white/20">{orders.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {orders.map(order => (
                    <div key={order._id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-2xl text-slate-800">{order.displayToken}</span>
                            <span className="text-xs font-mono text-slate-400">{new Date(order.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="mb-3">
                            <p className="font-bold text-sm text-slate-700">{order.requirements?.category || "Order"}</p>
                            <p className="text-xs text-slate-500">{order.requirements?.details || "Standard Item"}</p>
                            <p className="text-xs text-slate-400 mt-1">{order.userName}</p>
                        </div>
                        <button 
                            onClick={() => onAction(order._id)}
                            className={`w-full py-2 rounded-lg font-bold text-sm text-white transition hover:scale-[1.02] active:scale-[0.95] shadow-lg ${s.btn}`}
                        >
                            {actionLabel}
                        </button>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div className="text-center py-10 opacity-30 text-slate-500 italic">No orders</div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
