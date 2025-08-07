import React, { useState } from 'react';
import { Modal, Select } from "antd";
import { IconButton } from "@mui/material";
import { FaRobot, FaUser, FaDatabase, FaServer, FaTable } from "react-icons/fa";
import { MdSend, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDataAPI } from "../../contexts/GetDataApi";
import { akkiourl } from "../../../../../utils/const";

const { Option } = Select;

export const ConnectData = ({ 
  isOpen, 
  onClose, 
  onDataLoaded 
}) => {
  const navigate = useNavigate();
  const { showContent } = useDataAPI();
  
  // State for chat and connection
  const [connectPrompt, setConnectPrompt] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
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
  
  // State for table selection
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [tableSelectionLoading, setTableSelectionLoading] = useState(false);

// Parse tables from response - Updated to handle both HTML and plain text formats
const parseTablesFromResponse = (jsonResponse) => {
    try {
      const response = typeof jsonResponse === 'string' ? JSON.parse(jsonResponse) : jsonResponse;
      
      if (!response || !response.response) {
        return { tables: [], connectionDetails: null };
      }
  
      const responseText = response.response;
      
      // Extract connection details from HTML format
      const details = {};
      const detailsHtml = {
        db_type: /<li><strong>Database type:<\/strong>\s*([^<]+)/i,
        username: /<li><strong>Username:<\/strong>\s*([^<]+)/i,
        host: /<li><strong>Host:<\/strong>\s*([^<]+)/i,
        database: /<li><strong>Database name:<\/strong>\s*([^<]+)/i,
        password: /<li><strong>Password:<\/strong>\s*([^<]+)/i
      };
  
      for (const [key, regex] of Object.entries(detailsHtml)) {
        const match = responseText.match(regex);
        if (match && match[1]) {
          details[key] = match[1].trim();
        }
      }
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = responseText;
      
      // Find all list items in the nested unordered lists
      let tables = [];
      const lists = tempDiv.querySelectorAll('ul');
      
      // The tables are in the most nested ul
      if (lists.length > 0) {
        const lastList = lists[lists.length - 1];
        const listItems = lastList.querySelectorAll('li');
        
        listItems.forEach(li => {
          // Get just the text content without any HTML tags
          const tableName = li.textContent.trim();
          if (tableName && tableName.length > 0) {
            tables.push(tableName);
          }
        });
      }
      
      // Clean up table names and remove duplicates
      tables = [...new Set(tables
        .map(table => table.trim())
        .filter(table => table && table.length > 0)
      )];
  
      console.log('Parsed details:', details);
      console.log('Parsed tables:', tables);
  
      return { tables, connectionDetails: details };
    } catch (error) {
      console.error('Error parsing tables from response:', error);
      return { tables: [], connectionDetails: null };
    }
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
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => msg.status !== 'typing'));
      
      // Parse tables from response
      const { tables, connectionDetails } = parseTablesFromResponse(data);
      
      if (tables.length > 0 && connectionDetails) {
        setAvailableTables(tables);
        setConnectionDetails(connectionDetails);
        setShowTableSelection(true);
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: `✅ Connection established successfully! Found ${tables.length} tables in the database. Please select a table to proceed.`,
          timestamp: new Date(),
          status: 'delivered',
          success: true
        };
        setChatMessages(prev => [...prev, botMessage]);
        setConnectionStatus('connected');
      } else {
        // Connection successful but couldn't parse tables or details
        const botMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: data.response || 'Connection processed successfully! However, I couldn\'t extract the table information properly. Please try rephrasing your connection request.',
          timestamp: new Date(),
          status: 'delivered',
          success: false
        };
        setChatMessages(prev => [...prev, botMessage]);
        setConnectionStatus('error');
        setConnectError("Could not extract table information. Please try again.");
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

  // Handle table selection and data fetching
  const handleTableSelection = async () => {
    console.log(connectionDetails,'sdfsdfj')
    if (!selectedTable || !connectionDetails) {
      setConnectError("Please select a table");
      return;
    }

    setTableSelectionLoading(true);
    setConnectError(null);

    // Add loading message to chat
    const loadingMessage = {
      id: Date.now() + 2,
      type: 'assistant',
      message: `🔄 Loading data from table "${selectedTable}"...`,
      timestamp: new Date(),
      status: 'delivered'
    };
    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      const formData = new URLSearchParams();
      formData.append('tablename', selectedTable);
      formData.append('db_type', connectionDetails.db_type);
      formData.append('host', connectionDetails.host);
      formData.append('database', connectionDetails.database);
      formData.append('username', connectionDetails.username);
      formData.append('password', connectionDetails.password);

      const response = await fetch(`${akkiourl}/get_table_from_database`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table data with status: ${response.status}`);
      }

      
      // Add success message to chat
      const successMessage = {
        id: Date.now() + 3,
        type: 'assistant',
        message: ` Successfully loaded table "${selectedTable}" Redirecting to the project workspace...`,
        timestamp: new Date(),
        status: 'delivered',
        success: true
      };
      setChatMessages(prev => [...prev, successMessage]);
 localStorage.setItem('filename',selectedTable)
navigate('/discover')
    } catch (err) {
      console.error('Table Selection Error:', err);
      
      const errorMessage = {
        id: Date.now() + 3,
        type: 'assistant',
        message: ` Failed to load table "${selectedTable}". Please check the table name and try again. Error: ${err.message}`,
        timestamp: new Date(),
        status: 'delivered',
        error: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setConnectError(`Failed to load table data: ${err.message}`);
    }
    
    setTableSelectionLoading(false);
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
    setShowTableSelection(false);
    setAvailableTables([]);
    setSelectedTable(null);
    setConnectionDetails(null);
    setTableSelectionLoading(false);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClose = () => {
    onClose();
    resetConnectDataChat();
  };

  return (
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
      open={isOpen}
      onCancel={handleClose}
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
                      <div dangerouslySetInnerHTML={{ __html: msg.message }} />
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

          {/* Table Selection Section */}
          {showTableSelection && (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: 12,
              border: '2px solid #e3f2fd',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <FaTable color="#1976d2" size={20} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1976d2' }}>
                  Select Table ({availableTables.length} available)
                </h3>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Choose a table from the database"
                  style={{ width: '100%', height: 44 }}
                  value={selectedTable}
                  onChange={setSelectedTable}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {availableTables.map(table => (
                    <Option key={table} value={table}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaTable size={12} color="#666" />
                        {table}
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleTableSelection}
                  disabled={!selectedTable || tableSelectionLoading}
                  style={{
                    padding: '12px 24px',
                    background: !selectedTable || tableSelectionLoading
                      ? 'linear-gradient(135deg, #ccc 0%, #ddd 100%)'
                      : 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: !selectedTable || tableSelectionLoading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tableSelectionLoading ? (
                    <>
                      <div style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <FaDatabase size={14} />
                      Load Table Data
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowTableSelection(false);
                    setSelectedTable(null);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area - Hide when table selection is active */}
        {!showTableSelection && (
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
        )}
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
  );
};