import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Mail, Building2, User, Key, Phone, User2Icon, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const CA2Profile = () => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('https://leave-od-approval.onrender.com/api/users/profile', config);
        if (response.data) setProfileData(response.data);
      } catch (error) {
        console.error("Error fetching mentor profile:", error);
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
      : 'Verified Identity');

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
      <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[700px] text-gray-400 font-sans px-4">
        <p className="text-xs font-black tracking-widest uppercase text-gray-500 animate-pulse flex items-center gap-2">
          Loading Your {' '} 
          <span className="font-bold text-amber-600">Profile</span> Details <Loader className="inline-block text-blue-700 animate-spin" size={18} />
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-0 py-4 sm:py-6"
    >
      {/* ===== PROFILE HEADER ===== */}
      <div className="bg-white border-2 border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm shadow-amber-100/50 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 md:gap-6 transition-all">
        {/* Avatar – sizes scale with screen */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-blue-900 flex items-center justify-center text-base sm:text-lg md:text-2xl font-black text-white uppercase shrink-0 shadow-md shadow-blue-900/20">
          {userInitials}
        </div>
        <div className="text-center sm:text-left space-y-0.5 sm:space-y-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-blue-900 tracking-tight">
            {mentorName}
          </h2>
          <p className="text-[10px] sm:text-xs text-amber-500 font-bold uppercase tracking-wider">
            {getClassAdvisorLabel()}
          </p>
        </div>
      </div>

      {/* ===== DETAILS CARD ===== */}
      <div className="bg-white border border-gray-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm shadow-gray-200/50 space-y-4 sm:space-y-5">
        {/* Section Header */}
        <div className="border-b border-gray-200 pb-2 sm:pb-3">
          <h3 className="text-[10px] sm:text-xs font-black text-blue-900 uppercase tracking-wider">
            Faculty Details
          </h3>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5">
            Data fetched successfully from the database.
          </p>
        </div>

        {/* ===== FIELDS GRID ===== */}
        <div className="divide-y divide-gray-200 text-xs sm:text-sm">

          {/* 1. Full Name */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <User size={14} className="text-amber-500 shrink-0" /> Faculty Name
            </span>
            <span className="font-bold text-blue-900 sm:text-right text-sm sm:text-base break-words">
              {mentorName}
            </span>
          </div>

          {/* 2. Email – Clean, no box */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <Mail size={14} className="text-amber-500 shrink-0" /> Faculty Mail Id
            </span>
            <span className="font-mono text-blue-900 font-semibold sm:text-right text-sm sm:text-base break-all sm:break-normal">
              {activeUser?.email || 'N/A'}
            </span>
          </div>

          {/* 3. Mobile – Clean, no box */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <Phone size={14} className="text-amber-500 shrink-0" /> Faculty Mobile
            </span>
            <span className="font-mono text-blue-900 font-semibold sm:text-right text-sm sm:text-base">
              {activeUser?.mobile || activeUser?.mobileNo || 'N/A'}
            </span>
          </div>

          {/* 4. Category – Amber Badge */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <Key size={14} className="text-amber-500 shrink-0" /> Faculty Category
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold uppercase tracking-wider text-[9px] sm:text-[10px] w-fit sm:ml-auto">
              <ShieldCheck size={12} className="stroke-[2.5] text-amber-600" /> 
              {activeUser?.category || 'General Faculty'}
            </span>
          </div>

          {/* 5. Department – Navy Badge */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <Building2 size={14} className="text-amber-400 shrink-0" /> Faculty Department
            </span>
            <span className="font-mono font-bold bg-blue-50 border border-blue-200 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-blue-700 text-[10px] sm:text-xs w-fit sm:ml-auto shadow-sm">
              {activeUser?.deptCode || activeUser?.department || 'DEPT_CORE'}
            </span>
          </div>

          {/* 6. HOD – Clean, no box */}
          <div className="py-3 sm:py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <span className="text-gray-500 font-bold flex items-center gap-2 text-[11px] sm:text-xs">
              <User2Icon size={14} className="text-amber-500 shrink-0" /> Reporting HOD
            </span>
            <span className="font-bold text-blue-900 sm:text-right text-sm sm:text-base break-words">
              {activeUser?.hodName || 'Not Assigned'}
            </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default CA2Profile;