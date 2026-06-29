import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, FileText, Briefcase, RefreshCw, Upload, Clock, School, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

const MyRequests = () => {
  const { darkMode } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingId, setUploadingId] = useState(null); // Track loader for row being uploaded
  const fileInputRef = useRef(null);
  const [activeOdId, setActiveOdId] = useState(null);
  const navigate = useNavigate();

  const fetchAllStudentLogs = async () => {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'undefined' || token === 'null') {
      setErrorMsg('Authentication token missing. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const [leavesResponse, odResponse] = await Promise.all([
        fetch('https://leave-od-approval.onrender.com/api/leaves/my-leaves', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://leave-od-approval.onrender.com/api/od/student-history', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const leavesData = await leavesResponse.json();
      const odData = await odResponse.json();

      let combinedRecords = [];

      if (leavesResponse.ok) {
        const leavesList = leavesData.data || (Array.isArray(leavesData) ? leavesData : []);
        const formattedLeaves = leavesList.map(item => ({ ...item, mappedType: 'Leave' }));
        combinedRecords = [...combinedRecords, ...formattedLeaves];
      }

      if (odResponse.ok) {
        const odList = odData.data || (Array.isArray(odData) ? odData : []);
        const formattedODs = odList.map(item => ({ ...item, mappedType: 'On-Duty' }));
        combinedRecords = [...combinedRecords, ...formattedODs];
      }

      combinedRecords.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setRequests(combinedRecords);

      if (!leavesResponse.ok && !odResponse.ok) {
        setErrorMsg('Failed to fetch your request.');
      }
    } catch (err) {
      console.error("Database Extraction Loop Exception:", err);
      setErrorMsg('Network connection architecture failed to establish data transmission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudentLogs();
  }, []);

  // Trigger file browser for specific OD item
  const handleUploadClick = (odId) => {
    setActiveOdId(odId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Perform backend PATCH upload task
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeOdId) return;

    // Optional early validation check matching backend size restrictions
    if (file.size > 300 * 1024) {
      alert("Image size is higher than the 300 KB backend limit.");
      e.target.value = null; // reset
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document', file); // Must match backend expects single('document')

    try {
      setUploadingId(activeOdId);
      setErrorMsg('');

      const response = await fetch(`https://leave-od-approval.onrender.com/api/od/upload-proof/${activeOdId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
          // CRITICAL: Do NOT set Content-Type header manually here; let browser fill boundary metrics
        },
        body: formData
      });

      const resData = await response.json();

      if (response.ok) {
        alert("Proof document attached successfully!");
        fetchAllStudentLogs(); // Refresh view state registers
      } else {
        setErrorMsg(resData.message || 'File upload execution rejected by server.');
      }
    } catch (err) {
      console.error("Upload handler infrastructure collapse:", err);
      setErrorMsg('Failed to broadcast structural multipart form attachment upstream.');
    } finally {
      setUploadingId(null);
      setActiveOdId(null);
      e.target.value = null; // Clear input selector memory
    }
  };

  const leaveRequests = requests.filter(r => r.mappedType === 'Leave');
  const odRequests = requests.filter(r => r.mappedType === 'On-Duty');

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] px-4 text-slate-400`}>
        <Loader2 className={`animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`} size={28} />
        <p className="text-xs font-mono tracking-widest uppercase text-center">Loading your request...</p>
      </div>
    );
  }

  const renderTable = (dataList, sectionTitle, IconComponent, isOD = false) => {
    if (dataList.length === 0) {
      return (
        <div className={`border rounded-2xl p-6 md:p-8 text-center flex flex-col items-center justify-center shadow-xs transition-colors
          ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 border
            ${darkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-50 text-slate-400 border-slate-200/50'}`}
          >
            <IconComponent size={16} />
          </div>
          <p className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            No {sectionTitle} logs on file
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* hidden raw native engine field */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*"
          className="hidden" 
        />

        {/* 1. MOBILE LAYOUT */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {dataList.map((row) => {
            const studentRegNo = row.student?.registerNo || 'N/A';
            const studentName = row.student ? `${row.student.name || `${row.student.firstName || ''} ${row.student.lastName || ''}`}`.trim() : 'N/A';
            const startDateStr = row.start || row.fromDate ? new Date(row.start || row.fromDate).toLocaleDateString() : 'N/A';
            const endDateStr = row.end || row.toDate ? new Date(row.end || row.toDate).toLocaleDateString() : 'N/A';
            const durationType = row.duration || 'Full Day';
            const sessionDetail = row.halfDaySession || '';
            const isApproved = row.status === 'Approved';

            return (
              <div key={row._id} className={`border rounded-2xl p-4 shadow-2xs space-y-3.5 relative overflow-hidden transition-colors
                ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className={`text-[10px] font-mono font-black tracking-wider block ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {studentRegNo}
                    </span>
                    <span className={`text-sm font-bold block ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {studentName}
                    </span>
                  </div>
                  <StatusBadge status={row.status || "Pending"} />
                </div>

                <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl text-[11px] border transition-colors
                  ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50/70 border-slate-100'}`}
                >
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-400">Duration Type</span>
                    <span className={`font-bold block mt-0.5 ${durationType === 'Half Day' ? 'text-amber-600 dark:text-amber-400' : darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {durationType}
                    </span>
                    {durationType === 'Half Day' && sessionDetail && (
                      <span className="text-[9px] font-medium flex items-center gap-0.5 mt-0.5 text-slate-400">
                        <Clock size={9} /> {sessionDetail === 'Morning Session' ? 'Morning (FN)' : 'Afternoon (AN)'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-400">
                      {isOD ? 'OD Date' : 'Timeline Duration'}
                    </span>
                    <span className={`font-semibold font-mono block mt-0.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {isOD && durationType === 'Half Day' ? startDateStr : (isOD ? `${startDateStr}` : `${startDateStr} - ${endDateStr}`)}
                    </span>
                  </div>
                </div>

                {isOD && row.collegeName && (
                  <div className="text-[11px] space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-400">Hosting Venue</span>
                    <div className={`flex items-start gap-1 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      <School size={12} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>{row.collegeName} <span className="text-slate-400">({row.collegeLocation || 'N/A'})</span></span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-400">Reason Statement</span>
                  <p className={`leading-relaxed font-medium break-words ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {row.reason}
                  </p>
                </div>

                {isOD && (
                  <div className={`pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'} flex items-center justify-end`}>
                    {isApproved ? (
                      <button
                        type="button"
                        disabled={uploadingId !== null}
                        onClick={() => handleUploadClick(row._id)}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer
                          ${darkMode ? 'text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}
                      >
                        {uploadingId === row._id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>{uploadingId === row._id ? 'Uploading...' : 'Upload Proof Certificate'}</span>
                      </button>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-center block w-full py-1.5 rounded-lg opacity-60
                        ${darkMode ? 'text-slate-400 bg-slate-700 border-slate-600' : 'text-slate-400 bg-slate-50 border-slate-100'}`}
                      >
                        Upload Attached (Locked)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. DESKTOP LAYOUT */}
        <div className={`hidden md:block border rounded-2xl overflow-hidden shadow-xs transition-colors
          ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs divide-y transition-colors ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
              <thead className={`text-[10px] uppercase font-bold tracking-widest border-b transition-colors
                ${darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200/50'}`}
              >
                <tr>
                  <th className="p-4 pl-6">Reg No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Duration Type</th>
                  <th className="p-4">{isOD ? 'OD Date' : 'Start Date'}</th>
                  {!isOD && <th className="p-4">End Date</th>}
                  <th className="p-4">Reason</th>
                  {isOD && <th className="p-4">Venue & Location</th>}
                  <th className="p-4 text-center">Status</th>
                  {isOD && <th className="p-4 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {dataList.map((row) => {
                  const studentRegNo = row.student?.registerNo || 'N/A';
                  const studentName = row.student ? `${row.student.name || `${row.student.firstName || ''} ${row.student.lastName || ''}`}`.trim() : 'N/A';
                  const startDateStr = row.start || row.fromDate ? new Date(row.start || row.fromDate).toLocaleDateString() : 'N/A';
                  const endDateStr = row.end || row.toDate ? new Date(row.end || row.toDate).toLocaleDateString() : 'N/A';
                  const durationType = row.duration || 'Full Day';
                  const sessionDetail = row.halfDaySession || '';
                  const isApproved = row.status === 'Approved';

                  return (
                    <tr key={row._id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
                      <td className={`p-4 pl-6 font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {studentRegNo}
                      </td>
                      <td className={`p-4 font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {studentName}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-bold ${durationType === 'Half Day' ? 'text-amber-600 dark:text-amber-400' : darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {durationType}
                          </span>
                          {durationType === 'Half Day' && sessionDetail && (
                            <span className="text-[10px] font-medium flex items-center gap-1 text-slate-400">
                              <Clock size={10} className="shrink-0" />
                              {sessionDetail === 'Morning Session' ? 'Morning (FN)' : 'Afternoon (AN)'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`p-4 font-mono ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {startDateStr}
                      </td>
                      {!isOD && <td className={`p-4 font-mono ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{endDateStr}</td>}
                      <td className={`p-4 max-w-xs truncate ${darkMode ? 'text-slate-300' : 'text-slate-500'}`} title={row.reason}>
                        {row.reason}
                      </td>
                      {isOD && (
                        <td className={`p-4 font-semibold max-w-xs truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`} title={`${row.collegeName || ''}, ${row.collegeLocation || ''}`}>
                          {row.collegeName ? `${row.collegeName} (${row.collegeLocation || 'N/A'})` : 'N/A'}
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <StatusBadge status={row.status || "Pending"} />
                      </td>
                      {isOD && (
                        <td className="p-4 pr-6 text-right whitespace-nowrap">
                          {isApproved ? (
                            <button
                              type="button"
                              disabled={uploadingId !== null}
                              onClick={() => handleUploadClick(row._id)}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer
                                ${darkMode ? 'text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'}`}
                            >
                              {uploadingId === row._id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Upload size={12} />
                              )}
                              <span>{uploadingId === row._id ? 'Processing...' : 'Upload Proof'}</span>
                            </button>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wider select-none px-2.5 py-1 rounded-lg opacity-60
                              ${darkMode ? 'text-slate-400 bg-slate-700 border-slate-600' : 'text-slate-400 bg-slate-50 border-slate-100'}`}
                            >
                              Locked
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-8 p-1 sm:p-3 md:p-6 max-w-7xl mx-auto antialiased transition-colors
        ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}
    >
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 transition-colors
        ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}
      >
        <div className="space-y-1">
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Absence Audit Registry Logs
          </h2>
          <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Track and monitor your personal leave requests and technical on-duty institutional profiles.
          </p>
        </div>
        <button
          onClick={fetchAllStudentLogs}
          className={`inline-flex items-center justify-center gap-1.5 self-stretch sm:self-center text-xs font-bold px-4 py-2 sm:py-1.5 rounded-xl transition-all shadow-2xs active:scale-[0.98]
            ${darkMode ? 'text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border-slate-600' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <RefreshCw size={12} />
          <span>Sync Records</span>
        </button>
      </div>

      {errorMsg && (
        <div className={`p-4 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs
          ${darkMode ? 'bg-rose-900/30 border border-rose-800 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: LEAVES */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <FileText size={16} className="text-blue-600 dark:text-blue-400" />
          <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            Leave Allocation History
          </h3>
        </div>
        {renderTable(leaveRequests, "Leave Application", FileText, false)}
      </div>

      {/* SECTION 2: OD */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Briefcase size={16} className="text-amber-600 dark:text-amber-400" />
          <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            On-Duty (OD) Verification History
          </h3>
        </div>
        {renderTable(odRequests, "On-Duty (OD)", Briefcase, true)}
      </div>
    </motion.div>
  );
};

export default MyRequests;