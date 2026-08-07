import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Users2, X, Loader, User, Phone, BookOpen, GraduationCap, Search, Eye, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const MentorList = () => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [liveAllocationCounts, setLiveAllocationCounts] = useState({});

  const getValidAuthToken = () => {
    try {
      const rawToken = localStorage.getItem('token') ||
                       localStorage.getItem('accessToken') ||
                       localStorage.getItem('authToken');
      if (!rawToken) return '';
      return rawToken.replace(/"/g, '').trim();
    } catch (err) {
      console.error("Token extraction error:", err);
      return '';
    }
  };

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

  useEffect(() => {
    const fetchMentorsAndCounts = async () => {
      try {
        setLoading(true);
        const cleanToken = getValidAuthToken();

        // 1. Fetch all mentors
        const mentorsRes = await axios.get('https://leave-od-approval.onrender.com/api/users/mentors', {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
        });
        const mentorData = mentorsRes.data.data || mentorsRes.data || [];
        setInstructors(mentorData);

        // 2. Fetch student counts per mentor in parallel
        const countPromises = mentorData.map(async (mentor) => {
          const fullName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
          try {
            const res = await axios.get('https://leave-od-approval.onrender.com/api/users/students-by-mentor', {
              params: {
                mentorName: fullName,
                category: mentor.category || 'CA1'
              },
              headers: { 'Authorization': `Bearer ${cleanToken}` }
            });
            const students = res.data.data || [];
            return { name: fullName, count: students.length };
          } catch (err) {
            console.warn(`Could not fetch students for ${fullName}:`, err.message);
            return { name: fullName, count: 0 };
          }
        });

        const counts = await Promise.all(countPromises);
        const countMap = {};
        counts.forEach(({ name, count }) => { countMap[name] = count; });
        setLiveAllocationCounts(countMap);

      } catch (error) {
        console.error('Failed fetching mentor roster:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorsAndCounts();
  }, []);

  const handleViewProfile = async (mentor) => {
    try {
      setSelectedMentor(mentor);
      setAssignedStudents([]);
      setLoadingStudents(true);

      const fullMentorName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
      const cleanToken = getValidAuthToken();

      const response = await axios.get('https://leave-od-approval.onrender.com/api/users/students-by-mentor', {
        params: {
          mentorName: fullMentorName,
          category: mentor.category || 'CA1'
        },
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });

      if (response.data.success) {
        setAssignedStudents(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error.response?.data || error.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const getCleanHodName = () => {
    if (instructors.length > 0) {
      const fieldMatch = instructors.find(i => i.hodName && i.hodName.trim() !== '');
      if (fieldMatch) return fieldMatch.hodName;
    }
    if (user?.firstName || user?.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return 'SHARMILA V';
  };

  const filteredInstructors = instructors.filter((ins) => {
    const mentorFullName = (ins.name || `${ins.firstName || ''} ${ins.lastName || ''}`).toLowerCase();
    const mentorEmail = (ins.email || '').toLowerCase();
    const cleanQuery = searchQuery.toLowerCase().trim();
    return mentorFullName.includes(cleanQuery) || mentorEmail.includes(cleanQuery);
  });

 if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[700px] sm:min-h-[700px] md:min-h-[650px] text-gray-400 font-sans px-4">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-black tracking-widest uppercase text-gray-500 animate-pulse text-center">
          Fetching the <span className='text-amber-600'>Mentor</span> Details
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4 md:pb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-black text-indigo-900 tracking-wide uppercase bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs">
              HOD: {getCleanHodName()}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight mt-2">Registered Mentor List</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">View your assigned mentors and their student allocations here.</p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentor name or email..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-amber-500 focus:outline-none text-xs rounded-xl shadow-2xs font-medium text-slate-800 transition-colors focus:ring-1 focus:ring-amber-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Mentor Cards */}
      {filteredInstructors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInstructors.map((ins, i) => {
            const mentorFullName = ins.name || `${ins.firstName || ''} ${ins.lastName || ''}`.trim();
            const dynamicCount = liveAllocationCounts[mentorFullName] !== undefined ? liveAllocationCounts[mentorFullName] : 0;

            return (
              <div key={ins._id || i} className="p-5 bg-white border border-slate-200 rounded-2xl relative overflow-hidden group hover:border-amber-300 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-900 group-hover:bg-amber-500 transition-colors" />
                <div>
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black tracking-wider uppercase bg-amber-50 text-indigo-800 px-2 py-0.5 rounded border border-amber-200/60">
                        {ins.role || 'Faculty Mentor'}
                      </span>
                      <h4 className="text-base font-black text-indigo-900 tracking-tight pt-0.5">
                        {mentorFullName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium pt-0.5">
                        <Mail size={11} className="text-amber-500" />
                        <span className="text-[11px] font-mono text-slate-500">
                          {ins.email || 'faculty@ksrce.ac.in'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-500">
                      <ShieldCheck size={16} />
                    </div>
                  </div>

                  <div className="pl-2 mt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                      <Users2 size={11} className="text-amber-500" />
                      <span className="text-indigo-900 font-bold">Assigned Allocations: {dynamicCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end pl-2">
                  <button
                    type="button"
                    onClick={() => handleViewProfile(ins)}
                    className="w-full sm:w-auto bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all"
                  >
                    View Profile & Allocations
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-xs text-slate-400 font-medium">No mentors match your filtered metrics threshold.</p>
        </div>
      )}

      {/* Modal Drawer */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-3xl bg-slate-50 h-full shadow-2xl flex flex-col overflow-y-auto p-4 sm:p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[9px] font-black bg-indigo-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  Mentor Profile
                </span>
                <h3 className="text-base sm:text-lg font-black text-indigo-900 tracking-tight mt-1 break-words">
                  {selectedMentor.name || `${selectedMentor.firstName || ''} ${selectedMentor.lastName || ''}`.trim()}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedMentor(null); setAssignedStudents([]); }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mentor Meta Info */}
            <div className="my-4 sm:my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <User className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role</p>
                  <p className="text-xs font-bold text-indigo-900">{selectedMentor.role || 'Faculty Mentor'}</p>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <User className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category</p>
                  <p className="text-xs font-bold text-indigo-900">{selectedMentor.category || 'CA1'}</p>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Mail className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-xs font-mono text-indigo-800 break-all">{selectedMentor.email || 'faculty@ksrce.ac.in'}</p>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Phone className="text-amber-500 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact</p>
                  <p className="text-xs font-medium text-indigo-800">{selectedMentor.mobileNo || selectedMentor.mobile || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Student Table with Document Column */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-amber-500" size={18} />
                <h4 className="text-sm font-black text-indigo-900 tracking-tight">
                  Assigned Students Table ({assignedStudents.length})
                </h4>
              </div>

              {loadingStudents ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
                  <Loader className="animate-spin text-amber-500" size={20} />
                  <span className="text-xs font-medium">Getting the assigned students...</span>
                </div>
              ) : assignedStudents.length > 0 ? (
                <div className="overflow-x-auto w-full border border-slate-100 rounded-xl">
                  <table className="w-full min-w-[500px] text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-amber-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                        <th className="p-2 sm:p-3">Register No</th>
                        <th className="p-2 sm:p-3">Student Name</th>
                        <th className="p-2 sm:p-3 hidden sm:table-cell">Type</th>
                        <th className="p-2 sm:p-3">Leave</th>
                        <th className="p-2 sm:p-3">OD</th>
                        <th className="p-2 sm:p-3">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {assignedStudents.map((student, sIndex) => (
                        <tr key={student._id || sIndex} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-2 sm:p-3 font-mono text-indigo-800 bg-amber-50/30">{student.registerNo || 'N/A'}</td>
                          <td className="p-2 sm:p-3 font-bold text-slate-900">
                            {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                          </td>
                          <td className="p-2 sm:p-3 hidden sm:table-cell">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase">
                              {student.studentType || 'Day Scholar'}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                              {student.leaveCount ?? 0}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                              {student.odCount ?? 0}
                            </span>
                          </td>
                          <td className="p-2 sm:p-3">
                            {student.document ? (
                              <button
                                onClick={() => handleViewDocument(student.document)}
                                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 sm:px-2 py-0.5 rounded-lg transition-colors"
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">No file</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">No students linked to this mentor.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
              <button
                onClick={() => { setSelectedMentor(null); setAssignedStudents([]); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorList;