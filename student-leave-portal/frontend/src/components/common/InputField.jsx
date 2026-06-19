// src/components/common/InputField.jsx
import React from 'react';

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, required = false, icon: Icon, className = '' }) => {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          // White theme: uses white background, defined light-slate borders, and corporate navy focuses
          className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 ${Icon ? 'pl-11' : ''} text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-300 shadow-sm`}
        />
      </div>
    </div>
  );
};

export default InputField;