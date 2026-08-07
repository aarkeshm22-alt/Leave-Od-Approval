import React from 'react';
import { motion } from "framer-motion";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth"; // Harness existing session context

const ProfileDropdown = ({ onClose }) => {
  const { user, logout } = useAuth();
  
  // Real database mappings pulled directly from your dynamic authentication session
  const userName = user?.name || "Loading Context...";
  const userEmail = user?.email || "syncing@database.edu";
  const userRole = user?.role || "Student";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.215, 0.610, 0.355, 1.000] }}
      className="absolute right-0 top-14 w-60 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden z-50 font-sans"
    >
      {/* 1. Identity Segment Header Block */}
      <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-col gap-0.5">
        <p className="text-xs font-black text-slate-900 truncate" title={userName}>
          {userName}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 truncate" title={userEmail}>
          {userEmail}
        </p>
        
        {/* Dynamic Role Badge Indicator */}
        <div className="mt-2 flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-3xs text-[9px] font-bold uppercase tracking-wider text-slate-600">
          <Shield size={10} className="text-blue-600" />
          <span>{userRole} Cluster</span>
        </div>
      </div>

      {/* 2. Menu Control Nodes List */}
      <div className="p-1.5 space-y-0.5">
        
        <button 
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-colors group"
        >
          <User size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span>Account Profile Matrix</span>
        </button>

        <button 
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-colors group"
        >
          <Settings size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          <span>System Parameters</span>
        </button>

      </div>

      {/* 3. Operational Termination Gateway (Logout) */}
      <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => {
            if (logout) logout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors group"
        >
          <LogOut size={14} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
          <span>Terminate Secure Session</span>
        </button>
      </div>

    </motion.div>
  );
};

export default ProfileDropdown;