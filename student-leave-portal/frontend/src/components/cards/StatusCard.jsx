import React from 'react';

const StatusCard = ({ title, value, icon: Icon, color }) => {
  // Hardcoded hex layout configurations to forcefully override child utility rendering errors
  const cardStyles = {
    blue: {
      bg: 'bg-[#EFF6FF] border-[#BFDBFE]', 
      title: '#1E40AF', 
      value: '#1E3A8A', 
      iconBg: 'bg-[#DBEAFE] text-[#2563EB] border-[#93C5FD]'
    },
    emerald: {
      bg: 'bg-[#ECFDF5] border-[#A7F3D0]',
      title: '#065F46', 
      value: '#064E3B', 
      iconBg: 'bg-[#D1FAE5] text-[#059669] border-[#6EE7B7]'
    },
    amber: {
      bg: 'bg-[#FFFBEB] border-[#FDE68A]',
      title: '#92400E', 
      value: '#78350F', 
      iconBg: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]'
    },
    indigo: {
      bg: 'bg-[#EEF2FF] border-[#C7D2FE]',
      title: '#3730A3', 
      value: '#312E81', 
      iconBg: 'bg-[#E0E7FF] text-[#4F46E5] border-[#A5B4FC]'
    }
  };

  const style = cardStyles[color] || cardStyles.blue;

  return (
    <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-xs transition-all ${style.bg}`}>
      <div className="space-y-1.5">
        {/* Metric Label Title */}
        <p 
          className="text-[10px] font-black uppercase tracking-widest block"
          style={{ color: style.title, opacity: 1, visibility: 'visible' }}
        >
          {title}
        </p>
        
        {/* Large Main Counting Value */}
        <p 
          className="text-2xl md:text-3xl font-black tracking-tight block"
          style={{ color: style.value, opacity: 1, visibility: 'visible' }}
        >
          {value}
        </p>
      </div>

      {/* Trailing Icon Container */}
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBg}`}>
        <Icon size={18} className="stroke-[2.5]" />
      </div>
    </div>
  );
};

export default StatusCard;