import React, { useEffect, useState } from "react";
import "./EditUserModal.css";

// แปลงวันที่ให้เป็น "YYYY-MM-DD" สำหรับ input[type=date]
const toInputDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const EditUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: user?.id,
    name: user?.name || "",
    lastName: user?.lastName || "",
    employeeId: user?.employeeId ? String(user.employeeId) : "",
    role: (user?.role || "USER").toUpperCase(), // ADMIN / USER
    birthDate: user?.birthDate || toInputDate(user?.birth) || "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      id: user?.id,
      name: user?.name || "",
      lastName: user?.lastName || "",
      employeeId: user?.employeeId ? String(user.employeeId) : "",
      role: (user?.role || "USER").toUpperCase(),
      birthDate: user?.birthDate || toInputDate(user?.birth) || "",
    });
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.employeeId) e.employeeId = "Employee ID is required";
    if (!/^\d+$/.test(form.employeeId)) e.employeeId = "Employee ID must be a number";
    if (!["ADMIN", "USER"].includes(form.role)) e.role = "Role must be ADMIN or USER";

    if (form.birthDate) {
      const d = new Date(form.birthDate);
      if (Number.isNaN(d.getTime())) e.birthDate = "Invalid date";
      // กันเลือกวันอนาคต
      const today = new Date();
      if (d > new Date(today.toISOString().slice(0, 10))) {
        e.birthDate = "Birth date cannot be in the future";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;

    if (name === "employeeId") {
      const onlyDigits = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, employeeId: onlyDigits }));
      if (errors.employeeId) setErrors((e) => ({ ...e, employeeId: "" }));
      return;
    }

    if (name === "role") {
      setForm((p) => ({ ...p, role: String(value).toUpperCase() }));
      if (errors.role) setErrors((e) => ({ ...e, role: "" }));
      return;
    }

    if (name === "birthDate") {
      setForm((p) => ({ ...p, birthDate: value }));
      if (errors.birthDate) setErrors((e) => ({ ...e, birthDate: "" }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: form.id,
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      employeeId: form.employeeId,
      role: form.role.toUpperCase(),
      birthDate: form.birthDate || undefined, // ส่งเฉพาะเมื่อมีค่า
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container">
        <h2>Edit User</h2>

        <form onSubmit={(e) => e.preventDefault()}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </label>

          <label>
            Last Name:
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className={errors.lastName ? "input-error" : ""}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
          </label>

          <label>
            Employee ID:
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              className={errors.employeeId ? "input-error" : ""}
              inputMode="numeric"
              pattern="\d*"
            />
            {errors.employeeId && (
              <span className="error-text">{errors.employeeId}</span>
            )}
          </label>

          <label>
            Birth Date:
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className={errors.birthDate ? "input-error" : ""}
            />
            {errors.birthDate && <span className="error-text">{errors.birthDate}</span>}
          </label>

          <label>
            Role:
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={errors.role ? "input-error" : ""}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </label>
        </form>

        <div className="modal-actions">
          <button onClick={handleSave} className="save-btn">
            Save
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
