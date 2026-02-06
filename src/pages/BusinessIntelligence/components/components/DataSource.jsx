import "../styles/datasource.scss";
import tableSvg from "../../../../assets/svg/table.svg";
import { useNavigate } from "react-router-dom";
import { BiLogoPostgresql } from "react-icons/bi";
import PostgreSql from "./popups/postgresql";
import { useEffect, useState, useCallback } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
import { Modal, Input, Button, Select, message } from "antd";
import MqttConfig from "./popups/MqttConfig";
import SapConfig from "./popups/sap";
import { useFileUpload } from './useApi';
import { FaRobot, FaDatabase } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import SyntheticData from "./popups/SyntheticData";
import { ConnectData } from "./popups/connectData";
import { SiAmazons3 } from "react-icons/si";
import axios from "axios";
import { akkiourl } from "../../../../utils/const";

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
  const [connectMode, setConnectMode] = useState(null); // 's3' | 'db' | null
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [trainedModels, setTrainedModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleUrlCancel = () => {
    setUrlOpen(false);
    setUrlValue('');
    setUrlError(null);
  };

  const handleSubmitUrl = async () => {
    const isValid = /^https?:\/\/\S+$/i.test(urlValue || "");
    if (!isValid) {
      setUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setUrlError(null);
    setConfirmLoading(true);

    try {
      const userEmail = localStorage.getItem('user_email') || JSON.parse(localStorage.getItem('user'))?.email || 'admin@gmail.com';

      // Call the backend URL processing endpoint
      const formData = new FormData();
      formData.append('url', urlValue);
      formData.append('mail', userEmail);

      const response = await axios.post(`${akkiourl}/process_url`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.status === 200) {
        message.success(`URL processed successfully! Redirecting to workspace...`);

        // Store URL details for later use
        localStorage.setItem("filename", response.data.url_name);
        localStorage.setItem("selectedFileType", "url");
        localStorage.setItem("file_type", "url");
        localStorage.setItem("original_url", urlValue);
        localStorage.setItem("url_title", response.data.title || '');

        // Clear form and navigate to projects/workspace
        setUrlValue('');
        setUrlOpen(false);
        setConfirmLoading(false);
        navigate('/projects');
      } else {
        setUrlError('URL processing failed. Please try again.');
        setConfirmLoading(false);
      }
    } catch (error) {
      console.error('URL processing error:', error);
      setUrlError(error.response?.data?.detail || 'Failed to process URL. Please try again.');
      setConfirmLoading(false);
    }
  };

  const handleOk = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploadError(null);
    setConfirmLoading(true);

    // If image file and model is selected, upload to database
    if (file.type?.startsWith('image/') && selectedModel) {
      try {
        const userEmail = localStorage.getItem('user_email') || 'admin@gmail.com';

        // Upload image to database
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model_name', selectedModel);
        formData.append('user_email', userEmail);

        const response = await axios.post(`${akkiourl}/image/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.status === 'success') {
          message.success(`Image uploaded to database! Redirecting to workspace...`);

          // Clear selection and refresh
          setOpen(false);
          setFile(null);
          setSelectedModel(null);
          setConfirmLoading(false);

          // Navigate to projects/workspace to show uploaded images
          navigate('/projects');
        } else {
          setUploadError('Upload failed. Please try again.');
          setConfirmLoading(false);
        }
        return;
      } catch (error) {
        console.error('Image upload error:', error);
        setUploadError(error.response?.data?.detail || 'Failed to upload image. Please try again.');
        setConfirmLoading(false);
        return;
      }
    }

    // Normal file upload
    const result = await uploadFile(file, handleUpload, {
      file: file,
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

  const handleNavigate = useCallback(async (finalValue) => {
    // Navigation logic can be handled by the ConnectData component now
    // or passed as callback
    navigate("/projects");
  }, [navigate]);

  const handleMqttData = async (mqttData) => {
    // Handle MQTT data loading
    localStorage.setItem("filename", mqttData.filename);
    navigate("/discover");
  };

  const handleConnectDataLoaded = (tableData) => {
    // Handle successful data loading from ConnectData component
    console.log('Data loaded successfully:', tableData);
  };

  const fetchTrainedModels = async () => {
    setLoadingModels(true);
    try {
      const userEmail = localStorage.getItem('user_email') || 'admin@gmail.com';
      const response = await axios.get(`${akkiourl}/image/models`, {
        params: { user_email: userEmail }
      });
      setTrainedModels(response.data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
      setTrainedModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    console.log(uploadedData, !open, file?.name)
    if (uploadedData.length > 0 && !open && file?.name) {
      handleNavigate(JSON.parse(uploadedData[0]));
    }
  }, [uploadedData, open, file, handleNavigate]);

  // useEffect(() => {
  //   if (open) {
  //     fetchTrainedModels();
  //   }
  // }, [open]);

  return (
    <>
      <div className="mt-1">
        <h2 className="headerText"> Pick a data source to start</h2>
        <div className="mainConatiner">
          {/* Upload Data */}
          <div className="outerContainer" onClick={() => setOpen(true)}>
            <div className="cardContainer" style={{ display: "flex" }}>
              <div className="stepContainer">
                <img
                  style={{ width: 24, height: 24, marginTop: "2px" }}
                  src={tableSvg}
                  className="step-tile-icon"
                  alt=""
                />
                <div className="step-tile-text-container">
                  <div className="textHeader">Upload Files</div>
                  <div className="textDesc">
                    Upload and configure files (CSV, Excel, JSON, XML, PDF, DOC, Images, Audio). Also supports charts, tables, and reports.
                  </div>
                </div>
              </div>
              <div className="footerContainer">
                <span className="footerText">Files</span>
              </div>
            </div>
          </div>

          {/* Connect to URL */}
          <div className="outerContainer" onClick={() => setUrlOpen(true)}>
            <div className="cardContainer" style={{ display: "flex" }}>
              <div className="stepContainer">
                <svg
                  style={{ width: 24, height: 24, marginTop: "2px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="step-tile-icon"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <div className="step-tile-text-container">
                  <div className="textHeader">Connect to URL</div>
                  <div className="textDesc">
                    Import data directly from web URLs (CSV, JSON, API endpoints)
                  </div>
                </div>
              </div>
              <div className="footerContainer">
                <span className="footerText">URL</span>
              </div>
            </div>
          </div>

          {/* Enhanced Connect Data */}
          <div className="outerContainer" onClick={() => { setConnectMode('db'); setConnectDataOpen(true); }}>
            <div className="cardContainer" style={{ display: "flex" }}>
              <div className="stepContainer">
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaDatabase
                    color="#1976d2"
                    style={{ width: 28, height: 28, marginTop: "2px" }}
                    className="step-tile-icon"
                  />
                  <HiSparkles
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      color: '#ffd700'
                    }}
                  />
                </div>
                <div className="step-tile-text-container">
                  <div className="textHeader">Connect Databases</div>
                  <div className="textDesc">PostgreSQL, S3, and more (AI-powered)</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                      }}
                      aria-label="Connect PostgreSQL"
                    >
                      <BiLogoPostgresql /> PostgreSQL
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConnectMode('s3'); setConnectDataOpen(true); }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                      }}
                      aria-label="Connect Amazon S3"
                    >
                      <SiAmazons3 /> S3
                    </button>
                  </div>
                </div>
              </div>
              <div className="footerContainer">
                <span className="footerText">Databases</span>
              </div>
            </div>
          </div>

          {/* Build Data */}
          <div className="outerContainer" onClick={() => setSyntheticDataOpen(true)}>
            <div className="cardContainer" style={{ display: "flex" }}>
              <div className="stepContainer">
                <FaRobot size={40} />
                <div className="step-tile-text-container">
                  <div className="textHeader">Synthetic Data</div>
                  <div className="textDesc">Generate synthetic CSV and Excel files</div>
                </div>
              </div>
              <div className="footerContainer">
                <span className="footerText">AI-Generated Data</span>
              </div>
            </div>
          </div>

        </div>
      </div>



      {open && (
        <Modal
          title="Upload File"
          open={open}
          onOk={handleOk}
          confirmLoading={confirmLoading || isLoading}
          onCancel={handleCancel}
          okText="Upload"
        >
          <div style={{ alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json,.xml,.pdf,.doc,.docx,image/*,audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.wma"
                onChange={handleFileChange}
                style={{ width: '100%' }}
              />
              {uploadError && (
                <div style={{ color: 'red', marginTop: '8px' }}>{uploadError}</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {urlOpen && (
        <Modal
          title="Connect to URL"
          open={urlOpen}
          onCancel={handleUrlCancel}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={handleUrlCancel}>Cancel</Button>
              <Button
                type="primary"
                loading={confirmLoading}
                onClick={handleSubmitUrl}
                disabled={!/^https?:\/\/\S+$/i.test(urlValue || "")}
              >
                Submit
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              placeholder="https://example.com/data.csv"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              size="large"
            />
            {urlError && (
              <div style={{ color: 'red' }}>{urlError}</div>
            )}
          </div>
        </Modal>
      )}

      {/* Connect Data AI Assistant - Now as separate component */}
      <ConnectData
        isOpen={connectDataOpen}
        onClose={() => setConnectDataOpen(false)}
        onDataLoaded={handleConnectDataLoaded}
        mode={connectMode}
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