import { Modal, Checkbox } from "antd";
import { useState } from "react";
import "./CleanDataPopup.css"; // Importing the CSS styles

export const CleanDataPopup = ({ showModal, setShowModal, onCleanData }) => {
  const [options, setOptions] = useState({
    standardizeDateColumns: true,
    removeNulls: true,
    replaceExcessCategories: true,
    removeConstantColumns: true,
    removeUnreadableColumns: true,
  });

  const handleOptionChange = (e) => {
    setOptions({
      ...options,
      [e.target.name]: e.target.checked,
    });
  };

  return (
    <>
      <Modal
        title={<h3 className="clean-popup-title">Clean Dataset</h3>}
        open={showModal}
        centered
        onCancel={() => setShowModal(false)}
        className="clean-data-modal"
        footer={[
          <button
            key="clean"
            onClick={() => onCleanData(options)}
            className="btn btn-primary clean-popup-btn"
          >
            Preview Cleaned Data
          </button>,
        ]}
      >
        <div className="clean-popup-content">
          <Checkbox
            name="standardizeDateColumns"
            checked={options.standardizeDateColumns}
            onChange={handleOptionChange}
            className="clean-popup-checkbox"
          >
            Standardize Date Columns
          </Checkbox>

          <Checkbox
            name="removeNulls"
            checked={options.removeNulls}
            onChange={handleOptionChange}
            className="clean-popup-checkbox"
          >
            Remove Unexpected Nulls
          </Checkbox>

          <Checkbox
            name="replaceExcessCategories"
            checked={options.replaceExcessCategories}
            onChange={handleOptionChange}
            className="clean-popup-checkbox"
          >
            Replace Excess Categories with "Other"
          </Checkbox>

          <Checkbox
            name="removeConstantColumns"
            checked={options.removeConstantColumns}
            onChange={handleOptionChange}
            className="clean-popup-checkbox"
          >
            Remove Constant Columns
          </Checkbox>

          <Checkbox
            name="removeUnreadableColumns"
            checked={options.removeUnreadableColumns}
            onChange={handleOptionChange}
            className="clean-popup-checkbox"
          >
            Remove Mostly Unreadable Numerical Columns
          </Checkbox>
        </div>
      </Modal>
    </>
  );
};
