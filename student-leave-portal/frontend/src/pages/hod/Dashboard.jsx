import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  CornerDownRight,
  Loader2,
  Users
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
  const [recentApprovals, setRecentApprovals] = useState([]);

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

        // 1. Fetch all students and mentors (using the correct HOD-filtered endpoint)
        const [studentsRes, mentorsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/users/students-by-mentor`, config),
          axios.get(`${BASE_URL}/api/users/mentors-by-hod`, config) // ✅ UPDATED endpoint
        ]);

        const studentsList = studentsRes.data?.data || [];
        setStudentsCount(studentsList.length);

        // ✅ Now mentorsRes.data.data contains the correct list filtered by HOD
        const mentorsList = mentorsRes.data?.data || [];
        setFacultyCount(mentorsList.length);

        // 2. Fetch pending and actioned requests for counts
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

        // Counts
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

        // 3. Recent approvals (latest 5 from actioned lists)
        const allActioned = [...leavesActionedList, ...odActionedList]
          .filter(i => i.status === 'Approved')
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
          .slice(0, 5)
          .map(item => {
            const student = item.student || {};
            const studentName = item.studentName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';
            const regNo = item.registerNo || student.registerNo || 'N/A';
            const type = item.type || item.mappedType || (item.class === 'Leave' ? 'Leave' : 'On-Duty');
            const reason = item.reason || 'No reason';
            const status = item.status || 'Approved';

            return {
              regNo,
              studentName,
              type,
              reason,
              status,
            };
          });

        setRecentApprovals(allActioned);

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
      value: `${studentsCount} Units`, 
      description: "All departments", 
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
      title: "Awaiting Sign-Off", 
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

      {/* Graphs & Logs Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Graph Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Statistical Metrics Tally</h3>
              <p className="text-[11px] text-slate-400">Ratio distributions of OD counters vs Leaves</p>
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
                Donut
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

        {/* Verification History Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900">Verification History</h3>
              <p className="text-[11px] text-slate-400">Approved logs showing true values</p>
            </div>
            <div className="p-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md">
              <ShieldCheck size={14} />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {recentApprovals.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No approved records yet.</p>
            ) : (
              recentApprovals.map((activity, index) => (
                <div key={index} className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/20 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between font-black text-slate-900">
                    <span className="truncate">{activity.studentName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-white border border-emerald-200 text-emerald-700 rounded-sm font-sans uppercase font-bold">
                      {activity.status}
                    </span>
                  </div>
                  
                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <CornerDownRight size={10} className="text-slate-300 shrink-0" />
                    <span className="truncate">
                      {activity.type} — <span className="italic font-medium text-slate-400">{activity.reason}</span>
                    </span>
                  </div>
                  
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                    REG: {activity.regNo}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HodDashboard;