import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // 1. Added Portal support
import { useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, UserCheck, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';

const Topbar = ({ onMenuToggle }) => {
  const { user, logout, deleteAccount, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: '', text: '' });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profileName = user?.firstName || user?.lastName
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user?.name || "Verified Identity";

  const userInitials = profileName
    ? profileName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profileName.slice(0, 2).toUpperCase();

  const userRole = user?.role || "HOD";
  const userCategory = user?.category || null;

  let displayRole = userRole;
  if (userRole === 'ca2') {
    displayRole = 'CA2';
  } else if (userRole === 'mentor' && userCategory === 'CA2') {
    displayRole = 'CA2';
  } else if (userRole === 'mentor' && userCategory === 'CA1') {
    displayRole = 'CA1';
  } else {
    displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  }

  const getProfileRoute = () => {
    const roleKey = userRole.toLowerCase().trim();
    if (roleKey === 'ca2' || (roleKey === 'mentor' && userCategory === 'CA2')) {
      return '/ca2/profile';
    }
    if (roleKey === 'mentor') return '/mentor/profile';
    if (roleKey === 'student') return '/student/profile';
    return '/hod/profile';
  };

  const handleTerminateSession = async () => {
    setShowDropdown(false);
    logout();
    navigate('/login');
  };

  const openDeleteConfirm = () => {
    setShowDropdown(false);
    setShowConfirmDialog(true);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDialogMessage({ type: '', text: '' });
    try {
      const result = await deleteAccount();
      if (result?.success) {
        setDialogMessage({ type: 'success', text: '✅ Your account has been permanently deleted.' });
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          setShowConfirmDialog(false);
          navigate('/login');
        }, 1500);
      } else {
        setDialogMessage({ type: 'error', text: `❌ ${result?.message || 'Unknown error occurred.'}` });
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDialogMessage({ type: 'error', text: `❌ ${error.response?.data?.message || error.message || 'Network error.'}` });
    } finally {
      setIsDeleting(false);
    }
  };

  const closeConfirmDialog = () => {
    if (!isDeleting) {
      setShowConfirmDialog(false);
      setDialogMessage({ type: '', text: '' });
    }
  };

  return (
    <>
      <header className="h-16 md:h-20 w-full border-b border-gray-300 bg-white/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
        <button 
          onClick={onMenuToggle} 
          className="lg:hidden p-2 text-blue-900 hover:text-amber-500 border border-gray-300 rounded-xl mr-2"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <div className="relative ml-1 md:ml-2" ref={dropdownRef}>
            <button 
              onClick={() => !loading && setShowDropdown(!showDropdown)}
              className={`flex items-center gap-2 md:gap-3 border rounded-xl p-1 md:p-1.5 pr-2 md:pr-4 shadow-sm transition-all ${
                showDropdown ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-900 flex items-center justify-center text-[11px] md:text-xs font-black text-white uppercase shrink-0">
                {userInitials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-blue-900 tracking-tight leading-none mb-1 max-w-[120px] truncate">
                  {profileName}
                </p>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 block">
                  {displayRole}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-gray-300 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 z-50">
                  <Link 
                    to={getProfileRoute()} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-blue-900 hover:bg-amber-50 font-bold text-xs"
                  >
                    <UserCheck size={14} className="text-amber-500" />
                    <span>View Profile</span>
                  </Link>
                  
                  <div className="h-px bg-gray-200 my-1 w-full" />

                  <button 
                    onClick={handleTerminateSession} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-blue-900 hover:bg-amber-50 font-bold text-xs"
                  >
                    <LogOut size={14} className="text-amber-500" />
                    <span>Terminate Session</span>
                  </button>

                  <button 
                    onClick={openDeleteConfirm} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-red-600 hover:bg-red-50/60 font-bold text-xs"
                  >
                    <Trash2 size={14} className="text-red-400" />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ===== PORTAL COMPONENT FOR OVERLAY FIXED ===== */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              // Changed z-50 to z-[9999] to clear any layout constraints
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
              onClick={closeConfirmDialog}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl w-full max-w-[92vw] sm:max-w-md shadow-2xl border border-gray-200 p-5 sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {dialogMessage.text ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 leading-relaxed break-words">
                          {dialogMessage.text}
                        </p>
                      </div>
                      <button
                        onClick={closeConfirmDialog}
                        className="shrink-0 text-gray-400 hover:text-gray-700 mt-0.5"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {dialogMessage.type === 'success' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={closeConfirmDialog}
                          className="px-4 py-2 bg-blue-900 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-500" size={18} />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-gray-900">Delete Account?</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 leading-relaxed">
                      This action <strong className="text-red-600">cannot be undone</strong>. All your data, including leave and OD requests, will be permanently removed from the system.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={closeConfirmDialog}
                        disabled={isDeleting}
                        className="w-full sm:w-1/2 px-4 py-2.5 sm:py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="w-full sm:w-1/2 px-4 py-2.5 sm:py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isDeleting ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          'Yes, Delete My Account'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Topbar;