import React from 'react';

const StatusCard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-700',
      value: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      iconBorder: 'border-blue-300',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      title: 'text-amber-700',
      value: 'text-amber-900',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      iconBorder: 'border-amber-300',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-700',
      value: 'text-red-900',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      iconBorder: 'border-red-300',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-700',
      value: 'text-green-900',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      iconBorder: 'border-green-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      title: 'text-emerald-700',
      value: 'text-emerald-900',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      iconBorder: 'border-emerald-300',
    },
  };

  const style = colorMap[color] || colorMap.blue; // fallback to blue

  return (
    <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${style.bg} ${style.border}`}>
      <div className="space-y-1.5">
        <p className={`text-[10px] font-black uppercase tracking-widest block ${style.title}`}>
          {title}
        </p>
        <p className={`text-2xl md:text-3xl font-black tracking-tight block ${style.value}`}>
          {value}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconText} ${style.iconBorder}`}>
        <Icon size={18} className="stroke-[2.5]" />
      </div>
    </div>
  );
};

export default StatusCard;