import React, { useState, useEffect, useRef } from "react";
import api from "../api/apiConfig";
import {
  FaUser,
  FaUserCheck,
  FaUserTimes,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import EditUserModal from "../components/EditUserModal";
import ConfirmModal from "../components/ConfirmModal";
import "./user.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ???????????????????? "YYYY-MM-DD" ?????? input[type=date]
const toInputDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ?????????????????????
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const User = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    userToDelete: null,
  });

  const navigate = useNavigate();

  // ?????????????? (???????????)
  const currentUser =
    JSON.parse(localStorage.getItem("adminUser") || "null") ||
    JSON.parse(localStorage.getItem("user") || "null");
  const selfId = currentUser?.id;

  // ??????? fetch ????? StrictMode
  const fetchedOnce = useRef(false);

  const showConfirm = (title, message, userToDelete) => {
    setConfirmModal({ isOpen: true, title, message, userToDelete });
  };

  const closeConfirm = () => {
    setConfirmModal({
      isOpen: false,
      title: "",
      message: "",
      userToDelete: null,
    });
  };

  // guard token
  useEffect(() => {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      navigate("/adminlogin");
    }
  }, [navigate]);

  // ???????????????? + polling (???????? modal/confirm ????)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token =
          localStorage.getItem("adminToken") || localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");

        const res = await api.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message;
        console.error("Failed to fetch users:", msg);
        if (err?.response?.status === 401) {
          toast.error("Authentication required");
          navigate("/adminlogin");
        }
      }
    };

    if (!fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchUsers();
    }

    const interval = setInterval(() => {
      if (!editingUser && !confirmModal.isOpen) {
        fetchUsers();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [editingUser, confirmModal.isOpen, navigate]);

  // ??????? search/role
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(term) ||
          (u.name || "").toLowerCase().includes(term) ||
          (u.lastName || "").toLowerCase().includes(term) ||
          (u.email || "").toLowerCase().includes(term) ||
          String(u.employeeId || "").includes(searchTerm)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (u) => (u.role || "").toLowerCase() === roleFilter
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FaUserCheck className="status-icon active" />;
      case "inactive":
        return <FaUser className="status-icon inactive" />;
      case "suspended":
        return <FaUserTimes className="status-icon suspended" />;
      default:
        return <FaUser className="status-icon" />;
    }
  };

  const getRoleBadge = (role) => {
    if (!role) return <span className="role-badge">Unknown</span>;
    const normalizedRole = (role || "").toLowerCase();
    return (
      <span className={`role-badge ${normalizedRole}`}>
        {normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}
      </span>
    );
  };

  const handleEditUser = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    setEditingUser({
      id: u.id,
      name: u.name || "",
      lastName: u.lastName || "",
      employeeId: u.employeeId || "",
      role: (u.role || "USER").toUpperCase(),
      birthDate: u.birthDate || (u.birth ? toInputDate(u.birth) : ""),
    });
  };

  const handleDeleteUser = (userId) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    showConfirm(
      "Delete User",
      `Are you sure you want to delete user "${userToDelete.name} ${userToDelete.lastName}"? This action cannot be undone.`,
      userToDelete
    );
  };

  const confirmDelete = async () => {
    try {
      const userToDelete = confirmModal.userToDelete;
      if (!userToDelete) return;

      if (selfId && userToDelete.id === selfId) {
        closeConfirm();
        toast.error("Admin cannot delete their own account");
        return;
      }

      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      await api.delete(`/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      closeConfirm();
      toast.error(
        `User "${userToDelete.name} ${userToDelete.lastName}" deleted successfully`
      );
    } catch (error) {
      console.error("Failed to delete user:", error);
      closeConfirm();
      toast.error("Failed to delete user");
    }
  };

  const handleSaveUser = async (form) => {
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        navigate("/adminlogin");
        return;
      }

      const payload = {
        name: form.name,
        lastName: form.lastName,
        employeeId: form.employeeId,
        role: (form.role || "USER").toUpperCase(),
        // ??? birthDate ?????????????? (?????? YYYY-MM-DD)
        ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      };

      const res = await api.put(`/users/${form.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && res.data?.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === form.id ? res.data.user : u))
        );
        toast.success("User information updated successfully");
        setEditingUser(null);
      } else {
        toast.error("Failed to update user");
      }
    } catch (err) {
      console.error(
        "Failed to update user:",
        err?.response?.data || err.message
      );
      toast.error(err?.response?.data?.message || "Failed to update user");
    }
  };

  return (
    <div className="user-management-container">
      {/* ???????? */}
      <button
        className="back-to-adminmenu-icon-btn"
        onClick={() => navigate("/adminmenu")}
        title="Back to Admin Menu"
      >
        <FaArrowLeft style={{ marginRight: 8 }} />
      </button>

      <div className="user-management-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">
          Manage user accounts and monitor their status
        </p>
      </div>

      <div className="user-controls">
        <div className="search-filter-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name, username, or employee id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <div className="table-header">
          <h2>All Users ({filteredUsers.length})</h2>
        </div>

        <div className="users-table">
          <div className="table-header-row">
            <div className="table-header-cell">User</div>
            <div className="table-header-cell">Employee ID</div>
            <div className="table-header-cell">Role</div>
            <div className="table-header-cell">Created</div>
            <div className="table-header-cell">Last Login</div>
            <div className="table-header-cell">Actions</div>
          </div>

          {filteredUsers.map((user) => (
            <div key={user.id} className="table-row">
              <div className="table-cell user-info">
                <div className="user-avatar">{getStatusIcon(user.status)}</div>
                <div className="user-details">
                  <div className="user-name">
                    {user.name} {user.lastName}
                  </div>
                  <div className="username">@{user.username}</div>
                </div>
              </div>

              <div className="table-cell employee-id-info">
                <div className="employee-id">{user.employeeId}</div>
              </div>

              <div className="table-cell role-info">
                {getRoleBadge(user.role)}
              </div>

              <div className="table-cell date-info">
                <div className="date">{formatDate(user.createdAt)}</div>
              </div>

              <div className="table-cell date-info">
                <div className="date">{formatDate(user.lastLogin)}</div>
              </div>

              <div className="table-cell actions">
                <button
                  className="action-btn edit"
                  onClick={() => handleEditUser(user.id)}
                  title="Edit User"
                >
                  <FaEdit />
                </button>

                {String(user.role || "").toLowerCase() !== "admin" && (
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Delete User"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <FaUser className="no-users-icon" />
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmDelete}
        onCancel={closeConfirm}
      >
        <button className="confirm-modal-btn cancel" onClick={closeConfirm}>
          Cancel
        </button>
        <button className="confirm-modal-btn delete" onClick={confirmDelete}>
          Delete
        </button>
      </ConfirmModal>

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
};

export default User;
