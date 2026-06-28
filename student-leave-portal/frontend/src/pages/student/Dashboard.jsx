import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Calendar, Clock, CheckCircle2, PlusCircle, Info, Quote, X, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import StatusCard from '../../components/cards/StatusCard';
import eventBus from '../../utils/eventBus';
import { useTheme } from '../../context/ThemeContext'; // adjust path as needed

// ---------- Toast Component ----------
const Toast = ({ message, emoji, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 50, scale: 0.9 }}
    transition={{ duration: 0.3 }}
    className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3"
  >
    <span className="text-2xl leading-none">{emoji}</span>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{message}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Just now</p>
    </div>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
      <X size={16} />
    </button>
  </motion.div>
);

// ---------- Gender theme palettes (accent colours only) ----------
const accentPalettes = {
  male: {
    primary: 'blue',
    primaryLight: 'blue-50',
    primaryDark: 'blue-800',
    primaryBorder: 'blue-200',
    textPrimary: 'text-blue-800',
    textSecondary: 'text-blue-600',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
    buttonShadow: 'shadow-blue-500/10',
    infoBg: 'bg-blue-50/60',
    infoBorder: 'border-blue-100/80',
    infoText: 'text-blue-800/90',
    feedGradient: 'from-blue-500 via-indigo-500 to-emerald-500',
    feedBadge: 'text-blue-600 bg-blue-50 border-blue-200',
    notificationBg: 'bg-blue-50/30',
    notificationBorder: 'border-blue-100',
    notificationHover: 'hover:bg-blue-50/60',
    unreadDot: 'bg-blue-500',
    timeBg: 'bg-blue-50/80',
    timeBorder: 'border-blue-100/70',
    timeText: 'text-blue-600',
    cardAccent: 'blue',
    quoteBorder: 'border-blue-200',
    quoteIconColor: 'text-blue-500',
    // Dark mode variants
    darkButtonBg: 'dark:bg-blue-700',
    darkButtonHover: 'dark:hover:bg-blue-800',
    darkInfoBg: 'dark:bg-blue-900/30',
    darkInfoBorder: 'dark:border-blue-800/50',
    darkInfoText: 'dark:text-blue-200',
    darkTimeBg: 'dark:bg-blue-900/30',
    darkTimeBorder: 'dark:border-blue-800/50',
    darkTimeText: 'dark:text-blue-300',
  },
  female: {
    primary: 'fuchsia',
    primaryLight: 'fuchsia-50',
    primaryDark: 'fuchsia-800',
    primaryBorder: 'fuchsia-200',
    textPrimary: 'text-fuchsia-800',
    textSecondary: 'text-fuchsia-600',
    buttonBg: 'bg-fuchsia-600',
    buttonHover: 'hover:bg-fuchsia-700',
    buttonShadow: 'shadow-fuchsia-500/10',
    infoBg: 'bg-fuchsia-50/60',
    infoBorder: 'border-fuchsia-100/80',
    infoText: 'text-fuchsia-800/90',
    feedGradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
    feedBadge: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200',
    notificationBg: 'bg-fuchsia-50/30',
    notificationBorder: 'border-fuchsia-100',
    notificationHover: 'hover:bg-fuchsia-50/60',
    unreadDot: 'bg-fuchsia-500',
    timeBg: 'bg-fuchsia-50/80',
    timeBorder: 'border-fuchsia-100/70',
    timeText: 'text-fuchsia-600',
    cardAccent: 'fuchsia',
    quoteBorder: 'border-fuchsia-200',
    quoteIconColor: 'text-fuchsia-500',
    // Dark mode variants
    darkButtonBg: 'dark:bg-fuchsia-700',
    darkButtonHover: 'dark:hover:bg-fuchsia-800',
    darkInfoBg: 'dark:bg-fuchsia-900/30',
    darkInfoBorder: 'dark:border-fuchsia-800/50',
    darkInfoText: 'dark:text-fuchsia-200',
    darkTimeBg: 'dark:bg-fuchsia-900/30',
    darkTimeBorder: 'dark:border-fuchsia-800/50',
    darkTimeText: 'dark:text-fuchsia-300',
  },
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
  const { darkMode, toggleTheme } = useTheme(); // from your context
  const [dateTime, setDateTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    totalLeaves: 0,
    totalOD: 0,
    pendingApprovals: 0,
    approvedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [accent, setAccent] = useState(accentPalettes.male);
  const [dailyQuote, setDailyQuote] = useState(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load daily quote – persists via localStorage for the day
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
      } catch (_) {}
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

  // Status config for toast emojis
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Submitted':
        return { emoji: '😊' };
      case 'Partially Approved':
        return { emoji: '🤔' };
      case 'Approved':
        return { emoji: '🎉' };
      default:
        return { emoji: 'ℹ️' };
    }
  };

  // Fetch data and detect changes for toasts
  const fetchDashboardData = async (showNewToasts = true) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('https://leave-od-approval.onrender.com/api/users/profile', config);

      if (data) {
        // Metrics
        setMetrics({
          totalLeaves: data.totalLeavesCount || 0,
          totalOD: data.totalODCount || 0,
          pendingApprovals: data.pendingCount || 0,
          approvedRequests: data.approvedCount || 0,
        });

        // Gender-based accent
        const gender = data.gender ? data.gender.toLowerCase().trim() : '';
        if (gender === 'female' || gender === 'f') {
          setAccent(accentPalettes.female);
        } else {
          setAccent(accentPalettes.male);
        }

        // Toast notifications for new activities
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

  // Initial load + polling every 5 seconds
  useEffect(() => {
    fetchDashboardData(false);
    const interval = setInterval(() => fetchDashboardData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Event bus refresh (instant from form submissions)
  useEffect(() => {
    const unsubscribe = eventBus.on('dashboardRefresh', () => {
      fetchDashboardData(true);
    });
    return unsubscribe;
  }, []);

  // Storage event cross‑tab support
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

  // Helper to combine accent classes with dark mode variants
  const accentClass = (key) => {
    const value = accent[key] || '';
    // For buttons and backgrounds, we need both light and dark variants
    // For simplicity, we combine – the actual dark classes are defined in the palette
    if (key === 'buttonBg') return `${accent.buttonBg} ${accent.darkButtonBg || ''}`;
    if (key === 'buttonHover') return `${accent.buttonHover} ${accent.darkButtonHover || ''}`;
    if (key === 'infoBg') return `${accent.infoBg} ${accent.darkInfoBg || ''}`;
    if (key === 'infoBorder') return `${accent.infoBorder} ${accent.darkInfoBorder || ''}`;
    if (key === 'infoText') return `${accent.infoText} ${accent.darkInfoText || ''}`;
    if (key === 'timeBg') return `${accent.timeBg} ${accent.darkTimeBg || ''}`;
    if (key === 'timeBorder') return `${accent.timeBorder} ${accent.darkTimeBorder || ''}`;
    if (key === 'timeText') return `${accent.timeText} ${accent.darkTimeText || ''}`;
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-slate-900">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase animate-pulse">
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
      className={`space-y-8 max-w-7xl mx-auto p-4 md:p-8 min-h-screen font-sans antialiased transition-colors duration-300
        ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}
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

      {/* Header with Dark Mode Toggle */}
      <div className={`flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b pb-6 transition-colors
        ${darkMode ? 'border-slate-700' : 'border-slate-200/60'}`}
      >
        <div className="space-y-1.5">
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Student Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className={`px-2.5 py-1 rounded-lg shadow-3xs font-bold 
              ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200/70 text-slate-700'}`}>
              {formattedDay}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} font-medium`}>{formattedDate}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className={`font-mono px-2.5 py-0.5 rounded-lg font-bold shadow-3xs transition-colors
              ${accentClass('timeBg')} ${accentClass('timeBorder')} ${accentClass('timeText')}`}>
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Action Buttons + Dark Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/student/apply-leave')}
            className={`inline-flex items-center justify-center gap-2 text-white font-bold text-xs tracking-wide uppercase px-5 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-98
              ${accentClass('buttonBg')} ${accentClass('buttonHover')}`}
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

      {/* Main content */}
      <div className="space-y-6 w-full">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pass accent color to StatusCard – it will handle dark mode internally via its own styles */}
          <StatusCard title="TOTAL LEAVES TAKEN" value={`${metrics.totalLeaves} Days`} icon={Calendar} color={accent.cardAccent} />
          <StatusCard title="TOTAL ON-DUTY (OD)" value={`${metrics.totalOD} Days`} icon={Award} color="emerald" />
          <StatusCard title="PENDING APPROVALS" value={`${metrics.pendingApprovals} Request${metrics.pendingApprovals === 1 ? '' : 's'}`} icon={Clock} color="amber" />
          <StatusCard title="APPROVED REQUESTS" value={`${metrics.approvedRequests} Item${metrics.approvedRequests === 1 ? '' : 's'}`} icon={CheckCircle2} color="indigo" />
        </div>

        {/* Daily Quote Card – adapts to dark mode */}
        {dailyQuote && (
          <div className={`bg-white dark:bg-slate-800 border rounded-2xl p-6 shadow-xs transition-colors
            ${darkMode ? 'border-slate-700' : accentClass('cardBorder')} ${accentClass('quoteBorder')}`}
          >
            <div className="flex items-start gap-4">
              <Quote className={`w-8 h-8 shrink-0 ${accentClass('quoteIconColor')}`} />
              <div>
                <p className={`text-lg md:text-xl font-semibold leading-relaxed ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  “{dailyQuote.text}”
                </p>
                <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  — {dailyQuote.author}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-3xs backdrop-blur-xs border transition-colors
          ${accentClass('infoBg')} ${accentClass('infoBorder')}`}
        >
          <Info className={`shrink-0 mt-0.5 ${accentClass('infoText')}`} size={16} />
          <p className={`text-xs leading-relaxed font-semibold ${accentClass('infoText')}`}>
            Exemption limits refresh dynamically per semester cycle. Please track active counts regularly before logging structural academic exemptions.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;