import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Menu from './pages/menu'; 
import ProductPlan from './pages/productplan'; 
import PlanR from './pages/PlanR'; 
import RM from './pages/RM';
import Formula from './pages/formula'; 
import ResetPassword from './pages/resetpw'; 
import Register from './pages/register';
import AdminLogin from './pages/adminlogin';
import Adminmenu from './pages/adminmenu';
import User from './pages/user';
import './App.css';


// ✅ ProtectedRoute สำหรับ User
const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// ✅ ProtectedRoute สำหรับ Admin
const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    return <Navigate to="/adminlogin" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าที่ไม่ต้อง login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resetpw" element={<ResetPassword />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        
        {/* ✅ หน้าที่ต้อง login แบบ User */}
        <Route 
          path="/menu" 
          element={
            <UserProtectedRoute>
              <Menu />
            </UserProtectedRoute>
          } 
        />
        <Route 
          path="/productplan" 
          element={
            <UserProtectedRoute>
              <ProductPlan />
            </UserProtectedRoute>
          } 
        />
        <Route 
          path="/planr" 
          element={
            <UserProtectedRoute>
              <PlanR />
            </UserProtectedRoute>
          } 
        />
        <Route 
          path="/rm" 
          element={
            <UserProtectedRoute>
              <RM />
            </UserProtectedRoute>
          } 
        />
        <Route 
          path="/formula" 
          element={
            <UserProtectedRoute>
              <Formula />
            </UserProtectedRoute>
          } 
        />

        {/* ✅ หน้าที่ต้อง login แบบ Admin */}
        <Route 
          path="/adminmenu" 
          element={
            <AdminProtectedRoute>
              <Adminmenu />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/user" 
          element={
            <AdminProtectedRoute>
              <User />
            </AdminProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
