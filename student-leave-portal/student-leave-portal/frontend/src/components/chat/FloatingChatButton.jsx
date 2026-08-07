import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Eye, Sparkles, Wand2, Bell, Sun, Moon, Star, CheckCircle, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { studentChatAPI } from '../../services/chatService';
import toast from 'react-hot-toast';

const FloatingChatButton = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupSubMessage, setPopupSubMessage] = useState('');
  const [popupIcon, setPopupIcon] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track which messages have already shown the viewed popup
  const [viewedPopupShown, setViewedPopupShown] = useState(() => {
    const saved = localStorage.getItem('viewed_popup_shown');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('viewed_popup_shown', JSON.stringify(viewedPopupShown));
  }, [viewedPopupShown]);

  // ✅ Mobile-Optimized Harry Potter Popup Component
  const MagicPopup = ({ icon: Icon, title, message, subMessage, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-3 sm:px-4">
        <div className="animate-magic-popup pointer-events-auto w-full max-w-[280px] sm:max-w-sm">
          <div className={`relative p-4 sm:p-6 rounded-2xl w-full mx-auto shadow-2xl border-2 ${
            darkMode 
              ? 'bg-gradient-to-br from-[#1a0a2e] to-[#2d1b4e] border-yellow-500/30' 
              : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400/50'
          }`}>
            {/* Decorative Sparkles - Adjusted for mobile */}
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-sky-400 animate-pulse">
              <Sparkles size={14} className="sm:w-5 sm:h-5" />
            </div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 text-sky-400 animate-pulse" style={{ animationDelay: '1s' }}>
              <Sparkles size={10} className="sm:w-4 sm:h-4" />
            </div>
            
            {/* Icon - Smaller on mobile */}
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center mb-2 sm:mb-3 ${
              darkMode 
                ? 'bg-yellow-500/20 border border-yellow-500/30' 
                : 'bg-sky-100 border border-sky-300'
            }`}>
              <Icon size={24} className="sm:w-8 sm:h-8" />
            </div>
            
            {/* Title - Responsive font size */}
            <h3 className={`text-center font-bold text-base sm:text-lg ${
              darkMode ? 'text-yellow-300' : 'text-sky-800'
            }`} style={{ fontFamily: "'Times New Roman', serif" }}>
              {title}
            </h3>
            
            {/* Message - Responsive */}
            <p className={`text-center text-xs sm:text-sm mt-1 leading-relaxed ${
              darkMode ? 'text-yellow-200/80' : 'text-sky-700'
            }`}>
              {message}
            </p>
            
            {/* Sub Message - Smaller on mobile */}
            {subMessage && (
              <p className={`text-center text-[10px] sm:text-xs mt-1.5 italic ${
                darkMode ? 'text-yellow-400/60' : 'text-sky-600/70'
              }`}>
                {subMessage}
              </p>
            )}
            
            {/* Decorative Line - Responsive */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
              <div className="w-6 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-sky-400/30" />
              <span className="text-sky-400/40 text-[8px] sm:text-xs">✦ ✦ ✦</span>
              <div className="w-6 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-sky-400/30" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await studentChatAPI.getMyMessages({ page: 1, limit: 50 });
      setMessages(response.data.data || []);
      
      const unread = response.data.data?.filter(msg => !msg.isViewed).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMagicPopup = (icon, title, message, subMessage = '') => {
    setPopupIcon(icon);
    setPopupMessage(title);
    setPopupSubMessage(subMessage);
    setShowPopup(true);
    
    setTimeout(() => {
      setShowPopup(null);
      setPopupIcon(null);
      setPopupMessage('');
      setPopupSubMessage('');
    }, 4000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('📤 Send button clicked');
    console.log('📝 Message:', newMessage);

    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', token ? 'Yes' : 'No');
    
    if (!token) {
      toast.error('Please login first');
      return;
    }

    try {
      setSending(true);
      console.log('📡 Sending to API...');
      
      const response = await studentChatAPI.sendMessage({
        message: newMessage.trim(),
        category: 'general',
        priority: 'medium'
      });

      console.log('✅ Response:', response.data);
      
      showMagicPopup(
        Wand2,
        '🦉 Owl Delivered!',
        'Your owl has delivered the message to the HOD\'s office.',
        '"The magic is in the message..."'
      );
      
      toast.success('Message sent anonymously!');
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      showMagicPopup(
        Bell,
        '⚠️ Message Failed!',
        'The owl got lost. Please try again.',
        '"Even magic has its limits..."'
      );
      
      if (error.response?.status === 401) {
        toast.error('Please login again');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Check backend logs.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  // Check for newly viewed messages - ONE TIME ONLY per message
  useEffect(() => {
    const checkNewlyViewed = async () => {
      try {
        const response = await studentChatAPI.getMyMessages({ page: 1, limit: 50 });
        const allMessages = response.data.data || [];
        
        const newlyViewed = allMessages.filter(msg => 
          msg.isViewed && !messages.find(m => m._id === msg._id)?.isViewed
        );
        
        if (newlyViewed.length > 0) {
          for (const msg of newlyViewed) {
            if (!viewedPopupShown[msg._id]) {
              setViewedPopupShown(prev => ({ ...prev, [msg._id]: true }));
              
              // Show popup with message content - Truncated for mobile
              const messagePreview = msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message;
              showMagicPopup(
                CheckCircle,
                '👁️ Message Viewed!',
                `The HOD has read your message: "${messagePreview}"`,
                '"Your voice has been heard..."'
              );
            }
          }
          
          setMessages(allMessages);
          const unread = allMessages.filter(msg => !msg.isViewed).length || 0;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Check viewed error:', error);
      }
    };

    const interval = setInterval(checkNewlyViewed, 5000);
    return () => clearInterval(interval);
  }, [messages, viewedPopupShown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = Math.floor((now - msgDate) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const MessageItem = ({ msg }) => (
    <div className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
      msg.isViewed 
        ? darkMode 
          ? 'bg-slate-800/50 border-slate-700/50' 
          : 'bg-white/70 border-sky-200/50 shadow-sm shadow-sky-100/30'
        : darkMode 
          ? 'bg-blue-900/20 border-blue-800/40' 
          : 'bg-sky-50/70 border-sky-200/60 shadow-sm shadow-sky-100/20'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-[9px] sm:text-[10px] ${
          darkMode ? 'text-slate-500' : 'text-sky-400'
        }`}>
          {formatDate(msg.createdAt)}
        </span>
        
        {msg.isViewed && (
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            <Eye size={8} className="sm:w-2.5 sm:h-2.5" />
            <span className="hidden xs:inline">Viewed</span>
            <span className="inline xs:hidden">✓</span>
          </span>
        )}
      </div>
      
      <p className={`text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        {msg.message}
      </p>

      {msg.reply && (
        <div className={`mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg border-l-2 border-l-emerald-500 ${
          darkMode ? 'bg-slate-800/50' : 'bg-white/50'
        }`}>
          <p className={`text-[9px] sm:text-[10px] font-bold ${
            darkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            📨 HOD replied:
          </p>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {msg.reply}
          </p>
          {msg.repliedAt && (
            <p className={`text-[8px] sm:text-[10px] mt-0.5 ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {formatDate(msg.repliedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Floating Button - Mobile Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 p-3 sm:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isOpen ? (
          <X size={20} className="sm:w-6 sm:h-6" />
        ) : (
          <>
            <MessageCircle size={20} className="sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[8px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Harry Potter Magic Popup */}
      {showPopup && popupIcon && (
        <MagicPopup 
          icon={popupIcon}
          title={popupMessage}
          message={popupSubMessage}
          subMessage=""
          onClose={() => {
            setShowPopup(null);
            setPopupIcon(null);
            setPopupMessage('');
            setPopupSubMessage('');
          }}
        />
      )}

      {/* Chat Popup - Mobile Responsive */}
      <div className={`fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] h-[450px] sm:h-[500px] max-h-[65vh] sm:max-h-[70vh] rounded-2xl shadow-2xl border overflow-hidden transition-all duration-500 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      } ${
        darkMode 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        
        {/* Harry Potter Themed Background */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 transition-colors duration-500 ${
            darkMode 
              ? 'bg-gradient-to-b from-[#0a0015] via-[#1a0a2e] to-[#0a0015]' 
              : 'bg-gradient-to-b from-[#E8F4FD] via-[#D6EAF8] to-[#AED6F1]'
          }`} />
          
          {/* Floating Clouds - Light Mode */}
          {!darkMode && (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={`cloud-${i}`}
                  className="absolute rounded-full bg-white/20 backdrop-blur-sm animate-float-cloud"
                  style={{
                    width: Math.random() * 60 + 30 + 'px',
                    height: Math.random() * 20 + 10 + 'px',
                    top: Math.random() * 80 + 10 + '%',
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 10 + 's',
                    animationDuration: Math.random() * 15 + 10 + 's',
                  }}
                />
              ))}
            </>
          )}
          
          {/* Twinkling Stars - Dark Mode */}
          {darkMode && (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-twinkle"
                  style={{
                    width: Math.random() * 2 + 1 + 'px',
                    height: Math.random() * 2 + 1 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 5 + 's',
                    animationDuration: Math.random() * 3 + 2 + 's',
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'][Math.floor(Math.random() * 5)],
                    opacity: 0.3 + Math.random() * 0.7
                  }}
                />
              ))}
              <div className="absolute top-10 right-10 w-20 h-20 sm:w-32 sm:h-32 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 left-10 w-24 h-24 sm:w-40 sm:h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-col h-full">
          
          {/* Header */}
          <div className={`flex items-center justify-between p-3 sm:p-4 border-b backdrop-blur-sm ${
            darkMode 
              ? 'border-slate-700/60 bg-slate-900/80' 
              : 'border-sky-200/50 bg-white/70'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-xl ${
                darkMode 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                  : 'bg-sky-100 text-sky-600 border border-sky-200'
              }`}>
                <Wand2 size={14} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <h3 className={`font-bold text-xs sm:text-sm ${
                  darkMode ? 'text-yellow-300' : 'text-sky-800'
                }`} style={{ fontFamily: "'Times New Roman', serif" }}>
                  Owl Post
                </h3>
                <p className={`text-[8px] sm:text-[10px] ${
                  darkMode ? 'text-yellow-400/60' : 'text-sky-600/60'
                }`}>
                  HOD won't see your name
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleThemeToggle}
                className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30' 
                    : 'bg-sky-100 text-sky-600 hover:bg-sky-200 border border-sky-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <Sun size={14} className="sm:w-4 sm:h-4 text-yellow-400" />
                ) : (
                  <Moon size={14} className="sm:w-4 sm:h-4 text-sky-600" />
                )}
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-slate-700' : 'hover:bg-sky-100'
                }`}
              >
                <Minimize2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 transition-colors duration-300 ${
            darkMode ? 'bg-slate-900/30' : 'bg-white/30 backdrop-blur-sm'
          }`}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${
                    darkMode ? 'border-slate-700' : 'border-sky-200'
                  }`}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                  </div>
                  <Sparkles size={12} className="sm:w-4 sm:h-4 absolute -top-2 -right-2 text-sky-400 animate-pulse" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className={`p-3 sm:p-4 rounded-full ${
                  darkMode ? 'bg-slate-800/50' : 'bg-sky-50/70'
                }`}>
                  <MessageCircle size={32} className="sm:w-10 sm:h-10" />
                </div>
                <p className={`text-xs sm:text-sm font-medium mt-2 sm:mt-3 ${
                  darkMode ? 'text-yellow-300' : 'text-sky-800'
                }`} style={{ fontFamily: "'Times New Roman', serif" }}>
                  No owls yet
                </p>
                <p className={`text-[9px] sm:text-xs ${
                  darkMode ? 'text-yellow-400/60' : 'text-sky-600/60'
                }`}>
                  Send an owl to the HOD
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageItem key={msg._id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className={`p-2 sm:p-3 border-t transition-colors duration-300 backdrop-blur-sm ${
            darkMode 
              ? 'border-slate-700/60 bg-slate-900/80' 
              : 'border-sky-200/50 bg-white/70'
          }`}>
            <form onSubmit={handleSendMessage} className="flex gap-1.5 sm:gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write your owl..."
                className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border outline-none transition-all duration-300 ${
                  darkMode 
                    ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-yellow-500' 
                    : 'bg-white/70 border-sky-200 text-slate-900 placeholder-sky-400 focus:border-sky-500'
                }`}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className={`p-1.5 sm:p-2 rounded-xl text-white transition-all duration-300 ${
                  sending || !newMessage.trim()
                    ? 'bg-slate-500 cursor-not-allowed opacity-50'
                    : darkMode
                      ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-500/20'
                      : 'bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/30'
                }`}
              >
                {sending ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} className="sm:w-[18px] sm:h-[18px]" />
                )}
              </button>
            </form>
            <p className={`text-[8px] sm:text-[10px] mt-1 text-center transition-colors duration-300 ${
              darkMode ? 'text-yellow-400/40' : 'text-sky-500/60'
            }`} style={{ fontFamily: "'Times New Roman', serif" }}>
              <Zap className="inline w-3 h-3 sm:w-3.5 sm:h-3.5" /> Your owl is anonymous. Only your year & section is visible.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingChatButton;