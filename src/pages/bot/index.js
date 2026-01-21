import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import Plot from 'react-plotly.js';
import Spinner from 'react-bootstrap/Spinner';
import { CopyOutlined } from '@ant-design/icons';
import { akkiourl } from '../../utils/const';
import { Button } from '@mui/material';
import { Spin, Collapse, message as message4} from 'antd';
import { Card, Row, Col } from 'react-bootstrap';
import EmptyState from '../../components/EmptyState';

// Table styles
const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  color: '#64748b',
  fontWeight: '600',
  fontSize: '13px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc'
};

const tdStyle = {
  padding: '14px 16px',
  color: '#334155',
  fontSize: '14px',
  fontWeight: '500'
};

const renderPredictionDetails = (details) => {
    if (!details || !details.prediction_result) return null;

    const { prediction_result, feature_analysis, model_performance } = details;

    return (
        <div className="prediction-response">
            <div className="prediction-card">
                <h3>{prediction_result.target_column} Prediction</h3>
                <div className="prediction-value">
                    {prediction_result.predicted_value.toFixed(2)}
                </div>
            </div>

            <div className="features-section">
                <div className="input-features section-card">
                    <h4>Input Features</h4>
                    <div className="features-grid">
                        {Object.entries(feature_analysis.input_features).map(([key, value]) => (
                            <div key={key} className="feature-item">
                                <span className="feature-label">{key.replace(/_/g, ' ')}</span>
                                <span className="feature-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="feature-importance section-card">
                    <h4>Feature Importance</h4>
                    {feature_analysis.top_fields.map((field) => (
                        <div key={field.field_name} className="importance-bar-item">
                            <div className="importance-bar-header">
                                <span className="field-name">{field.field_name}</span>
                                <span className="importance-value">{field.importance_percentage.toFixed(1)}%</span>
                            </div>
                            <div className="importance-bar-container">
                                <div 
                                    className="importance-bar-fill"
                                    style={{ width: `${field.importance_percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const renderForecastDetails = (details) => {
    if (!details || !details.plot || !details.data) return null;

    let plotData;
    try {
        plotData = JSON.parse(details.plot);
    } catch (e) {
        console.error("Failed to parse plot data", e);
        return <div className="error-message">Could not display chart.</div>;
    }

    const tableData = details.data;

    return (
        <div className="forecast-response">
            {/* Description Section */}
            {details.description && (
                <div className="forecast-description section-card" style={{
                    padding: '16px',
                    marginBottom: '20px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h4 style={{ marginBottom: '8px', color: '#334155' }}>Forecast Summary</h4>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>{details.description}</p>
                </div>
            )}

            <div className="forecast-table section-card">
                <h4>Forecast Data</h4>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Forecasted Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(tableData.date).map((key) => (
                                <tr key={key}>
                                    <td>{new Date(tableData.date[key]).toLocaleDateString()}</td>
                                    <td>{tableData.forecasted_value[key].toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="forecast-chart">
                <h4>Forecast Chart</h4>
                <Plot
                    data={plotData.data}
                    layout={{ ...plotData.layout, autosize: true, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }}
                    config={{ responsive: true }}
                    style={{ width: '100%', height: '400px' }}
                />
            </div>
        </div>
    );
};

const Bot = () => {
  const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hello! How can I automate you today?' }
  ]);

  // const getFileFromLocalStorage = () => {
  //   const dataUrl = localStorage.getItem('uploadedFile');
  //   console.log('Retrieved Data URL:', dataUrl);
  
  //   if (dataUrl) {
  //     try {
  //       const arr = dataUrl.split(',');
  //       const mime = arr[0].match(/:(.*?);/)[1];
  //       const bstr = atob(arr[1]);
  //       let n = bstr.length;
  //       const u8arr = new Uint8Array(n);
  //       while (n--) {
  //         u8arr[n] = bstr.charCodeAt(n);
  //       }
  //       const file = new File([u8arr], 'uploadedFile', { type: mime });
  //       console.log('File created:', file);
  //       return file;
  //     } catch (error) {
  //       console.error('Error converting Base64 to File:', error);
  //       return null;
  //     }
  //   } else {
  //     console.error('No data URL found in local storage');
  //     return null;
  //   }
  // };
  

  // const file3 = getFileFromLocalStorage();
  const isChat=localStorage.getItem('chat')=="true"
  const [recentChats, setRecentChats] = useState([]);
  const [visualizationData, setVisualizationData] = useState(null);

  const [isSaved, setIsSaved] = useState(false); // To manage save status

  // Load recent chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('recentChats');
    if (savedChats) {
      try {
        setRecentChats(JSON.parse(savedChats));
      } catch (error) {
        console.error('Error loading recent chats:', error);
      }
    }
  }, []);


  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    if (selectedFile) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('http://54.169.213.200:4004/api/file_upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setMessages(prev => [...prev, { 
      type: 'user', 
      content: message,
      question:true,
      isLoading: true 
    }]);
    
    setIsLoading(true);
    const formData = new FormData();
    const currentPath = window.location.pathname;

    if (currentPath === '/manufa-anomaly' || currentPath === '/healthcare-anomaly') {
      formData.append('prompt', message);
      // formData.append('file', file);
      
      try {
        let response=null
        if(currentPath === '/manufa-anomaly'){
          response = await fetch(`${akkiourl}/predictive_maintenence`, {
            method: 'POST',
            body: formData,
          })
        } else if(currentPath === '/healthcare-anomaly'){
          response = await fetch(`${akkiourl}/health_care_assistant`, {
            method: 'POST',
            body: formData,
          })
        }

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        const botResponse = {
          type: 'bot', 
          content: data?.result || data?.response|| "The anomaly detection has been run on sensor_data_test.csv, and the results are saved in sensor_data_test_processed.csv.",
          data2: data?.data ? data?.data : null
        };

        setMessages(prev => prev.map(msg => 
          msg.isLoading ? { ...msg, isLoading: false } : msg
        ).concat([botResponse]));

        // Save to recent chats
        const newChat = { 
          question: message, 
          answer: data?.result || data?.response || "Response generated",
          timestamp: new Date().toISOString(),
          hasChart: false,
          hasData: !!data?.data
        };
        
        const updatedChats = [...recentChats, newChat];
        setRecentChats(updatedChats);
        
        // Save to localStorage
        try {
          localStorage.setItem('recentChats', JSON.stringify(updatedChats));
        } catch (error) {
          console.error('Error saving recent chats:', error);
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error('Error:', error);
        setMessages(prev => prev.map(msg => 
          msg.isLoading ? { ...msg, isLoading: false } : msg
        ).concat([{ 
          type: 'bot', 
          content: 'Sorry, there was an error processing your request.',
          messageType: 'text',
          code: 'Not Found'
        }]));

        // Save to recent chats even for errors
        const newChat = { 
          question: message, 
          answer: 'Error processing request',
          timestamp: new Date().toISOString(),
          hasChart: false,
          hasData: false
        };
        
        const updatedChats = [...recentChats, newChat];
        setRecentChats(updatedChats);
        
        // Save to localStorage
        try {
          localStorage.setItem('recentChats', JSON.stringify(updatedChats));
        } catch (storageError) {
          console.error('Error saving recent chats:', storageError);
        }
      } finally {
        setMessage(''); // Clear the input field
      }
    } else {
      if(isChat){
        // For chat, still use FormData (if needed)
        formData.append('query', message);
      } else{
        // formData.append('prompt', message);
        // Instead, prepare JSON body for ai_bot
      }
      try {
        setIsLoading(true);
        const endpoint = `${akkiourl}/ai_bot`;
        let response;
        if (!isChat) {
          // Send JSON for ai_bot
          const userEmail = JSON.parse(localStorage.getItem("user"))?.email || 'anonymous';
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              prompt: message,
              email: userEmail 
            }),
          });
        } else {
          // Keep as FormData for chat
          response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });
        }
      
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      
        const data = await response.json();
      
        let botResponse;

        if (data.prediction_result) { // Detailed prediction
            botResponse = {
                type: 'bot',
                content: '',
                predictionDetails: data,
            };
        } else if (data.plot && data.data?.forecasted_value) { // Detailed forecast
            botResponse = {
                type: 'bot',
                content: '',
                forecastDetails: data,
            };
        } else { // Other responses
            botResponse = {
                type: 'bot', 
                content: isChat? data?.answer: (data?.chart_response ? "" :data?.text_output || data?.text_pre_code_response) ,
                plotsData:data?.chart_response ||  (data?.plot ? JSON.parse(data?.plot || `{}`):null),
                code:data?.code || "Not Found",
                data:data?.data ? (typeof data.data === 'string' ? JSON.parse(data.data) : data.data) : null
            };
        }

        setMessages(prev => prev.map(msg => 
          msg.isLoading ? { ...msg, isLoading: false } : msg
        ).concat([botResponse]));
      
        // Save all messages to recent chats
        const newChat = { 
          question: message, 
          answer: isChat ? data?.answer : (data?.text_output || data?.text_pre_code_response || botResponse.content || "Response generated"),
          timestamp: new Date().toISOString(),
          hasChart: !!botResponse.plotsData,
          hasData: !!botResponse.data
        };
        
        const updatedChats = [...recentChats, newChat];
        setRecentChats(updatedChats);
        
        // Save to localStorage
        try {
          localStorage.setItem('recentChats', JSON.stringify(updatedChats));
        } catch (error) {
          console.error('Error saving recent chats:', error);
        }
      
        if (messageType === 'graph') {
          setVisualizationData(data?.chartData);
        }
      } catch (error) {
        console.error('Error:', error);
        
        setMessages(prev => prev.map(msg => 
          msg.isLoading ? { ...msg, isLoading: false } : msg
        ).concat([{ 
          type: 'bot', 
          content: 'Sorry, there was an error processing your request.',
          messageType: 'text',
          code:'Not Found'
        }]));

        // Save to recent chats even for errors
        const newChat = { 
          question: message, 
          answer: 'Error processing request',
          timestamp: new Date().toISOString(),
          hasChart: false,
          hasData: false
        };
        
        const updatedChats = [...recentChats, newChat];
        setRecentChats(updatedChats);
        
        // Save to localStorage
        try {
          localStorage.setItem('recentChats', JSON.stringify(updatedChats));
        } catch (storageError) {
          console.error('Error saving recent chats:', storageError);
        }
      } finally {
        setIsLoading(false); // Ensure loader stops in both success and failure cases
        setMessage(''); 
      }
    }
  };

  const fileInputRef = useRef(null);

  const handleIconClick = () => {
    fileInputRef.current.click(); 
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const saveImage = (imageUrl) => {
    let savedImages = JSON.parse(localStorage.getItem("genbi") || "[]");

    if (!savedImages.includes(imageUrl)) {
      console.log(imageUrl)
      savedImages.push(imageUrl);
      localStorage.setItem("genbi", JSON.stringify(savedImages));
      message4.success('Image Saved successfully');
      setIsSaved(true); // Mark the image as saved
    }
  };

  const renderPredictionResponse = (data) => {
    if (!data.prediction_result) return null;

    return (
      <div className="prediction-response">
        <div className="prediction-card">
          <h3>Prediction Result</h3>
          <div className="prediction-value">
            {data.prediction_result.predicted_value.toFixed(2)}
          </div>
          <div className="prediction-target">
            {data.prediction_result.target_column}
          </div>
        </div>

        <div className="features-section">
          <div className="input-features">
            <h4>Input Features</h4>
            <div className="features-grid">
              {Object.entries(data.feature_analysis.input_features).map(([key, value]) => (
                <div key={key} className="feature-item">
                  <span className="feature-label">{key}</span>
                  <span className="feature-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="feature-importance">
            <h4>Feature Importance</h4>
            {data.feature_analysis.top_fields.map((field) => (
              <div key={field.field_name} className="importance-bar-item">
                <div className="importance-bar-header">
                  <span className="field-name">{field.field_name}</span>
                  <span className="importance-value">{field.importance_percentage.toFixed(1)}%</span>
                </div>
                <div className="importance-bar-container">
                  <div 
                    className="importance-bar-fill"
                    style={{ width: `${field.importance_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    !filename ? <EmptyState /> : <div className="chat-container">
      <div className="recent-chats">
        <h3>Recent Chats</h3>
        {recentChats.length === 0 ? (
          <p className="no-chats">No recent chats yet. Start a conversation to see them here!</p>
        ) : (
          recentChats.slice(-10).reverse().map((chat, index) => (
            <div 
              key={index} 
              className="recent-chat-item"
              onClick={() => {
                setMessage(chat.question);
              }}
              style={{
                cursor: 'pointer',
                padding: '10px',
                margin: '5px 0',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
              }}
            >
              <p style={{ 
                margin: '0', 
                fontSize: '13px', 
                fontWeight: '500',
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {chat.question.length > 50 ? `${chat.question.substring(0, 50)}...` : chat.question}
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '5px',
                alignItems: 'center'
              }}>
                {chat.hasChart && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    📊 Chart
                  </span>
                )}
                {chat.hasData && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    📋 Data
                  </span>
                )}
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  marginLeft: 'auto'
                }}>
                  {new Date(chat.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
        {recentChats.length > 0 && (
          <button
            onClick={() => {
              setRecentChats([]);
              localStorage.removeItem('recentChats');
            }}
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Clear All
          </button>
        )}
      </div>
      <div className="chat-window">
        <div className="chat-messages">
        {messages.map((msg, index) => (
  <div
    key={index}
    style={{
      display: "flex",
      maxWidth: "100%",
      flexDirection: "column",
      gap: "10px",
      alignItems: msg.question ? "flex-start" : "flex-end", // Align right for questions
    }}
  >
    <div
      className={`${msg.type}-message`}
      style={{
        display: "flex",
        width: msg.question ? "fit-content" : "100%", // 50% for questions, 100% for answers
        flexDirection: "column",
        gap: "10px",
        maxWidth: "100%",
        alignSelf: msg.question ? "flex-end" : "flex-start",
        alignItems: msg.question ? "flex-end" : "flex-start", // Align content accordingly
      }}
    >
      {msg?.content && <div dangerouslySetInnerHTML={{ __html: msg?.content }} />}
      {msg.predictionDetails && renderPredictionDetails(msg.predictionDetails)}
      {msg.forecastDetails && renderForecastDetails(msg.forecastDetails)}
      {/* {msg?.code && (
    <Collapse>
        <Collapse.Panel header="Code" key="msg-code">
        <div key={'text'} className="code-block-container">
                    <button 
                        className="copy-button"
                        // onClick={() => handleCopyCode(msg.code)}
                    >
                        <CopyOutlined /> Copy
                    </button>
                    <pre className="code-block">
                        <code>{msg.code}</code>
                    </pre>
                </div>
        </Collapse.Panel>
    </Collapse>
)} */}

      {msg?.plotsData && (
<div style={{width:'100%'}}>
<Plot
          data={msg?.plotsData?.data}
          layout={msg?.plotsData?.layout}
          config={{ responsive: true }}
          style={{
            width: "100%",
            height: "60vh",
            padding: "15px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
          }}
          className="plot-container"
        />
        {msg?.plotsData && (
      <div  style={{ marginTop: "10px",display:'flex',flexDirection:'row',justifyContent:'flex-end' }}>
            <Button
            variant="contained"
            color="primary"
            onClick={()=>saveImage(msg?.plotsData)}
          >
            Save
          </Button>
      </div>
        )}
</div>
      )}
{msg?.data && (
  <div style={{ padding: '24px', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}>
    <h2 style={{ 
      fontSize: '18px', 
      fontWeight: '600', 
      marginBottom: '20px',
      color: '#2d3748',
      letterSpacing: '0.5px'
    }}>FORECAST DATA</h2>
    
    <div style={{
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0'
    }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          height:'100%'
        }}
      >
        <thead style={{backgroundColor:'lightgray'}}>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{
              padding: '14px 16px',
              textAlign: 'left',
              color: '#64748b',
              fontWeight: '600',
              fontSize: '13px',
              borderBottom: '1px solid #e2e8f0',
              letterSpacing: '0.5px'
            }}>DATE</th>
            <th style={{
              padding: '14px 16px',
              textAlign: 'left',
              color: '#64748b',
              fontWeight: '600',
              fontSize: '13px',
              borderBottom: '1px solid #e2e8f0',
              letterSpacing: '0.5px'
            }}>FORECASTED VALUE</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(msg.data.date).map((key) => (
            <tr
              key={key}
              style={{
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: 'white',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              <td style={{ 
                padding: '14px 16px',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: '1px solid #f1f5f9'
              }}>{msg.data.date[key]}</td>
              <td style={{ 
                padding: '14px 16px',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: '1px solid #f1f5f9'
              }}>{msg.data.forecasted_value[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{msg?.data2 && (
  <div style={{ padding: '24px', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}>
    <h2 style={{ 
      fontSize: '18px', 
      fontWeight: '600', 
      marginBottom: '20px',
      color: '#2d3748',
      letterSpacing: '0.5px'
    }}>Data Analysis</h2>
    
    <div style={{
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      maxHeight: '400px',
      maxWidth: '1000px',
      overflowY: 'auto',
      overflowX: 'auto'
    }}>
      <table style={{
        width: '100%',
        minWidth: '600px',
        borderCollapse: 'collapse',
        backgroundColor: 'white'
      }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#f8fafc',
          zIndex: 1
        }}>
          <tr>
            {msg.data2 && msg.data2.length > 0 && Object.keys(msg.data2[0]).map((header, index) => (
              <th key={index} style={{...thStyle}}>
                {header.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {msg.data2.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: row.Anomaly === 'YES' ? '#fff1f2' : 'white',
                transition: 'background-color 0.2s ease'
              }}
            >
              {Object.entries(row).map(([key, value], colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    ...tdStyle,
                    ...(key === 'Anomaly' && {
                      color: value === 'YES' ? '#ef4444' : '#10b981',
                      fontWeight: '600'
                    })
                  }}
                >
                  {typeof value === 'number' ? 
                    (key === 'MSE' ? value.toFixed(4) : 
                     ['vibration_amplitude_g', 'frequency_hz'].includes(key) ? value.toFixed(2) : 
                     value) : 
                    value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
    </div>
    {msg.isLoading && (
      <div className="spinner-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    )}
  </div>
))}
  <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-container">
            {/* <FaPaperclip className="upload-icon" onClick={handleIconClick} /> */}
            <input
              type="text"
              className="chat-input"
              value={message}
              onChange={handleMessageChange}
              placeholder="Ask something..."
            />
            {/* <input
              type="file"
              className="file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
            /> */}
          </div>
          <button type="submit" className="send-button" disabled={isLoading}>
            {isLoading ? (
              <Spinner
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              'Send'
            )}
          </button>
        </form>
        {file && (
            <div className="file-name">
              Selected file: {file.name}
            </div>
          )}
      </div>
    </div>
  );
};

export default Bot;