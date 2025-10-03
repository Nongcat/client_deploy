import React, { useState, useEffect } from 'react';
import { FaSearch, FaCheck, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UserSection from '../components/UserSection';
import './productplan.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/apiConfig';

// ฟังก์ชันกลางสำหรับคำนวณเปอร์เซ็นต์ที่ผลิตได้จริง
const calculatePercentCanProduce = (item, inOutValues, inventory, lotInput, percentInput) => {
  const inv = inventory.find(invItem => invItem["Code"] === item.chemicalCode);
  const balance = inv ? parseFloat(inv["G-TOTAL"] ?? inv["G-total"] ?? 0) : 0;
  const inValue = parseFloat(inOutValues[item.chemicalCode]?.in) || 0;
  const outValue = parseFloat(inOutValues[item.chemicalCode]?.out) || 0;
  const chemUseNum = parseFloat((item.chemicalUse + '').replace(/,/g, '')) || 0;
  const lotNum = parseFloat(lotInput) || 1;
  const percentNum = parseFloat(percentInput) || 100;

  const totalNeedFor100 = chemUseNum * lotNum;
  const available = (balance + inValue) - outValue;

  if (available <= 0 || totalNeedFor100 === 0) return 0;

  const percentCanProduce = Math.min((available / totalNeedFor100) * 100, percentNum);
  return percentCanProduce;
};

const ProductPlan = () => {
  const [colorCodeInput, setColorCodeInput] = useState('');
  const [lotInput, setLotInput] = useState('');
  const [percentInput, setPercentInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [prefix, setPrefix] = useState("");

  const [colorCode, setColorCode] = useState('');
  const [lot, setLot] = useState('');
  const [percent, setPercent] = useState('');
  const [department, setDepartment] = useState('');

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inOutValues, setInOutValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const hasInsufficientChemical = () =>
    filtered.some((item) => {
      const inv = inventory.find(invItem => invItem["Code"] === item.chemicalCode);
      const balance = inv ? parseFloat(inv["G-TOTAL"] ?? inv["G-total"] ?? 0) : 0;
      const inValue = parseFloat(inOutValues[item.chemicalCode]?.in) || 0;
      const outValue = parseFloat(inOutValues[item.chemicalCode]?.out) || 0;
      const chemUseNum = parseFloat((item.chemicalUse + '').replace(/,/g, '')) || 0;
      const lotNum = parseFloat(lotInput) || 1;
      const percentNum = parseFloat(percentInput) || 100;
      const chemUseResult = chemUseNum * lotNum * percentNum / 100;

      const updatedBalance = (balance + inValue) - outValue;
      const diffNoti = updatedBalance - chemUseResult;
      return (diffNoti < 0 || updatedBalance < chemUseResult);
    });

  const getActualPercent = () => {
    if (!filtered.length) return 100;
    let minPercent = 100;
    filtered.forEach((item) => {
      const percentCanProduce = calculatePercentCanProduce(item, inOutValues, inventory, lotInput, percentInput);
      if (percentCanProduce < minPercent) minPercent = percentCanProduce;
    });
    return Math.max(0, minPercent);
  };

  useEffect(() => {
    const fetchFormulas = async () => {
      try {
        setLoading(true);
        const response = await api.get('/formula');
        const formattedData = response.data.map(item => ({
          colorCode: item.colorCode,
          chemicalCode: item.code,
          name: item.name || "Unknown",
          remarks: item.remarks || "",
          lot: "",
          chemicalUse: item.qtyPerLot ? item.qtyPerLot.toString() : "0",
          inStock: "",
          total: ""
        }));
        setData(formattedData);
        setError("");
      } catch (err) {
        console.error('Error fetching formulas:', err);
        setError("ไม่สามารถโหลดข้อมูลสูตรได้: " + (err.response?.data?.error || err.message));
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFormulas();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/rm');
        const formattedInventory = response.data.map(item => ({
          "Code": item.code,
          "G-TOTAL": item.g_total
        }));
        setInventory(formattedInventory);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setInventory([]);
      }
    };
    fetchInventory();
  }, []);

  const handleSearch = () => {
    setColorCode(colorCodeInput);
    setLot(lotInput);
    setPercent(percentInput);

    const result = data.filter(item => {
      const matchColorCode = item.colorCode === colorCodeInput;
      const matchPrefix = !prefix || item.remarks === prefix;
      return matchColorCode && matchPrefix;
    });
    setFiltered(result);
  };

  const today = new Date().toISOString().slice(0, 10);

  const submitData = {
    department,
    colorCode: colorCodeInput,
    lot: lotInput,
    date: dateInput,
    percent: percentInput
  };

  const handleConfirmSubmit = async () => {
    try {
      if (!department || !colorCodeInput || !lotInput || !percentInput || !dateInput || !prefix) {
        toast.error("Please fill in all required fields.");
        return;
      }
      const productPlanData = {
        department,
        colorCode: colorCodeInput,
        lot: parseFloat(lotInput),
        date: dateInput,
        percent: parseFloat(percentInput),
        remarks: prefix,
        updates: filtered.map((item) => ({
          chemicalCode: item.chemicalCode,
          inAmount: parseFloat(inOutValues[item.chemicalCode]?.in) || 0,
          outAmount: parseFloat(inOutValues[item.chemicalCode]?.out) || 0,
          useAmount: parseFloat((item.chemicalUse + '').replace(/,/g, '')) * parseFloat(lotInput) * parseFloat(percentInput) / 100
        }))
      };

      const response = await api.post('/productplan', productPlanData);

      if (response.status === 201) {
        const rmResponse = await api.get('/rm');
        setInventory(rmResponse.data.map(item => ({
          "Code": item.code,
          "G-TOTAL": item.g_total
        })));
        setShowConfirm(false);
        toast.success("Data saved successfully!");
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting product plan:', error);
      const errorMessage = error.response?.data?.error || "An error occurred while saving data.";
      toast.error(errorMessage);
    }
  };

  const handleInOutChange = (idx, field, value, chemicalCode) => {
    setInOutValues(prev => ({
      ...prev,
      [chemicalCode]: {
        ...prev[chemicalCode],
        [field]: value === "" ? 0 : Number(value)
      }
    }));
  };

  useEffect(() => {
    if (!showConfirm) {
      const local = localStorage.getItem('RM1.json');
      if (local) {
        setInventory(JSON.parse(local));
      }
    }
  }, [showConfirm]);

  const resetForm = () => {
    setColorCodeInput('');
    setLotInput('');
    setPercentInput('');
    setDateInput(new Date().toISOString().slice(0, 10));
    setPrefix('');
    setDepartment('');
    setColorCode('');
    setLot('');
    setPercent('');
    setFiltered([]);
    setInOutValues({});
  };

  /* ========== NEW: คีย์ลัด/Enter ========== */

  // เปิดยืนยันส่งได้หรือไม่
  const canOpenConfirm = () =>
    !!department &&
    !!colorCodeInput &&
    !!lotInput &&
    !!percentInput &&
    !!dateInput &&
    !hasInsufficientChemical();

  // Ctrl+Enter เปิดป๊อปอัฟ (เฉพาะตอนที่ modal ยังไม่เปิด)
  useEffect(() => {
    const onKey = (e) => {
      if (showConfirm) return;
      if (e.key === 'Enter' && e.ctrlKey) {
        if (canOpenConfirm()) {
          e.preventDefault();
          setShowConfirm(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConfirm, department, colorCodeInput, lotInput, percentInput, dateInput, inOutValues, filtered]);

  // เมื่อ modal เปิด: Enter = OK, Esc = Cancel
  const handleModalKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowConfirm(false);
    }
  };

  return (
    <div className="productplan-bg">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="productplan-header">
        <div style={{ position: "relative" }}>
          <div className="productplan-title-bg"></div>
          <div className="productplan-title">Formula & Stock Checker</div>
        </div>
        <div className="productplan-user">
          <FaHome
            className="icon-home"
            onClick={() => navigate('/menu')}
            style={{ cursor: "pointer" }}
          />
          <UserSection />
        </div>
      </div>

      {/* Toolbar */}
      <div className="productplan-toolbar">
        <span className="input-label">Department :</span>
        <div className="productplan-input-group">
          <select
            className="input-dropdown"
            value={department}
            onChange={e => setDepartment(e.target.value)}
          >
            <option value="">Department</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
            <option value="C4">C4</option>
            <option value="C5">C5</option>
            <option value="Pi1">Pi-1</option>
            <option value="Pi2">Pi-2</option>
          </select>
        </div>

        <span className="input-label">Product Code :</span>
        <div className="productplan-prefix-group">
          <select
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
          >
            <option value="">Remark</option>
            <option value="Syn.">Syn.</option>
            <option value="Pi-1">Pi-1</option>
            <option value="Pi-2">Pi-2</option>
          </select>
          <input
            className="input-code"
            placeholder="Enter Product Code"
            value={colorCodeInput}
            onChange={e => setColorCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && prefix) {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <button
          className="icon-btn"
          onClick={handleSearch}
          disabled={!prefix}
          style={{
            opacity: !prefix ? 0.5 : 1,
            cursor: !prefix ? "not-allowed" : "pointer"
          }}
          title={prefix ? "Search (Enter)" : "Select Remark first"}
        >
          <FaSearch />
        </button>

        <span className="input-label">Lot :</span>
        <div className="productplan-input-group" style={{ minWidth: 70, maxWidth: 90 }}>
          <input
            type="text"
            placeholder="Enter Lot"
            value={lotInput}
            onChange={e => setLotInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLot(lotInput);
              }
            }}
            style={{ width: "100%", minWidth: 0, padding: "0 8px" }}
          />
        </div>
        <button className="icon-btn" onClick={() => setLot(lotInput)} title="Set Lot (Enter)">
          <FaCheck />
        </button>

        <span className="input-label">% :</span>
        <div className="productplan-input-group" style={{ minWidth: 50, maxWidth: 70 }}>
          <input
            type="text"
            placeholder="%"
            value={percentInput}
            onChange={e => setPercentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setPercent(percentInput);
              }
            }}
            style={{ width: "100%", minWidth: 0, padding: "0 8px" }}
          />
        </div>
        <button className="icon-btn" onClick={() => setPercent(percentInput)} title="Set % (Enter)">
          <FaCheck />
        </button>

        <button
          className="productplan-formula-btn"
          onClick={() => navigate('/formula')}
          style={{
            background: "#32698e",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "8px 22px",
            fontSize: "18px",
            fontWeight: 600,
            marginLeft: 1,
            cursor: "pointer",
            transition: "background 0.2s"
          }}
        >
          Formula
        </button>

        <div className="productplan-input-group" style={{ marginLeft: 24 }}>
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canOpenConfirm()) {
                e.preventDefault();
                setShowConfirm(true);
              }
            }}
          />
        </div>
      </div>

      <div className="productplan-content-wrapper" style={{ display: "flex", flexDirection: "row", position: "relative" }}>
        <div className="productplan-content">
          <div className="productplan-info">
            <span>Department : {department}</span>
            <span>Product Code : {colorCode}</span>
            <span>Lot. : {lot}</span>
            <span>% : {percent}</span>
            {prefix && <span>Type : {prefix}</span>}
          </div>

          <div className="productplan-table-wrapper">
            <table className="productplan-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Name</th>
                  <th>Chemical Use (kg)</th>
                  <th>In (kg)</th>
                  <th>Out (kg)</th>
                  <th>Balance (kg)</th>
                  <th>Diff (kg)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const inv = inventory.find(invItem => invItem["Code"] === item.chemicalCode);
                  const balance = inv ? parseFloat(inv["G-TOTAL"] ?? inv["G-total"] ?? 0) : 0;

                  const inValue = parseFloat(inOutValues[item.chemicalCode]?.in) || 0;
                  const outValue = parseFloat(inOutValues[item.chemicalCode]?.out) || 0;
                  const chemUseNum = parseFloat((item.chemicalUse + '').replace(/,/g, '')) || 0;
                  const lotNum = parseFloat(lot) || 1;
                  const percentNum = parseFloat(percent) || 100;
                  const chemUseResult = chemUseNum * lotNum * percentNum / 100;

                  const diff = (balance + inValue - outValue) - chemUseResult;

                  return (
                    <tr key={idx}>
                      <td>{item.chemicalCode}</td>
                      <td>{item.name}</td>
                      <td>{chemUseResult.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="input-inout"
                          value={inOutValues[item.chemicalCode]?.in || ""}
                          onChange={e => handleInOutChange(idx, "in", e.target.value, item.chemicalCode)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canOpenConfirm()) {
                              e.preventDefault();
                              setShowConfirm(true);
                            }
                          }}
                          style={{ width: 70 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="input-inout"
                          value={inOutValues[item.chemicalCode]?.out || ""}
                          onChange={e => handleInOutChange(idx, "out", e.target.value, item.chemicalCode)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canOpenConfirm()) {
                              e.preventDefault();
                              setShowConfirm(true);
                            }
                          }}
                          style={{ width: 70 }}
                        />
                      </td>
                      <td>{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>{diff.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Box */}
        <div className="side-box">
          <div className="side-box-title">Notification</div>
          <div className="side-box-scroll">
            {hasInsufficientChemical() && (
              <>
                <div style={{
                  color: "#d9534f",
                  background: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: 8,
                  padding: "8px 16px",
                  margin: "12px 0",
                  fontWeight: 500
                }}>
                  Cannot submit. Some chemicals are insufficient for production. Please check your data!
                </div>
                <div style={{
                  color: "#b94a48",
                  background: "#fff",
                  border: "1px solid #ffeeba",
                  borderRadius: 8,
                  padding: "8px 16px",
                  margin: "12px 0",
                  fontWeight: 500
                }}>
                  {(() => {
                    let minPercent = 100;
                    let minChem = "";
                    filtered.forEach((item) => {
                      const percentCanProduce = calculatePercentCanProduce(item, inOutValues, inventory, lotInput, percentInput);
                      if (percentCanProduce < minPercent) {
                        minPercent = percentCanProduce;
                        minChem = item.chemicalCode + " (" + item.name + ")";
                      }
                    });
                    return (
                      <>
                        Actual producible percent: <b>{Math.max(0, minPercent).toFixed(3)}%</b>
                        {minChem && <> due to <b>{minChem}</b> being insufficient.</>}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
            {filtered.map((item, idx) => {
              const inv = inventory.find(invItem => invItem["Code"] === item.chemicalCode);
              const balance = inv ? parseFloat(inv["G-TOTAL"] ?? inv["G-total"] ?? 0) : 0;
              const inValue = parseFloat(inOutValues[item.chemicalCode]?.in) || 0;
              const outValue = parseFloat(inOutValues[item.chemicalCode]?.out) || 0;
              const chemUseNum = parseFloat((item.chemicalUse + '').replace(/,/g, '')) || 0;
              const lotNum = parseFloat(lot) || 1;
              const percentNum = parseFloat(percent) || 100;
              const chemUseResult = chemUseNum * lotNum * percentNum / 100;

              const updatedBalance = (balance + inValue) - outValue;
              const diffNoti = updatedBalance - chemUseResult;

              if (updatedBalance === 0 && diffNoti < 0) {
                return (
                  <div key={idx} className="noti-red">
                    <b>{item.chemicalCode}</b> : No remaining chemical. Cannot produce.<br />
                    <span style={{ fontWeight: 400 }}>Diff = {diffNoti.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</span>
                  </div>
                );
              } else if (updatedBalance > 0 && updatedBalance < chemUseResult) {
                return (
                  <div key={idx} className="noti-yellow">
                    <b>{item.chemicalCode}</b> : Can produce less than 100% of formula.<br />
                    <span style={{ fontWeight: 400 }}>Diff = {diffNoti.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</span>
                  </div>
                );
              } else if (updatedBalance >= chemUseResult && diffNoti < 1000) {
                return (
                  <div key={idx} className="noti-green">
                    <b>{item.chemicalCode}</b> : Sufficient for production but less than 1000kg remaining.<br />
                    <span style={{ fontWeight: 400 }}>Diff = {diffNoti.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="productplan-submit-btn"
          disabled={
            !department ||
            !colorCodeInput ||
            !lotInput ||
            !percentInput ||
            !dateInput ||
            hasInsufficientChemical()
          }
          onClick={() => setShowConfirm(true)}
          title="Submit (Ctrl+Enter)"
        >
          Submit
        </button>

        {/* Popup ยืนยัน */}
        {showConfirm && (
          <div className="modal-overlay">
            <div
              className="modal-content"
              tabIndex={-1}
              onKeyDown={handleModalKeyDown}  // <-- Enter = OK, Esc = Cancel
            >
              <h3>Submit Form</h3>
              <div className="confirm-list">
                <div>Department: <b>{department}</b></div>
                <div>Product Code: <b>{colorCodeInput}</b></div>
                {prefix && <div>Type: <b>{prefix}</b></div>}
                <div>Lot: <b>{lotInput}</b></div>
                <div>%: <b>{percentInput}</b></div>
                <div>Date: <b>{dateInput}</b></div>

                <div style={{ marginTop: 18, marginBottom: 6, fontWeight: 600, color: "#2986cc" }}>In/Out</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1rem", marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center" }}>Chemical Code</th>
                      <th style={{ textAlign: "right" }}>In</th>
                      <th style={{ textAlign: "right" }}>Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .filter(item =>
                        (inOutValues[item.chemicalCode]?.in || 0) !== 0 ||
                        (inOutValues[item.chemicalCode]?.out || 0) !== 0
                      )
                      .map(item => (
                        <tr key={item.chemicalCode}>
                          <td style={{ textAlign: "center" }}>{item.chemicalCode}</td>
                          <td style={{ textAlign: "right" }}>{inOutValues[item.chemicalCode]?.in || 0}</td>
                          <td style={{ textAlign: "right" }}>{inOutValues[item.chemicalCode]?.out || 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-btns">
                <button onClick={handleConfirmSubmit}>OK</button>
                <button onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPlan;
