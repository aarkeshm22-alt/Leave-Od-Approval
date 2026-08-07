import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ChevronLeft, CheckCircle2 } from 'lucide-react';
import InputField from '../../components/common/InputField';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate a brief response latency delay
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Background Architectural Grid Accent Layer */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative z-10 overflow-hidden"
      >
        {/* Luxury top geometric horizontal bar ribbon */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900" />

        {/* Back Navigation Trigger */}
        <div className="mb-6">
          <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-900 inline-flex items-center gap-1 transition-colors group">
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            <span>Back to Sign In</span>
          </Link>
        </div>

        {!done ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Provide your registered institutional email address, and we will dispatch a secure validation link to reset your credentials.
              </p>
            </div>

            <InputField 
              label="Institutional Email Address" 
              type="email" 
              icon={Mail} 
              placeholder="username@institution.edu" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 text-xs font-black rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 shadow-2xs uppercase tracking-wider
                ${loading 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 active:scale-[0.99]'
                }
              `}
            >
              <RefreshCw size={13} className={`text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? "Sending Link..." : "Send Recovery Email"}</span>
            </button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto shadow-3xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Recovery Dispatched</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                If the email match exists in our departmental index, an access configuration link will arrive in your inbox shortly.
              </p>
            </div>
            
            <div className="pt-4">
              <Link 
                to="/login" 
                className="inline-block px-5 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-950 rounded-xl transition-all duration-200 shadow-3xs"
              >
                Return to Login screen
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;