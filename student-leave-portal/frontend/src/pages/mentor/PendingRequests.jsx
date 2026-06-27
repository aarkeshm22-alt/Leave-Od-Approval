import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldX, Eye, MessageSquare, Loader2, RefreshCw, MapPin, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import axios from 'axios'; 
import { useAuth } from '../../hooks/useAuth';

const PendingRequests = () => {
  const { token } = useAuth(); 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // =========================================================================
  // 1. DUAL FETCH SYNCHRONIZATION PIPELINE (LEAVE + OD)
  // =========================================================================
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const rawToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!rawToken) {
        console.error('[FRONTEND] Missing authentication context authorization parameters.');
        setLoading(false);
        return;
      }

      const cleanToken = rawToken.replace(/"/g, '').trim();
      const configHeaders = {
        headers: { 
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };

      // Extract records in parallel streams
      const [leavesResponse, odResponse] = await Promise.all([
        axios.get('/api/leaves/mentor/pending', configHeaders).catch(err => ({ data: [], isError: true })),
        axios.get('/api/od/mentor/pending', configHeaders).catch(err => ({ data: [], isError: true }))
      ]);

      // 💻 BROWSER CONSOLE RUNTIME DIAGNOSTIC PRINTS
      console.log("=== 🔍 FRONTEND NETWORK PAYLOAD DEBUGGING ===");
      console.log("Raw Leaves Response Object:", leavesResponse);
      console.log("Raw On-Duty Response Object:", odResponse);
 
      let combinedPool = [];

      // Unpack Leave requests safely
      const leavesData = leavesResponse.data?.data || leavesResponse.data || [];
      if (Array.isArray(leavesData)) {
        const formattedLeaves = leavesData.map(l => ({ ...l, mappedType: 'Leave' }));
        combinedPool = [...combinedPool, ...formattedLeaves];
      }

      // Unpack On-Duty requests using highly defensive multilayer structural extraction
      let odData = [];
      if (odResponse?.data && Array.isArray(odResponse.data.data)) {
        odData = odResponse.data.data; // Standard wrap: { success: true, data: [...] }
      } else if (Array.isArray(odResponse?.data)) {
        odData = odResponse.data;      // Fallback raw wrap array layout
      } else if (odResponse?.data?.data && Array.isArray(odResponse.data.data.data)) {
        odData = odResponse.data.data.data; // Deep nested Axios encapsulation
      }

      console.log(`Extracted OD Rows Count: ${odData.length}`, odData);

      if (odData.length > 0) {
        const formattedODs = odData.map(o => ({ ...o, mappedType: 'On-Duty' }));
        combinedPool = [...combinedPool, ...formattedODs];
      }

      // Sort logs chronologically (Newest first)
      combinedPool.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      
      console.log("Final Combined UI Requests Pool Matrix:", combinedPool);
      setRequests(combinedPool);

    } catch (error) {
      console.error('Failed fetching validation pipeline entries:', error);
      setErrorMsg('Critical failure establishing synchronization lines with verification nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // =========================================================================
  // 2. PATCH OPERATION DRIVEN BY CENTRALIZED STATUS MATRIX
  // =========================================================================
  const processAction = async (id, approvalState, docType) => {
    try {
      setSubmitting(true);
      const rawToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const cleanToken = rawToken ? rawToken.replace(/"/g, '').trim() : '';

      const configHeaders = { 
        headers: { 
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        } 
      };

      const isOD = docType === 'On-Duty';
      let response;

      if (isOD) {
        // 🛠️ ON-DUTY PATHWAY: Targets your unified status matrix endpoint!
        const payloadBody = {
          action: approvalState === 'approve' ? 'APPROVE' : 'REJECT',
          remarks: approvalState === 'approve' ? 'Passed Level-1 Mentor Verification' : 'Rejected by Mentor'
        };

        response = await axios.patch(
          `/api/od/${id}/action`, 
          payloadBody, 
          configHeaders
        );
      } else {
        // 📝 LEAVE PATHWAY: Legacy split endpoints system routing fallback
        const endpoint = approvalState === 'approve' 
          ? `/api/leaves/${id}/mentor-approve` 
          : `/api/leaves/${id}/mentor-reject`;

        response = await axios.patch(
          endpoint, 
          { remarks: approvalState === 'approve' ? 'Passed Level-1 Mentor Verification' : 'Rejected by Mentor' }, 
          configHeaders
        );
      }

      if (response.data.success || response.status === 200) {
        setRequests(requests.filter(r => r._id !== id));
        setSelected(null);
      }
    } catch (error) {
      console.error('State matrix transaction update fault:', error);
      alert(error.response?.data?.message || 'Authorization error...!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span className="text-xs font-semibold">Loading Your mentes pending request...!</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Leave & OD Verification Desk</h2>
          <p className="text-xs text-slate-500 mt-1">Review active student leave applications and on-duty rosters awaiting verification.</p>
        </div>
        <button 
          onClick={fetchPendingRequests}
          className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Verification Card Matrix Streams Layout */}
      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => {
          const typeLabel = req.mappedType;
          return (
            <motion.div
              key={req._id}
              layout
              className="p-5 bg-white border border-slate-200/80 shadow-3xs rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {req.student?.registerNo || 'N/A'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {req.student?.name || `${req.student?.firstName || ''} ${req.student?.lastName || ''}`.trim() || 'Unknown Student'}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide border ${
                    typeLabel === 'Leave'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}>
                    {typeLabel}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-2xl">
                  {req.reason || req.explanation}
                </p>

                {typeLabel === 'On-Duty' && req.collegeName && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                    <MapPin size={12} className="text-cyan-600" />
                    <span>{req.collegeName} ({req.collegeLocation || 'N/A'})</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 font-medium">
                  Duration Window: {new Date(req.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(req.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" className="border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 whitespace-nowrap" onClick={() => setSelected(req)}>
                  <Eye size={14} className="mr-1.5 text-slate-500" /> <span>Review Request</span>
                </Button>
              </div>
            </motion.div>
          );
        })}

        {requests.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
            <p className="text-xs text-slate-400 font-medium">No pending applications are currently awaiting clearance.</p>
          </div>
        )}
      </div>

      {/* INSPECT DRAWER DIALOG MODAL */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Review ${selected?.mappedType || 'Application'}`}>
        {selected && (
          <div className="space-y-5 text-slate-900">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <p className="text-slate-600"><strong className="text-slate-900">Applicant Name:</strong> {selected.student?.firstName || selected.student?.name} {selected.student?.lastName || ''}</p>
              <p className="text-slate-600"><strong className="text-slate-900">Type:</strong> {selected.mappedType}</p>
              
              {selected.mappedType === 'On-Duty' && (
                <p className="text-slate-600"><strong className="text-slate-900">Destination Venue:</strong> {selected.collegeName} ({selected.collegeLocation || 'N/A'})</p>
              )}

              <p className="text-slate-600"><strong className="text-slate-900">Reason:</strong> {selected.reason || selected.explanation}</p>
              <p className="text-slate-600">
                <strong className="text-slate-900">Number of day's Leave:</strong>{' '}
                {selected.fromDate && selected.toDate ? (
                  (() => {
                    const start = new Date(selected.fromDate);
                    const end = new Date(selected.toDate);
                    const variance = end.getTime() - start.getTime();
                    const calculatedDays = Math.ceil(variance / (1000 * 60 * 60 * 24)) + 1;
                    return calculatedDays > 0 ? `${calculatedDays} Days Inclusively` : '1 Operational Day';
                  })()
                ) : '1 Operational Day'}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900">Start Date:</strong> {new Date(selected.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-900">End Date:</strong> {new Date(selected.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Workflow Pipeline Context
              </label>
              <div className="relative flex items-start gap-3 bg-blue-50/50 border border-blue-100/80 rounded-xl p-3.5">
                <MessageSquare className="text-blue-500 shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  By Approving this request, it becomes <span className="text-blue-700 font-bold">Partially Approved</span> and moves to the final stage of the Approval.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="danger"
                className="w-full justify-center"
                disabled={submitting}
                onClick={() => processAction(selected._id, 'reject', selected.mappedType)}
              >
                <ShieldX size={14} className="mr-1.5" /> <span>Reject</span>
              </Button>
              <Button
                variant="primary"
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
                onClick={() => processAction(selected._id, 'approve', selected.mappedType)}
              >
                {submitting ? (
                  <Loader2 className="animate-spin mr-1.5" size={14} />
                ) : (
                  <ShieldCheck size={14} className="mr-1.5" />
                )}
                <span>Approve</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingRequests;