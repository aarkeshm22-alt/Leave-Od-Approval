import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Loader2,
  Briefcase,
  GraduationCap,
  PieChart as PieIcon,
  BarChart as BarIcon,
  RefreshCw,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BASE_URL = 'https://leave-od-approval.onrender.com';

const MentorTodayAbsence = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [absenceData, setAbsenceData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  const COLORS = ['#4F46E5', '#F59E0B'];

  const getSectionLetter = (section) => {
    if (!section || section === 'N/A') return 'N/A';
    const trimmed = section.trim().toUpperCase();
    if (trimmed.includes('SECTION')) {
      const parts = trimmed.split(' ');
      return parts[parts.length - 1];
    }
    return trimmed;
  };

  const isActiveToday = (fromDate, toDate) => {
    if (!fromDate || !toDate) return false;
    const today = new Date();
    const todayMidnight = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const from = new Date(fromDate);
    const fromMidnight = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const to = new Date(toDate);
    const toMidnight = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    return fromMidnight.getTime() <= todayMidnight.getTime() && todayMidnight.getTime() <= toMidnight.getTime();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        setErrorMsg('Authentication missing. Please log in again.');
        setLoading(false);
        return;
      }

      const cleanToken = token.replace(/"/g, '').trim();
      const config = {
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      };

      // Fetch mentor's students (includes leaves and ods)
      const studentsRes = await fetch(`${BASE_URL}/api/mentor/my-students`, {
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      const studentsData = await studentsRes.json();
      const students = studentsData?.data || [];

      // Flatten all leaves and ODs from all students into one array with student info
      const allRequests = [];
      students.forEach(student => {
        // Leaves
        (student.leaves || []).forEach(leave => {
          allRequests.push({
            ...leave,
            _id: leave._id || leave.id,
            student: student,
            year: student.year || 'N/A',
            section: student.section || 'N/A',
            sectionLetter: getSectionLetter(student.section),
            studentName: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
            registerNo: student.registerNo || 'N/A',
            type: 'Leave'
          });
        });
        // ODs
        (student.ods || []).forEach(od => {
          allRequests.push({
            ...od,
            _id: od._id || od.id,
            student: student,
            year: student.year || 'N/A',
            section: student.section || 'N/A',
            sectionLetter: getSectionLetter(student.section),
            studentName: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
            registerNo: student.registerNo || 'N/A',
            type: 'On-Duty'
          });
        });
      });

      // Filter: only Approved or Partially Approved, and active today
      const todayAbsences = allRequests.filter(item => {
        if (item.status !== 'Approved' && item.status !== 'Partially Approved') return false;
        return isActiveToday(item.fromDate, item.toDate);
      });

      // Sort by year → section → student name
      const sorted = todayAbsences.sort((a, b) => {
        const yearA = a.year || '';
        const yearB = b.year || '';
        const secA = a.sectionLetter || '';
        const secB = b.sectionLetter || '';
        const nameA = a.studentName || '';
        const nameB = b.studentName || '';
        if (yearA !== yearB) return yearA.localeCompare(yearB);
        if (secA !== secB) return secA.localeCompare(secB);
        return nameA.localeCompare(nameB);
      });

      setAbsenceData(sorted);

      // Group by year + section
      const groups = {};
      sorted.forEach(item => {
        const key = `${item.year} - ${item.sectionLetter}`;
        if (!groups[key]) {
          groups[key] = {
            year: item.year,
            section: item.sectionLetter,
            leaves: 0,
            ods: 0,
            total: 0,
            items: []
          };
        }
        if (item.type === 'Leave') {
          groups[key].leaves += 1;
        } else {
          groups[key].ods += 1;
        }
        groups[key].total += 1;
        groups[key].items.push(item);
      });
      setGroupedData(groups);

    } catch (error) {
      console.error('Failed to fetch mentor today\'s absence data:', error);
      setErrorMsg('Could not load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  // Export functions (identical to HOD version)
  const handleExportExcel = () => {
    if (absenceData.length === 0) {
      alert('No data to export.');
      return;
    }
    setIsExporting(true);
    try {
      const exportRows = absenceData.map(item => ({
        'Year': item.year || 'N/A',
        'Section': item.sectionLetter || 'N/A',
        'Register No': item.registerNo || 'N/A',
        'Student Name': item.studentName || 'Unknown',
        'Reason': item.reason || 'No reason',
        'Type': item.type || 'On-Duty',
        'From Date': item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        'To Date': item.toDate ? new Date(item.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
      }));
      const worksheet = utils.json_to_sheet(exportRows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Today's Absence");
      writeFile(workbook, `Mentor_Today_Absence_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('Failed to export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (absenceData.length === 0) {
      alert('No data to export.');
      return;
    }
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 24, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 24, 297, 2.5, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Mentor's Today's Absence Report", 14, 13);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Students Count: ${absenceData.length}`, 14, 20);

      const tableHeaders = [["Year", "Section", "Reg No", "Student Name", "Reason", "Type", "From Date", "To Date"]];
      const tableBody = absenceData.map(item => [
        item.year || 'N/A',
        item.sectionLetter || 'N/A',
        item.registerNo || 'N/A',
        item.studentName || 'Unknown',
        item.reason || 'No reason',
        item.type || 'On-Duty',
        item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        item.toDate ? new Date(item.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableBody,
        startY: 32,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9, halign: 'center', valign: 'middle' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 18 },
          2: { cellWidth: 28 },
          3: { cellWidth: 38 },
          4: { cellWidth: 40 },
          5: { cellWidth: 22 },
          6: { cellWidth: 28 },
          7: { cellWidth: 28 }
        },
        margin: { left: 12, right: 12 },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.3,
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount}  •  Generated by Mentor Dashboard`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
      doc.save(`Mentor_Today_Absence_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    const leaves = absenceData.filter(d => d.type === 'Leave').length;
    const ods = absenceData.length - leaves;
    return [
      { name: 'Leave', value: leaves },
      { name: 'On-Duty', value: ods },
    ];
  }, [absenceData]);

  const barData = useMemo(() => {
    const keys = Object.keys(groupedData).sort();
    return keys.map(key => ({
      name: key,
      Leave: groupedData[key].leaves,
      'On-Duty': groupedData[key].ods,
      total: groupedData[key].total,
    }));
  }, [groupedData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-indigo-700 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">
          Loading Today's <span className="text-amber-500">Absence</span> Data...
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 sm:p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
        <AlertCircle size={14} className="shrink-0" />
        <span>{errorMsg}</span>
        <button onClick={fetchData} className="ml-auto px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const totalAbsences = absenceData.length;
  const groupKeys = Object.keys(groupedData).sort();
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const leaveData = absenceData.filter(item => item.type === 'Leave');
  const odData = absenceData.filter(item => item.type === 'On-Duty');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6 font-sans pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-amber-500" size={24} />
            Today's Absence Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Your students on approved Leave or On‑Duty Today {' '} <span>({new Date().toLocaleDateString()})</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 rounded-full">
            <Users size={14} className="text-amber-500" />
            <span className="font-medium">{totalAbsences} {totalAbsences === 1 ? 'student' : 'students'}</span>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={14} className="text-slate-500" />
            <span>Refresh</span>
          </button>
          <button onClick={handleExportExcel} disabled={isExporting || absenceData.length === 0} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button onClick={handleExportPDF} disabled={isExporting || absenceData.length === 0} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-full hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <PieIcon size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-900">Absence Split</h3>
          </div>
          <div className="w-full" style={{ height: '240px' }}>
            {chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#9ca3af', strokeWidth: 1, length: 15, length2: 10 }}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BarIcon size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-indigo-900">Absences by Year & Section</h3>
          </div>
          <div className="w-full" style={{ height: '240px' }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, angle: -15, textAnchor: 'end' }} height={50} interval={0} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="Leave" stackId="stack" fill={COLORS[0]} />
                  <Bar dataKey="On-Duty" stackId="stack" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-slate-400">No data</div>}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {groupKeys.map((key) => {
          const group = groupedData[key];
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-600 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-900 truncate">{key}</h3>
                </div>
                <span className="text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
                  {group.total} {group.total !== 1 ? 'students' : 'student'}
                </span>
              </div>
              <div className="flex gap-3 text-[10px] sm:text-xs">
                <span className="font-medium text-slate-600">
                  <span className="text-indigo-600 font-bold">{group.leaves}</span> Leave
                </span>
                <span className="font-medium text-slate-600">
                  <span className="text-amber-600 font-bold">{group.ods}</span> On‑Duty
                </span>
              </div>
            </div>
          );
        })}
        {groupKeys.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-400">
            No approved absences today. All students are present!
          </div>
        )}
      </div>

      {/* Tables */}
      {leaveData.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />
            Today's Leave Requests — {leaveData.length}
          </h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[10px] sm:text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-2 sm:p-4 pl-3 sm:pl-6">Year</th><th className="p-2 sm:p-4">Section</th>
                    <th className="p-2 sm:p-4">Reg No</th><th className="p-2 sm:p-4">Student Name</th>
                    <th className="p-2 sm:p-4">Reason</th><th className="p-2 sm:p-4">From Date</th>
                    <th className="p-2 sm:p-4">To Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 sm:p-4 pl-3 sm:pl-6 font-medium text-slate-800">{item.year}</td>
                      <td className="p-2 sm:p-4 font-medium text-slate-800">{item.sectionLetter}</td>
                      <td className="p-2 sm:p-4 font-mono font-bold text-indigo-900">{item.registerNo}</td>
                      <td className="p-2 sm:p-4 font-bold text-slate-900">{item.studentName}</td>
                      <td className="p-2 sm:p-4 max-w-[100px] sm:max-w-xs truncate text-slate-600" title={item.reason}>{item.reason}</td>
                      <td className="p-2 sm:p-4 font-mono text-slate-600">{formatDate(item.fromDate)}</td>
                      <td className="p-2 sm:p-4 font-mono text-slate-600">{formatDate(item.toDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {odData.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-amber-500" />
            Today's On-Duty Requests — {odData.length}
          </h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[10px] sm:text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-2 sm:p-4 pl-3 sm:pl-6">Year</th><th className="p-2 sm:p-4">Section</th>
                    <th className="p-2 sm:p-4">Reg No</th><th className="p-2 sm:p-4">Student Name</th>
                    <th className="p-2 sm:p-4">Reason</th><th className="p-2 sm:p-4">From Date</th>
                    <th className="p-2 sm:p-4">To Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {odData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2 sm:p-4 pl-3 sm:pl-6 font-medium text-slate-800">{item.year}</td>
                      <td className="p-2 sm:p-4 font-medium text-slate-800">{item.sectionLetter}</td>
                      <td className="p-2 sm:p-4 font-mono font-bold text-indigo-900">{item.registerNo}</td>
                      <td className="p-2 sm:p-4 font-bold text-slate-900">{item.studentName}</td>
                      <td className="p-2 sm:p-4 max-w-[100px] sm:max-w-xs truncate text-slate-600" title={item.reason}>{item.reason}</td>
                      <td className="p-2 sm:p-4 font-mono text-slate-600">{formatDate(item.fromDate)}</td>
                      <td className="p-2 sm:p-4 font-mono text-slate-600">{formatDate(item.toDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {absenceData.length === 0 && (
        <div className="text-center py-8 text-slate-400">No approved absences today. All students are present!</div>
      )}
    </motion.div>
  );
};

export default MentorTodayAbsence;