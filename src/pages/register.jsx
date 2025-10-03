import React, { useState } from "react";
import {
  FaUser,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaCalendarAlt,
  FaIdCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/apiConfig";
import "./register.css";
import SuccessModal from "../components/SuccessModal";

const NAME_SANITIZE = /[^A-Za-z\s'-]/g; // อนุญาต A-Z a-z เว้นวรรค ' -
const USERNAME_SANITIZE = /[^A-Za-z0-9._-]/g; // อนุญาต A-Z a-z 0-9 _ . -
const DIGIT_SANITIZE = /[^0-9]/g;

const USERNAME_REGEX =
  /^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/; // ต้องขึ้นต้นด้วยตัวอักษร

// ✅ รหัสผ่านต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น
const PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9]+$/;

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    employeeId: "",
    role: "USER",
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  // --- helper sanitize ---
  const sanitizeByField = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
        return value.replace(NAME_SANITIZE, ""); // กัน non-ENG ออกทันที
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
    const sanitized = sanitizeByField(name, value);

    setFormData((prev) => ({ ...prev, [name]: sanitized }));

    // เคลียร์ error เฉพาะฟิลด์ที่แก้อยู่
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};

    // firstName / lastName (ENG only)
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!NAME_REGEX.test(formData.firstName)) {
      newErrors.firstName = "First name must be English letters only";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!NAME_REGEX.test(formData.lastName)) {
      newErrors.lastName = "Last name must be English letters only";
    }

    // username
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!USERNAME_REGEX.test(formData.username)) {
      newErrors.username =
        "3–30 chars, start with a letter, end with letter/number, no consecutive _ . -";
    }

    // birth date
    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    }

    // employeeId (digits only)
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    } else if (!/^\d+$/.test(formData.employeeId)) {
      newErrors.employeeId = "Employee ID must be a number";
    }

    // password — rule เดิม + อนุญาตเฉพาะ ENG/digits เท่านั้น
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!PASSWORD_ALLOWED_REGEX.test(formData.password)) {
      newErrors.password =
        "Password must contain English letters (A–Z, a–z) or digits (0–9) only";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    }

    // confirm — ตรวจเงื่อนไข allowed charset ด้วยเพื่อแจ้งชัด
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (!PASSWORD_ALLOWED_REGEX.test(formData.confirmPassword)) {
      newErrors.confirmPassword =
        "Confirm password must use English letters or digits only";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        setErrors({ submit: "Admin authentication required" });
        setLoading(false);
        return;
      }

      const dataToSend = {
        ...formData,
        employeeId: parseInt(formData.employeeId, 10),
        birthDate: new Date(formData.birthDate).toISOString(),
      };

      const response = await api.post("/users/admin/create-user", dataToSend, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      console.log("Registration successful:", response);

      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        birthDate: "",
        employeeId: "",
        role: "USER",
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error(
        "Registration Error:",
        error?.response?.data || error.message
      );
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const newErrors = {};
        serverErrors.forEach((err) => (newErrors[err.param] = err.msg));
        setErrors((prev) => ({
          ...prev,
          ...newErrors,
          submit: "Please correct the errors above",
        }));
      } else if (error.response?.data?.message) {
        setErrors((prev) => ({ ...prev, submit: error.response.data.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: "Registration failed. Please try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <SuccessModal
        isOpen={showSuccessModal}
        message="Account created successfully!"
        onOk={() => navigate("/adminmenu")}
      />

      <div className="register-bg-circle1"></div>
      <div className="register-bg-circle2"></div>
      <div className="register-bg-circle3"></div>
      <div className="register-bg-circle4"></div>
      <div className="register-bg-circle5"></div>

      <div className="register-card">
        <div className="register-header">
          <button className="register-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div className="register-icon">
            <FaUser />
          </div>
          <h2>Create Account</h2>
          <p>Fill in your information to create a new account</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div className="register-name-row">
            <div className="register-input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? "error" : ""}
                placeholder="Enter first name"
                autoComplete="given-name"
                maxLength={50}
                pattern="[A-Za-z][A-Za-z\s'-]*"
                title="English letters, spaces, ' and - only"
              />
              {errors.firstName && (
                <span className="register-error">{errors.firstName}</span>
              )}
            </div>

            <div className="register-input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={errors.lastName ? "error" : ""}
                placeholder="Enter last name"
                autoComplete="family-name"
                maxLength={50}
                pattern="[A-Za-z][A-Za-z\s'-]*"
                title="English letters, spaces, ' and - only"
              />
              {errors.lastName && (
                <span className="register-error">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="register-input-group">
            <label htmlFor="username">Username</label>
            <div className="register-input-with-icon">
              <FaUser className="register-input-icon" />
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={errors.username ? "error" : ""}
                placeholder="Enter username"
                autoComplete="username"
                maxLength={30}
                pattern="^(?=.{3,30}$)(?!.*[._-]{2})(?![._-])[A-Za-z][A-Za-z0-9._-]*[A-Za-z0-9]$"
                title="3–30 chars, start with a letter, end with letter/number, no consecutive _ . -"
              />
            </div>
            {errors.username && (
              <span className="register-error">{errors.username}</span>
            )}
          </div>

          {/* Birth Date & Employee ID */}
          <div className="register-name-row">
            <div className="register-input-group">
              <label htmlFor="birthDate">Birth Date</label>
              <div className="register-input-with-icon">
                <FaCalendarAlt className="register-input-icon" />
                <input
                  id="birthDate"
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={errors.birthDate ? "error" : ""}
                />
              </div>
              {errors.birthDate && (
                <span className="register-error">{errors.birthDate}</span>
              )}
            </div>

            <div className="register-input-group">
              <label htmlFor="employeeId">Employee ID</label>
              <div className="register-input-with-icon">
                <FaIdCard className="register-input-icon" />
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className={errors.employeeId ? "error" : ""}
                  placeholder="Enter employee ID"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d+"
                  title="Digits only"
                />
              </div>
              {errors.employeeId && (
                <span className="register-error">{errors.employeeId}</span>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="register-input-group">
            <label htmlFor="password">Password</label>
            <div className="register-password-input">
              <input
                id="password"
                type={showPasswords.password ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "error" : ""}
                placeholder="Enter password"
                autoComplete="new-password"
                maxLength={128}
                // ✅ บังคับให้เป็น ENG/digits เท่านั้น
                pattern="[A-Za-z0-9]+"
                title="Use English letters (A–Z, a–z) or digits (0–9) only"
              />
              <button
                type="button"
                className="register-toggle-btn"
                onClick={() => togglePasswordVisibility("password")}
              >
                {showPasswords.password ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <span className="register-error">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="register-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="register-password-input">
              <input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? "error" : ""}
                placeholder="Confirm password"
                autoComplete="new-password"
                maxLength={128}
                // ✅ ให้กติกาเดียวกับ password
                pattern="[A-Za-z0-9]+"
                title="Use English letters (A–Z, a–z) or digits (0–9) only"
              />
              <button
                type="button"
                className="register-toggle-btn"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="register-error">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="register-submit-error">{errors.submit}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <div className="register-login-link">
            <span>Already have an account? </span>
            <button
              type="button"
              className="register-login-btn"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
