import React, { useState } from 'react';
import { Download, Landmark, FileCheck, Database, RefreshCw, BarChart2 } from 'lucide-react';
import Button from '../../components/common/Button';

const Reports = () => {
  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompile = () => {
    setIsCompiling(true);
    // Simulating a system compilation workflow sequence
    setTimeout(() => {
      setIsCompiling(false);
      alert("Compiling absolute systemic database infrastructure metrics layout files...");
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12">
      
      {/* 1. Clear Section Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Departmental Ledger Compliance Engine</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Compile, query, and structure historical student leave and operational OD performance data packets</p>
      </div>

      {/* 2. Primary Administrative Action Card Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/50">
        
        {/* Upper Accent Summary Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600 shadow-3xs">
              <Database size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Active Relational Cluster Stream</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Node Context: MongoDB Document Framework</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
            Ready for Queries
          </div>
        </div>

        {/* Lower Compiling & Interface Options Block */}
        <div className="p-6 space-y-5">
          
          {/* Informative Architectural Context Explainer */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
              <BarChart2 size={14} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This compilation routine systematically queries normalized institutional data rows across active department nodes. It aggregates all approved absences, On-Duty (OD) performance metrics, and faculty verification velocities into a single, standardized, audit-ready compliance spreadsheet structure.
            </p>
          </div>

          {/* Action Execution Row Layout Panel */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            
            <button
              disabled={isCompiling}
              onClick={handleCompile}
              className={`w-full sm:flex-1 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 shadow-2xs select-none
                ${isCompiling 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950'
                }
              `}
            >
              <RefreshCw size={13} className={isCompiling ? "animate-spin" : ""} />
              <span>{isCompiling ? "Aggregating System Clusters..." : "Generate Supreme Analytical Ledger Bundle"}</span>
            </button>

            <Button 
              variant="secondary" 
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-3xs"
              onClick={() => alert("Downloading raw structural CSV data format sheets...")}
            >
              <Download size={13} className="text-slate-400" />
              <span>Export Raw CSV</span>
            </Button>

          </div>

        </div>

      </div>

      {/* 3. Base Institutional Footprint Verification Marker */}
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