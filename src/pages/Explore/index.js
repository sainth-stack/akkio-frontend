import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import Spinner from 'react-bootstrap/Spinner';
import { akkiourl } from '../../utils/const';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Plot from 'react-plotly.js';
import EmptyState from '../../components/EmptyState';

// Component to render report content
const ReportContent = ({ data }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const reportRef = useRef(null);

  if (!data?.report) return null;
  const { heading, paragraphs, table, charts, analysis_charts, forecasting_charts } = data.report;

  const generatePDF = async () => {
    if (!reportRef.current) return null;

    try {
      setIsDownloading(true);
      
      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Capture the report content with reduced quality for smaller file size
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5, // Reduced from 2 to 1.5
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        logging: false, // Disable logging for performance
        imageTimeout: 15000 // 15 second timeout for images
      });
      
      // Compress the image for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality instead of PNG
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 10; // Start 10mm from top
      
      // Add content to PDF
      if (imgHeight <= pdfHeight - 20) {
        // Content fits on one page
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        let remainingHeight = imgHeight;
        let currentPosition = 0;
        
        while (remainingHeight > 0) {
          const pageHeight = Math.min(remainingHeight, pdfHeight - 20);
          const canvasHeight = (pageHeight * canvas.height) / imgHeight;
          
          // Create a temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = canvasHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          pageCtx.drawImage(
            canvas,
            0, currentPosition,
            canvas.width, canvasHeight,
            0, 0,
            canvas.width, canvasHeight
          );
          
          // Use JPEG compression for page images too
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(pageImgData, 'JPEG', 10, 10, imgWidth, pageHeight);
          
          remainingHeight -= pageHeight;
          currentPosition += canvasHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      return null;
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      const fileName = `${heading?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }
  };

  const saveReport = async (retryCount = 0) => {
    try {
      // Get email from localStorage
      const userDataString = localStorage.getItem('user');
      if (!userDataString) {
        alert('User information not found. Please login again.');
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const email = userData.email;
      
      if (!email) {
        alert('Email not found in user information.');
        return;
      }

      setIsSavingReport(true);
      
      // Generate PDF
      const pdf = await generatePDF();
      if (!pdf) return;
      
      // Convert PDF to blob with compression
      const pdfBlob = pdf.output('blob');
      
      // Check file size and warn if too large
      const fileSizeMB = pdfBlob.size / (1024 * 1024);
      console.log(`PDF file size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 15) {
        console.warn('Large PDF file detected, this might cause upload issues');
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('title', data?.title);
      formData.append('description', data?.description);
      formData.append('email', email);
      formData.append('pdf_file', pdfBlob, `report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log('Email:', email);
      console.log('PDF Blob size:', pdfBlob.size);
      
      // Construct the correct URL - remove potential double /api/
      const baseUrl = akkiourl.endsWith('/') ? akkiourl.slice(0, -1) : akkiourl;
      const apiUrl = baseUrl.includes('/api') ? `${baseUrl}/save_report` : `${baseUrl}/api/save_report`;
      
      console.log('API URL:', apiUrl);
      
      // Send to API with extended timeout and retry logic
      const response = await axios.post(apiUrl, formData, {
        timeout: 120000, // 2 minutes timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      console.log('Response:', response);
      
      if (response.status === 200) {
        alert('Report saved successfully!');
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle specific error types
      if (error.response?.status === 500 && retryCount < 2) {
        console.log(`Retrying... (attempt ${retryCount + 1}/3)`);
        // Wait a bit before retrying
        setTimeout(() => {
          saveReport(retryCount + 1);
        }, 2000);
        return;
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        alert('Upload timeout. The file might be too large. Please try again or contact support.');
      } else if (error.response?.data?.detail?.includes('SSL')) {
        alert('Connection error occurred. Please check your internet connection and try again.');
      } else {
        alert('Error saving report. Please try again or contact support if the issue persists.');
      }
    } finally {
      setIsSavingReport(false);
    }
  };

  const renderPlotlyChart = (chart, index) => {
    if (!chart.plotly) return null;
    
    return (
      <div key={index} className="chart-container" style={{ 
        marginBottom: '2rem', 
        backgroundColor: '#ffffff', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ 
          marginBottom: '1.5rem', 
          color: '#1f2937', 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          textAlign: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0.75rem'
        }}>
          {chart.title}
        </h4>
        <div style={{ height: '450px', width: '100%' }}>
          <Plot
            data={chart.plotly.data}
            layout={{
              ...chart.plotly.layout,
              autosize: true,
              font: { 
                family: 'Inter, system-ui, sans-serif',
                size: 12,
                color: '#374151'
              },
              plot_bgcolor: '#ffffff',
              paper_bgcolor: '#ffffff',
              margin: { l: 60, r: 40, t: 40, b: 60 },
              showlegend: true,
              legend: {
                orientation: 'h',
                x: 0.5,
                xanchor: 'center',
                y: -0.15
              },
              grid: {
                rows: 1,
                columns: 1,
                pattern: 'independent'
              }
            }}
            config={{ 
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              displaylogo: false
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    );
  };

  const renderChart = (chart, index) => {
    // Handle the data format from your JSON
    let chartData;
    let seriesNames;
    
    if (chart.data && Array.isArray(chart.data)) {
      // Transform the data to the expected format
      chartData = chart.data.reduce((acc, item) => {
        const existingItem = acc.find(accItem => accItem.x === item.x);
        if (existingItem) {
          existingItem[item.series] = item.y;
        } else {
          acc.push({ x: item.x, [item.series]: item.y });
        }
        return acc;
      }, []);

      seriesNames = [...new Set(chart.data.map(item => item.series))];
    } else {
      // Fallback for other data formats
      chartData = chart.data || [];
      seriesNames = chart.series || [];
    }

    const colors = chart.config?.colors || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    if (chart.chartType === 'bar') {
      return (
        <div key={index} className="chart-container" style={{ 
          marginBottom: '2rem', 
          backgroundColor: '#ffffff', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ 
            marginBottom: '1.5rem', 
            color: '#1f2937', 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            textAlign: 'center',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '0.75rem'
          }}>
            {chart.title}
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              {seriesNames.map((series, seriesIndex) => (
                <Bar 
                  key={series} 
                  dataKey={series} 
                  fill={colors[seriesIndex % colors.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chart.chartType === 'line') {
      return (
        <div key={index} className="chart-container" style={{ 
          marginBottom: '2rem', 
          backgroundColor: '#ffffff', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ 
            marginBottom: '1.5rem', 
            color: '#1f2937', 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            textAlign: 'center',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '0.75rem'
          }}>
            {chart.title}
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="x" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              {seriesNames.map((series, seriesIndex) => (
                <Line 
                  key={series} 
                  type="monotone" 
                  dataKey={series} 
                  stroke={colors[seriesIndex % colors.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="report-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
      {/* Action Buttons */}
      <div className="report-actions" style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        justifyContent: 'flex-end',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !isDownloading && (e.target.style.backgroundColor = '#047857')}
          onMouseLeave={(e) => !isDownloading && (e.target.style.backgroundColor = '#059669')}
        >
          {isDownloading ? (
            <>
              <Spinner animation="border" size="sm" />
              Generating PDF...
            </>
          ) : (
            <>
              📄 Download PDF
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowSaveModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          💾 Save Report
        </button>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Save Report
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
              fontSize: '0.9375rem'
            }}>
              Are you sure you want to save this report? It will be saved to your account.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                disabled={isSavingReport}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: isSavingReport ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSavingReport ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="report-content" style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontFamily: 'Inter, system-ui, sans-serif',
        width: '100%'
      }}>
        {/* Professional Header */}
        <div style={{
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          margin: '-2rem -2rem 2rem -2rem',
          padding: '2rem',
          borderRadius: '8px 8px 0 0'
        }}>
          {heading && (
            <>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#1e293b',
                marginBottom: '0.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.2'
              }}>
                {heading}
              </h1>
              <p style={{
                color: '#64748b',
                fontSize: '1rem',
                margin: 0,
                fontWeight: '500'
              }}>
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </>
          )}
        </div>

        {/* Executive Summary */}
        {paragraphs && paragraphs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '1rem',
              lineHeight: '1.3'
            }}>
              Executive Summary
            </h2>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {paragraphs.map((paragraph, index) => (
                <p key={index} style={{ 
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  color: '#334155',
                  marginBottom: index === paragraphs.length - 1 ? '0' : '1rem',
                  textAlign: 'justify',
                  fontWeight: '400'
                }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Data Summary Table */}
        {table && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '1rem',
              lineHeight: '1.3'
            }}>
              Key Metrics Summary
            </h2>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  }}>
                    {table.headers.map((header, index) => (
                      <th key={index} style={{
                        padding: '1rem 1.25rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#000',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderRight: index < table.headers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ 
                      backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background-color 0.2s ease'
                    }}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{
                          padding: '1rem 1.25rem',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: cellIndex < row.length - 1 ? '1px solid #e2e8f0' : 'none',
                          color: '#334155',
                          fontSize: '0.875rem',
                          fontWeight: cellIndex === 0 ? '600' : '500',
                          ...(cellIndex === 3 && cell.includes('+') ? { color: '#059669', fontWeight: '600' } : {}),
                          ...(cellIndex === 3 && cell.includes('-') ? { color: '#dc2626', fontWeight: '600' } : {})
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Charts */}
        {analysis_charts && analysis_charts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '1rem',
              lineHeight: '1.3'
            }}>
              Data Analysis
            </h2>
            <div style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              width: '100%'
            }}>
              {analysis_charts.map((chart, index) => {
                // Try plotly first, then fallback to regular chart
                const plotlyChart = renderPlotlyChart(chart, index);
                if (plotlyChart) return plotlyChart;
                return renderChart(chart, index);
              })}
            </div>
          </div>
        )}

        {/* Forecasting Charts */}
        {forecasting_charts && forecasting_charts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem',
              borderLeft: '4px solid #10b981',
              paddingLeft: '1rem',
              lineHeight: '1.3'
            }}>
              Forecasting Results
            </h2>
            <div style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              width: '100%'
            }}>
              {forecasting_charts.map((chart, index) => {
                // Try plotly first, then fallback to regular chart
                const plotlyChart = renderPlotlyChart(chart, index);
                if (plotlyChart) return plotlyChart;
                return renderChart(chart, index);
              })}
            </div>
          </div>
        )}

        {/* Legacy Charts Support */}
        {charts && charts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1e293b',
              marginBottom: '1rem',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '1rem',
              lineHeight: '1.3'
            }}>
              Data Visualizations
            </h2>
            <div style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              width: '100%'
            }}>
              {charts.map((chart, index) => renderChart(chart, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component to render general answer
const GeneralAnswer = ({ data }) => {
  if (!data?.answer) return null;

  return (
    <div className="general-answer" style={{
      // backgroundColor: '#ffffff',
      // padding: '1.5rem',
      // borderRadius: '8px',
      // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      // border: '1px solid #e5e7eb'
    }}>
      <p className="desc-ben" style={{
        margin: 0,
        fontSize: '1rem',
        lineHeight: '1.6',
        color: '#374151'
      }}>
        {data.answer}
      </p>
    </div>
  );
};

// Component to render simple text/explanation answers
const AnswerText = ({ payload, explanation }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {explanation && (
        <div style={{
          background: '#eef2ff',
          border: '1px solid #c7d2fe',
          color: '#3730a3',
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          fontSize: 13,
        }} dangerouslySetInnerHTML={{ __html: explanation }}>
          {/* {explanation} */} 
        </div>
      )}
      <div style={{ color: '#111827', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: payload }} />
    </div>
  );
};

// Component to render table/list results
const AnswerTable = ({ rows, explanation }) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <AnswerText payload="No rows to display." explanation={explanation} />;
  }

  // Build a stable set of columns from the union of keys across rows
  const firstRowKeys = Object.keys(rows[0] || {});
  const extraKeys = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  ).filter((k) => !firstRowKeys.includes(k));
  const columns = [...firstRowKeys, ...extraKeys];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {explanation && (
        <div style={{
          background: '#ecfeff',
          border: '1px solid #a5f3fc',
          color: '#155e75',
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          fontSize: 13,
        }}>
          {explanation}
        </div>
      )}
      <div style={{ width: '100%', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {columns.map((col) => (
                <th key={col} style={{
                  position: 'sticky',
                  top: 0,
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#374151',
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                {columns.map((col) => (
                  <td key={col} style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: 13,
                    color: '#111827',
                    maxWidth: 420,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {row && row[col] !== undefined && row[col] !== null
                      ? String(row[col])
                      : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component to render Plotly chart from figure dict
const AnswerPlotly = ({ figure, explanation }) => {
  const rawData = (figure && (figure.data || figure.figure?.data)) || [];
  const rawLayout = (figure && (figure.layout || figure.figure?.layout)) || {};

  // Normalize traces: ensure arrays exist and lengths match; allow categorical y for scatter/line; drop empty traces
  let missingYWarning = false;
  const MAX_POINTS_PER_TRACE = 10000; // hard cap for rendering performance
  const WEBGL_THRESHOLD = 50000; // switch to scattergl beyond this size

  const toEpoch = (v) => {
    const t = typeof v === 'string' || v instanceof Date ? Date.parse(v) : (Number.isFinite(v) ? v : NaN);
    return Number.isFinite(t) ? t : NaN;
  };

  // Largest-Triangle-Three-Buckets downsampling for numeric series
  const downsampleLTTB = (xArr, yArr, threshold) => {
    const length = xArr.length;
    if (threshold >= length || threshold <= 2) return { x: xArr, y: yArr };

    // Convert x to numeric domain for area calculations
    const xNum = xArr.map((v, i) => {
      const n = toEpoch(v);
      return Number.isFinite(n) ? n : i; // fallback to index if not a date/number
    });

    const sampledX = new Array(threshold);
    const sampledY = new Array(threshold);

    // Bucket size. Leave room for first and last data points
    const bucketSize = (length - 2) / (threshold - 2);
    let a = 0; // initially a is the first point
    sampledX[0] = xArr[0];
    sampledY[0] = yArr[0];

    for (let i = 0; i < threshold - 2; i++) {
      // range for this bucket
      const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
      const rangeEnd = Math.floor((i + 2) * bucketSize) + 1;
      const rangeEndClamped = Math.min(rangeEnd, length);

      // Calculate average for next bucket (used for calculating area)
      let avgX = 0;
      let avgY = 0;
      const avgRangeStart = rangeStart;
      const avgRangeEnd = rangeEndClamped;
      const avgRangeLength = avgRangeEnd - avgRangeStart;
      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += xNum[j];
        avgY += Number(yArr[j]) || 0;
      }
      avgX /= Math.max(1, avgRangeLength);
      avgY /= Math.max(1, avgRangeLength);

      // Get the point from this bucket that forms the largest triangle
      let maxArea = -1;
      let maxIndex = rangeStart;
      for (let j = rangeStart; j < rangeEndClamped; j++) {
        const area = Math.abs(
          (xNum[a] - avgX) * (Number(yArr[j]) - Number(yArr[a])) -
          (xNum[a] - xNum[j]) * (avgY - Number(yArr[a]))
        );
        if (area > maxArea) {
          maxArea = area;
          maxIndex = j;
        }
      }
      sampledX[i + 1] = xArr[maxIndex];
      sampledY[i + 1] = yArr[maxIndex];
      a = maxIndex; // next a is this bucket's chosen point
    }

    sampledX[threshold - 1] = xArr[length - 1];
    sampledY[threshold - 1] = yArr[length - 1];
    return { x: sampledX, y: sampledY };
  };

  const strideSample = (xArr, yArr, threshold) => {
    const length = xArr.length;
    if (length <= threshold) return { x: xArr, y: yArr };
    const stride = Math.ceil(length / threshold);
    const sx = [];
    const sy = [];
    for (let i = 0; i < length; i += stride) {
      sx.push(xArr[i]);
      sy.push(yArr[i]);
    }
    // Ensure last point is included
    if (sx[sx.length - 1] !== xArr[length - 1]) {
      sx.push(xArr[length - 1]);
      sy.push(yArr[length - 1]);
    }
    return { x: sx, y: sy };
  };

  const normalizedData = (Array.isArray(rawData) ? rawData : [])
    .map((trace) => {
      const x = Array.isArray(trace?.x) ? trace.x : [];
      let yCandidate = Array.isArray(trace?.y) ? trace.y : (Array.isArray(trace?.values) ? trace.values : []);
      if ((!yCandidate || yCandidate.length === 0) && Array.isArray(x) && x.length > 0 && (trace?.type === 'scatter' || trace?.type === 'lines')) {
        yCandidate = x.map((_, i) => i + 1);
        missingYWarning = true;
      }

      const isScatterLike = (
        trace?.type === 'scatter' ||
        trace?.type === 'scattergl' ||
        (typeof trace?.mode === 'string' && (trace.mode.includes('lines') || trace.mode.includes('markers')))
      );

      const y = isScatterLike
        ? yCandidate.map((v) => (v === null || v === undefined || v === '' ? null : v))
        : yCandidate
            .map((v) => (v === null || v === undefined || v === '' ? null : Number(v)))
            .map((v) => (Number.isFinite(v) ? v : null));

      const filtered = x.reduce((acc, xv, i) => {
        const yv = y[i];
        if (isScatterLike) {
          if (yv !== null) {
            acc.x.push(xv);
            acc.y.push(yv);
          }
        } else if (yv !== null && Number.isFinite(yv)) {
          acc.x.push(xv);
          acc.y.push(yv);
        }
        return acc;
      }, { x: [], y: [] });

      // Downsample large traces
      const pointCount = filtered.x.length;
      let ds = { x: filtered.x, y: filtered.y };
      if (pointCount > MAX_POINTS_PER_TRACE) {
        const yIsNumeric = filtered.y.every((v) => typeof v === 'number' && Number.isFinite(v));
        ds = yIsNumeric ? downsampleLTTB(filtered.x, filtered.y, MAX_POINTS_PER_TRACE) : strideSample(filtered.x, filtered.y, MAX_POINTS_PER_TRACE);
      }

      return {
        ...trace,
        type: (isScatterLike && pointCount > WEBGL_THRESHOLD) ? 'scattergl' : trace?.type,
        x: ds.x,
        y: ds.y,
        hovertemplate: trace?.hovertemplate || '%{x}<br>%{y}<extra></extra>',
        marker: {
          ...(trace?.marker || {}),
          line: { width: 0 },
        },
      };
    })
    .filter((t) => Array.isArray(t.x) && t.x.length > 0 && Array.isArray(t.y) && t.y.length > 0);

  if (!normalizedData.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {explanation && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#7c2d12',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            fontSize: 13,
          }}>
            {explanation}
          </div>
        )}
        <div style={{
          width: '100%',
          padding: '16px',
          border: '1px dashed #e5e7eb',
          borderRadius: 8,
          background: '#fafafa',
          color: '#6b7280',
          fontSize: 14,
          textAlign: 'center',
        }}>
          No chart data to display.
        </div>
      </div>
    );
  }

  const isCategoricalY = normalizedData.some((t) => (t?.y || []).some((v) => typeof v === 'string'));

  const layout = {
    ...rawLayout,
    autosize: true,
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { l: 60, r: 30, t: 48, b: 80, ...(rawLayout?.margin || {}) },
    font: { family: 'Inter, system-ui, sans-serif', size: 12, color: '#374151', ...(rawLayout?.font || {}) },
    showlegend: rawLayout?.showlegend ?? true,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2, ...(rawLayout?.legend || {}) },
    xaxis: { ...(rawLayout?.xaxis || {}), tickangle: rawLayout?.xaxis?.tickangle ?? -45, gridcolor: '#f3f4f6', zerolinecolor: '#e5e7eb' },
    yaxis: { ...(rawLayout?.yaxis || {}), gridcolor: '#f3f4f6', zerolinecolor: '#e5e7eb', type: isCategoricalY ? 'category' : (rawLayout?.yaxis?.type || undefined) },
    template: undefined, // avoid heavy default templates that clash with app theme
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {explanation && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          color: '#7c2d12',
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          fontSize: 13,
        }}>
          {explanation}
        </div>
      )}
      {missingYWarning && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          color: '#9a3412',
          padding: '0.4rem 0.65rem',
          borderRadius: 6,
          fontSize: 12,
        }}>
          Y values were missing in the response; plotted index values as a fallback.
        </div>
      )}
      <div style={{ width: '100%', height: 420 }}>
        <Plot
          data={normalizedData}
          layout={layout}
          config={{ responsive: true, displaylogo: false, displayModeBar: 'hover', modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d'] }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

// Component to render message content
const MessageContent = ({ content }) => {
  try {
    const parsedContent = JSON.parse(content);
    
    // Check if it's a report format
    if (parsedContent.report) {
      return <ReportContent data={parsedContent} />;
    }
    
    // General older format answer
    if (parsedContent.answer) {
      return <GeneralAnswer data={parsedContent} />;
    }

    // New agent formats: { type, payload, explanation? }
    if (parsedContent.type && Object.prototype.hasOwnProperty.call(parsedContent, 'payload')) {
      const { type, payload, explanation,explanation_html } = parsedContent;
      if (type === 'plotly') {
        if (!payload) return <AnswerText payload="No chart to display." explanation={explanation} />;
        return <AnswerPlotly figure={payload} explanation={explanation} />;
      }
      if (type === 'table') {
        const rows = Array.isArray(payload) ? payload : [];
        return <AnswerTable rows={rows} explanation={explanation} />;
      }
      if (type === 'text') {
        return <AnswerText payload={payload} explanation={explanation} />;
      }
      // Unknown type -> stringify
      return <AnswerText payload={parsedContent} />;
    }
    
    // Fallback to original content if structure is unknown
    return (
      <div dangerouslySetInnerHTML={{ __html: content }} />
    );
  } catch (error) {
    // If parsing fails, display as HTML (original behavior)
    return (
      <div dangerouslySetInnerHTML={{ __html: content }} />
    );
  }
};

const Reports = ({ initialSessionId }) => {
  const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', content: '{"answer": "Hello! How can I assist you today?"}' }
  ]);
  const [sessionId, setSessionId] = useState(initialSessionId || '');

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      question: true,
      isLoading: true
    }]);

    setIsLoading(true);

    const params = new URLSearchParams();
    params.append('query', message);
    if (sessionId) {
      params.append('session_id', sessionId);
    }

    try {
      const response = await axios.post(`${akkiourl}/Explore/`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      // Try to extract session_id from response
      let newSessionId = sessionId;
      if (response.data) {
        if (typeof response.data === 'object' && response.data.session_id) {
          newSessionId = response.data.session_id;
        } else {
          // Try to parse if string
          try {
            const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : null;
            if (parsed && parsed.session_id) {
              newSessionId = parsed.session_id;
            }
          } catch {}
        }
      }
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }
      const botResponse = {
        type: 'bot',
        content: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data
      };

      setMessages(prev => prev.map(msg =>
        msg.isLoading ? { ...msg, isLoading: false } : msg
      ).concat(botResponse));

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(msg =>
        msg.isLoading ? { ...msg, isLoading: false } : msg
      ).concat([{
        type: 'bot',
        content: '{"answer": "Sorry, there was an error processing your request."}',
        messageType: 'text',
        code: 'Not Found'
      }]));
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    !filename ? <EmptyState /> : <div className="chat-container">
      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((msg, index) => {
            console.log(msg,'sdfd')
            return(
              (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    maxWidth: "100%",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: msg.question ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    className={`${msg.type}-message`}
                    style={{
                      display: "flex",
                      width: "100%",
                      flexDirection: "column",
                      gap: "10px",
                      maxWidth: "100%",
                      alignSelf: msg.question ? "flex-end" : "flex-start",
                      alignItems: msg.question ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg?.content && (
                      <div style={{ width: '100%', overflow: 'auto' }}>
                        {msg.type === 'bot' ? (
                          <MessageContent content={msg.content} />
                        ) : (
                          <div>{msg.content}</div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.isLoading && (
                    <div className="spinner-container">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    </div>
                  )}
                </div>
              )
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-container">
            <input
              type="text"
              className="chat-input"
              value={message}
              onChange={handleMessageChange}
              placeholder="Ask something..."
            />
          </div>
          <button type="submit" className="send-button" disabled={isLoading}>
            {isLoading ? (
              <Spinner
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reports;