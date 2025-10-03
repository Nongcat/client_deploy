// login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/apiConfig';
import "./login.css";

const USERNAME_SANITIZE = /[^A-Za-z0-9._-]/g;
// 3–30 ตัว, ขึ้นต้นด้วยตัวอักษร, ห้ามมี _ . - ติดกัน, ลงท้ายด้วยตัวอักษร/ตัวเลข
const USERNAME_REGEX = /^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$/;

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 🔒 กรอง username ให้เป็น ENG/ตัวเลข/_ . - เท่านั้น
    const nextValue =
      name === "username" ? value.replace(USERNAME_SANITIZE, "") : value;

    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(formData.username)) {
      newErrors.username =
        "3–30 chars, start with a letter, end with letter/number, no consecutive _ . -";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.warn("Please fill in all required fields", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log("🔄 Attempting login with:", formData);
    setLoading(true);

    try {
      const response = await api.post('/users/login', formData);
      console.log("✅ Login Response:", response.data);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        const userData = {
          ...response.data.user,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(userData));

        toast.success(`Welcome back, ${response.data.user.name}!`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        setRedirecting(true);
        setTimeout(() => navigate('/menu'), 2000);
      }
    } catch (error) {
      console.log("💥 Login Error:", error);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";

      if (/(invalid|incorrect|password)/i.test(errorMessage)) {
        toast.error("🚫 Invalid username or password", {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: 'linear-gradient(135deg, #ffffffff, #ffffffff)',
            color: 'red',
            fontSize: '16px',
            fontWeight: '500',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
            right: '-370px'
          }
        });
      } else if (/(network|connection)/i.test(errorMessage)) {
        toast.error("🌐 Network connection failed", {
          position: "top-center",
          autoClose: 4000,
        });
      } else {
        toast.error(errorMessage, {
          position: "top-center",
          autoClose: 4000,
        });
      }

      setFormData({ username: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="login-container">
        <div className="bg-circle bg-circle1"></div>
        <div className="bg-circle bg-circle2"></div>
        <div className="bg-circle bg-circle3"></div>
        <div className="bg-circle bg-circle4"></div>
        <div className="bg-circle bg-circle5"></div>

        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2 className="loading-text">Loading Menu...</h2>
          <p className="loading-subtitle">Please wait while we redirect you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          fontSize: '15px',
          fontWeight: '500'
        }}
      />

      <div className="admin-logo-root">
        <div className="admin-logo" onClick={() => navigate('/adminlogin')}>
          <svg viewBox="0 0 24 24" className="logo-icon" fill="none">
            <circle cx="12" cy="8" r="3.5" fill="#2986cc" stroke="#2986cc" strokeWidth="0.5"/>
            <path d="M6 20c0-4 2.7-7 6-7s6 3 6 7" fill="#2986cc" stroke="#2986cc" strokeWidth="0.5"/>
          </svg>
          <span className="admin-text">Admin Portal</span>
        </div>
      </div>

      <div className="bg-circle bg-circle1"></div>
      <div className="bg-circle bg-circle2"></div>
      <div className="bg-circle bg-circle3"></div>
      <div className="bg-circle bg-circle4"></div>
      <div className="bg-circle bg-circle5"></div>

      <div className="welcome-circle">
        <h1 className="welcome-title">WELCOME</h1>
        <h2 className="welcome-subtitle">PPC management system</h2>
        <p className="welcome-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="sign-in-title">Sign in</h2>

        <label className="login-label">Username</label>
        <input
          type="text"
          name="username"
          className={`login-input ${errors.username ? 'error' : ''}`}
          value={formData.username}
          onChange={handleInputChange}
          disabled={loading}
          required
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={30}
          // ✅ บังคับ pattern ที่ input-level ด้วย
          pattern="^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$"
          title="3–30 chars, start with a letter, end with letter/number, no consecutive _ . -"
        />
        {errors.username && <p className="error-message">{errors.username}</p>}

        <label className="login-label">Password</label>
        <input
          type="password"
          name="password"
          className={`login-input ${errors.password ? 'error' : ''}`}
          value={formData.password}
          onChange={handleInputChange}
          disabled={loading}
          required
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {errors.password && <p className="error-message">{errors.password}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? (
            <>
              <span className="loading-spinner-small"></span>
              Signing in...
            </>
          ) : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
