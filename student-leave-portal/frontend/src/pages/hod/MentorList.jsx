import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Users2, X, Loader2, User, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const MentorList = () => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer Selection States
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Object to keep a fast lookup dictionary of live student counts per mentor locally
  const [liveAllocationCounts, setLiveAllocationCounts] = useState({});
  // Object to catch dynamically fetched contact cards when a profile button is pressed
  const [enrichedMentorDetails, setEnrichedMentorDetails] = useState({});

  useEffect(() => {
    const fetchAssignedMentors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const cleanToken = token ? token.replace(/"/g, '').trim() : '';

        // 🚀 CRITICAL ROUTE CHECK: Make sure this URL matches the route assigned to getMentorsByHod in your routes file!
        // If your backend router couples getMentorsByHod to '/api/users/mentors', keep it. If it uses a distinct route, update it here.
        const response = await axios.get('https://leave-od-approval.onrender.com/api/users/mentors', {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        });

        const mentorData = response.data.data || response.data;
        
        // Debug logger to inspect exactly what keys your backend server is sending back to the browser
        console.log("BACKEND RAW RESPONSE DATA MATRIX:", response.data);
        
        setInstructors(Array.isArray(mentorData) ? mentorData : []);

        // Pre-fetch background metrics and fields for each loaded instructor card
        if (Array.isArray(mentorData)) {
          mentorData.forEach(async (mentor) => {
            const mentorNameString = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
            try {
              const studentRes = await axios.get('https://leave-od-approval.onrender.com/api/users/students-by-mentor', {
                params: { mentorName: mentorNameString },
                headers: { 'Authorization': `Bearer ${cleanToken}` }
              });
              const students = studentRes.data.data || studentRes.data;

              setLiveAllocationCounts(prev => ({
                ...prev,
                [mentorNameString]: Array.isArray(students) ? students.length : 0
              }));

              if (Array.isArray(students) && students.length > 0 && students[0]) {
                setEnrichedMentorDetails(prev => ({
                  ...prev,
                  [mentor._id || mentorNameString]: {
                    email: mentor.email || students[0].mentorEmail,
                    mobileNo: mentor.mobileNo || mentor.mobile
                  }
                }));
              }
            } catch (err) {
              console.error("Error pre-calculating local metrics state matrix:", err);
            }
          });
        }

      } catch (error) {
        console.error('Failed retrieving department mentor roster:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedMentors();
  }, []);

  // Fetch students mapped to this specific mentor name configuration signature
  const handleViewProfile = async (mentor) => {
    setSelectedMentor(mentor);
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const mentorNameString = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();

      const response = await axios.get('https://leave-od-approval.onrender.com/api/users/students-by-mentor', {
        params: { mentorName: mentorNameString },
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });

      const studentsList = response.data.data || response.data;
      setAssignedStudents(Array.isArray(studentsList) ? studentsList : []);

      setLiveAllocationCounts(prev => ({
        ...prev,
        [mentorNameString]: Array.isArray(studentsList) ? studentsList.length : 0
      }));
    } catch (error) {
      console.error('Failed fetching assigned students allocation sub-matrix:', error);
      setAssignedStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 🚀 BULLETPROOF HOD NAME RESOLVER
  const getCleanHodName = () => {
    // 1. Check if the array elements contain the hodName directly returned from getMentorsByHod
    if (instructors.length > 0) {
      const firstValidHodField = instructors.find(i => i.hodName && i.hodName.trim() !== '');
      if (firstValidHodField) return firstValidHodField.hodName;
    }

    // 2. Check global state session variables
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0].toUpperCase(); // Ultimate fallback using email identity handle

    // 3. Fallback to storage parsing if context provider updates late
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.firstName || parsed.lastName) return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        if (parsed.name) return parsed.name;
      }
    } catch (e) {
      console.error(e);
    }

    return 'Department Head Master';
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span className="text-xs font-semibold">Resolving department mentor database mappings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12 selection:bg-amber-100 selection:text-amber-900 relative">

      {/* 1. Roster Head Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-black text-blue-700 tracking-wide uppercase bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs">
              HOD: {getCleanHodName()} {user.lastName ? `- ${user.lastName}` : ''}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">Registered Mentor List</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">View your assigned mentors and their student allocations here.</p>
        </div>
      </div>

      {/* 2. Grid Display Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {instructors.map((ins, i) => {
          const mentorFullName = ins.name || `${ins.firstName || ''} ${ins.lastName || ''}`.trim();
          const dynamicAllocationCount = liveAllocationCounts[mentorFullName] !== undefined
            ? liveAllocationCounts[mentorFullName]
            : (ins.capacity || 0);

          return (
            <div
              key={ins._id || i}
              className="p-5 bg-white border border-slate-200 rounded-2xl relative overflow-hidden group hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/80 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 group-hover:bg-amber-500 transition-colors duration-300" />

              <div>
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60">
                      {ins.role || ins.designation || 'Faculty Mentor'}
                    </span>
                    <h4 className="text-base font-black text-slate-900 tracking-tight pt-0.5">
                      {mentorFullName}
                    </h4>
                    {(ins.email || enrichedMentorDetails[ins._id]?.email) && (
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium pt-0.5">
                        <Mail size={11} className="text-slate-300" />
                        <span className="text-[11px] font-mono tracking-tight text-slate-500">
                          {ins.email || enrichedMentorDetails[ins._id]?.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-amber-600 transition-all duration-300">
                    <ShieldCheck size={16} />
                  </div>
                </div>

                <div className="pl-2 mt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                    <Users2 size={11} className="text-slate-400" />
                    <span className="text-slate-700 font-bold">Assigned Allocations: {dynamicAllocationCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end pl-2">
                <button
                  type="button"
                  onClick={() => handleViewProfile(ins)}
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
                >
                  View Profile & Allocations
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Sliding Inspection Drawer Layer */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-opacity animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-50 h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 font-sans">

            {/* Drawer Header Row */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded uppercase tracking-wider">
                  Mentor Profile
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  {selectedMentor.name || `${selectedMentor.firstName || ''} ${selectedMentor.lastName || ''}`.trim()}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedMentor(null); setAssignedStudents([]); }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mentor Details Data Card Grid Block */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <User className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Faculty Core Designation</p>
                  <p className="text-xs font-bold text-slate-800">{selectedMentor.role || 'Faculty Mentor'}</p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Mail className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Digital Identity Vector</p>
                  <p className="text-xs font-mono text-slate-800 break-all">
                    {selectedMentor.email || enrichedMentorDetails[selectedMentor._id]?.email || 'No email registered'}
                  </p>
                </div>
              </div>

              {/* PHONE NUMBER */}
              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <Phone className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contact Telephony Line</p>
                  <p className="text-xs font-medium text-slate-800">
                    {selectedMentor.mobileNo || selectedMentor.mobile || enrichedMentorDetails[selectedMentor._id]?.mobileNo || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                <BookOpen className="text-slate-400 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department Node Domain</p>
                  <p className="text-xs font-medium text-slate-800">{selectedMentor.department || 'Computer Science and Engineering'}</p>
                </div>
              </div>
            </div>

            {/* Allocated Students Section Grid Matrix Table Block */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-start overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-amber-500" size={18} />
                <h4 className="text-sm font-black text-slate-900 tracking-tight">Active Allocation Registry Table ({assignedStudents.length})</h4>
              </div>

              {loadingStudents ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
                  <Loader2 className="animate-spin text-slate-500" size={20} />
                  <span className="text-xs font-medium">Reconciling nested student allocation tables...</span>
                </div>
              ) : assignedStudents.length > 0 ? (
                <div className="overflow-x-auto w-full border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                        <th className="p-3">Register Number</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Classification Type</th>
                        <th className="p-3">Leave Count</th>
                        <th className="p-3">OD Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {assignedStudents.map((student, sIndex) => (
                        <tr key={student._id || sIndex} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-slate-600">{student.registerNo || 'N/A'}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase">
                              {student.studentType || 'Regular'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[10px] font-bold uppercase">
                              {student.leaveCount ?? 0}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[10px] font-bold uppercase">
                              {student.odCount ?? 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">No students currently linked to this staff advisor node tracking record context.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {instructors.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-xs text-slate-400 font-medium">No mentors registered under your profile mapping node parameter layout yet.</p>
        </div>
      )}

    </div>
  );
};

export default MentorList;