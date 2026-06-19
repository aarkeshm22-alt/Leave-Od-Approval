import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, Send, AlertTriangle, User, ShieldCheck, Phone, UserCheck, Loader2, Hash } from 'lucide-react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

// 🧠 Pass forcedType='Leave' or forcedType='On-Duty' when mounting this component in your App router
const ApplyLeave = ({ forcedType = 'Leave' }) => {
  const [profile, setProfile] = useState({ name: '', registerNo: '', studentType: '', mentor: '', mobile: '' });
  
  const [formData, setFormData] = useState({ 
    type: forcedType, 
    fromDate: '', 
    toDate: '', 
    reason: '' 
  });
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 🚨 LIFECYCLE PATCH: Dynamically syncs form type when switching between Leave and OD tabs
  useEffect(() => {
    setFormData((prev) => ({ ...prev, type: forcedType }));
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
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setProfile({
            name: data.name,
            registerNo: data.registerNo || 'Not Provided',
            studentType: data.studentType || 'Regular Track',
            mentor: data.mentorName || 'Not Assigned', 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData) // Sends unified fields along with the auto-selected type property
      });

      const resData = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${formData.type} request logged successfully! Routing status initialized to Pending.` 
        });
        // Reset interactive inputs while keeping the current page context type intact
        setFormData({ type: forcedType, fromDate: '', toDate: '', reason: '' });
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
          Your application will automatically be classified under institutional <span className="font-bold underline text-blue-600">{formData.type}</span> tracking.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verified Student Details</h3>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Mentor</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><UserCheck size={15} className="text-slate-400" /> {profile.mentor}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold mt-1"><Phone size={15} className="text-slate-400" /> {profile.mobile}</div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Application Window Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Start Date *" type="date" icon={Calendar} value={formData.fromDate} onChange={(e) => setFormData({...formData, fromDate: e.target.value})} required />
              <InputField label="End Date *" type="date" icon={Calendar} value={formData.toDate} onChange={(e) => setFormData({...formData, toDate: e.target.value})} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-0.5">Reason for Absence *</label>
            <div className="relative">
              <FileText className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <textarea required rows={4} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder={`Please declare a clear justification supporting your ${formData.type} request...`} className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase tracking-wide">Approval Workflow Statuses:</p>
              <p className="leading-relaxed font-medium">Submission ➔ <span className="underline font-semibold">Pending</span>. Mentor Review ➔ <span className="underline font-semibold">Partially Approved</span>. HOD Decision ➔ <span className="underline font-semibold">Approved</span>.</p>
            </div>
          </div>

          <Button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
            <span>{submitting ? "Processing Registry Write..." : `Submit ${formData.type} Application`}</span>
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ApplyLeave;