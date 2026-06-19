// Register.jsx
import React, { useState, useEffect } from 'react';
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
  Fingerprint
} from 'lucide-react';
import InputField from '../../components/common/InputField';

const Register = () => {
  const navigate = useNavigate();
  
  // Active Role Selection
  const [selectedRole, setSelectedRole] = useState('Student'); 
  
  // API Request Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic lists populated from backend database
  const [hodsList, setHodsList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);

  // Form State Ledger
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
    selectedMentorId: '', 
    password: '',
    confirmPassword: ''
  });

  const BACKEND_URL = 'https://leave-od-approval.onrender.com';

  // Fetch available HODs and Mentors with safer decoupled handling
  useEffect(() => {
    const fetchReferences = async () => {
      // 1. Fetch HODs independently
      try {
        const hodsRes = await fetch(`${BACKEND_URL}/api/users/hods`);
        if (hodsRes.ok) {
          const hodsData = await hodsRes.json();
          console.log("Fetched HODs safely:", hodsData);
          setHodsList(Array.isArray(hodsData) ? hodsData : []);
        } else {
          console.error(`HOD server route returned failure status: ${hodsRes.status}`);
        }
      } catch (err) {
        console.error("Critical connection failure syncing HOD directory:", err);
      }

      // 2. Fetch Mentors independently to ensure isolation
      try {
        const mentorsRes = await fetch(`${BACKEND_URL}/api/users/mentors`);
        if (mentorsRes.ok) {
          const mentorsData = await mentorsRes.json();
          console.log("Fetched Mentors Payload from Backend:", mentorsData);
          setMentorsList(Array.isArray(mentorsData) ? mentorsData : []);
        } else {
          console.error(`Mentor server route returned failure status: ${mentorsRes.status}`);
        }
      } catch (err) {
        console.error("Critical connection failure syncing Mentor directory:", err);
      }
    };

    fetchReferences();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg(''); 
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.toLowerCase().endsWith('@ksrce.ac.in')) {
      setErrorMsg("Error: Unauthorized domain. Institutional email address must end with @ksrce.ac.in");
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobileNo)) {
      setErrorMsg("Error: Invalid Mobile Number. Must be exactly 10 digits without country code.");
      return;
    }

    if (formData.password.length !== 8) {
      setErrorMsg("Error: Password constraint violation. Length must be exactly 8 characters.");
      return;
    }

    const upperCaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[^A-Za-z0-9]/;

    if (!upperCaseRegex.test(formData.password)) {
      setErrorMsg("Error: Password strength failure. Must contain at least 1 uppercase letter.");
      return;
    }
    if (!numberRegex.test(formData.password)) {
      setErrorMsg("Error: Password strength failure. Must contain at least 1 numeric digit.");
      return;
    }
    if (!specialCharRegex.test(formData.password)) {
      setErrorMsg("Error: Password strength failure. Must contain at least 1 special character (e.g., @, #, $, %).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Error: Passwords do not match. Please re-enter.");
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
        mentorName: formData.selectedMentorId 
      }),
      ...(selectedRole === 'Mentor' && {
        hodName: formData.selectedHodId 
      })
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      alert(`Registration successful for: ${selectedRole}!`);
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.message || 'Network connectivity error. Connect server instance.');
    } finally {
      setIsLoading(false);
    }
  };

  const tierMeta = {
    'Student': { icon: GraduationCap, text: 'Student Account' },
    'Mentor': { icon: UserCheck, text: 'Mentor Account' },
    'HOD': { icon: Building2, text: 'Head of Department Account' }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-3 py-6 sm:p-6 md:p-8 relative font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 md:p-10 shadow-xl shadow-slate-200/50 relative z-10 my-4 sm:my-8 overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900" />

        <div className="flex flex-col items-center text-center mb-6 sm:mb-8 pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-black">Register for your institutional portal</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200/60 text-rose-800 text-xs font-semibold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 mb-6 sm:mb-8">
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
                  setFormData(prev => ({ 
                    ...prev, 
                    registerNo: '', 
                    password: '', 
                    confirmPassword: '', 
                    selectedHodId: '',
                    selectedMentorId: '', 
                    year: '', 
                    section: '', 
                    studentType: '',
                    department: ''
                  }));
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold tracking-wide rounded-lg transition-all duration-200 border disabled:opacity-50 ${
                  isCurrent 
                    ? 'bg-white text-slate-900 border-slate-200 shadow-3xs font-black' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40 border-transparent'
                }`}
              >
                <Icon size={13} className={isCurrent ? 'text-amber-600' : 'text-slate-400'} />
                <span>{roleType}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="First Name" icon={User} placeholder="e.g., Ram" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} required disabled={isLoading} />
            <InputField label="Last Name" icon={User} placeholder="e.g., M" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} required disabled={isLoading} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Smile size={11} className="text-slate-300" />
                <span>Gender</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                required
                disabled={isLoading}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:bg-white focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
              >
                <option value="" disabled hidden>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* UPDATED: Department converted to Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Layers size={11} className="text-slate-300" />
                <span>Department</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                required
                disabled={isLoading}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:bg-white focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
              >
                <option value="" disabled hidden>Select Department</option>
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Email Address (@ksrce.ac.in)" type="email" icon={Mail} placeholder="username@ksrce.ac.in" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required disabled={isLoading} />
            <InputField label="Mobile Number (10 Digits)" type="tel" icon={Phone} placeholder="9876543210" value={formData.mobileNo} onChange={(e) => handleInputChange('mobileNo', e.target.value)} required disabled={isLoading} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-5 bg-slate-50/70 p-4 border border-slate-200/60 rounded-xl"
            >
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span>Account Type:</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/40">
                  {tierMeta[selectedRole].text}
                </span>
              </div>

              {/* STUDENT EXTRA FIELDS */}
              {selectedRole === 'Student' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="w-full">
                    <InputField label="Register Number" icon={Fingerprint} placeholder="e.g., 73152213001" value={formData.registerNo} onChange={(e) => handleInputChange('registerNo', e.target.value)} required={selectedRole === 'Student'} disabled={isLoading} />
                  </div>

                  {/* UPDATED: Year & Section inputs replaced with drop-down selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-slate-300" />
                        <span>Academic Year</span>
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        required={selectedRole === 'Student'}
                        disabled={isLoading}
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="" disabled hidden>Choose Year</option>
                        <option value="I Year">I</option>
                        <option value="II Year">II</option>
                        <option value="III Year">III</option>
                        <option value="IV Year">IV</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Building2 size={11} className="text-slate-300" />
                        <span>Section</span>
                      </label>
                      <select
                        value={formData.section}
                        onChange={(e) => handleInputChange('section', e.target.value)}
                        required={selectedRole === 'Student'}
                        disabled={isLoading}
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="" disabled hidden>Choose Section</option>
                        <option value="Section A">A</option>
                        <option value="Section B">B</option>
                        <option value="Section C">C</option>
                        <option value="Section D">D</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Home size={11} className="text-slate-300" />
                      <span>Student Type</span>
                    </label>
                    <select
                      value={formData.studentType}
                      onChange={(e) => handleInputChange('studentType', e.target.value)}
                      required={selectedRole === 'Student'}
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                      <option value="" disabled hidden>Choose Type</option>
                      <option value="Day Scholar">Day Scholar</option>
                      <option value="Hosteller">Hosteller</option>
                    </select>
                  </div>

                  {/* FIXED ASSIGNED MENTOR CHOOSE DOM TREE */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Users size={11} className="text-slate-300" />
                      <span>Select Assigned Mentor</span>
                    </label>
                    <select
                      value={formData.selectedMentorId}
                      onChange={(e) => handleInputChange('selectedMentorId', e.target.value)}
                      required={selectedRole === 'Student'}
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                      <option value="" disabled hidden>Choose Your Mentor</option>
                      {mentorsList.length > 0 ? (
                        mentorsList.map((mentor) => {
                          const mentorFullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
                          return (
                            <option key={mentor._id || mentor.id} value={mentorFullName}>
                              {mentorFullName} {mentor.department ? `(${mentor.department})` : ''}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No registered mentors available</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* MENTOR EXTRA FIELDS */}
              {selectedRole === 'Mentor' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Users size={11} className="text-slate-300" />
                      <span>Select Department HOD</span>
                    </label>
                    <select
                      value={formData.selectedHodId}
                      onChange={(e) => handleInputChange('selectedHodId', e.target.value)}
                      required={selectedRole === 'Mentor'}
                      disabled={isLoading}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:border-slate-900 transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                      <option value="" disabled hidden>Choose Your Head of Department</option>
                      {hodsList.map((hod) => {
                        const hodFullName = `Dr. ${hod.firstName || ''} ${hod.lastName || ''}`.trim();
                        return (
                          <option key={hod._id || hod.id} value={hodFullName}>
                            {hodFullName} {hod.department ? `(${hod.department})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic px-0.5">
                    * Selecting your department HOD links your faculty profile directly to their administrative record.
                  </p>
                </div>
              )}

              {/* HOD EXTRA FIELDS */}
              {selectedRole === 'HOD' && (
                <div className="p-3 bg-amber-50/40 border border-amber-200/50 rounded-lg text-[10px] font-bold text-amber-800 leading-relaxed flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⭐</span>
                  <span>Here, No structural hierarchy links are required for Department Head registration pathways.</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 mt-6">
            <InputField label="Password (Exactly 8 chars)" type="password" icon={Lock} placeholder="Requires A-Z, 0-9, special char" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required disabled={isLoading} />
            <InputField label="Confirm Password" type="password" icon={Lock} placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required disabled={isLoading} />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 text-xs font-black rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-slate-950 active:scale-[0.99] flex items-center justify-center gap-2 border transition-all duration-300 shadow-2xs uppercase tracking-wider disabled:bg-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
          >
            <span>{isLoading ? 'Processing Registration...' : 'Register Account'}</span>
            {!isLoading && <ArrowRight size={13} className="text-amber-400" />}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 font-extrabold hover:text-amber-600 transition-colors inline-flex items-center gap-0.5">
            Sign In Here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;