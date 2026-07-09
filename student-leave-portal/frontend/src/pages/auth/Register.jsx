import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  GraduationCap,
  UserCheck,
  ArrowRight,
  Layers,
  Sparkles,
  Smile,
  Home,
  Users,
  Fingerprint,
  Cloud,
  ShieldCheck,
} from 'lucide-react';
import InputField from '../../components/common/InputField';

// ─── Flying Bird Component ──────────────────────────────────────────────────
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

  // ── Enhanced, premium colour palettes ──
  const gradients = {
    sunrise: "from-[#FFB347] via-[#FFCC80] to-[#FFE0B2]",
    day: "from-[#38BDF8] via-[#60A5FA] to-[#BFDBFE]",
    sunset: "from-[#F97316] via-[#EC4899] to-[#7C3AED]",
    night: "from-[#020617] via-[#0F172A] to-[#1E1B4B]",
  };

  const showSun = hour >= 6 && hour < 18;
  const showMoon = !showSun;

  // ── Clouds ──
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
      {/* ── Fixed Sun / Moon ── */}
      <div className="absolute top-2 left-2 md:top-8 md:right-8 md:left-auto z-10 pointer-events-none">
        {showSun && (
          <motion.div
            className="w-12 h-12 md:w-28 md:h-28 rounded-full bg-yellow-300 shadow-[0_0_30px_15px_rgba(255,200,50,0.2)] md:shadow-[0_0_90px_50px_rgba(255,200,50,0.3)]"
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

      {/* ── Flying Birds ── */}
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

      {/* ── Stars ── */}
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

// ─── Main Register Component ──────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('Student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [hodsList, setHodsList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);

  const [formData, setFormData] = useState({
    registerNo: '',
    firstName: '',
    lastName: '',
    gender: '',
    department: '',
    email: '',
    mobileNo: '',
    year: '',
    section: '',
    studentType: '',
    selectedHodId: '',
    firstmentorName: '',
    secondmentorName: '',
    category: '',
    password: '',
    confirmPassword: '',
  });

  const BACKEND_URL = 'https://leave-od-approval.onrender.com';

  // Fetch directory values – fixed to handle nested `data` property
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const hodsRes = await fetch(`${BACKEND_URL}/api/users/hods`);
        if (hodsRes.ok) {
          const hodsData = await hodsRes.json();
          // Extract array from possible { data: [...] } wrapper
          const hodsArray = hodsData?.data || hodsData;
          setHodsList(Array.isArray(hodsArray) ? hodsArray : []);
        }
      } catch (err) {
        console.error('Connection failure syncing HOD directory:', err);
      }

      try {
        const mentorsRes = await fetch(`${BACKEND_URL}/api/users/mentors`);
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json();
          // Extract array from possible { data: [...] } wrapper
          const mentorsArray = mentorsData?.data || mentorsData;
          setMentorsList(Array.isArray(mentorsArray) ? mentorsArray : []);
        }
      } catch (err) {
        console.error('Connection failure syncing Mentor directory:', err);
      }
    };

    fetchReferences();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.toLowerCase().endsWith('@ksrce.ac.in')) {
      setErrorMsg('Error: Unauthorized domain. Institutional email address must end with @ksrce.ac.in');
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobileNo)) {
      setErrorMsg('Error: Invalid Mobile Number. Must be exactly 10 digits.');
      return;
    }

    if (formData.password.length !== 8) {
      setErrorMsg('Error: Password constraint violation. Length must be exactly 8 characters.');
      return;
    }

    const upperCaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[^A-Za-z0-9]/;

    if (
      !upperCaseRegex.test(formData.password) ||
      !numberRegex.test(formData.password) ||
      !specialCharRegex.test(formData.password)
    ) {
      setErrorMsg('Error: Password requires at least 1 uppercase, 1 number, and 1 special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Error: Passwords do not match.');
      return;
    }

    if (selectedRole === 'Mentor' && !formData.category) {
      setErrorMsg('Error: Mentor Category (CA1 or CA2) selection is mandatory.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const payload = {
      role: selectedRole,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      department: formData.department,
      email: formData.email,
      mobileNo: formData.mobileNo,
      password: formData.password,
      ...(selectedRole === 'Student' && {
        registerNo: formData.registerNo,
        year: formData.year,
        section: formData.section,
        studentType: formData.studentType,
        firstmentorName: formData.firstmentorName,
        secondmentorName: formData.secondmentorName,
      }),
      ...(selectedRole === 'Mentor' && {
        hodName: formData.selectedHodId,
        category: String(formData.category).trim(),
      }),
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failure. Validate data limits.');
      }

      navigate('/login');
    } catch (err) {
      setErrorMsg(err.message || 'Network connection lost connecting to validation layer.');
      setIsLoading(false);
    }
  };

  const tierMeta = {
    Student: { icon: GraduationCap, text: 'Student Account' },
    Mentor: { icon: UserCheck, text: 'Mentor Account' },
    HOD: { icon: Building2, text: 'Head of Department Account' },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
      <SkyBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-xl backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-10 z-10 relative mt-16 md:mt-0"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-3xl" />

        <div className="flex flex-col items-center text-center mb-6 pb-4 border-b border-white/20">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Registration For
          </h2>
          <p className="text-xs text-indigo-700 dark:text-indigo-200 font-semibold mt-1">
            Leave & OD Approval Portal
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-600 text-xs font-medium rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Role Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-white/30 backdrop-blur-sm p-1.5 rounded-xl border border-white/30 mb-6 relative">
          {['Student', 'Mentor', 'HOD'].map((roleType) => {
            const Icon = tierMeta[roleType].icon;
            const isCurrent = selectedRole === roleType;
            return (
              <button
                key={roleType}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedRole(roleType);
                  setErrorMsg('');
                  setFormData((prev) => ({
                    ...prev,
                    registerNo: '',
                    password: '',
                    confirmPassword: '',
                    selectedHodId: '',
                    firstmentorName: '',
                    secondmentorName: '',
                    year: '',
                    section: '',
                    studentType: '',
                    department: '',
                    category: '',
                  }));
                }}
                className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all relative z-10 text-slate-600 dark:text-slate-300"
              >
                {isCurrent && (
                  <motion.div
                    layoutId="activeRoleIndicatorRegister"
                    className="absolute inset-0 bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 z-[-1] rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isCurrent ? 'text-indigo-600' : 'text-slate-500'} />
                <span className={isCurrent ? 'text-slate-800 font-extrabold' : ''}>
                  {roleType}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              icon={User}
              placeholder="e.g., Ram"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
            <InputField
              label="Last Name"
              icon={User}
              placeholder="e.g., M"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                <Smile size={12} className="text-slate-500" />
                <span>Gender</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                required
                disabled={isLoading}
                className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400/70 transition-all cursor-pointer"
              >
                <option value="" disabled hidden>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                <Layers size={12} className="text-slate-500" />
                <span>Department</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                required
                disabled={isLoading}
                className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400/70 transition-all cursor-pointer"
              >
                <option value="" disabled hidden>Select Department</option>
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="username@ksrce.ac.in"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
            <InputField
              label="Mobile Number"
              type="tel"
              icon={Phone}
              placeholder="9876543210"
              value={formData.mobileNo}
              onChange={(e) => handleInputChange('mobileNo', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-4"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Account Type: <span className="text-indigo-600 dark:text-indigo-300 font-extrabold">
                  {tierMeta[selectedRole].text}
                </span>
              </div>

              {/* STUDENT EXTRA FIELDS */}
              {selectedRole === 'Student' && (
                <div className="space-y-4">
                  <InputField
                    label="Register Number"
                    icon={Fingerprint}
                    placeholder="e.g., 73152213001"
                    value={formData.registerNo}
                    onChange={(e) => handleInputChange('registerNo', e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-slate-500" />
                        <span>Academic Year</span>
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400/70 transition-all cursor-pointer"
                      >
                        <option value="" disabled hidden>Choose Year</option>
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                        <Building2 size={11} className="text-slate-500" />
                        <span>Section</span>
                      </label>
                      <select
                        value={formData.section}
                        onChange={(e) => handleInputChange('section', e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400/70 transition-all cursor-pointer"
                      >
                        <option value="" disabled hidden>Choose Section</option>
                        <option value="Section A">A</option>
                        <option value="Section B">B</option>
                        <option value="Section C">C</option>
                        <option value="Section D">D</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                      <Home size={11} className="text-slate-500" />
                      <span>Student Type</span>
                    </label>
                    <select
                      value={formData.studentType}
                      onChange={(e) => handleInputChange('studentType', e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400/70 transition-all cursor-pointer"
                    >
                      <option value="" disabled hidden>Choose Type</option>
                      <option value="Day Scholar">Day Scholar</option>
                      <option value="Hosteller">Hosteller</option>
                    </select>
                  </div>

                  {/* 👔 CLASS ADVISOR 1 (CA1) DROPDOWN */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-800 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
                      <Users size={11} className="text-slate-600" />
                      <span>Class Advisor 1 (CA1)</span>
                    </label>
                    <select
                      value={formData.firstmentorName || ""}
                      onChange={(e) => handleInputChange('firstmentorName', e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-white focus:bg-white/70 transition-all cursor-pointer shadow-inner"
                    >
                      <option value="" disabled hidden>Choose Your CA1 Advisor</option>
                      {mentorsList.filter(m => m.category === 'CA1').length > 0 ? (
                        mentorsList
                          .filter(mentor => mentor.category === 'CA1')
                          .map((mentor) => {
                            const mentorFullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
                            return (
                              <option key={mentor._id || mentor.id} value={mentorFullName}>
                                {mentorFullName}
                              </option>
                            );
                          })
                      ) : (
                        <option value="" disabled className="text-slate-400">
                          No registered CA1 mentors available
                        </option>
                      )}
                    </select>
                  </div>

                  {/* 👔 CLASS ADVISOR 2 (CA2) DROPDOWN */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-800 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
                      <Users size={11} className="text-slate-600" />
                      <span>Class Advisor 2 (CA2)</span>
                    </label>
                    <select
                      value={formData.secondmentorName || ""}
                      onChange={(e) => handleInputChange('secondmentorName', e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-white focus:bg-white/70 transition-all cursor-pointer shadow-inner"
                    >
                      <option value="" disabled hidden>Choose Your CA2 Advisor</option>
                      {mentorsList.filter(m => m.category === 'CA2').length > 0 ? (
                        mentorsList
                          .filter(mentor => mentor.category === 'CA2')
                          .map((mentor) => {
                            const mentorFullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
                            return (
                              <option key={mentor._id || mentor.id} value={mentorFullName}>
                                {mentorFullName}
                              </option>
                            );
                          })
                      ) : (
                        <option value="" disabled className="text-slate-400">
                          No registered CA2 mentors available
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* MENTOR EXTRA FIELDS */}
              {selectedRole === 'Mentor' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-800 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
                      <Users size={11} className="text-slate-600" />
                      <span>Select Department HOD</span>
                    </label>
                    <select
                      value={formData.selectedHodId}
                      onChange={(e) => handleInputChange('selectedHodId', e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-white focus:bg-white/70 transition-all cursor-pointer shadow-inner"
                    >
                      <option value="" disabled hidden>Choose Your Head of Department</option>
                      {hodsList.length > 0 ? (
                        hodsList.map((hod) => {
                          const hodFullName = `Dr. ${hod.firstName || ''} ${hod.lastName || ''}`.trim();
                          return (
                            <option key={hod._id || hod.id} value={hodFullName}>
                              {hodFullName}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled className="text-slate-400">
                          No HODs available
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-800 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
                      <ShieldCheck size={11} className="text-slate-600" />
                      <span>Mentor Category</span>
                    </label>
                    <select
                      value={formData.category || ""}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white/40 backdrop-blur-sm border border-white/40 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-white focus:bg-white/70 transition-all cursor-pointer shadow-inner"
                    >
                      <option value="" disabled hidden>Select Category</option>
                      <option value="CA1">CA1</option>
                      <option value="CA2">CA2</option>
                    </select>
                  </div>
                </div>
              )}

              {/* HOD EXTRA FIELDS */}
              {selectedRole === 'HOD' && (
                <div className="p-3 bg-white/30 backdrop-blur-md border border-white/40 rounded-xl text-[11px] font-medium text-slate-900 leading-relaxed shadow-sm">
                  ✨ No additional authorization trees are required for department heads.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/20 pt-4 mt-4">
            <InputField
              label="Password"
              type="password"
              icon={Lock}
              placeholder="8 characters required"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
            <InputField
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/40 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus-within:border-indigo-400/70 transition-all rounded-xl px-4 py-3"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all duration-200 uppercase tracking-wider disabled:opacity-50"
          >
            <span>{isLoading ? 'Processing...' : 'Secure Access'}</span>
            {!isLoading && <ArrowRight size={14} />}
          </motion.button>
        </form>

        <div className="text-center text-xs text-slate-600 dark:text-slate-300 font-medium mt-6 pt-4 border-t border-white/20">
          Already have an institutional profile?{' '}
          <Link to="/login" className="text-slate-800 dark:text-white font-bold hover:underline">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;