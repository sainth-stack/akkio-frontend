import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import './styles.css';

const VirtualizedTable = ({ 
    headers, 
    data, 
    height = 400, 
    rowHeight = 50,
    onRowClick,
    renderCustomRow,
    className = '',
    searchTerm = '',
    maxDisplayRows = 1000 // Limit for initial display performance
}) => {
    const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);

    // Filter data based on search term and limit for performance
    const filteredData = useMemo(() => {
        let filtered = data;
        
        if (searchTerm) {
            filtered = data.filter(row =>
                headers.some(header => {
                    const value = row[header];
                    try {
                        // Handle nested objects (like in fillcsv.jsx)
                        if (typeof value === 'object' && value !== null) {
                            const searchValue = value.value !== undefined ? value.value : String(value);
                            return String(searchValue || '').toLowerCase().includes(searchTerm.toLowerCase());
                        }
                        // Handle regular values (including null/undefined)
                        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
                    } catch (error) {
                        console.warn('Error filtering row:', error);
                        return false;
                    }
                })
            );
        }
        
        // Limit to maxDisplayRows for initial performance
        return filtered.slice(0, maxDisplayRows);
    }, [data, searchTerm, headers, maxDisplayRows]);

    // Row renderer for react-window
    const Row = ({ index, style }) => {
        const row = filteredData[index];
        const isHovered = index === hoveredRowIndex;
        
        if (renderCustomRow) {
            return (
                <div style={style}>
                    {renderCustomRow(row, index, isHovered)}
                </div>
            );
        }

        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: isHovered ? '#f8f9fa' : 'white',
                    transition: 'background-color 0.2s ease'
                }}
                className={`virtual-table-row ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredRowIndex(index)}
                onMouseLeave={() => setHoveredRowIndex(-1)}
                onClick={() => onRowClick && onRowClick(row, index)}
            >
                {headers.map((header, cellIndex) => (
                    <div
                        key={cellIndex}
                        className="virtual-table-cell"
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRight: cellIndex < headers.length - 1 ? '1px solid #f0f0f0' : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={typeof row[header] === 'object' && row[header] !== null 
                            ? String(row[header].value || row[header])
                            : String(row[header])
                        } // Tooltip for truncated text
                    >
                        {typeof row[header] === 'object' && row[header] !== null 
                            ? row[header].value || String(row[header])
                            : String(row[header])
                        }
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`virtualized-table-container ${className}`}>
            {/* Table Header */}
            <div className="virtual-table-header" style={{
                display: 'flex',
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: '600',
                fontSize: '14px',
                color: '#333'
            }}>
                {headers.map((header, index) => (
                    <div
                        key={index}
                        className="virtual-table-header-cell"
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRight: index < headers.length - 1 ? '1px solid #e0e0e0' : 'none',
                            textAlign: 'left'
                        }}
                    >
                        {header}
                    </div>
                ))}
            </div>

            {/* Virtualized Table Body */}
            <List
                height={height}
                itemCount={filteredData.length}
                itemSize={rowHeight}
                className="virtual-table-list"
            >
                {Row}
            </List>

            {/* Data summary */}
            <div className="virtual-table-footer" style={{
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e0e0e0',
                fontSize: '12px',
                color: '#666',
                textAlign: 'right'
            }}>
                Showing {filteredData.length} of {data.length} records
                {searchTerm && ` (filtered by "${searchTerm}")`}
                {filteredData.length === maxDisplayRows && data.length > maxDisplayRows && 
                    ` (limited to ${maxDisplayRows} for performance)`
                }
            </div>
        </div>
    );
};

export default VirtualizedTable; 