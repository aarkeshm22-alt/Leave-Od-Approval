import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Clock, CheckSquare, BarChart2, Info, Loader2, AlertCircle,
  TrendingUp, Calendar, Activity
} from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const MentorDashboard = () => {
  const [metrics, setMetrics] = useState({
    name: ' ',
    assignedStudentsCount: 0,
    pendingVerificationCount: 0,
    processedTransactionsCount: 0,
    approvalYield: '0.0%'
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [statusData, setStatusData] = useState([
    { name: 'Pending', value: 0 },
    { name: 'Approved', value: 0 },
    { name: 'Rejected', value: 0 }
  ]);

  const COLORS = ['#F59E0B', '#10B981', '#EF4444'];

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' });

  useEffect(() => {
    const fetchMentorDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('Authentication missing. Please log in again.');
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(
          'https://leave-od-approval.onrender.com/api/users/profile',
          config
        );

        if (data) {
          const assigned = data.assignedStudentsCount || data.studentsCount || 0;
          const pending = data.pendingCount || data.pendingVerificationCount || 0;
          const approved = data.approvedCount || data.processedCount || 0;
          const rejected = data.rejectedCount || Math.max(0, assigned - pending - approved);

          const yieldValue = (approved + pending) > 0
            ? ((approved / (approved + pending)) * 100).toFixed(1)
            : '100.0';

          setMetrics({
            name: data.name || 'Mentor',
            assignedStudentsCount: assigned,
            pendingVerificationCount: pending,
            processedTransactionsCount: approved,
            approvalYield: `${yieldValue}%`
          });

          setStatusData([
            { name: 'Pending', value: pending },
            { name: 'Approved', value: approved },
            { name: 'Rejected', value: rejected }
          ]);
        }
      } catch (error) {
        console.error('Failed to sync Mentor Dashboard metrics:', error);
        setErrorMsg('Could not connect to the tracking server.');
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
          Loading Your <span className="text-amber-500">Dashboard</span>...
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
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-amber-500" size={24} />
            Mentor Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back, <span className="text-indigo-900 font-bold">{metrics.name || 'Mentor'}</span> – 
            here's your real‑time oversight dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
          <Calendar size={14} className="text-amber-500" />
          <span className="font-medium">
            {dayName}, {formattedDate} &middot; {formattedTime}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 shadow-3xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard
          title="Assigned Students"
          value={`${metrics.assignedStudentsCount} Profile${metrics.assignedStudentsCount === 1 ? '' : 's'}`}
          icon={Users}
          color="blue"
        />
        <StatusCard
          title="Pending Verification"
          value={`${metrics.pendingVerificationCount} Request${metrics.pendingVerificationCount === 1 ? '' : 's'}`}
          icon={Clock}
          color="amber"
        />
        <StatusCard
          title="Approved Requests"
          value={`${metrics.processedTransactionsCount} Request${metrics.processedTransactionsCount === 1 ? '' : 's'}`}
          icon={CheckSquare}
          color="emerald"
        />
        <StatusCard
          title="Approval Efficiency"
          value={metrics.approvalYield}
          icon={BarChart2}
          color="indigo"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-amber-500" />
            Request Status Breakdown
          </h3>
          <div className="w-full" style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 600 }} width={60} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value} requests`, '']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-indigo-500" />
            Overall Approval Split
          </h3>
          <div className="w-full" style={{ height: '240px' }}>
            {statusData.filter(d => d.value > 0).length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400 font-medium">
                No data available to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {statusData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[statusData.findIndex(d => d.name === entry.name)]} 
                        stroke="#ffffff" 
                        strokeWidth={2} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value} requests`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Notice */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
        <Info className="text-slate-500 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Dashboard metrics are updated automatically based on your students' Leave and On-Duty requests.
          The bar and pie charts give you a quick visual of the current request status distribution.
        </p>
      </div>
    </motion.div>
  );
};

export default MentorDashboard;