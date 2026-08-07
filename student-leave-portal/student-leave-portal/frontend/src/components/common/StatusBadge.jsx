import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Partially Approved': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold tracking-wider rounded-full border ${styles[status] || styles['Pending']}`}>
      {status}
    </span>
  );
};

export default StatusBadge;