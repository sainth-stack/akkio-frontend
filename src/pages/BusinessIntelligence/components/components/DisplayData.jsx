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
  const [loading,setLoading] = useState(false)
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

  const handleChange = async(event, newValue) => {
    setValue(newValue);
    if(newValue === 3){
      setColumnsLoad(true)
      const res=await axios.post(`${akkiourl}/getting_column_description`)
      setColumnsLoad(false)
       setColumnsView(res?.data?.Column_description)
    }
  };



  return (
    <div style={{ minHeight: "90vh", overflow: "auto" }}>
      <Navbar />
      
      {!filename && !initialLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '60px 40px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '2px dashed #dee2e6',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#e9ecef',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              color: '#6c757d'
            }}>
              📊
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              No Data Uploaded
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6c757d',
              lineHeight: '1.6',
              marginBottom: '32px',
              maxWidth: '400px',
              margin: '0 auto 32px'
            }}>
              Upload your data file to start exploring insights, analyzing trends, and generating comprehensive reports.
            </p>
            <button 
              onClick={() => navigate('/data-source')} 
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1565c0';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1976d2';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.3)';
              }}
            >
              Upload Data
            </button>
          </div>
        </div>
      ) : (
        <div className="professional-table">
          
          <div className="filterData ms-2">
            <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
              centered
              sx={
                {
                  // backgroundColor: "#f5f5f5", // light background for the tab bar
                  // borderBottom: "2px solid #e0e0e0", // subtle border between tab and content
                  // boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)", // soft shadow for a modern feel
                  // borderRadius: "8px 8px 0px", // rounded corners on top
                }
              }
            >
              <Tab
                label="General View"
                sx={{
                  textTransform: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#f1f1f1", // light hover effect
                  },
                  "&.Mui-selected": {
                    color: "#1976d2", // selected tab color
                    fontWeight: "bold", // bold text for selected tab
                  },
                }}
              />
       
              {/* <Tab
                label="Data View"
                sx={{
                  textTransform: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#f1f1f1", // light hover effect
                  },
                  "&.Mui-selected": {
                    color: "#1976d2", // selected tab color
                    fontWeight: "bold", // bold text for selected tab
                  },
                }}
              />
              <Tab
                label="Columns Overview"
                sx={{
                  textTransform: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#f1f1f1", // light hover effect
                  },
                  "&.Mui-selected": {
                    color: "#1976d2", // selected tab color
                    fontWeight: "bold", // bold text for selected tab
                  },
                }}
              /> */}

            <Tab
                label="Missing Values"
                sx={{
                  textTransform: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#f1f1f1", // light hover effect
                  },
                  "&.Mui-selected": {
                    color: "#1976d2", // selected tab color
                    fontWeight: "bold", // bold text for selected tab
                  },
                }}
              />
                     <Tab
                label="Explore"
                sx={{
                  textTransform: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                  "&:hover": {
                    backgroundColor: "#f1f1f1", // light hover effect
                  },
                  "&.Mui-selected": {
                    color: "#1976d2", // selected tab color
                    fontWeight: "bold", // bold text for selected tab
                  },
                }}
              />
            </Tabs>
            {/* <div
              className="clean-section"
              onClick={() => {
                handleCleanButtonClick();
              }}
            >
              <AiOutlineClear size={25} />
              <span>Clean</span>
            </div> */}



            {/* <button className="btn btn-success" onClick={()=>debouncedFetchChartData()}>
              Reload
            </button> */}
          </div>

          {initialLoading ? (
            <div style={{display:'flex',justifyContent:'center',width:'100%'}}>
              <Spin className="spinner" size={"large"} />
            </div>
          ) : (
            <div className="">
              {value === 0 && filename && (
            <GeneralView {...{headers,data}} />
              )}
              
              
              {value === 1 &&filename&& <MissingValues />}
              {value === 2 && <Explore />}

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