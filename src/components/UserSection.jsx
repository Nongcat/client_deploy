import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/apiConfig";
import "./UserSection.css";

const UserSection = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // ✅ รองรับทั้ง user และ admin
        const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
        if (!token) {
          // fallback: ลองอ่านจาก localStorage ถ้ามี
          const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
          if (cached) setUserData(JSON.parse(cached));
          return;
        }

        const response = await api.get("/users/verify-token", {
          headers: { Authorization: `Bearer {token}`.replace("{token}", token) },
        });

        if (response.data?.success && response.data?.user) {
          setUserData(response.data.user);
          // ✅ เก็บทั้งสองคีย์เพื่อความเข้ากันได้กับหน้าอื่น
          localStorage.setItem("user", JSON.stringify(response.data.user));
          localStorage.setItem("adminUser", JSON.stringify(response.data.user));
        } else {
          // fallback: local cache
          const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
          if (cached) setUserData(JSON.parse(cached));
        }
      } catch (error) {
        console.error("❌ Failed to fetch user:", error);
        const cached = localStorage.getItem("user") || localStorage.getItem("adminUser");
        if (cached) setUserData(JSON.parse(cached));
      }
    };

    fetchUser();
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
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
    console.log("🚪 Logging out...");
    // เคลียร์ทั้งสองชุดคีย์
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className="user-section" ref={dropdownRef}>
      <div className="user-info" onClick={toggleDropdown}>
        <div className="user-avatar">
          <FaUser />
        </div>
        <div className="user-details">
          <span className="user-name">
            {userData ? `${userData.name} ${userData.lastName}` : "Loading..."}
          </span>
          <FaChevronDown
            className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`}
          />
        </div>
      </div>

      {dropdownOpen && (
        <div className="user-dropdown">
          <div className="dropdown-item logout" onClick={handleLogout}>
            <FaSignOutAlt className="dropdown-icon" />
            <span>Logout</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSection;
