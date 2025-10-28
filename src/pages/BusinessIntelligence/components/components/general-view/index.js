import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spin, Input } from 'antd';
import { akkiourl } from '../../../../../utils/const';
import BarChartComponent from './BarGraph.jsx';
import ChartPopup from './ChartPopup.jsx';
import VirtualizedTable from '../../../../../components/VirtualizedTable';
import './ChartPopup.css';

const GeneralView = ({ headers }) => {
    const [data, setData] = useState([]);
    const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);
    const [popupData, setPopupData] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardKpis, setDashboardKpis] = useState(null);
    const [dashboardKpisLoading, setDashboardKpisLoading] = useState(true);
    const [actualHeaders, setActualHeaders] = useState([]);
    
    console.log(headers, data, 'headers and data');
    
    const handleRowHover = (index) => {
        setHoveredRowIndex(index);
    };

    // Extract headers from actual data structure
    const extractHeadersFromData = (dataArray) => {
        if (!dataArray || dataArray.length === 0) return [];
        return Object.keys(dataArray[0]);
    };

    // Fetch KPI data from /api/processing_for_dashboard
    const fetchDashboardKpis = async () => {
        try {
            setDashboardKpisLoading(true);
            const response = await axios.get(`${akkiourl}/processing_for_dashboard`);
            setDashboardKpis(response.data || null);
            
            // Set the preview data
            const previewData = response?.data?.Preview_data || [];
            setData(previewData);
            
            // Extract headers from the actual data structure
            const extractedHeaders = extractHeadersFromData(previewData);
            setActualHeaders(extractedHeaders);
            
        } catch (error) {
            console.error('Failed to fetch dashboard KPIs:', error);
            setDashboardKpis(null);
        } finally {
            setDashboardKpisLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardKpis();
    }, []);

    // Check if a column contains numerical data
    const isNumericalColumn = (header) => {
        if (!data || data.length === 0) return false;
        
        // Skip obviously non-numerical columns
        const nonNumericalColumns = ['DeviceID', 'SensorID', 'Date', 'EquipID', 'ID', 'Name', 'Type', 'Month'];
        if (nonNumericalColumns.some(col => header.toLowerCase().includes(col.toLowerCase()))) {
            return false;
        }

        // Check if most values in this column are numerical
        const sampleSize = Math.min(data.length, 20);
        let numericalCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
            const value = data[i][header];
            // Check for valid numbers, excluding null, undefined, empty strings
            if (value !== null && value !== undefined && value !== '') {
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (!isNaN(numValue) && isFinite(numValue)) {
                    numericalCount++;
                }
            }
        }
        
        return numericalCount / sampleSize > 0.6; // 60% of values should be numerical
    };

    // Dynamic data processing for bar charts based on actual data
    const getChartData = (header) => {
        // Skip non-numerical columns
        if (!isNumericalColumn(header)) {
            return [];
        }

        // Get all valid numerical values for this column
        const values = data.map(row => {
            const value = row[header];
            if (value === null || value === undefined || value === '') return null;
            
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            return (!isNaN(numValue) && isFinite(numValue)) ? numValue : null;
        }).filter(val => val !== null);

        if (values.length === 0) return [];

        // Calculate statistics
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        if (min === max) {
            // All values are the same
            return [{ 
                value: min, 
                count: values.length,
                range: `${min}`,
                percentage: 100
            }];
        }
        
        const numBins = Math.min(8, Math.max(3, Math.floor(Math.sqrt(values.length)))); // Dynamic number of bins
        const binSize = (max - min) / numBins;

        // Create bins and count frequencies
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = i === numBins - 1 ? max : min + ((i + 1) * binSize);
            const binCenter = (binStart + binEnd) / 2;
            
            const count = values.filter(val => {
                if (i === numBins - 1) {
                    // Last bin includes the max value
                    return val >= binStart && val <= binEnd;
                } else {
                    return val >= binStart && val < binEnd;
                }
            }).length;

            if (count > 0) { // Only include bins with data
                bins.push({
                    value: Math.round(binCenter * 100) / 100,
                    count: count,
                    range: `${Math.round(binStart * 100) / 100}-${Math.round(binEnd * 100) / 100}`,
                    percentage: Math.round((count / values.length) * 100)
                });
            }
        }

        return bins;
    };

    // Enhanced chart data for detailed popup view
    const getDetailedChartData = (header) => {
        // Skip non-numerical columns
        if (!isNumericalColumn(header)) {
            return [];
        }

        // Get all valid numerical values for this column
        const values = data.map(row => {
            const value = row[header];
            if (value === null || value === undefined || value === '') return null;
            
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            return (!isNaN(numValue) && isFinite(numValue)) ? numValue : null;
        }).filter(val => val !== null);

        if (values.length === 0) return [];

        // Calculate statistics
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        if (min === max) {
            return [{ 
                value: min, 
                count: values.length,
                range: `${min}`,
                percentage: 100
            }];
        }
        
        const numBins = Math.min(15, Math.max(5, Math.floor(values.length / 10))); // More bins for detailed view
        const binSize = (max - min) / numBins;

        // Create bins and count frequencies
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = i === numBins - 1 ? max : min + ((i + 1) * binSize);
            const binCenter = (binStart + binEnd) / 2;
            
            const count = values.filter(val => {
                if (i === numBins - 1) {
                    return val >= binStart && val <= binEnd;
                } else {
                    return val >= binStart && val < binEnd;
                }
            }).length;

            if (count > 0) {
                bins.push({
                    value: parseFloat(binCenter.toFixed(2)),
                    count: count,
                    range: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
                    percentage: Math.round((count / values.length) * 100)
                });
            }
        }

        return bins;
    };

    // Handle chart click to open popup
    const handleChartClick = (chartData, header) => {
        const detailedData = getDetailedChartData(header);
        const summary = generateSummary(header, detailedData);
        
        setPopupData({
            data: detailedData,
            header: header,
            summary: summary
        });
        setIsPopupOpen(true);
    };

    // Generate summary for the popup
    const generateSummary = (header, chartData) => {
        if (!chartData || chartData.length === 0) return '';
        
        const totalRecords = chartData.reduce((sum, item) => sum + item.count, 0);
        const values = chartData.map(item => item.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const avgValue = (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2);
        
        return `The ${header} distribution shows ${totalRecords} total records spanning from ${minValue} to ${maxValue}, with an average value of ${avgValue}. This visualization helps identify patterns, outliers, and the overall distribution of values in your dataset.`;
    };

    // Close popup
    const closePopup = () => {
        setIsPopupOpen(false);
        setPopupData(null);
    };

    // Get column type for display
    const getColumnType = (header) => {
        if (!data || data.length === 0) return 'Unknown';
        
        const sampleValue = data[0][header];
        
        if (header.toLowerCase().includes('id')) return 'ID';
        if (header.toLowerCase().includes('date') || header.toLowerCase().includes('time') || header.toLowerCase().includes('month')) return 'DateTime';
        if (isNumericalColumn(header)) return 'Number (Integer)';
        return 'Text';
    };

    // Helper: isCategoricalColumn
    const isCategoricalColumn = (header) => {
      if (!data || data.length === 0) return false;
      // Heuristic: not numerical, not all unique, and at least 1 unique value (allow single category)
      const values = data.map(row => row[header]);
      const unique = Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== '')));
      return !isNumericalColumn(header) && unique.length >= 1 && unique.length <= 20;
    };

    // Helper: isUniqueColumn
    const isUniqueColumn = (header) => {
      if (!data || data.length === 0) return false;
      const values = data.map(row => row[header]);
      const unique = Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== '')));
      return unique.length === data.length && data.length > 1;
    };

    // Helper: getCategoricalData
    const getCategoricalData = (header) => {
      if (!data || data.length === 0) return [];
      const values = data.map(row => row[header]);
      const counts = {};
      values.forEach(v => {
        if (v !== null && v !== undefined && v !== '') counts[v] = (counts[v] || 0) + 1;
      });
      const total = values.length;
      return Object.entries(counts)
        .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count);
    };

    // CategoricalBar: horizontal bar for categorical columns (screenshot style)
    const CategoricalBar = ({ data, height = 60 }) => {
      if (!data || data.length === 0) return <span style={{ color: '#999', fontSize: 11 }}>No data</span>;
      return (
        <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {data.slice(0, 3).map((item, idx) => (
            <div key={item.category} style={{ width: '100%', margin: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
          <span style={{ fontSize: 12, color: '#22304a', fontWeight: 500, marginBottom: 2 }}>{item.category}</span>
              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, minWidth: 32 }}>{item.percentage}%</span>
          </div>
              <div style={{ width: '100%', background: '#e5eaf2', borderRadius: 4, height: 12, marginBottom: 2, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: `${item.percentage}%`, background: 'rgba(59, 130, 246, 0.8)', height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      );
    };

    // UniqueValueCount: for columns with all unique values
    const UniqueValueCount = ({ count }) => (
      <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 600, fontSize: 13, background: '#f4f8fd', borderRadius: 6 }}>
        {count.toLocaleString()} unique values
      </div>
    );

    // KPI Cards Component (Dashboard KPIs)
    const DashboardKpiCards = () => {
        if (dashboardKpisLoading) {
            return (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    padding: '40px',
                    marginBottom: '24px'
                }}>
                    <Spin size="large" />
                </div>
            );
        }
        if (!dashboardKpis) return null;
        
        const stats = [
            { label: 'Total Records', value: dashboardKpis.nof_rows || data.length },
            { label: 'Number of Columns', value: dashboardKpis.nof_columns || actualHeaders.length },
            { label: 'Time Stamp Data', value: dashboardKpis.timestamp },
            { label: 'Sentiment', value: dashboardKpis.sentiment },
        ];
        
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
                marginBottom: '32px',
                padding: '0 8px'
            }}>
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                            borderRadius: '12px',
                            padding: '28px 24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #f0f2f5',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            bottom: '20%',
                            width: '3px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '0 2px 2px 0'
                        }} />
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            marginLeft: '8px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#4a5568',
                                lineHeight: '1.4',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                letterSpacing: '-0.01em'
                            }}>
                                {stat.label}
                            </h3>
                            <div style={{
                                fontSize: '36px',
                                fontWeight: '700',
                                color: '#1a202c',
                                lineHeight: '1.1',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                marginBottom: '4px',
                                letterSpacing: '-0.02em'
                            }}>
                                {stat.value || 'N/A'}
                            </div>
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-20%',
                            width: '150px',
                            height: '150px',
                            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.03) 0%, transparent 70%)',
                            borderRadius: '50%',
                            pointerEvents: 'none'
                        }} />
                    </div>
                ))}
            </div>
        );
    };

    // Enhanced VirtualizedTable with integrated graphs
    const EnhancedVirtualizedTable = ({ headers, data, height, rowHeight, searchTerm, maxDisplayRows, onRowClick }) => {
        // Filter data based on search term
        const filteredData = searchTerm 
            ? data.filter(row => 
                Object.values(row).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
            : data;

        const displayData = filteredData.slice(0, maxDisplayRows || filteredData.length);

        return (
            <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#fff'
            }}>
                {/* Unified scroll container so header and body scroll together */}
                <div style={{ height, overflow: 'auto' }}>
                    {/* Header with graphs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '2px solid #f0f0f0',
                        background: '#fafafa',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        {headers.map((header, index) => (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    padding: '12px 8px',
                                    borderRight: index < headers.length - 1 ? '1px solid #e0e0e0' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: '#fafafa'
                                }}
                            >
                                {/* Column Header */}
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#333',
                                    marginBottom: '4px',
                                    textAlign: 'center',
                                    lineHeight: '1.3'
                                }}>
                                    {header}
                                </div>
                                
                                {/* Column Type */}
                                <div style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    marginBottom: '8px',
                                    textAlign: 'center'
                                }}>
                                    {getColumnType(header)}
                                </div>

                                {/* Chart or Placeholder */}
                                <div style={{
                                    height: '100px',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {isNumericalColumn(header) ? (
                                        <BarChartComponent 
                                            data={getChartData(header)}
                                            header={header}
                                            height={130}
                                            width={190}
                                            onClick={handleChartClick}
                                            xAxis={false}
                                        />
                                    ) : isCategoricalColumn(header) ? (
                                        <CategoricalBar data={getCategoricalData(header)} />
                                    ) : isUniqueColumn(header) ? (
                                        <UniqueValueCount count={data.length} />
                                    ) : (
                                        <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>Text Data</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Rows */}
                    <div>
                        {displayData.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                style={{
                                    display: 'flex',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#fafafa',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => onRowClick && onRowClick(row, rowIndex)}
                                // onMouseEnter={() => handleRowHover(rowIndex)}
                                // onMouseLeave={() => handleRowHover(-1)}
                            >
                                {headers.map((header, colIndex) => (
                                    <div
                                        key={colIndex}
                                        style={{
                                            flex: 1,
                                            minWidth: '200px',
                                            padding: '12px 8px',
                                            borderRight: colIndex < headers.length - 1 ? '1px solid #e0e0e0' : 'none',
                                            fontSize: '12px',
                                            color: '#333',
                                            textAlign: 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={row[header]} // Tooltip for full value
                                    >
                                        {row[header] !== null && row[header] !== undefined ? row[header].toString() : '-'}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Use actualHeaders extracted from data, fallback to props headers
    const displayHeaders = actualHeaders.length > 0 ? actualHeaders : headers || [];

    return (
        <div style={{ padding: '10px', margin: '0' }}>
            {/* KPI Cards Section (Dashboard KPIs) */}
            <div style={{
                marginBottom: '24px',
                padding: '24px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
            }}>
                <DashboardKpiCards />
            </div>

            {/* Search Box */}
            {/* <div style={{ marginBottom: '16px' }}>
                <Input.Search
                    placeholder="Search through data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px' }}
                    allowClear
                />
            </div> */}

            {/* Enhanced Data Table with Integrated Charts */}
            <div style={{
                marginBottom: '24px'
            }}>

                <EnhancedVirtualizedTable
                    headers={displayHeaders}
                    data={data}
                    height={750}
                    rowHeight={45}
                    searchTerm={searchTerm}
                    maxDisplayRows={10000}
                    onRowClick={(row, index) => {
                        console.log('Row clicked:', row, index);
                    }}
                />
            </div>

            {/* Chart Popup */}
            {popupData && (
                <ChartPopup
                    isOpen={isPopupOpen}
                    onClose={closePopup}
                    data={popupData.data}
                    header={popupData.header}
                    summary={popupData.summary}
                />
            )}
        </div>
    );
};

export default GeneralView;