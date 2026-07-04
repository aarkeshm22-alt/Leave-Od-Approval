// src/config/menuConfig.js (or wherever your menu arrays reside)
import {
  LayoutDashboard,
  FileSpreadsheet,
  Award,
  FileClock,
  Users,
  GraduationCap,
  CheckSquare,
  BarChart3,
  UserCircle,
} from "lucide-react";

export const studentMenu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/student/dashboard",
  },
  {
    title: "Apply Leave",
    icon: FileSpreadsheet,
    path: "/student/apply-leave",
  },
  {
    title: "Apply OD",
    icon: Award,
    path: "/student/apply-od",
  },
  {
    title: "My Requests",
    icon: FileClock,
    path: "/student/my-requests",
  },
];

export const mentorMenu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/mentor/dashboard",
  },
  {
    title: "My Students",
    icon: GraduationCap,
    path: "/mentor/students",
  },
  {
    title: "Pending Requests",
    icon: CheckSquare,
    path: "/mentor/pending-requests",
  }
];

export const hodMenu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/hod/dashboard",
  },
  {
    title: "Mentor List",
    icon: Users,
    path: "/hod/mentors",
  },
  {
    title: "Student List",
    icon: GraduationCap,
    path: "/hod/students",
  },
  {
    title: "Pending Approvals",
    icon: CheckSquare,
    path: "/hod/approvals",
  }
]; 