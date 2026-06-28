import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
  const location = useLocation();
  // Drives mobile drawer sync seamlessly across Sidebar and Topbar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans antialiased selection:bg-indigo-600/10 selection:text-indigo-900">
      
      {/* Premium Top Brand Accent Indicator */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-800 via-indigo-500 to-emerald-500 z-50 pointer-events-none" />

      {/* FIXED SIDEBAR CONTAINER */}
      <div className="z-40 shrink-0">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Fixed Translucent Floating Header Navigation */}
        <motion.header
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="z-20 shrink-0 border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 shadow-xs shadow-slate-100/40"
        >
          {/* Pass toggle down to top bar so hamburger icon can switch the layout drawer */}
          <Topbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </motion.header>
        
        {/* Dynamic Workspace Scroll Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F8FAFC] scroll-smooth custom-scrollbar">
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-7xl mx-auto"
            >
              <Outlet /> 
            </motion.div>
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;