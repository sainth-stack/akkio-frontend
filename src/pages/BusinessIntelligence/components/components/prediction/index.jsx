import { useEffect, useState, useCallback } from "react"
import { akkiourl } from "../../../../../utils/const";
import axios from 'axios';
import './index.css'
import { Spin } from "antd";
import Plot from 'react-plotly.js';
import ChatDataPrep from "../popups/chatdataprep";
import { IconButton } from "@mui/material";
import { FaRobot } from "react-icons/fa6";
import Bot from "../../../../bot";
import { useLocation, useNavigate } from "react-router-dom";

export const PredictionAndForecast = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Determine mode based on path
    const isPredict = location.pathname.includes('/predict');
    const isForecast = location.pathname.includes('/forecast');
    const pageTitle = isForecast ? 'Forecast' : 'Prediction';
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
    const mainTab = 'Models';
    const [predictModel, setPredictModel] = useState('AutoML'); // 'RandomForest' | 'AutoML'

    const frequencyOptions = [
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months' },
        { value: 'quarters', label: 'Quarters' },
        { value: 'years', label: 'Years' }
    ];

    const tenureOptions = [1, 3, 5, 7, 10];

    const modelOptions = [
        { value: 'AutoML', label: 'AutoML (Best Model)' },
        { value: 'RandomForest', label: 'Random Forest' },
        { value: 'XGBoost', label: 'XGBoost' },
        { value: 'LightGBM', label: 'LightGBM' },
        { value: 'GradientBoosting', label: 'Gradient Boosting' }
    ];

    // Function to fetch columns from API
    const fetchColumns = useCallback(async () => {
        setColumnsLoading(true);
        try {
            const response = await axios.get(`${akkiourl}/get_columns`, {
                headers: { 'accept': 'application/json' }
            });

            if (response.data.status === 'success' && response.data.columns) {
                let columnOptions = []
                if (isPredict) {
                    columnOptions = response?.data?.predictable_columns?.map((column) => ({
                        label: column,
                        value: column
                    }));
                } else {
                    columnOptions = response?.data?.forecastable_columns?.map((column) => ({
                        label: column,
                        value: column
                    }));
                }

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
    }, [isPredict]);

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
                predictForm.append('col', targetColumn);
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
            // Predict setup (train + get feature columns)
            setLoading(true)
            setShow(true)
            try {
                let payload = {
                    model: predictModel,
                    col: targetColumn,
                };
                const response = await axios.post(`${akkiourl}/models`, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                setResponse(response.data);
                // Pre-fill form with row_data if available
                if (response.data.row_data) {
                    setFormData(response.data.row_data);
                }
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
    }, [fetchColumns]);

    // Reset form and response when target column changes
    useEffect(() => {
        if (targetColumn) {
            setFormData({});
            setResponse(null);
            setShow(false);
        }
    }, [targetColumn]);

    // Reset form and response when predict model changes
    useEffect(() => {
        if (predictModel && isPredict) {
            setFormData({});
            setResponse(null);
            setShow(false);
        }
    }, [predictModel, isPredict]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Predict submit (RandomForest or AutoML)
    const handlePredictSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure model is trained for the selected target before prediction
            const trainPayload = {
                model: predictModel,
                col: targetColumn,
            };
            await axios.post(`${akkiourl}/models`, trainPayload, {
                headers: { 'Content-Type': 'application/json' }
            });

            const formDataToSend = new FormData();
            // Map model to form_name
            let formName = 'supervised'; // default for AutoML
            if (predictModel === 'RandomForest') formName = 'rf';
            else if (predictModel === 'XGBoost') formName = 'xgboost';
            else if (predictModel === 'LightGBM') formName = 'lightgbm';
            else if (predictModel === 'GradientBoosting') formName = 'gradientboosting';
            
            formDataToSend.append('form_name', formName);
            formDataToSend.append('targetColumn', targetColumn);
            formDataToSend.append('col', targetColumn);
            formDataToSend.append('model', predictModel);
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
            // Prediction result rendering (RandomForest / AutoML)
            return (
                <div className="rf-results-container modern-business-ui">
                    <div className="prediction-form-container section-card">
                        <h2 className="results-title">Get a {((response?.prediction_result?.target_column || targetColumn) || 'New').replace(/_/g, ' ')} Prediction</h2>
                        <form onSubmit={handlePredictSubmit} className="prediction-form" target="_self">
                            {response?.best_model && (
                                <div style={{ marginBottom: 12, color: '#374151', fontSize: 13 }}>
                                    <strong>{['RandomForest', 'XGBoost', 'LightGBM', 'GradientBoosting'].includes(response.best_model) ? 'Model:' : 'AutoML Best Model:'}</strong> {response.best_model}
                                    {response.metric_type != null && response.metric != null ? (
                                        <span> • <strong>{response.metric_type}:</strong> {response.metric}</span>
                                    ) : null}
                                </div>
                            )}
                            <div className="form-grid">
                                {response?.feature_columns?.map((col) => (
                                    <div key={col} className="form-field">
                                        <label className="field-label">
                                            {col.replace(/_/g, ' ')}
                                            <input
                                                type={col.toLowerCase().includes('date') || col.toLowerCase().includes('timestamp') ? 'text' : 'text'}
                                                name={col}
                                                value={formData[col] || ''}
                                                onChange={handleInputChange}
                                                className="field-input"
                                                placeholder={`Enter ${col.replace(/_/g, ' ')}`}
                                                required
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="submit-btn">
                                    Get Prediction
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(response.row_data || {})}
                                    className="submit-btn"
                                    style={{ background: '#6b7280' }}
                                >
                                    Reset to Defaults
                                </button>
                            </div>
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
                                {/* Output Levels */}
                                {response.output_levels && (
                                    <div className="section-card modern-card">
                                        <h4 className="modern-subtitle">Output Levels</h4>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                            marginBottom: 12
                                        }}>
                                            <div style={{
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                background: '#fff'
                                            }}>
                                                <strong>Value:</strong>{" "}
                                                Predicted {String(response?.prediction_result?.target_column || targetColumn).replace(/_/g, ' ')} value is{" "}
                                                <strong>{String(response?.prediction_result?.predicted_value)}</strong>
                                            </div>
                                            {response.predicted_level && (
                                                <div style={{
                                                    alignSelf: 'flex-start',
                                                    padding: '6px 12px',
                                                    borderRadius: 999,
                                                    border: '1px solid #fecaca',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    fontWeight: 600,
                                                    fontSize: 13
                                                }}>
                                                    Predicted: {response.predicted_level}
                                                </div>
                                            )}
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f4f7fb' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Level</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Range</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(response.output_levels).map(([level, range]) => (
                                                    <tr key={level}>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
                                                            {String(level).toUpperCase()}
                                                        </td>
                                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                                                            {range?.min} – {range?.max}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Input Analysis */}
                                {Array.isArray(response.input_analysis) && response.input_analysis.length > 0 && (
                                    <div className="section-card modern-card">
                                        <h4 className="modern-subtitle">Input Analysis</h4>
                                        <ul className="modern-input-list">
                                            {response.input_analysis.map((t, i) => (
                                                <li key={i} className="modern-input-item">
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Prediction Interpretation */}
                                {Array.isArray(response.prediction_interpretation) && response.prediction_interpretation.length > 0 && (
                                    <div className="section-card modern-card">
                                        <h4 className="modern-subtitle">Prediction Interpretation</h4>
                                        <ul className="modern-input-list">
                                            {response.prediction_interpretation.map((t, i) => (
                                                <li key={i} className="modern-input-item">
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Business Insights */}
                                {Array.isArray(response.business_insights) && response.business_insights.length > 0 && (
                                    <div className="section-card modern-card">
                                        <h4 className="modern-subtitle">Business Insights</h4>
                                        <ul className="modern-input-list">
                                            {response.business_insights.map((t, i) => (
                                                <li key={i} className="modern-input-item">
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommended Actions */}
                                {Array.isArray(response.recommended_actions) && response.recommended_actions.length > 0 && (
                                    <div className="section-card modern-card" style={{ border: '1px solid #f59e0b', background: '#fffbeb' }}>
                                        <h4 className="modern-subtitle">Recommended Actions</h4>
                                        <ul className="modern-input-list">
                                            {response.recommended_actions.map((t, i) => (
                                                <li key={i} className="modern-input-item">
                                                    {t}
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
                                config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ['sendDataToCloud'] }}
                                style={{ width: '100%', height: '60vh' }}
                            />
                        </div>
                        <div className="forecast-table section-card modern-card" style={{ marginTop: 32 }}>
                            <h4 className="modern-subtitle">Forecast List</h4>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="back-button"
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            color: '#333',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back
                    </button>
                    <h2 style={{ margin: 0 }}>{pageTitle}</h2>
                </div>
                {/* First-level tabs */}
                {/* <div className="main-tabs">
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
                </div> */}

                {mainTab === 'Models' && (
                    <>
                        <form onSubmit={handleSubmit} className="analysis-form" target="_self">
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

                                {isPredict && (
                                    <div className="form-field">
                                        <label className="field-label">
                                            Prediction Model
                                            <select
                                                value={predictModel}
                                                onChange={(e) => setPredictModel(e.target.value)}
                                                className="field-select"
                                            >
                                                {modelOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                )}

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
                                    {loading ? (isForecast ? (forecastStep === 'training' ? 'Training Model...' : 'Generating Forecast...') : 'Training Model...') : `Train Model`}
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