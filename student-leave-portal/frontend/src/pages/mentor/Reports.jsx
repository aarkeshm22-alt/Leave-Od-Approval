import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from '../../components/common/Button';

const MentorReports = () => {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Generate Cohort Analytics Extract</h2>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Compile and export attendance metrics</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">Select your target data format below to compile historical verification records for all assigned student arrays into a compressed local file.</p>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button variant="glass" onClick={() => alert("Compiling dataset to Excel format...")}>
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>Export spreadsheet Data (.xlsx)</span>
          </Button>
          <Button variant="glass" onClick={() => alert("Compiling document map to PDF structure...")}>
            <FileText size={16} className="text-rose-400" />
            <span>Generate Document File (.pdf)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MentorReports;