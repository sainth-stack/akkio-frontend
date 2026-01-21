import React, { useState } from 'react';
import { Modal, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { akkiourl } from "../../../../../utils/const";

const { Option } = Select;

export const ConnectData = ({
  isOpen,
  onClose,
  onDataLoaded
}) => {
  const navigate = useNavigate();

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
      // Handle new response structure
      if (response && response.response && response.response.data) {
        const data = response.response.data;
        const details = {
          db_type: data.database_type,
          username: data.username,
          host: data.host,
          database: data.database_name,
          password: data.password
        };
        const tables = Array.isArray(data.tables) ? data.tables : [];
        return { tables, connectionDetails: details };
      }

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
          message: data?.response?.data?.content || 'Connection processed successfully! However, I couldn\'t extract the table information properly. Please try rephrasing your connection request.',
          timestamp: new Date(),
          status: 'delivered',
          success: false
        };
        setChatMessages(prev => [...prev, botMessage]);
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

    }

    setConnectLoading(false);
  };

  // Handle table selection and data fetching
  const handleTableSelection = async () => {
    console.log(connectionDetails, 'sdfsdfj')
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
      localStorage.setItem('filename', selectedTable)
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
            <div>
              <div style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: 4
              }}>
                AI Data Connection Assistant
              </div>
              <div style={{
                fontSize: 12,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>


              </div>
            </div>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      styles={{
        header: {
          borderBottom: '1px solid #e5e7eb',
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
        backgroundColor: '#f8fafc'
      }}>
        {/* Connection Status Bar */}


        {/* Chat Messages Area */}
        <div style={{
          flex: 1,
          padding: '24px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
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
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{
                  padding: '16px 18px',
                  borderRadius: msg.type === 'user' ? '16px 16px 6px 16px' : '16px 16px 16px 6px',
                  backgroundColor: msg.type === 'user' ? '#2563eb' : '#ffffff',
                  color: msg.type === 'user' ? 'white' : '#0f172a',
                  boxShadow: msg.type === 'user'
                    ? '0 6px 16px rgba(37, 99, 235, 0.25)'
                    : '0 6px 16px rgba(2, 6, 23, 0.08)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  border: msg.error ? '1px solid #fecaca' :
                    msg.success ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                  position: 'relative'
                }}>
                  {msg.status === 'typing' ? (
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      color: '#94a3b8'
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
                              backgroundColor: '#94a3b8',
                              animation: `bounce 1.4s infinite ease-in-out both`,
                              animationDelay: `${i * 0.16}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: msg.message }} />
                    </>
                  )}
                </div>

                <div style={{
                  fontSize: 11,
                  color: '#94a3b8',
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
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 24px rgba(2, 6, 23, 0.08)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#2563eb' }}>
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
                      ? 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)'
                      : 'linear-gradient(135deg, #22c55e 0%, #86efac 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    cursor: !selectedTable || tableSelectionLoading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                    boxShadow: !selectedTable || tableSelectionLoading ? 'none' : '0 6px 16px rgba(22, 163, 74, 0.25)'
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
                    <>Load Table Data</>
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
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#e2e8f0';
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
            borderTop: '1px solid #e5e7eb'
          }}>
            {connectError && (
              <div style={{
                color: '#ef4444',
                fontSize: 13,
                marginBottom: 12,
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                borderRadius: 8,
                border: '1px solid #fecaca',
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
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    resize: 'none',
                    minHeight: 96,
                    maxHeight: 150,
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: connectLoading ? '#f8fafc' : 'white',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  rows={1}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 12,
                  fontSize: 11,
                  color: '#94a3b8'
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
                    ? 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
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
                    : '0 6px 16px rgba(37, 99, 235, 0.25)',
                  minWidth: 100
                }}
                onMouseEnter={e => {
                  if (!connectLoading && connectPrompt.trim() && connectPrompt.length <= 500) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.35)';
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = connectLoading || !connectPrompt.trim() || connectPrompt.length > 500
                    ? 'none'
                    : '0 6px 16px rgba(37, 99, 235, 0.25)';
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
                  <>Connect</>
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