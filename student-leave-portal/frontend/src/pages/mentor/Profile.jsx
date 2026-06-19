import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Mail, Cpu } from 'lucide-react';

const MentorProfile = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
      <h3 className="text-md font-bold text-white uppercase tracking-wider">Instructor Registry Profile Values</h3>
      <div className="divide-y divide-white/5 text-xs text-slate-300">
        <div className="py-3 flex justify-between"><span className="text-slate-500 font-semibold">Auditor Designation Signature</span> <span className="font-bold text-white">{user?.name}</span></div>
        <div className="py-3 flex justify-between"><span className="text-slate-500 font-semibold">Network Electronic Mail Route</span> <span className="font-mono">{user?.email}</span></div>
        <div className="py-3 flex justify-between"><span className="text-slate-500 font-semibold">Security Level Scope Validation</span> <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase"><ShieldCheck size={14}/> Level-1 Core Instructor</span></div>
        <div className="py-3 flex justify-between"><span className="text-slate-500 font-semibold">Assigned Institutional Dept Link</span> <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-blue-400">{user?.deptCode}</span></div>
      </div>
    </div>
  );
};

export default MentorProfile;