import React, { useState, useEffect } from 'react';
import { GraduationCap, UserCheck, X, Loader, Mail, Phone, Calendar, Grid, Layers, FileText, Eye, Search, User, User2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState('ALL');
  const [activeSection, setActiveSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Certificate Modal States
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const cleanToken = token ? token.replace(/"/g, '').trim() : '';

        const response = await axios.get('https://leave-od-approval.onrender.com/api/users/students-by-mentor', {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        });

        const receivedStudents = response.data.data || [];
        console.log('✅ Loaded students:', receivedStudents.length);
        setStudents(receivedStudents);
      } catch (error) {
        console.error('Failed fetching student registry:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStudents();
  }, []);

  // Helper functions for filtering
  const normalizeSection = (sectionValue) => {
    if (!sectionValue) return 'UNKNOWN';
    return sectionValue.toString().trim().toUpperCase().replace('SECTION', '').trim();
  };

  const normalizeYear = (yearValue) => {
    if (!yearValue) return 'UNKNOWN';
    return yearValue.toString().trim().toUpperCase().replace('YEAR', '').trim();
  };

  // ===== IMPROVED CERTIFICATE HELPERS =====
  const getStudentCertificate = (st) => {
    // Try multiple possible field names
    const cert = st.certificate || st.document || st.student?.certificate || st.student?.document || null;
    if (typeof cert === 'string') {
      const trimmed = cert.trim();
      if (trimmed.length === 0) return null;
      // Check if it's a valid base64 image or at least a reasonable string
      if (trimmed.startsWith('data:image/') || trimmed.length > 100) {
        return trimmed;
      }
      return null;
    }
    return null;
  };

  const hasCertificate = (st) => {
    return !!getStudentCertificate(st);
  };

  // Certificate Modal Handlers
  const openCertificateModal = (student) => {
    if (!student) return;
    const cert = getStudentCertificate(student);
    if (!cert) return;
    setCertificateData(cert);
    setCertificateModalOpen(true);
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

  const closeCertificateModal = () => {
    setCertificateModalOpen(false);
    setCertificateData(null);
  };

  // Dynamic filter options
  const dynamicYearsArray = ['ALL', ...new Set(
    students.map(s => normalizeYear(s.year || s.yr)).filter(Boolean).sort()
  )];

  const dynamicSectionsArray = ['ALL', ...new Set(
    students.map(s => normalizeSection(s.section || s.sec)).filter(Boolean).sort()
  )];

  // Filtered students
  const filteredStudentsMatrix = students.filter(student => {
    const studentYear = normalizeYear(student.year || student.yr);
    const studentSection = normalizeSection(student.section || student.sec);
    const matchesYear = activeYear === 'ALL' || studentYear === activeYear;
    const matchesSection = activeSection === 'ALL' || studentSection === activeSection;

    const studentName = (student.name || `${student.firstName || ''} ${student.lastName || ''}`).toLowerCase();
    const regNo = (student.registerNo || student.id || '').toLowerCase();
    const cleanQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = studentName.includes(cleanQuery) || regNo.includes(cleanQuery);

    return matchesYear && matchesSection && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] sm:min-h-[700px] md:min-h-[650px] text-gray-400 font-sans px-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-black tracking-widest uppercase text-gray-500 animate-pulse text-center">
            Fetching the <span className='text-amber-600'>Student</span> Details
          </p>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-gray-500 animate-pulse">
            <span>from Database...</span>
            <Loader className="animate-spin" size={18} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-sans pb-12 selection:bg-amber-100 relative px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 md:pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight">All Registered Student Details</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Filter student information across institutional configurations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or reg number..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-amber-500 focus:outline-none text-xs rounded-xl shadow-2xs font-medium text-slate-800 transition-colors focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2 shrink-0">
            <GraduationCap size={15} className="text-amber-600" />
            <span className="text-xs font-bold text-indigo-900">{filteredStudentsMatrix.length} Displayed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Academic Year Filter</label>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40 overflow-x-auto">
            {dynamicYearsArray.map((yearKey) => (
              <button
                key={yearKey}
                type="button"
                onClick={() => setActiveYear(yearKey)}
                className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black tracking-tight rounded-lg transition-all duration-150 whitespace-nowrap ${
                  activeYear === yearKey
                    ? 'bg-white text-indigo-900 shadow-xs border border-amber-200/60'
                    : 'text-slate-600 hover:text-indigo-800 hover:bg-slate-200/50'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  {yearKey === 'ALL' ? (
                    <>
                      <Calendar size={12} className="text-amber-500 shrink-0" />
                      <span>All Years</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap size={12} className="text-amber-500 shrink-0" />
                      <span>Yr {yearKey}</span>
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Section Selection Matrix</label>
          <div className="flex flex-wrap gap-1">
            {dynamicSectionsArray.map((secKey) => (
              <button
                key={secKey}
                type="button"
                onClick={() => setActiveSection(secKey)}
                className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all border whitespace-nowrap ${
                  activeSection === secKey
                    ? 'bg-amber-50 text-indigo-900 border-amber-300 shadow-3xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  {secKey === 'ALL' ? (
                    <>
                      <Layers size={12} className="text-slate-400 shrink-0" />
                      <span>All Sections</span>
                    </>
                  ) : (
                    <>
                      <Grid size={12} className="text-amber-500 shrink-0" />
                      <span>Sec {secKey}</span>
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto relative">
          <table className="w-full min-w-[680px] text-left text-xs border-collapse">
            <thead className="bg-amber-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 sm:p-4 pl-4 sm:pl-6 font-extrabold">Register No</th>
                <th className="p-3 sm:p-4 font-extrabold">Student Name</th>
                <th className="p-3 sm:p-4 font-extrabold">Year & Sec</th>
                <th className="p-3 sm:p-4 font-extrabold">Advisor 1</th>
                <th className="p-3 sm:p-4 font-extrabold text-left">Details</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
              {filteredStudentsMatrix.map((row, idx) => {
                const fullName = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim();
                return (
                  <tr key={row._id || idx} className="hover:bg-amber-50/30 transition-colors duration-150 group">
                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-mono font-bold text-indigo-900 bg-amber-50/50 tracking-wide text-[10px] sm:text-xs">
                      {row.registerNo || row.id || 'N/A'}
                    </td>
                    <td className="p-3 sm:p-4">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight group-hover:text-amber-700 transition-colors">
                        {fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none">
                        {row.email || 'No email'}
                      </p>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="px-1.5 sm:px-2 py-0.5 font-bold uppercase text-[8px] sm:text-[9px] tracking-wide rounded bg-slate-100 text-indigo-800 border border-slate-200 whitespace-nowrap">
                        Yr {normalizeYear(row.year || row.yr)}-{normalizeSection(row.section || row.sec)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-amber-500 shrink-0" />
                        <span className="truncate max-w-[60px] sm:max-w-none">{row.firstmentorName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-left w-28 sm:w-36">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedStudent(row)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold text-[10px] sm:text-[11px] px-2 sm:px-3 py-1.5 rounded-lg transition-colors shadow-sm tracking-tight whitespace-nowrap"
                      >
                        <Eye size={12} className="text-amber-300" />
                        <span>View Profile</span>
                      </motion.button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStudentsMatrix.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white">
            <p className="text-xs text-slate-400 font-medium px-4">
              No students details found...
            </p>
          </div>
        )}
      </div>

      {/* ===== PROFILE DRAWER ===== */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-slate-50 h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-4 sm:p-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[9px] font-black bg-indigo-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  Student Profile
                </span>
                <h3 className="text-base sm:text-lg font-black text-indigo-900 tracking-tight mt-1 break-words">
                  {selectedStudent.name || `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim()}
                </h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="my-4 sm:my-6 space-y-4 flex-1">
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <GraduationCap className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registration Number</p>
                  <p className="text-sm font-mono font-bold text-indigo-900 break-all">{selectedStudent.registerNo || selectedStudent.id || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Mail className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                  <p className="text-xs font-medium text-slate-800 break-all">{selectedStudent.email || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <User className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Advisor 1</p>
                  <p className="text-xs font-medium text-slate-800 break-all">{selectedStudent.firstmentorName || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <User2 className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Advisor 2</p>
                  <p className="text-xs font-medium text-slate-800 break-all">{selectedStudent.secondmentorName || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Calendar className="text-amber-500 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Academic Year</p>
                    <p className="text-xs font-bold text-indigo-900">Year {normalizeYear(selectedStudent.year || selectedStudent.yr)}</p>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Layers className="text-amber-500 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Section</p>
                    <p className="text-xs font-bold text-indigo-900">Section {normalizeSection(selectedStudent.section || selectedStudent.sec)}</p>
                  </div>
                </div>
              </div>

              {/* Leave/OD counters */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white mt-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Leave Approval Counters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl text-center">
                    <p className="text-xl font-black text-emerald-600">{selectedStudent.leaveCount || 0}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Leaves Approved</p>
                  </div>
                  <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl text-center">
                    <p className="text-xl font-black text-amber-600">{selectedStudent.odCount || 0}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Duty Leaves (OD)</p>
                  </div>
                </div>
              </div>

              {/* ===== CERTIFICATE SECTION – ONLY IF VALID ===== */}
              {hasCertificate(selectedStudent) && (
                <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-900">On-Duty Certificate </span>
                  </div>
                  <button
                    onClick={() => openCertificateModal(selectedStudent)}
                    className="text-[11px] font-black bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs w-full sm:w-auto text-center"
                  >
                    View Certificate
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors text-center shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CERTIFICATE MODAL ===== */}
      <AnimatePresence>
        {certificateModalOpen && certificateData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
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
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Eye size={18} className="text-amber-500" />
                  Uploaded Certificate 
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadCertificate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
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
                  alt="Certificate"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                />
              </div>
              <div className="p-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Certificate for On-Duty.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentList;