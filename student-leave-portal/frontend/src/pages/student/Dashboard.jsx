import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Calendar, Clock, CheckCircle2, PlusCircle, Info, Quote, X, Smile, Sparkle, Sparkles } from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';
import eventBus from '../../utils/eventBus';

// ---------- Toast Component (Light Navy/Amber/Silver) ----------
const Toast = ({ message, emoji, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 50, scale: 0.9 }}
    transition={{ duration: 0.3 }}
    className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white shadow-xl rounded-2xl border border-gray-300 p-4 flex items-start gap-3"
  >
    <span className="text-2xl leading-none">{emoji}</span>
    <div className="flex-1">
      <p className="text-sm font-bold text-blue-900 leading-tight">{message}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Just now</p>
    </div>
    <button onClick={onClose} className="text-gray-400 hover:text-blue-900 transition-colors">
      <X size={16} />
    </button>
  </motion.div>
);

// ---------- Unified Navy/Amber Palette (no gender split) ----------
const palette = {
  primary: 'blue-900',
  primaryLight: 'blue-50',
  primaryBorder: 'blue-200',
  accent: 'amber-500',
  accentLight: 'amber-50',
  accentBorder: 'amber-200',
  silver: 'gray-300',
  silverLight: 'gray-100',
  buttonBg: 'bg-blue-900',
  buttonHover: 'hover:bg-amber-500',
  buttonShadow: 'shadow-blue-900/20',
  infoBg: 'bg-amber-50/60',
  infoBorder: 'border-amber-200/80',
  infoText: 'text-blue-900/90',
  timeBg: 'bg-gray-100',
  timeBorder: 'border-gray-200',
  timeText: 'text-blue-900',
  quoteBorder: 'border-amber-200',
  quoteIconColor: 'text-amber-500',
};

// ---------- Daily Quotes ----------
const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
];

const getDailyQuote = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
};

// ---------- Main Component ----------
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
  const [toasts, setToasts] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load daily quote – persists via localStorage
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const stored = localStorage.getItem('dailyQuote');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayStr) {
          setDailyQuote(parsed.quote);
          return;
        }
      } catch (_) { }
    }
    const quote = getDailyQuote();
    setDailyQuote(quote);
    localStorage.setItem('dailyQuote', JSON.stringify({ date: todayStr, quote }));
  }, []);

  // Toast helper
  const showToast = (message, emoji) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, emoji }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Submitted': return { emoji: '😊' };
      case 'Partially Approved': return { emoji: '🤔' };
      case 'Approved': return { emoji: '🎉' };
      default: return { emoji: 'ℹ️' };
    }
  };

  // Fetch data
  const fetchDashboardData = async (showNewToasts = true) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('https://leave-od-approval.onrender.com/api/users/profile', config);

      if (data) {
        setMetrics({
          name: data.name || '',
          totalLeaves: data.totalLeavesCount || 0,
          totalOD: data.totalODCount || 0,
          pendingApprovals: data.pendingCount || 0,
          approvedRequests: data.approvedCount || 0,
        });

        if (showNewToasts && data.recentActivities && data.recentActivities.length > 0) {
          const lastActivity = data.recentActivities[0];
          if (lastActivity) {
            const config = getStatusConfig(lastActivity.status);
            showToast(lastActivity.message, config.emoji);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + polling
  useEffect(() => {
    fetchDashboardData(false);
    const interval = setInterval(() => fetchDashboardData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Event bus refresh
  useEffect(() => {
    const unsubscribe = eventBus.on('dashboardRefresh', () => {
      fetchDashboardData(true);
    });
    return unsubscribe;
  }, []);

  // Storage event cross‑tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dashboardRefresh') {
        localStorage.removeItem('dashboardRefresh');
        fetchDashboardData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Time formatting
  const formattedDate = dateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedDay = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedTime = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">
          Fetching details...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 min-h-screen font-sans antialiased bg-[#F8FAFC] text-gray-900"
    >
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              emoji={toast.emoji}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Header with Navy/Amber/Silver */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-blue-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" />
            Welcome,{' '}
            <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-amber-500 bg-clip-text text-transparent">
              {metrics.name || 'Student'}
            </span>
            !
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg shadow-sm font-bold bg-gray-100 border border-gray-200 text-gray-700">
              {formattedDay}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-600 font-medium">{formattedDate}</span>
            <span className="text-gray-300">•</span>
            <span className="font-mono px-2.5 py-0.5 rounded-lg font-bold shadow-sm bg-gray-100 border border-gray-200 text-blue-900">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/student/apply-leave')}
            className="inline-flex items-center justify-center gap-2 text-white font-bold text-xs tracking-wide uppercase px-5 py-3 rounded-xl shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-amber-500 bg-blue-900 active:scale-98"
          >
            <PlusCircle size={15} className="stroke-[2.5]" />
            Apply Leave
          </button>
          <button
            onClick={() => navigate('/student/apply-od')}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide uppercase px-5 py-3 rounded-xl shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:scale-98"
          >
            <PlusCircle size={15} className="stroke-[2.5]" />
            Apply On-Duty (OD)
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6 w-full">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatusCard title="TOTAL LEAVES TAKEN" value={`${metrics.totalLeaves} Days`} icon={Calendar} color="blue" />
          <StatusCard title="TOTAL ON-DUTY (OD)" value={`${metrics.totalOD} Days`} icon={Award} color="amber" />
          <StatusCard title="PENDING APPROVALS" value={`${metrics.pendingApprovals} Request${metrics.pendingApprovals === 1 ? '' : 's'}`} icon={Clock} color="gray" />
          <StatusCard title="APPROVED REQUESTS" value={`${metrics.approvedRequests} Item${metrics.approvedRequests === 1 ? '' : 's'}`} icon={CheckCircle2} color="emerald" />
        </div>

        {/* Daily Quote – Navy/Amber accents */}
        {dailyQuote && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Quote className="w-8 h-8 shrink-0 text-amber-500" />
              <div>
                <p className="text-lg md:text-xl font-semibold leading-relaxed text-gray-800">
                  “{dailyQuote.text}”
                </p>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  — {dailyQuote.author}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner – Amber background with Navy text */}
        <div className="p-4 rounded-2xl flex items-start gap-3 shadow-sm border border-amber-200/80 bg-amber-50/60">
          <Info className="shrink-0 mt-0.5 text-blue-900/90" size={16} />
          <p className="text-xs leading-relaxed font-semibold text-blue-900/90">
            Stay updated with your leave and OD records — all counts refresh in real‑time after each approval or new submission.
            For any discrepancies, please contact your Mentor.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;