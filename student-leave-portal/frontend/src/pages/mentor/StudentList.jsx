import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Users, User, ShieldCheck, Phone, Hash, Calendar,
  X, Eye, User2, Clock, Search, Filter, Download, FileSpreadsheet, FileText,
  RotateCcw, GraduationCap, Image
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Certificate Modal States
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const openProfileDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterLeaveMin, setFilterLeaveMin] = useState('');
  const [filterLeaveMax, setFilterLeaveMax] = useState('');
  const [filterODMin, setFilterODMin] = useState('');
  const [filterODMax, setFilterODMax] = useState('');

  // Helper functions
  const getLeaveCount = (st) => st.leaveCount ?? st.totalLeavesCount ?? st.approvedLeaves ?? st.leavesApproved ?? 0;
  const getODCount = (st) => st.odCount ?? st.totalODCount ?? st.totalODDays ?? st.approvedOD ?? st.odApproved ?? 0;
  const getFullName = (st) => `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name || 'N/A';

  // ----- Helper: Get enrolled date (with fallback from ObjectId) -----
  const getEnrolledDate = (st) => {
    const dateStr = st.enrolledDate || st.createdAt || st.student?.enrolledDate || st.student?.createdAt;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    // Fallback: extract timestamp from ObjectId (if _id is a 24‑char hex string)
    if (st._id && typeof st._id === 'string' && st._id.length === 24) {
      const timestamp = parseInt(st._id.substring(0, 8), 16) * 1000;
      const d = new Date(timestamp);
      if (!isNaN(d)) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return 'N/A';
  };

  // ----- Extract all certificates from ODs -----
  const getStudentCertificates = (st) => {
    const certs = [];
    const odsArray = st.ods || st.onDutyRequests || st.student?.ods || [];
    if (Array.isArray(odsArray) && odsArray.length > 0) {
      odsArray.forEach((od) => {
        const cert = od.certificate || od.document;
        if (cert && typeof cert === 'string' && cert.startsWith('data:image')) {
          certs.push({
            base64: cert,
            reason: od.reason || 'N/A',
            fromDate: od.fromDate
              ? new Date(od.fromDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A',
            toDate: od.toDate
              ? new Date(od.toDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A',
          });
        }
      });
    }
    if (certs.length === 0) {
      const directCert = st.certificate || st.document || st.student?.certificate;
      if (directCert && typeof directCert === 'string' && directCert.startsWith('data:image')) {
        certs.push({
          base64: directCert,
          reason: 'Student Certificate',
          fromDate: 'N/A',
          toDate: 'N/A',
        });
      }
    }
    return certs;
  };

  // ----- Fetch data -----
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
          const normalized = extractedStudents.map(st => ({
            ...st,
            ods: st.ods || [],
          }));
          setStudents(normalized);
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

  // ----- Filter logic -----
  const filteredStudents = students.filter(st => {
    const name = getFullName(st).toLowerCase();
    const reg = (st.registerNo || st.register || st.student?.registerNo || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = name.includes(query) || reg.includes(query);

    const matchesType = filterType === 'ALL' || (st.studentType || st.student?.studentType || 'Regular Track') === filterType;
    const leaveCount = getLeaveCount(st);
    const odCount = getODCount(st);
    const matchesLeaveMin = filterLeaveMin === '' || leaveCount >= parseInt(filterLeaveMin);
    const matchesLeaveMax = filterLeaveMax === '' || leaveCount <= parseInt(filterLeaveMax);
    const matchesODMin = filterODMin === '' || odCount >= parseInt(filterODMin);
    const matchesODMax = filterODMax === '' || odCount <= parseInt(filterODMax);

    return matchesSearch && matchesType && matchesLeaveMin && matchesLeaveMax && matchesODMin && matchesODMax;
  });

  const studentTypes = ['ALL', ...new Set(students.map(st => st.studentType || st.student?.studentType || 'Regular Track'))];

  // ===== EXPORT FUNCTIONS =====
  const handleExportReport = (format) => {
    if (filteredStudents.length === 0) {
      alert("No students match your current filter criteria.");
      return;
    }

    setIsExporting(true);
    try {
      const formattedRows = filteredStudents.map(st => ({
        "Register No": st.registerNo || st.register || st.student?.registerNo || 'N/A',
        "Student Name": getFullName(st),
        "Student Type": st.studentType || st.student?.studentType || 'Regular Track',
        "CA1 Mentor": st.firstmentorName || st.student?.firstmentorName || 'Unassigned',
        "CA2 Mentor": st.secondmentorName || st.student?.secondmentorName || 'Unassigned',
        "Leave Count": getLeaveCount(st),
        "OD Count": getODCount(st),
        "Email": st.email || st.student?.email || 'N/A',
        "Mobile": st.mobileNo || st.mobile || st.student?.mobileNo || st.student?.mobile || 'N/A',
        "Enrolled Date": getEnrolledDate(st),
        "Certificate Count": getStudentCertificates(st).length
      }));

      if (format === 'excel') {
        const worksheet = utils.json_to_sheet(formattedRows);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Students");
        writeFile(workbook, `Mentor_Students_${new Date().toISOString().slice(0,10)}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFillColor(26, 35, 50);
        doc.rect(0, 0, 297, 24, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text("Mentor Student Registry Report", 14, 11);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(203, 213, 225);
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Students: ${filteredStudents.length}`, 14, 18);

        const tableHeaders = [
          ["Reg No", "Student", "Type", "CA1", "CA2", "Leave", "OD", "Email", "Mobile", "Enrolled", "Certs"]
        ];
        const tableBody = filteredStudents.map(st => [
          st.registerNo || st.register || st.student?.registerNo || 'N/A',
          getFullName(st),
          st.studentType || st.student?.studentType || 'Regular Track',
          st.firstmentorName || st.student?.firstmentorName || 'Unassigned',
          st.secondmentorName || st.student?.secondmentorName || 'Unassigned',
          getLeaveCount(st).toString(),
          getODCount(st).toString(),
          st.email || st.student?.email || 'N/A',
          st.mobileNo || st.mobile || st.student?.mobileNo || st.student?.mobile || 'N/A',
          getEnrolledDate(st),
          getStudentCertificates(st).length.toString()
        ]);

        autoTable(doc, {
          head: tableHeaders,
          body: tableBody,
          startY: 32,
          theme: 'striped',
          headStyles: { fillColor: [26, 35, 50], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 22 },
            1: { cellWidth: 28 },
            2: { cellWidth: 18 },
            3: { cellWidth: 22 },
            4: { cellWidth: 22 },
            5: { cellWidth: 12, halign: 'center' },
            6: { cellWidth: 12, halign: 'center' },
            7: { cellWidth: 30 },
            8: { cellWidth: 22 },
            9: { cellWidth: 20 },
            10: { cellWidth: 14, halign: 'center' }
          },
          margin: { left: 10, right: 10 }
        });
        doc.save(`Mentor_Students_${new Date().toISOString().slice(0,10)}.pdf`);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to generate export file.");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterLeaveMin('');
    setFilterLeaveMax('');
    setFilterODMin('');
    setFilterODMax('');
  };

  // ============================================================
  // CERTIFICATE MODAL HANDLERS
  // ============================================================
  const openCertificateModal = (cert) => {
    setSelectedCertificate(cert);
    setCertificateModalOpen(true);
  };

  const closeCertificateModal = () => {
    setCertificateModalOpen(false);
    setSelectedCertificate(null);
  };

  const downloadCertificate = () => {
    if (!selectedCertificate?.base64) return;
    const link = document.createElement('a');
    link.href = selectedCertificate.base64;
    link.download = `OD_Certificate_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- Loading State -----
  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-indigo-700 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">
          Loading Your Assigned <span className="text-amber-500">Student</span> List...
        </p>
      </div>
    );
  }

  // ----- Render -----
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-1 sm:p-4 md:p-6 max-w-7xl mx-auto text-gray-800 antialiased">

      {/* Header + Export */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
            <Users className="text-amber-500 shrink-0" size={24} />
            Assigned Student
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            View the profiles of students assigned to you and monitor their Leave and On-Duty activities from one place.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleExportReport('excel')}
            disabled={isExporting || filteredStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            type="button"
            onClick={() => handleExportReport('pdf')}
            disabled={isExporting || filteredStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or register..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            >
              {studentTypes.map(type => (
                <option key={type} value={type}>{type === 'ALL' ? 'All Types' : type}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Leave:</span>
              <input
                type="number"
                placeholder="Min"
                value={filterLeaveMin}
                onChange={(e) => setFilterLeaveMin(e.target.value)}
                className="w-12 px-1 py-1 border border-gray-200 rounded text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filterLeaveMax}
                onChange={(e) => setFilterLeaveMax(e.target.value)}
                className="w-12 px-1 py-1 border border-gray-200 rounded text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>OD:</span>
              <input
                type="number"
                placeholder="Min"
                value={filterODMin}
                onChange={(e) => setFilterODMin(e.target.value)}
                className="w-12 px-1 py-1 border border-gray-200 rounded text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filterODMax}
                onChange={(e) => setFilterODMax(e.target.value)}
                className="w-12 px-1 py-1 border border-gray-200 rounded text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 hover:text-indigo-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
          <span>{filteredStudents.length} students shown</span>
          <span>{students.length} total</span>
        </div>
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
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-8 text-center text-xs font-medium text-gray-400">
          No students match your filter criteria.
        </div>
      ) : (
        <div className="space-y-4">

          {/* ===== MOBILE CARDS ===== */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredStudents.map((st, index) => {
              const fullName = getFullName(st);
              const leaveDays = getLeaveCount(st);
              const odDays = getODCount(st);
              return (
                <div key={st._id || index} className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center font-mono text-[10px] font-black text-gray-400 shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-black text-indigo-900 tracking-wider block">{st.registerNo || st.register || 'N/A'}</span>
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
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs bg-indigo-900 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View Student Profile</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ===== DESKTOP / TABLET TABLE ===== */}
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
                  {filteredStudents.map((st, index) => {
                    const fullName = getFullName(st);
                    const leaveDays = getLeaveCount(st);
                    const odDays = getODCount(st);
                    return (
                      <tr key={st._id || index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 text-center font-mono font-bold text-gray-400">{index + 1}</td>
                        <td className="p-4 font-mono font-bold text-indigo-900">{st.registerNo || st.register || 'N/A'}</td>
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-900 hover:bg-amber-500 text-white rounded-xl transition-all shadow-sm group font-semibold cursor-pointer"
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

      {/* ===== PROFILE DRAWER ===== */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-indigo-900/20 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white border-l border-gray-300 shadow-2xl z-50 p-4 sm:p-6 flex flex-col space-y-5 sm:space-y-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-indigo-900">Student Profile</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-indigo-900 border border-gray-200 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 pr-0.5">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-2xl">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-900 rounded-xl flex items-center justify-center text-white font-bold sm:text-lg shrink-0">
                    {(selectedStudent.firstName?.[0] || selectedStudent.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-indigo-900 truncate">
                      {getFullName(selectedStudent)}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-mono font-medium truncate">{selectedStudent.email || 'No email saved'}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Student Information</h5>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><Hash size={14} /> Register Number</span>
                    <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[180px] text-right">{selectedStudent.registerNo || selectedStudent.register || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><ShieldCheck size={14} /> Student Type</span>
                    <span className="font-bold text-gray-800 truncate text-right">{selectedStudent.studentType || selectedStudent.student?.studentType || 'Regular Track'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><Phone size={14} /> Mobile Number</span>
                    <span className="font-mono font-bold text-gray-800 truncate text-right">{selectedStudent.mobileNo || selectedStudent.mobile || selectedStudent.student?.mobileNo || 'N/A'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><User size={14} /> Class Advisor 1</span>
                    <span className="font-semibold text-gray-700 truncate text-right">{selectedStudent.firstmentorName || selectedStudent.student?.firstmentorName || 'Assigned to Self'}</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><User2 size={14} /> Class Advisor 2</span>
                    <span className="font-semibold text-gray-700 truncate text-right">{selectedStudent.secondmentorName || selectedStudent.student?.secondmentorName || 'Assigned to Self'}</span>
                  </div>

                  {/* 🆕 Enrolled Date */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0"><Calendar size={14} /> Enrolled Date</span>
                    <span className="font-semibold text-gray-700 truncate text-right">{getEnrolledDate(selectedStudent)}</span>
                  </div>
                </div>

                {/* ========== CERTIFICATE GALLERY ========== */}
                {(() => {
                  const certs = getStudentCertificates(selectedStudent);
                  if (certs.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <h5 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Image size={12} /> OD Certificates ({certs.length})
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {certs.map((cert, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-indigo-900 truncate">{cert.reason}</p>
                              <p className="text-[10px] text-gray-500">
                                {cert.fromDate} {cert.fromDate !== 'N/A' && 'to'} {cert.toDate}
                              </p>
                            </div>
                            <button
                              onClick={() => openCertificateModal(cert)}
                              className="shrink-0 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-sm"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Analytics summary */}
                <div className="p-4 bg-indigo-900 text-white rounded-2xl space-y-3 shadow-md">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1"><Calendar size={12} /> Leave & OD Analytics Summary</h5>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xl sm:text-2xl font-black text-amber-400">
                        {getLeaveCount(selectedStudent)}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase mt-0.5 tracking-wider">Leave Days</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xl sm:text-2xl font-black text-amber-400">
                        {getODCount(selectedStudent)}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase mt-0.5 tracking-wider">OD Approvals</p>
                    </div>
                  </div>
                </div>

                {/* Recent Applications */}
                <div className="space-y-2">
                  <h5 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} /> Recent Applications
                  </h5>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                    {(!selectedStudent.leaves || selectedStudent.leaves.length === 0) &&
                     (!selectedStudent.ods || selectedStudent.ods.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No recent applications found.</p>
                    )}
                    {selectedStudent.leaves?.map((item, idx) => (
                      <div key={`leave-${idx}`} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-indigo-900 shrink-0">Leave</span>
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

      {/* ===== CERTIFICATE MODAL ===== */}
      <AnimatePresence>
        {certificateModalOpen && selectedCertificate && (
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
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Image size={18} className="text-amber-500" />
                    Certificate for: {selectedCertificate.reason}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCertificate.fromDate} {selectedCertificate.fromDate !== 'N/A' && 'to'} {selectedCertificate.toDate}
                  </p>
                </div>
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
                  src={selectedCertificate.base64}
                  alt="OD Certificate"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="text-center text-sm text-gray-500">
                        <p>⚠️ Failed to load certificate image.</p>
                        <p class="text-xs text-gray-400 mt-2">The file may be corrupted or unavailable.</p>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="p-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Certificate for On-Duty.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentList;