import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Pagination, Select, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import './styles.css';

const { Option } = Select;

const PaginatedVirtualTable = ({ 
    headers, 
    data, 
    height = 400, 
    rowHeight = 50,
    onRowClick,
    renderCustomRow,
    className = '',
    searchTerm = '',
    pageSize = 1000, // Default page size
    showPagination = true,
    showExport = true,
    showSizeChanger = true
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageSize, setCurrentPageSize] = useState(pageSize);
    const [hoveredRowIndex, setHoveredRowIndex] = useState(-1);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        
        return data.filter(row =>
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
    }, [data, searchTerm, headers]);

    // Paginate filtered data
    const paginatedData = useMemo(() => {
        if (!showPagination) {
            return filteredData.slice(0, 10000); // Limit to 10k for performance without pagination
        }

        const startIndex = (currentPage - 1) * currentPageSize;
        const endIndex = startIndex + currentPageSize;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, currentPageSize, showPagination]);

    // Export functionality
    const exportToCSV = () => {
        const csvContent = [
            headers.join(','), // Header row
            ...filteredData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Handle objects (like in fillcsv.jsx)
                    if (typeof value === 'object' && value !== null) {
                        return `"${value.value || value}"`;
                    }
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `data_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Row renderer for react-window
    const Row = ({ index, style }) => {
        const row = paginatedData[index];
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
                        }
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

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== currentPageSize) {
            setCurrentPageSize(size);
        }
    };

    const handlePageSizeChange = (size) => {
        setCurrentPageSize(size);
        setCurrentPage(1); // Reset to first page when changing page size
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
                itemCount={paginatedData.length}
                itemSize={rowHeight}
                className="virtual-table-list"
            >
                {Row}
            </List>

            {/* Table Footer with Controls */}
            <div className="virtual-table-footer" style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    Showing {paginatedData.length} of {filteredData.length} records
                    {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {showExport && (
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={exportToCSV}
                            disabled={filteredData.length === 0}
                        >
                            Export CSV
                        </Button>
                    )}

                    {showSizeChanger && showPagination && (
                        <Select
                            size="small"
                            value={currentPageSize}
                            onChange={handlePageSizeChange}
                            style={{ width: 100 }}
                        >
                            <Option value={500}>500/page</Option>
                            <Option value={1000}>1K/page</Option>
                            <Option value={2000}>2K/page</Option>
                            <Option value={5000}>5K/page</Option>
                        </Select>
                    )}

                    {showPagination && (
                        <Pagination
                            size="small"
                            current={currentPage}
                            total={filteredData.length}
                            pageSize={currentPageSize}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            showQuickJumper={filteredData.length > currentPageSize * 10}
                            showTotal={(total, range) => 
                                `${range[0]}-${range[1]} of ${total}`
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaginatedVirtualTable; 