import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Building2, User, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/common/InputField';
import Loader from '../../components/common/Loader';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Internal tracking state uses lowercase to satisfy your AppRoutes RoleGuard requirements
  const [formData, setFormData] = useState({ email: '', password: '', role: 'student' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const BACKEND_URL = 'https://leave-od-approval.onrender.com';

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/login`, { method: 'OPTIONS' })
      .catch(() => console.log("Pre-warm system wake up initialized."));
  }, []);

  const handleRoleSelection = (targetRole) => {
    setErrorMsg('');
    setFormData(prev => ({ ...prev, role: targetRole.toLowerCase() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg('');

    // ⚡ FIX: Convert the internal lowercase string to Capitalized format just for the backend request payload
    const backendCapitalizedRole = formData.role === 'hod' 
      ? 'HOD' 
      : formData.role.charAt(0).toUpperCase() + formData.role.slice(1);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          role: backendCapitalizedRole // 🏛️ Sends "Student", "Mentor", or "HOD" exactly as expected by your DB
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid institutional credentials.');
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Convert backend profile fields to lowercase so AppRoutes can validate them smoothly
      const normalizedUser = {
        ...(data.user || data),
        role: (data.user?.role || data.role || formData.role).toLowerCase()
      };

      login(normalizedUser); 
      navigate(`/${normalizedUser.role}/dashboard`);

    } catch (err) {
      console.error("Authentication Loop Exception:", err);
      setErrorMsg(err.message || 'Network failure connecting to authorization servers.');
      setIsVerifying(false);
    }
  };

  const displayRoleMap = { 'student': 'Student', 'mentor': 'Mentor', 'hod': 'HOD' };
  const roleIcons = { 'hod': Building2, 'mentor': UserCheck, 'student': User };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 🌟 Floating White Stars Background Array */}
      <div className="absolute inset-x-0 top-0 h-[40vh] pointer-events-none overflow-hidden z-0 opacity-80">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: i % 3 === 0 ? '3px' : '2px',
              height: i % 3 === 0 ? '3px' : '2px',
              top: `${Math.random() * 85}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      {/* 🌊 2 Custom Responsive Bottom Waves */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <svg 
          className="absolute w-full bottom-0 left-0 h-[28vh] sm:h-[35vh] md:h-[45vh] min-w-[1000px] md:min-w-[1440px]" 
          viewBox="0 0 1440 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="none"
        >
          <motion.path 
            d="M0,250 C360,320 720,150 1080,280 C1260,330 1350,260 1440,220 L1440,500 L0,500 Z"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#ksr-gold-wave)" 
            opacity="0.4"
          />
          <motion.path 
            d="M0,320 C300,380 600,260 900,340 C1140,400 1320,310 1440,350 L1440,500 L0,500 Z"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#ksr-gold-wave)" 
            opacity="0.7"
          />
          <defs>
            <linearGradient id="ksr-navy-wave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="ksr-gold-wave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c5a059" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 🔒 Intercepting Blockout Wrapper for Custom Loader Integration */}
      <AnimatePresence>
        {isVerifying && (
          <div className="fixed inset-0 z-50">
            <Loader fullPage />
          </div>
        )}
      </AnimatePresence>

      {/* 📦 Matte Premium Institutional Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-[92%] sm:max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-black/80 z-10 relative"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900" />

        <div className="flex flex-col items-center text-center mb-7">
          <div className="h-12 w-12 bg-slate-950 rounded-xl flex items-center justify-center mb-4 border border-slate-800 shadow-inner">
            <ShieldCheck className="text-amber-500" size={24} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Portal Sign In</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">Leave & OD Approval Gateway</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* 🎛️ Segmented Core Roles Select Array */}
        <div className="grid grid-cols-3 gap-1 bg-slate-955/80 p-1.5 rounded-xl border border-slate-800 mb-6 relative">
          {['hod', 'mentor', 'student'].map((r) => {
            const Icon = roleIcons[r];
            const isActive = formData.role === r;
            return (
              <button 
                key={r} 
                type="button" 
                onClick={() => handleRoleSelection(r)} 
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-colors relative duration-150 z-10 text-slate-400"
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeRoleIndicator"
                    className="absolute inset-0 bg-slate-900 border border-slate-700/50 shadow-md z-[-1] rounded-lg"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={13} className={isActive ? 'text-amber-500' : 'text-slate-500'} />
                <span className={isActive ? 'text-white font-extrabold' : ''}>{displayRoleMap[r]}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField 
            label="Institutional Email Address" 
            type="email" 
            placeholder="username@institution.edu" 
            icon={Mail} 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            required 
            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-within:border-amber-500/40 focus-within:bg-slate-950/80 transition-all"
          />
          <InputField 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            icon={Lock} 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            required 
            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-within:border-amber-500/40 focus-within:bg-slate-950/80 transition-all"
          />

          <motion.button 
            whileTap={{ scale: 0.99 }}
            type="submit" 
            className="w-full mt-6 py-3 px-4 text-xs font-black rounded-xl flex items-center justify-center gap-2 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-750 hover:to-slate-850 border border-slate-700/60 text-white shadow-lg shadow-black/40 transition-all uppercase tracking-wider"
          >
            <span>Authenticate Secure Session</span>
            <ArrowRight size={13} className="text-amber-500" />
          </motion.button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/60 flex justify-end">
          <p className="text-xs text-slate-500 font-medium">
            New here?{' '}
            <Link to="/register" className="text-white hover:text-amber-500 font-bold transition-colors underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;