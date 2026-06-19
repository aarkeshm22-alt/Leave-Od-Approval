import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Building2, User, UserCheck, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/common/InputField';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '', role: 'Student' }); // Default to Student for ease
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const BACKEND_URL = 'http://localhost:5000';

  const handleRoleSelection = (targetRole) => {
    setErrorMsg('');
    setFormData(prev => ({ ...prev, role: targetRole }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg('');
    setVerificationStep('Establishing connection securely...');
    
    try {
      setVerificationStep(`Verifying secure credentials for ${formData.role}...`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid institutional credentials.');
      }

      setVerificationStep('Access granted! Synchronizing dashboard context...');
      
      // 🚨 FIX: Explicitly commit token to disk before updating states
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      login(data.user || data); 
      
      const targetRole = data.user?.role || data.role || formData.role;
      navigate(`/${targetRole.toLowerCase()}/dashboard`);

    } catch (err) {
      console.error("Authentication Loop Exception:", err);
      setErrorMsg(err.message || 'Network failure connecting to authorization servers.');
    } finally {
      setIsVerifying(false);
    }
  };

  const roleIcons = { 'HOD': Building2, 'Mentor': UserCheck, 'Student': User };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      
      <AnimatePresence>
        {isVerifying && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-xs flex flex-col items-center">
              <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-amber-500 rounded-2xl filter blur-md" />
                <div className="relative w-14 h-14 bg-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-center shadow-xl">
                  <RefreshCw className="text-amber-400 animate-spin" size={20} />
                </div>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Security Clearance</h4>
              <p className="text-xs text-slate-400 font-medium h-8">{verificationStep}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4 border border-slate-950">
            <ShieldCheck className="text-amber-400" size={22} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Portal Sign In</h2>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
          {['HOD', 'Mentor', 'Student'].map((r) => {
            const Icon = roleIcons[r];
            const isActive = formData.role === r;
            return (
              <button key={r} type="button" onClick={() => handleRoleSelection(r)} className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all border ${isActive ? 'bg-white text-slate-900 border-slate-200 shadow-sm' : 'text-slate-500'}`}>
                <Icon size={13} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
                <span>{r}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Institutional Email Address" type="email" placeholder="username@institution.edu" icon={Mail} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <InputField label="Password" type="password" placeholder="••••••••" icon={Lock} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />

          <button type="submit" className="w-full mt-4 py-3 px-4 text-xs font-black rounded-xl flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white transition-all uppercase tracking-wider">
            <span>Authenticate Secure Session</span>
            <ArrowRight size={13} className="text-amber-400" />
          </button>
        </form>

        {/* 🌟 Added: Create Account Section at the bottom right corner */}
        <div className="mt-5 flex justify-end">
          <p className="text-xs text-slate-500 font-medium">
            New here?{' '}
            <Link to="/register" className="text-slate-900 hover:text-amber-600 font-bold transition-colors underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;