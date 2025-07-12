import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spin, Input } from 'antd';
import { akkiourl } from '../../../../../utils/const';
import BarChartComponent from './BarGraph.jsx';
import ChartPopup from './ChartPopup.jsx';
import VirtualizedTable from '../../../../../components/VirtualizedTable';
import './ChartPopup.css';

const GeneralView = ({headers, data}) => {
    const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);
    const [popupData, setPopupData] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardKpis, setDashboardKpis] = useState(null);
    const [dashboardKpisLoading, setDashboardKpisLoading] = useState(true);
    
    console.log(headers,data,'headers')
    
    const handleRowHover = (index) => {
        setHoveredRowIndex(index);
    };

    // Fetch KPI data from /api/processing_for_dashboard
    const fetchDashboardKpis = async () => {
        try {
            setDashboardKpisLoading(true);
            const response = await axios.get(`${akkiourl}/processing_for_dashboard`);
            setDashboardKpis(response.data || null);
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

    // Dynamic data processing for bar charts based on actual data
    const getChartData = (header) => {
        // Skip non-numerical columns
        if (header === 'Date' || header === 'EquipID') {
            return [];
        }

        // Get all values for this column
        const values = data.map(row => {
            const value = row[header];
            return typeof value === 'number' ? value : parseFloat(value) || 0;
        }).filter(val => !isNaN(val));

        if (values.length === 0) return [];

        // Calculate min, max, and create bins
        const min = Math.min(...values);
        const max = Math.max(...values);
        const numBins = 8; // Number of bins for the histogram
        const binSize = (max - min) / numBins;

        // Create bins and count frequencies
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = min + ((i + 1) * binSize);
            const binCenter = (binStart + binEnd) / 2;
            
            const count = values.filter(val => {
                if (i === numBins - 1) {
                    // Last bin includes the max value
                    return val >= binStart && val <= binEnd;
                } else {
                    return val >= binStart && val < binEnd;
                }
            }).length;

            bins.push({
                value: Math.round(binCenter),
                count: count
            });
        }

        return bins;
    };

    // Enhanced chart data for detailed popup view
    const getDetailedChartData = (header) => {
        // Skip non-numerical columns
        if (header === 'Date' || header === 'EquipID') {
            return [];
        }

        // Get all values for this column
        const values = data.map(row => {
            const value = row[header];
            return typeof value === 'number' ? value : parseFloat(value) || 0;
        }).filter(val => !isNaN(val));

        if (values.length === 0) return [];

        // Calculate min, max, and create more detailed bins for popup
        const min = Math.min(...values);
        const max = Math.max(...values);
        const numBins = 15; // More bins for detailed view
        const binSize = (max - min) / numBins;

        // Create bins and count frequencies
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = min + ((i + 1) * binSize);
            const binCenter = (binStart + binEnd) / 2;
            
            const count = values.filter(val => {
                if (i === numBins - 1) {
                    return val >= binStart && val <= binEnd;
                } else {
                    return val >= binStart && val < binEnd;
                }
            }).length;

            bins.push({
                value: parseFloat(binCenter.toFixed(2)),
                count: count
            });
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
            { label: 'Total Records', value: dashboardKpis.nof_rows },
            { label: 'Number of Columns', value: dashboardKpis.nof_columns },
            { label: 'Time Stamp Data', value: dashboardKpis.timestamp },
            // { label: 'Stationary', value: dashboardKpis.stationary },
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
            <div style={{ marginBottom: '16px' }}>
                <Input.Search
                    placeholder="Search through data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px' }}
                    allowClear
                />
            </div>

            {/* Charts Row */}
            <div style={{
                marginBottom: '16px',
                padding: '16px',
                background: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
            }}>
                <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#333'
                }}>
                    Data Distribution
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${headers.length}, 1fr)`,
                    gap: '16px',
                    alignItems: 'center'
                }}>
                    {headers.map((header, index) => (
                        <div key={index} style={{ textAlign: 'center' }}>
                            <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '500', 
                                color: '#666',
                                marginBottom: '8px'
                            }}>
                                {header}
                            </div>
                            {(header === 'Date' || header === 'EquipID') ? (
                                <span style={{ fontSize: '11px', color: '#999' }}>
                                    {header === 'Date' ? 'Timeline' : 'Equipment'}
                                </span>
                            ) : (
                                <BarChartComponent 
                                    data={getChartData(header)}
                                    header={header}
                                    height={80}
                                    width={150}
                                    onClick={handleChartClick}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Table with Virtualization */}
            <div style={{
                marginBottom: '24px'
            }}>
                <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#333'
                }}>
                    Data Records ({data.length.toLocaleString()} total)
                </h3>
                <VirtualizedTable
                    headers={headers}
                    data={data}
                    height={500}
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