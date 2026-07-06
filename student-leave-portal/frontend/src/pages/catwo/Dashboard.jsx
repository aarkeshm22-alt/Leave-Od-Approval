import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Award, Activity, Info } from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';

const CADashboard = () => {
  const [metrics, setMetrics] = useState({
    name: '',
    assignedStudentsCount: 0,
    totalLeaves: 0,
    totalOD: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('Authentication missing. Please log in again.');
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Assuming there's an endpoint that returns CA2 stats (like /api/users/profile with role detection)
        const { data } = await axios.get(
          'https://leave-od-approval.onrender.com/api/users/profile',
          config
        );

        if (data) {
          setMetrics({
            name: data.name || 'CA2',
            assignedStudentsCount: data.assignedStudentsCount || 0,
            totalLeaves: data.totalLeavesCount || 0,
            totalOD: data.totalODCount || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch CA2 dashboard metrics:', error);
        setErrorMsg('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-indigo-700 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">
          Loading Your <span className="text-amber-500">CA2</span> Dashboard...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6"
    >
      <div className="border-b border-slate-200/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-amber-500" size={24} />
            CA2 Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back, <span className="text-indigo-900 font-bold">{metrics.name}</span> – 
            here's an overview of your assigned students.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
          <Calendar size={14} className="text-amber-500" />
          <span className="font-medium">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatusCard
          title="Assigned Students"
          value={`${metrics.assignedStudentsCount} Profile${metrics.assignedStudentsCount === 1 ? '' : 's'}`}
          icon={Users}
          color="blue"
        />
        <StatusCard
          title="Total Leave Days (Approved)"
          value={`${metrics.totalLeaves} Days`}
          icon={Calendar}
          color="amber"
        />
        <StatusCard
          title="Total OD Days (Approved)"
          value={`${metrics.totalOD} Days`}
          icon={Award}
          color="emerald"
        />
      </div>

      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
        <Info className="text-slate-500 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          As a Class Advisor 2, you can view student details and export reports.
          For approvals, please contact the primary mentor or HOD.
        </p>
      </div>
    </motion.div>
  );
};

export default CADashboard;