import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import axios from 'axios';
import './index.css';
import { akkiourl } from '../../../../../utils/const';

const MissingValues = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [tableHeight, setTableHeight] = useState(400);
    const [loading, setLoading] = useState(false);
    const tableBodyRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post(`${akkiourl}/fill_missed_data`);
                const sanitizedData = JSON.stringify(response.data).replace(
                    /NaN/g,
                    "0"
                );
                
                let cleanedData;
                try {
                    // First try to parse the sanitized data
                    const parsedOnce = JSON.parse(sanitizedData);
                    // Check if the result is a string that needs to be parsed again
                    if (typeof parsedOnce === 'string') {
                        cleanedData = JSON.parse(parsedOnce);
                    } else {
                        cleanedData = parsedOnce;
                    }
                    setData(cleanedData.df);
                    setSummary(cleanedData.summary);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    // If parsing fails, use the original sanitized data
                    setData(response.data.df);
                    setSummary(response.data.summary);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const calculateTableHeight = () => {
            if (tableBodyRef.current) {
                const rect = tableBodyRef.current.getBoundingClientRect();
                const availableHeight = window.innerHeight - rect.top - 20; // 20px padding
                const minHeight = window.innerHeight * 0.4; // 40vh minimum
                setTableHeight(Math.max(minHeight, availableHeight));
            }
        };

        // Initial calculation with a delay to ensure DOM is ready
        const timer = setTimeout(() => {
            calculateTableHeight();
        }, 100);

        window.addEventListener('resize', calculateTableHeight);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateTableHeight);
        };
    }, [summary]);

    const getColumns = () => {
        if (data.length === 0) return [];
        return Object.keys(data[0]);
    };

    // Calculate dynamic column width based on content
    const getColumnWidth = (columnName) => {
        if (data.length === 0) return 150;
        
        // Get max length of content in this column
        const maxLength = Math.max(
            columnName.length,
            ...data.slice(0, 100).map(row => 
                String(row[columnName]?.value || '').length
            )
        );
        
        // Set minimum width and scale based on content
        return Math.max(150, Math.min(300, maxLength * 10 + 20));
    };

    // Calculate additional statistics
    const getAdvancedStats = () => {
        if (!summary) return {};
        
        const totalColumns = Object.keys(summary.missing_count_per_column || {}).length;
        const totalCells = data.length * totalColumns;
        const completionRate = totalCells > 0 ? ((totalCells - (summary.total_missing_values || 0)) / totalCells * 100) : 100;
        
        // Find most affected column
        const mostAffectedColumn = Object.entries(summary.missing_percentage_per_column || {})
            .reduce((max, [col, percentage]) => 
                percentage > max.percentage ? { column: col, percentage } : max, 
                { column: 'None', percentage: 0 }
            );

        return {
            totalColumns,
            totalCells,
            completionRate,
            mostAffectedColumn,
            dataQualityScore: completionRate
        };
    };

    // Row renderer for virtualized table
    const Row = ({ index, style }) => {
        const row = data[index];
        const columns = getColumns();
        
        return (
            <div style={style} className="virtual-row">
                {columns.map((column, colIndex) => (
                    <div 
                        key={colIndex} 
                        className={`virtual-cell ${row[column].is_imputed === "True" ? "imputed" : ""}`}
                        style={{ 
                            width: getColumnWidth(column),
                            minWidth: getColumnWidth(column)
                        }}
                    >
                        {row[column].value}
                    </div>
                ))}
            </div>
        );
    };

    const stats = getAdvancedStats();

    // Show loader while loading
    if (loading) {
        return (
            <div className="missing-values-container">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Loading missing values analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="missing-values-container">
            <div className="page-header">
                <h1 className="page-title">Missing Values Analysis</h1>
            </div>
            
            {/* Summary Cards */}
            {summary && (
                <div className="summary-section">
                    <div className="summary-grid">
                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-value">{summary.total_missing_values || 0}</div>
                                <div className="stat-label">Total Missing Values</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-value">{stats.completionRate?.toFixed(1)}%</div>
                                <div className="stat-label">Data Completeness</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-value">{data.length.toLocaleString()}</div>
                                <div className="stat-label">Total Records</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-value">{(summary.columns_with_missing || []).length}</div>
                                <div className="stat-label">Affected Columns</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-value">{stats.dataQualityScore?.toFixed(1)}%</div>
                                <div className="stat-label">Quality Score</div>
                            </div>
                        </div>

                        {stats.mostAffectedColumn?.percentage > 0 && (
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-value">{stats.mostAffectedColumn.percentage.toFixed(1)}%</div>
                                    <div className="stat-label">Highest Missing Rate</div>
                                    <div className="stat-description">{stats.mostAffectedColumn.column}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column Details */}
                    {summary.columns_with_missing && summary.columns_with_missing.length > 0 && (
                        <div className="details-section">
                            <h3>Column-wise Missing Data</h3>
                            <div className="details-table">
                                <div className="details-header">
                                    <div className="details-column-name">Column Name</div>
                                    <div className="details-missing-count">Missing Count</div>
                                    <div className="details-percentage">Percentage</div>
                                </div>
                                {Object.entries(summary.missing_count_per_column || {})
                                    .filter(([_, count]) => count > 0)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([column, count]) => (
                                    <div key={column} className="details-row">
                                        <div className="details-column-name">{column}</div>
                                        <div className="details-missing-count">{count}</div>
                                        <div className="details-percentage">{(summary.missing_percentage_per_column[column] || 0).toFixed(1)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ignored Columns */}
                    {summary.ignored_columns && Object.keys(summary.ignored_columns).length > 0 && (
                        <div className="details-section" style={{ marginTop: '2rem' }}>
                            <h3>Ignored Columns</h3>
                            <div className="details-table">
                                <div className="details-header ignored-column-header">
                                    <div className="details-column-name">Column Name</div>
                                    <div className="details-reason">Reason</div>
                                </div>
                                {Object.entries(summary.ignored_columns).map(([column, reason]) => (
                                    <div key={column} className="details-row ignored-column-row">
                                        <div className="details-column-name">{column}</div>
                                        <div className="details-reason">{reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            {data.length > 0 && (
                <div className="table-section">
                    <div className="table-header">
                        <h3>Data Preview</h3>
                        <span className="table-subtitle">{data.length.toLocaleString()} rows × {getColumns().length} columns</span>
                    </div>
                    <div className="table-wrapper">
                        {/* Fixed Header */}
                        <div className="table-header-row">
                            {getColumns().map((column, index) => (
                                <div 
                                    key={index} 
                                    className="header-cell"
                                    style={{ 
                                        width: getColumnWidth(column),
                                        minWidth: getColumnWidth(column)
                                    }}
                                >
                                    {column}
                                    {summary && summary.missing_count_per_column && summary.missing_count_per_column[column] > 0 && (
                                        <span className="missing-indicator">
                                            ({summary.missing_count_per_column[column]} missing)
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Virtualized Body */}
                        <div className="table-body" ref={tableBodyRef}>
                            <List
                                height={tableHeight}
                                itemCount={data.length}
                                itemSize={50}
                                width="100%"
                            >
                                {Row}
                            </List>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissingValues;