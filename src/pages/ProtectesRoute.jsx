import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log('🔍 ProtectedRoute - Checking token:', token ? 'Token exists' : 'No token');
  
  // ถ้าไม่มี token ให้กลับไปหน้า login
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Token found, allowing access');
  // ถ้ามี token ให้แสดงหน้าที่ต้องการ
  return children;
};

export default ProtectedRoute;