import "../styles/datasource.scss";
// import tableSvg from "../../../../assets/svg/table.svg";
import { useNavigate } from "react-router-dom";
import PostgreSql from "./popups/postgresql";
import React, { useEffect, useState } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
import { Modal } from "antd";
import MqttConfig from "./popups/MqttConfig";
import SapConfig from "./popups/sap";
import { useFileUpload } from './useApi';
// import { FaRobot, FaDatabase } from "react-icons/fa";
// import { HiSparkles } from "react-icons/hi";
import SyntheticData from "./popups/SyntheticData";
import { ConnectData } from "./popups/connectData";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { AiFillPlusCircle, AiFillCheckCircle } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";

export const DataSource = () => {
  const navigate = useNavigate();
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [, setConnection] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { uploadedData, handleUpload } = useDataAPI();
  const [file, setFile] = useState(null);
  
  const [mqttOpen, setMqttOpen] = useState(false);
  const [sapOpen, setSapOpen] = useState(false);
  const { uploadFile, isLoading } = useFileUpload();
  const [uploadError, setUploadError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [syntheticDataOpen, setSyntheticDataOpen] = useState(false);
  const [connectDataOpen, setConnectDataOpen] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const email = JSON.parse(localStorage.getItem("user"))?.email;
  const [itemLoading, setItemLoading] = useState({});
  const [selected, setSelected] = useState("");

  const handleCancel = () => {
    setOpen(false);
  };


  const handleOk = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploadError(null);
    setConfirmLoading(true);
    
    const result = await uploadFile(file,handleUpload,{
      file:file,
      database: false,
        data: [],
        tableName: '',
        sap: false
    });
    
    if (result.success) {
      setChanged(!changed)
      setOpen(false);
    } else {
      setUploadError(result.error?.message || 'Failed to upload file. Please try again.');
    }
    
    setConfirmLoading(false);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleNavigate = async (finalValue) => {
    // Persist selection and go to explore
    if (finalValue?.filename) {
      localStorage.setItem("filename", finalValue.filename);
    }
    navigate("/explore");
  };

  const handleMqttData = async (mqttData) => {
    // Handle MQTT data loading
    localStorage.setItem("filename", mqttData.filename);
    navigate("/discover");
  };

  const handleConnectDataLoaded = (tableData) => {
    // Handle successful data loading from ConnectData component
    console.log('Data loaded successfully:', tableData);
  };

  useEffect(() => {
    // Stop auto-navigation; user selects from the list instead
  }, [uploadedData]);

  // reserved for future enhancements

  useEffect(() => {
    // Fetch workspace files using same API as Workspace page
    const run = async () => {
      if (!email) return;
      setWorkspaceLoading(true);
      try {
        const formData = new FormData();
        formData.append("email", email);
        const res = await axios.post(require("../../../../utils/const").akkiourl + "/get_user_data", formData);
        const result = res.data.result || [];
        setFetchedData(result.map((f) => JSON.stringify(f)));
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        setWorkspaceLoading(false);
      }
    };
    run();
  }, [email, changed]);

  const handleWorkspaceOpen = async (finalValue) => {
    setSelected(finalValue);
    setItemLoading((prev) => ({ ...prev, [finalValue]: true }));
    try {
      const formData = new FormData();
      formData.append("tablename", finalValue);
      formData.append("schemaname", "postgres");
      await axios.post(require("../../../../utils/const").akkiourl + "/tabledata", formData);
    } catch (error) {
      console.error("Failed to get data", error);
    } finally {
      setItemLoading((prev) => ({ ...prev, [finalValue]: false }));
      localStorage.setItem("filename", finalValue);
      navigate("/explore");
    }
  };

  const handleDelete = async (e, emailId, tableName) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.append("email", emailId);
      formData.append("table_names", tableName);
      const resp = await axios.post(require("../../../../utils/const").akkiourl + "/delete_selected_tables", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (resp.status === 200) {
        // refresh list
        const form = new FormData();
        form.append("email", emailId);
        const r = await axios.post(require("../../../../utils/const").akkiourl + "/get_user_data", form);
        const result = r.data.result || [];
        setFetchedData(result.map((f) => JSON.stringify(f)));
      }
    } catch (error) {
      console.error("Error deleting the tables:", error);
    }
  };

  return (
    <>
      {!postgresOpen && (
        <div className="mt-1">
          <h2 className="headerText"> Pick a data source to start</h2>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
            {workspaceLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <CircularProgress />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {/* Upload New tile */}
                <div
                  onClick={() => setOpen(true)}
                  style={{
                    height: 240,
                    border: '2px dashed #cbd5e1',
                    borderRadius: 18,
                    background: 'linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#3b82f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#e6f0ff', margin: '0 auto 8px' }}>
                      <AiFillPlusCircle size={28} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>Upload New</div>
                  </div>
                </div>

                {/* Workspace tiles */}
                {fetchedData?.length > 0 ? (
                  fetchedData.map((finalField, index) => {
                    const finalValue = finalField ? JSON.parse(finalField) : '';
                    if (!finalValue) return null;
                    const isBusy = !!itemLoading[finalValue];
                    const isSelected = selected === finalValue;
                    return (
                      <div
                        key={index}
                        onClick={() => handleWorkspaceOpen(finalValue)}
                        style={{
                          height: 240,
                          borderRadius: 18,
                          background: '#fff',
                          border: isSelected ? '2px solid #60a5fa' : '1px solid #e2e8f0',
                          boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.15)' : '0 4px 14px rgba(2,8,23,0.06)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                      >
                        {isBusy && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                            <CircularProgress size={28} />
                          </div>
                        )}
                        {isSelected && (
                          <AiFillCheckCircle size={28} color="#22c55e" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} />
                        )}
                        <div style={{ height: 150, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/dataThumbnail.jpeg" alt={finalValue} style={{ maxHeight: 140, width: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{finalValue}</div>
                          <FaTrashAlt
                            title="Delete file"
                            onClick={(e) => handleDelete(e, email, finalValue)}
                            style={{ color: '#ef4444' }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#6b7280', fontSize: 14 }}>No data found. Upload a file to get started.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {postgresOpen && (
        <PostgreSql
          setPostgresOpen={setPostgresOpen}
          setConnection={setConnection}
        />
      )}
      
      {open && (
        <Modal
          title="Upload File"
          open={open}
          onOk={handleOk}
          confirmLoading={confirmLoading || isLoading}
          onCancel={handleCancel}
          okText="Upload"
        >
          <input type="file" onChange={handleFileChange} />
          {uploadError && (
            <div style={{ color: 'red', marginTop: '8px' }}>{uploadError}</div>
          )}
        </Modal>
      )}
      
      {/* Connect Data AI Assistant - Now as separate component */}
      <ConnectData 
        isOpen={connectDataOpen}
        onClose={() => setConnectDataOpen(false)}
        onDataLoaded={handleConnectDataLoaded}
      />

      {mqttOpen && (
        <MqttConfig setMqttOpen={setMqttOpen} onDataReceived={handleMqttData} />
      )}
      {sapOpen && (
        <SapConfig setSapOpen={setSapOpen} onDataReceived={handleNavigate} />
      )}
      <SyntheticData 
        isOpen={syntheticDataOpen} 
        onClose={() => setSyntheticDataOpen(false)} 
      />
    </>
  );
};