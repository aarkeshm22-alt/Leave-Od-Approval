import React, { useState, useEffect } from 'react';
import { GraduationCap, UserCheck, X, Loader2, Mail, Phone, Calendar, Grid, Layers, FileText, Eye, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState('ALL');
  const [activeSection, setActiveSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const cleanToken = token ? token.replace(/"/g, '').trim() : '';

        // 🔥 No mentorName parameter → returns all students
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

  // View document in new tab
  const handleViewDocument = (base64Data) => {
    if (!base64Data) return;
    const newTab = window.open();
    if (newTab) {
      newTab.document.body.style.margin = '0';
      newTab.document.body.style.display = 'flex';
      newTab.document.body.style.justifyContent = 'center';
      newTab.document.body.style.alignItems = 'center';
      newTab.document.body.style.backgroundColor = '#f1f5f9';
      const img = newTab.document.createElement('img');
      img.src = base64Data;
      img.style.maxWidth = '95%';
      img.style.maxHeight = '95vh';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
      newTab.document.body.appendChild(img);
      newTab.document.title = "Student Certificate";
    } else {
      alert("Pop-up blocked! Please allow pop-ups.");
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span className="text-xs font-semibold">Resolving institutional registration directories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12 selection:bg-blue-100 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Registered Student Details</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Filter student information blocks across standard institutional configurations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or reg number..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-400 focus:outline-none text-xs rounded-xl shadow-2xs font-medium text-slate-800 transition-colors"
            />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 shrink-0">
            <GraduationCap size={15} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700">{filteredStudentsMatrix.length} Displayed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Academic Year Filter</label>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-max border border-slate-200/40">
            {dynamicYearsArray.map((yearKey) => (
              <button
                key={yearKey}
                type="button"
                onClick={() => setActiveYear(yearKey)}
                className={`px-4 py-1.5 text-xs font-black tracking-tight rounded-lg transition-all duration-150 ${
                  activeYear === yearKey
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  {yearKey === 'ALL' ? (
                    <>
                      <Calendar size={12} className="text-slate-400 shrink-0" />
                      <span>All Years</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap size={12} className="text-blue-500 shrink-0" />
                      <span>Year {yearKey}</span>
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
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${
                  activeSection === secKey
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-3xs'
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
                      <Grid size={12} className="text-blue-500 shrink-0" />
                      <span>Section {secKey}</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6 font-extrabold">Register Number</th>
                <th className="p-4 font-extrabold">Student Name</th>
                <th className="p-4 font-extrabold">Year & Section</th>
                <th className="p-4 font-extrabold">Assigned CA1</th>
                <th className="p-4 font-extrabold">Assigned CA2</th>
                <th className="p-4 font-extrabold">Certificate</th>
                <th className="p-4 font-extrabold text-left">Details</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
              {filteredStudentsMatrix.map((row, idx) => {
                const fullName = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim();
                return (
                  <tr key={row._id || idx} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                    <td className="p-4 pl-6 font-mono font-bold text-blue-700 tracking-wide">
                      {row.registerNo || row.id || 'N/A'}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                        {fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{row.email || 'No email'}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 font-bold uppercase text-[9px] tracking-wide rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Yr {normalizeYear(row.year || row.yr)}-{normalizeSection(row.section || row.sec)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-slate-400" />
                        <span>{row.firstmentorName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-slate-400" />
                        <span>{row.secondmentorName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {row.document ? (
                        <button
                          onClick={() => handleViewDocument(row.document)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">No file</span>
                      )}
                    </td>
                    <td className="p-4 text-left w-36">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedStudent(row)}
                        whileHover={{ scale: 1.04, backgroundColor: '#0f172a' }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-sm tracking-tight"
                      >
                        <Eye size={13} className="text-slate-300" />
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
          <div className="text-center py-16 bg-white">
            <p className="text-xs text-slate-400 font-medium px-4">
              No students found matching your active filter criteria values.
            </p>
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  Student Profile
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  {selectedStudent.name || `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim()}
                </h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="my-6 space-y-4 flex-1">
              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <GraduationCap className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registration Number</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{selectedStudent.registerNo || selectedStudent.id || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Mail className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                  <p className="text-xs font-medium text-slate-800 break-all">{selectedStudent.email || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Calendar className="text-slate-400 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Academic Year</p>
                    <p className="text-xs font-bold text-slate-800">Year {normalizeYear(selectedStudent.year || selectedStudent.yr)}</p>
                  </div>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Layers className="text-slate-400 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Section</p>
                    <p className="text-xs font-bold text-slate-800">Section {normalizeSection(selectedStudent.section || selectedStudent.sec)}</p>
                  </div>
                </div>
              </div>

              {/* Leave/OD counters */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white mt-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Leave Approval Counters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl text-center">
                    <p className="text-xl font-black text-green-600">{selectedStudent.leaveCount || 0}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Leaves Approved</p>
                  </div>
                  <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl text-center">
                    <p className="text-xl font-black text-yellow-600">{selectedStudent.odCount || 0}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Duty Leaves (OD)</p>
                  </div>
                </div>
              </div>

              {/* Document section */}
              {selectedStudent.document && (
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Certificate attached</span>
                  </div>
                  <button
                    onClick={() => handleViewDocument(selectedStudent.document)}
                    className="text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    View
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-colors text-center shadow-xs"
              >
                Close Profile Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;