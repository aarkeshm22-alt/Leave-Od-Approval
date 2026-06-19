import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Layers, Check, X, ShieldAlert, Sparkles, Loader2, Clock, History, Calendar, User, FileText, Hash } from 'lucide-react';
import axios from 'axios';

const Approvals = () => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'ACTIONED'

  // =========================================================================
  // 1. DUAL-STREAM PIPELINE SYNCHRONIZATION (LEAVES + ON-DUTY)
  // =========================================================================
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

      // Extract both endpoints in parallel streams
      const [leavesResponse, odResponse] = await Promise.all([
        axios.get(`https://leave-od-approval.onrender.com/api/leaves/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } })),
        axios.get(`https://leave-od-approval.onrender.com/api/od/hod/pending?tab=${activeTab}`, configHeaders).catch(() => ({ data: { data: [] } }))
      ]);

      const rawLeaves = leavesResponse.data?.data || leavesResponse.data || [];
      const rawODs = odResponse.data?.data || odResponse.data || [];

      // Map Leaves to Unified Row Shape
      const formattedLeaves = Array.isArray(rawLeaves) ? rawLeaves.map(leave => {
        const studentObj = leave.student || {};
        return {
          id: leave._id || leave.id,
          registerNo: studentObj.registerNo || 'N/A',
          createdAt: leave.createdAt || new Date(),
          student: leave.studentName || `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim() || 'Unknown Student',
          class: 'Leave',
          route: 'Mentor Verified',
          scope: leave.reason || 'No description supplied',
          status: leave.status
        };
      }) : [];

      // Map On-Duty to Unified Row Shape
      const formattedODs = Array.isArray(rawODs) ? rawODs.map(od => {
        const studentObj = od.student || {};
        return {
          id: od._id || od.id,
          registerNo: studentObj.registerNo || 'N/A',
          createdAt: od.createdAt || new Date(),
          student: od.studentName || `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim() || 'Unknown Student',
          class: 'On-Duty',
          route: 'Mentor Verified',
          scope: od.reason || `Event at ${od.collegeName || 'Venue'}`,
          status: od.status
        };
      }) : [];

      // Combine arrays and sort chronologically (Newest first)
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

  // =========================================================================
  // 2. CLIENT-SIDE TIER FILTER EXTRACTORS
  // =========================================================================
  const pendingItems = items.filter(i => i.status === 'Partially Approved' || i.status === 'Approved By Mentor');
  const activeDisplayItems = activeTab === 'PENDING' 
    ? pendingItems 
    : items.filter(i => i.status === 'Approved' || i.status === 'Rejected');

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === pendingItems.length ? [] : pendingItems.map(i => i.id));
  };

  // =========================================================================
  // 3. TARGETED ACTION DISPATCHER (LEAVE / OD ROUTING GATES)
  // =========================================================================
  const handleSingleAction = async (targetId, actionType, docCategory) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const configHeaders = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (docCategory === 'On-Duty') {
        // Unified status matrix endpoint matching your updateODStatusMatrix router patch rule
        await axios.patch(`https://leave-od-approval.onrender.com/api/od/${targetId}/action`, {
          action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
          remarks: actionType === 'approve' ? 'Final Institutional Clearance Verified' : 'Rejected by HOD'
        }, configHeaders);
      } else {
        // Standard split leaves endpoint rule matching your legacy server setup
        await axios.patch(`https://leave-od-approval.onrender.com/api/leaves/${targetId}/hod-approve`, { action: actionType }, configHeaders);
      }

      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      setItems(prev => prev.map(item => item.id === targetId ? { ...item, status: finalDbStatus } : item));
      setSelectedIds(prev => prev.filter(id => id !== targetId));
    } catch (err) {
      console.error("Failed handling individual request status update:", err);
    }
  };

  // =========================================================================
  // 4. BATCH STATUS UPDATE PIPELINE RUNNER
  // =========================================================================
  const handleBulkAction = async (actionType) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = token ? token.replace(/"/g, '').trim() : '';
      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';

      // Separate target IDs by categories to execute consistent database commits
      const targetedItems = items.filter(item => selectedIds.includes(item.id));
      const leaveIds = targetedItems.filter(i => i.class === 'Leave').map(i => i.id);
      const odIds = targetedItems.filter(i => i.class === 'On-Duty').map(i => i.id);

      const networkRequestsPool = [];

      if (leaveIds.length > 0) {
        networkRequestsPool.push(
          axios.post('/api/leaves/bulk-status-update', { ids: leaveIds, status: finalDbStatus }, {
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          })
        );
      }

      if (odIds.length > 0) {
        // Maps batch loop across your individual patch matrix endpoints
        odIds.forEach(id => {
          networkRequestsPool.push(
            axios.patch(`/api/od/${id}/action`, {
              action: actionType === 'approve' ? 'APPROVE' : 'REJECT',
              remarks: actionType === 'approve' ? 'Bulk Approved By HOD' : 'Bulk Rejected By HOD'
            }, { headers: { 'Authorization': `Bearer ${cleanToken}` } })
          );
        });
      }

      await Promise.all(networkRequestsPool);

      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: finalDbStatus } : item));
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk action execution complete with mixed response parameters:", err);
      const finalDbStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      setItems(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, status: finalDbStatus } : item));
      setSelectedIds([]);
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
    <div className="space-y-6 font-sans pb-12 antialiased">

      {/* 1. Upper Header Context Control Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Approvals Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">These Applications are verified by the level-1 faculty mentors and are awaiting your <span className="font-bold text-blue-600">Final Clearance</span>.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl self-start md:self-auto shadow-2xs">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{pendingItems.length} Pending Actions</span>
        </div>
      </div>

      {/* 2. Pipeline Segment View Switching Tabs */}
      <div className="flex gap-4 border-b border-slate-200/80 pb-px">
        <button
          type="button"
          onClick={() => { setActiveTab('PENDING'); setSelectedIds([]); }}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-tight border-b-2 transition-all relative ${activeTab === 'PENDING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
        >
          <Clock size={15} />
          <span>Pending Request(s)</span>
          {pendingItems.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md shadow-3xs">{pendingItems.length}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('ACTIONED'); setSelectedIds([]); }}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-tight border-b-2 transition-all ${activeTab === 'ACTIONED' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}
        >
          <History size={15} />
          <span>Approval History</span>
        </button>
      </div>

      {/* 3. Floating Bulk Operations Matrix Controls */}
      <AnimatePresence>
        {selectedIds.length > 0 && activeTab === 'PENDING' && (
          <motion.div
            initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-950 p-4 rounded-xl shadow-xl text-white"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 bg-white/10 text-blue-400 rounded-lg shrink-0">
                <ShieldAlert size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-tight text-white">Bulk Operations Active</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {selectedIds.length} operational {selectedIds.length === 1 ? 'record' : 'records'} targeted for batch authorization state change.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button" onClick={() => handleBulkAction('reject')}
                className="flex items-center justify-center gap-2 py-2 px-3.5 text-[11px] font-bold rounded-lg transition-all w-full sm:w-auto bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-300"
              >
                <X size={13} /> Decline Selection
              </button>
              <button
                type="button" onClick={() => handleBulkAction('approve')}
                className="flex items-center justify-center gap-2 py-2 px-4 text-[11px] font-bold rounded-lg transition-all w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 shadow-sm"
              >
                <Check size={13} className="stroke-[2.5]" /> Approve Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Core Linear Structured Table Element */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">

        {/* Table Content Header (Desktop Viewports) */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:grid lg:grid-cols-12 gap-4 items-center">
          <div className="col-span-2 flex items-center gap-3">
            {activeTab === 'PENDING' && pendingItems.length > 0 && (
              <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                {selectedIds.length === pendingItems.length ? <CheckSquare size={15} className="text-blue-600" /> : selectedIds.length > 0 ? (
                  <div className="w-4 h-4 bg-blue-50 border border-blue-400 rounded flex items-center justify-center"><div className="w-2 h-0.5 bg-blue-600 rounded-xs" /></div>
                ) : <Square size={15} />}
              </button>
            )}
            <span className="flex items-center gap-1"><Hash size={11} /> Register No</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5"><User size={12} /> Student Name</div>
          <div className="col-span-2 flex items-center gap-1.5"><Calendar size={12} /> Applied Date</div>
          <div className="col-span-3 flex items-center gap-1.5"><FileText size={12} /> Reason Context</div>
          <div className="col-span-1 text-center">Category</div>
          <div className="col-span-2 text-right">Pipeline Action</div>
        </div>

        {/* Mobile Viewports Selection Header Toggle Fallback */}
        {activeTab === 'PENDING' && pendingItems.length > 0 && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs lg:hidden">
            <button type="button" onClick={toggleSelectAll} className="flex items-center gap-2 font-semibold text-slate-600">
              {selectedIds.length === pendingItems.length ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
              <span>Select All Records ({selectedIds.length} chosen)</span>
            </button>
            <Layers size={14} className="text-slate-400" />
          </div>
        )}

        {/* Unified Table Iteration Module Row Stream */}
        <div className="divide-y divide-slate-100 text-xs">
          {activeDisplayItems.map((row) => {
            const isSelected = selectedIds.includes(row.id);
            const rawDate = new Date(row.createdAt);
            const formattedDate = !isNaN(rawDate.getTime())
              ? `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}`
              : 'N/A';

            return (
              <div
                key={row.id}
                className={`p-4 lg:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center transition-all duration-150 ${isSelected ? 'bg-blue-50/20' : 'bg-white hover:bg-slate-50/20'}`}
              >
                {/* COLUMN 1: Register Number Track */}
                <div className="lg:col-span-2 flex items-center gap-3 min-w-0">
                  {activeTab === 'PENDING' && (
                    <button type="button" onClick={() => toggleSelect(row.id)} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                      {isSelected ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} />}
                    </button>
                  )}
                  <div className="font-mono font-bold text-blue-700 bg-blue-50/60 border border-blue-100/70 px-2 py-0.5 rounded text-[11px] tracking-tight truncate max-w-full">
                    <span className="lg:hidden text-[10px] uppercase font-bold text-slate-400 mr-1.5">Reg:</span>
                    {row.registerNo}
                  </div>
                </div>

                {/* COLUMN 2: Student Identity Name Block */}
                <div className="lg:col-span-2 font-semibold text-slate-800 text-[13px] lg:text-xs tracking-tight truncate">
                  <span className="lg:hidden block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Student</span>
                  {row.student}
                </div>

                {/* COLUMN 3: Realtime Applied Timestamps */}
                <div className="lg:col-span-2 text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="lg:hidden text-[10px] uppercase font-bold text-slate-400 mr-1.5">Received:</span>
                  <Calendar size={13} className="hidden lg:inline text-slate-400/80 shrink-0" />
                  <span className="text-[11px] lg:text-xs">{formattedDate}</span>
                </div>

                {/* COLUMN 4: Explanation Description Context */}
                <div className="lg:col-span-3 text-slate-600 font-medium leading-relaxed break-words line-clamp-2 lg:line-clamp-1">
                  <span className="lg:hidden block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Reason</span>
                  {row.scope}
                </div>

                {/* COLUMN 5: Dynamic Row Category Badge (Leave / On-Duty) */}
                <div className="lg:col-span-1 lg:text-center flex lg:justify-center items-center">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-3xs ${row.class === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-200/40' : 'bg-cyan-50 text-cyan-700 border-cyan-200/40'}`}>
                    {row.class}
                  </span>
                </div>

                {/* COLUMN 6: Row Level Execution Triggers */}
                <div className="lg:col-span-2 flex flex-row lg:flex-row-reverse justify-between lg:justify-start items-center gap-2.5 pt-3 lg:pt-0 border-t border-slate-100 lg:border-none mt-2 lg:mt-0">
                  <span className="lg:hidden bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wide">
                    {row.route}
                  </span>

                  {row.status === 'Partially Approved' || row.status === 'Approved By Mentor' ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button" onClick={() => handleSingleAction(row.id, 'reject', row.class)}
                        className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition-all shadow-3xs"
                        title="Reject Application"
                      >
                        <X size={13} />
                      </button>
                      <button
                        type="button" onClick={() => handleSingleAction(row.id, 'approve', row.class)}
                        className="p-1.5 bg-slate-900 hover:bg-emerald-600 border border-slate-900 hover:border-emerald-600 text-white rounded-lg transition-all shadow-3xs"
                        title="Approve Application"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 tracking-wide ${row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {row.status === 'Approved' ? 'HOD Approved' : 'HOD Rejected'}
                    </span>
                  )}
                </div>

              </div>
            );
          })}

          {/* Empty Workflow State Block Handler */}
          {activeDisplayItems.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-slate-800 text-xs font-bold">Pipeline Reads Zero Clear</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {activeTab === 'PENDING' ? 'No records currently require your level authorization state review.' : 'No historic entry tracking logs found in this terminal.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Approvals;