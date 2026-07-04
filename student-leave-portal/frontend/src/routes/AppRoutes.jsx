import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layout Structure
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth views
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// HOD Panel views
import HodDashboard from '../pages/hod/Dashboard';
import HodApprovals from '../pages/hod/Approvals';
import HodMentors from '../pages/hod/MentorList';
import HodStudents from '../pages/hod/StudentList';
import HodReports from '../pages/hod/Reports';
import HodProfile from '../pages/hod/Profile';

// Mentor Panel views
import MentorDashboard from '../pages/mentor/Dashboard';
import MentorPending from '../pages/mentor/PendingRequests';
import MentorStudents from '../pages/mentor/StudentList';
import MentorProfile from '../pages/mentor/Profile';

// Student Panel views
import StudentDashboard from '../pages/student/Dashboard';
import StudentLeave from '../pages/student/ApplyLeave';
import StudentOD from '../pages/student/ApplyOD';
import StudentRequests from '../pages/student/MyRequests';
import StudentProfile from '../pages/student/Profile';

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
      {/* Auth Paths */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student Controlled Route Clusters */}
      <Route path="/student" element={
        <RoleGuard allowedRoles={['student']}><DashboardLayout /></RoleGuard>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="apply-leave" element={<StudentLeave />} />
        <Route path="apply-od" element={<StudentOD />} />
        <Route path="my-requests" element={<StudentRequests />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Mentor Controlled Route Clusters */}
      <Route path="/mentor" element={
        <RoleGuard allowedRoles={['mentor']}><DashboardLayout /></RoleGuard>
      }>
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="pending-requests" element={<MentorPending />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="profile" element={<MentorProfile />} />
      </Route>

      {/* HOD Controlled Route Clusters */}
      <Route path="/hod" element={
        <RoleGuard allowedRoles={['hod']}><DashboardLayout /></RoleGuard>
      }>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="approvals" element={<HodApprovals />} />
        <Route path="mentors" element={<HodMentors />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="reports" element={<HodReports />} />
        <Route path="profile" element={<HodProfile />} />
      </Route>

      {/* Fallback Root Catch */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;