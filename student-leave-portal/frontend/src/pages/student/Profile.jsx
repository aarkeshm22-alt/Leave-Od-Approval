import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Shield, Key, Landmark } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-black text-white tracking-tight">Identity Node Properties</h2>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
          <User className="text-blue-400 shrink-0" size={20} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Canonical Object Descriptor Signature</p>
            <p className="text-sm font-bold text-white">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
          <Shield className="text-indigo-400 shrink-0" size={20} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">System Permissions Vector Scope Role</p>
            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
          <Landmark className="text-emerald-400 shrink-0" size={20} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Department Network Anchor Identity</p>
            <p className="text-sm font-mono text-white">{user?.deptCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
          <Key className="text-amber-400 shrink-0" size={20} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Linked Upstream Mentor Code Verification</p>
            <p className="text-sm font-mono text-white">{user?.mentorCode || "ROOT_NODE_MASTER"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;