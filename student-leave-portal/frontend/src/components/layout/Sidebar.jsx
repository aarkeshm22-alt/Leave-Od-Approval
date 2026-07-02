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
            onClick={() => setIsOpen(false)} // Auto-collapses drawer on mobile
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 border
              ${isActive 
                ? 'bg-amber-50 text-blue-900 border-amber-200 shadow-sm font-bold' 
                : 'text-gray-600 hover:text-blue-900 hover:bg-gray-50 border-transparent'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <IconComponent 
                  size={16} 
                  className={isActive ? 'text-amber-500' : 'text-gray-400'} 
                />
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
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-blue-900/20 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar drawer panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-300 flex flex-col font-sans transition-transform duration-300 ease-in-out
          lg:static lg:h-screen lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-bold text-lg">
              Ω
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-blue-900 uppercase">LOA Portal</h2>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">User: {currentRole}</span>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-blue-900 bg-gray-50 border border-gray-200 rounded-lg transition-colors"
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