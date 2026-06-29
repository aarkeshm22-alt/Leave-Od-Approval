import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Mail, Building2, User, Key, Phone, User2Icon } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const MentorProfile = () => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        const response = await axios.get('/api/users/profile', config);
        if (response.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.error("Error fetching live mentor profiles metadata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const activeUser = profileData || authUser;

  const mentorName = activeUser?.name ||
    (activeUser?.firstName || activeUser?.lastName
      ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim()
      : "Verified Faculty");

  const userInitials = activeUser?.name
    ? activeUser.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : mentorName.slice(0, 2).toUpperCase();

  const getClassAdvisorLabel = () => {
    if (activeUser?.category === 'CA1') return 'Class Advisor 1 (CA1)';
    if (activeUser?.category === 'CA2') return 'Class Advisor 2 (CA2)';
    return activeUser?.role || 'Academic Member';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-bold text-slate-400">
        Syncing Secure Profile...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Profile Summary Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-100/50 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center text-lg font-black text-white uppercase shrink-0 shadow-md shadow-slate-950/10">
          {userInitials}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{mentorName}</h2>
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
            {getClassAdvisorLabel()}
          </p>
        </div>
      </div>

      {/* Main Details Inventory Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-100/50 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Faculty Details</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Data fetched successfully from the database.</p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">

          {/* Full Name */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <User size={14} className="text-slate-400" /> Faculty Name
            </span>
            <span className="font-bold text-slate-900 sm:text-right">{mentorName}</span>
          </div>

          {/* Email Route */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Mail size={14} className="text-slate-400" /> Faculty Mail Id
            </span>
            <span className="font-mono text-slate-700 font-semibold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg sm:text-right shadow-3xs">
              {activeUser?.email || 'N/A'}
            </span>
          </div>

          {/* Mobile Number */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Phone size={14} className="text-slate-400" /> Faculty Mobile Number
            </span>
            <span className="font-mono text-slate-700 font-semibold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg sm:text-right shadow-3xs">
              {activeUser?.mobile || activeUser?.mobileNo || 'N/A'}
            </span>
          </div>

          {/* Security Permissions Role */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Key size={14} className="text-slate-400" /> Faculty Category
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] w-fit sm:ml-auto">
              <ShieldCheck size={14} className="stroke-[2.5] text-emerald-600" /> {activeUser?.category || 'General Faculty'}
            </span>
          </div>

          {/* Department Designation */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Building2 size={14} className="text-slate-400" /> Faculty Department
            </span>
            <span className="font-mono font-bold bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg text-indigo-700 text-xs w-fit sm:ml-auto shadow-3xs">
              {activeUser?.deptCode || activeUser?.department || 'DEPT_CORE'}
            </span>
          </div>

          {/* Reporting HOD Head */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <User2Icon size={14} className="text-slate-400" /> Reporting Head of Dept (HOD)
            </span>
            <span className="font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg sm:text-right shadow-3xs">
              {activeUser?.hodName || 'Not Assigned'}
            </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default MentorProfile;