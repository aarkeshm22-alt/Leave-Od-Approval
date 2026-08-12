import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Clock, CheckSquare, BarChart2, Info, Loader2, AlertCircle,
  TrendingUp, Calendar, Activity, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const BASE_URL = 'https://leave-od-approval.onrender.com';

const MentorDashboard = () => {
  const [metrics, setMetrics] = useState({
    name: ' ',
    assignedStudentsCount: 0,
    pendingVerificationCount: 0,
    processedTransactionsCount: 0,
    approvalYield: '0.0%'
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [statusData, setStatusData] = useState([
    { name: 'Pending', value: 0 },
    { name: 'Approved', value: 0 },
    { name: 'Rejected', value: 0 }
  ]);

  const [todayActiveLeaves, setTodayActiveLeaves] = useState(0);
  const [todayActiveODs, setTodayActiveODs] = useState(0);

  const COLORS = ['#F59E0B', '#10B981', '#EF4444'];

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isActiveToday = (fromDate, toDate) => {
    if (!fromDate || !toDate) return false;
    const today = new Date();
    const todayMidnight = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const from = new Date(fromDate);
    const fromMidnight = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const to = new Date(toDate);
    const toMidnight = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    return fromMidnight.getTime() <= todayMidnight.getTime() && todayMidnight.getTime() <= toMidnight.getTime();
  };

  // 🔥 UPDATED: fetch dashboard data with actual counts
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('Authentication missing. Please log in again.');
          setLoading(false);
          return;
        }

        const cleanToken = token.replace(/"/g, '').trim();
        const config = {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        };

        // 1. Fetch mentor profile (for name & assigned count)
        const { data } = await axios.get(`${BASE_URL}/api/users/profile`, config);

        // 2. Fetch students (to count actual requests)
        const studentsRes = await axios.get(`${BASE_URL}/api/mentor/my-students`, config);
        const students = studentsRes.data?.data || [];

        let assignedCount = students.length;
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let activeLeaves = 0;
        let activeODs = 0;

        students.forEach(student => {
          // Count leaves
          (student.leaves || []).forEach(leave => {
            const status = leave.status?.toLowerCase();
            if (status === 'pending') pendingCount++;
            else if (status === 'approved' || status === 'partially approved') {
              approvedCount++;
              if (isActiveToday(leave.fromDate, leave.toDate)) activeLeaves++;
            }
            else if (status === 'rejected') rejectedCount++;
          });

          // Count ODs
          (student.ods || []).forEach(od => {
            const status = od.status?.toLowerCase();
            if (status === 'pending') pendingCount++;
            else if (status === 'approved' || status === 'partially approved') {
              approvedCount++;
              if (isActiveToday(od.fromDate, od.toDate)) activeODs++;
            }
            else if (status === 'rejected') rejectedCount++;
          });
        });

        // 3. Compute approval yield
        const totalDecisions = approvedCount + rejectedCount;
        const yieldValue = totalDecisions > 0
          ? ((approvedCount / totalDecisions) * 100).toFixed(1)
          : '100.0';

        setMetrics({
          name: data?.name || 'Mentor',
          assignedStudentsCount: assignedCount,
          pendingVerificationCount: pendingCount,
          processedTransactionsCount: approvedCount,
          approvalYield: `${yieldValue}%`
        });

        setStatusData([
          { name: 'Pending', value: pendingCount },
          { name: 'Approved', value: approvedCount },
          { name: 'Rejected', value: rejectedCount }
        ]);

        setTodayActiveLeaves(activeLeaves);
        setTodayActiveODs(activeODs);

      } catch (error) {
        console.error('Failed to sync Mentor Dashboard metrics:', error);
        setErrorMsg('Could not connect to the tracking server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      <div className="p-6 bg-indigo-900 rounded-2xl text-white relative border border-indigo-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-indigo-900 rounded uppercase tracking-wider">
              Mentor Approval Portal
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
              Welcome, {metrics.name || 'Mentor'}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-sm">
            <div className="text-left pr-3 border-r border-white/10 text-xs font-bold text-white">
              {dayName}, {formattedDate}
            </div>
            <div className="text-left font-mono text-xs font-bold text-amber-400 min-w-[75px]">
              {formattedTime}
            </div>
          </div>
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

      {/* Charts & Today's Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-amber-500" />
              Request Status
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
              Overall Approval 
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
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name }) => name}
                      labelLine={{ stroke: '#9ca3af', strokeWidth: 1, length: 15, length2: 10 }}
                      isAnimationActive={false}
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
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Today's Active Absences Card */}
        <Link
          to="/mentor/today-absence"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Today's Absences - {new Date().toLocaleDateString()}</h3>
              <p className="text-[11px] text-slate-400">Students not available today</p>
            </div>
            <div className="p-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-md">
              <Calendar size={14} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-bold text-slate-700">Leave</span>
              </div>
              <span className="text-xl font-black text-indigo-900">{todayActiveLeaves}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-slate-700">On-Duty</span>
              </div>
              <span className="text-xl font-black text-amber-600">{todayActiveODs}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-700">Total Unavailable</span>
              </div>
              <span className="text-xl font-black text-emerald-700">{todayActiveLeaves + todayActiveODs}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-xs font-bold text-indigo-600 group-hover:text-amber-500 transition-colors">
            <span className="flex items-center gap-1">
              View full report <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
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