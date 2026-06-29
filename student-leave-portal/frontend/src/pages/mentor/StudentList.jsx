import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Users, User, ShieldCheck, Phone, Hash, Calendar, X, Eye, User2 } from 'lucide-react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State variables handling profile inspection overlay state drawer
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
        // Query the mentor endpoint loop targeting mapped student entries
        const response = await fetch('https://leave-od-approval.onrender.com/api/mentor/my-students', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          // Extracts the array safely whether it is wrapped in an envelope object or deep inside data.students
          const extractedStudents = data.data || data.students || (Array.isArray(data) ? data : []);
          setStudents(extractedStudents);
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

    const fetchAssignedStudents1 = fetchAssignedStudents;
    fetchAssignedStudents1();
  }, []);

  const openProfileDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  // ✨ HELPER: Opens raw Base64 data URI text formats safely in an isolated browser layout context tab
  const handleViewDocument = (base64Data) => {
    if (!base64Data) return;
    
    const newTab = window.open();
    if (newTab) {
      newTab.document.body.style.margin = '0';
      newTab.document.body.style.display = 'flex';
      newTab.document.body.style.justifyContent = 'center';
      newTab.document.body.style.alignItems = 'center';
      newTab.document.body.style.backgroundColor = '#0f172a'; // Dark theme slate-900 background
      
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
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400 px-4">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={30} />
        <p className="text-xs font-mono tracking-widest uppercase text-center">Compiling Allocated Student Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-1 sm:p-4 md:p-6 max-w-7xl mx-auto text-slate-800 antialiased">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="text-blue-600 shrink-0" size={24} />
          Student List 
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-xs sm:text-sm font-semibold text-slate-500">
          No students are assigned to your mentor profile reference ID yet.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* =========================================================================
              1. RESPONSIVE MOBILE VIEW: Grid of dynamic info cards (`block md:hidden`)
             ========================================================================= */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {students.map((st, index) => {
              const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';
              const leaveDays = st.leaveCount ?? st.totalLeavesCount ?? st.approvedLeaves ?? st.leavesApproved ?? 0;
              const odDays = st.odCount ?? st.totalODCount ?? st.totalODDays ?? st.approvedOD ?? st.odApproved ?? 0;

              return (
                <div key={st._id || index} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4 relative">
                  {/* Top Block meta indices info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-mono text-[10px] font-black text-slate-400 shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-black text-blue-600 tracking-wider block">{st.registerNo || st.register || 'N/A'}</span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{fullName}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Operational Analytics Metrics badges sub-layout row */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-1">
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                      <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Leave Count</span>
                      <span className="text-xs font-black text-amber-700 block mt-0.5">{leaveDays} {leaveDays === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-200/50 rounded-xl">
                      <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">OD Count</span>
                      <span className="text-xs font-black text-indigo-700 block mt-0.5">{odDays} {odDays === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  {/* Trigger call module row */}
                  <button
                    onClick={() => openProfileDrawer(st)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs bg-slate-900 active:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View Student Profile</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* =========================================================================
              2. DESKTOP / TABLET VIEW: Wide structural data matrix table (`hidden md:block`)
             ========================================================================= */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
                  <tr>
                    <th className="p-4 pl-6 text-center w-12">S.No</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Leave Count</th>
                    <th className="p-4">OD Count</th>
                    <th className="p-4 pr-6 text-right">Student Details</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 divide-y divide-slate-100 font-medium">
                  {students.map((st, index) => {
                    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';
                    const leaveDays = st.leaveCount ?? st.totalLeavesCount ?? st.approvedLeaves ?? st.leavesApproved ?? 0;
                    const odDays = st.odCount ?? st.totalODCount ?? st.totalODDays ?? st.approvedOD ?? st.odApproved ?? 0;

                    return (
                      <tr key={st._id || index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                        <td className="p-4 font-mono font-bold text-blue-600">{st.registerNo || st.register || 'N/A'}</td>
                        <td className="p-4 font-bold text-slate-900">{fullName}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg font-bold">
                            {leaveDays} {leaveDays === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-lg font-bold">
                            {odDays} {odDays === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => openProfileDrawer(st)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition-all shadow-xs group font-semibold cursor-pointer"
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

      {/* 🚀 ANIMATED SLIDE PROFILE DRAWER SYSTEM */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudent && (
          <>
            {/* Backdrop Mask shadow blur */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50"
            />

            {/* Dynamic Drawer Sheet panel layout */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 p-4 sm:p-6 flex flex-col space-y-5 sm:space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Student Profile</h3>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200/60 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Profile Details Container Grid Card elements */}
              <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 pr-0.5">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 sm:p-4 rounded-2xl">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold sm:text-lg shrink-0">
                    {(selectedStudent.firstName?.[0] || selectedStudent.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {`${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim() || selectedStudent.name || 'N/A'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 font-mono font-medium truncate">{selectedStudent.email || 'No email saved'}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Database Registry Keypairs</h5>
                  
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0"><Hash size={14} /> Register Number</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[180px] text-right">{selectedStudent.registerNo || selectedStudent.register || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0"><ShieldCheck size={14} /> Student Type</span>
                    <span className="font-bold text-slate-800 truncate text-right">{selectedStudent.studentType || 'Regular Track'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0"><Phone size={14} /> Mobile Number</span>
                    <span className="font-mono font-bold text-slate-800 truncate text-right">{selectedStudent.mobileNo || selectedStudent.mobile || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0"><User size={14} /> Class Advisor 1</span>
                    <span className="font-semibold text-slate-700 truncate text-right">{selectedStudent.firstmentorName || 'Assigned to Self'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium shrink-0"><User2 size={14} /> Class Advisor 2</span>
                    <span className="font-semibold text-slate-700 truncate text-right">{selectedStudent.secondmentorName || 'Assigned to Self'}</span>
                  </div>

                  {/* ⚡ ATTACHED PROOF INSPECTION GRID BLOCK NODE */}
                  {selectedStudent.document && (
                    <div className="bg-white border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-4 text-xs shadow-xs">
                      <span className="text-indigo-600 font-bold flex items-center gap-1.5 shrink-0">
                        <Eye size={14} /> Uploaded OD Proof
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewDocument(selectedStudent.document)}
                        className="text-[11px] font-black tracking-tight bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        View Certificate
                      </button>
                    </div>
                  )}
                </div>

                {/* Aggregation metrics logs preview summary banner */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Leave & OD Analytics Summary</h5>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xl sm:text-2xl font-black text-amber-400">
                        {selectedStudent.leaveCount ?? selectedStudent.totalLeavesCount ?? selectedStudent.approvedLeaves ?? 0}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Leave Days</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xl sm:text-2xl font-black text-indigo-400">
                        {selectedStudent.odCount ?? selectedStudent.totalODCount ?? selectedStudent.totalODDays ?? selectedStudent.approvedOD ?? 0}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">OD Approvals</p>
                    </div>
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