import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartPopup = ({ isOpen, onClose, data, header, summary }) => {
  if (!isOpen) return null;

  const formatTooltipValue = (value, name) => {
    if (name === 'count') {
      return [`${value} records`, 'Count'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (value) => {
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  const getStatistics = (data) => {
    if (!data || data.length === 0) return {};
    
    const values = data.map(d => d.value);
    const counts = data.map(d => d.count);
    
    const total = counts.reduce((a, b) => a + b, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    return { total, min, max, avg: avg.toFixed(2) };
  };

  const stats = getStatistics(data);

  return (
    <div 
      className="chart-popup-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="chart-popup-container">
        {/* Header */}
        <div className="chart-popup-header">
          <div>
            <h2 className="chart-popup-title">{header} - Detailed Analysis</h2>
            <p className="chart-popup-subtitle">Distribution and statistical overview</p>
          </div>
          <button 
            onClick={onClose}
            className="chart-popup-close"
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="chart-popup-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Records</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.min}</div>
            <div className="stat-label">Minimum</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.max}</div>
            <div className="stat-label">Maximum</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avg}</div>
            <div className="stat-label">Average</div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="chart-popup-chart">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="value" 
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={formatXAxisLabel}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: header, position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600' } }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600' } }}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelStyle={{ color: '#333', fontWeight: '600' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="count" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                name="Record Count"
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#1e40af" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="chart-popup-summary">
            <h3>Summary</h3>
            <p>{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPopup; 