// src/components/common/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm";
  
  const variants = {
    // Primary: uses corporate deep navy, solid shadow
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    // Secondary/Glass replacement: very clean, subtle light blue border
    glass: "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/10"
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.01, y: -0.5 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;