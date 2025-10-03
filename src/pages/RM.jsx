import React, { useState, useEffect } from "react";
import { FaHome, FaSearch, FaUpload, FaArrowLeft, FaFileExcel } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserSection from "../components/UserSection";
import api from "../api/apiConfig";
import ExcelJS from 'exceljs';
import "./RM.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RM = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    chemCode: "",
    inAmount: "",
    outAmount: "",
  });

  // Fetch RM data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/rm");
      const formattedData = response.data.map((item) => ({
        Code: item.code,
        "Previous G-total": item.previous_g_total || item.g_total,
        "Latest In": item.latest_in || 0,
        "Latest Out": item.latest_out || 0,
        "G-TOTAL": item.g_total,
      }));
      setData(formattedData);
      setError("");
    } catch (err) {
      console.error("Error fetching RM data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered data for search
  const filteredData = data.filter(
    (item) =>
      item["Code"] && item["Code"].toLowerCase().includes(search.toLowerCase())
  );

  // Handlers
  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleSearch = (e) => e.preventDefault();

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload handler (แก้: ไม่ตั้ง Content-Type เอง)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }
    if (!file.name.match(/\.(xlsx?|csv|json)$/i)) {
      toast.error("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls), CSV หรือ JSON");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setSubmitting(true);
    try {
      // ปล่อยให้ Axios เติม multipart boundary เอง
      await api.post("/rm/upload", fd);

      // รอ backend upsert เสร็จเล็กน้อย (กันหน้าวิ่งเร็วไป)
      await new Promise((r) => setTimeout(r, 500));

      await fetchData();
      setShowModal(false);
      setFile(null);
      setError("");
      toast.success("Upload successful!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.error || "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.chemCode) {
      toast.error("กรุณากรอก Chemical code");
      return;
    }
    try {
      setSubmitting(true);
      const inAmount = parseFloat(formData.inAmount) || 0;
      const outAmount = parseFloat(formData.outAmount) || 0;

      await api.post("/rm/update", {
        code: formData.chemCode,
        inAmount,
        outAmount,
      });

      await fetchData();
      setFormData({ chemCode: "", inAmount: "", outAmount: "" });
      setError("");
      toast.success("Data updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "อัปเดตข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  // Export alerts to Excel
  const exportAlertToExcel = async () => {
    try {
      const alertData = (search ? filteredData : data).filter((item) => {
        const total = Number(item["G-TOTAL"]);
        return total === 0 || (total > 0 && total < 1000);
      });

      if (alertData.length === 0) {
        toast.warn('No alert data to export');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Stock Alert Report');

      worksheet.mergeCells('A1:C1');
      worksheet.getCell('A1').value = 'RM Stock Alert Report';
      worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF2986CC' } };
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8F0' } };
      worksheet.getRow(1).height = 30;

      worksheet.mergeCells('A2:C2');
      worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`;
      worksheet.getCell('A2').font = { size: 12, italic: true };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A3:C3');
      worksheet.getCell('A3').value = `Total Alert Items: ${alertData.length}`;
      worksheet.getCell('A3').font = { size: 12, bold: true, color: { argb: 'FFE53935' } };
      worksheet.getCell('A3').alignment = { horizontal: 'center' };

      worksheet.getRow(4).height = 10;

      const headerRow = worksheet.getRow(5);
      const headers = [
        { header: 'No.', key: 'no', width: 28 },
        { header: 'Chemical Code', key: 'code', width: 25 },
        { header: 'Current Stock (kg)', key: 'currentStock', width: 25 },
        { header: 'Status', key: 'status', width: 40 }
      ];
      worksheet.columns = headers;

      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF66BB6A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF81C784' } },
          left: { style: 'thin', color: { argb: 'FF81C784' } },
          bottom: { style: 'thin', color: { argb: 'FF81C784' } },
          right: { style: 'thin', color: { argb: 'FF81C784' } }
        };
      });

      alertData.forEach((item, index) => {
        const total = Number(item["G-TOTAL"]);
        const row = worksheet.addRow({
          no: index + 1,
          code: item["Code"],
          currentStock: total.toFixed(2),
          status:
            total === 0
              ? 'Out of Stock - Immediate Action Required'
              : total < 500
              ? 'Very Low Stock - Order Soon'
              : 'Low Stock - Monitor Closely'
        });

        const alertColor = total === 0 ? 'FFFFF5F5' : total < 500 ? 'FFFFFEF7' : 'FFFFFFFA';
        const textColor = total === 0 ? 'FFD32F2F' : total < 500 ? 'FFF57C00' : 'FFF9A825';

        row.eachCell((cell, colNumber) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: alertColor } };
          if (colNumber === 4) cell.font = { bold: true, color: { argb: textColor } };
          else cell.font = { color: { argb: 'FF2E7D32' } };
          cell.alignment = { horizontal: colNumber === 1 || colNumber === 3 ? 'center' : 'left', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFA5D6A7' } },
            left: { style: 'thin', color: { argb: 'FFA5D6A7' } },
            bottom: { style: 'thin', color: { argb: 'FFA5D6A7' } },
            right: { style: 'thin', color: { argb: 'FFA5D6A7' } }
          };
        });
      });

      const summaryStartRow = worksheet.rowCount + 2;
      const criticalCount = alertData.filter(item => Number(item["G-TOTAL"]) === 0).length;
      const highCount = alertData.filter(item => { const total = Number(item["G-TOTAL"]); return total > 0 && total < 500; }).length;
      const mediumCount = alertData.filter(item => { const total = Number(item["G-TOTAL"]); return total >= 500 && total < 1000; }).length;

      worksheet.mergeCells(`A${summaryStartRow}:D${summaryStartRow}`);
      worksheet.getCell(`A${summaryStartRow}`).value = 'ALERT SUMMARY';
      worksheet.getCell(`A${summaryStartRow}`).font = { size: 14, bold: true, color: { argb: 'FF2E7D32' } };
      worksheet.getCell(`A${summaryStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F8E9' } };

      const summaryData = [
        ['Critical (Out of Stock)', criticalCount, 'items', 'Immediate action required'],
        ['High (< 500kg)', highCount, 'items', 'Order soon'],
        ['Medium (500-999kg)', mediumCount, 'items', 'Monitor closely'],
        ['TOTAL ALERTS', criticalCount + highCount + mediumCount, 'items', '']
      ];
      summaryData.forEach((d, i) => {
        const row = worksheet.addRow(d);
        if (i === summaryData.length - 1) {
          row.font = { bold: true, color: { argb: 'FF2E7D32' } };
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F8E9' } };
        } else {
          row.font = { color: { argb: 'FF388E3C' } };
        }
      });

      const noteRow = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${noteRow}:D${noteRow}`);
      worksheet.getCell(`A${noteRow}`).value =
        'Note: This report shows chemicals with stock levels below 1000kg. Please review and take appropriate action.';
      worksheet.getCell(`A${noteRow}`).font = { size: 10, italic: true, color: { argb: 'FF66BB6A' } };
      worksheet.getCell(`A${noteRow}`).alignment = { horizontal: 'left' };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 5) row.height = 25;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RM-Stock-Alert-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${alertData.length} alert items to Excel!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="rm-container">
      <div className="rm-bg"></div>
      <button className="rm-add-btn" onClick={openModal} style={{ position: "absolute", top: 30, right: 40, zIndex: 2 }}>
        Upload RM (Monthly)
      </button>

      {showModal && (
        <div className="rm-modal-overlay">
          <div className="rm-modal-content">
            <button className="rm-modal-close-btn" onClick={closeModal}>×</button>
            <h2>
              <FaUpload style={{ color: "#2D85C5", marginRight: 10, verticalAlign: "middle" }} />
              Upload RM (Monthly)
            </h2>
            <form
              style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24, gap: 16 }}
              onSubmit={handleUpload}
            >
              <label
                htmlFor="rm-upload-input"
                className={`rm-upload-dropzone${dragActive ? " drag-active" : ""}`}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer",
                  padding: "24px 32px", border: "2px dashed #61bdee", borderRadius: 12, background: "#fafdff",
                  transition: "border 0.2s", borderColor: dragActive ? "#2D85C5" : "#61bdee",
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <FaUpload size={36} color={dragActive ? "#2D85C5" : "#61bdee"} style={{ marginBottom: 8 }} />
                <span style={{ color: "#2986cc", fontWeight: 500, fontSize: 16 }}>
                  {file ? file.name : "Click or drag file to upload"}
                </span>
                <input
                  id="rm-upload-input"
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </label>
              <button type="submit" style={{ marginTop: 8 }} disabled={!file || submitting}>
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* form + search */}
      <div className="rm-form-container">
        <div className="rm-search-group">
          <input
            className="rm-search-input"
            type="text"
            placeholder="Enter Chemical Code"
            value={search}
            onChange={handleSearchChange}
            disabled={showModal}
          />
          <button className="rm-search-btn" type="button" onClick={handleSearch} disabled={showModal}>
            <FaSearch />
          </button>
        </div>

        <div className="rm-form-divider"></div>

        <form onSubmit={handleFormSubmit} className="rm-form-inputs">
          <input
            className="rm-form-input"
            type="text"
            name="chemCode"
            placeholder="Chemical Code"
            value={formData.chemCode}
            onChange={handleFormChange}
            disabled={showModal || submitting}
            style={{ width: "120px" }}
          />
          <input
            className="rm-form-input"
            type="number"
            name="inAmount"
            placeholder="In"
            value={formData.inAmount}
            onChange={handleFormChange}
            disabled={showModal || submitting}
            style={{ width: "80px" }}
          />
          <input
            className="rm-form-input"
            type="number"
            name="outAmount"
            placeholder="Out"
            value={formData.outAmount}
            onChange={handleFormChange}
            disabled={showModal || submitting}
            style={{ width: "80px" }}
          />
          <button className="rm-form-submit" type="submit" disabled={showModal || submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="rm-title">RM Stock</div>

      <div className="rm-username-section">
        <FaArrowLeft
          className="rm-icon-back btn-back"
          style={{
            cursor: "pointer", marginRight: "12px", fontSize: "18px", color: "#2D85C5", marginTop: "4px",
            position: "absolute", left: "-40px", top: "50%", transform: "translateY(-50%)",
          }}
          onClick={() => navigate("/menu")}
          title="กลับไปหน้าหลัก"
        />
        <div style={{ zIndex: 10000, position: "relative" }}>
          <UserSection />
        </div>
      </div>

      <div className="rm-main-bg" />
      <div className="rm-main-inner-bg">
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", fontSize: "18px", color: "#00416f" }}>
            Loading Data...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "50px", fontSize: "18px", color: "red" }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              {submitting && (
                <div
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 10, fontSize: "16px", color: "#2D85C5",
                  }}
                >
                  Updating...
                </div>
              )}

              <div className="rm-table-bg">
                <div className="rm-table-scroll">
                  <table className="rm-table">
                    <thead>
                      <tr>
                        <th>Chemical Code</th>
                        <th>Previous G-total (kg)</th>
                        <th>Latest In (kg)</th>
                        <th>Latest Out (kg)</th>
                        <th>G-total (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(search ? filteredData : data).map((item, idx) => (
                        <tr key={idx}>
                          <td
                            style={{
                              background:
                                search &&
                                item["Code"] &&
                                item["Code"].toLowerCase().includes(search.toLowerCase())
                                  ? "#fff9c4"
                                  : "transparent",
                            }}
                          >
                            {item["Code"]}
                          </td>
                          <td style={{ color: '#666' }}>
                            {item["Previous G-total"] !== undefined
                              ? Number(item["Previous G-total"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : "0.00"}
                          </td>
                          <td style={{ color: '#4CAF50' }}>
                            {item["Latest In"] !== undefined
                              ? Number(item["Latest In"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : "0.00"}
                          </td>
                          <td style={{ color: '#F44336' }}>
                            {item["Latest Out"] !== undefined
                              ? Number(item["Latest Out"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : "0.00"}
                          </td>
                          <td style={{ fontWeight: '500', color: '#333' }}>
                            {item["G-TOTAL"] !== undefined && item["G-TOTAL"] !== null
                              ? Number(item["G-TOTAL"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rm-alert-container">
              {(search ? filteredData : data).some(item => {
                const total = Number(item["G-TOTAL"]);
                return total === 0 || (total > 0 && total < 1000);
              }) && (
                <button
                  onClick={exportAlertToExcel}
                  className="rm-export-btn"
                  style={{
                    marginBottom: '16px', padding: '10px 20px',
                    backgroundColor: '#1D6F42', color: 'white', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '8px', fontSize: '14px',
                    fontWeight: '500', transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(29, 111, 66, 0.3)'
                  }}
                >
                  <FaFileExcel style={{ fontSize: '18px' }} />
                  Export Alerts to Excel
                </button>
              )}
              <div className="rm-alert-list">
                {(search ? filteredData : data)
                  .filter((item) => {
                    const total = Number(item["G-TOTAL"]);
                    return total === 0 || (total > 0 && total < 1000);
                  })
                  .map((item, idx) => {
                    const total = Number(item["G-TOTAL"]);
                    return (
                      <div
                        key={idx}
                        className={`rm-alert-${total === 0 ? 'red' : 'orange'}`}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 16px',
                          borderRadius: '8px', marginBottom: '8px',
                          backgroundColor: total === 0 ? '#ffe5e5' : '#fff3e0',
                          border: `1px solid ${total === 0 ? '#ffb3b3' : '#ffe0b2'}`,
                        }}
                      >
                        <span className="alert-icon" style={{ marginRight: '8px' }}>
                          {total === 0 ? '🚨' : '⚠️'}
                        </span>
                        <b>{item["Code"]}</b>:&nbsp;
                        {total === 0
                          ? 'This chemical remain 0 kg'
                          : `Low stock alert: ${Number(total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg remaining`}
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rm-home-icon">
        <FaHome className="rm-icon-home" style={{ cursor: "pointer" }} onClick={() => navigate("/menu")} />
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default RM;
