import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  MessageCircle, Eye, Loader, BarChart3, 
  Filter, Search, Lock, Unlock, X,
  Calendar, Clock, User, Info, CheckCircle,
  Key, Sparkles, Wand2, Star, Feather,
  Send, Mail, Shield, Award, BookOpen,
  Users, GraduationCap, AlertCircle,
  Check, ChevronRight, Zap, Moon, Sun,
  Cloud, CloudRain, Snowflake, Wind,
  Heart, Coffee, Music, Camera, Film,
  Globe, MapPin, Compass, Navigation,
  Gift, Crown, Flag, Bell, Volume2,
  Home, Layers, Grid, List, Menu,
  Hash, ArrowLeft, ArrowRight
} from 'lucide-react';
import { hodChatAPI } from '../../services/chatService';
import toast from 'react-hot-toast';

const HODChatManagement = () => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [filter, setFilter] = useState({ year: 'all' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [revealedMessages, setRevealedMessages] = useState({});
  
  // Lock & Key states
  const [isLocked, setIsLocked] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [keyPosition, setKeyPosition] = useState(0);
  const [lockRotation, setLockRotation] = useState(0);
  const [showKey, setShowKey] = useState(false);

  // Beautiful Hogwarts House Colors for messages
  const houseColors = [
    { 
      bg: 'from-amber-50 to-orange-50', 
      border: 'border-amber-200',
      accent: 'bg-amber-500',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-700',
      shadow: 'shadow-amber-200/30',
      hover: 'hover:shadow-amber-300/40'
    },
    { 
      bg: 'from-blue-50 to-indigo-50', 
      border: 'border-blue-200',
      accent: 'bg-blue-500',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-700',
      shadow: 'shadow-blue-200/30',
      hover: 'hover:shadow-blue-300/40'
    },
    { 
      bg: 'from-emerald-50 to-teal-50', 
      border: 'border-emerald-200',
      accent: 'bg-emerald-500',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-700',
      shadow: 'shadow-emerald-200/30',
      hover: 'hover:shadow-emerald-300/40'
    },
    { 
      bg: 'from-purple-50 to-pink-50', 
      border: 'border-purple-200',
      accent: 'bg-purple-500',
      text: 'text-purple-800',
      badge: 'bg-purple-100 text-purple-700',
      shadow: 'shadow-purple-200/30',
      hover: 'hover:shadow-purple-300/40'
    },
    { 
      bg: 'from-rose-50 to-red-50', 
      border: 'border-rose-200',
      accent: 'bg-rose-500',
      text: 'text-rose-800',
      badge: 'bg-rose-100 text-rose-700',
      shadow: 'shadow-rose-200/30',
      hover: 'hover:shadow-rose-300/40'
    },
    { 
      bg: 'from-cyan-50 to-sky-50', 
      border: 'border-cyan-200',
      accent: 'bg-cyan-500',
      text: 'text-cyan-800',
      badge: 'bg-cyan-100 text-cyan-700',
      shadow: 'shadow-cyan-200/30',
      hover: 'hover:shadow-cyan-300/40'
    },
  ];

  const getMessageColor = (index) => {
    return houseColors[index % houseColors.length];
  };

  const years = ['all', 'I', 'II', 'III', 'IV'];

  useEffect(() => {
    if (isUnlocked) {
      fetchMessages();
      fetchStats();
    }
  }, [filter, pagination.page, isUnlocked]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 20,
        ...(filter.year !== 'all' && { year: filter.year })
      };
      const response = await hodChatAPI.getMessages(params);
      setMessages(response.data.data || []);
      setStats(response.data.stats || { total: 0, pending: 0, viewed: 0, unread: 0 });
      setPagination(response.data.pagination || { page: 1, total: 0, pages: 0 });
      
      const revealed = {};
      response.data.data?.forEach(msg => {
        if (msg.isRead) {
          revealed[msg._id] = true;
        }
      });
      setRevealedMessages(revealed);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await hodChatAPI.getStats();
      setStats(response.data.data?.stats || { total: 0, pending: 0, viewed: 0, unread: 0 });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleRevealMessage = async (msg) => {
    if (!msg.isRead) {
      try {
        setViewingMessage(msg._id);
        const response = await hodChatAPI.viewMessage(msg._id);
        
        setMessages(prevMessages => 
          prevMessages.map(m => 
            m._id === msg._id 
              ? { ...m, isRead: true, message: response.data.data.message }
              : m
          )
        );
        
        setRevealedMessages(prev => ({ ...prev, [msg._id]: true }));
        fetchStats();
        toast.success('✨ Message revealed!');
      } catch (error) {
        console.error('View message error:', error);
        toast.error('Failed to reveal message');
      } finally {
        setViewingMessage(null);
      }
    } else {
      setRevealedMessages(prev => ({ ...prev, [msg._id]: true }));
    }
  };

  const handleInfoClick = (msg) => {
    setSelectedMessage(msg);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedMessage(null);
  };

  const handleLockClick = () => {
    if (!isUnlocking && isLocked) {
      setIsUnlocking(true);
      setShowKey(true);
      
      let progress = 0;
      const keyInterval = setInterval(() => {
        progress += 2;
        setKeyPosition(progress);
        
        if (progress >= 50) {
          clearInterval(keyInterval);
          
          let rotation = 0;
          const rotationInterval = setInterval(() => {
            rotation += 5;
            setLockRotation(rotation);
            
            if (rotation >= 90) {
              clearInterval(rotationInterval);
              
              setTimeout(() => {
                setIsUnlocking(false);
                setIsUnlocked(true);
                setIsLocked(false);
                setKeyPosition(100);
                toast.success('🔓 Chamber of Secrets opened!');
              }, 300);
            }
          }, 50);
        }
      }, 30);
    }
  };

  const handleReset = () => {
    setIsLocked(true);
    setIsUnlocked(false);
    setIsUnlocking(false);
    setKeyPosition(0);
    setLockRotation(0);
    setShowKey(false);
    setMessages([]);
    setStats(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateFull = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getYearText = (year) => {
    return year || '?';
  };

  // Lock Screen - Mobile Responsive
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-all duration-700 relative overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0015] via-[#1a0a2e] to-[#0a0015]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's',
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'][Math.floor(Math.random() * 5)],
                opacity: 0.3 + Math.random() * 0.7
              }}
            />
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
            {showKey && (
              <div 
                className="absolute transition-all duration-300 ease-in-out"
                style={{
                  left: `${30 - (keyPosition * 0.4)}%`,
                  top: '50%',
                  transform: `translateY(-50%) rotate(${keyPosition * 0.5}deg)`,
                  opacity: keyPosition > 10 ? 1 : 0,
                  zIndex: 20
                }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                  <Key 
                    size={36}
                    className="text-yellow-400 drop-shadow-lg"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))'
                    }}
                  />
                </div>
              </div>
            )}

            <div 
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isUnlocking ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={handleLockClick}
              style={{
                transform: `rotate(${lockRotation}deg)`,
                transition: 'transform 0.1s ease-in-out'
              }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] p-[3px]">
                <div className={`w-full h-full rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-[#1a0a2e]' : 'bg-[#1a0a2e]'
                }`}>
                  {isUnlocking ? (
                    <div className="flex items-center justify-center">
                      <Lock 
                        size={36}
                        className="text-yellow-400"
                        style={{
                          animation: 'shake 0.3s ease-in-out infinite alternate'
                        }}
                      />
                    </div>
                  ) : (
                    <Lock size={36} className="text-yellow-400" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50" />
            </div>

            {isUnlocking && (
              <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
                <span className="text-yellow-400 text-xs sm:text-sm font-bold animate-pulse">
                  🔓 Unlocking...
                </span>
                <div className="w-24 sm:w-32 h-1 bg-yellow-500/20 rounded-full mx-auto mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-100"
                    style={{ width: `${keyPosition}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="mt-12 sm:mt-20 text-sm text-slate-400 font-medium text-center">Click the lock to access messages</p>
        </div>
      </div>
    );
  }

  // ✅ Harry Potter Themed Chat Screen - Mobile Responsive
  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 transition-all duration-500 relative overflow-hidden">
      
      {/* === BEAUTIFUL MAGICAL BACKGROUND === */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A0A00] via-[#2D1508] to-[#1A0A00]">
        {/* Floating Candles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-candle"
            style={{
              width: '2px',
              height: '8px',
              top: Math.random() * 60 + 10 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
              background: 'linear-gradient(to top, #F59E0B, #FCD34D, #FEF3C7)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.1)',
              opacity: 0.6 + Math.random() * 0.4
            }}
          />
        ))}
        
        {/* Warm Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[600px] h-[300px] sm:h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
        
        {/* Table lines (decorative) */}
        <div className="absolute bottom-1/4 left-0 right-0 h-[1px] bg-amber-500/10" />
        <div className="absolute bottom-1/3 left-0 right-0 h-[1px] bg-amber-500/5" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER - Mobile Responsive */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-purple-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/20 backdrop-blur-sm border border-amber-200/30 shadow-lg shadow-amber-200/20">
              <Wand2 size={20} className="sm:w-7 sm:h-7 text-amber-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-purple-600 to-pink-600">
                View Student Messages
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-purple-500/70 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open · Tap to reveal · <Info size={10} className="sm:w-3 sm:h-3 inline" /> for details
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-200/50 shadow-sm">
              <Unlock size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Open</span>
            </span>
            
            <button
              onClick={handleReset}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-full bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <Lock size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <BarChart3 size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1" />
              <span className="hidden sm:inline">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
            </button>
          </div>
        </div>

        {/* STATS - Mobile Responsive */}
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'from-blue-400 to-indigo-500', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200' },
              { label: 'Viewed', value: stats.viewed, color: 'from-emerald-400 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200' },
              { label: 'Unread', value: stats.unread, color: 'from-rose-400 to-pink-500', bg: 'from-rose-50 to-pink-50', border: 'border-rose-200' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`p-2 sm:p-3 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.bg} border ${stat.border} shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.label}
                </p>
                <p className={`text-lg sm:text-2xl md:text-3xl font-black mt-0.5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value || 0}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* FILTER - Mobile Responsive */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/30 shadow-sm">
          <Filter size={14} className="sm:w-4 sm:h-4 text-purple-500" />
          <span className="text-[10px] sm:text-xs font-bold uppercase text-purple-600">Filter:</span>
          <select
            value={filter.year}
            onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
            className="flex-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-medium rounded-lg border border-purple-200/50 bg-white/80 text-purple-800 outline-none focus:ring-2 focus:ring-purple-300 transition-all"
          >
            <option value="all">All Years</option>
            <option value="I"><Star size={8} className="inline mr-1" /> I Year</option>
            <option value="II"><Star size={8} className="inline mr-1" /> II Year</option>
            <option value="III"><Star size={8} className="inline mr-1" /> III Year</option>
            <option value="IV"><Star size={8} className="inline mr-1" /> IV Year</option>
          </select>

          <button
            onClick={fetchMessages}
            className="px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-400/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Search size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* MESSAGES - Mobile Responsive */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-200 border-t-amber-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-amber-400 to-purple-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl bg-white/50 backdrop-blur-sm border border-purple-200/30">
            <MessageCircle size={40} className="sm:w-14 sm:h-14 mx-auto mb-3 text-purple-300" />
            <h3 className="text-lg sm:text-xl font-bold text-purple-700">No messages yet</h3>
            <p className="text-xs sm:text-sm text-purple-400">Students haven't sent any messages</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, index) => {
              const isRevealed = revealedMessages[msg._id] || msg.isRead;
              const isPending = !msg.isRead;
              const colors = getMessageColor(index);

              return (
                <div
                  key={msg._id}
                  className={`group relative p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} shadow-sm ${colors.shadow} ${colors.hover} transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden`}
                  onClick={() => handleRevealMessage(msg)}
                >
                  {/* Magical Sparkle Effect - Hidden on mobile */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none hidden sm:block">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-amber-300/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-sparkle"
                        style={{
                          width: Math.random() * 4 + 2 + 'px',
                          height: Math.random() * 4 + 2 + 'px',
                          top: Math.random() * 100 + '%',
                          left: Math.random() * 100 + '%',
                          animationDelay: Math.random() * 2 + 's',
                          backgroundColor: ['#FCD34D', '#F472B6', '#60A5FA', '#34D399', '#A78BFA'][Math.floor(Math.random() * 5)],
                        }}
                      />
                    ))}
                  </div>

                  {/* Decorative accent line */}
                  <div className={`absolute top-0 left-0 w-0.5 sm:w-1 h-full ${colors.accent} rounded-l-2xl transition-all duration-500 ${isRevealed ? 'h-full' : 'h-1/2 group-hover:h-full'}`} />
                  
                  {/* Status Badge */}
                  {!isPending && (
                    <div className="flex items-center justify-end mb-1 sm:mb-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold rounded-full ${colors.badge} border ${colors.border} shadow-sm animate-reveal-badge`}>
                        <Star size={10} className="sm:w-3 sm:h-3 text-amber-500" />
                        <Check size={8} className="sm:w-2.5 sm:h-2.5 text-amber-500" />
                        <span className="hidden xs:inline">Revealed</span>
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="pl-2 sm:pl-3 relative z-10">
                    <p className={`text-sm sm:text-base font-medium leading-relaxed transition-all duration-500 ${
                      isRevealed 
                        ? `${colors.text} animate-message-reveal` 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      {isRevealed ? (
                        <span className="inline-block">
                          <span className="opacity-0 animate-reveal-text" style={{ animationDelay: '0.1s' }}>
                            {msg.message}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 sm:gap-2 group-hover:gap-2 sm:group-hover:gap-3 transition-all duration-300">
                          <Lock size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-[11px] sm:text-sm group-hover:text-amber-600 transition-colors duration-300">
                            <Star size={8} className="sm:w-2.5 sm:h-2.5 inline mr-1" /> Tap to reveal <span className="hidden xs:inline">this message</span> <Star size={8} className="sm:w-2.5 sm:h-2.5 inline ml-1" />
                          </span>
                          <Wand2 size={12} className="sm:w-3.5 sm:h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12 hidden sm:inline" />
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Magic Dust Trail */}
                  {isRevealed && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full animate-magic-dust"
                          style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            animationDelay: i * 0.2 + 's',
                            backgroundColor: ['#FCD34D', '#F472B6', '#60A5FA', '#34D399', '#A78BFA'][i % 5],
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-end mt-2 sm:mt-3 pl-2 sm:pl-3 relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInfoClick(msg);
                      }}
                      className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isRevealed 
                          ? 'text-purple-500 hover:text-purple-700 hover:bg-purple-100/50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                      }`}
                      title="View message details"
                    >
                      <Info size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION - Mobile Responsive */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-2 mt-6 sm:mt-8 border-t border-purple-200/30 pt-4 sm:pt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 ${
                pagination.page === 1
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50 shadow-sm hover:shadow-md hover:scale-105'
              }`}
            >
              <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1 rotate-180" />
              <span className="hidden xs:inline">Previous</span>
            </button>
            <span className="text-[10px] sm:text-sm font-medium text-purple-600">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 ${
                pagination.page === pagination.pages
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50 shadow-sm hover:shadow-md hover:scale-105'
              }`}
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 inline ml-1" />
            </button>
          </div>
        )}

        {/* === INFO POPUP - Mobile Responsive === */}
        {showPopup && selectedMessage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm animate-fadeIn"
            onClick={closePopup}
          >
            <div 
              className="w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm border border-purple-200/30 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6 border-b border-purple-100/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shadow-lg shadow-amber-400/30">
                      {getYearText(selectedMessage.studentYear)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-purple-800">
                        <Star size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1 text-amber-500" />
                        Message Details
                      </h3>
                      <span className={`text-[10px] sm:text-xs font-medium ${selectedMessage.isRead ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedMessage.isRead ? (
                          <><Check size={10} className="sm:w-3 sm:h-3 inline mr-1" /> Revealed</>
                        ) : (
                          <><Lock size={10} className="sm:w-3 sm:h-3 inline mr-1" /> Pending</>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={closePopup}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-purple-100 text-purple-400 transition-all duration-300"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Year */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-purple-50/50">
                  <User size={14} className="sm:w-4 sm:h-4 text-purple-400" />
                  <span className="text-xs sm:text-sm text-purple-700">
                    Year: <strong>{getYearText(selectedMessage.studentYear)}</strong>
                  </span>
                </div>

                {/* Section */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-purple-50/50">
                  <Hash size={14} className="sm:w-4 sm:h-4 text-purple-400" />
                  <span className="text-xs sm:text-sm text-purple-700">
                    Section: <strong>{selectedMessage.studentSection || 'N/A'}</strong>
                  </span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-purple-50/50">
                  <Calendar size={14} className="sm:w-4 sm:h-4 text-purple-400" />
                  <span className="text-xs sm:text-sm text-purple-700">
                    {formatDateFull(selectedMessage.createdAt)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/30">
                  <p className="text-[10px] sm:text-xs font-medium text-amber-600 mb-1">
                    <Mail size={10} className="sm:w-3 sm:h-3 inline mr-1" />
                    Message:
                  </p>
                  <p className="text-sm sm:text-base font-medium text-amber-900 break-words">
                    {selectedMessage.message || 'No message content'}
                  </p>
                </div>

                {/* View Status */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-purple-100/50">
                  {selectedMessage.isRead ? (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                      <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
                      Revealed on {formatDate(selectedMessage.updatedAt || selectedMessage.createdAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-amber-600">
                      <Lock size={12} className="sm:w-3.5 sm:h-3.5" />
                      Not yet revealed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HODChatManagement;