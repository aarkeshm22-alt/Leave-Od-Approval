import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, Clock, History, Calendar, User, FileText, Hash, Filter, Download, FileSpreadsheet, Layers3, Sparkles, Loader2, X, Check, ShieldAlert
} from 'lucide-react';
import axios from 'axios';

// Vite-safe named imports from sheetJS
import { utils, writeFile } from 'xlsx';

// Client-side premium PDF generator blocks - FIXED FOR VITE
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'ACTIONED'
  const [isExporting, setIsExporting] = useState(false);

  // Filter Workbench Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterMentor, setFilterMentor] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchApprovalPipeline = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const configHeaders = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };

      const [leavesResponse, odResponse] = await Promise.all([
        axios.get(`https://leave-od-approval.onrender.com/api/leaves/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`https://leave-od-approval.onrender.com/api/od/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } }))
      ]);

      const rawLeaves = leavesResponse.data?.data || leavesResponse.data || [];
      const rawODs = odResponse.data?.data || odResponse.data || [];

      // Maps Leaves using flat root properties returned by your updated controller mapping layer
      const formattedLeaves = Array.isArray(rawLeaves) ? rawLeaves.map(leave => ({
        id: leave.id || leave._id,
        registerNo: leave.registerNo || 'N/A',
        createdAt: leave.createdAt || new Date(),
        student: leave.studentName || 'Unknown Student',
        class: leave.type || 'Leave',
        route: 'Mentor Verified',
        scope: leave.reason || 'No description supplied',
        status: leave.status,
        mentorName: leave.firstMentorName || 'Unassigned Advisor',
        year: leave.year || 'N/A',
        section: leave.section || 'N/A'
      })) : [];

      // Maps On-Duty logs cleanly capturing your aggregate payload layout structure
      const formattedODs = Array.isArray(rawODs) ? rawODs.map(od => {
        const studentObj = od.student || {};
        return {
          id: od.id || od._id,
          registerNo: od.registerNo || studentObj.registerNo || 'N/A',
          createdAt: od.createdAt || new Date(),
          student: od.studentName || studentObj.name || 'Unknown Student',
          class: 'On-Duty',
          route: 'Mentor Verified',
          scope: od.reason || `Event Venue Setup`,
          status: od.status,
          mentorName: studentObj.firstmentorName || od.mentorName || 'Unassigned Advisor',
          year: studentObj.year || 'N/A',
          section: studentObj.section || 'N/A'
        };
      }) : [];

      const unifiedPool = [...formattedLeaves, ...formattedODs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setItems(unifiedPool);
    } catch (error) {
      console.error('Failed bringing up authorization matrix data elements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalPipeline();
  }, [activeTab]);

  const pendingItems = items.filter(i => i.status === 'Partially Approved' || i.status === 'Approved By Mentor');
  const baseTabItems = activeTab === 'PENDING' ? pendingItems : items.filter(i => i.status === 'Approved' || i.status === 'Rejected');

  // Unified In-Memory Structural Query Matcher Engine
  const activeDisplayItems = baseTabItems.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.registerNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = filterYear === '' || item.year === filterYear;
    const matchesSection = filterSection === '' || item.section.toUpperCase() === filterSection.toUpperCase();
    const matchesMentor = filterMentor === '' || item.mentorName.toLowerCase().includes(filterMentor.toLowerCase());

    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const itemDate = new Date(item.createdAt);
      if (filterStartDate && itemDate < new Date(filterStartDate)) matchesDate = false;
      if (filterEndDate) {
        const endRangeBound = new Date(filterEndDate);
        endRangeBound.setHours(23, 59, 59, 999);
        if (itemDate > endRangeBound) matchesDate = false;
      }
    }

    return matchesSearch && matchesYear && matchesSection && matchesMentor && matchesDate;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === activeDisplayItems.length ? [] : activeDisplayItems.map(i => i.id));
  };

  // =========================================================================
  // CORE LOCAL COMPILE AND EXPORT CONTROLLER (EXCEL + REAL PDF)
  // =========================================================================
  const handleExportReport = (format) => {
    if (activeDisplayItems.length === 0) {
      alert("No data records match filters inside the viewport.");
      return;
    }

    setIsExporting(true);
    try {
      // 1. Structure rows layout arrays cleanly matching your dashboard headers
      const formattedRows = activeDisplayItems.map(row => {
        const d = new Date(row.createdAt);
        const dateStr = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : 'N/A';
        return {
          "Register No": row.registerNo || 'N/A',
          "Student Name": row.student || 'Unknown Student',
          "Year": row.year || 'N/A',
          "Section": row.section || 'N/A',
          "Faculty Mentor (CA1)": row.mentorName || 'Unassigned Advisor',
          "Reason": row.scope || 'No description supplied',
          "Category": row.class || 'N/A',
          "Status": row.status || 'N/A',
          "Date Applied": dateStr
        };
      });

      // ----------------- GENUINE EXCEL COMPILATION ROUTINE -----------------
      if (format === 'excel') {
        const worksheet = utils.json_to_sheet(formattedRows);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Compliance Report");

        // Triggers the direct browser file placement stream
        writeFile(workbook, `Compliance_Audit_Log_${activeTab}_${Date.now()}.xlsx`);
      }
      // ----------------- GENUINE PDF COMPILATION ROUTINE -----------------
      else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Decorative Header Accents
        doc.setFillColor(15, 23, 42); // Deep corporate slate gray fill
        doc.rect(0, 0, 297, 24, 'F');

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text("Departmental Ledger Compliance Report", 14, 11);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(203, 213, 225);
        doc.text(`Active Scope: HOD ${activeTab} Ledger Pipeline Trail`, 14, 18);

        // Subtitle Filters Context Card Meta Grid
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Matching Filter Bound Records Count: ${activeDisplayItems.length}`, 14, 32);

        const tableHeaders = [["Register No", "Student Name", "Year & Section", "Faculty Mentor (CA1)", "Reason", "Category", "Status"]];
        const tableBody = activeDisplayItems.map(row => [
          row.registerNo,
          row.student,
          `${row.year} - ${row.section}`,
          row.mentorName,
          row.scope,
          row.class.toUpperCase(),
          row.status
        ]);

        //  Perfectly functional named execution passing the 'doc' instance manually
        autoTable(doc, {
          head: tableHeaders,
          body: tableBody,
          startY: 38,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 32 },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 45 },
            5: { cellWidth: 25 },
            6: { fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
        });
        doc.save(`Report_CSE_${Date.now()}.pdf`);
      }

    } catch (err) {
      console.error("Local client binary compilation runtime error:", err);
      alert("Failed compiling report metrics data map properties.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSingleAction = async (targetId, actionType, docCategory) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const configHeaders = {
        headers: { 'Authorization': `Bearer ${cleanToken}`, 'Content-Type': 'application/json' }
      };

      if (docCategory === 'On-Duty') {
        await axios.patch(`http://localhost:5000/api/od/${targetId}/action`, {
          action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
          remarks: actionType === 'approve' ? 'Final Clearance Appended' : 'Rejected'
        }, configHeaders);
      } else {
        await axios.patch(`http://localhost:5000/api/leaves/${targetId}/hod-approve`, { action: actionType }, configHeaders);
      }

      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      setItems(prev => prev.map(item => item.id === targetId ? { ...item, status: finalDbStatus } : item));
      setSelectedIds(prev => prev.filter(id => id !== targetId));
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  const handleBulkAction = async (actionType) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';

      const targetedItems = items.filter(item => selectedIds.includes(item.id));
      const leaveIds = targetedItems.filter(i => i.class !== 'On-Duty').map(i => i.id);
      const odIds = targetedItems.filter(i => i.class === 'On-Duty').map(i => i.id);

      const networkRequestsPool = [];

      if (leaveIds.length > 0) {
        networkRequestsPool.push(
          axios.post('http://localhost:5000/api/leaves/bulk-status-update', { ids: leaveIds, status: finalDbStatus }, {
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          })
        );
      }

      if (odIds.length > 0) {
        odIds.forEach(id => {
          networkRequestsPool.push(
            axios.patch(`http://localhost:5000/api/od/${id}/action`, {
              action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
              remarks: actionType === 'approve' ? 'Bulk Approved' : 'Bulk Rejected'
            }, { headers: { 'Authorization': `Bearer ${cleanToken}` } })
          );
        });
      }

      await Promise.all(networkRequestsPool);
      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: finalDbStatus } : item));
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk process error:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Loader2 className="animate-spin text-blue-600" size={26} />
        <span className="text-xs font-medium tracking-wide text-slate-500">Syncing live request architecture...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12 antialiased text-slate-800">

      {/* Upper Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Institutional Approvals Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dual-stream leaves and on-duty workflow processing panel.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl self-start md:self-auto">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{pendingItems.length} Waiting Reviews</span>
        </div>
      </div>

      {/* Mode Switches Tabs Row */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button
          type="button" onClick={() => { setActiveTab('PENDING'); setSelectedIds([]); }}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold tracking-tight border-b-2 transition-all ${activeTab === 'PENDING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
        >
          <Clock size={14} /> Pending Request(s)
        </button>
        <button
          type="button" onClick={() => { setActiveTab('ACTIONED'); setSelectedIds([]); }}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold tracking-tight border-b-2 transition-all ${activeTab === 'ACTIONED' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
        >
          <History size={14} /> Approval History Ledger
        </button>
      </div>

      {/* Filter Options Query Console Workspace widget card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={13} className="text-slate-400" />
            <span>Structured Data Query Workspace Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" disabled={isExporting} onClick={() => handleExportReport('excel')}
              className="flex items-center gap-1.5 py-1.5 px-3 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-all shadow-3xs"
            >
              <FileSpreadsheet size={12} /> Compile Excel
            </button>
            <button
              type="button" disabled={isExporting} onClick={() => handleExportReport('pdf')}
              className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-all shadow-3xs"
            >
              <Download size={12} /> Compile PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Search Identity</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name / Reg No..." className="border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Cohort Year</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
              <option value="">-- All Years --</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
              <option value="">-- All Sections --</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Faculty Mentor (CA1)</label>
            <input type="text" value={filterMentor} onChange={(e) => setFilterMentor(e.target.value)} placeholder="Advisor Title..." className="border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Bulk Operations Overlay Banner row */}
      <AnimatePresence>
        {selectedIds.length > 0 && activeTab === 'PENDING' && (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl shadow-md text-white">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} className="text-blue-400" />
              <p className="text-xs font-medium text-slate-300"><span className="font-bold text-white">{selectedIds.length}</span> items inside filtering scope selected.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button type="button" onClick={() => handleBulkAction('reject')} className="py-2 px-3 text-[11px] font-bold rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/20 w-full sm:w-auto">Reject Bulk</button>
              <button type="button" onClick={() => handleBulkAction('approve')} className="py-2 px-4 text-[11px] font-bold rounded-lg bg-white text-slate-950 w-full sm:w-auto">Approve Bulk</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core Columns Matrix Table Component structure */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:grid lg:grid-cols-12 gap-4 items-center">
          <div className="col-span-2 flex items-center gap-3">
            {activeTab === 'PENDING' && activeDisplayItems.length > 0 && (
              <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 shrink-0">
                {selectedIds.length === activeDisplayItems.length ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} />}
              </button>
            )}
            <span className="flex items-center gap-1"><Hash size={11} /> Register No</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5"><User size={12} /> Student Identity</div>
          <div className="col-span-2 flex items-center gap-1.5"><Layers3 size={12} /> Cohort / Section</div>
          <div className="col-span-2 flex items-center gap-1.5"><User size={12} /> Faculty Mentor (CA1)</div>
          <div className="col-span-2 flex items-center gap-1.5"><FileText size={12} /> Reason Context</div>
          <div className="col-span-1 text-center">Category</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {activeDisplayItems.map((row) => {
            const isSelected = selectedIds.includes(row.id);
            const rawDate = new Date(row.createdAt);
            const formattedDate = !isNaN(rawDate.getTime()) ? `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}` : 'N/A';

            return (
              <div key={row.id} className={`p-4 lg:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center transition-all ${isSelected ? 'bg-blue-50/20' : 'bg-white hover:bg-slate-50/10'}`}>

                <div className="lg:col-span-2 flex items-center gap-3 min-w-0">
                  {activeTab === 'PENDING' && (
                    <button type="button" onClick={() => toggleSelect(row.id)} className="text-slate-300 hover:text-slate-500 shrink-0">
                      {isSelected ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} />}
                    </button>
                  )}
                  <div className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100/60 px-2 py-0.5 rounded text-[11px] tracking-tight">
                    {row.registerNo}
                  </div>
                </div>

                <div className="lg:col-span-2 font-bold text-slate-800 text-[13px] lg:text-xs truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Student</span>
                  {row.student}
                  <div className="text-[10px] text-slate-400 font-medium block lg:hidden mt-0.5">Applied: {formattedDate}</div>
                </div>

                <div className="lg:col-span-2 font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="lg:hidden text-[9px] uppercase font-bold text-slate-400 mr-1.5">Cohort Group:</span>
                  <div className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200/50 font-semibold">
                    {row.year} — {row.section}
                  </div>
                </div>

                <div className="lg:col-span-2 font-medium text-slate-700 truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Faculty Advisor (CA1)</span>
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden lg:inline-block mr-1" />
                    <span className="italic font-bold text-slate-700 text-[11px] lg:text-xs">{row.mentorName}</span>
                  </div>
                </div>

                <div className="lg:col-span-2 text-slate-500 font-medium truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Reason Statement</span>
                  {row.scope}
                </div>

                <div className="lg:col-span-1 lg:text-center flex items-center">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${row.class === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>
                    {row.class}
                  </span>
                </div>

                <div className="lg:col-span-1 flex flex-row lg:flex-row-reverse justify-between lg:justify-start items-center gap-2 pt-2.5 lg:pt-0 border-t border-slate-100 lg:border-none mt-1 lg:mt-0">
                  {row.status === 'Partially Approved' || row.status === 'Approved By Mentor' || row.status === 'Pending' ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <button type="button" onClick={() => handleSingleAction(row.id, 'reject', row.class)} className="p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><X size={12} /></button>
                      <button type="button" onClick={() => handleSingleAction(row.id, 'approve', row.class)} className="p-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg transition-all"><Check size={12} /></button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-auto ${row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {row.status === 'Approved' ? 'Cleared' : 'Declined'}
                    </span>
                  )}
                </div>

              </div>
            );
          })}

          {activeDisplayItems.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
              <Sparkles size={16} className="text-slate-300" />
              <p className="text-slate-800 text-xs font-bold">No Records Match Filters</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Approvals;