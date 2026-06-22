import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Building2, User, UserCheck, ArrowRight, ShieldCheck, Cloud } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import InputField from '../../components/common/InputField';
import Loader from '../../components/common/Loader';

// ─── Flying Bird Component ──────────────────────────────────────────────────
const FlyingBird = ({ startX, startY, duration, delay, size = 20, flapSpeed = 0.6 }) => {
  return (
    <motion.div
      className="absolute text-slate-700/60 dark:text-white/40 pointer-events-none z-0"
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

// ─── Sky Background Component ──────────────────────────────────────────────
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
    sunrise: 'from-orange-200 via-pink-200 to-yellow-100',
    day: 'from-sky-400 via-blue-400 to-indigo-300',
    sunset: 'from-orange-500 via-pink-500 to-purple-400',
    night: 'from-slate-900 via-blue-950 to-indigo-950',
  };

  const showSun = hour >= 6 && hour < 18;
  const showMoon = !showSun;

  // ── Clouds ──
  const clouds = useMemo(
    () => [
      { id: 1, size: 60, top: 12, duration: 22, delay: 0, opacity: 0.7 },
      { id: 2, size: 80, top: 28, duration: 28, delay: 6, opacity: 0.6 },
      { id: 3, size: 50, top: 45, duration: 18, delay: 12, opacity: 0.5 },
      { id: 4, size: 70, top: 60, duration: 24, delay: 3, opacity: 0.5 },
      { id: 5, size: 55, top: 75, duration: 30, delay: 9, opacity: 0.4 },
    ],
    []
  );

  // ── Birds ──
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

  // ── Stars ──
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

  // ── Shooting stars ──
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
      {/* ── Fixed Sun / Moon (responsive: left on mobile, right on desktop) ── */}
      <div className="absolute top-4 left-4 md:top-8 md:right-8 md:left-auto z-10 pointer-events-none">
        {showSun && (
          <motion.div
            className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-yellow-300 shadow-[0_0_40px_20px_rgba(255,200,50,0.4)] md:shadow-[0_0_90px_50px_rgba(255,200,50,0.5)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
        )}
        {showMoon && (
          <motion.div
            className="w-14 h-14 md:w-24 md:h-24 rounded-full bg-slate-100 shadow-[0_0_30px_15px_rgba(200,220,255,0.25)] md:shadow-[0_0_60px_30px_rgba(200,220,255,0.3)] relative"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          >
            <div className="absolute top-2 left-3 w-4 h-4 md:top-3 md:left-5 md:w-7 md:h-7 rounded-full bg-slate-300 opacity-60" />
            <div className="absolute bottom-3 right-2 w-3 h-3 md:bottom-5 md:right-4 md:w-5 md:h-5 rounded-full bg-slate-300 opacity-50" />
          </motion.div>
        )}
      </div>

      {/* ── Animated Clouds ── */}
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

      {/* ── Flying Birds (visible during day/sunrise/sunset) ── */}
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

      {/* ── Stars (night only) ── */}
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

      {/* ── Shooting stars ── */}
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

      {/* ── Floating particles ── */}
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

      {/* ── Grass layer ── */}
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

// ─── Main Login Component ────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '', role: 'student' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const BACKEND_URL = 'https://leave-od-approval.onrender.com';

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/login`, { method: 'OPTIONS' }).catch(() =>
      console.log('Pre-warm system wake up initialized.')
    );
  }, []);

  const handleRoleSelection = (targetRole) => {
    setErrorMsg('');
    setFormData((prev) => ({ ...prev, role: targetRole.toLowerCase() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMsg('');

    const backendCapitalizedRole =
      formData.role === 'hod'
        ? 'HOD'
        : formData.role.charAt(0).toUpperCase() + formData.role.slice(1);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          role: backendCapitalizedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid institutional credentials.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      const normalizedUser = {
        ...(data.user || data),
        role: (data.user?.role || data.role || formData.role).toLowerCase(),
      };

      login(normalizedUser);
      navigate(`/${normalizedUser.role}/dashboard`);
    } catch (err) {
      console.error('Authentication Loop Exception:', err);
      setErrorMsg(err.message || 'Network failure connecting to authorization servers.');
      setIsVerifying(false);
    }
  };

  const displayRoleMap = { student: 'Student', mentor: 'Mentor', hod: 'HOD' };
  const roleIcons = { hod: Building2, mentor: UserCheck, student: User };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* ── Living Sky Background ── */}
      <SkyBackground />

      {/* ── Loader Overlay ── */}
      <AnimatePresence>
        {isVerifying && (
          <div className="fixed inset-0 z-50">
            <Loader fullPage />
          </div>
        )}
      </AnimatePresence>

      {/* ── Glassmorphism Login Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-10 z-10 relative mt-12 md:mt-0"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-3xl" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-inner">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-300" size={26} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Leave & OD Approval Portal
          </h2>
          <p className="text-xs text-indigo-700 dark:text-indigo-200 font-medium mt-1">
            Manage Leave Requests and On-Duty Approvals Efficiently
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-600 text-xs font-medium rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Role Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-white/30 backdrop-blur-sm p-1.5 rounded-xl border border-white/30 mb-6 relative">
          {['hod', 'mentor', 'student'].map((r) => {
            const Icon = roleIcons[r];
            const isActive = formData.role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSelection(r)}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all relative z-10 text-slate-600 dark:text-slate-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRoleIndicator"
                    className="absolute inset-0 bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 z-[-1] rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                <span className={isActive ? 'text-slate-800 font-extrabold' : ''}>
                  {displayRoleMap[r]}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Institutional Email Address"
            type="email"
            placeholder="username@ksrce.ac.in"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full mt-6 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 transition-all uppercase tracking-wider"
          >
            <span>Authenticate Secure Session</span>
            <ArrowRight size={14} />
          </motion.button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/20 flex justify-end">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            New here?{' '}
            <Link
              to="/register"
              className="text-slate-800 dark:text-white font-bold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;