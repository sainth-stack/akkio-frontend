import "../styles/datasource.scss";
import tableSvg from "../../../../assets/svg/table.svg";
import googleSheet from "../../../../assets/svg/googlesheet.svg";
import { useNavigate } from "react-router-dom";
import { SiMysql } from "react-icons/si";
import { MdSettingsApplications } from "react-icons/md";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiMongodb } from "react-icons/si";
import { SiMqtt } from "react-icons/si";
import PostgreSql from "./popups/postgresql";
import { useEffect, useState } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
import { Modal } from "antd";
import MqttConfig from "./popups/MqttConfig";
import SapConfig from "./popups/sap";
import { useFileUpload } from './useApi';
import { FaRobot, FaDatabase, FaCloud } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import ChatDataPrep from "./popups/chatdataprep";
import SyntheticData from "./popups/SyntheticData";
import { ConnectData } from "./popups/connectData";

export const DataSource = () => {
  const navigate = useNavigate();
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [connection, setConnection] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { uploadedData, handleUpload } = useDataAPI();
  const [file, setFile] = useState(null);
  const [fetchedData, setFetchedData] = useState([]);
  const [mqttOpen, setMqttOpen] = useState(false);
  const [sapOpen, setSapOpen] = useState(false);
  const { uploadFile, isLoading } = useFileUpload();
  const [uploadError, setUploadError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [syntheticDataOpen, setSyntheticDataOpen] = useState(false);
  const [connectDataOpen, setConnectDataOpen] = useState(false);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleChatprepData = () => {
    setShowModel(true);
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
    // Navigation logic can be handled by the ConnectData component now
    // or passed as callback
    navigate("/projects");
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
    console.log(uploadedData , !open , file?.name)
    if (uploadedData.length > 0 && !open && file?.name) {
      handleNavigate(JSON.parse(uploadedData[0]));
    }
  }, [uploadedData]);

  return (
    <>
      {!postgresOpen && (
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
                  />
                  <div className="step-tile-text-container">
                    <div className="textHeader">Upload Data</div>
                    <div className="textDesc">Upload and configure datasets</div>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText">CSV</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Connect Data */}
            <div className="outerContainer" onClick={() => setConnectDataOpen(true)}>
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
                    <div className="textHeader">Connect Data</div>
                    <div className="textDesc">AI-powered database & API connections</div>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText">AI Assistant</span>
                </div>
              </div>
            </div>
            
            {/* Build Data */}
            <div className="outerContainer" onClick={() => setSyntheticDataOpen(true)}>
              <div className="cardContainer" style={{ display: "flex" }}>
                <div className="stepContainer">
                  <FaRobot size={40} />
                  <div className="step-tile-text-container">
                    <div className="textHeader">Build Data</div>
                    <div className="textDesc">Generate</div>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText">AI-Generated Data</span>
                </div>
              </div>
            </div>
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