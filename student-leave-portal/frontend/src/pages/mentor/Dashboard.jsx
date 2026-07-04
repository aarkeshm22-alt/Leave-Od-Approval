import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, CheckSquare, BarChart2, Info, Loader2, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';

const MentorDashboard = () => {
  const [metrics, setMetrics] = useState({
    assignedStudentsCount: 0,
    pendingVerificationCount: 0,
    processedTransactionsCount: 0,
    approvalYield: '0.0%'
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchMentorDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('Authentication trace missing. Please log in again.');
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Target your backend route handling mentor profiles
        const { data } = await axios.get('https://leave-od-approval.onrender.com/api/users/profile', config);

        if (data) {
          // Fallback matching logic checks all standard keys your controller sends downstream
          setMetrics({
            assignedStudentsCount: data.assignedStudentsCount || data.studentsCount || 0,
            pendingVerificationCount: data.pendingCount || data.pendingVerificationCount || 0,
            processedTransactionsCount: data.approvedCount || data.processedCount || 0,
            // Calculate a raw dynamic efficiency standard or match backend value
            approvalYield: data.efficiencyYield || `${data.approvedCount > 0 ? ((data.approvedCount / (data.approvedCount + (data.pendingCount || 0))) * 100).toFixed(1) : '100.0'}%`
          });
        }
      } catch (error) {
        console.error("Failed to sync Mentor Dashboard metrics with database engine:", error);
        setErrorMsg('Could not establish a stable connection to sync tracking parameters.');
      } finally {
        setLoading(false);
      }
    };

    fetchMentorDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-indigo-700 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">
          Loading Your Dashboard...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto p-2"
    >
      {/* Dashboard Section Heading */}
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Mentor Supervision Console
        </h1>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-extrabold mt-1">
          Level-1 Workflow Queue Diagnostics
        </p>
      </div>

      {/* Error Boundary Banner Callout */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 shadow-3xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* High-Contrast Interactive Data Matrix Grid Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard 
          title="Assigned Monitored Students" 
          value={`${metrics.assignedStudentsCount} Profile${metrics.assignedStudentsCount === 1 ? '' : 's'}`} 
          icon={Users} 
          color="blue" 
        />
        <StatusCard 
          title="Pending Level-1 Verification Requests" 
          value={`${metrics.pendingVerificationCount} Packet${metrics.pendingVerificationCount === 1 ? '' : 's'}`} 
          icon={Clock} 
          color="amber" 
        />
        <StatusCard 
          title="Processed Transactions (Total)" 
          value={`${metrics.processedTransactionsCount} Item${metrics.processedTransactionsCount === 1 ? '' : 's'}`} 
          icon={CheckSquare} 
          color="emerald" 
        />
        <StatusCard 
          title="Approval Yield Efficiency" 
          value={metrics.approvalYield} 
          icon={BarChart2} 
          color="indigo" // Swapped from rose to indigo to match our bulletproof high-contrast theme mapping
        />
      </div>

      {/* Bottom Guideline Notice Information Block */}
      <div className="bg-slate-100/80 border border-slate-200/60 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
        <Info className="text-slate-500 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          Metrics on this page aggregate Level-1 approval workflows. Modifying allocations requires departmental authorization or HOD database clearing scripts.
        </p>
      </div>
    </motion.div>
  );
};

export default MentorDashboard;