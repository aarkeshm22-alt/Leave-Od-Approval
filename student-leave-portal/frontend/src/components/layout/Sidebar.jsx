import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { X } from 'lucide-react'; 
import { studentMenu, mentorMenu, hodMenu } from '../layout/menuConfig'; 

// 🚀 ACCEPT GLOBAL STATE PROPS: Controlled directly by DashboardLayout
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const currentRole = user?.role?.toLowerCase() || 'student';

  const menusByRole = {
    student: studentMenu,
    mentor: mentorMenu,
    hod: hodMenu
  };

  const currentMenuItems = menusByRole[currentRole] || [];

  // Reusable Navigation Link renderer block
  const renderNavLinks = () => (
    <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
      {currentMenuItems.map((item, index) => {
        const IconComponent = item.icon; 
        
        return (
          <NavLink
            key={index}
            to={item.path}
            onClick={() => setIsOpen(false)} // Auto-collapses drawer when clicking a link on mobile
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 border
              ${isActive 
                ? 'bg-slate-100 text-slate-950 border-slate-200 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 border-transparent'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <IconComponent size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{item.title}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 遮罩 BACKDROP OVERLAY FOR MOBILE CLOSING CONTROL */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🖥️ RESPONSIVE SIDEBAR DRAWER PANEL */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col font-sans transition-transform duration-300 ease-in-out
        lg:static lg:h-screen lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">
              Ω
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase">Approval Hub</h2>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{currentRole} portal</span>
            </div>
          </div>

          {/* Close button inside mobile layout views */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation Elements */}
        {renderNavLinks()}
      </aside>
    </>
  );
};

export default Sidebar;