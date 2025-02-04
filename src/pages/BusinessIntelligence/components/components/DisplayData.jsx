import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import BarGraph from "./BarGraph";
import { useDataAPI } from "../contexts/GetDataApi";
import EndPopup from "./EndPopup";
import { Button } from "@mui/material";
import { Spin, Modal, Input, Progress } from "antd";
import { AiOutlineClear } from "react-icons/ai";
import { BsStars } from "react-icons/bs";
import { PivotView } from "./popups/pivotVIew";
import ChatDataPrep from "./popups/chatdataprep";
import { getFinalData } from "../../../../utils/const";
import "../styles/discover.scss";
import { CleanDataPopup } from "./popups/cleandata";
import { Insights } from "./insights";
import { Tabs, Tab, Box } from "@mui/material";

const DisplayData = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);
  const [displaypopup, setDisplaypopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(displaypopup);
  const [prepData, setPrepData] = useState("");
  const [filename, setFilename] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [view, setView] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [value, setValue] = useState(0); // Default selected tab (General View)

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCleanButtonClick = () => {
    setShowPopup(!showPopup);
  };
  const navigate = useNavigate();
  const {
    displayPopupFun,
    displayContent,
    handleCleanData,
    handlePrepareData,
    files,
  } = useDataAPI();

  function removeDuplicates(arr) {
    return [...new Set(arr)];
  }

  function count(arr, value) {
    if (isNaN(value) && typeof value == "number") {
      return arr.filter((value) => isNaN(value) && typeof value == "number")
        .length;
    } else {
      return arr.reduce((count, currtElm) => {
        if (value === currtElm) {
          count++;
        }
        return count;
      }, 0);
    }
  }

  const handleChatprepData = () => {
    localStorage.setItem("prepData", JSON.stringify(data));
    setShowModel(true);
  };
  const handleOk = async () => {
    // setModalText('The modal will be closed after two seconds');
    // setPrepData(e.)
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
    const csvContent = [];
    const header = Object.keys(data[0]);
    csvContent.push(headers.join(","));

    data.forEach((item) => {
      const row = header.map((key) => item[key]);
      csvContent.push(row.join(","));
    });

    return csvContent.join("\n");
  };

  const downloadCSV = () => {
    const filteredData = data.map((field) => {
      return headers.map((header) => {
        return field[header];
      });
    });

    const csvData = convertToCSV(filteredData, headers);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "data.csv";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setLoading(true);
    setHeaders(displayContent.headers);
    setData(displayContent.data);
    setFilename(localStorage.getItem("filename"));

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, [displayContent]);

  useEffect(() => {
    setPopup(displaypopup);
  }, [displaypopup]);

  return (
    <div style={{ minHeight: "90vh", overflow: "auto" }}>
      <Navbar />
      <div className="professional-table">
        <div className="file-details ms-2">
          {/* <img src="/keyPulse.png" onClick={() => {
            navigate("/")
          }} style={{ cursor: "pointer" }} alt="KeyPulse" width={150} height={65} /> */}
          <p>{filename}</p>
          <p>{data.length} rows</p>
          <p>{headers.length} columns</p>
        </div>
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
                // borderRadius: "8px 8px 0 0", // rounded corners on top
              }
            }
          >
            <Tab
              label="Discover"
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
            <Tab
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
          </Tabs>
          <Button
            variant="outlined"
            onClick={() => {
              handleChatprepData();
            }}
          >
            Chat Data Prep
          </Button>
          <div
            className="clean-section"
            onClick={() => {
              handleCleanButtonClick();
            }}
          >
            <AiOutlineClear size={25} />
            <span>Clean</span>
          </div>

          <button className="btn btn-success" onClick={downloadCSV}>
            Download CSV
          </button>
        </div>

        {loading ? (
          <Spin className="spinner" size={"large"} />
        ) : (
          <div className="">
            <>
              {value == 1 && (
                <table style={{ border: "none" }} className="discover-table">
                  <thead>
                    <tr style={{ zIndex: 9999999 }}>
                      {headers.map((header, index) => {
                        return <th key={index}>{header}</th>;
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((row, index) => {
                      return (
                        <tr
                          key={index}
                          className={index === hoveredRowIndex ? "hovered" : ""}
                          onMouseEnter={() => handleRowHover(index)}
                          onMouseLeave={() => handleRowHover(-1)}
                        >
                          {headers.map((head, index) => {
                            return <td key={index}>{row[head]}</td>;
                          })}

                          {/* Add more data columns as needed */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {value == 2 && (
                <div>
                  <PivotView {...{ headers, data, removeDuplicates }} />
                </div>
              )}
            </>

            {value == 0 && <Insights />}
          </div>
        )}
      </div>
      {displaypopup ? (
        <EndPopup setDisplaypopup={setDisplaypopup} popup={popup} />
      ) : (
        <></>
      )}

      <Modal
        title=""
        open={open}
        style={{ top: "40%", zIndex: 99999 }}
        onCancel={() => setOpen(false)}
        footer={[
          <button
            key="link"
            href="https://google.com"
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
        {/* <Input size='large' onChange={(e) => handleEvent(e)} value={prepData} type="text" placeholder="e.g. Filter out all columns except the first 2" /> */}
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
      <></>
      <div style={{ padding: "16px", overflowY: "auto", height: "100%" }}>
        <ChatDataPrep {...{ showModel, setShowModel }} />
      </div>
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
