import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Shield, Key, Building2, Mail, PhoneCall, Home, HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Profile = () => {
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
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const activeUser = profileData || authUser;

  const profileName =
    activeUser?.name ||
    (activeUser?.firstName || activeUser?.lastName
      ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim()
      : 'Verified Identity');

  const userInitials = activeUser?.name
    ? activeUser.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profileName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
     <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-600 text-center uppercase">
          Loading Your { ' '} 
          <span className="font-bold text-indigo-600">Profile</span> Details...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0"
    >
      {/* Profile Header Block */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-blue-900 flex items-center justify-center text-lg font-black text-white uppercase shrink-0 shadow-md shadow-blue-900/20">
          {userInitials}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-black text-blue-900 tracking-tight">{profileName}</h2>
          <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">
            {activeUser?.role || 'Student'}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm shadow-gray-200/50 space-y-5">
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">User Profile Details</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Data fetched successfully from the database.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <User size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">User Name</p>
              <p className="text-xs font-bold text-blue-900 mt-0.5">{profileName}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <Shield size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">User Role</p>
              <p className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mt-0.5">{activeUser?.role}</p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <Building2 size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Department</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
                {activeUser?.deptCode || activeUser?.department || 'N/A'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <Mail size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Email</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">{activeUser?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <PhoneCall size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Mobile</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
                {activeUser?.mobile || activeUser?.mobileNo || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <HomeIcon size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Student Type</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
                {activeUser?.studentType || 'N/A'}
              </p>
            </div>
          </div>

          {/* CA1 */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <Key size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Assigned CA1</p>
              <p className="text-xs font-bold text-blue-900 mt-0.5 truncate max-w-[220px]">
                {activeUser?.firstmentorName || 'Not Assigned'}
              </p>
            </div>
          </div>

          {/* CA2 */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-gray-200 text-amber-500 shadow-sm">
              <Key size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Assigned CA2</p>
              <p className="text-xs font-bold text-blue-900 mt-0.5 truncate max-w-[220px]">
                {activeUser?.secondmentorName || 'Not Assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;