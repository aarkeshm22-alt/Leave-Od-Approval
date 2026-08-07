import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Three rings container */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-[3px] border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent"
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
          className="absolute inset-[6px] rounded-full border-[3px] border-b-indigo-400 border-t-transparent border-r-transparent border-l-transparent"
        />
        {/* Inner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
          className="absolute inset-[14px] rounded-full border-[3px] border-l-purple-400 border-t-transparent border-r-transparent border-b-transparent"
        />
        {/* Glow pulse */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute inset-[-12px] rounded-full bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-xl"
        />
      </div>

      {/* Text with shimmer */}
      <div className="relative">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.2em] font-bold uppercase text-white/80"
        >
          Authenticating Secure Session…
        </motion.p>
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-300 to-transparent"
        />
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
      {content}
    </div>
  );
};

export default Loader;