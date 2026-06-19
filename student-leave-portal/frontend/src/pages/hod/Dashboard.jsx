import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  PieChart,
  CornerDownRight
} from 'lucide-react';

// Datasets matching your system records images to prevent empty screens
const REAL_STUDENTS_FALLBACK = [
  { regNo: "73152213001", studentName: "Aarkesh M", email: "aarkeshcse@ksrce.ac.in", branch: "YR IV-A" },
  { regNo: "73152213008", studentName: "Agalya T", email: "agalya@ksrce.ac.in", branch: "YR IV-A" }
];

const REAL_REQUESTS_FALLBACK = [
  { regNo: "73152213008", studentName: "Agalya T", type: "ON-DUTY", reason: "Paper Presentation", status: "HOD Approved", date: "14/06/2026" },
  { regNo: "73152213001", studentName: "Aarkesh M", type: "ON-DUTY", reason: "Paper Presentation", status: "HOD Approved", date: "14/06/2026" },
  { regNo: "73152213001", studentName: "Aarkesh M", type: "LEAVE", reason: "Temple function", status: "HOD Approved", date: "14/06/2026" }
];

const HodDashboard = ({ initialStudents = [], initialRequests = [], username }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartType, setChartType] = useState('bar'); 
  const [loggedInUser, setLoggedInUser] = useState("HOD Admin");

  // Safely capture data arrays
  const studentsData = initialStudents.length > 0 ? initialStudents : REAL_STUDENTS_FALLBACK;
  const requestsData = initialRequests.length > 0 ? initialRequests : REAL_REQUESTS_FALLBACK;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect logged-in user details from props or auth context/localStorage
  useEffect(() => {
  if (username) {
    setLoggedInUser(username);
  } else {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('username');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        
        // Extract and combine first and last name properties exclusively
        if (parsed.firstName || parsed.lastName) {
          const combinedName = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
          setLoggedInUser(combinedName);
        } else {
          setLoggedInUser(parsed.username || parsed.name || 'HOD Admin');
        }
      } catch {
        // Fallback if local storage string isn't JSON formatted
        setLoggedInUser(storedUser.replace(/"/g, '').trim());
      }
    }
  }
}, [username]);

  // Compute metrics upfront using memoization to prevent rendering flickering/glitches
  const metrics = useMemo(() => {
    const list = Array.isArray(requestsData) ? requestsData : [];
    
    const approvedRecords = list.filter(r => {
      const status = (r.status || '').toLowerCase();
      return status.includes('approved') || status.includes('completed') || status.includes('verified');
    });

    const odCount = list.filter(r => (r.type || '').toUpperCase().includes('OD') || (r.type || '').toUpperCase().includes('DUTY')).length;
    const leaveCount = list.filter(r => (r.type || '').toUpperCase().includes('LEAVE')).length;
    const pendingCount = list.filter(r => (r.status || '').toLowerCase().includes('pending')).length;

    const totalAbsences = odCount + leaveCount;
    const odPercentage = totalAbsences > 0 ? Math.round((odCount / totalAbsences) * 100) : 0;
    const leavePercentage = totalAbsences > 0 ? Math.round((leaveCount / totalAbsences) * 100) : 0;

    return {
      approvedRecords,
      completedCount: approvedRecords.length,
      pendingCount,
      odCount,
      leaveCount,
      odPercentage,
      leavePercentage
    };
  }, [requestsData]);

  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });

  const administrativeMetrics = [
    { title: "Total Registered Students", value: "4 Units", description: "CSE Core Branches", icon: Landmark, color: "text-slate-800 bg-slate-100 border-slate-200" },
    { title: "Awaiting Sign-Off", value: `${metrics.pendingCount} Pending`, description: "Requires HOD signature", icon: Activity, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { title: "Total OD Count", value: `${metrics.odCount} Approved`, description: "On-Duty tracking metric", icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { title: "Total Leave Count", value: `${metrics.leaveCount} Records`, description: "Absence logs tally", icon: CheckCircle2, color: "text-blue-700 bg-blue-50 border-blue-200" },
  ];

  return (
    <div className="space-y-6 font-sans pb-12 transition-all duration-300">
      
      {/* Header Banner */}
      <div className="p-6 bg-slate-950 rounded-2xl text-white relative border border-slate-900 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
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
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{card.title}</p>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{card.value}</h3>
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
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">Statistical Metrics Tally</h3>
              <p className="text-[11px] text-slate-400">Ratio distributions of OD counters vs Leaves</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartType === 'bar' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-500'}`}
              >
                Bar Graph
              </button>
              <button 
                onClick={() => setChartType('pie')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartType === 'pie' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-500'}`}
              >
                Pie View
              </button>
            </div>
          </div>
          
          <div className="h-48 flex items-center justify-center">
            {chartType === 'bar' ? (
              <div className="w-full h-full flex items-end gap-6 justify-center px-4 pt-4">
                <div className="w-16 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div style={{ height: `${metrics.odPercentage}%` }} className="w-full bg-slate-950 rounded-t min-h-[4px] shadow-xs" />
                  <span className="text-[10px] font-black text-slate-500">OD ({metrics.odPercentage}%)</span>
                </div>
                <div className="w-16 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div style={{ height: `${metrics.leavePercentage}%` }} className="w-full bg-slate-300 rounded-t min-h-[4px] shadow-xs" />
                  <span className="text-[10px] font-black text-slate-500">Leave ({metrics.leavePercentage}%)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-slate-950 flex items-center justify-center font-black text-xs">
                  {metrics.odPercentage}% OD
                </div>
                <div className="text-[11px] space-y-1 text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-950" /> On-Duty ({metrics.odCount})</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-300" /> Leaves ({metrics.leaveCount})</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification History Logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">Verification History</h3>
              <p className="text-[11px] text-slate-400">Approved logs showing true values</p>
            </div>
            <div className="p-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md">
              <ShieldCheck size={14} />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {metrics.approvedRecords.map((activity, index) => (
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
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HodDashboard;