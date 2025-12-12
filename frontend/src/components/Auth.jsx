import React, { useState, useRef } from 'react';
import AntiGravityBackground from './AntiGravityBackground';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaIdCard, FaBuilding, FaArrowLeft, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useToast } from '../context/ToastContext';

const Auth = ({ type }) => { 
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', rollNo: '', department: '', newPassword: '' 
  });
  
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Refs for GSAP
  const containerRef = useRef();
  const formRef = useRef();
  useGSAP(() => {
    // Main Container Entry
    if(containerRef.current) {
        gsap.fromTo(containerRef.current, 
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 1, ease: "elastic.out(1, 0.5)" }
        );
    }
  }, []);

  // Stagger Form Fields when switching modes
  useGSAP(() => {
      if(formRef.current) {
          gsap.fromTo(formRef.current.children, 
             { opacity: 0, y: 10 },
             { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
          );
      }
  }, [isLogin, isForgot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
        setTimeout(() => {
            addToast('Password reset successfully!', 'success');
            setLoading(false);
            setTimeout(() => {
                setIsForgot(false);
                setIsLogin(true);
                setFormData(prev => ({ ...prev, password: '' }));
            }, 2000);
        }, 1500);
        return;
    }

    const endpoint = `/api/auth/${type}/${isLogin ? 'login' : 'signup'}`;
    
    try {
      const res = await axios.post(endpoint, formData);
      const { token, student, admin } = res.data;
      
      if (type === 'admin' && !isLogin) {
          addToast('Account created. Waiting approval.', 'success');
          setTimeout(() => setIsLogin(true), 2500);
          return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(student || admin));
      localStorage.setItem('userType', type);

      addToast('Authenticated! Redirecting...', 'success');
      
      // Exit Animation before navigate
      gsap.to(containerRef.current, { scale: 0.95, opacity: 0, duration: 0.5, onComplete: () => {
          if (type === 'student') navigate('/student/dashboard');
          else navigate('/admin/dashboard');
      }});

    } catch (err) {
      addToast(err.response?.data?.message || 'Authentication failed', 'error');
    } finally {
      if(!isForgot) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-slate-800">
      <AntiGravityBackground />

      <div 
        ref={containerRef}
        className="glass w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative z-10 p-0 border border-white/10 backdrop-blur-xl bg-black/40"
      >
        <div className={`p-10 text-center relative overflow-hidden ${type === 'student' ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'} text-white`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Link to="/" className="absolute top-6 left-6 text-white/60 hover:text-white transition hover:-translate-x-1 duration-200"><FaArrowLeft /></Link>
            
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-inner ring-1 ring-white/20">
                {type === 'student' ? <FaUser /> : <FaBuilding />}
            </div>
            
            <h2 className="text-3xl font-black mb-2 tracking-tight">
                {isForgot ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Join Us')}
            </h2>
            <p className="text-indigo-100/70 text-sm font-medium">
                {isForgot ? 'Enter your email to reset password' : (isLogin ? `Log in to your ${type} dashboard` : `Create your ${type} profile`)}
            </p>
        </div>

        <div className="p-8 bg-white/90">
            <form onSubmit={handleSubmit} className="space-y-5" ref={formRef}>
                
                {(!isLogin && !isForgot) && (
                    <div>
                        <InputField icon={<FaUser />} placeholder="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                    </div>
                )}

                {(!isLogin && type === 'student' && !isForgot) && (
                    <div className="mt-5">
                        <InputField icon={<FaIdCard />} placeholder="Roll Number" value={formData.rollNo} onChange={v => setFormData({...formData, rollNo: v})} />
                    </div>
                )}

                {(!isLogin && type === 'admin' && !isForgot) && (
                    <div className="mt-5 relative">
                        <FaBuilding className="absolute top-3.5 left-4 text-gray-400 z-10" />
                        <select 
                            required 
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none font-medium text-gray-700"
                            value={formData.department}
                            onChange={e => setFormData({...formData, department: e.target.value})}
                        >
                            <option value="">Select Department</option>
                            <option value="Lab">Lab</option>
                            <option value="Library">Library</option>
                            <option value="Canteen">Canteen</option>
                            <option value="Auditorium">Auditorium</option>
                            <option value="Stationary Shop">Stationary Shop</option>
                        </select>
                    </div>
                )}

                <div>
                    <InputField icon={<FaEnvelope />} type="email" placeholder="Email Address" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                </div>

                {!isForgot && (
                    <div className="relative group">
                        <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-500 transition" />
                        <input 
                            required type={showPassword ? "text" : "password"} 
                            placeholder="Password"
                            className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-medium text-gray-700"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-3.5 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                )}

                {isForgot && (
                     <div className="relative group">
                        <FaLock className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-blue-500 transition" />
                        <input 
                            required type="password" 
                            placeholder="New Password"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition font-medium text-gray-700"
                            value={formData.newPassword}
                            onChange={e => setFormData({...formData, newPassword: e.target.value})}
                        />
                     </div>
                )}

                {isLogin && !isForgot && (
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setIsForgot(true)} className="text-sm font-medium text-blue-500 hover:text-blue-700">
                            Forgot Password?
                        </button>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl flex justify-center items-center gap-3 transform transition-all active:scale-95 hover:shadow-2xl hover:-translate-y-1 ${type === 'student' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30' : 'bg-gradient-to-r from-slate-800 to-black shadow-slate-500/30'}`}
                >
                    {loading ? <FaSpinner className="animate-spin" /> : (isForgot ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button 
                    onClick={() => {
                        if (isForgot) {
                            setIsForgot(false);
                        } else {
                            setIsLogin(!isLogin);
                        }
                    }}  
                    className="text-sm text-gray-500 hover:text-gray-900 font-bold transition"
                >
                    {isForgot ? "Back to Login" : (isLogin ? "New here? Create Account" : "Already have an account? Login")}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon, type="text", placeholder, value, onChange }) => (
    <div className="relative group">
        <span className="absolute top-4 left-4 text-slate-400 group-focus-within:text-indigo-600 transition duration-300">{icon}</span>
        <input 
            required 
            type={type} 
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 hover:bg-white" 
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default Auth;
