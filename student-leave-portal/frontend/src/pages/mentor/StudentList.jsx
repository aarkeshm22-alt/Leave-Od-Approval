import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Users, User, ShieldCheck, Phone, Hash, Calendar, X, Eye, User2, Clock } from 'lucide-react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMsg('Authentication trace missing. Log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://leave-od-approval.onrender.com/api/mentor/my-students', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          const extractedStudents = data.data || data.students || (Array.isArray(data) ? data : []);
          setStudents(extractedStudents);
          // Debug: log to see if leaves/ods exist
          if (extractedStudents.length > 0) {
            console.log('Sample student with leaves/ods:', extractedStudents[0]);
          }
        } else {
          setErrorMsg(data.message || 'Failed to sync with structural student database.');
        }
      } catch (err) {
        console.error("Mentor Registry Sync Exception:", err);
        setErrorMsg('Network error failing server handshakes.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedStudents();
  }, []);

  const openProfileDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const handleViewDocument = (base64Data) => {
    if (!base64Data) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.body.style.margin = '0';
      newTab.document.body.style.display = 'flex';
      newTab.document.body.style.justifyContent = 'center';
      newTab.document.body.style.alignItems = 'center';
      newTab.document.body.style.backgroundColor = '#1e293b';
      const img = newTab.document.createElement('img');
      img.src = base64Data;
      img.style.maxWidth = '95%';
      img.style.maxHeight = '95vh';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      newTab.document.body.appendChild(img);
      newTab.document.title = "Student Uploaded Certificate Proof";
    } else {
      alert("Pop-up blocked! Please allow pop-ups for this domain to inspect document attachments.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-gray-500 px-4">
        <Loader2 className="animate-spin text-amber-500 mb-3" size={30} />
        <p className="text-xs font-mono tracking-widest uppercase text-gray-600 text-center">Compiling Allocated Student Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-1 sm:p-4 md:p-6 max-w-7xl mx-auto text-gray-800 antialiased">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight flex items-center gap-2">
          <Users className="text-amber-500 shrink-0" size={24} />
          Student List
        </h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Real-time tracking profiles, verification tallies, and active registration arrays under your immediate custody.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {students.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-8 sm:p-12 text-center text-xs sm:text-sm font-semibold text-gray-500">
          No students are assigned to your mentor profile reference ID yet.
        </div>
      ) : (
        <div className="space-y-4">

          {/* ===== MOBILE CARDS (block md:hidden) ===== */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {students.map((st, index) => {
              const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';
              const leaveDays = st.leaveCount ?? st.totalLeavesCount ?? st.approvedLeaves ?? st.leavesApproved ?? 0;
              const odDays = st.odCount ?? st.totalODCount ?? st.totalODDays ?? st.approvedOD ?? st.odApproved ?? 0;

              return (
                <div key={st._id || index} className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center font-mono text-[10px] font-black text-gray-400 shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-black text-blue-900 tracking-wider block">{st.registerNo || st.register || 'N/A'}</span>
                        <h4 className="text-sm font-bold text-gray-900 truncate">{fullName}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                      <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Leave Count</span>
                      <span className="text-xs font-black text-amber-700 block mt-0.5">{leaveDays} {leaveDays === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="p-2.5 bg-blue-50/50 border border-blue-200/50 rounded-xl">
                      <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider block">OD Count</span>
                      <span className="text-xs font-black text-blue-700 block mt-0.5">{odDays} {odDays === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openProfileDrawer(st)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs bg-blue-900 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View Student Profile</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ===== DESKTOP / TABLET TABLE (hidden md:block) ===== */}
          <div className="hidden md:block bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest border-b border-gray-200">
                  <tr>
                    <th className="p-4 pl-6 text-center w-12">S.No</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Leave Count</th>
                    <th className="p-4">OD Count</th>
                    <th className="p-4 pr-6 text-right">Student Details</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 divide-y divide-gray-200 font-medium">
                  {students.map((st, index) => {
                    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';
                    const leaveDays = st.leaveCount ?? st.totalLeavesCount ?? st.approvedLeaves ?? st.leavesApproved ?? 0;
                    const odDays = st.odCount ?? st.totalODCount ?? st.totalODDays ?? st.approvedOD ?? st.odApproved ?? 0;

                    return (
                      <tr key={st._id || index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                        <td className="p-4 font-mono font-bold text-blue-900">{st.registerNo || st.register || 'N/A'}</td>
                        <td className="p-4 font-bold text-gray-900">{fullName}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg font-bold">
                            {leaveDays} {leaveDays === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg font-bold">
                            {odDays} {odDays === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => openProfileDrawer(st)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-900 hover:bg-amber-500 text-white rounded-xl transition-all shadow-sm group font-semibold cursor-pointer"
                          >
                            <Eye size={13} className="transition-transform group-hover:scale-110" />
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===== PROFILE DRAWER (Animated slide-in) ===== */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-blue-900/20 backdrop-blur-xs z-50"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white border-l border-gray-300 shadow-2xl z-50 p-4 sm:p-6 flex flex-col space-y-5 sm:space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-blue-900">Student Profile</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-blue-900 border border-gray-200 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 pr-0.5">
                {/* Student avatar & name */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-2xl">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-900 rounded-xl flex items-center justify-center text-white font-bold sm:text-lg shrink-0">
                    {(selectedStudent.firstName?.[0] || selectedStudent.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-blue-900 truncate">
                      {`${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim() || selectedStudent.name || 'N/A'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-mono font-medium truncate">{selectedStudent.email || 'No email saved'}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Database Registry Keypairs</h5>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><Hash size={14} /> Register Number</span>
                    <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[180px] text-right">{selectedStudent.registerNo || selectedStudent.register || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><ShieldCheck size={14} /> Student Type</span>
                    <span className="font-bold text-gray-800 truncate text-right">{selectedStudent.studentType || 'Regular Track'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><Phone size={14} /> Mobile Number</span>
                    <span className="font-mono font-bold text-gray-800 truncate text-right">{selectedStudent.mobileNo || selectedStudent.mobile || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><User size={14} /> Class Advisor 1</span>
                    <span className="font-semibold text-gray-700 truncate text-right">{selectedStudent.firstmentorName || 'Assigned to Self'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><User2 size={14} /> Class Advisor 2</span>
                    <span className="font-semibold text-gray-700 truncate text-right">{selectedStudent.secondmentorName || 'Assigned to Self'}</span>
                  </div>

                  {/* Document proof */}
                  {selectedStudent.certificate && (
                    <div className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs shadow-sm">
                      <span className="text-amber-600 font-bold flex items-center gap-1.5 shrink-0">
                        <Eye size={14} /> Uploaded OD Proof
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewDocument(selectedStudent.certificate)}
                        className="text-[11px] font-black tracking-tight bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        View Certificate
                      </button>
                    </div>
                  )}
                </div>

                {/* Analytics summary – Navy card with amber accents */}
                <div className="p-4 bg-blue-900 text-white rounded-2xl space-y-3 shadow-md">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1"><Calendar size={12} /> Leave & OD Analytics Summary</h5>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xl sm:text-2xl font-black text-amber-400">
                        {selectedStudent.leaveCount ?? selectedStudent.totalLeavesCount ?? selectedStudent.approvedLeaves ?? 0}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase mt-0.5 tracking-wider">Leave Days</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xl sm:text-2xl font-black text-amber-400">
                        {selectedStudent.odCount ?? selectedStudent.totalODCount ?? selectedStudent.totalODDays ?? selectedStudent.approvedOD ?? 0}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase mt-0.5 tracking-wider">OD Approvals</p>
                    </div>
                  </div>
                </div>

                {/* ===== RECENT APPLICATIONS SECTION ===== */}
                <div className="space-y-2">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> Recent Applications
                  </h5>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    {/* Check if there are any leaves or ODs */}
                    {(!selectedStudent.leaves || selectedStudent.leaves.length === 0) &&
                     (!selectedStudent.ods || selectedStudent.ods.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No recent applications found.</p>
                    )}

                    {/* Map through Leave requests */}
                    {selectedStudent.leaves?.map((item, idx) => (
                      <div key={`leave-${idx}`} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-blue-900 shrink-0">Leave</span>
                          <span className="text-gray-500 truncate">
                            {item.fromDate ? new Date(item.fromDate).toLocaleDateString() : 'N/A'}
                            {item.toDate && ` - ${new Date(item.toDate).toLocaleDateString()}`}
                            {item.duration === 'Half Day' && item.halfDaySession && ` (${item.halfDaySession})`}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}

                    {/* Map through On-Duty requests */}
                    {selectedStudent.ods?.map((item, idx) => (
                      <div key={`od-${idx}`} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-amber-600 shrink-0">On-Duty</span>
                          <span className="text-gray-500 truncate">
                            {item.fromDate ? new Date(item.fromDate).toLocaleDateString() : 'N/A'}
                            {item.toDate && ` - ${new Date(item.toDate).toLocaleDateString()}`}
                            {item.duration === 'Half Day' && item.halfDaySession && ` (${item.halfDaySession})`}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentList;