import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Eye, Sparkles, Wand2, Bell, CheckCircle, Zap, Info } from 'lucide-react';
import { studentChatAPI } from '../../services/chatService';
import toast from 'react-hot-toast';

const FloatingChatButton = () => {
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

  const [viewedPopupShown, setViewedPopupShown] = useState(() => {
    const saved = localStorage.getItem('viewed_popup_shown');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('viewed_popup_shown', JSON.stringify(viewedPopupShown));
  }, [viewedPopupShown]);

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
          <div className="relative p-4 sm:p-6 rounded-2xl w-full mx-auto shadow-2xl border-2 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400/50">
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-sky-400 animate-pulse">
              <Sparkles size={14} className="sm:w-5 sm:h-5" />
            </div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 text-sky-400 animate-pulse" style={{ animationDelay: '1s' }}>
              <Sparkles size={10} className="sm:w-4 sm:h-4" />
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center mb-2 sm:mb-3 bg-sky-100 border border-sky-300">
              <Icon size={24} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-center font-bold text-base sm:text-lg text-sky-800" style={{ fontFamily: "'Times New Roman', serif" }}>
              {title}
            </h3>
            <p className="text-center text-xs sm:text-sm mt-1 leading-relaxed text-sky-700">
              {message}
            </p>
            {subMessage && (
              <p className="text-center text-[10px] sm:text-xs mt-1.5 italic text-sky-600/70">
                {subMessage}
              </p>
            )}
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
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      return;
    }
    try {
      setSending(true);
      const response = await studentChatAPI.sendMessage({
        message: newMessage.trim(),
        category: 'general',
        priority: 'medium'
      });
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
      console.error('Error:', error);
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

  const MessageItem = ({ msg }) => (
    <div className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
      msg.isViewed 
        ? 'bg-white/70 border-sky-200/50 shadow-sm shadow-sky-100/30'
        : 'bg-sky-50/70 border-sky-200/60 shadow-sm shadow-sky-100/20'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[9px] sm:text-[10px] text-sky-400">
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
      <p className="text-xs sm:text-sm text-slate-800">
        {msg.message}
      </p>
      {msg.reply && (
        <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg border-l-2 border-l-emerald-500 bg-white/50">
          <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
            📨 HOD replied:
          </p>
          <p className="text-xs sm:text-sm text-slate-700">
            {msg.reply}
          </p>
          {msg.repliedAt && (
            <p className="text-[8px] sm:text-[10px] mt-0.5 text-slate-400">
              {formatDate(msg.repliedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
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

      <div className={`fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] h-[450px] sm:h-[500px] max-h-[65vh] sm:max-h-[70vh] rounded-2xl shadow-2xl border overflow-hidden transition-all duration-500 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      } bg-white border-slate-200`}>
        
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#E8F4FD] via-[#D6EAF8] to-[#AED6F1]" />
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
        </div>

        <div className="relative z-10 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b backdrop-blur-sm border-sky-200/50 bg-white/70">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-sky-100 text-sky-600 border border-sky-200">
                <Wand2 size={14} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <h3 className="font-bold text-xl sm:text-xl text-sky-800" style={{ fontFamily: "'Times New Roman', serif" }}>
                  Owl Post
                </h3>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-sky-100"
            >
              <Minimize2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* 🆕 Persistent Info Box - Always visible */}
          <div className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 bg-sky-50/80 border-b border-sky-200/50 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-sky-700 leading-relaxed">
                <span className="font-semibold">Your message is anonymous.</span> HOD can see only your year &amp; section. 
                If you want to convey anything regarding our department queries, put it here – HOD can resolve it.
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-white/30 backdrop-blur-sm">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-sky-200">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                  </div>
                  <Sparkles size={12} className="sm:w-4 sm:h-4 absolute -top-2 -right-2 text-sky-400 animate-pulse" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-start h-full text-center pt-8 sm:pt-12">
                <div className="text-5xl sm:text-6xl mb-2 sm:mb-3">🦉</div>
                <p className="text-xs sm:text-sm font-medium text-sky-800" style={{ fontFamily: "'Times New Roman', serif" }}>
                  No owls yet
                </p>
                <p className="text-[9px] sm:text-xs text-sky-600/60">
                  Send your first owl to the HOD
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
          <div className="p-2 sm:p-3 border-t border-sky-200/50 bg-white/70 backdrop-blur-sm">
            <form onSubmit={handleSendMessage} className="flex gap-1.5 sm:gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write your owl..."
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border outline-none transition-all duration-300 bg-white/70 border-sky-200 text-slate-900 placeholder-sky-400 focus:border-sky-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className={`p-1.5 sm:p-2 rounded-xl text-white transition-all duration-300 ${
                  sending || !newMessage.trim()
                    ? 'bg-slate-500 cursor-not-allowed opacity-50'
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
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingChatButton;