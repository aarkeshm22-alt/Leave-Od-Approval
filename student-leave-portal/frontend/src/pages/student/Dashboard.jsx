import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Calendar, Clock, CheckCircle2, PlusCircle, Bell, Info } from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    totalLeaves: 0,
    totalOD: 0,
    pendingApprovals: 0,
    approvedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchRealDbMetrics = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get('/api/users/profile', config);

        if (data) {
          setMetrics({
            totalLeaves: data.totalLeavesCount || 0,
            totalOD: data.totalODCount || 0,
            pendingApprovals: data.pendingCount || 0,
            approvedRequests: data.approvedCount || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealDbMetrics();
  }, []);

  const formattedDate = dateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedDay = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedTime = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const notifications = [
    { id: 1, type: 'approval', message: 'Your Leave Request has been updated on the database.', time: 'Just now', unread: true },
    { id: 2, type: 'update', message: 'OD status synced with departmental coordinator parameters.', time: '5 hours ago', unread: false },
    { id: 3, type: 'system', message: 'Upcoming institutional tech meet registrations close tonight.', time: '1 day ago', unread: false },
  ];

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          Syncing Stable Records Engine...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 bg-[#F8FAFC] min-h-screen font-sans antialiased"
    >
      {/* Dynamic Header Banner Component Layout */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Student Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
            <span className="bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-lg text-slate-700 shadow-3xs font-bold">
              {formattedDay}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">{formattedDate}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-blue-600 bg-blue-50/80 border border-blue-100/70 px-2.5 py-0.5 rounded-lg font-bold shadow-3xs">
              {formattedTime}
            </span>
          </div>
        </div>
        
        {/* Navigation Actions Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/student/apply-leave')}
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs tracking-wide uppercase px-5 py-3 rounded-xl shadow-lg shadow-blue-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <PlusCircle size={15} className="stroke-[2.5]" />
            Apply Leave
          </button>
          <button 
            onClick={() => navigate('/student/apply-od')}
            className="inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs tracking-wide uppercase px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <PlusCircle size={15} className="stroke-[2.5]" />
            Apply On-Duty (OD)
          </button>
        </div>
      </div>

      {/* Main Framework Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Metric Data Dashboard Cards Blocks Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatusCard title="TOTAL LEAVES TAKEN" value={`${metrics.totalLeaves} Days`} icon={Calendar} color="blue" />
            <StatusCard title="TOTAL ON-DUTY (OD)" value={`${metrics.totalOD} Days`} icon={Award} color="emerald" />
            <StatusCard title="PENDING APPROVALS" value={`${metrics.pendingApprovals} Request${metrics.pendingApprovals === 1 ? '' : 's'}`} icon={Clock} color="amber" />
            <StatusCard title="APPROVED REQUESTS" value={`${metrics.approvedRequests} Item${metrics.approvedRequests === 1 ? '' : 's'}`} icon={CheckCircle2} color="indigo" />
          </div>
          
          {/* Informational Guidelines Panel */}
          <div className="bg-blue-50/40 border border-blue-100/80 p-4 rounded-2xl flex items-start gap-3 shadow-3xs backdrop-blur-xs">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800/90 leading-relaxed font-semibold">
              Exemption limits refresh dynamically per semester cycle. Please track active counts regularly before logging structural academic exemptions.
            </p>
          </div>
        </div>

        {/* Live System Synchronization Timeline Feed Component */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm shadow-slate-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700">
                <Bell size={14} className="stroke-[2.5]" />
              </div>
              <h3 className="font-black text-xs tracking-wider text-slate-800 uppercase">Updates Feed</h3>
            </div>
            <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-xl border transition-all duration-200 relative group cursor-pointer ${
                  notif.unread 
                    ? 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/60 shadow-3xs' 
                    : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50/80'
                }`}
              >
                {notif.unread && (
                  <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />
                )}
                <p className={`text-xs leading-relaxed pr-3 ${notif.unread ? 'text-slate-900 font-bold' : 'text-slate-600 font-semibold'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div className={`w-1 h-1 rounded-full ${notif.unread ? 'bg-blue-400' : 'bg-slate-300'}`} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default StudentDashboard;