import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';

// User Role Pages
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import UserApply from './pages/user/UserApply';
import EmiCalculator from './pages/user/EmiCalculator';
import LoanAgreement from './pages/user/LoanAgreement';

// Admin Role Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLoanProducts from './pages/admin/AdminLoanProducts';

// Shared Pages
import Applications from './pages/Applications';
import ApplicantDetails from './pages/ApplicantDetails';
import DocumentVerification from './pages/DocumentVerification';
import Eligibility from './pages/Eligibility';
import AdminCriteria from './pages/AdminCriteria';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if ((user.role || 'user').toLowerCase() === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/user/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* USER Role Protected Routes */}
      <Route path="/user/dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute allowedRole="user"><UserProfile /></ProtectedRoute>} />
      <Route path="/user/apply" element={<ProtectedRoute allowedRole="user"><UserApply /></ProtectedRoute>} />
      <Route path="/user/applications" element={<ProtectedRoute allowedRole="user"><Applications /></ProtectedRoute>} />
      <Route path="/user/documents" element={<ProtectedRoute allowedRole="user"><DocumentVerification /></ProtectedRoute>} />
      <Route path="/user/eligibility" element={<ProtectedRoute allowedRole="user"><Eligibility /></ProtectedRoute>} />
      <Route path="/user/emi-calculator" element={<ProtectedRoute allowedRole="user"><EmiCalculator /></ProtectedRoute>} />
      <Route path="/user/agreement/:id" element={<ProtectedRoute allowedRole="user"><LoanAgreement /></ProtectedRoute>} />

      {/* ADMIN Role Protected Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute allowedRole="admin"><Applications /></ProtectedRoute>} />
      <Route path="/admin/criteria" element={<ProtectedRoute allowedRole="admin"><AdminCriteria /></ProtectedRoute>} />
      <Route path="/admin/loan-products" element={<ProtectedRoute allowedRole="admin"><AdminLoanProducts /></ProtectedRoute>} />

      {/* Shared Protected Routes */}
      <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
      <Route path="/applications/:id" element={<ProtectedRoute><ApplicantDetails /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentVerification /></ProtectedRoute>} />
      <Route path="/eligibility" element={<ProtectedRoute><Eligibility /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="*" element={<DashboardRedirect />} />
    </Routes>
  );
}
