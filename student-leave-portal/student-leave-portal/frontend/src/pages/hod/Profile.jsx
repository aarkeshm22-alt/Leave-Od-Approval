import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Building2, User, KeyRound, Fingerprint, Mail, PhoneCallIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const HodProfile = () => {
  const { user, loading } = useAuth();

  // Combine names cleanly
  const profileName = user?.firstName || user?.lastName
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user?.name || "Verified Identity";

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : profileName.slice(0, 2).toUpperCase();

  const userDepartment = user?.department || "N/A"; 
  const userEmail = user?.email || "N/A";

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-sans bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600 tracking-tight animate-pulse">Syncing Institutional Records Engine...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-6 font-sans pb-12"
    >
      
      {/* Page Title Header Block */}
      <div className="border-b border-slate-200/80 pb-5">
        <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Profile Details</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Role and department verified successfully.</p>
      </div>

      {/* Primary Profile Identity Blueprints */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/50">
        
        {/* Upper Decorative Authority Banner – Navy with Amber accent */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:14px_24px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner text-md font-black text-white uppercase shrink-0">
                {userInitials}
              </div>
              <div className="space-y-0.5">
                <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Head of Department (HOD)
                </span>
                <h3 className="text-lg font-black tracking-tight mt-1">{profileName}</h3>
                <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 backdrop-blur-xs shadow-3xs">
              <Fingerprint size={16} className="text-amber-400" />
              <div className="text-left">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-[11px] font-bold text-emerald-400">Active & Authenticated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Secure Variable Information Ledger */}
        <div className="p-6 space-y-5 bg-white">
          <div className="pb-1">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              User's Data
            </h4>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 text-xs">
            
            {/* Identity Parameter Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <User size={14} className="text-amber-500" />
                <span>Full Name</span>
              </span>
              <span className="font-extrabold text-indigo-900 text-sm tracking-tight">{profileName}</span>
            </div>

            {/* Email Parameter Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Mail size={14} className="text-amber-500" />
                <span>Email Address</span>
              </span>
              <span className="font-mono text-indigo-900 font-semibold bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-lg shadow-3xs">
                {userEmail}
              </span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <PhoneCallIcon size={14} className="text-amber-500" />
                <span>Mobile Number</span>
              </span>
              <span className="font-mono text-indigo-900 font-semibold bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-lg shadow-3xs">
                {user.mobile || 'N/A'}
              </span>
            </div>

            {/* Department Mapping Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Building2 size={14} className="text-amber-500" />
                <span>Department</span>
              </span>
              <span className="font-mono text-indigo-900 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg font-bold text-xs shadow-3xs">
                {userDepartment}
              </span>
            </div>

            {/* Security Privilege Level Link */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <KeyRound size={14} className="text-amber-500" />
                <span>Security Access</span>
              </span>
              <span className="text-indigo-900 font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg shadow-3xs w-fit">
                <ShieldCheck size={13} className="text-amber-600 stroke-[2.5]" />
                <span>Admin Node</span>
              </span>
            </div>

          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default HodProfile;