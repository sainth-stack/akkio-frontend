import React, { useState } from 'react';
import './index.css';

const ModelTraining = () => {
  const [activeTab, setActiveTab] = useState("forecast");

  const tabs = [
    { id: 'forecast', label: 'Forecast Training' },
    { id: 'predict', label: 'Predict Training' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forecast':
        return (
          <div className="tab-content">
            <h3>Forecast Training</h3>
            <p>Configure and train time series forecasting models using historical data.</p>
            
            
            <div className="training-status">
              <h4>Training Status</h4>
              <div className="status-card">
                <div className="status-indicator ready"></div>
                <span>Ready to train</span>
              </div>
            </div>
          </div>
        );
        
      case 'predict':
        return (
          <div className="tab-content">
            <h3>Predict Training</h3>
            <p>Train machine learning models for classification and regression tasks.</p>
    
            
            <div className="training-status">
              <h4>Training Status</h4>
              <div className="status-card">
                <div className="status-indicator ready"></div>
                <span>Ready to train</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="model-training-container">
      <div className="page-header">
        <h1 className="page-title">Model Training</h1>
        <p className="page-subtitle">Train and configure machine learning models for your data</p>
      </div>
      
      <div className="training-form">
        <div className="tab-section">
          <nav className="tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="form-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ModelTraining;