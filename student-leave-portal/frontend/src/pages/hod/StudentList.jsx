import React, { useState, useEffect } from 'react';
import { GraduationCap, UserCheck, X, Loader2, Mail, Phone, Calendar, Layers, FileText, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 MATRIX FILTERING STATES (Default to ALL to see everyone instantly)
  const [activeYear, setActiveYear] = useState('ALL'); 
  const [activeSection, setActiveSection] = useState('ALL'); 

  // Profile modal drawer tracking states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);
  const [studentMetadata, setStudentMetadata] = useState({ leaveCount: 0, odCount: 0 });

  useEffect(() => {
    const fetchGlobalStudentsRegistry = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const cleanToken = token ? token.replace(/"/g, '').trim() : '';

        const response = await axios.get('/api/users/students', {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        });

        const userList = response.data.data || response.data || [];
        const studentFilter = userList.filter(u => u.role?.toLowerCase() === 'student');
        
        // 🚨 IMPORTANT: Open your browser inspect console to look at this array matrix printout!
        console.log("👉 INSPECT ALL RECIEVED BACKEND STUDENTS:", studentFilter);
        setStudents(studentFilter);
      } catch (error) {
        console.error('Failed retrieving global institutional student records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStudentsRegistry();
  }, []);

  // 🚀 HELPER: Clean up section names (e.g., "SECTION B" -> "B")
  const normalizeSection = (sectionValue) => {
    if (!sectionValue) return 'UNKNOWN';
    return sectionValue.toString().trim().toUpperCase().replace('SECTION', '').trim();
  };

  // 🚀 HELPER: Clean up year values to a uniform capitalized string (e.g., 3 -> "3", "3rd" -> "3RD")
  const normalizeYear = (yearValue) => {
    if (!yearValue) return 'UNKNOWN';
    return yearValue.toString().trim().toUpperCase().replace('YEAR', '').trim();
  };

  // 🚀 DYNAMIC ACADEMIC YEAR GENERATOR: Reads whatever values exist in your DB records
  const dynamicYearsArray = ['ALL', ...new Set(
    students
      .map(s => normalizeYear(s.year || s.yr))
      .filter(Boolean)
      .sort()
  )];

  // 🚀 DYNAMIC SECTION GENERATOR: Reads whatever sections exist in your DB records
  const dynamicSectionsArray = ['ALL', ...new Set(
    students
      .map(s => normalizeSection(s.section || s.sec))
      .filter(Boolean)
      .sort()
  )];

  // 🚀 FILTER MATCH ENGINE
  const filteredStudentsMatrix = students.filter(student => {
    const studentYear = normalizeYear(student.year || student.yr);
    const studentSection = normalizeSection(student.section || student.sec);

    const matchesYear = activeYear === 'ALL' || studentYear === activeYear;
    const matchesSection = activeSection === 'ALL' || studentSection === activeSection;

    return matchesYear && matchesSection;
  });

  const handleViewStudentProfile = async (student) => {
    setSelectedStudent(student);
    setLoadingProfileDetails(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';

      const response = await axios.get('/api/users/students-by-mentor', {
        params: { mentorName: student.mentorName },
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });

      const matchedList = response.data.data || response.data || [];
      const accurateRow = matchedList.find(s => s._id === student._id);

      if (accurateRow) {
        setStudentMetadata({
          leaveCount: accurateRow.leaveCount || 0,
          odCount: accurateRow.odCount || 0
        });
      } else {
        setStudentMetadata({ leaveCount: student.leaveCount || 0, odCount: student.odCount || 0 });
      }
    } catch (err) {
      setStudentMetadata({ leaveCount: student.leaveCount || 0, odCount: student.odCount || 0 });
    } finally {
      setLoadingProfileDetails(false);
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

      {/* 1. Header Control Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Entire Student Departmental Registry</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Filter student information blocks across standard institutional configurations.</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 self-start sm:self-auto">
          <GraduationCap size={15} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{students.length} Registered Students</span>
        </div>
      </div>

      {/* 2. DYNAMIC GENERATED FILTER PANEL */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs space-y-4">

        {/* Row A: Academic Years */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Academic Year Filter</label>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-max border border-slate-200/40">
            {dynamicYearsArray.map((yearKey) => (
              <button
                key={yearKey}
                type="button"
                onClick={() => setActiveYear(yearKey)}
                className={`px-4 py-1.5 text-xs font-black tracking-tight rounded-lg transition-all duration-150 ${activeYear === yearKey
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
              >
                {yearKey === 'ALL' ? '🚨 All Years' : `Year ${yearKey}`}
              </button>
            ))}
          </div>
        </div>

        {/* Row B: Section Displays */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Section Selection Matrix</label>
          <div className="flex flex-wrap gap-1">
            {dynamicSectionsArray.map((secKey) => (
              <button
                key={secKey}
                type="button"
                onClick={() => setActiveSection(secKey)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${activeSection === secKey
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-3xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {secKey === 'ALL' ? '🌎 All Sections' : `Section ${secKey}`}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Students Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6 font-extrabold">Register Number</th>
                <th className="p-4 font-extrabold">Student Name</th>
                <th className="p-4 font-extrabold">Branch/Track Info</th>
                <th className="p-4 font-extrabold">Assigned Mentor</th>
                <th className="p-4 font-extrabold text-left">Actions Matrix</th>
              </tr>
            </thead>

            <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
              {filteredStudentsMatrix.map((row, idx) => {
                const studentFullName = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim();

                return (
                  <tr key={row._id || idx} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                    <td className="p-4 pl-6 font-mono font-bold text-blue-700 tracking-wide">
                      {row.registerNo || row.id || 'N/A'}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">
                        {studentFullName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{row.email || 'No email saved'}</p>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 font-bold uppercase text-[9px] tracking-wide rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Yr {normalizeYear(row.year || row.yr)}-{normalizeSection(row.section || row.sec)}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={13} className="text-slate-400" />
                        <span>{row.mentorName || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="p-4 text-left w-36">
                      <motion.button
                        type="button"
                        onClick={() => handleViewStudentProfile(row)}
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
              No students found for Year <span className="font-black text-slate-700">"{activeYear}"</span> and Section <span className="font-black text-slate-700">"{activeSection}"</span>.
            </p>
          </div>
        )}
      </div>

      {/* 4. Sliding Profile Inspection Drawer Layer */}
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
                  <p className="text-sm font-mono font-bold text-slate-800">{selectedStudent.registerNo || 'N/A'}</p>
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentList;