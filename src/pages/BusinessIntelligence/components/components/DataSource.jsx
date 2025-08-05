import "../styles/datasource.scss";
import tableSvg from "../../../../assets/svg/table.svg";
import googleSheet from "../../../../assets/svg/googlesheet.svg";
import { useNavigate } from "react-router-dom";
import { SiMysql } from "react-icons/si";
import { MdSettingsApplications, MdSend, MdRefresh, MdClose } from "react-icons/md";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiMongodb } from "react-icons/si";
import { SiMqtt } from "react-icons/si";
import PostgreSql from "./popups/postgresql";
import { useEffect, useState } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
import { Modal } from "antd";
import {
  akkiourl,
  transformData2,
} from "../../../../utils/const";
import MqttConfig from "./popups/MqttConfig";
import SapConfig from "./popups/sap";
import { useFileUpload } from './useApi';
import { IconButton } from "@mui/material";
import { FaRobot, FaUser, FaDatabase, FaCloud, FaServer } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import ChatDataPrep from "./popups/chatdataprep";
import SyntheticData from "./popups/SyntheticData";

export const DataSource = () => {
  const navigate = useNavigate();
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [connection, setConnection] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { uploadedData, handleUpload, showContent } = useDataAPI();
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
  const [connectPrompt, setConnectPrompt] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, connected, error
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      message: 'Hello! I\'m your AI Data Connection Assistant. I can help you connect to various data sources including databases, APIs, and cloud services. Please provide your connection details or describe what you\'d like to connect to.',
      timestamp: new Date(),
      status: 'delivered'
    }
  ]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

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
    await showContent({
      filename: finalValue.filename,
      headers: Object.keys(finalValue.data[0]),
      data: finalValue.data,
    });

    localStorage.setItem("filename", finalValue.filename);
    navigate("/projects");
  };

  const handleMqttData = async (mqttData) => {
    await showContent({
      filename: mqttData.filename,
      headers: Object.keys(mqttData.data[0]),
      data: mqttData.data,
    });

    localStorage.setItem("filename", mqttData.filename);
    navigate("/discover");
  };

  // Handler for Connect Data submit
  const handleConnectDataSubmit = async () => {
    if (!connectPrompt.trim()) {
      setConnectError("Please enter a connection request");
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: connectPrompt.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    const currentPrompt = connectPrompt.trim();
    setConnectPrompt("");
    setConnectLoading(true);
    setConnectionStatus('connecting');
    setConnectError(null);

    // Add typing indicator
    const typingMessage = {
      id: Date.now() + 0.5,
      type: 'assistant',
      message: '',
      timestamp: new Date(),
      status: 'typing'
    };
    setChatMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch(`${akkiourl}/database_chat`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentPrompt,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Connection failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Remove typing indicator and add bot response
      setChatMessages(prev => prev.filter(msg => msg.status !== 'typing'));
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: data.response || 'Connection processed successfully! Your data source has been configured.',
        timestamp: new Date(),
        status: 'delivered',
        success: data.connection_successful
      };

      setChatMessages(prev => [...prev, botMessage]);

      // Handle successful connection
      if (data.connection_successful) {
        setConnectionStatus('connected');
        // Show success message and auto-close after delay
        setTimeout(() => {
          const successMessage = {
            id: Date.now() + 2,
            type: 'assistant',
            message: '✅ Connection established successfully! You can now proceed with your data analysis.',
            timestamp: new Date(),
            status: 'delivered',
            success: true
          };
          setChatMessages(prev => [...prev, successMessage]);
          
          setTimeout(() => {
            setConnectDataOpen(false);
            resetConnectDataChat();
          }, 3000);
        }, 1000);
      } else {
        setConnectionStatus('error');
      }

    } catch (err) {
      console.error('Connect Data Error:', err);
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => msg.status !== 'typing'));
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: 'I encountered an issue while trying to establish the connection. Please verify your connection details and try again. Common issues include incorrect credentials, network connectivity, or firewall restrictions.',
        timestamp: new Date(),
        status: 'delivered',
        error: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setConnectError("Connection failed. Please check your details and try again.");
      setConnectionStatus('error');
    }
    
    setConnectLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConnectDataSubmit();
    }
  };

  const resetConnectDataChat = () => {
    setChatMessages([{
      id: 1,
      type: 'assistant',
      message: 'Hello! I\'m your AI Data Connection Assistant. I can help you connect to various data sources including databases, APIs, and cloud services. Please provide your connection details or describe what you\'d like to connect to.',
      timestamp: new Date(),
      status: 'delivered'
    }]);
    setConnectPrompt("");
    setConnectError(null);
    setConnectionStatus('idle');
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      
      {/* Professional Connect Data Assistant Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '8px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
              }}>
                <FaRobot color="white" size={18} />
              </div>
              <div>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  marginBottom: 2
                }}>
                  AI Data Connection Assistant
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: connectionStatus === 'connected' ? '#4caf50' : 
                                    connectionStatus === 'connecting' ? '#ff9800' :
                                    connectionStatus === 'error' ? '#f44336' : '#9e9e9e'
                  }}></div>
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Connection Failed' : 'Ready to Connect'}
                </div>
              </div>
            </div>
            <IconButton 
              onClick={resetConnectDataChat}
              size="small"
              style={{ color: '#666' }}
            >
              <MdRefresh size={18} />
            </IconButton>
          </div>
        }
        open={connectDataOpen}
        onCancel={() => {
          setConnectDataOpen(false);
          resetConnectDataChat();
        }}
        footer={null}
        width={900}
        style={{ top: 20 }}
        styles={{
          header: { 
            borderBottom: '1px solid #f0f0f0',
            padding: '16px 24px' 
          },
          body: { 
            padding: 0 
          }
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '80vh',
          backgroundColor: '#fafafa'
        }}>
          {/* Connection Status Bar */}
          <div style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FaServer size={14} color="#666" />
            <span style={{ fontSize: 13, color: '#666' }}>
              Supported: PostgreSQL, MySQL, MongoDB, S3 Bucket
            </span>
          </div>

          {/* Chat Messages Area */}
          <div style={{ 
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {chatMessages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  animation: 'slideIn 0.3s ease-out'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: msg.type === 'user' 
                    ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                    : msg.error 
                    ? 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)'
                    : msg.success
                    ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                    : 'linear-gradient(135deg, #6c63ff 0%, #9c88ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {msg.type === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                </div>
                
                <div style={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: msg.type === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                    backgroundColor: msg.type === 'user' ? '#1976d2' : 'white',
                    color: msg.type === 'user' ? 'white' : '#333',
                    boxShadow: msg.type === 'user' 
                      ? '0 2px 12px rgba(25, 118, 210, 0.3)' 
                      : '0 2px 12px rgba(0,0,0,0.1)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    border: msg.error ? '1px solid #ffcdd2' : 
                           msg.success ? '1px solid #c8e6c9' : 'none',
                    position: 'relative'
                  }}>
                    {msg.status === 'typing' ? (
                      <div style={{ 
                        display: 'flex', 
                        gap: 4,
                        alignItems: 'center',
                        color: '#666'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: 2,
                        }}>
                          {[0, 1, 2].map(i => (
                            <div 
                              key={i}
                              style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: '#666',
                                animation: `bounce 1.4s infinite ease-in-out both`,
                                animationDelay: `${i * 0.16}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.success && <span style={{ marginRight: 8 }}>✅</span>}
                        {msg.error && <span style={{ marginRight: 8 }}>❌</span>}
                    
<div dangerouslySetInnerHTML={{ __html: msg.message }}>
</div>
                      </>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: 11,
                    color: '#999',
                    textAlign: msg.type === 'user' ? 'right' : 'left',
                    paddingLeft: msg.type === 'user' ? 0 : 4,
                    paddingRight: msg.type === 'user' ? 4 : 0
                  }}>
                    {formatTimestamp(msg.timestamp)}
                    {msg.status === 'sent' && msg.type === 'user' && ' • Sent'}
                    {msg.status === 'delivered' && msg.type === 'assistant' && ' • Delivered'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input Area */}
          <div style={{ 
            padding: '20px 24px',
            backgroundColor: 'white',
            borderTop: '1px solid #f0f0f0'
          }}>
            {connectError && (
              <div style={{ 
                color: '#f44336', 
                fontSize: 13, 
                marginBottom: 12,
                padding: '8px 12px',
                backgroundColor: '#ffebee',
                borderRadius: 8,
                border: '1px solid #ffcdd2',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>⚠️</span>
                {connectError}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  placeholder="Example: 'Connect to PostgreSQL database at localhost:5432, database: analytics, username: admin, password: [password]' or 'Help me connect to my MySQL database'"
                  value={connectPrompt}
                  onChange={e => setConnectPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={connectLoading}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 14,
                    border: '2px solid #e8e8e8',
                    borderRadius: 12,
                    resize: 'none',
                    minHeight: 100,
                    maxHeight: 150,
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: connectLoading ? '#f5f5f5' : 'white',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#1976d2'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                  rows={1}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  fontSize: 11,
                  color: '#999'
                }}>
                  {connectPrompt.length}/500
                </div>
              </div>
              
              <button
                onClick={handleConnectDataSubmit}
                disabled={connectLoading || !connectPrompt.trim() || connectPrompt.length > 500}
                style={{
                  padding: '14px 20px',
                  background: connectLoading || !connectPrompt.trim() || connectPrompt.length > 500
                    ? 'linear-gradient(135deg, #ccc 0%, #ddd 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  cursor: connectLoading || !connectPrompt.trim() || connectPrompt.length > 500 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  boxShadow: connectLoading || !connectPrompt.trim() || connectPrompt.length > 500
                    ? 'none'
                    : '0 2px 8px rgba(25, 118, 210, 0.3)',
                  minWidth: 100
                }}
                onMouseEnter={e => {
                  if (!connectLoading && connectPrompt.trim() && connectPrompt.length <= 500) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = connectLoading || !connectPrompt.trim() || connectPrompt.length > 500
                    ? 'none'
                    : '0 2px 8px rgba(25, 118, 210, 0.3)';
                }}
              >
                {connectLoading ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <MdSend size={16} />
                    Connect
                  </>
                )}
              </button>
            </div>
          
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Modal>

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