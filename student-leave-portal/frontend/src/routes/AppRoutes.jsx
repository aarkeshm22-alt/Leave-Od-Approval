import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyOTP from '../pages/auth/VerifyOTP';

// Layout Structure
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth views
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// HOD Panel views
import HodDashboard from '../pages/hod/Dashboard';
import HodApprovals from '../pages/hod/Approvals';
import HodMentors from '../pages/hod/MentorList';
import HodStudents from '../pages/hod/StudentList';
import HodProfile from '../pages/hod/Profile';
import HODChatManagement from '../pages/hod/ChatManagement';
import TodayAbsence from '../pages/hod/TodayAbsence';

// Mentor Panel views
import MentorDashboard from '../pages/mentor/Dashboard';
import MentorPending from '../pages/mentor/PendingRequests';
import MentorStudents from '../pages/mentor/StudentList';
import MentorProfile from '../pages/mentor/Profile';
import MentorTodayAbsence from '../pages/mentor/TodayAbsence';

// Student Panel views
import StudentDashboard from '../pages/student/Dashboard';
import StudentLeave from '../pages/student/ApplyLeave';
import StudentOD from '../pages/student/ApplyOD';
import StudentRequests from '../pages/student/MyRequests';
import StudentProfile from '../pages/student/Profile';

// CA2 Panel views (Class Advisor 2 – view‑only)
import CA2Dashboard from '../pages/catwo/Dashboard';
import CA2Students from '../pages/catwo/StudentList';
import CA2Profile from '../pages/catwo/Profile';
import CA2TodayAbsence from '../pages/catwo/TodayAbsence';

// Loader Guard UI component
import Loader from '../components/common/Loader';

const RoleGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ==========================================
          ✅ AUTH ROUTES (Public)
          ========================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />

      {/* ==========================================
          ✅ STUDENT ROUTES
          ========================================== */}
      <Route path="/student" element={
        <RoleGuard allowedRoles={['student']}>
          <DashboardLayout />
        </RoleGuard>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="apply-leave" element={<StudentLeave />} />
        <Route path="apply-od" element={<StudentOD />} />
        <Route path="my-requests" element={<StudentRequests />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* ==========================================
          ✅ MENTOR ROUTES
          ========================================== */}
      <Route path="/mentor" element={
        <RoleGuard allowedRoles={['mentor']}>
          <DashboardLayout />
        </RoleGuard>
      }>
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="pending-requests" element={<MentorPending />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="profile" element={<MentorProfile />} />
        <Route path="today-absence" element={<MentorTodayAbsence />} />
      </Route>

      {/* ==========================================
          ✅ HOD ROUTES
          ========================================== */}
      <Route path="/hod" element={
        <RoleGuard allowedRoles={['hod']}>
          <DashboardLayout />
        </RoleGuard>
      }>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="approvals" element={<HodApprovals />} />
        <Route path="mentors" element={<HodMentors />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="profile" element={<HodProfile />} /> 
        <Route path="chat" element={<HODChatManagement />} />
        <Route path="today-absence" element={<TodayAbsence />} />
      </Route>

      {/* ==========================================
          ✅ CA2 ROUTES (Class Advisor 2)
          ========================================== */}
      <Route path="/ca2" element={
        <RoleGuard allowedRoles={['ca2']}>
          <DashboardLayout />
        </RoleGuard>
      }>
        <Route path="dashboard" element={<CA2Dashboard />} />
        <Route path="students" element={<CA2Students />} />
        <Route path="profile" element={<CA2Profile />} />
        <Route path="today-absence" element={<CA2TodayAbsence />} />
      </Route>

      {/* ==========================================
          ✅ FALLBACK ROUTE
          ========================================== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;