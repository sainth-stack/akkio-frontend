import { useEffect, useState } from "react"
import { Card } from "react-bootstrap"
import { akkiourl } from "../../../../../utils/const";
import axios from 'axios';
import { LoadingOutlined } from '@ant-design/icons';
import './index.css'
import { Spin } from "antd";
import Plot from 'react-plotly.js';
import ChatDataPrep from "../popups/chatdataprep";
import { IconButton } from "@mui/material";
import { FaRobot } from "react-icons/fa6";

export const PredictionAndForecast = () => {
    const [activeTab, setActiveTab] = useState("Predict");
    const [targetColumn, setTargetColumn] = useState("");
    const [targetOptions, setTargetOptions] = useState([])
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState(null)
    const [formData, setFormData] = useState({});
    const [frequency, setFrequency] = useState('days');
    const [tenure, setTenure] = useState('1');
    const [show, setShow] = useState(false)
    const [showModel, setShowModel] = useState(false)
    
    const frequencyOptions = [
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months' },
        { value: 'quarters', label: 'Quarters' },
        { value: 'years', label: 'Years' }
    ];

    const tenureOptions = [1, 3, 5, 7, 10];

    const tabs = [
        { id: 'Predict', label: 'Predict', model: 'RandomForest' },
        { id: 'Forecast', label: 'Forecast', model: 'Arima' }
    ];

    const getCurrentModel = () => {
        const currentTab = tabs.find(tab => tab.id === activeTab);
        return currentTab ? currentTab.model : 'RandomForest';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        setShow(true)
        try {
            const formDataToSend = new FormData();
            const model = getCurrentModel();
            formDataToSend.append('model', model);
            formDataToSend.append('col', targetColumn);
            
            // Only add frequency and tenure for ARIMA model
            if (model === 'Arima') {
                formDataToSend.append('frequency', frequency);
                formDataToSend.append('tenure', tenure);
            }
            
            const response = await axios.post(`${akkiourl}/models`, formDataToSend);
            setResponse(response.data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setResponse({ msg: "Error processing data" });
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        const storedData = localStorage.getItem('prepData');
        const name = localStorage.getItem('filename');

        if (storedData) {
            const parsedData = JSON.parse(storedData);
            const data = Object.keys(parsedData)?.map((item) => {
                return {
                    label: item,
                    value: item
                }
            });
            setTargetOptions(data);
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleRandomForestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('form_name', 'rf');
            formDataToSend.append('targetColumn', targetColumn);
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            const response = await axios.post(`${akkiourl}/model_predict`, formDataToSend);
            setResponse(prev => ({
                ...prev,
                rf_result: response.data.rf_result
            }));
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Error:", error);
        }
    };

    const handleChatprepData = () => {
        setShowModel(true);
    };

    const renderResponse = () => {
        if (!response) return null;
    
        if (response.msg) {
            return <div className="error-message">{response.msg}</div>;
        }
    
        const model = getCurrentModel();
        
        switch (model) {
            case 'RandomForest':
                return (
                    <div className="prediction-results">
                        <h2 className="results-title">Prediction Results</h2>
                        <p className="status-text">Status: {response.status}</p>
                        <div className="prediction-content">
                            <form onSubmit={handleRandomForestSubmit} className="prediction-form">
                                <div className="form-grid">
                                    {response.rf_cols?.map((col) => (
                                        <div key={col} className="form-field">
                                            <label className="field-label">
                                                {col.replace(/_/g, ' ')}
                                                <input
                                                    type={col.toLowerCase().includes('date') ? 'date' : 'text'}
                                                    name={col}
                                                    value={formData[col] || ''}
                                                    onChange={handleInputChange}
                                                    className="field-input"
                                                    required
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" className="submit-btn">
                                    Get Prediction
                                </button>
                            </form>

                            <div className="prediction-output">
                                {response.rf_result && (
                                    <div className="result-display">
                                        <h3>Prediction Result:</h3>
                                        <p className="result-value">{response.rf_result}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
    
            case 'Arima':
                let plotData;
                try {
                    plotData = response?.path ? JSON.parse(response?.path) : null;
                } catch (error) {
                    console.error('Error parsing plot data:', error);
                    return <div className="error-message">This dataset doesn't meet the modeling requirement</div>;
                }
    
                return (
                    <div className="forecast-results">
                        <h2 className="results-title">Forecast Results</h2>
                        <p className="status-text">Status: {response?.status ? "Success" : "Failed"}</p>
                        {plotData && (
                            <div className="plot-container">
                                <Plot
                                    data={plotData?.data}
                                    layout={{
                                        ...plotData?.layout,
                                        autosize: true,
                                        plot_bgcolor: '#ffffff',
                                        paper_bgcolor: '#ffffff',
                                        margin: { l: 50, r: 50, t: 50, b: 50 }
                                    }}
                                    config={{ responsive: true }}
                                    style={{ width: '100%', height: '60vh' }}
                                />
                            </div>
                        )}
                    </div>
                );
    
            default:
                return <pre className="default-response">{JSON.stringify(response, null, 2)}</pre>;
        }
    };

    return (
        <>
            <div className="prediction-container">
                <h1 className="main-title">Data Analysis & Prediction</h1>
                
                <form onSubmit={handleSubmit} className="analysis-form">
                    <div className="tab-section">
                        <div className="tab-nav">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => { 
                                        setActiveTab(tab.id); 
                                        setResponse(null); 
                                        setShow(false); 
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-content">
                        <div className="form-field">
                            <label className="field-label">
                                Target Column
                                <select
                                    value={targetColumn}
                                    onChange={(e) => setTargetColumn(e.target.value)}
                                    className="field-select"
                                >
                                    <option value="">Select Target Column</option>
                                    {targetOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {activeTab === 'Forecast' && (
                            <>
                                <div className="form-field">
                                    <label className="field-label">
                                        Frequency
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className="field-select"
                                        >
                                            {frequencyOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">
                                        Tenure
                                        <select
                                            value={tenure}
                                            onChange={(e) => setTenure(e.target.value)}
                                            className="field-select"
                                        >
                                            {tenureOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </>
                        )}

                        <button 
                            type="submit" 
                            className="analyze-btn"
                            disabled={loading || !targetColumn}
                        >
                            {loading ? 'Analyzing...' : `submit`}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className="loading-message">
                        Processing your data...
                    </div>
                )}

                {show && response && (
                    <div className="results-container">
                        {renderResponse()}
                    </div>
                )}
            </div>
            
            <div>
                <ChatDataPrep {...{ showModel, setShowModel }} />
            </div>
            
            <IconButton
                onClick={handleChatprepData}
                className="chat-fab"
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    backgroundColor: "#1976d2",
                    color: "white",
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    boxShadow: 4,
                    transition: "background-color 0.3s, transform 0.2s",
                    '&:hover': {
                        backgroundColor: "#1565c0",
                        transform: "scale(1.1)"
                    }
                }}
            >
                <FaRobot size={28} />
            </IconButton>
        </>
    );
};