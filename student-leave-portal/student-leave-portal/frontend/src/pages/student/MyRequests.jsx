import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, FileText, Briefcase, RefreshCw, Upload, Clock, School, User, Eye, Download, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);
  const [activeOdId, setActiveOdId] = useState(null);
  const [activeRegisterNo, setActiveRegisterNo] = useState('');
  const [activeReason, setActiveReason] = useState('');
  const navigate = useNavigate();

  // ----- Certificate Modal State (View) -----
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // ----- Pre‑Upload Guide Modal State -----
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [uploadTarget, setUploadTarget] = useState({ odId: null, registerNo: '', reason: '' });

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

  // ----- Certificate Modal Handlers (View) -----
  const openCertificateModal = (base64Data) => {
    if (!base64Data) return;
    setCertificateData(base64Data);
    setShowCertificateModal(true);
  };

  const closeCertificateModal = () => {
    setShowCertificateModal(false);
    setCertificateData(null);
  };

  const downloadCertificate = () => {
    if (!certificateData) return;
    const link = document.createElement('a');
    link.href = certificateData;
    link.download = `OD_Certificate_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- Upload Handlers with Guidance Modal -----
  const openUploadGuide = (odId, registerNo, reason) => {
    setUploadTarget({ odId, registerNo, reason });
    setShowUploadGuide(true);
  };

  const closeUploadGuide = () => {
    setShowUploadGuide(false);
    setUploadTarget({ odId: null, registerNo: '', reason: '' });
  };

  const handleContinueUpload = () => {
    setShowUploadGuide(false);
    setActiveOdId(uploadTarget.odId);
    setActiveRegisterNo(uploadTarget.registerNo || 'student');
    setActiveReason(uploadTarget.reason || 'event');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeOdId) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Unsupported file format. Please upload an image (PNG, JPEG, WebP).');
      e.target.value = null;
      return;
    }

    // Validate size
    if (file.size > 300 * 1024) {
      setErrorMsg('Image size exceeds 300 KB limit. Please compress your image.');
      e.target.value = null;
      return;
    }

    // Rename file: registerNo_EventName.ext
    const ext = file.name.split('.').pop();
    const newFileName = `${activeRegisterNo}_${activeReason.replace(/\s+/g, '_')}.${ext}`;
    const renamedFile = new File([file], newFileName, { type: file.type });

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('certificate', renamedFile);

    try {
      setUploadingId(activeOdId);
      setErrorMsg('');

      const response = await fetch(`https://leave-od-approval.onrender.com/api/od/upload-proof/${activeOdId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const resData = await response.json();

      if (response.ok) {
        setRequests(prev =>
          prev.map(req =>
            req._id === activeOdId
              ? { ...req, certificate: resData.data?.certificate || resData.certificate || renamedFile }
              : req
          )
        );
        alert("Proof document attached successfully!");
      } else {
        setErrorMsg(resData.message || 'File upload execution rejected by server.');
      }
    } catch (err) {
      console.error("Upload handler infrastructure collapse:", err);
      setErrorMsg('Failed to broadcast structural multipart form attachment upstream.');
    } finally {
      setUploadingId(null);
      setActiveOdId(null);
      setActiveRegisterNo('');
      setActiveReason('');
      e.target.value = null;
    }
  };

  const leaveRequests = requests.filter(r => r.mappedType === 'Leave');
  const odRequests = requests.filter(r => r.mappedType === 'On-Duty');

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-mono tracking-widest uppercase text-gray-600 text-center">Loading your <span className="font-bold text-indigo-600">Requests</span>…</p>
      </div>
    );
  }

  const renderTable = (dataList, sectionTitle, IconComponent, isOD = false) => {
    if (dataList.length === 0) {
      return (
        <div className="border border-gray-300 rounded-2xl p-6 md:p-8 text-center flex flex-col items-center justify-center shadow-sm bg-white">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-2 border border-gray-200 bg-gray-50 text-gray-400">
            <IconComponent size={16} />
          </div>
          <p className="text-xs font-bold text-gray-700">
            No {sectionTitle} logs on file
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* MOBILE CARDS */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {dataList.map((row) => {
            const studentRegNo = row.student?.registerNo || 'N/A';
            const studentName = row.student ? `${row.student.name || `${row.student.firstName || ''} ${row.student.lastName || ''}`}`.trim() : 'N/A';
            const startDateStr = row.start || row.fromDate ? new Date(row.start || row.fromDate).toLocaleDateString() : 'N/A';
            const endDateStr = row.end || row.toDate ? new Date(row.end || row.toDate).toLocaleDateString() : 'N/A';
            const durationType = row.duration || 'Full Day';
            const sessionDetail = row.halfDaySession || '';
            const isApproved = row.status === 'Approved';
            const certificate = row.certificate || row.document;

            return (
              <div key={row._id} className="border border-gray-300 rounded-2xl p-4 shadow-sm space-y-3.5 relative overflow-hidden bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-black tracking-wider block text-blue-900">
                      {studentRegNo}
                    </span>
                    <span className="text-sm font-bold block text-gray-900">
                      {studentName}
                    </span>
                  </div>
                  <StatusBadge status={row.status || "Pending"} />
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl text-[11px] border border-gray-200 bg-gray-50/70">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-400">Duration Type</span>
                    <span className={`font-bold block mt-0.5 ${durationType === 'Half Day' ? 'text-amber-600' : 'text-gray-700'}`}>
                      {durationType}
                    </span>
                    {durationType === 'Half Day' && sessionDetail && (
                      <span className="text-[9px] font-medium flex items-center gap-0.5 mt-0.5 text-gray-400">
                        <Clock size={9} /> {sessionDetail === 'Morning Session' ? 'Morning (FN)' : 'Afternoon (AN)'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-400">
                      {isOD ? 'OD Date' : 'Timeline Duration'}
                    </span>
                    <span className="font-semibold font-mono block mt-0.5 text-gray-700">
                      {isOD && durationType === 'Half Day' ? startDateStr : (isOD ? `${startDateStr}` : `${startDateStr} - ${endDateStr}`)}
                    </span>
                  </div>
                </div>

                {isOD && row.collegeName && (
                  <div className="text-[11px] space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-400">Hosting Venue</span>
                    <div className="flex items-start gap-1 font-medium text-gray-700">
                      <School size={12} className="shrink-0 mt-0.5 text-amber-500" />
                      <span>{row.collegeName} <span className="text-gray-400">({row.collegeLocation || 'N/A'})</span></span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-400">Reason Statement</span>
                  <p className="leading-relaxed font-medium break-words text-gray-600">
                    {row.reason}
                  </p>
                </div>

                {isOD && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-end">
                    {certificate ? (
                      <button
                        type="button"
                        onClick={() => openCertificateModal(certificate)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                      >
                        <Eye size={12} />
                        <span>View Certificate</span>
                      </button>
                    ) : isApproved ? (
                      <button
                        type="button"
                        disabled={uploadingId !== null}
                        onClick={() => openUploadGuide(row._id, studentRegNo, row.reason)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                      >
                        {uploadingId === row._id ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>{uploadingId === row._id ? 'Uploading...' : 'Upload Proof Certificate'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center block w-full py-1.5 rounded-lg text-gray-400 bg-gray-50 border border-gray-200">
                        Upload Locked
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block border border-gray-300 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-200">
              <thead className="text-[10px] uppercase font-bold tracking-widest border-b border-gray-200 bg-gray-50 text-gray-500">
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
              <tbody className="divide-y divide-gray-200">
                {dataList.map((row) => {
                  const studentRegNo = row.student?.registerNo || 'N/A';
                  const studentName = row.student ? `${row.student.name || `${row.student.firstName || ''} ${row.student.lastName || ''}`}`.trim() : 'N/A';
                  const startDateStr = row.start || row.fromDate ? new Date(row.start || row.fromDate).toLocaleDateString() : 'N/A';
                  const endDateStr = row.end || row.toDate ? new Date(row.end || row.toDate).toLocaleDateString() : 'N/A';
                  const durationType = row.duration || 'Full Day';
                  const sessionDetail = row.halfDaySession || '';
                  const isApproved = row.status === 'Approved';
                  const certificate = row.certificate || row.document;

                  return (
                    <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-900">
                        {studentRegNo}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {studentName}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-bold ${durationType === 'Half Day' ? 'text-amber-600' : 'text-gray-700'}`}>
                            {durationType}
                          </span>
                          {durationType === 'Half Day' && sessionDetail && (
                            <span className="text-[10px] font-medium flex items-center gap-1 text-gray-400">
                              <Clock size={10} className="shrink-0" />
                              {sessionDetail === 'Morning Session' ? 'Morning (FN)' : 'Afternoon (AN)'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-gray-600">
                        {startDateStr}
                      </td>
                      {!isOD && <td className="p-4 font-mono text-gray-600">{endDateStr}</td>}
                      <td className="p-4 max-w-xs truncate text-gray-500" title={row.reason}>
                        {row.reason}
                      </td>
                      {isOD && (
                        <td className="p-4 font-semibold max-w-xs truncate text-gray-700" title={`${row.collegeName || ''}, ${row.collegeLocation || ''}`}>
                          {row.collegeName ? `${row.collegeName} (${row.collegeLocation || 'N/A'})` : 'N/A'}
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <StatusBadge status={row.status || "Pending"} />
                      </td>
                      {isOD && (
                        <td className="p-4 pr-6 text-right whitespace-nowrap">
                          {certificate ? (
                            <button
                              type="button"
                              onClick={() => openCertificateModal(certificate)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          ) : isApproved ? (
                            <button
                              type="button"
                              disabled={uploadingId !== null}
                              onClick={() => openUploadGuide(row._id, studentRegNo, row.reason)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                            >
                              {uploadingId === row._id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Upload size={12} />
                              )}
                              <span>{uploadingId === row._id ? 'Processing...' : 'Upload Proof'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider select-none px-2.5 py-1 rounded-lg text-gray-400 bg-gray-50 border border-gray-200">
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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 p-1 sm:p-3 md:p-6 max-w-7xl mx-auto antialiased bg-[#F8FAFC] text-gray-900"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-blue-900 flex items-center gap-2">
              <span className="text-amber-500">✦</span> Leave & OD Request Logs
            </h2>
            <p className="text-xs font-medium text-gray-500">
              Keep track of your Leave and On-Duty applications and their approval status.
            </p>
          </div>
          <button
            onClick={fetchAllStudentLogs}
            className="inline-flex items-center justify-center gap-1.5 self-stretch sm:self-center text-xs font-bold px-4 py-2 sm:py-1.5 rounded-xl transition-all shadow-sm active:scale-[0.98] text-gray-600 hover:text-blue-900 bg-white hover:bg-gray-50 border border-gray-300"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm bg-rose-50 border border-rose-200 text-rose-800">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Leave Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <FileText size={16} className="text-blue-900" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800">
              Leave Application History
            </h3>
          </div>
          {renderTable(leaveRequests, "Leave Application", FileText, false)}
        </div>

        {/* OD Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Briefcase size={16} className="text-amber-500" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800">
              On-Duty (OD) Application History
            </h3>
          </div>
          {renderTable(odRequests, "On-Duty (OD)", Briefcase, true)}
        </div>
      </motion.div>

      {/* ----- CERTIFICATE VIEW MODAL ----- */}
      <AnimatePresence>
        {showCertificateModal && certificateData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
            onClick={closeCertificateModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Eye size={18} className="text-amber-500" />
                  Certificate
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadCertificate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={closeCertificateModal}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[200px]">
                <img
                  src={certificateData}
                  alt="OD Certificate"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                />
              </div>
              <div className="p-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Certificate for On-Duty request.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----- PRE-UPLOAD GUIDANCE MODAL ----- */}
      <AnimatePresence>
        {showUploadGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={closeUploadGuide}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 shrink-0">
                  <Info size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Certificate Upload Guide</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Please ensure your certificate meets these requirements:</p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>File size:</strong> Maximum 300 KB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>File type:</strong> Image only (PNG, JPEG, WebP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Naming format:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-800 font-mono">RegisterNo_EventName</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Example:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-800 font-mono">73152213001_Hackathon.jpg</code></span>
                </li>
              </ul>

              <div className="flex gap-3">
                <button
                  onClick={closeUploadGuide}
                  className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueUpload}
                  className="flex-1 px-4 py-2 text-xs font-bold bg-blue-900 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MyRequests;