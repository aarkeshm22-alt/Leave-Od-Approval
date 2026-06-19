import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Building2, User, KeyRound, Fingerprint } from 'lucide-react';

const HodProfile = () => {
  const { user, loading } = useAuth();

  // Read the exact string key structure sent by your backend profile endpoint
  const userName = user?.name || "Authenticated Node";
  const userDept = user?.deptCode || "N/A"; 
  const userEmail = user?.email || "sharmila@ksrce.ac.in"; // Matches profile context string in image_4cddf8.png

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600 tracking-tight animate-pulse">Syncing Stable Records Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12">
      
      {/* Page Title Header block */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Profile Registry</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Secure validation variables and authority parameters assigned to this node</p>
      </div>

      {/* Primary Profile Identity Blueprint Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-100">
        
        {/* Upper Decorative Authority Banner Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-inner text-xl font-black tracking-tighter text-blue-400">
                Ω
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/20">
                  Root Controller Access
                </span>
                <h3 className="text-lg font-black tracking-tight mt-1">{userName}</h3>
                <p className="text-xs text-slate-400 font-medium">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 backdrop-blur-xs">
              <Fingerprint size={16} className="text-blue-400" />
              <div className="text-left">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Node Status</p>
                <p className="text-[11px] font-bold text-emerald-400">Active & Authenticated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Secure Variable Information Ledger */}
        <div className="p-6 space-y-5 bg-white">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
            System Parameter Matrix
          </h4>

          <div className="grid grid-cols-1 divide-y divide-slate-100 text-xs">
            
            {/* Identity Parameter Link */}
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                <span>Master Administrator Context Identification</span>
              </span>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">{userName}</span>
            </div>

            {/* Department Mapping Link */}
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" />
                <span>Assigned Routing Node Department Code</span>
              </span>
              <span className="font-mono text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md font-bold text-xs shadow-3xs">
                {userDept}
              </span>
            </div>

            {/* Security Privilege Level Link */}
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <KeyRound size={14} className="text-slate-400" />
                <span>Security Access Key Class Permission Level</span>
              </span>
              <span className="text-slate-900 font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full shadow-3xs">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Level-2 Ultimate Admin Node</span>
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default HodProfile;