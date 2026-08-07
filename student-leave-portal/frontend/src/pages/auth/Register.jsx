import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import ReactDOM from 'react-dom';
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
  ChevronDown,
} from 'lucide-react';
import InputField from '../../components/common/InputField';

// ─── Styled Select (prioritises below, flips only when tight) ──────────
const StyledSelect = memo(({ options, value, onChange, placeholder, label, icon: Icon, disabled, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ opacity: 0 });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedLabel = options.find(opt => opt.value === value)?.label || '';

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const portalDropdown = document.getElementById('styled-dropdown');
        if (portalDropdown && portalDropdown.contains(e.target)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDropdownStyle = useCallback(() => {
    if (!triggerRef.current) return { opacity: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const MIN_SPACE = 150; // minimum space needed to show below
    const dropdownHeight = Math.min(200, Math.max(80, spaceBelow > spaceAbove ? spaceBelow - 10 : spaceAbove - 10));

    let top;
    // Prefer below unless there's not enough room
    if (spaceBelow > MIN_SPACE) {
      top = rect.bottom + window.scrollY + 4;
    } else {
      top = rect.top + window.scrollY - dropdownHeight - 4;
    }

    return {
      position: 'absolute',
      top: top,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight: dropdownHeight,
      zIndex: 9999,
      opacity: 1,
      transition: 'opacity 0.15s ease',
    };
  }, []);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      const newStyle = getDropdownStyle();
      setDropdownStyle(newStyle);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setDropdownStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  // Recalculate on scroll/resize when open
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      const newStyle = getDropdownStyle();
      setDropdownStyle(newStyle);
    };
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, getDropdownStyle]);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
          {Icon && <Icon size={11} className="text-slate-600" />}
          <span>{label}</span>
        </label>
      )}
      <div
        ref={triggerRef}
        className={`w-full text-xs font-medium bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white/80 transition-all cursor-pointer shadow-sm flex items-center justify-between ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        onClick={toggleOpen}
      >
        <span className={selectedLabel ? 'text-slate-800 font-semibold' : 'text-slate-600'}>
          {selectedLabel || placeholder || 'Select...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && ReactDOM.createPortal(
        <div
          id="styled-dropdown"
          style={dropdownStyle}
          className="bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-xl overflow-y-auto"
        >
          {options.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-700 text-center">No options available</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2.5 sm:py-2 text-xs sm:text-sm hover:bg-indigo-100 cursor-pointer transition-colors ${
                  value === opt.value ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-800'
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

// ─── SearchableSelect (unchanged, uses same positioning logic) ──────────
const SearchableSelect = memo(({ options, value, onChange, placeholder, label, disabled, required, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({ opacity: 0 });
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedLabel = useMemo(() => {
    return options.find(opt => opt.value === value)?.label || '';
  }, [options, value]);

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearch('');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const portalDropdown = document.getElementById('searchable-dropdown');
        if (portalDropdown && portalDropdown.contains(e.target)) return;
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDropdownStyle = useCallback(() => {
    if (!inputRef.current) return { opacity: 0 };
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const MIN_SPACE = 150;
    const dropdownHeight = Math.min(256, Math.max(100, spaceBelow > spaceAbove ? spaceBelow - 10 : spaceAbove - 10));

    let top;
    if (spaceBelow > MIN_SPACE) {
      top = rect.bottom + window.scrollY + 4;
    } else {
      top = rect.top + window.scrollY - dropdownHeight - 4;
    }

    return {
      position: 'absolute',
      top: top,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight: dropdownHeight,
      zIndex: 9999,
      opacity: 1,
      transition: 'opacity 0.15s ease',
    };
  }, []);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      const newStyle = getDropdownStyle();
      setDropdownStyle(newStyle);
      setIsOpen(true);
      setSearch('');
    } else {
      setIsOpen(false);
      setDropdownStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      const newStyle = getDropdownStyle();
      setDropdownStyle(newStyle);
    };
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, getDropdownStyle]);

  useEffect(() => {
    if (isOpen && !loading) {
      const newStyle = getDropdownStyle();
      setDropdownStyle(newStyle);
    }
  }, [isOpen, loading, getDropdownStyle]);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1 pl-1">
          <Users size={11} className="text-slate-600" />
          <span>{label}</span>
        </label>
      )}
      <div ref={inputRef}>
        <div
          className={`w-full text-xs font-medium bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white/80 transition-all cursor-pointer shadow-sm flex items-center justify-between ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
          onClick={toggleOpen}
        >
          <span className={selectedLabel ? 'text-slate-800 font-semibold' : 'text-slate-600'}>
            {selectedLabel || placeholder || 'Select...'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {isOpen && !disabled && ReactDOM.createPortal(
        <div
          id="searchable-dropdown"
          style={dropdownStyle}
          className="bg-white/95 backdrop-blur-md border border-white/60 rounded-xl shadow-xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-md p-2 border-b border-white/30">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium bg-white/80 border border-white/50 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
              placeholder="Search..."
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {loading ? (
            <div className="px-3 py-3 text-xs text-slate-700 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-700 text-center">
              {options.length === 0 ? 'No advisors available' : 'No matching results'}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2.5 sm:py-2 text-xs sm:text-sm hover:bg-indigo-100 cursor-pointer transition-colors ${
                  value === opt.value ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-800'
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

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

      {/* Birds */}
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

      {/* Stars */}
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

// ─── Main Register Component ──────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('Student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [hodsList, setHodsList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingHods, setLoadingHods] = useState(true);

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

  // Fetch directory data
  useEffect(() => {
    const fetchReferences = async () => {
      setLoadingMentors(true);
      setLoadingHods(true);

      try {
        const hodsRes = await fetch(`${BACKEND_URL}/api/users/hods`);
        if (hodsRes.ok) {
          const hodsData = await hodsRes.json();
          const hodsArray = hodsData?.data || hodsData;
          setHodsList(Array.isArray(hodsArray) ? hodsArray : []);
        }
      } catch (err) {
        console.error('Connection failure syncing HOD directory:', err);
      } finally {
        setLoadingHods(false);
      }

      try {
        const mentorsRes = await fetch(`${BACKEND_URL}/api/users/mentors`);
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json();
          const mentorsArray = mentorsData?.data || mentorsData;
          setMentorsList(Array.isArray(mentorsArray) ? mentorsArray : []);
        }
      } catch (err) {
        console.error('Connection failure syncing Mentor directory:', err);
      } finally {
        setLoadingMentors(false);
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

  // Prepare options for SearchableSelect
  const getMentorOptions = useCallback((category) => {
    return mentorsList
      .filter(m => m.category === category)
      .map(m => {
        const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim();
        return { value: fullName, label: fullName };
      });
  }, [mentorsList]);

  const hodOptions = useMemo(() => {
    return hodsList.map(hod => {
      const fullName = `Dr. ${hod.firstName || ''} ${hod.lastName || ''}`.trim();
      return { value: fullName, label: fullName };
    });
  }, [hodsList]);

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
            LOA Portal
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
            <StyledSelect
              label="Gender"
              icon={Smile}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              value={formData.gender}
              onChange={(val) => handleInputChange('gender', val)}
              placeholder="Select Gender"
              disabled={isLoading}
              required
            />

            <StyledSelect
              label="Department"
              icon={Layers}
              options={[
                { value: 'Computer Science and Engineering', label: 'Computer Science and Engineering' },
              ]}
              value={formData.department}
              onChange={(val) => handleInputChange('department', val)}
              placeholder="Select Department"
              disabled={isLoading}
              required
            />
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-black/80">
                Account Type: <span className="text-indigo-600 dark:text-white font-extrabold">
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
                    <StyledSelect
                      label="Academic Year"
                      icon={Sparkles}
                      options={[
                        { value: 'I Year', label: 'I Year' },
                        { value: 'II Year', label: 'II Year' },
                        { value: 'III Year', label: 'III Year' },
                        { value: 'IV Year', label: 'IV Year' },
                      ]}
                      value={formData.year}
                      onChange={(val) => handleInputChange('year', val)}
                      placeholder="Choose Year"
                      disabled={isLoading}
                      required
                    />

                    <StyledSelect
                      label="Section"
                      icon={Building2}
                      options={[
                        { value: 'Section A', label: 'A' },
                        { value: 'Section B', label: 'B' },
                        { value: 'Section C', label: 'C' },
                        { value: 'Section D', label: 'D' },
                      ]}
                      value={formData.section}
                      onChange={(val) => handleInputChange('section', val)}
                      placeholder="Choose Section"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <StyledSelect
                    label="Student Type"
                    icon={Home}
                    options={[
                      { value: 'Day Scholar', label: 'Day Scholar' },
                      { value: 'Hosteller', label: 'Hosteller' },
                    ]}
                    value={formData.studentType}
                    onChange={(val) => handleInputChange('studentType', val)}
                    placeholder="Choose Type"
                    disabled={isLoading}
                    required
                  />

                  <SearchableSelect
                    label="Class Advisor 1 (CA1)"
                    options={getMentorOptions('CA1')}
                    value={formData.firstmentorName || ''}
                    onChange={(val) => handleInputChange('firstmentorName', val)}
                    placeholder="Choose Your CA1 Advisor"
                    disabled={isLoading}
                    required
                    loading={loadingMentors}
                  />

                  <SearchableSelect
                    label="Class Advisor 2 (CA2)"
                    options={getMentorOptions('CA2')}
                    value={formData.secondmentorName || ''}
                    onChange={(val) => handleInputChange('secondmentorName', val)}
                    placeholder="Choose Your CA2 Advisor"
                    disabled={isLoading}
                    required
                    loading={loadingMentors}
                  />
                </div>
              )}

              {/* MENTOR EXTRA FIELDS */}
              {selectedRole === 'Mentor' && (
                <div className="space-y-4">
                  <SearchableSelect
                    label="Select Department HOD"
                    options={hodOptions}
                    value={formData.selectedHodId || ''}
                    onChange={(val) => handleInputChange('selectedHodId', val)}
                    placeholder="Choose Your Head of Department"
                    disabled={isLoading}
                    required
                    loading={loadingHods}
                  />

                  <StyledSelect
                    label="Mentor Category"
                    icon={ShieldCheck}
                    options={[
                      { value: 'CA1', label: 'CA1' },
                      { value: 'CA2', label: 'CA2' },
                    ]}
                    value={formData.category || ''}
                    onChange={(val) => handleInputChange('category', val)}
                    placeholder="Select Category"
                    disabled={isLoading}
                    required
                  />
                </div>
              )}

              {/* HOD EXTRA FIELDS */}
              {selectedRole === 'HOD' && (
                <div className="p-3 bg-white/30 backdrop-blur-md border border-white/40 rounded-xl text-[11px] font-medium text-slate-900 leading-relaxed shadow-sm flex items-center gap-2">
                  <Sparkles size={12} className="text-slate-900 shrink-0" />
                  <span>No additional authorization trees are required for department heads.</span>
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
            <span>{isLoading ? 'Processing...' : 'Register Profile'}</span>
            {!isLoading && <ArrowRight size={14} />}
          </motion.button>
        </form>

        <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-6 pt-4 border-t border-white/20">
          Already have an institutional profile?{' '}
          <Link to="/login" className="text-slate-800 dark:text-white font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;