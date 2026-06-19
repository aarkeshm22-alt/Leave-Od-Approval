import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Users, User, ShieldCheck, Phone, Mail, Hash, Calendar, X, Eye } from 'lucide-react';

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
        const response = await fetch('/api/mentor/my-students', {
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

    fetchAssignedStudents();
  }, []);

  const openProfileDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={30} />
        <p className="text-xs font-mono tracking-widest uppercase">Compiling Allocated Student Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-2 text-slate-800">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="text-blue-600" size={24} />
          Supervised Student Inventory
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm font-semibold text-slate-500">
          No students are assigned to your mentor profile reference ID yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
                <tr>
                  <th className="p-4 pl-6 text-center w-12">S.No</th>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Leave Tally</th>
                  <th className="p-4">OD Tally</th>
                  <th className="p-4 pr-6 text-right">Student Details</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100 font-medium">
                {students.map((st, index) => {
                  const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';
                  
                  // 🔥 ADVANCED FALLBACKS: Resolves discrepancies across different document population maps
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition-all shadow-xs group font-semibold"
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
      )}

      {/* 🚀 ANIMATED SLIDE PROFILE DRAWER EFFECT */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 p-6 flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Comprehensive Inspection</h3>
                  <p className="text-xs text-slate-400">Core structural attributes mapped to DB schemas.</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200/60 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Profile Details Container Grid Card elements */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg">
                    {(selectedStudent.firstName?.[0] || selectedStudent.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {`${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim() || selectedStudent.name || 'N/A'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono font-medium">{selectedStudent.email || 'No email saved'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Database Registry Keypairs</h5>
                  
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><Hash size={14} /> Registration Identifier</span>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedStudent.registerNo || selectedStudent.register || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><ShieldCheck size={14} /> Attendance Variant</span>
                    <span className="text-xs font-bold text-slate-800">{selectedStudent.studentType || 'Regular Track'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><Phone size={14} /> Direct Mobile Vector</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedStudent.mobileNo || selectedStudent.mobile || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"><User size={14} /> Assigned Mentor Block</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedStudent.mentorName || 'Assigned to Self'}</span>
                  </div>
                </div>

                {/* Aggregation metrics logs preview */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Global Registry Allocation Analytics</h5>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-2xl font-black text-amber-400">
                        {selectedStudent.leaveCount ?? selectedStudent.totalLeavesCount ?? selectedStudent.approvedLeaves ?? 0}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Leave Days</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-2xl font-black text-indigo-400">
                        {selectedStudent.odCount ?? selectedStudent.totalODCount ?? selectedStudent.totalODDays ?? selectedStudent.approvedOD ?? 0}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">OD Approvals</p>
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