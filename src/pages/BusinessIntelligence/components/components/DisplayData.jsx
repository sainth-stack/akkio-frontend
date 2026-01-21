import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useDataAPI } from "../contexts/GetDataApi";
import EndPopup from "./EndPopup";
import { Spin, Modal } from "antd";
import { BsStars } from "react-icons/bs";
import { PivotView } from "./popups/pivotVIew";
import { akkiourl } from "../../../../utils/const";
import "../styles/discover.scss";
import { CleanDataPopup } from "./popups/cleandata";
import { Tabs, Tab } from "@mui/material";
import axios from 'axios';
import MissingValues from "./prediction/fillcsv";
import GeneralView from "./general-view";
import Explore from '../../../Explore';
import EmptyState from "../../../../components/EmptyState";

const DisplayData = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);
  const [displaypopup, setDisplaypopup] = useState(false);
  const [popup, setPopup] = useState(false);
  const [prepData, setPrepData] = useState("");
  const [filename, setFilename] = useState(localStorage.getItem("filename") || "");
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [value, setValue] = useState(0);
  const [columnsView, setColumnsView] = useState('');
  const [columnsLoading, setColumnsLoad] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();
  const { displayContent, handleCleanData, handlePrepareData } = useDataAPI();

  function removeDuplicates(arr) {
    return [...new Set(arr)];
  }

  function count(arr, value) {
    if (isNaN(value) && typeof value == "number") {
      return arr.filter((val) => isNaN(val) && typeof val == "number").length;
    }
    return arr.reduce((count, current) => (value === current ? count + 1 : count), 0);
  }



  const handleOk = async () => {
    setConfirmLoading(true);
    await handlePrepareData(prepData);
    setTimeout(() => {
      setConfirmLoading(false);
    }, 2000);
    setOpen(false);
  };

  const handleRowHover = (index) => {
    setHoveredRowIndex(index);
  };

  const convertToCSV = (data, headers) => {
    const csvContent = [headers.join(",")];
    data.forEach((item) => {
      const row = headers.map((header) => item[header]);
      csvContent.push(row.join(","));
    });
    return csvContent.join("\n");
  };

  const downloadCSV = () => {
    const csvData = convertToCSV(data, headers);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchColumnDescriptions = async () => {
    setColumnsLoad(true);
    try {
      const res = await axios.post(`${akkiourl}/getting_column_description`);
      setColumnsView(res?.data?.Column_description || '');
    } finally {
      setColumnsLoad(false);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setValue(newValue);
    if (newValue === 3) {
      await fetchColumnDescriptions();
    }
  };

  useEffect(() => {
    setInitialLoading(true);
    setHeaders(displayContent.headers || []);
    setData(displayContent.data || []);
    setFilename(localStorage.getItem("filename") || "");
    setInitialLoading(false);
  }, [displayContent]);

  useEffect(() => {
    setPopup(displaypopup);
  }, [displaypopup]);

  const handleChange = async (event, newValue) => {
    setValue(newValue);
    if (newValue === 3) {
      setColumnsLoad(true)
      const res = await axios.post(`${akkiourl}/getting_column_description`)
      setColumnsLoad(false)
      setColumnsView(res?.data?.Column_description)
    }
  };



  return (
    <div style={{ minHeight: "90vh", overflow: "auto", paddingLeft: '20px' }}>
      <Navbar />

      {!filename && !initialLoading ? (
        <EmptyState />
      ) : (
        <div className="professional-table">



          {initialLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Spin className="spinner" size={"large"} />
            </div>
          ) : (
            <div className="">
              {value === 0 && filename && (
                <GeneralView {...{ headers, data }} />
              )}


              {/* {value === 1 &&filename&& <MissingValues />} */}
              {/* {value === 2 && <Explore />} */}

            </div>
          )}
        </div>
      )}

      {displaypopup && <EndPopup setDisplaypopup={setDisplaypopup} popup={popup} />}

      <Modal
        title=""
        open={open}
        style={{ top: "40%", zIndex: 99999 }}
        onCancel={() => setOpen(false)}
        footer={[
          <button
            key="link"
            type="primary"
            loading={loading}
            onClick={handleOk}
            style={{ width: "100%" }}
            className="btn btn-primary"
          >
            Upgrade Plan
          </button>,
        ]}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BsStars
            size={24}
            color="blue"
            style={{ marginTop: "20px", marginBottom: "10px" }}
          />
          <p style={{ fontSize: "18px", fontWeight: "500" }}>
            This feature is not available for the view only plan.
          </p>
          <p style={{ fontSize: "14px", fontWeight: "400" }}>
            Please Upgrade your plan to use this feature
          </p>
        </div>
      </Modal>

      {showPopup && (
        <CleanDataPopup
          {...{
            showModal: showPopup,
            setShowModal: setShowPopup,
          }}
          onClose={() => setShowPopup(false)}
          onCleanData={(options) => {
            handleCleanData(options);
            setShowPopup(false);
          }}
        />
      )}
    </div>
  );
};

export default DisplayData;