import React, { useState, useMemo } from "react";
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheck, FaUser, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import SuccessModal from "../components/SuccessModal";
import { toast } from 'react-toastify';
import api from '../api/apiConfig';
import "./resetpw.css";

// ===== Rules =====
const USERNAME_SANITIZE = /[^A-Za-z0-9._-]/g;           // ENG/digits/_ . -
const USERNAME_REGEX = /^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$/;

const DIGIT_SANITIZE = /[^0-9]/g;

// Password: ENG or digits only
const PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9]+$/;

const ResetPassword = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    birthDate: "",
    employeeId: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  // max วันที่ = วันนี้
  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  const sanitizeByField = (name, value) => {
    switch (name) {
      case "username":
        return value.replace(USERNAME_SANITIZE, "");
      case "employeeId":
        return value.replace(DIGIT_SANITIZE, "");
      default:
        return value;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextVal = sanitizeByField(name, value);
    setFormData(prev => ({ ...prev, [name]: nextVal }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ---------- Validation ----------
  const validateStep1 = () => {
    const newErrors = {};
    const u = formData.username.trim();

    if (!u) {
      newErrors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(u)) {
      newErrors.username = "3–30 chars, start with a letter, end with letter/number, no consecutive _ . -";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    // birthDate
    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    } else if (new Date(formData.birthDate) > new Date(todayStr)) {
      newErrors.birthDate = "Birth date cannot be in the future";
    }

    // employeeId
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    } else if (!/^\d+$/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must be digits only";
    }

    // newPassword
    const pw = formData.newPassword;
    if (!pw) {
      newErrors.newPassword = "New password is required";
    } else if (!PASSWORD_ALLOWED_REGEX.test(pw)) {
      newErrors.newPassword = "Use English letters (A–Z, a–z) or digits (0–9) only";
    } else if (pw.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/\d/.test(pw)) {
      newErrors.newPassword = "Password must contain at least one number";
    } else if (!/[A-Z]/.test(pw)) {
      newErrors.newPassword = "Password must contain at least one uppercase letter";
    } else if (pw.toLowerCase() === formData.username.toLowerCase()) {
      newErrors.newPassword = "Password must not be the same as your username";
    } else if (pw === formData.employeeId) {
      newErrors.newPassword = "Password must not be the same as your employee ID";
    }

    // confirm
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Submit ----------
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const response = await api.post('/users/check-username', { username: formData.username });
      if (response.data.exists) {
        setStep(2);
        setErrors({});
        toast.success("Username verified successfully");
      } else {
        toast.error("Username not found. Please check and try again.");
        setErrors({ username: "Username not found in our records" });
      }
    } catch (error) {
      console.error("Username verification error:", error);
      toast.error("Username not found. Please check and try again.");
      setErrors({ username: "Username not found in our records" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) throw new Error('Admin authentication required');

      const res = await api.post('/users/admin/reset-password', formData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.data?.success) {
        setSuccess(true);
        toast.success('Password reset successful');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Reset Password Error:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to reset password';

      // เผื่อ backend ส่ง code สำหรับ “รหัสใหม่ซ้ำของเดิม”
      if (/same.*password|reuse/i.test(msg)) {
        toast.error('New password must be different from the current password');
      } else {
        toast.error(msg);
      }

      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="resetpw-container">
        {showSuccessModal && (
          <SuccessModal
            isOpen={showSuccessModal}
            message="Password reset successful!"
            onOk={() => navigate("/adminmenu")}
          />
        )}
        <div className="resetpw-bg-circle1"></div>
        <div className="resetpw-bg-circle2"></div>
        <div className="resetpw-bg-circle3"></div>
        <div className="resetpw-bg-circle4"></div>
        <div className="resetpw-bg-circle5"></div>

        <div className="resetpw-success-card">
          <div className="resetpw-success-icon"><FaCheck /></div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been changed successfully.</p>
          <p>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resetpw-container">
      <div className="resetpw-bg-circle1"></div>
      <div className="resetpw-bg-circle2"></div>
      <div className="resetpw-bg-circle3"></div>
      <div className="resetpw-bg-circle4"></div>
      <div className="resetpw-bg-circle5"></div>

      <div className="resetpw-card">
        <div className="resetpw-header">
          <button
            className="resetpw-back-btn"
            onClick={() => {
              if (step === 1) navigate(-1);
              else { setStep(1); setErrors({}); }
            }}
          >
            <FaArrowLeft />
          </button>
          <div className="resetpw-icon"><FaLock /></div>
          <h2>Reset Password</h2>
          <p>{step === 1 ? "Enter your username to continue" : "Verify your information and create a new password"}</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="resetpw-form" autoComplete="off">
            <div className="resetpw-input-group">
              <label htmlFor="username">Username</label>
              <div className="resetpw-input-with-icon">
                <FaUser className="resetpw-input-icon" />
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? "error" : ""}
                  placeholder="Enter your username"
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  pattern="^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$"
                  title="3–30 chars, start with a letter, end with letter/number, no consecutive _ . -"
                />
              </div>
              {errors.username && <span className="resetpw-error">{errors.username}</span>}
            </div>

            <button type="submit" className="resetpw-submit-btn" disabled={loading}>
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="resetpw-form" autoComplete="off">
            <div className="resetpw-step-info">
              <p>Username: <strong>{formData.username}</strong></p>
            </div>

            <div className="resetpw-input-group">
              <label htmlFor="birthDate">Birth Date</label>
              <div className="resetpw-input-with-icon">
                <FaCalendarAlt className="resetpw-input-icon" />
                <input
                  id="birthDate"
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={errors.birthDate ? "error" : ""}
                  max={todayStr}   // ✅ เลือกได้ถึงวันนี้
                />
              </div>
              {errors.birthDate && <span className="resetpw-error">{errors.birthDate}</span>}
            </div>

            <div className="resetpw-input-group">
              <label htmlFor="employeeId">Employee ID</label>
              <div className="resetpw-input-with-icon">
                <FaIdCard className="resetpw-input-icon" />
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className={errors.employeeId ? "error" : ""}
                  placeholder="Enter your employee ID"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d+"
                  title="Digits only"
                />
              </div>
              {errors.employeeId && <span className="resetpw-error">{errors.employeeId}</span>}
            </div>

            <div className="resetpw-input-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="resetpw-password-input">
                <input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={errors.newPassword ? "error" : ""}
                  placeholder="Enter new password"
                  maxLength={128}
                  autoComplete="new-password"
                  pattern="[A-Za-z0-9]+"
                  title="Use English letters (A–Z, a–z) or digits (0–9) only"
                />
                <button type="button" className="resetpw-toggle-btn" onClick={() => togglePasswordVisibility('new')}>
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.newPassword && <span className="resetpw-error">{errors.newPassword}</span>}
            </div>

            <div className="resetpw-input-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="resetpw-password-input">
                <input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? "error" : ""}
                  placeholder="Confirm new password"
                  maxLength={128}
                  autoComplete="new-password"
                  pattern="[A-Za-z0-9]+"
                  title="Use English letters (A–Z, a–z) or digits (0–9) only"
                />
                <button type="button" className="resetpw-toggle-btn" onClick={() => togglePasswordVisibility('confirm')}>
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className="resetpw-error">{errors.confirmPassword}</span>}
            </div>

            {errors.submit && <div className="resetpw-submit-error">{errors.submit}</div>}

            <button type="submit" className="resetpw-submit-btn" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
