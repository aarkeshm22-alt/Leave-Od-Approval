import React, { useState } from 'react';
import axios from 'axios';
import { Download, Landmark, Database, RefreshCw, Calendar, User, Users, FileText } from 'lucide-react';

const Reports = () => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [reportType, setReportType] = useState('date'); // 'date' | 'mentor' | 'cohort'
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    selectedMonth: '',
    academicYear: '2025-2026',
    mentorName: '',
    cohortYear: '',
    section: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = async (format) => {
    setIsCompiling(true);
    try {
      // 1. Map parameters explicitly matching the backend structure
      const params = {
        type: reportType,
        format: format, // 'excel' or 'pdf'
        mentorName: filters.mentorName,
        cohortYear: filters.cohortYear,
        section: filters.section,
        startDate: filters.startDate,
        endDate: filters.endDate,
        month: filters.selectedMonth
      };

      // 2. Fetch binary stream data from the Node Express server 
      const response = await axios.get('http://localhost:5000/api/mentor/reports/download', {
        params,
        responseType: 'blob' // CRITICAL: Forces Axios to handle binary data buffers
      });

      // 3. Create a temporary download anchor link object
      const blobType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'application/pdf';
        
      const blob = new Blob([response.data], { type: blobType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = downloadUrl;
      link.setAttribute('download', `Report_${reportType}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Clean memory traces
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Download pipeline failed:", error);
      alert("Failed to stream report down to browser. Check backend connectivity.");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12">
      
      {/* Header section */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Departmental Ledger Compliance Engine</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Filter, compile, and structure historical student data paths from MongoDB directly.</p>
      </div>

      {/* Main card box container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/50">
        
        {/* Top Status Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600 shadow-3xs">
              <Database size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Dynamic Query Criteria Configurator</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Format targets: Node Module dynamic engine</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse mr-0.5" /> Pipeline Live
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Filter Strategy Navigation row */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button 
              type="button"
              onClick={() => setReportType('date')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${reportType === 'date' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Calendar size={13} /> Date / Month Wise
            </button>
            <button 
              type="button"
              onClick={() => setReportType('mentor')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${reportType === 'mentor' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <User size={13} /> Mentor Wise
            </button>
            <button 
              type="button"
              onClick={() => setReportType('cohort')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${reportType === 'cohort' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Users size={13} /> Year & Section Wise
            </button>
          </div>

          {/* Contextual Input Field Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {reportType === 'date' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Select Target Month</label>
                  <select name="selectedMonth" value={filters.selectedMonth} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
                    <option value="">-- All Months --</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Custom Date Span</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </>
            )}

            {reportType === 'mentor' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Select Faculty Mentor</label>
                  <select name="mentorName" value={filters.mentorName} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
                    <option value="">-- Choose Mentor --</option>
                    <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar</option>
                    <option value="Prof. S. Mehra">Prof. S. Mehra</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Academic Year</label>
                  <select name="academicYear" value={filters.academicYear} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>
              </>
            )}

            {reportType === 'cohort' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Cohort Batch Year</label>
                  <select name="cohortYear" value={filters.cohortYear} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
                    <option value="">-- Choose Year --</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Specific Classroom Section</label>
                  <select name="section" value={filters.section} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500">
                    <option value="">-- Whole Sections --</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Download Action Controllers */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isCompiling}
              onClick={() => handleDownload('excel')}
              className={`w-full sm:flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 shadow-2xs select-none
                ${isCompiling 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                }
              `}
            >
              <Download size={13} className={isCompiling ? "animate-spin" : ""} />
              <span>{isCompiling ? "Processing Streams..." : "Download Structured Excel (.xlsx)"}</span>
            </button>

            <button
              type="button"
              disabled={isCompiling}
              onClick={() => handleDownload('pdf')}
              className={`w-full sm:flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 shadow-2xs select-none
                ${isCompiling 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950'
                }
              `}
            >
              <FileText size={13} className={isCompiling ? "animate-spin" : ""} />
              <span>{isCompiling ? "Compiling Vectors..." : "Download Audit PDF Ledger"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer framework key mark */}
      <div className="p-4 rounded-xl border border-dashed border-slate-200 flex items-center justify-between text-[11px] font-medium text-slate-400 px-5">
        <span className="flex items-center gap-1.5">
          <Landmark size={12} className="text-slate-300" />
          Institutional Audit Framework Signature Key
        </span>
        <span className="font-mono bg-slate-50 border border-slate-200/60 text-slate-500 px-2 py-0.5 rounded-md font-bold text-[10px]">
          LOG-HASH-SHA256
        </span>
      </div>

    </div>
  );
};

export default Reports;