// FormulaPage.jsx
import React, { useState, useEffect } from "react";
import "./formula.css";
import {
  FaHome,
  FaSearch,
  FaTrash,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserSection from "../components/UserSection";
import api from "../api/apiConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          minWidth: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <h3 style={{ color: "#e53935", marginBottom: 16 }}>{title}</h3>
        <div style={{ marginBottom: 24 }}>{message}</div>
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: "none",
              background: "#e53935",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Formula = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [prefix, setPrefix] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddFormula, setShowAddFormula] = useState(false);
  const [newFormulaCode, setNewFormulaCode] = useState("");
  const [newFormulaRemark, setNewFormulaRemark] = useState("");
  const initialChemicals = [
    { chemicalCode: "", name: "", chemicalUse: "" },
    { chemicalCode: "", name: "", chemicalUse: "" },
    { chemicalCode: "", name: "", chemicalUse: "" },
  ];
  const [newFormulaChemicals, setNewFormulaChemicals] =
    useState(initialChemicals);

  // add row (top of main table)
  const [newChemical, setNewChemical] = useState({
    colorCode: "",
    chemicalCode: "",
    name: "",
    chemicalUse: "",
  });

  const [editIdx, setEditIdx] = useState(null);
  const [editChemicalUse, setEditChemicalUse] = useState("");

  // delete formula modal state
  const [pendingDelete, setPendingDelete] = useState({ search: "", prefix: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // load all formula rows
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formulaResponse = await api.get("/formula");
        const formattedData = formulaResponse.data.map((item) => ({
          colorCode: item.colorCode,
          chemicalCode: item.code,
          name: item.name || item.code,
          chemicalUse: item.qtyPerLot || 0,
          remarks: item.remarks || "",
        }));
        setData(formattedData);
        setError("");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "Unable to load data: " + (err.response?.data?.error || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const formulaResponse = await api.get("/formula");
      const formattedData = formulaResponse.data.map((item) => ({
        colorCode: item.colorCode,
        chemicalCode: item.code,
        name: item.name || item.code,
        chemicalUse: item.qtyPerLot ? item.qtyPerLot.toString() : "0",
        remarks: item.remarks || "",
      }));
      setData(formattedData);
      setError("");
    } catch (err) {
      console.error("Error fetching formulas:", err);
      setError("Unable to load formula data.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChemicals =
    search &&
    data.filter(
      (item) =>
        item.chemicalCode &&
        item.colorCode &&
        item.colorCode.toLowerCase() === search.toLowerCase() &&
        (!prefix || item.remarks === prefix)
    );

  const handleDelete = (idx) => {
    if (!prefix) {
      toast.warn("Please select Remarks before deleting.");
      return;
    }
    const filtered = data.filter(
      (item) =>
        item.colorCode &&
        item.colorCode.toLowerCase().includes(search.toLowerCase())
    );
    const itemToDelete = filtered[idx];
    const newData = data.filter((item) => item !== itemToDelete);
    setData(newData);
  };

  const handleAdd = () => {
    if (!prefix) {
      toast.warn("Please select Prefix before adding.");
      return;
    }
    if (
      search &&
      newChemical.chemicalCode &&
      newChemical.name &&
      newChemical.chemicalUse
    ) {
      const newItem = {
        colorCode: search,
        chemicalCode: newChemical.chemicalCode,
        name: newChemical.name,
        chemicalUse: newChemical.chemicalUse,
        remarks: prefix || "",
      };
      setData([...data, newItem]);
      setNewChemical({
        colorCode: "",
        chemicalCode: "",
        name: "",
        chemicalUse: "",
      });
    }
  };

  const handleEditSave = (idx) => {
    if (!prefix) {
      toast.warn("Please select Prefix before editing.");
      return;
    }
    const filtered = data.filter(
      (item) =>
        item.colorCode &&
        item.colorCode.toLowerCase().includes(search.toLowerCase())
    );
    const itemToEdit = filtered[idx];
    const realIdx = data.findIndex((item) => item === itemToEdit);
    const newData = [...data];
    if (realIdx !== -1) {
      newData[realIdx] = { ...newData[realIdx], chemicalUse: editChemicalUse };
      setData(newData);
    }
    setEditIdx(null);
    setEditChemicalUse("");
  };

  const handleAddFormulaChemical = () => {
    setNewFormulaChemicals([
      ...newFormulaChemicals,
      { chemicalCode: "", name: "", chemicalUse: "" },
    ]);
  };

  const handleChangeFormulaChemical = (idx, field, value) => {
    const updated = [...newFormulaChemicals];
    updated[idx][field] = value;
    setNewFormulaChemicals(updated);
  };

  const handleSubmitFormula = async () => {
    if (!newFormulaCode || !newFormulaRemark) {
      toast.warn("Please enter Formula code and select Remark.");
      return;
    }
    const validChemicals = newFormulaChemicals.filter(
      (c) => c.chemicalCode && c.chemicalUse
    );
    if (validChemicals.length === 0) {
      toast.warn("Please enter at least 1 chemical.");
      return;
    }
    try {
      setLoading(true);

      const formulaData = {
        colorCode: newFormulaCode,
        chemicals: validChemicals.map((c) => ({
          code: c.chemicalCode,
          use: parseFloat(c.chemicalUse) || 0,
        })),
        remarks: newFormulaRemark,
      };

      await api.post("/formula/batch", formulaData);

      toast.success(
        `New formula ${newFormulaCode} (${newFormulaRemark}) created successfully.`
      );

      const formulaResponse = await api.get("/formula");
      const formattedData = formulaResponse.data.map((item) => ({
        colorCode: item.colorCode,
        chemicalCode: item.code,
        name: item.name || item.code,
        chemicalUse: item.qtyPerLot ? item.qtyPerLot.toString() : "0",
        remarks: item.remarks || "",
      }));

      setData(formattedData);

      setShowAddFormula(false);
      setNewFormulaCode("");
      setNewFormulaRemark("");
      setNewFormulaChemicals(initialChemicals);
    } catch (error) {
      console.error("? Error creating formula:", error);
      toast.error(
        "Error creating formula: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelModal = () => {
    setShowAddFormula(false);
    setNewFormulaCode("");
    setNewFormulaRemark("");
    setNewFormulaChemicals(initialChemicals);
  };

  const handleSubmitChanges = async () => {
    try {
      if (!prefix) {
        toast.warn("Please select Prefix (Syn., Pi-1, Pi-2) before saving.");
        return;
      }
      if (filteredChemicals.length === 0) {
        toast.warn("No formula data to save.");
        return;
      }
      setLoading(true);

      const formulaData = {
        colorCode: search,
        chemicals: filteredChemicals.map((item) => ({
          code: item.chemicalCode,
          use: parseFloat(item.chemicalUse),
        })),
        remarks: prefix,
      };

      const saveResponse = await fetch(
        "http://192.168.10.180:4000/api/formula/batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulaData),
        }
      );

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save formula");
      }

      await saveResponse.json();
      toast.success(`Formula ${search} (${prefix}) saved successfully.`);

      const formulaResponse = await api.get("/formula");
      const formattedData = formulaResponse.data.map((item) => ({
        colorCode: item.colorCode,
        chemicalCode: item.code,
        name: item.name || item.code,
        chemicalUse: item.qtyPerLot ? item.qtyPerLot.toString() : "0",
        remarks: item.remarks || "",
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error submitting changes:", error);
      toast.error(
        "Error saving formula: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFormula = () => {
    if (!search || !prefix) {
      toast.warn("Please select formula and Prefix to delete.");
      return;
    }
    setPendingDelete({ search, prefix });
    setShowDeleteModal(true);
  };

  const confirmDeleteFormula = async () => {
    setShowDeleteModal(false);
    try {
      setLoading(true);
      const deleteResponse = await fetch(
        `http://192.168.10.180:4000/api/formula/${pendingDelete.search}?remarks=${encodeURIComponent(
          pendingDelete.prefix
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || "Failed to delete formula");
      }

      toast.success(
        `Formula ${pendingDelete.search} (${pendingDelete.prefix}) deleted successfully.`
      );

      // refresh list after delete
      const formulaResponse = await api.get("/formula");
      const formattedData = formulaResponse.data.map((item) => ({
        colorCode: item.colorCode,
        chemicalCode: item.code,
        name: item.name || item.code,
        chemicalUse: item.qtyPerLot ? item.qtyPerLot.toString() : "0",
        remarks: item.remarks || "",
      }));
      setData(formattedData);

      // ?????????????????????????????? ??????? search/prefix ????
      const remainingFormulas = formattedData.filter(
        (item) =>
          item.colorCode === pendingDelete.search &&
          item.remarks === pendingDelete.prefix
      );

      if (remainingFormulas.length === 0) {
        setSearch("");
        // ?????? setShowTable(false) ?????????????????  ?????
      }
    } catch (error) {
      console.error("Error deleting formula:", error);
      toast.error(
        "Error deleting formula: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fml-container">
      {/* back button */}
      <button
        className="fml-back-btn"
        onClick={() => navigate("/productplan")}
        title="????????"
        style={{
          position: "absolute",
          top: 35,
          left: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
          zIndex: 1001,
          padding: 0,
        }}
      >
        <FaArrowLeft style={{ fontSize: 28, color: "#2986cc" }} />
      </button>

      <ToastContainer position="top-right" autoClose={3000} />

      <div className="fml-bg"></div>

      {/* search */}
      <div className="fml-search-group">
        <div className="fml-search-prefix-group">
          <select
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="fml-search-prefix"
          >
            <option value="">Remark</option>
            <option value="Syn.">Syn.</option>
            <option value="Pi-1">Pi-1</option>
            <option value="Pi-2">Pi-2</option>
          </select>
          <input
            className="fml-search-input"
            type="text"
            placeholder="Enter Formula Code"
            value={search}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\w\-\.]/g, "");
              setSearch(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            disabled={false}
          />
        </div>
        <button
          className="fml-search-btn"
          type="button"
          onClick={handleSearch}
          disabled={showAddFormula}
        >
          <FaSearch />
        </button>
        <button
          className="fml-extra-btn"
          type="button"
          style={{
            marginLeft: 8,
            background: "#61bdee",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0 16px",
            height: "45px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={() => setShowAddFormula(true)}
        >
          New Formula
        </button>
      </div>

      <div className="fml-title">Formula</div>

      {/* user section */}
      <div className="fml-username-section">
        <FaArrowLeft
          className="fml-icon-back btn-back"
          style={{
            cursor: "pointer",
            marginRight: "12px",
            fontSize: "18px",
            color: "#2986cc",
            marginTop: "4px",
            position: "absolute",
            left: "-40px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
          onClick={() => navigate("/productplan")}
          title="????????"
        />
        <UserSection />
      </div>

      <div className="fml-main-bg" />
      <div className="fml-main-inner-bg">
        <div style={{ display: "flex", gap: "32px" }}>
          {/* left panel */}
          <div style={{ flex: "1" }}>
            <div className="fml-formula-title">
              Formula Code: {search || "-"}
            </div>

            {/* modal new formula */}
            {showAddFormula && (
              <div className="fml-modal-bg">
                <div className="fml-modal-content">
                  <div className="fml-modal-header">
                    <h3 className="fml-modal-title">New Formula</h3>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div className="fml-formula-input-group">
                        <label className="fml-formula-label">Formula Code: </label>
                        <input
                          type="text"
                          value={newFormulaCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\w\-\.]/g, "");
                            setNewFormulaCode(value);
                          }}
                          className="fml-formula-input"
                        />
                      </div>
                      <div className="fml-formula-input-group">
                        <label className="fml-formula-label">Remark: </label>
                        <select
                          className="fml-formula-input"
                          value={newFormulaRemark}
                          onChange={(e) => setNewFormulaRemark(e.target.value)}
                        >
                          <option value="">--Select Remark--</option>
                          <option value="Syn.">Syn.</option>
                          <option value="Pi-1">Pi-1</option>
                          <option value="Pi-2">Pi-2</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="fml-table-bg">
                    <div className="fml-table-scroll">
                      <table className="fml-table">
                        <thead>
                          <tr>
                            <th style={{ width: 160, textAlign: "center" }}>
                              Chemical Code
                            </th>
                            <th style={{ width: 120, textAlign: "center" }}>
                              Chemical Use
                            </th>
                            <th style={{ width: 80, textAlign: "center" }}>
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {newFormulaChemicals.map((chem, idx) => (
                            <tr key={idx}>
                              <td style={{ textAlign: "center" }}>
                                <input
                                  type="text"
                                  placeholder="chemicalCode"
                                  value={chem.chemicalCode}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^\w\-\.]/g,
                                      ""
                                    );
                                    handleChangeFormulaChemical(
                                      idx,
                                      "chemicalCode",
                                      value
                                    );
                                  }}
                                  style={{ width: "120px", textAlign: "center" }}
                                />
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <input
                                  type="text"
                                  placeholder="use"
                                  value={chem.chemicalUse}
                                  onChange={(e) =>
                                    handleChangeFormulaChemical(
                                      idx,
                                      "chemicalUse",
                                      e.target.value
                                    )
                                  }
                                  style={{ width: "80px", textAlign: "center" }}
                                />
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  className="fml-btn-delete"
                                  onClick={() =>
                                    setNewFormulaChemicals(
                                      newFormulaChemicals.filter(
                                        (_, i) => i !== idx
                                      )
                                    )
                                  }
                                  title="??"
                                  disabled={newFormulaChemicals.length === 1}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} style={{ textAlign: "right" }}>
                              <button
                                className="fml-btn-add-row"
                                onClick={handleAddFormulaChemical}
                              >
                                add row
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="fml-modal-footer">
                    <button
                      className="fml-btn-submit"
                      onClick={handleSubmitFormula}
                      disabled={
                        loading ||
                        !newFormulaCode ||
                        !newFormulaRemark ||
                        newFormulaChemicals.filter(
                          (c) => c.chemicalCode && c.chemicalUse
                        ).length === 0
                      }
                    >
                      {loading ? "..." : "Submit"}
                    </button>
                    <button className="fml-btn-cancel" onClick={handleCancelModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* main table */}
            {!showAddFormula && (
              <div className="fml-main-table-area" style={{ display: "flex", gap: 32 }}>
                <div className="fml-main-table-bg">
                  <div className="fml-main-table-header">
                    <th>Chemical Code</th>
                    <th>Chemical Name</th>
                    <th>Chemical Use</th>
                    <th>Action</th>
                  </div>

                  <div className="fml-main-table-scroll">
                    <table className="fml-main-table">
                      <tbody>
                        <tr>
                          <td>
                            <input
                              type="text"
                              placeholder="Chemical Code"
                              value={newChemical.chemicalCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\w\-\.]/g, "");
                                setNewChemical({
                                  ...newChemical,
                                  chemicalCode: value,
                                });
                              }}
                              style={{ width: "90px" }}
                              disabled={!prefix}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Chemical Name"
                              value={newChemical.name}
                              onChange={(e) =>
                                setNewChemical({
                                  ...newChemical,
                                  name: e.target.value,
                                })
                              }
                              style={{ width: "120px" }}
                              disabled={!prefix}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Chemical Use"
                              value={newChemical.chemicalUse}
                              onChange={(e) =>
                                setNewChemical({
                                  ...newChemical,
                                  chemicalUse: e.target.value,
                                })
                              }
                              style={{ width: "90px" }}
                              disabled={!prefix}
                            />
                          </td>
                          <td>
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: !prefix ? "#ccc" : "#2986cc",
                                cursor: !prefix ? "not-allowed" : "pointer",
                                marginLeft: 4,
                              }}
                              onClick={handleAdd}
                              title={!prefix ? "Select Prefix first" : "Add"}
                              disabled={!prefix}
                            >
                              <FaPlus />
                            </button>
                          </td>
                        </tr>

                        {filteredChemicals && filteredChemicals.length > 0
                          ? [
                              ...filteredChemicals.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.chemicalCode}</td>
                                  <td>{item.name}</td>
                                  <td>
                                    {editIdx === idx ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <input
                                          type="text"
                                          value={editChemicalUse}
                                          autoFocus
                                          style={{ width: "90px" }}
                                          onChange={(e) =>
                                            setEditChemicalUse(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                              handleEditSave(idx);
                                            if (e.key === "Escape") {
                                              setEditIdx(null);
                                              setEditChemicalUse("");
                                            }
                                          }}
                                          disabled={!prefix}
                                        />
                                        <button
                                          style={{
                                            background: "none",
                                            border: "none",
                                            color: !prefix ? "#ccc" : "#43a047",
                                            cursor: !prefix
                                              ? "not-allowed"
                                              : "pointer",
                                            padding: 0,
                                          }}
                                          onClick={() => handleEditSave(idx)}
                                          title={!prefix ? "Select Prefix " : "Confirm"}
                                          disabled={!prefix}
                                        >
                                          <FaCheck />
                                        </button>
                                        <button
                                          style={{
                                            background: "none",
                                            border: "none",
                                            color: !prefix ? "#ccc" : "#e53935",
                                            cursor: !prefix
                                              ? "not-allowed"
                                              : "pointer",
                                            padding: 0,
                                          }}
                                          onClick={() => {
                                            setEditIdx(null);
                                            setEditChemicalUse("");
                                          }}
                                          title={!prefix ? "Select Prefix " : "Cancel"}
                                          disabled={!prefix}
                                        >
                                          <FaTimes />
                                        </button>
                                      </div>
                                    ) : (
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <span style={{ marginRight: 8 }}>
                                          {item.chemicalUse}
                                        </span>
                                        <button
                                          style={{
                                            background: "none",
                                            border: "none",
                                            color: !prefix ? "#ccc" : "#2986cc",
                                            cursor: !prefix
                                              ? "not-allowed"
                                              : "pointer",
                                            padding: 0,
                                          }}
                                          onClick={() => {
                                            if (prefix) {
                                              setEditIdx(idx);
                                              setEditChemicalUse(item.chemicalUse);
                                            }
                                          }}
                                          title={
                                            !prefix
                                              ? "Select Remarks Before Editing"
                                              : "Edit"
                                          }
                                          disabled={!prefix}
                                        >
                                          <FaEdit />
                                        </button>
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <div className="fml-action-cell">
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: !prefix ? "#ccc" : "#e53935",
                                          cursor: !prefix
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                        onClick={() => {
                                          if (prefix) {
                                            handleDelete(idx);
                                          }
                                        }}
                                        title={!prefix ? "Select Remarks " : "Delete"}
                                        disabled={!prefix}
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )),
                              ...Array.from({
                                length: Math.max(0, 8 - filteredChemicals.length),
                              }).map((_, idx) => (
                                <tr key={`empty-${idx}`}>
                                  <td colSpan={4} style={{ height: 40 }}></td>
                                </tr>
                              )),
                            ]
                          : Array.from({ length: 8 }).map((_, idx) => (
                              <tr key={idx}>
                                <td
                                  colSpan={4}
                                  style={{
                                    textAlign: "center",
                                    color: "#aaa",
                                    height: 40,
                                  }}
                                >
                                  {idx === 0 ? "Data Not Found" : ""}
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>

                  {/* submit / delete formula buttons */}
                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-start",
                    }}
                  >
                    <button
                      className="fml-main-btn-submit"
                      onClick={handleSubmitChanges}
                      disabled={
                        loading || filteredChemicals.length === 0 || !prefix
                      }
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#2986cc",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: loading || !prefix ? "not-allowed" : "pointer",
                        fontWeight: "500",
                        opacity:
                          loading || filteredChemicals.length === 0 || !prefix
                            ? 0.6
                            : 1,
                        fontSize: "24px !important",
                      }}
                    >
                      {loading
                        ? "loading..."
                        : !prefix
                        ? "Select Remarks"
                        : "Submit"}
                    </button>

                    <button
                      className="fml-main-btn-delete"
                      onClick={handleDeleteFormula}
                      disabled={loading || !search || !prefix}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#e53935",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          loading || !search || !prefix
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "500",
                        opacity: loading || !search || !prefix ? 0.6 : 1,
                        fontSize: "20px",
                      }}
                    >
                      {loading
                        ? "loading..."
                        : !search || !prefix
                        ? "Select Formula"
                        : "Delete Formula"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right: all formulas */}
          <div style={{ width: "250px" }}>
            <div className="fml-formula-list-title">All Formulas</div>
            <div className="fml-formula-list-panel">
              <ul className="fml-formula-list">
                {[...new Set(data.map((item) => `${item.colorCode}|${item.remarks}`))]
                  .filter((codeWithRemark) => {
                    const [code] = codeWithRemark.split("|");
                    return code;
                  })
                  .map((codeWithRemark) => {
                    const [code, remark] = codeWithRemark.split("|");
                    const active = code === search && remark === prefix;
                    return (
                      <li
                        key={codeWithRemark}
                        className={active ? "active" : ""}
                        style={{
                          cursor: "pointer",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: active ? "#e3f2fd" : "transparent",
                          color: active ? "#2986cc" : "#333",
                          fontWeight: active ? 700 : 400,
                          marginBottom: 4,
                        }}
                        onClick={() => {
                          setSearch(code);
                          setPrefix(remark);
                          // ?????? setShowTable(true)  ?????????
                        }}
                      >
                        {code} ({remark})
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="fml-home-icon">
        <FaHome
          className="fml-icon-home"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/menu")}
        />
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Formula"
        message={`Are you sure you want to delete formula "${pendingDelete.search}" (${pendingDelete.prefix})? This action cannot be undone.`}
        onConfirm={confirmDeleteFormula}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default Formula;
