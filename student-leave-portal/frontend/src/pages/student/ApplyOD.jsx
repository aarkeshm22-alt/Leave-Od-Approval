import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, FileText, Send, AlertTriangle, User, ShieldCheck, UserCheck,
  Loader2, Hash, MapPin, School, Upload, ImageIcon, FileX, Lock, Unlock, Clock
} from 'lucide-react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext'; // adjust import path

const ApplyOD = () => {
  const { darkMode } = useTheme();

  // Profile state matching backend routes
  const [profile, setProfile] = useState({ name: '', registerNo: '', studentType: '', mentor: '', mobile: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Interactive inputs context state
  const [formData, setFormData] = useState({
    type: 'On-Duty',
    duration: 'Full Day',    // 'Full Day' or 'Half Day'
    halfDaySession: '',      // 'Morning Session' or 'Afternoon Session'
    fromDate: '',
    toDate: '',
    collegeName: '',
    collegeLocation: '',
    reason: '',
    document: null
  });

  // Interface management tracking states
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fileError, setFileError] = useState('');
  const [isApplicationApproved, setIsApplicationApproved] = useState(false);

  // State variables synchronized to receive database tracker responses
  const [currentOdId, setCurrentOdId] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState('Pending');

  // Load user profile details on mounting life cycle hook
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token || token === 'undefined' || token === 'null') {
        setLoadingProfile(false);
        setMessage({ type: 'error', text: 'Authentication token missing. Please log in again.' });
        return;
      }

      try {
        const response = await fetch('https://leave-od-approval.onrender.com/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
          setProfile({
            name: data.name,
            registerNo: data.registerNo || 'Not Provided',
            studentType: data.studentType || 'Regular Track',
            mentor: data.firstmentorName || 'Not Assigned',
            mobile: data.mobile || 'Not Provided'
          });
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to retrieve profile details.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Network connection issue. Please try again.' });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Sync End Date automatically if Half Day is selected
  const handleDateChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (prev.duration === 'Half Day' && field === 'fromDate') {
        updated.toDate = value; // Force toDate to match fromDate for Half Day entries
      }
      return updated;
    });
  };

  const handleDurationChange = (durationValue) => {
    setFormData((prev) => ({
      ...prev,
      duration: durationValue,
      halfDaySession: durationValue === 'Half Day' ? 'Morning Session' : '',
      toDate: durationValue === 'Half Day' ? prev.fromDate : prev.toDate
    }));
  };

  // Strict constraint asset size image validator
  const validateAndSetImage = (file) => {
    setFileError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Unsupported file format. Please upload an image file (PNG, JPEG, WebP) only.');
      setFormData(prev => ({ ...prev, document: null }));
      return;
    }

    const maxByteLimit = 300 * 1024; // 300 KB constraint
    if (file.size > maxByteLimit) {
      setFileError(`Image size is higher than the 300 KB limit (Detected: ${(file.size / 1024).toFixed(1)} KB)`);
      setFormData(prev => ({ ...prev, document: null }));
      return;
    }

    setFormData(prev => ({ ...prev, document: file }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = new FormData();
      payload.append('type', formData.type);
      payload.append('duration', formData.duration);
      payload.append('halfDaySession', formData.halfDaySession);
      payload.append('fromDate', formData.fromDate);
      payload.append('toDate', formData.duration === 'Half Day' ? formData.fromDate : formData.toDate);
      payload.append('collegeName', formData.collegeName);
      payload.append('collegeLocation', formData.collegeLocation);
      payload.append('reason', formData.reason);

      const response = await fetch('https://leave-od-approval.onrender.com/api/od/apply-od', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      const resData = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Your On-Duty (${formData.duration}) request has been submitted successfully.\n\nRequest Status: Pending`
        });

        const backendId = resData?.data?._id || resData?.data?.id;
        if (backendId) {
          setCurrentOdId(backendId);
        }
        setApplicationStatus('Partially Approved');
        setIsApplicationApproved(true); // Locks inputs and safely unfolds upload canvas frame

        // --- CLEAR FORM DATA LOG & INPUT FIELDS HERE ---
        setFormData({
          type: 'On-Duty',
          duration: 'Full Day',
          halfDaySession: '',
          fromDate: '',
          toDate: '',
          collegeName: '',
          collegeLocation: '',
          reason: '',
          document: null // Clears out structural logs or reference files as well
        });

        // Optional: If you also want to clear any validation/error traces at this point
        setFileError('');

      } else {
        setMessage({ type: 'error', text: resData.message || 'Submission initialization failed.' });
      }
    } catch (err) {
      console.error("Frontend UI execution breakdown tracer:", err);
      setMessage({ type: 'error', text: 'Could not establish connection to clearance endpoint node.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <Loader2 className={`animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`} size={32} />
        <p className="text-sm font-medium text-center">Loading Your profile information...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-4xl mx-auto space-y-6 px-4 py-6 md:p-6 lg:p-8 antialiased transition-colors
        ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      {/* HEADER SECTION */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${darkMode ? 'text-slate-500' : 'text-slate-900'}`}>
          Apply On-Duty (OD)
        </h2>
        <p className={`text-xs md:text-sm font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Your application will automatically be set under department's <span className={`font-bold underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formData.type}</span> request platform.
        </p>
      </div>

      {/* FEEDBACK SYSTEM MESSAGES */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border shadow-2xs transition-colors
          ${message.type === 'success'
            ? darkMode ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : darkMode ? 'bg-rose-900/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* CORE WEB FORM WORKSPACE */}
      <div className={`border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xs space-y-6 transition-colors
        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* PROFILE ARCHITECTURE: Fully Responsive Layout Grid */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Your Details
            </h3>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border transition-colors
              ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}
            >
              <div className="min-w-0">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Student Name</label>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <User size={15} className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{profile.name}</span>
                </div>
              </div>
              <div className="min-w-0">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Registration Number</label>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Hash size={15} className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{profile.registerNo}</span>
                </div>
              </div>
              <div className="min-w-0">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Student Type</label>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Hash size={15} className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{profile.studentType}</span>
                </div>
              </div>
              <div className="min-w-0">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Assigned CA1</label>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <UserCheck size={15} className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{profile.mentor}</span>
                </div>
              </div>
              <div className="min-w-0">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Mobile Number</label>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-1 truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <ShieldCheck size={15} className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{profile.mobile}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className={`transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'}`} />

          {/* DURATION CONFIGURATION SECTION */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              OD Request
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider pl-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Duration Type *
                </label>
                <div className={`flex rounded-xl p-1 border transition-colors
                  ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}
                >
                  <button
                    type="button"
                    disabled={isApplicationApproved}
                    onClick={() => handleDurationChange('Full Day')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50
                      ${formData.duration === 'Full Day'
                        ? darkMode ? 'bg-slate-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Full Day
                  </button>
                  <button
                    type="button"
                    disabled={isApplicationApproved}
                    onClick={() => handleDurationChange('Half Day')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50
                      ${formData.duration === 'Half Day'
                        ? darkMode ? 'bg-slate-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Half Day
                  </button>
                </div>
              </div>

              {formData.duration === 'Half Day' && (
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider pl-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Select Session *
                  </label>
                  <div className="relative">
                    <Clock className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
                    <select
                      required
                      disabled={isApplicationApproved}
                      value={formData.halfDaySession}
                      onChange={(e) => setFormData({ ...formData, halfDaySession: e.target.value })}
                      className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm appearance-none font-medium transition-colors
                        ${darkMode
                          ? 'bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-500 disabled:bg-slate-800 disabled:text-slate-400'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400'
                        } border focus:outline-none`}
                    >
                      <option value="Morning Session">Morning Session (FN)</option>
                      <option value="Afternoon Session">Afternoon Session (AN)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* EVENTS MANAGEMENT SCHEDULE: Tablet/Desktop Grid Breakpoints */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Event Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label={formData.duration === 'Half Day' ? "OD Date *" : "OD Starting Date *"}
                type="date"
                icon={Calendar}
                value={formData.fromDate}
                onChange={(e) => handleDateChange('fromDate', e.target.value)}
                required
                disabled={isApplicationApproved}
                darkMode={darkMode}
              />
              {formData.duration === 'Full Day' && (
                <InputField
                  label="OD Ending Date *"
                  type="date"
                  icon={Calendar}
                  value={formData.toDate}
                  onChange={(e) => handleDateChange('toDate', e.target.value)}
                  required
                  disabled={isApplicationApproved}
                  darkMode={darkMode}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Host College / Organization Name *"
              placeholder="e.g., KSR College of Engineering"
              type="text"
              icon={School}
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              required
              disabled={isApplicationApproved}
              darkMode={darkMode}
            />
            <InputField
              label="College / Event Location *"
              placeholder="e.g., Tiruchengode, Tamil Nadu"
              type="text"
              icon={MapPin}
              value={formData.collegeLocation}
              onChange={(e) => setFormData({ ...formData, collegeLocation: e.target.value })}
              required
              disabled={isApplicationApproved}
              darkMode={darkMode}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider pl-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Reason (Purpose of Event) *
            </label>
            <div className="relative">
              <FileText className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
              <textarea
                required
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="eg. Participating in the Grand Finale of Inter-University Smart Hackathon 2026..."
                disabled={isApplicationApproved}
                className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm transition-colors
                  ${darkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-500 disabled:bg-slate-800 disabled:text-slate-400'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400'
                  } border focus:outline-none disabled:cursor-not-allowed`}
              />
            </div>
          </div>

          <hr className={`transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'}`} />

          {/* DYNAMIC LOCKABLE CANVAS SECTION */}
          <div className="flex flex-col gap-2.5 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className={`text-xs font-bold uppercase tracking-wider pl-0.5 transition-colors
                ${isApplicationApproved ? darkMode ? 'text-slate-200' : 'text-slate-700' : darkMode ? 'text-slate-400' : 'text-slate-400'}`}
              >
                Supporting OD Attestation Certificate Proof File (IMAGE ONLY - MAX 300KB)
              </label>

              {/* STATUS INDICATOR BADGE COMPONENT WITH ICONS */}
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-auto border transition-all
                ${isApplicationApproved
                  ? darkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800 shadow-3xs' : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-3xs'
                  : darkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {isApplicationApproved ? (
                  <>
                    <Unlock size={11} className={`stroke-[2.5] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>Upload Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock size={11} className="stroke-[2.5] text-slate-400" />
                    <span>Locked Until Details Saved</span>
                  </>
                )}
              </div>
            </div>

            {/* DUST IMAGE DRAG SURFACE CONTAINER */}
            <div
              onDragOver={(e) => { if (isApplicationApproved) { e.preventDefault(); setDragActive(true); } }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                if (!isApplicationApproved) return;
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files[0]) validateAndSetImage(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-6 lg:p-10 text-center transition-all relative
                ${!isApplicationApproved
                  ? darkMode ? 'border-slate-700 bg-slate-800/50 opacity-60 cursor-not-allowed pointer-events-none' : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed pointer-events-none'
                  : dragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 cursor-pointer shadow-inner'
                    : darkMode ? 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer group' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer group'
                }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={!isApplicationApproved}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className={`mx-auto mb-2 transition-colors
                ${!isApplicationApproved
                  ? darkMode ? 'text-slate-600' : 'text-slate-300'
                  : darkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'
                }`}
                size={26}
              />

              <p className={`text-xs font-semibold px-2 ${!isApplicationApproved ? darkMode ? 'text-slate-500' : 'text-slate-400' : darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {formData.document ? `Selected: ${formData.document.name}` : "Drop your event image proof here or click to scan storage space"}
              </p>
              <p className={`text-[10px] mt-1 px-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Acceptable formats: JPEG, PNG, or WebP up to 300 KB maximum file load size
              </p>
            </div>

            {/* FILE SUB-ERROR PORTAL MESSAGING MATRIX */}
            <AnimatePresence mode="wait">
              {fileError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`flex items-center gap-2 p-3 text-xs font-semibold rounded-xl transition-colors
                    ${darkMode ? 'bg-rose-900/30 border border-rose-800 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}
                >
                  <FileX size={14} className={`shrink-0 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                  <span>{fileError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* INSTRUCTIONAL FOOTER WARNING CONTEXT BOARD */}
          <div className={`p-4 rounded-xl flex items-start gap-3 transition-colors
            ${darkMode ? 'bg-amber-900/30 border border-amber-800/50' : 'bg-amber-50 border border-amber-200/70'}`}
          >
            <AlertTriangle className={`shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} size={16} />
            <div className={`text-xs space-y-1 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
              <p className="font-bold uppercase tracking-wide">Dynamic Submission Routing Protocol:</p>
              <p className="leading-relaxed font-medium">
                Fill out the text, duration, and location specifics above and click submit. Once processed successfully, form inputs will freeze, and the attestation image slot directly unlocks for asset attachment.
              </p>
            </div>
          </div>

          {/* ACTION SUBMIT SUBMISSION CONTROLLER TRIGGERS */}
          {!isApplicationApproved ? (
            <Button
              type="submit"
              className={`w-full py-3 font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors
                ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
              <span>{submitting ? "Processing Registry Write..." : `Submit ${formData.duration} ${formData.type} Details`}</span>
            </Button>
          ) : (
            <div className={`p-4 rounded-xl text-center text-xs font-bold tracking-tight flex items-center justify-center gap-2 shadow-2xs transition-colors
              ${darkMode ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}
            >
              <ImageIcon size={15} className={`animate-pulse ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Event Registry Profile Transmitted! Use the unlocked panel above to append image proof parameters.</span>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

export default ApplyOD;