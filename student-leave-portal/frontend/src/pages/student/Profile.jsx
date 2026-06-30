import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Shield, Key, Building2, Mail, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios'; // Ensure axios or your api instance is imported

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token'); // Or however you retrieve your JWT token
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        const response = await axios.get('/api/users/profile', config); // Adjust your route string prefix if needed
        if (response.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.error("Error fetching live student profiles metadata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Use fetched profileData first, fallback to initial global context payload
  const activeUser = profileData || authUser;

  const profileName = activeUser?.name ||
    (activeUser?.firstName || activeUser?.lastName
      ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim()
      : "Verified Identity");

  const userInitials = activeUser?.name
    ? activeUser.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profileName.slice(0, 2).toUpperCase();

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
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header Block */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-100/50 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center text-lg font-black text-white uppercase shrink-0 shadow-md shadow-slate-950/10">
          {userInitials}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{profileName}</h2>
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
            {activeUser?.role || 'Student'}
          </p>
        </div>
      </div>

      {/* Grid Properties Panels */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-100/50 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">User Profile Details</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Data fetched successfully from the database.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Full Name Node */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-3xs">
              <User size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">User Name</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{profileName}</p>
            </div>
          </div>

          {/* User Role Authorization */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-3xs">
              <Shield size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">User Role</p>
              <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mt-0.5">{activeUser?.role}</p>
            </div>
          </div>

          {/* Department Designation */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-600 shadow-3xs">
              <Building2 size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">User Department</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                {activeUser?.deptCode || activeUser?.department || 'N/A'}
              </p>
            </div>
          </div>

          {/* Mail ID */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-amber-600 shadow-3xs">
              <Mail size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">User Mail Id</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{activeUser?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-cyan-600 shadow-3xs">
              <PhoneCall size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mobile Number</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                {activeUser?.mobile || activeUser?.mobileNo || 'N/A'}
              </p>
            </div>
          </div>

          {/* Assigned CA1 */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-amber-600 shadow-3xs">
              <Key size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Assigned CA1</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[220px]">
                {activeUser?.firstmentorName || 'Not Assigned'}
              </p>
            </div>
          </div>

          {/* Assigned CA2 */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-3xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-amber-600 shadow-3xs">
              <Key size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Assigned CA2</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[220px]">
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