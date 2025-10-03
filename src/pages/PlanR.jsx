import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  FaHome,
  FaArrowLeft,
  FaTrash,
  FaPen,
  FaSave,
  FaMinus,
  FaPlus,
  FaFileExcel,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserSection from "../components/UserSection";
import "./PlanR.css";
import api from "../api/apiConfig";

/* ✅ Toast */
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** ✅ Modal ยืนยันลบ: ใช้ class เฉพาะ ไม่ชนของเดิม */
const PlanRConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="planr-modal-overlay">
      <div className="planr-modal">
        <h3 className="planr-modal-title">{title}</h3>
        <div className="planr-modal-message">{message}</div>
        <div className="planr-modal-actions">
          <button className="planr-btn planr-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="planr-btn planr-btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanR = () => {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /** ✅ state สำหรับ modal ลบ */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  /** ✅ state สำหรับแก้ไข lot แบบรายแถว (icon ดินสอ→Save) */
  const [editingId, setEditingId] = useState(null);
  const [draftLot, setDraftLot] = useState("");

  useEffect(() => {
    const fetchPlanningRecords = async () => {
      try {
        setLoading(true);
        const response = await api.get("/planningrecord");
        setRows(response.data);
        setFilteredRows(response.data); // แสดงทั้งหมดตั้งแต่แรก
        setError("");
      } catch (err) {
        console.error("Error fetching planning records:", err);
        setError("Could not load data");
        setRows([]);
        setFilteredRows([]);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchPlanningRecords();
  }, []);

  // กรองอัตโนมัติ (คง logic เดิมทุกประการ)
  useEffect(() => {
    const doFilter = () => {
      const base = rows.filter((row) => {
        const d = row.date || "";
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      });
      if (!search.trim()) return base;
      const q = search.trim().toLowerCase();
      return base.filter((row) =>
        (row.colorCode || "").toLowerCase().includes(q)
      );
    };
    setFilteredRows(doFilter());
  }, [search, rows, startDate, endDate]);

  const handleFilter = () => {
    const base = rows.filter((row) => {
      const d = row.date || "";
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });
    if (!search.trim()) return setFilteredRows(base);
    const q = search.trim().toLowerCase();
    setFilteredRows(
      base.filter((row) => (row.colorCode || "").toLowerCase().includes(q))
    );
  };

  // สถิติ (เดิม)
  const getProductStats = () => {
    // ถ้ามีการค้นหา ใช้ filteredRows ที่ตรงกับคำค้น
    const matchedRows = search.trim() 
      ? filteredRows.filter(row => 
          (row.colorCode || "").toLowerCase().includes(search.trim().toLowerCase())
        )
      : filteredRows; // ถ้าไม่มีการค้นหา ใช้ filteredRows ทั้งหมด

    const totalRecords = matchedRows.length;
    const totalLots = matchedRows.reduce(
      (sum, row) => sum + (parseFloat(row.lot) || 0),
      0
    );
    const lotFreq = {};
    matchedRows.forEach((row) => {
      const lot = row.lot || "-";
      lotFreq[lot] = (lotFreq[lot] || 0) + 1;
    });
    return { totalRecords, totalLots, lotFreq };
  };

  /** ✅ เปิด modal ลบ */
  const askDelete = (id) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  /** ✅ ยืนยันลบจริง */
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      // 1. ดึงข้อมูลรายการที่จะลบ
      const rowToDelete = rows.find(r => r.id === pendingDeleteId);
      if (!rowToDelete) throw new Error('Record not found');

      // 2. ดึงข้อมูล Formula ของ Product code
      const formulaResponse = await api.get(`/formula/details/${rowToDelete.colorCode}`);
      if (!formulaResponse.data) {
        throw new Error(`No formula found for product code: ${rowToDelete.colorCode}`);
      }
      const formula = formulaResponse.data;

      // 3. คืนสารเคมีเข้าสต็อก (เพิ่มเป็น inAmount เพราะเป็นการคืน)
      for (const chemical of formula) {
        const returnAmount = chemical.qtyPerLot * rowToDelete.lot;
        await api.post('/rm/update', {
          code: chemical.code,
          inAmount: returnAmount, // คืนสารเคมีเข้าสต็อก
          outAmount: 0
        });
      }

      // 4. ลบรายการ
      await api.delete(`/planningrecord/${pendingDeleteId}`);

      // 5. อัพเดตหน้าจอ
      setRows((prev) => prev.filter((r) => r.id !== pendingDeleteId));
      setFilteredRows((prev) => prev.filter((r) => r.id !== pendingDeleteId));
      
      toast.success("Record deleted and chemicals returned to stock successfully");
    } catch (err) {
      console.error("Error deleting record:", err);
      toast.error(err.message || "Failed to delete record");
    } finally {
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    }
  };

  /** ========= ✏️ แก้ไข Lot รายแถว ========= */
  const startEdit = (row) => {
    setEditingId(row.id);
    setDraftLot(row.lot ?? 0);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftLot("");
  };
  const incLot = () => setDraftLot((v) => (Number(v) || 0) + 1);
  const decLot = () => setDraftLot((v) => Math.max(1, (Number(v) || 1) - 1));
  const saveLot = async (row) => {
    const newLot = Number(draftLot) || 0;
    const oldLot = Number(row.lot) || 0;
    
    try {
      // 1. ดึงข้อมูล Formula ของ Product code นี้
      const formulaResponse = await api.get(`/formula/details/${row.colorCode}`); // แก้ไข endpoint
      if (!formulaResponse.data) {
        throw new Error(`No formula found for product code: ${row.colorCode}`);
      }
      const formula = formulaResponse.data;

      // 2. คำนวณผลต่างของ Lot
      const lotDifference = newLot - oldLot;

      // 3. อัพเดต RM stock ตาม formula
      if (lotDifference !== 0) {
        for (const chemical of formula) {
          const chemicalAmount = chemical.qtyPerLot * Math.abs(lotDifference);
          await api.post('/rm/update', {
            code: chemical.code,
            // ถ้า lot ลด (lotDifference < 0) = เพิ่มสารเคมีกลับเข้าสต็อก (inAmount)
            // ถ้า lot เพิ่ม (lotDifference > 0) = หักสารเคมีออกจากสต็อก (outAmount)
            inAmount: lotDifference < 0 ? chemicalAmount : 0,
            outAmount: lotDifference > 0 ? chemicalAmount : 0
          });
        }
      }

      // 4. อัพเดต Planning Record
      await api.put(`/planningrecord/${row.id}`, { lot: newLot });

      // 5. อัพเดตหน้าจอ
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, lot: newLot } : r))
      );
      setFilteredRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, lot: newLot } : r))
      );
      
      setEditingId(null);
      setDraftLot("");
      toast.success(`Updated lot from ${oldLot} to ${newLot} and adjusted stock accordingly`);

    } catch (err) {
      console.error("Error updating lot and stock:", err);
      toast.error(err.message || "Failed to update lot and stock");
    }
  };

/** ========= 📤 Export Excel (สีที่ค้นหา + ช่วงวันที่ถ้ามี | ไม่ใส่อะไร = ตามที่ขึ้น) ========= */
const exportExcel = async () => {
  const q = search.trim().toLowerCase();
  const hasDate = !!(startDate || endDate);

  // ฟังก์ชันเช็คช่วงวันที่ (ใช้รูปแบบ YYYY-MM-DD ที่อยู่ใน row.date)
  const inRange = (d) => {
    const v = d || "";
    return (!startDate || v >= startDate) && (!endDate || v <= endDate);
  };

  // 1) เริ่มจากฐานข้อมูล: ถ้าเลือกช่วงวันที่ → กรองตามวันที่ก่อน, ถ้าไม่เลือก → ใช้ rows ทั้งหมด
  const base = hasDate ? rows.filter(r => inRange(r.date)) : rows;

  // 2) ถ้ามีคำค้น → กรองตามรหัสสีบนฐาน (ซึ่งอาจถูกกรองวันที่แล้ว)
  const rowsToUse = q
    ? base.filter(r => (r.colorCode || "").toLowerCase().includes(q))
    : base;

  if (rowsToUse.length === 0) {
    if (q && hasDate) {
      toast.info("No data found matching product code and date range");
    } else if (q) {
      toast.info("No records found for this product code");
    } else if (hasDate) {
      toast.info("No data found in selected date range");
    } else {
      toast.info("No data available for export");
    }
    return;
  }

  // เตรียมข้อมูล
  const data = rowsToUse.map(r => ({
    department: r.department ?? "",
    colorCode:  r.colorCode ?? "",
    lot:        Number(r.lot ?? 0),
    date:       r.date ?? "",
    percent:    r.percent != null ? Number(r.percent) : null,
  }));

  // สร้าง workbook/worksheet
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("PlanR", { properties: { defaultRowHeight: 18 } });

  // คอลัมน์ + ความกว้าง
  ws.columns = [
    { header: "Department",   key: "department", width: 12 },
    { header: "Product Code", key: "colorCode",  width: 16 },
    { header: "Lot.",         key: "lot",        width: 8  },
    { header: "Date",         key: "date",       width: 12 },
    { header: "%",            key: "percent",    width: 10 },
  ];

  // เติมข้อมูล
    // เติมข้อมูล
  ws.addRows(data);

  // ✅ ถ้ามีการค้นหา → เพิ่มแถว SUM ของ Lot
  if (q) {
    const last = ws.lastRow.number;
    const sumRow = ws.addRow({
      department: "",
      colorCode: "TOTAL",
      lot: { formula: `SUM(C2:C${last})` }, // รวมเฉพาะคอลัมน์ Lot
      date: "",
      percent: ""
    });

    // สไตล์พิเศษให้แถว TOTAL
    sumRow.font = { bold: true, color: { argb: "FF2E7D32" } }; // เขียวเข้ม
    sumRow.eachCell(cell => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F5E9" } // เขียวอ่อน
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF81C784" } },
        left:{ style: "thin", color: { argb: "FF81C784" } },
        right:{ style: "thin", color: { argb: "FF81C784" } },
        bottom:{ style: "thin", color: { argb: "FF81C784" } },
      };
    });
    sumRow.getCell("C").alignment = { horizontal: "center" }; // จัดกลางช่อง Lot
  }


  // สไตล์หัวตาราง (แถวที่ 1)
  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2E7D32" } }; // เขียวเข้ม
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFC8E6C9" } },
      left:{ style: "thin", color: { argb: "FFC8E6C9" } },
      right:{ style: "thin", color: { argb: "FFC8E6C9" } },
      bottom:{ style: "thin", color: { argb: "FFC8E6C9" } },
    };
  });

  // สไตล์เนื้อหา
  const lastRow = ws.lastRow.number;
  for (let r = 2; r <= lastRow; r++) {
    const row = ws.getRow(r);
    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        left:{ style: "thin", color: { argb: "FFE0E0E0" } },
        right:{ style: "thin", color: { argb: "FFE0E0E0" } },
        bottom:{ style: "thin", color: { argb: "FFE0E0E0" } },
      };
    });
    ws.getCell(`C${r}`).alignment = { horizontal: "center" }; // Lot.
    ws.getCell(`E${r}`).alignment = { horizontal: "center" }; // %
    ws.getCell(`E${r}`).numFmt = "0.00";
  }

  // ตั้งชื่อไฟล์: ใส่ตัวบ่งชี้รหัสสี/ช่วงวันที่ถ้ามี
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  let parts = ["planR_export"];
  if (q) parts.push(q);
  if (hasDate) parts.push(`${startDate || "min"}-to-${endDate || "max"}`);
  const fname = `${parts.join("_")}_${stamp}.xlsx`;

  // บันทึกไฟล์
  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    fname
  );

  toast.success("Excel file exported successfully");
};


  return (
    <div>
      {/* ปุ่มกลับ */}
      <button
        className="planr-back-btn"
        onClick={() => navigate("/menu")}
        title="กลับไปหน้าหลัก"
        style={{
          background: "none",
          border: "none",
          position: "absolute",
          top: 24,
          left: 24,
          cursor: "pointer",
          zIndex: 1001,
          padding: 0,
        }}
      >
        <FaArrowLeft style={{ fontSize: 28, color: "#2986cc" }} />
      </button>

      <div className="planr-bg-blue-right"></div>
      <div className="planr-bg-blue-left"></div>

      <div
        className="planr-header"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "18px 32px 0 0",
        }}
      >
        <FaHome
          className="planr-icon-home"
          style={{
            cursor: "pointer",
            fontSize: 28,
            color: "#2986cc",
            marginRight: 12,
          }}
          onClick={() => navigate("/menu")}
        />
        <div className="planr-username-section">
          <UserSection />
        </div>
      </div>

      <div className="planr-bg-white">
        {/* 🔎 แถบกรอง (คง UI/ข้อความเดิม) */}
        <div className="planr-toolbar-row">
          <div className="planr-search-group">
            <input
              className="planr-search-planr"
              type="text"
              placeholder="Search Product Code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="planr-date-group">
            <span style={{ fontWeight: 500, color: "#2986cc" }}>From</span>
            <input
              type="date"
              className="planr-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontWeight: 500, color: "#2986cc" }}>to</span>
            <input
              type="date"
              className="planr-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="planr-filter-btn" onClick={handleFilter}>
            Filter
          </button>
          <div style={{ flex: 1 }} />
        </div>

        {/* 📊 สถิติ (คงไว้ครบถ้วน) */}
        {/* แสดง Statistics ตลอดเวลา */}
        <div
          className="planr-stats-container"
          style={{
            margin: "12px 0 16px 0",
            padding: "12px 16px",
            background: "rgba(97, 189, 238, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(97, 189, 238, 0.3)",
          }}
        >
          <div style={{ color: "#2986cc" }}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
                fontSize: "16px",
              }}
            >
              📊 Statistics{search.trim() ? ` for Product code: ${search}` : ""}
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 500 }}>📦 Total Lots (Sum):</span>
                <span
                  style={{
                    background: "#2986cc",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {getProductStats().totalLots.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 500 }}>🔢 Total Records:</span>
                <span
                  style={{
                    background: "#61bdee",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {getProductStats().totalRecords}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧾 ตารางข้อมูล + ปุ่มแก้ไข lot/ลบ (คงหัวตาราง/ข้อความเดิม) */}
        <div className="planr-table-wrapper">
          <table className="planr-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Product Code</th>
                <th>Lot.</th>
                <th>Date</th>
                <th>%</th>
                <th style={{ width: "110px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                    Loading Data...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#666" }}>
                    {search.trim() ? "No data found" : "No data available"}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id ?? `${row.colorCode}-${row.date}`}>
                      <td>{row.department}</td>
                      <td>{row.colorCode}</td>
                      <td>
                        {isEditing ? (
                          <div className="planr-lot-editor">
                            <button
                              className="planr-lot-step"
                              onClick={decLot}
                              aria-label="decrease lot"
                            >
                              <FaMinus />
                            </button>
                            <input
                              className="planr-lot-input"
                              type="number"
                              value={draftLot}
                              onChange={(e) => setDraftLot(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveLot(row);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              min={0}
                            />
                            <button
                              className="planr-lot-step"
                              onClick={incLot}
                              aria-label="increase lot"
                            >
                              <FaPlus />
                            </button>
                          </div>
                        ) : (
                          row.lot
                        )}
                      </td>
                      <td>{row.date}</td>
                      <td>{row.percent}</td>
                      <td className="planr-action-cell">
                        {isEditing ? (
                          <button
                            className="planr-action-btn planr-save"
                            onClick={() => saveLot(row)}
                            title="Save"
                          >
                            <FaSave />
                          </button>
                        ) : (
                          <button
                            className="planr-action-btn"
                            onClick={() => startEdit(row)}
                            title="Edit lot"
                          >
                            <FaPen />
                          </button>
                        )}
                        <button
                          className="planr-action-btn"
                          onClick={() => askDelete(row.id)}
                          title="ลบข้อมูล"
                        >
                          <FaTrash className="planr-icon-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ แถบปุ่มด้านล่าง: ซ้ายว่าง/ขวา Export Excel (คงข้อความเดิมด้านบนทั้งหมด) */}
        <div
          className="planr-bottom-actions"
          style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}
        >
          <div />
          <button className="planr-bottom-export" onClick={exportExcel}>
            <FaFileExcel style={{ marginRight: 8 }} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="planr-title">Checker Record</div>

      {/* ✅ Modal ลบ */}
      <PlanRConfirmModal
        open={showDeleteModal}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* ✅ Toast container (ธีมฟ้า, มุมขวาบน) */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
};

export default PlanR;
