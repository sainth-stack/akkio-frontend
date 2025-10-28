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
import Bot from "../../../../bot";
import { useLocation } from "react-router-dom";

export const PredictionAndForecast = () => {
    const location = useLocation();
    // Determine mode based on path
    const isPredict = location.pathname.includes('/predict');
    const isForecast = location.pathname.includes('/forecast');
    const [targetColumn, setTargetColumn] = useState("");
    const [targetOptions, setTargetOptions] = useState([])
    const [loading, setLoading] = useState(false)
    const [columnsLoading, setColumnsLoading] = useState(false)
    const [response, setResponse] = useState(null)
    const [formData, setFormData] = useState({});
    const [frequency, setFrequency] = useState('days');
    const [tenure, setTenure] = useState('1');
    const [show, setShow] = useState(false)
    const [showModel, setShowModel] = useState(false)
    const [mainTab, setMainTab] = useState('Models');
    
    const frequencyOptions = [
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months' },
        { value: 'quarters', label: 'Quarters' },
        { value: 'years', label: 'Years' }
    ];

    const tenureOptions = [1, 3, 5, 7, 10];

    // Function to fetch columns from API
    const fetchColumns = async () => {
        setColumnsLoading(true);
        try {
            const response = await axios.get(`${akkiourl}/get_columns`, {
                headers: { 'accept': 'application/json' }
            });
            
            if (response.data.status === 'success' && response.data.columns) {
                const columnOptions = response.data.columns.map((column) => ({
                    label: column,
                    value: column
                }));
                setTargetOptions(columnOptions);
            } else {
                console.error("Failed to fetch columns:", response.data);
                setTargetOptions([]);
            }
        } catch (error) {
            console.error("Error fetching columns:", error);
            setTargetOptions([]);
        } finally {
            setColumnsLoading(false);
        }
    };

    // Unified submit handler for predict/forecast
    const handleSubmit = async (e) => {
        e.preventDefault();
        setShow(true);
        if (isForecast) {
            // Two-step process for forecast: train, then predict
            setLoading(true);
            setResponse(null);
            setForecastStep('training'); // NEW: track which step we're on
            try {
                // 1. Train model
                let trainPayload = {
                    model: 'Arima',
                    col: targetColumn,
                    frequency,
                    tenure,
                };
                await axios.post(`${akkiourl}/models`, trainPayload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                // 2. Predict (forecast)
                setForecastStep('predicting');
                const predictForm = new FormData();
                predictForm.append('form_name', 'arima');
                predictForm.append('targetColumn', targetColumn);
                predictForm.append('frequency', frequency);
                predictForm.append('tenure', tenure);
                const predictRes = await axios.post(`${akkiourl}/model_predict`, predictForm);
                setResponse(predictRes.data);
                setLoading(false);
                setForecastStep(null);
            } catch (error) {
                setLoading(false);
                setForecastStep(null);
                setResponse({ msg: 'Error processing forecast' });
                console.error('Forecast error:', error);
            }
        } else {
            // Predict (RandomForest) - unchanged
            setLoading(true)
            setShow(true)
            try {
                let model = 'RandomForest';
                let payload = {
                    model,
                    col: targetColumn,
                };
                const response = await axios.post(`${akkiourl}/models`, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                setResponse(response.data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                setResponse({ msg: "Error processing data" });
                console.error("Error:", error);
            }
        }
    };

    useEffect(() => {
        fetchColumns();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // For RandomForest prediction form (if needed)
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
                ...response.data
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

    // Loader for forecast steps
    const [forecastStep, setForecastStep] = useState(null); // 'training' | 'predicting' | null

    // Render response for predict/forecast
    const renderResponse = () => {
        if (!response) return null;
    
        if (response.msg) {
            return <div className="error-message">{response.msg}</div>;
        }
    
        if (isPredict) {
            // Prediction result rendering (RandomForest)
            return (
                <div className="rf-results-container modern-business-ui">
                    <div className="prediction-form-container section-card">
                        <h2 className="results-title">Get a {((response?.prediction_result?.target_column || targetColumn) || 'New').replace(/_/g, ' ')} Prediction</h2>
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
                    </div>
                    <div className="prediction-output">
                        {response.prediction_result ? (
                            <div className="rf-results-grid modern-grid">
                                <div className="result-display main-prediction-card modern-card">
                                    <h3 className="modern-title">Predicted {response.prediction_result.target_column}</h3>
                                    <p className="result-value modern-value">
                                        {typeof response.prediction_result.predicted_value === 'number'
                                            ? response.prediction_result.predicted_value.toFixed(2)
                                            : response.prediction_result.predicted_value}
                                    </p>
                                    <span className="model-type-chip">{response.prediction_result.model_type}</span>
                                </div>
                                {response.model_performance && (
                                    <div className="performance-metrics section-card modern-card">
                                        <h4 className="modern-subtitle">Model Performance</h4>
                                        <ul className="modern-metrics-list">
                                            {(response.model_performance.regression_metrics?.r2_score ?? response.model_performance.performance_metrics?.r2_score) != null && (
                                                <li>
                                                    <span>R² Score</span>
                                                    <span>{response.model_performance.regression_metrics?.r2_score ?? response.model_performance.performance_metrics?.r2_score}</span>
                                                </li>
                                            )}
                                            {(response.model_performance.regression_metrics?.mae ?? response.model_performance.performance_metrics?.mae) != null && (
                                                <li>
                                                    <span>MAE</span>
                                                    <span>{response.model_performance.regression_metrics?.mae ?? response.model_performance.performance_metrics?.mae}</span>
                                                </li>
                                            )}
                                            {(response.model_performance.regression_metrics?.rmse ?? response.model_performance.performance_metrics?.rmse) != null && (
                                                <li>
                                                    <span>RMSE</span>
                                                    <span>{response.model_performance.regression_metrics?.rmse ?? response.model_performance.performance_metrics?.rmse}</span>
                                                </li>
                                            )}
                                            {response.model_performance.total_samples != null && (
                                                <li>
                                                    <span>Samples</span>
                                                    <span>{response.model_performance.total_samples}</span>
                                                </li>
                                            )}
                                            {response.model_performance.cross_validation?.mean_score != null && (
                                                <li>
                                                    <span>CV Mean</span>
                                                    <span>{response.model_performance.cross_validation.mean_score}</span>
                                                </li>
                                            )}
                                            {response.model_performance.cross_validation?.std_score != null && (
                                                <li>
                                                    <span>CV Std</span>
                                                    <span>{response.model_performance.cross_validation.std_score}</span>
                                                </li>
                                            )}
                                        </ul>
                                        <p className="baseline-comparison modern-baseline">{response.model_performance.baseline_comparison}</p>
                                    </div>
                                )}
                                {response.feature_analysis && (
                                    <div className="feature-analysis section-card modern-card">
                                        <h4 className="modern-subtitle">Top Influencing Features</h4>
                                        <ul className="feature-list modern-feature-list">
                                            {response.feature_analysis.top_influencing_features?.map(field => (
                                                <li key={field.feature} className="modern-feature-item">
                                                    <span className="feature-name modern-feature-name">{field.feature}</span>
                                                    <div className="importance-bar-container modern-bar-container">
                                                        <div
                                                            className="importance-bar modern-bar"
                                                            style={{ width: `${field.importance}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="feature-percentage modern-feature-percentage">{field.importance.toFixed(1)}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {response.feature_analysis?.input_features && (
                                    <div className="section-card modern-card input-features-card">
                                        <h4 className="modern-subtitle">Input Features</h4>
                                        <ul className="modern-input-list">
                                            {Object.entries(response.feature_analysis.input_features).map(([key, value]) => (
                                                <li key={key} className="modern-input-item">
                                                    <span className="modern-input-key">{key}</span>
                                                    <span className="modern-input-value">{value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            response.rf_result && (
                                <div className="result-display">
                                    <h3>Prediction Result:</h3>
                                    <p className="result-value">{response.rf_result}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            );
        }
        if (isForecast) {
            // Only show forecast results from /model_predict
            // Hide ARIMA training message
            // If forecasted data is present, show it
            if (response.prediction_result && response.prediction_result.forecast_data) {
                const forecastData = response.prediction_result.forecast_data;
                const dates = Object.values(forecastData.date);
                const values = Object.values(forecastData.forecasted_value);
                return (
                    <div className="forecast-results">
                        <h2 className="results-title">Forecast Results</h2>
                        <div className="plot-container">
                            <Plot
                                data={[{
                                    x: dates,
                                    y: values,
                                    type: 'scatter',
                                    mode: 'lines+markers',
                                    marker: { color: '#3b82f6' },
                                    line: { shape: 'spline' },
                                    name: 'Forecasted Value',
                                }]}
                                layout={{
                                    autosize: true,
                                    plot_bgcolor: '#ffffff',
                                    paper_bgcolor: '#ffffff',
                                    margin: { l: 50, r: 50, t: 50, b: 50 },
                                    xaxis: { title: 'Date' },
                                    yaxis: { title: response.prediction_result.target_column },
                                }}
                                config={{ responsive: true }}
                                style={{ width: '100%', height: '60vh' }}
                            />
                        </div>
                        <div className="forecast-table section-card modern-card" style={{ marginTop: 32 }}>
                            <h4 className="modern-subtitle">Forecast Table</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f4f7fb' }}>
                                        <th style={{ padding: '8px 16px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'left' }}>Forecasted Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dates.map((date, idx) => (
                                        <tr key={date}>
                                            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>{date}</td>
                                            <td style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>{values[idx]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            // fallback: show raw response if no forecast data
            return <pre className="default-response">{JSON.stringify(response, null, 2)}</pre>;
        }
        return <pre className="default-response">{JSON.stringify(response, null, 2)}</pre>;
    };

    return (
        <>
            <div className={mainTab === 'Models' ? "prediction-container" : "prediction-container full-width"}>
                {/* First-level tabs */}
                <div className="main-tabs">
                    <button
                        type="button"
                        className={`main-tab-button ${mainTab === 'Models' ? 'active' : ''}`}
                        onClick={() => {
                            setMainTab('Models');
                            setResponse(null);
                            setShow(false);
                        }}
                    >
                        Analytics
                    </button>
                    <button
                        type="button"
                        className={`main-tab-button ${mainTab === 'Agent' ? 'active' : ''}`}
                        onClick={() => setMainTab('Agent')}
                    >
                        Agent
                    </button>
                </div>

                {mainTab === 'Models' && (
                    <>
                        <form onSubmit={handleSubmit} className="analysis-form">
                            <div className="form-content">
                                <div className="form-field">
                                    <label className="field-label">
                                        Target Column
                                        <select
                                            value={targetColumn}
                                            onChange={(e) => setTargetColumn(e.target.value)}
                                            className="field-select"
                                            disabled={columnsLoading}
                                        >
                                            <option value="">
                                                {columnsLoading ? "Loading columns..." : "Select Target Column"}
                                            </option>
                                            {targetOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        {columnsLoading && (
                                            <div className="loading-spinner">
                                                <Spin size="small" />
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {isForecast && (
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
                                    disabled={loading || !targetColumn || columnsLoading}
                                >
                                    {loading ? (isForecast ? (forecastStep === 'training' ? 'Training Model...' : 'Generating Forecast...') : 'Analyzing...') : `Train Model`}
                                </button>
                            </div>
                        </form>

                        {/* Professional loader for forecast steps */}
                        {loading && isForecast && (
                            <div className="loading-container">
                                <div className="loader" />
                                <p>{forecastStep === 'training' ? 'Training ARIMA model...' : 'Generating forecast...'}</p>
                            </div>
                        )}
                        {loading && !isForecast && (
                            <div className="loading-message">
                                Processing your data...
                            </div>
                        )}

                        {show && response && !loading && (
                            <div className="results-container">
                                {renderResponse()}
                            </div>
                        )}

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
                )}

                {mainTab === 'Agent' && <Bot />}
            </div>
        </>
    );
};