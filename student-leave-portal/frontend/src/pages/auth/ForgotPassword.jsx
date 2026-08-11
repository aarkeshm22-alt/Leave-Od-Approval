import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Flying Bird Component ────────────────────────────────────────────────
const FlyingBird = ({ startX, startY, duration, delay, size = 20, flapSpeed = 0.6 }) => {
  return (
    <motion.div
      className="absolute text-black/40 dark:text-black/30 pointer-events-none z-0"
      style={{ left: startX, top: startY }}
      animate={{
        x: ['-10%', '110%'],
        y: [0, -15, 10, -20, 5, 0],
      }}
      transition={{
        x: { repeat: Infinity, duration, delay, ease: 'linear' },
        y: { repeat: Infinity, duration: duration * 0.5, delay, ease: 'easeInOut' },
      }}
    >
      <motion.svg
        width={size}
        height={size * 0.6}
        viewBox="0 0 24 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ scaleY: [1, 0.5, 1] }}
        transition={{
          repeat: Infinity,
          duration: flapSpeed,
          delay,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M0 8 C6 2 10 0 12 8 C14 0 18 2 24 8"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M0 8 C6 14 10 16 12 8 C14 16 18 14 24 8"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  );
};

// ─── Sky Background Component ─────────────────────────────────────────────
const SkyBackground = () => {
  const [time, setTime] = useState(new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hour = time.getHours();

  const skyState = useMemo(() => {
    if (hour >= 5 && hour < 8) return 'sunrise';
    if (hour >= 8 && hour < 16) return 'day';
    if (hour >= 16 && hour < 19) return 'sunset';
    return 'night';
  }, [hour]);

  const gradients = {
    sunrise: "from-[#FFB347] via-[#FFCC80] to-[#FFE0B2]",
    day: "from-[#38BDF8] via-[#60A5FA] to-[#BFDBFE]",
    sunset: "from-[#F97316] via-[#EC4899] to-[#7C3AED]",
    night: "from-[#020617] via-[#0F172A] to-[#1E1B4B]",
  };

  const showSun = hour >= 6 && hour < 18;
  const showMoon = !showSun;

  const clouds = useMemo(
    () => [
      { id: 1, size: 60, top: 12, duration: 22, delay: 0, opacity: 0.9 },
      { id: 2, size: 80, top: 28, duration: 28, delay: 6, opacity: 0.9 },
      { id: 3, size: 50, top: 45, duration: 18, delay: 12, opacity: 0.9 },
      { id: 4, size: 70, top: 60, duration: 24, delay: 3, opacity: 0.9 },
      { id: 5, size: 55, top: 75, duration: 30, delay: 9, opacity: 0.4 },
      { id: 6, size: 60, top: 12, duration: 22, delay: 0, opacity: 0.9 },
      { id: 7, size: 80, top: 28, duration: 28, delay: 6, opacity: 0.9 },
      { id: 8, size: 50, top: 45, duration: 18, delay: 12, opacity: 0.9 },
      { id: 9, size: 70, top: 60, duration: 24, delay: 3, opacity: 0.9 },
      { id: 10, size: 55, top: 75, duration: 30, delay: 9, opacity: 0.4 },
    ],
    []
  );

  const birds = useMemo(
    () => [
      { id: 1, startX: '5%', startY: '15%', duration: 18, delay: 0, size: 18, flapSpeed: 0.5 },
      { id: 2, startX: '20%', startY: '22%', duration: 22, delay: 4, size: 22, flapSpeed: 0.7 },
      { id: 3, startX: '40%', startY: '10%', duration: 16, delay: 8, size: 16, flapSpeed: 0.4 },
      { id: 4, startX: '60%', startY: '18%', duration: 25, delay: 2, size: 20, flapSpeed: 0.6 },
      { id: 5, startX: '80%', startY: '30%', duration: 20, delay: 6, size: 24, flapSpeed: 0.8 },
    ],
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.7 + 0.3,
      })),
    []
  );

  const [shootingStars, setShootingStars] = useState([]);
  useEffect(() => {
    if (skyState !== 'night') return;
    const interval = setInterval(() => {
      const newStar = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 5,
        duration: 2 + Math.random() * 3,
      };
      setShootingStars((prev) => [...prev, newStar]);
      setTimeout(() => {
        setShootingStars((prev) => prev.filter((s) => s.id !== newStar.id));
      }, newStar.duration * 1000 + 1000);
    }, 8000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, [skyState]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b ${gradients[skyState]} transition-colors duration-1000`}
    >
      {/* Sun / Moon */}
      <div className="absolute top-2 left-2 md:top-8 md:right-8 md:left-auto z-10 pointer-events-none">
        {showSun && (
          <motion.div
            className="w-12 h-12 md:w-28 md:h-28 rounded-full bg-yellow-300 shadow-[0_0_30px_15px_rgba(255,200,50,0.2)] md:shadow-[0_0_90px_50px_rgba(255,200,50,0.2)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
        )}
        {showMoon && (
          <motion.div
            className="w-10 h-10 md:w-24 md:h-24 rounded-full bg-slate-100 shadow-[0_0_20px_10px_rgba(200,220,255,0.2)] md:shadow-[0_0_60px_30px_rgba(200,220,255,0.3)] relative"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          >
            <div className="absolute top-1 left-2 w-3 h-3 md:top-3 md:left-5 md:w-7 md:h-7 rounded-full bg-slate-300 opacity-60" />
            <div className="absolute bottom-2 right-1 w-2 h-2 md:bottom-5 md:right-4 md:w-5 md:h-5 rounded-full bg-slate-300 opacity-50" />
          </motion.div>
        )}
      </div>

      {/* Clouds */}
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          className="absolute text-white/30 pointer-events-none z-0"
          style={{
            top: `${cloud.top}%`,
            left: '-10%',
            opacity: cloud.opacity,
          }}
          animate={{ x: '120vw' }}
          transition={{
            repeat: Infinity,
            duration: cloud.duration,
            delay: cloud.delay,
            ease: 'linear',
          }}
        >
          <Cloud size={cloud.size} strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* Birds (not at night) */}
      {skyState !== 'night' &&
        birds.map((bird) => (
          <FlyingBird
            key={bird.id}
            startX={bird.startX}
            startY={bird.startY}
            duration={bird.duration}
            delay={bird.delay}
            size={bird.size}
            flapSpeed={bird.flapSpeed}
          />
        ))}

      {/* Stars (night only) */}
      {skyState === 'night' &&
        stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: 0,
            }}
            animate={{ opacity: [0, star.opacity, 0] }}
            transition={{
              repeat: Infinity,
              duration: star.duration,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Shooting stars */}
      {shootingStars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_6px_2px_rgba(255,255,255,0.8)]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            x: ['0%', '30vw'],
            y: ['0%', '20vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: star.duration,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 8 + Math.random() * 12,
              delay: Math.random() * 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Grass */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 pointer-events-none overflow-hidden z-0">
        <div
          className="w-full h-full"
          style={{
            background:
              'linear-gradient(0deg, rgba(34,139,34,0.6) 0%, rgba(34,139,34,0.2) 60%, transparent 100%)',
          }}
        />
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          style={{ opacity: 0.5 }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <path
              key={i}
              d={`M${i * 3.4} 20 Q${i * 3.4 + 1} 10 ${i * 3.4 + 2} 5 Q${i * 3.4 + 3} 10 ${i * 3.4 + 4} 20`}
              fill="none"
              stroke="#2d6a2d"
              strokeWidth="0.8"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

// ─── Main ForgotPassword Component ──────────────────────────────────────
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const API_URL = 'https://leave-od-approval.onrender.com'; // Use the deployed backend URL
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email.trim(),
      });

      if (response.data.success) {
        localStorage.setItem('resetEmail', response.data.email || email);
        setSuccess(true);
        toast.success('OTP sent to your email!');
        setTimeout(() => {
          navigate('/verify-otp');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to send OTP');
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Success State ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden">
        <SkyBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-8 text-center z-10"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-3xl" />
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100/80 backdrop-blur-sm mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">OTP Sent</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Please check your email for the OTP.</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Redirecting to OTP verification...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <SkyBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-10 z-10 relative mt-16 md:mt-0"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-3xl" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-inner">
            <Mail className="text-indigo-600 dark:text-indigo-300" size={26} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            LOA Portal
          </h2>
          <p className="text-xs text-indigo-700 dark:text-indigo-200 font-medium mt-1">
            Reset your password
          </p>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Login
        </Link>

        <div className="mt-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/60 dark:border-red-700/60 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              {/* ✅ Darkened label for better readability */}
              <label htmlFor="email" className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-300 tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-700 dark:text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/60 dark:bg-slate-800/30 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-400/70 dark:focus:border-indigo-400/70 transition-all text-sm"
                  placeholder="Enter your registered email"
                />
              </div>
              {/* ✅ Darkened helper text */}
              <p className="mt-1 text-[10px] text-white/30 dark:text-white/40 font-medium">
                Enter your registered email to receive an OTP.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-200 uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-indigo-600 dark:text-indigo-300 font-medium mt-6 pt-4 border-t border-white/20">
          Remember your password?{' '}
          <Link to="/login" className="text-slate-800 dark:text-white font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 