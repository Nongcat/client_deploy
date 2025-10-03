// src/components/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "../api/apiConfig";
import "react-toastify/dist/ReactToastify.css";
import "./adminlogin.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Admin username is required";
    if (!formData.password.trim()) newErrors.password = "Admin password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/admin/login", formData);
      const { success, token, user } = response.data;

      if (success) {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success("Admin login successful!");
        navigate("/adminmenu");
      } else {
        toast.error("Invalid username or password");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error.message;
      console.error("❌ Admin login error:", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <ToastContainer position="top-center" autoClose={4000} theme="dark" />

      <div className="back-to-user">
        <button onClick={() => navigate("/")} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          User Login
        </button>
      </div>

      <div className="admin-welcome-circle">
        <div className="admin-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" fill="white" stroke="white" strokeWidth="0.5" />
            <path d="M6 20c0-4 2.7-7 6-7s6 3 6 7" fill="white" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <h1 className="admin-welcome-title">ADMIN</h1>
        <h2 className="admin-welcome-subtitle">Management Portal</h2>
        <p className="admin-welcome-text">
          Secure access to administrative functions and system management.
          Please login with your administrator credentials.
        </p>
      </div>

      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h2 className="admin-sign-in-title">Admin Sign In</h2>

        <div className="form-group">
          <label className="admin-login-label">Admin Username</label>
          <input
            type="text" name="username" value={formData.username}
            onChange={handleInputChange}
            className={`admin-login-input ${errors.username ? "error" : ""}`}
            placeholder="Enter admin username" autoComplete="off" disabled={loading}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label className="admin-login-label">Admin Password</label>
          <input
            type="password" name="password" value={formData.password}
            onChange={handleInputChange}
            className={`admin-login-input ${errors.password ? "error" : ""}`}
            placeholder="Enter admin password" autoComplete="current-password" disabled={loading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <button type="submit" className="admin-login-button" disabled={loading}>
          {loading ? "Signing In..." : "Sign In as Admin"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
