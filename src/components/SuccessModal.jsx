import React from "react";
import './SuccessModal.css'; // Assuming you have a CSS file for styling

const SuccessModal = ({ isOpen, message, onOk }) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <div className="confirm-modal-header">
          <h3 className="confirm-modal-title">Success</h3>
        </div>
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="confirm-modal-btn confirm2" onClick={onOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;