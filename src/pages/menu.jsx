import React, { useState, useEffect, useRef } from "react";
import { FaClipboardList, FaWarehouse, FaRegFileAlt, FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./menu.css";
import UserSection from "../components/UserSection";

const Menu = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);

  // ดึงข้อมูล user จาก localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setUserData(JSON.parse(user));
    }
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // ลบ token และ user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // กลับไปหน้า login
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="menu-container">
      <div className="menu-bg">
        <div className="main-menu-wrapper">
          <div className="bg-blue-left"></div>
          <div className="bg-blue-right"></div>
          <div className="bg-white"></div>
          <div className="bg-gradient"></div>
          
          <div className="menu-title">Homepage</div>
          <UserSection />
          <div className="menu-items">
            <div
              className="menu-item"
              onClick={() => navigate("/productplan")}
              style={{ cursor: "pointer" }}
            >
              <div className="menu-icon-bg">
                <FaClipboardList className="menu-icon" />
              </div>
              <div className="label">Formula & Stock Checker</div>
            </div>
            <div
              className="menu-item"
              onClick={() => navigate("/rm")}
              style={{ cursor: "pointer" }}
            >
              <div className="menu-icon-bg">
                <FaWarehouse className="menu-icon" />
              </div>
              <div className="label">Chemical Stock</div>
            </div>
            <div
              className="menu-item"
              onClick={() => navigate("/planr")}
              style={{ cursor: "pointer" }}
            >
              <div className="menu-icon-bg">
                <FaRegFileAlt className="menu-icon" />
              </div>
              <div className="label">Checker Record</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
