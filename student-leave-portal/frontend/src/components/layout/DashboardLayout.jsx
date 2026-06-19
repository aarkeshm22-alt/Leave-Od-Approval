import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
  const location = useLocation();
  // 🚀 SHARED STATE LAYER: Drives mobile drawer sync seamlessly across Sidebar and Topbar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans antialiased selection:bg-blue-500/10">
      
      {/* Structural Accent Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600/80 z-50 pointer-events-none" />

      {/* 📱 FIXED SIDEBAR CONTAINER: Wrapper constraints stripped to let Sidebar handle its own responsiveness */}
      <div className="z-40 shrink-0">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Fixed Header / Topbar Navigation Control */}
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="z-20 shrink-0 border-b border-slate-200/80 bg-white"
        >
          {/* ⚡ Pass toggle down to top bar so hamburger icon can switch the layout drawer */}
          <Topbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        </motion.div>
        
        {/* Dynamic Workspace Scroll Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.215, 0.610, 0.355, 1] }}
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