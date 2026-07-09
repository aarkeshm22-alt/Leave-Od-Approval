import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Landmark, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const BASE_URL = 'https://leave-od-approval.onrender.com';

const HodDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartType, setChartType] = useState('bar');
  const [loggedInUser, setLoggedInUser] = useState("HOD Admin");
  
  // Real data states
  const [studentsCount, setStudentsCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [metrics, setMetrics] = useState({
    approvedCount: 0,
    pendingCount: 0,
    odCount: 0,
    leaveCount: 0,
    odPercentage: 0,
    leavePercentage: 0,
  });
  // Today's active counts
  const [todayActiveLeaves, setTodayActiveLeaves] = useState(0);
  const [todayActiveODs, setTodayActiveODs] = useState(0);

  // Set logged-in user from auth context
  useEffect(() => {
    if (user) {
      const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'HOD Admin';
      setLoggedInUser(name);
    }
  }, [user]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔥 FIXED: UTC-based date comparison to avoid timezone issues
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

  // Fetch real data
  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // 1. Fetch all students and mentors
        const [studentsRes, mentorsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/users/students-by-mentor`, config),
          axios.get(`${BASE_URL}/api/users/mentors-by-hod`, config)
        ]);

        const studentsList = studentsRes.data?.data || [];
        setStudentsCount(studentsList.length);

        const mentorsList = mentorsRes.data?.data || [];
        setFacultyCount(mentorsList.length);

        // 2. Fetch pending and actioned requests
        const [leavesPending, leavesActioned, odPending, odActioned] = await Promise.all([
          axios.get(`${BASE_URL}/api/leaves/hod/pending?tab=PENDING`, config),
          axios.get(`${BASE_URL}/api/leaves/hod/pending?tab=ACTIONED`, config),
          axios.get(`${BASE_URL}/api/od/hod/pending?tab=PENDING`, config),
          axios.get(`${BASE_URL}/api/od/hod/pending?tab=ACTIONED`, config)
        ]).catch(() => ({ data: { data: [] } }));

        const getData = (res) => res?.data?.data || [];

        const leavesPendingList = getData(leavesPending);
        const leavesActionedList = getData(leavesActioned);
        const odPendingList = getData(odPending);
        const odActionedList = getData(odActioned);

        // Overall counts
        const totalPending = leavesPendingList.length + odPendingList.length;
        const totalApproved = leavesActionedList.filter(i => i.status === 'Approved').length + 
                              odActionedList.filter(i => i.status === 'Approved').length;

        const odCount = odPendingList.length + odActionedList.filter(i => i.status === 'Approved').length;
        const leaveCount = leavesPendingList.length + leavesActionedList.filter(i => i.status === 'Approved').length;

        const total = odCount + leaveCount;
        const odPercentage = total > 0 ? Math.round((odCount / total) * 100) : 0;
        const leavePercentage = total > 0 ? Math.round((leaveCount / total) * 100) : 0;

        setMetrics({
          approvedCount: totalApproved,
          pendingCount: totalPending,
          odCount,
          leaveCount,
          odPercentage,
          leavePercentage,
        });

        // 🔥 Today's active counts – include both Approved and Partially Approved
        const allLeaves = [...leavesPendingList, ...leavesActionedList];
        const allODs = [...odPendingList, ...odActionedList];

        // Filter only approved or partially approved (since Partially Approved means student is away)
        const activeLeaves = allLeaves.filter(item => 
          (item.status === 'Approved' || item.status === 'Partially Approved') && 
          isActiveToday(item.fromDate, item.toDate)
        );
        const activeODs = allODs.filter(item => 
          (item.status === 'Approved' || item.status === 'Partially Approved') && 
          isActiveToday(item.fromDate, item.toDate)
        );

        setTodayActiveLeaves(activeLeaves.length);
        setTodayActiveODs(activeODs.length);

      } catch (error) {
        console.error('Failed to fetch HOD dashboard data:', error);
        setErrorMsg('Could not load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });

  const administrativeMetrics = [
    { 
      title: "Total Registered Students", 
      value: `${studentsCount} Students`, 
      description: "CSE department", 
      icon: Landmark, 
      color: "text-indigo-800 bg-indigo-50 border-indigo-200" 
    },
    { 
      title: "Total Faculty Registered", 
      value: `${facultyCount} Members`, 
      description: "Mentors under your HOD", 
      icon: Users, 
      color: "text-amber-600 bg-amber-50 border-amber-200" 
    },
    { 
      title: "Pending Requests", 
      value: `${metrics.pendingCount} Pending`, 
      description: "Requires HOD approval", 
      icon: Activity, 
      color: "text-amber-600 bg-amber-50 border-amber-200" 
    },
    { 
      title: "Approved Requests", 
      value: `${metrics.approvedCount} Approved`, 
      description: "Verified records", 
      icon: CheckCircle2, 
      color: "text-emerald-700 bg-emerald-50 border-emerald-200" 
    },
  ];

  if (authLoading || loading) {
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

  if (errorMsg) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="shrink-0" />
        <span>{errorMsg}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12 transition-all duration-300">
      
      {/* Header Banner */}
      <div className="p-6 bg-indigo-900 rounded-2xl text-white relative border border-indigo-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-indigo-900 rounded uppercase tracking-wider">
              HOD Approval Portal
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
              Welcome, {loggedInUser}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-sm">
            <div className="text-left pr-3 border-r border-white/10 text-xs font-bold text-white">
              {formattedDate}
            </div>
            <div className="text-left font-mono text-xs font-bold text-amber-400 min-w-[75px]">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {administrativeMetrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{card.title}</p>
                  <h3 className="text-xl font-black text-indigo-900 mt-0.5 tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-2 rounded-lg border ${card.color} shrink-0`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-50">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Graphs & Today's Summary Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Graph Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Analytical Board</h3>
              <p className="text-[11px] text-slate-400">Ratio of OD vs Leave Counts</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-indigo-900 shadow-3xs' : 'text-slate-500'}`}
              >
                Bar
              </button>
              <button 
                onClick={() => setChartType('pie')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartType === 'pie' ? 'bg-white text-indigo-900 shadow-3xs' : 'text-slate-500'}`}
              >
                Pie
              </button>
            </div>
          </div>
          
          <div className="h-56 flex items-center justify-center">
            {chartType === 'bar' ? (
              <div className="w-full h-full flex items-end justify-center gap-10 px-4">
                <div className="flex flex-col items-center gap-2 w-24">
                  <span className="text-sm font-bold text-slate-600">{metrics.odCount} OD</span>
                  <div 
                    style={{ 
                      height: `${Math.max(metrics.odPercentage, 10)}%`,
                      minHeight: '20px'
                    }} 
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg shadow-md transition-all duration-500"
                  />
                  <span className="text-[10px] font-black text-slate-500">On-Duty</span>
                  <span className="text-xs font-bold text-indigo-600">{metrics.odPercentage}%</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-24">
                  <span className="text-sm font-bold text-slate-600">{metrics.leaveCount} Leave</span>
                  <div 
                    style={{ 
                      height: `${Math.max(metrics.leavePercentage, 10)}%`,
                      minHeight: '20px'
                    }} 
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg shadow-md transition-all duration-500"
                  />
                  <span className="text-[10px] font-black text-slate-500">Leave</span>
                  <span className="text-xs font-bold text-amber-500">{metrics.leavePercentage}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-32 h-32">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="12"
                      strokeDasharray={`${metrics.odPercentage * 2.513} 251.3`}
                      strokeLinecap="round"
                    />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="12"
                      strokeDasharray={`${metrics.leavePercentage * 2.513} 251.3`}
                      strokeDashoffset={`-${metrics.odPercentage * 2.513}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-lg font-black text-indigo-900">{metrics.odCount + metrics.leaveCount}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-indigo-500"></span>
                    <span className="font-bold text-slate-700">OD: {metrics.odCount} ({metrics.odPercentage}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-400"></span>
                    <span className="font-bold text-slate-700">Leave: {metrics.leaveCount} ({metrics.leavePercentage}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔗 Today's Active Absence Summary – clickable */}
        <Link
          to="/hod/today-absence"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex flex-col hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Today's Absences - ({new Date().toLocaleDateString()})</h3>
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
    </div>
  );
};
    
export default HodDashboard;