import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, Send, AlertTriangle, User, ShieldCheck, Phone, UserCheck, Loader2, Hash, Clock } from 'lucide-react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

// 🧠 Pass forcedType='Leave' or forcedType='On-Duty' when mounting this component in your App router
const ApplyLeave = ({ forcedType = 'Leave' }) => {
  const [profile, setProfile] = useState({ name: '', registerNo: '', studentType: '', mentor: '', mobile: '' });

  const [formData, setFormData] = useState({
    type: forcedType,
    duration: 'Full Day', // 'Full Day' or 'Half Day'
    halfDaySession: '',   // 'Morning Session' or 'Afternoon Session' (only when duration is Half Day)
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 🚨 LIFECYCLE PATCH: Dynamically syncs form type when switching between Leave and OD tabs
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      type: forcedType,
      duration: 'Full Day',
      halfDaySession: '',
      fromDate: '',
      toDate: ''
    }));
    setMessage({ type: '', text: '' }); // Clear any stale submission messages
  }, [forcedType]);

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
            mentor: data.firstmentorName || 'N/A',
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

  // Sync End Date automatically if Half Day is selected (as it can only be for a single day)
  const handleDateChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (prev.duration === 'Half Day' && field === 'fromDate') {
        updated.toDate = value; // Force toDate to match fromDate for Half Day requests
      }
      return updated;
    });
  };

  const handleDurationChange = (durationValue) => {
    setFormData((prev) => ({
      ...prev,
      duration: durationValue,
      halfDaySession: durationValue === 'Half Day' ? 'Morning Session' : '',
      // If switching to Half Day, make sure end date equals start date
      toDate: durationValue === 'Half Day' ? prev.fromDate : prev.toDate
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Payload optimization based on Full/Half day parameters
    const payload = {
      ...formData,
      // Ensure payload matches backend tracking requirements
      toDate: formData.duration === 'Half Day' ? formData.fromDate : formData.toDate
    };

    try {
      const response = await fetch('https://leave-od-approval.onrender.com/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Your ${formData.type} (${formData.duration}) request has been submitted successfully.\n\nRequest Status: Pending`
        });
        // Reset interactive inputs while keeping the current page context type intact
        setFormData({ type: forcedType, duration: 'Full Day', halfDaySession: '', fromDate: '', toDate: '', reason: '' });
      } else {
        setMessage({ type: 'error', text: resData.message || 'Submission failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not establish connection to authorization node.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-sm font-medium">Loading your profile information...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6 p-2">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Apply {formData.type}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Your application will automatically be set under department's <span className="font-bold underline text-blue-600">{formData.type}</span> request platform.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verified Student Details Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><User size={15} className="text-slate-400" /> {profile.name}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><Hash size={15} className="text-slate-400" /> {profile.registerNo}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Type</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><ShieldCheck size={15} className="text-slate-400" /> {profile.studentType}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned CA1</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><UserCheck size={15} className="text-slate-400" /> {profile.mentor}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><Phone size={15} className="text-slate-400" /> {profile.mobile}</div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* New Section: Leave Configuration (Duration Selection) */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Leave Request</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-0.5">Duration Type *</label>
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button type="button" onClick={() => handleDurationChange('Full Day')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.duration === 'Full Day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Full Day
                  </button>
                  <button type="button" onClick={() => handleDurationChange('Half Day')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.duration === 'Half Day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Half Day
                  </button>
                </div>
              </div>

              {/* Conditional rendering for Session Selection if Half Day is chosen */}
              {formData.duration === 'Half Day' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-0.5">Select Session *</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <select required value={formData.halfDaySession} onChange={(e) => setFormData({ ...formData, halfDaySession: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-all appearance-none font-medium">
                      <option value="Morning Session">Morning Session (FN)</option>
                      <option value="Afternoon Session">Afternoon Session (AN)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Window Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Application Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={formData.duration === 'Half Day' ? "Leave Date *" : "Start Date *"} type="date" icon={Calendar} value={formData.fromDate} onChange={(e) => handleDateChange('fromDate', e.target.value)} required />
              {formData.duration === 'Full Day' && (
                <InputField label="End Date *" type="date" icon={Calendar} value={formData.toDate} onChange={(e) => handleDateChange('toDate', e.target.value)} required />
              )}
            </div>
          </div>

          {/* Reason Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-0.5">Reason for Absence *</label>
            <div className="relative">
              <FileText className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <textarea required rows={4} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder={`Please provide a clear reason for your ${formData.duration.toLowerCase()} ${formData.type.toLowerCase()} request...`} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Workflow Alert Status */}
          <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase tracking-wide">Approval Workflow:</p>
              <p className="leading-relaxed font-medium">Submission ➔ <span className="underline font-semibold">Pending</span>. Mentor Review ➔ <span className="underline font-semibold">Partially Approved</span>. HOD Review ➔ <span className="underline font-semibold">Approved</span>.</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
            <span>{submitting ? "Processing your leave request..." : `Submit ${formData.duration} ${formData.type}`}</span>
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ApplyLeave;