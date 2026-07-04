import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  Send,
  AlertTriangle,
  User,
  ShieldCheck,
  Phone,
  UserCheck,
  Loader2,
  Hash,
  Clock,
  Sparkles,
} from 'lucide-react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

const ApplyLeave = ({ forcedType = 'Leave' }) => {
  const [profile, setProfile] = useState({
    name: '',
    registerNo: '',
    studentType: '',
    mentor: '',
    mobile: '',
  });

  const [formData, setFormData] = useState({
    type: forcedType,
    duration: 'Full Day',
    halfDaySession: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Reset form when tab changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      type: forcedType,
      duration: 'Full Day',
      halfDaySession: '',
      fromDate: '',
      toDate: '',
    }));
    setMessage({ type: '', text: '' });
  }, [forcedType]);

  // Fetch user profile
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
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok) {
          setProfile({
            name: data.name,
            registerNo: data.registerNo || 'Not Provided',
            studentType: data.studentType || 'Regular Track',
            mentor: data.firstmentorName || 'N/A',
            mobile: data.mobile || 'Not Provided',
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

  const handleDateChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (prev.duration === 'Half Day' && field === 'fromDate') {
        updated.toDate = value;
      }
      return updated;
    });
  };

  const handleDurationChange = (durationValue) => {
    setFormData((prev) => ({
      ...prev,
      duration: durationValue,
      halfDaySession: durationValue === 'Half Day' ? 'Morning Session' : '',
      toDate: durationValue === 'Half Day' ? prev.fromDate : prev.toDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...formData,
      toDate: formData.duration === 'Half Day' ? formData.fromDate : formData.toDate,
    };

    try {
      const response = await fetch('https://leave-od-approval.onrender.com/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Your ${formData.type} (${formData.duration}) request has been submitted successfully.\n\nRequest Status: Pending`,
        });
        setFormData({
          type: forcedType,
          duration: 'Full Day',
          halfDaySession: '',
          fromDate: '',
          toDate: '',
          reason: '',
        });
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
     <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-600 uppercase">Loading your <span className="font-bold text-blue-900">Leave</span> form…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8"
    >
      {/* Header with Navy → Amber gradient accent */}
      <div className="relative mb-6 sm:mb-8">
        <div className="absolute left-0 top-0 h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-900 via-amber-500 to-amber-400 rounded-full" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-2 flex items-center gap-2 sm:gap-3">
          <Sparkles className="text-amber-500" size={24} />
          Apply {formData.type}
        </h1>
        <br />
        <p className="text-sm text-gray-500 mt-1">
          You can submit your{' '}
          <span className="font-semibold text-blue-900 underline decoration-amber-500 underline-offset-2">
            {formData.type}
          </span>{' '}
          request through this form. Please ensure all details are correct before submission.
        </p>
      </div>
      {/* Message Alert */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Main Card – Silver-toned */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 sm:mt-6 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl shadow-lg shadow-gray-200/60 p-4 sm:p-6 md:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Profile Section – Silver background */}
          <section>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" /> Your Details
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-300">
              <div className="flex items-center gap-3">
                <User size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Student Name</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Registration No.</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{profile.registerNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Student Type</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{profile.studentType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned CA1</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{profile.mentor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                <Phone size={18} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p>
                  <p className="text-sm font-semibold text-blue-900 truncate">{profile.mobile}</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-300" />

          {/* Duration & Session */}
          <section>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Leave Configuration
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                  Duration Type *
                </label>
                <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-300">
                  {['Full Day', 'Half Day'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDurationChange(option)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                        formData.duration === option
                          ? 'bg-blue-900 text-white shadow-sm ring-1 ring-amber-500'
                          : 'text-gray-500 hover:text-blue-900'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {formData.duration === 'Half Day' && (
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Select Session *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                    <select
                      required
                      value={formData.halfDaySession}
                      onChange={(e) => setFormData({ ...formData, halfDaySession: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-11 pr-4 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all appearance-none font-medium"
                    >
                      <option value="Morning Session">Morning Session (FN)</option>
                      <option value="Afternoon Session">Afternoon Session (AN)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Dates */}
          <section>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" /> Application Timeline
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label={formData.duration === 'Half Day' ? 'Leave Date *' : 'Start Date *'}
                type="date"
                icon={Calendar}
                value={formData.fromDate}
                onChange={(e) => handleDateChange('fromDate', e.target.value)}
                required
                className="border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              {formData.duration === 'Full Day' && (
                <InputField
                  label="End Date *"
                  type="date"
                  icon={Calendar}
                  value={formData.toDate}
                  onChange={(e) => handleDateChange('toDate', e.target.value)}
                  required
                  className="border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              )}
            </div>
          </section>

          {/* Reason */}
          <section>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Reason for Absence *
            </h2>
            <div className="mt-3 relative">
              <FileText className="absolute left-4 top-4 text-amber-500" size={18} />
              <textarea
                required
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={`Provide a clear reason for your ${formData.duration.toLowerCase()} ${formData.type.toLowerCase()} request…`}
                className="w-full bg-white border border-gray-300 rounded-2xl py-3 pl-12 pr-4 text-sm text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
              />
            </div>
          </section>

          {/* Workflow Alert – Amber background with Navy text */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Approval Workflow</p>
              <p className="text-sm text-blue-900 font-medium leading-relaxed">
                Submission → <span className="font-semibold underline decoration-amber-500">Pending</span> · Mentor Review →{' '}
                <span className="font-semibold underline decoration-amber-500">Partially Approved</span> · HOD Review →{' '}
                <span className="font-semibold underline decoration-amber-500">Approved</span>
              </p>
            </div>
          </div>

          {/* Submit Button – Navy with Amber hover */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 sm:py-4 bg-blue-900 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-md shadow-blue-900/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={16} className="-translate-y-px" />
            )}
            <span>{submitting ? 'Processing…' : `Submit ${formData.duration} ${formData.type}`}</span>
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ApplyLeave;