// src/components/adminmenu.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaClipboardList, FaWarehouse, FaUsers, FaUser, FaKey, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/apiConfig";
import "./menu.css";

const Menu = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
    if (cached) setUserData(JSON.parse(cached));
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const anyToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
        if (!anyToken) return;
        const res = await api.get("/users/verify-token");
        if (res.data?.success && res.data?.user) {
          setUserData(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("adminUser", JSON.stringify(res.data.user));
        }
      } catch (e) {
        console.error("❌ Failed to fetch user at adminmenu:", e?.response?.data?.message || e.message);
        const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
        if (cached) setUserData(JSON.parse(cached));
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("adminUser", JSON.stringify(userData));
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    navigate("/change-password");
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className="menu-container">
      <div className="menu-bg">
        <div className="main-menu-wrapper">
          <div className="bg-blue-left"></div>
          <div className="bg-blue-right"></div>
          <div className="bg-white"></div>
          <div className="bg-gradient"></div>

          <div className="menu-title">Home page</div>

          <div className="user-section" ref={dropdownRef}>
            <div className="user-info" onClick={toggleDropdown}>
              <div className="user-avatar"><FaUser /></div>
              <div className="user-details">
                <span className="user-name">
                  {userData ? `${userData.name} ${userData.lastName}` : "User Name Lastname"}
                </span>
                <FaChevronDown className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`} />
              </div>
            </div>

            {dropdownOpen && (
              <div className="user-dropdown">
                {/* <div className="dropdown-item" onClick={handleChangePassword}>
                  <FaKey className="dropdown-icon" /><span>Change Password</span>
                </div>
                <div className="dropdown-divider"></div> */}
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <FaSignOutAlt className="dropdown-icon" /><span>Logout</span>
                </div>
              </div>
            )}
          </div>

          <div className="menu-items">
            <div className="menu-item" onClick={() => navigate("/register")} style={{ cursor: "pointer" }}>
              <div className="menu-icon-bg"><FaUser className="menu-icon" /></div>
              <div className="label">Create Account</div>
            </div>
            <div className="menu-item" onClick={() => navigate("/resetpw")} style={{ cursor: "pointer" }}>
              <div className="menu-icon-bg"><FaKey className="menu-icon" /></div>
              <div className="label">Forgot Password</div>
            </div>
            <div className="menu-item" onClick={() => navigate("/user")} style={{ cursor: "pointer" }}>
              <div className="menu-icon-bg"><FaUsers className="menu-icon" /></div>
              <div className="label">User Management</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Menu;
