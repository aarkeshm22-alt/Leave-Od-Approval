import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, Clock, History, User, FileText, Hash, Filter, Download, FileSpreadsheet, Layers3, Sparkles, Loader, X, Check, ShieldAlert, RotateCcw,
  Tags,
  Workflow
} from 'lucide-react';
import axios from 'axios';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BASE_URL = 'https://leave-od-approval.onrender.com';

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [isExporting, setIsExporting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterMentor, setFilterMentor] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const normalizeYear = (year) => {
    if (!year || year === 'N/A') return 'N/A';
    const map = {
      '1st Year': 'I Year',
      '2nd Year': 'II Year',
      '3rd Year': 'III Year',
      '4th Year': 'IV Year',
      'I Year': 'I Year',
      'II Year': 'II Year',
      'III Year': 'III Year',
      'IV Year': 'IV Year',
    };
    return map[year] || year;
  };

  const getSectionLetter = (section) => {
    if (!section || section === 'N/A') return 'N/A';
    const trimmed = section.trim().toUpperCase();
    if (trimmed.includes('SECTION')) {
      const parts = trimmed.split(' ');
      return parts[parts.length - 1];
    }
    return trimmed;
  };

  const sortForExport = (a, b) => {
    if (a.class === 'Leave' && b.class !== 'Leave') return -1;
    if (a.class !== 'Leave' && b.class === 'Leave') return 1;

    const yearOrder = { 'I Year': 1, 'II Year': 2, 'III Year': 3, 'IV Year': 4 };
    const aYear = a.year || 'N/A';
    const bYear = b.year || 'N/A';
    const aNum = yearOrder[aYear] || 99;
    const bNum = yearOrder[bYear] || 99;
    if (aNum !== bNum) return aNum - bNum;

    const aSection = getSectionLetter(a.section);
    const bSection = getSectionLetter(b.section);
    if (aSection !== 'N/A' && bSection !== 'N/A') {
      return aSection.localeCompare(bSection);
    }
    return 0;
  };

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
        axios.get(`${BASE_URL}/api/leaves/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`${BASE_URL}/api/od/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } }))
      ]);

      const rawLeaves = leavesResponse.data?.data || leavesResponse.data || [];
      const rawODs = odResponse.data?.data || odResponse.data || [];

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
        year: normalizeYear(leave.year || 'N/A'),
        section: leave.section || 'N/A'
      })) : [];

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
          year: normalizeYear(studentObj.year || 'N/A'),
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

  const activeDisplayItems = baseTabItems.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.registerNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = filterYear === '' ||
      item.year === 'N/A' ||
      item.year.toLowerCase() === filterYear.toLowerCase();

    const itemSection = getSectionLetter(item.section);
    const filterSec = filterSection ? getSectionLetter(filterSection) : '';
    const matchesSection = filterSection === '' ||
      item.section === 'N/A' ||
      itemSection === filterSec;

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

  const clearFilters = () => {
    setSearchQuery('');
    setFilterYear('');
    setFilterSection('');
    setFilterMentor('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleExportReport = (format) => {
    if (activeDisplayItems.length === 0) {
      alert("No data records match filters inside the viewport.");
      return;
    }

    setIsExporting(true);
    try {
      const sortedForExport = [...activeDisplayItems].sort(sortForExport);

      const excelRows = sortedForExport.map(row => ({
        "Register No": row.registerNo || 'N/A',
        "Student Name": row.student || 'Unknown Student',
        "Year": row.year || 'N/A',
        "Section": getSectionLetter(row.section),
        "Faculty Mentor (CA1)": row.mentorName || 'Unassigned Advisor',
        "Reason": row.scope || 'No description supplied',
        "Category": row.class || 'N/A',
        "Status": row.status || 'N/A',
        "Date Applied": !isNaN(new Date(row.createdAt).getTime())
          ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A'
      }));

      if (format === 'excel') {
        const worksheet = utils.json_to_sheet(excelRows);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Compliance Report");
        writeFile(workbook, `Compliance_Audit_Log_${activeTab}_${Date.now()}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 28, 'F');
        doc.setFillColor(245, 158, 11);
        doc.rect(0, 28, 297, 2.5, 'F');

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("Departmental Compliance Report", 14, 13);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(203, 213, 225);
        doc.text(`HOD ${activeTab} Ledger Pipeline Trail`, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const dateStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Generated: ${dateStr}  •  Records: ${activeDisplayItems.length}`, 14, 38);

        const tableHeaders = [
          ["Reg No", "Student Name", "Year", "Sec", "Faculty Mentor (CA1)", "Reason", "Category", "Status"]
        ];

        const tableBody = sortedForExport.map(row => [
          row.registerNo || 'N/A',
          row.student || 'Unknown Student',
          row.year || 'N/A',
          getSectionLetter(row.section),
          row.mentorName || 'Unassigned Advisor',
          row.scope || 'No description supplied',
          row.class || 'N/A',
          row.status || 'N/A'
        ]);

        autoTable(doc, {
          head: tableHeaders,
          body: tableBody,
          startY: 44,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [30, 41, 59],
          },
          rowStyles: (row) => {
            if (row.raw && row.raw.length > 7) {
              const status = String(row.raw[7]).toLowerCase().trim();
              if (status === 'approved') {
                return { fillColor: [209, 250, 229] };
              } else if (status === 'rejected') {
                return { fillColor: [254, 205, 211] };
              }
            }
            return {};
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 26 },
            1: { cellWidth: 38 },
            2: { cellWidth: 18 },
            3: { cellWidth: 14 },
            4: { cellWidth: 44 },
            5: { cellWidth: 40 },
            6: { cellWidth: 22 },
            7: { fontStyle: 'bold', cellWidth: 24, halign: 'center' },
          },
          margin: { left: 12, right: 12 },
          pageBreak: 'auto',
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.3,
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Page ${i} of ${pageCount}  •  Generated by HOD Approval System`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
          );
        }

        doc.save(`Compliance_Report_${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error("Local client binary compilation runtime error:", err);
      alert("Failed compiling report metrics data map properties.");
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ FIXED: Separate endpoints for approve and reject on Leaves
  const handleSingleAction = async (targetId, actionType, docCategory) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const configHeaders = {
        headers: { 'Authorization': `Bearer ${cleanToken}`, 'Content-Type': 'application/json' }
      };

      let response;

      if (docCategory === 'On-Duty') {
        // OD uses unified action endpoint
        response = await axios.patch(`${BASE_URL}/api/od/${targetId}/action`, {
          action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
          remarks: actionType === 'approve' ? 'Final Clearance Appended' : 'Rejected'
        }, configHeaders);
      } else {
        // Leave uses separate endpoints
        if (actionType === 'approve') {
          response = await axios.patch(`${BASE_URL}/api/leaves/${targetId}/hod-approve`, 
            { remarks: 'Approved by HOD' }, 
            configHeaders
          );
        } else {
          // ✅ REJECT: use dedicated reject endpoint
          response = await axios.patch(`${BASE_URL}/api/leaves/${targetId}/hod-reject`, 
            { remarks: 'Rejected by HOD' }, 
            configHeaders
          );
        }
      }

      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      setItems(prev => prev.map(item => item.id === targetId ? { ...item, status: finalDbStatus } : item));
      setSelectedIds(prev => prev.filter(id => id !== targetId));
    } catch (err) {
      console.error("Action error:", err);
      alert(err.response?.data?.message || 'Action failed. Please try again.');
      throw err;
    }
  };

  // ✅ FIXED: Bulk action with separate endpoints for Leaves
  const handleBulkAction = async (actionType) => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const configHeaders = {
        headers: { 'Authorization': `Bearer ${cleanToken}`, 'Content-Type': 'application/json' }
      };

      const promises = selectedIds.map(async (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        if (item.class === 'On-Duty') {
          await axios.patch(`${BASE_URL}/api/od/${id}/action`, {
            action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
            remarks: actionType === 'approve' ? 'Bulk Approved' : 'Bulk Rejected'
          }, configHeaders);
        } else {
          // Leave: separate endpoints
          if (actionType === 'approve') {
            await axios.patch(`${BASE_URL}/api/leaves/${id}/hod-approve`, 
              { remarks: 'Bulk Approved by HOD' }, 
              configHeaders
            );
          } else {
            await axios.patch(`${BASE_URL}/api/leaves/${id}/hod-reject`, 
              { remarks: 'Bulk Rejected by HOD' }, 
              configHeaders
            );
          }
        }
      });

      await Promise.all(promises);

      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      setItems(prev =>
        prev.map(item =>
          selectedIds.includes(item.id)
            ? { ...item, status: finalDbStatus }
            : item
        )
      );
      setSelectedIds([]);
      alert(`Successfully ${actionType === 'approve' ? 'approved' : 'rejected'} ${selectedIds.length} request(s).`);
    } catch (err) {
      console.error("Bulk process error:", err);
      alert(`Bulk action failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    if (tab === 'PENDING') {
      clearFilters();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] sm:min-h-[700px] md:min-h-[700px] text-gray-400 font-sans px-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-black tracking-widest uppercase text-gray-500 animate-pulse text-center">
            Fetching the <span className='text-amber-600'>Pending</span> Records
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
    <div className="space-y-6 font-sans pb-12 antialiased text-slate-800">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-indigo-900 tracking-tight">HOD Approvals</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dual‑stream leaves and on‑duty request processing panel.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-2 rounded-xl self-start md:self-auto">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{pendingItems.length} Waiting Requests</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button
          type="button" onClick={() => handleTabChange('PENDING')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold tracking-tight border-b-2 transition-all ${activeTab === 'PENDING' ? 'border-amber-500 text-indigo-900' : 'border-transparent text-slate-400 hover:text-indigo-700'}`}
        >
          <Clock size={14} /> Pending Request(s)
        </button>
        <button
          type="button" onClick={() => handleTabChange('ACTIONED')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-bold tracking-tight border-b-2 transition-all ${activeTab === 'ACTIONED' ? 'border-amber-500 text-indigo-900' : 'border-transparent text-slate-400 hover:text-indigo-700'}`}
        >
          <History size={14} /> Approval History
        </button>
      </div>

      {activeTab === 'ACTIONED' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Filter size={13} className="text-amber-500" />
              <span>Filter</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={clearFilters}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[11px] rounded-lg transition-all shadow-3xs"
              >
                <RotateCcw size={12} /> Clear
              </button>
              <button
                type="button" disabled={isExporting} onClick={() => handleExportReport('excel')}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-green-200 bg-green-100 hover:bg-green-200 text-green-700 font-bold text-[11px] rounded-lg transition-all shadow-3xs"
              >
                <FileSpreadsheet size={12} /> Excel
              </button>
              <button
                type="button" disabled={isExporting} onClick={() => handleExportReport('pdf')}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-red-900 bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] rounded-lg transition-all shadow-3xs"
              >
                <Download size={12} /> PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Search Identity</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name / Reg No..." className="border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                <option value="">-- All Years --</option>
                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="border border-slate-200 bg-white rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                <option value="">-- All Sections --</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Faculty Mentor (CA1)</label>
              <input type="text" value={filterMentor} onChange={(e) => setFilterMentor(e.target.value)} placeholder="Mentor Name..." className="border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedIds.length > 0 && activeTab === 'PENDING' && (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-900 p-4 rounded-xl shadow-md text-white">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} className="text-amber-400" />
              <p className="text-xs font-medium text-slate-300">
                <span className="font-bold text-white">{selectedIds.length}</span> items selected.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleBulkAction('reject')}
                disabled={bulkProcessing}
                className="py-2 px-3 text-[11px] font-bold rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/20 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing...' : 'Reject Bulk'}
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('approve')}
                disabled={bulkProcessing}
                className="py-2 px-4 text-[11px] font-bold rounded-lg bg-amber-500 text-indigo-900 w-full sm:w-auto hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing...' : 'Approve Bulk'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 bg-amber-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:grid lg:grid-cols-12 gap-4 items-center">
          <div className="col-span-2 flex items-center gap-3">
            {activeTab === 'PENDING' && activeDisplayItems.length > 0 && (
              <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-700 shrink-0">
                {selectedIds.length === activeDisplayItems.length ? <CheckSquare size={15} className="text-amber-600" /> : <Square size={15} />}
              </button>
            )}
            <span className="flex items-center gap-1"><Hash size={11} /> Register No</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5"><User size={12} /> Student Identity</div>
          <div className="col-span-2 flex items-center gap-1.5"><Layers3 size={12} /> Section</div>
          <div className="col-span-2 flex items-center gap-1.5"><User size={12} /> Faculty Mentor (CA1)</div>
          <div className="col-span-2 flex items-center gap-1.5"><FileText size={12} /> Reason</div>
          <div className="col-span-1 flex items-center gap-1.5"><Tags size={12} /> Category</div>
          <div className="col-span-1 flex items-center gap-1.5"><Workflow size={12} /> Action</div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {activeDisplayItems.map((row) => {
            const isSelected = selectedIds.includes(row.id);
            const rawDate = new Date(row.createdAt);
            const formattedDate = !isNaN(rawDate.getTime()) ? `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}` : 'N/A';

            return (
              <div key={row.id} className={`p-4 lg:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center transition-all ${isSelected ? 'bg-amber-50/30' : 'bg-white hover:bg-amber-50/10'}`}>

                <div className="lg:col-span-2 flex items-center gap-3 min-w-0">
                  {activeTab === 'PENDING' && (
                    <button type="button" onClick={() => toggleSelect(row.id)} className="text-slate-300 hover:text-indigo-700 shrink-0">
                      {isSelected ? <CheckSquare size={15} className="text-amber-600" /> : <Square size={15} />}
                    </button>
                  )}
                  <div className="font-mono font-bold text-indigo-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-[11px] tracking-tight">
                    {row.registerNo}
                  </div>
                </div>

                <div className="lg:col-span-2 font-bold text-slate-800 text-[13px] lg:text-xs truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Student</span>
                  {row.student}
                  <div className="text-[10px] text-slate-400 font-medium block lg:hidden mt-0.5">Applied: {formattedDate}</div>
                </div>

                <div className="lg:col-span-2 font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="lg:hidden text-[9px] uppercase font-bold text-slate-400 mr-1.5">Cohort:</span>
                  <div className="bg-slate-100 text-indigo-800 px-2 py-0.5 rounded text-[11px] border border-slate-200/50 font-semibold">
                    {row.year} — {getSectionLetter(row.section)}
                  </div>
                </div>

                <div className="lg:col-span-2 font-medium text-slate-700 truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Faculty Advisor (CA1)</span>
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 hidden lg:inline-block mr-1" />
                    <span className="italic font-bold text-indigo-800 text-[11px] lg:text-xs">{row.mentorName}</span>
                  </div>
                </div>

                <div className="lg:col-span-2 text-slate-500 font-medium truncate">
                  <span className="lg:hidden block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Reason</span>
                  {row.scope}
                </div>

                <div className="lg:col-span-1 lg:text-center flex items-center">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    row.class === 'Leave' 
                      ? 'bg-amber-50 text-indigo-800 border-amber-200' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {row.class}
                  </span>
                </div>

                <div className="lg:col-span-1 flex flex-row items-center pt-2.5 lg:pt-0 border-t border-slate-100 lg:border-none mt-1 lg:mt-0">
                  {row.status === 'Partially Approved' || row.status === 'Approved By Mentor' || row.status === 'Pending' ? (
                    <div className="flex items-center gap-1 ml-auto">
                      {/* ✅ Reject button – red with tap animation */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleSingleAction(row.id, 'reject', row.class)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-sm"
                      >
                        <X size={12} />
                      </motion.button>
                      {/* ✅ Approve button – green with tap animation */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleSingleAction(row.id, 'approve', row.class)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm"
                      >
                        <Check size={12} />
                      </motion.button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-auto ${
                      row.status === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {row.status === 'Approved' ? 'Cleared' : 'Declined'}
                    </span>
                  )}
                </div>

              </div>
            );
          })}

          {activeDisplayItems.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <p className="text-slate-800 text-xs font-bold">No Records Match Filters</p>
              {activeTab === 'PENDING' && (
                <p className="text-[10px] text-slate-400 mt-1">
                  There are currently no pending requests.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Approvals;