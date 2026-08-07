import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, Award, Activity, Info, Clock, ArrowRight, 
  Loader2, PieChart as PieIcon, BarChart as BarIcon 
} from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';
import { useAuth } from '../../hooks/useAuth';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BASE_URL = 'https://leave-od-approval.onrender.com';

const CADashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState({
    name: '',
    assignedStudentsCount: 0,
    totalLeaves: 0,
    totalOD: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayActiveLeaves, setTodayActiveLeaves] = useState(0);
  const [todayActiveODs, setTodayActiveODs] = useState(0);

  // Chart data
  const [statusData, setStatusData] = useState([
    { name: 'Leave', value: 0 },
    { name: 'On-Duty', value: 0 },
  ]);
  const [barData, setBarData] = useState([]);

  const COLORS = ['#4F46E5', '#F59E0B']; // indigo, amber

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // UTC-based date check
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

  const getSectionLetter = (section) => {
    if (!section || section === 'N/A') return 'N/A';
    const trimmed = section.trim().toUpperCase();
    if (trimmed.includes('SECTION')) {
      const parts = trimmed.split(' ');
      return parts[parts.length - 1];
    }
    return trimmed;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
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

        // 1. Fetch profile (for basic metrics)
        const { data } = await axios.get(`${BASE_URL}/api/users/profile`, config);
        if (data) {
          setMetrics({
            name: data.name || 'CA2',
            assignedStudentsCount: data.assignedStudentsCount || 0,
            totalLeaves: data.totalLeavesCount || 0,
            totalOD: data.totalODCount || 0,
          });
        }

        // 2. Fetch students to compute today's active absences & chart data
        const studentsRes = await axios.get(`${BASE_URL}/api/ca2/my-students`, config);
        const students = studentsRes.data?.data || [];

        let activeLeaves = 0;
        let activeODs = 0;
        let totalLeavesCount = 0;
        let totalODCount = 0;
        const groupMap = {};

        students.forEach(student => {
          // Leaves
          (student.leaves || []).forEach(leave => {
            if (leave.status === 'Approved' || leave.status === 'Partially Approved') {
              totalLeavesCount++;
              if (isActiveToday(leave.fromDate, leave.toDate)) activeLeaves++;
            }
            // Group for bar chart
            const key = `${student.year} - ${getSectionLetter(student.section)}`;
            if (!groupMap[key]) groupMap[key] = { year: student.year, section: getSectionLetter(student.section), leaves: 0, ods: 0 };
            if (leave.status === 'Approved' || leave.status === 'Partially Approved') {
              groupMap[key].leaves++;
            }
          });
          // ODs
          (student.ods || []).forEach(od => {
            if (od.status === 'Approved' || od.status === 'Partially Approved') {
              totalODCount++;
              if (isActiveToday(od.fromDate, od.toDate)) activeODs++;
            }
            const key = `${student.year} - ${getSectionLetter(student.section)}`;
            if (!groupMap[key]) groupMap[key] = { year: student.year, section: getSectionLetter(student.section), leaves: 0, ods: 0 };
            if (od.status === 'Approved' || od.status === 'Partially Approved') {
              groupMap[key].ods++;
            }
          });
        });

        setTodayActiveLeaves(activeLeaves);
        setTodayActiveODs(activeODs);

        // Chart data
        setStatusData([
          { name: 'Leave', value: totalLeavesCount },
          { name: 'On-Duty', value: totalODCount },
        ]);

        // Bar data
        const barKeys = Object.keys(groupMap).sort();
        const barChartData = barKeys.map(key => ({
          name: key,
          Leave: groupMap[key].leaves,
          'On-Duty': groupMap[key].ods,
          total: groupMap[key].leaves + groupMap[key].ods,
        }));
        setBarData(barChartData);

      } catch (error) {
        console.error('Failed to fetch CA2 dashboard metrics:', error);
        setErrorMsg('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  // Date/time formatting
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' });

  // Chart data for pie (if total zero, show empty)
  const pieData = statusData.filter(d => d.value > 0);
  const hasChartData = pieData.length > 0 || barData.length > 0;

  if (authLoading || loading) {
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
      {/* Header with HOD-style badge and date/time */}
      <div className="p-6 bg-indigo-900 rounded-2xl text-white relative border border-indigo-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-indigo-900 rounded uppercase tracking-wider">
              CA2 Approval Portal
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
              Welcome, {metrics.name}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* Charts & Today's Summary Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts – span 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Absence Split</h3>
            </div>
            <div className="w-full" style={{ height: '240px' }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#9ca3af', strokeWidth: 1, length: 15, length2: 10 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <BarIcon size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-indigo-900">Absences by Year & Section</h3>
            </div>
            <div className="w-full" style={{ height: '240px' }}>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, angle: -15, textAnchor: 'end' }} height={50} interval={0} />
                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Leave" stackId="stack" fill={COLORS[0]} />
                    <Bar dataKey="On-Duty" stackId="stack" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Active Absences Card – clickable */}
        <Link
          to="/ca2/today-absence"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Today's Active Absences</h3>
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
          As a Class Advisor 2, you can view student details and export reports.
          For approvals, please contact the primary mentor or HOD.
        </p>
      </div>
    </motion.div>
  );
};

export default CADashboard;