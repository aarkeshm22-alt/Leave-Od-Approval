import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          className="absolute inset-2 border-4 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent rounded-full opacity-60"
        />
      </div>
      <p className="text-xs tracking-widest text-slate-400 uppercase font-bold animate-pulse">Syncing Portal Matrix...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;