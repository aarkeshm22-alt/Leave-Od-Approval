import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, FileText, Briefcase, RefreshCw, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchAllStudentLogs = async () => {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'undefined' || token === 'null') {
      setErrorMsg('Authentication token missing. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // Parallel async processing for optimal engine throughput
      const [leavesResponse, odResponse] = await Promise.all([
        fetch('/api/leaves/my-leaves', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/od/student-history', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const leavesData = await leavesResponse.json();
      const odData = await odResponse.json();

      let combinedRecords = [];

      if (leavesResponse.ok) {
        const leavesList = leavesData.data || (Array.isArray(leavesData) ? leavesData : []);
        const formattedLeaves = leavesList.map(item => ({ ...item, mappedType: 'Leave' }));
        combinedRecords = [...combinedRecords, ...formattedLeaves];
      }

      if (odResponse.ok) {
        const odList = odData.data || (Array.isArray(odData) ? odData : []);
        const formattedODs = odList.map(item => ({ ...item, mappedType: 'On-Duty' }));
        combinedRecords = [...combinedRecords, ...formattedODs];
      }

      // Sort logs chronologically (Newest first)
      combinedRecords.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setRequests(combinedRecords);

      if (!leavesResponse.ok && !odResponse.ok) {
        setErrorMsg('Failed to completely synchronize database tracking profiles.');
      }
    } catch (err) {
      console.error("Database Extraction Loop Exception:", err);
      setErrorMsg('Network connection architecture failed to establish data transmission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudentLogs();
  }, []);

  const leaveRequests = requests.filter(r => r.mappedType === 'Leave');
  const odRequests = requests.filter(r => r.mappedType === 'On-Duty');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={28} />
        <p className="text-xs font-mono tracking-widest uppercase">Synchronizing Audit Records...</p>
      </div>
    );
  }

  // Refactored Table Presentation Component Layout Matrix
  const renderTable = (dataList, sectionTitle, IconComponent, isOD = false) => {
    if (dataList.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-2 border border-slate-200/50">
            <IconComponent size={16} />
          </div>
          <p className="text-xs font-bold text-slate-700">No {sectionTitle} logs on file</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200/50">
              <tr>
                <th className="p-4 pl-6">Reg No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Reason</th>
                {isOD && <th className="p-4">Venue & Location</th>}
                <th className="p-4 text-center">Status</th>
                {isOD && <th className="p-4 pr-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100 font-medium">
              {dataList.map((row) => {
                const studentRegNo = row.student?.registerNo || 'N/A';
                const studentName = row.student ? `${row.student.name || `${row.student.firstName || ''} ${row.student.lastName || ''}`}`.trim() : 'N/A';
                
                // Formats target timeline string paths cleanly
                const startDateStr = row.start || row.fromDate ? new Date(row.start || row.fromDate).toLocaleDateString() : 'N/A';
                const endDateStr = row.end || row.toDate ? new Date(row.end || row.toDate).toLocaleDateString() : 'N/A';
                
                // Conditional structural checking for actions loop visibility criteria 
                const isApproved = row.status === 'Approved';

                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-blue-600">{studentRegNo}</td>
                    <td className="p-4 font-bold text-slate-900">{studentName}</td>
                    <td className="p-4 text-slate-600 font-mono">{startDateStr}</td>
                    <td className="p-4 text-slate-600 font-mono">{endDateStr}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate" title={row.reason}>{row.reason}</td>
                    
                    {/* Additional Location Field Segment Specific to OD data profiles */}
                    {isOD && (
                      <td className="p-4 text-slate-700 font-semibold max-w-xs truncate" title={`${row.collegeName || ''}, ${row.collegeLocation || ''}`}>
                        {row.collegeName ? `${row.collegeName} (${row.collegeLocation || 'N/A'})` : 'N/A'}
                      </td>
                    )}

                    <td className="p-4 text-center">
                      <StatusBadge status={row.status || "Pending"} />
                    </td>

                    {/* Additional Dynamic Action Button Module Specific to OD Rows */}
                    {isOD && (
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => navigate('/apply-od')} // Directs student back to the workspace to append proofs
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Upload size={12} />
                            <span>Upload Proof</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg opacity-60">
                            Locked
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 p-2">
      {/* HEADER BAR ROW LAYOUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Absence Audit Registry Logs</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Separate logs representing your custom personal leave vectors and on-duty institutional profiles.</p>
        </div>
        <button 
          onClick={fetchAllStudentLogs}
          className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all"
        >
          <RefreshCw size={12} />
          <span>Sync Records</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: LEAVE REQUESTS TABLE STREAM */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leave Allocation History</h3>
        </div>
        {renderTable(leaveRequests, "Leave Application", FileText, false)}
      </div>

      {/* SECTION 2: ON-DUTY (OD) REQUESTS TABLE STREAM */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Briefcase size={16} className="text-amber-600" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">On-Duty (OD) Verification History</h3>
        </div>
        {renderTable(odRequests, "On-Duty (OD)", Briefcase, true)}
      </div>
    </motion.div>
  );
};

export default MyRequests;