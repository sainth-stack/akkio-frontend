import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import Spinner from 'react-bootstrap/Spinner';
import { Collapse, Tag, Progress } from 'antd';
import { FaCheckCircle, FaRobot, FaBrain, FaMicrophone } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { akkiourl } from '../../utils/const';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Plot from 'react-plotly.js';
import EmptyState from '../../components/EmptyState';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import mammoth from 'mammoth';
import PremiumOverlay from '../../components/PremiumOverlay';
import { useSearchParams } from 'react-router-dom';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// PDF Viewer Component using react-pdf
const PDFViewer = ({ fileData: pdfDataUrl, filename }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error('PDF Load Error:', error);
    setLoading(false);
  }

  return (
    <div>
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner animation="border" size="sm" />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Loading PDF...</p>
        </div>
      )}
      <Document
        file={pdfDataUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
      >
        <Page
          pageNumber={pageNumber}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          width={350}
        />
      </Document>
      {numPages && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.875rem'
        }}>
          <button
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: pageNumber <= 1 ? '#e5e7eb' : '#2563eb',
              color: pageNumber <= 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Previous
          </button>
          <span style={{ color: '#374151', fontWeight: '500' }}>
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: pageNumber >= numPages ? '#e5e7eb' : '#2563eb',
              color: pageNumber >= numPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Word Document Viewer using mammoth
const WordViewer = ({ fileData: docxDataUrl, filename }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        // Convert data URL to ArrayBuffer
        const base64Data = docxDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Use mammoth to convert to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        setHtmlContent(result.value);
        setLoading(false);
      } catch (err) {
        console.error('Word document conversion error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (docxDataUrl) {
      loadDocument();
    }
  }, [docxDataUrl]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner animation="border" size="sm" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Loading Word document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Failed to load document: {error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: '#ffffff',
        maxHeight: '70vh',
        overflow: 'auto',
        fontSize: '0.95rem',
        lineHeight: '1.8',
        color: '#1f2937'
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Component to render file preview based on type
const FilePreview = ({ fileData, filename }) => {
  if (!fileData) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
        No file preview available
      </div>
    );
  }

  const { type, preview_data, file_data, text_content, transcription } = fileData;

  // Debug log
  console.log('[FilePreview] Data:', { type, hasPreviewData: !!preview_data, hasFileData: !!file_data, hasTextContent: !!text_content, textContentLength: text_content?.length });

  // CSV/Excel/Tabular table preview
  if ((type === 'csv' || type === 'excel' || type === 'tabular') && preview_data) {
    const { columns, rows, total_rows, preview_rows } = preview_data;
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            {total_rows} rows × {columns.length} columns
            {preview_rows < total_rows && ` (showing first ${preview_rows})`}
          </p>
        </div>
        <div style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 10 }}>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #e5e7eb',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      color: '#374151'
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#111827',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={String(row[col] || '')}
                    >
                      {String(row[col] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // PDF preview using react-pdf (handle both 'pdf' and 'document' type with PDF data)
  if (type === 'pdf' || (type === 'document' && file_data && file_data.includes('application/pdf'))) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
          {file_data && (
            <a
              href={file_data}
              download={filename}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#059669',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              ⬇ Download
            </a>
          )}
        </div>
        {file_data ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
            <PDFViewer fileData={file_data} filename={filename} />
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>No preview available for this PDF.</p>
          </div>
        )}
      </div>
    );
  }

  // Word document preview using mammoth (handle both 'word' and 'document' type with Word data)
  if (type === 'word' || (type === 'document' && file_data && file_data.includes('wordprocessingml'))) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
          {file_data && (
            <a
              href={file_data}
              download={filename}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              ⬇ Download
            </a>
          )}
        </div>
        {file_data ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <WordViewer fileData={file_data} filename={filename} />
          </div>
        ) : text_content ? (
          <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '4px', maxHeight: '70vh', overflow: 'auto', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {text_content}
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>No preview available for this document.</p>
          </div>
        )}
      </div>
    );
  }

  // XML preview
  if (type === 'xml') {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
        </div>
        {text_content ? (
          <div style={{ padding: '1rem', backgroundColor: '#1f2937', borderRadius: '4px', maxHeight: '70vh', overflow: 'auto', border: '1px solid #374151' }}>
            <pre style={{
              fontSize: '0.8rem',
              color: '#f3f4f6',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              lineHeight: '1.5'
            }}>
              {text_content}
            </pre>
          </div>
        ) : file_data ? (
          <div style={{ height: '70vh', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <iframe
              src={file_data}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="XML Preview"
            />
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>No XML preview available.</p>
          </div>
        )}
      </div>
    );
  }

  // Image preview
  if (type === 'image') {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
        </div>
        {file_data ? (
          <div style={{
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px'
          }}>
            <img
              src={file_data}
              alt={filename}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <p style={{ margin: 0 }}>No image preview available.</p>
          </div>
        )}
      </div>
    );
  }

  // Audio preview
  if (type === 'audio' && file_data) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{filename}</h3>
        </div>
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
          <audio controls style={{ width: '100%' }}>
            <source src={file_data} />
            Your browser does not support the audio element.
          </audio>
        </div>
        {transcription && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px', maxHeight: '40vh', overflow: 'auto' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Transcription:</h4>
            <p style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
              {transcription}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback for other types or no preview
  return (
    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
      <p>Preview not available for this file type: {type}</p>
      {text_content && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px', textAlign: 'left', maxHeight: '60vh', overflow: 'auto' }}>
          <pre style={{ fontSize: '0.875rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
            {text_content}
          </pre>
        </div>
      )}
    </div>
  );
};

// Component to render report content
const ReportContent = ({ data, generationFormat }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const reportRef = useRef(null);

  if (!data?.report || Object.keys(data.report).length === 0) return null;
  const { heading, paragraphs, table, charts, analysis_charts, forecasting_charts } = data.report;

  // Determine mode
  // If generationFormat is present and NOT "null" string, and NOT null value, then we are in explicit mode
  const fmt = (generationFormat && generationFormat !== 'null') ? generationFormat.toLowerCase() : null;
  const isModePdf = fmt && fmt.includes('pdf');
  const isModeCsv = fmt && (fmt.includes('csv') || fmt.includes('excel'));
  const isModeNormal = !isModePdf && !isModeCsv;
  const isModeExplicit = isModePdf || isModeCsv;

  const generatePDF = async () => {
    console.log(reportRef)

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

  const downloadCSV = () => {
    if (!table || !table.headers || !table.rows) return;
    // Simple CSV generation
    const csvContent = [
      table.headers.join(','),
      ...table.rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${heading || 'report'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        marginBottom: isModeExplicit ? '0' : '1.5rem',
        justifyContent: 'flex-start',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {/* CSV Download Button */}
        {(isModeCsv || isModeNormal) && (
          <button
            onClick={downloadCSV}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: (table && table.headers) ? 'flex' : 'none',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
          >
            📊 Download CSV
          </button>
        )}

        {/* PDF Download Button */}
        {(isModePdf || isModeNormal) && (
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            style={{
              backgroundColor: isModePdf ? '#ef4444' : '#059669',
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
            onMouseEnter={(e) => !isDownloading && (e.target.style.backgroundColor = isModePdf ? '#dc2626' : '#047857')}
            onMouseLeave={(e) => !isDownloading && (e.target.style.backgroundColor = isModePdf ? '#ef4444' : '#059669')}
          >
            {isDownloading ? (
              <>
                <Spinner animation="border" size="sm" />
                Generating PDF...
              </>
            ) : (
              <>
                📄 Download PDF {isModePdf ? 'Report' : ''}
              </>
            )}
          </button>
        )}
      </div>

      {/* Report Content - This is what gets captured for PDF */}
      <div ref={reportRef} style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        {/* Heading */}
        {heading && (
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '2rem',
            textAlign: 'center',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '1rem'
          }}>
            {heading}
          </h1>
        )}

        {/* Paragraphs */}
        {paragraphs && paragraphs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            {paragraphs.map((paragraph, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '1rem',
                  color: '#374151',
                  lineHeight: '1.8'
                }}
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
          </div>
        )}

        {/* Table */}
        {table && table.headers && table.headers.length > 0 && (
          <div style={{ marginBottom: '2rem', overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #e5e7eb'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {table.headers.map((header, idx) => (
                    <th key={idx} style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #e5e7eb',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows && table.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} style={{
                    backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb'
                  }}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#374151'
                      }}>
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Charts */}
        {charts && charts.length > 0 && charts.map((chart, index) => (
          chart.plotly ? renderPlotlyChart(chart, index) : renderChart(chart, index)
        ))}

        {/* Analysis Charts */}
        {analysis_charts && analysis_charts.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Analysis
            </h3>
            {analysis_charts.map((chart, index) => (
              chart.plotly ? renderPlotlyChart(chart, index) : renderChart(chart, index)
            ))}
          </div>
        )}

        {/* Forecasting Charts */}
        {forecasting_charts && forecasting_charts.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Forecasting
            </h3>
            {forecasting_charts.map((chart, index) => (
              chart.plotly ? renderPlotlyChart(chart, index) : renderChart(chart, index)
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
        }} dangerouslySetInnerHTML={{ __html: explanation }}>
          {/* {explanation} */}
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
                      ? (() => {
                        const value = row[col];
                        // Format dates nicely if they're ISO date strings
                        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                          try {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString();
                            }
                          } catch (e) {
                            // Fall through to string conversion
                          }
                        }
                        // Format numbers with commas for readability
                        if (typeof value === 'number') {
                          return value.toLocaleString();
                        }
                        return String(value);
                      })()
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
          }} dangerouslySetInnerHTML={{ __html: explanation }}>
            {/* {explanation} */}
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
    xaxis: {
      gridcolor: '#f3f4f6',
      zerolinecolor: '#e5e7eb',
      tickangle: -45,
      ...(rawLayout?.xaxis || {}),
      // Preserve tickangle from rawLayout if it exists
      tickangle: rawLayout?.xaxis?.tickangle ?? -45
    },
    yaxis: {
      gridcolor: '#f3f4f6',
      zerolinecolor: '#e5e7eb',
      ...(rawLayout?.yaxis || {}),
      // Preserve or override type for categorical data
      type: isCategoricalY ? 'category' : (rawLayout?.yaxis?.type || undefined)
    },
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
        }} dangerouslySetInnerHTML={{ __html: explanation }}>
          {/* {explanation} */}
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

// Component to render Multi-Model Answer
const MultiModelAnswer = ({ data }) => {
  const { answer, confidence, agents_used, sources, reasoning, validation_notes, model_name, report } = data;
  const { Panel } = Collapse;

  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: 12,
      padding: 20,
      border: '1px solid #e5e7eb'
    }}>
      {/* Answer */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 8,
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <FaCheckCircle color="#22c55e" />
          Answer
        </div>
        {!report && <div
          style={{
            background: 'white',
            padding: 16,
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#374151'
          }}
          dangerouslySetInnerHTML={{ __html: answer }}
        />}
      </div>

      {report && (
        <div style={{ marginBottom: 20, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
          {(!data.generation_format || data.generation_format === 'null') && (
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBrain color="#3b82f6" />
              Generated Report
            </div>
          )}
          <ReportContent
            data={{ report, title: report.heading, description: `Report generated on ${new Date().toLocaleDateString()}` }}
            generationFormat={data.generation_format}
          />
        </div>
      )}

      {confidence !== undefined && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            Confidence Score
          </div>
          <Progress
            percent={Math.round(confidence * 100)}
            strokeColor={{
              '0%': '#ef4444',
              '50%': '#f59e0b',
              '100%': '#22c55e'
            }}
          />
        </div>
      )}

      {agents_used && agents_used.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            AI Agents Used
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {agents_used.map((agent, idx) => (
              <Tag key={idx} color="blue">
                {agent}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {/* 
      {sources && sources.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            Sources ({sources.length})
          </div>
          <Collapse accordion>
            {sources.map((source, idx) => (
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tag color={source.file_type === 'tabular' ? 'blue' : source.file_type === 'document' ? 'red' : 'green'}>
                      {source.file_type}
                    </Tag>
                    <span style={{ fontWeight: 600 }}>{source.file_name}</span>
                    {source.relevance && (
                      <Tag color="orange">
                        {Math.round(source.relevance * 100)}% relevant
                      </Tag>
                    )}
                  </div>
                }
                key={idx}
              >
                {source.excerpt && (
                  <div style={{
                    background: '#f3f4f6',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    color: '#374151'
                  }}>
                    {source.excerpt}
                  </div>
                )}
              </Panel>
            ))}
          </Collapse>
        </div>
      )}

      {reasoning && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            Reasoning Process
          </div>
          <div style={{
            background: 'white',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            {reasoning}
          </div>
        </div>
      )}

      {validation_notes && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
            Validation Notes
          </div>
          <div style={{
            background: 'white',
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            color: '#6b7280',
            borderLeft: '3px solid #3b82f6'
          }}>
            {validation_notes}
          </div>
        </div>
      )}

      {model_name && (
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <Tag color="purple">
            Model: {model_name}
          </Tag>
        </div>
      )} */}
    </div>
  );
};

// Component to render Multi-Model Files List with Preview
const MultiModelFilesList = ({ files, sessionId, userEmail }) => {
  const { Panel } = Collapse;
  const [fileData, setFileData] = useState({});
  const [loadingFiles, setLoadingFiles] = useState({});
  const [activeKeys, setActiveKeys] = useState([]); // No panels open by default

  // Fetch file preview when panel is opened
  const handlePanelChange = React.useCallback(async (keys) => {
    setActiveKeys(keys);

    // Find newly opened panels
    const newKeys = keys.filter(key => !activeKeys.includes(key));

    for (const key of newKeys) {
      const idx = parseInt(key);
      if (!files || !files[idx]) continue;

      const file = files[idx];

      // Skip if already loaded
      if (fileData[file.file_name]) continue;

      // Set loading state
      setLoadingFiles(prev => ({ ...prev, [file.file_name]: true }));

      try {
        const response = await axios.get(`${akkiourl}/multi-model/file-preview`, {
          params: {
            session_id: sessionId,
            file_name: file.file_name,
            user_email: userEmail
          }
        });

        setFileData(prev => ({ ...prev, [file.file_name]: response.data }));
      } catch (error) {
        console.error(`Error loading preview for ${file.file_name}:`, error);
        setFileData(prev => ({
          ...prev,
          [file.file_name]: { error: 'Failed to load preview' }
        }));
      } finally {
        setLoadingFiles(prev => ({ ...prev, [file.file_name]: false }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userEmail, files]);

  if (!files || files.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        No files associated with this model.
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
      <Collapse
        ghost
        onChange={handlePanelChange}
        activeKey={activeKeys}
      >
        {files.map((file, idx) => (
          <Panel
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  fontSize: '1.25rem',
                  lineHeight: 1
                }}>
                  {file.file_type === 'tabular' ? '📊' : file.file_type === 'document' ? '📄' : '🖼️'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  {file.file_name}
                </div>
              </div>
            }
            key={String(idx)}
          >
            <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Tag>{file.file_type}</Tag>
                {file.processed && <Tag color="green">Processed</Tag>}
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Added: {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* File Preview */}
              {loadingFiles[file.file_name] ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <Spinner animation="border" size="sm" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Loading preview...</p>
                </div>
              ) : fileData[file.file_name] ? (
                <FilePreview fileData={fileData[file.file_name]} filename={file.file_name} />
              ) : (
                <div style={{ padding: '0.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                  Click to expand and view preview
                </div>
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

// Component to render message content
const MessageContent = ({ content }) => {
  try {
    const parsedContent = JSON.parse(content);

    // Check if it's a multi-model answer (new format with metadata separated)
    if (parsedContent.multi_model_metadata) {
      // Merge answer with metadata for MultiModelAnswer component
      const multiModelData = {
        answer: parsedContent.answer,
        ...parsedContent.multi_model_metadata
      };
      return <MultiModelAnswer data={multiModelData} />;
    }

    // Check if it's a multi-model answer (old format - backward compatibility)
    if (parsedContent.multi_model_answer || (parsedContent.answer && parsedContent.sources && parsedContent.agents_used)) {
      return <MultiModelAnswer data={parsedContent} />;
    }

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
      const { type, payload, explanation } = parsedContent;
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
  const [searchParams] = useSearchParams();
  const isSapMode = (searchParams.get('mode') || '').toLowerCase() === 'sap';
  const sapType = (searchParams.get('sapType') || localStorage.getItem('sapType') || 's4').toLowerCase();
  const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
  const fileType = typeof window !== 'undefined' ? (localStorage.getItem('file_type') || '') : '';
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const email = JSON.parse(localStorage.getItem('user'))?.email;
  const [fileData, setFileData] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(!isSapMode);
  const [multiModelFiles, setMultiModelFiles] = useState([]);
  const [loadingMultiFiles, setLoadingMultiFiles] = useState(false);
  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const submissionLock = useRef(false);

  useEffect(() => {
    if (isSapMode) {
      setShowFilePreview(false);
      const sapLabel = sapType === 'btp' ? 'SAP BTP' : sapType === 'batch' ? 'SAP Batch' : 'SAP S/4HANA';
      setMessages([{
        type: 'bot',
        content: `{"answer":"Welcome to ${sapLabel} Bot. Ask a question about the data."}`,
        streaming: false
      }]);
    } else {
      setShowFilePreview(true);
    }
  }, [isSapMode, sapType]);

  const handleVoiceInput = () => {
    if (isListening) {
      if (window.recognition) {
        window.recognition.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    window.recognition = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => (prev ? prev + ' ' + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && message.trim()) {
        handleSubmit(e);
      }
    }
  };

  // Function to fetch data summary on page load
  const fetchDataSummary = React.useCallback(async () => {
    if (!filename || !email || loadingSummary) return;

    // Check localStorage for cached summary
    const cacheKey = `data_summary_${email}_${filename}`;
    const cachedSummary = localStorage.getItem(cacheKey);

    if (cachedSummary) {
      // Use cached summary
      try {
        const parsedCache = JSON.parse(cachedSummary);
        setMessages([{
          type: 'bot',
          content: parsedCache.content,
          streaming: false
        }]);
        return;
      } catch (error) {
        console.error('Error parsing cached summary:', error);
        // Continue to fetch fresh summary if cache is invalid
      }
    }

    setLoadingSummary(true);

    // Add a loading message
    setMessages([{
      type: 'bot',
      content: '',
      streaming: true,
      responseType: 'text'
    }]);

    // Use WebSocket for summary
    const wsUrl = akkiourl.replace('http://', 'ws://').replace('https://', 'wss://') + '/Explore/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send query for data summary
      ws.send(JSON.stringify({
        query: 'Please provide a brief summary and overview of this dataset.',
        filename: filename,
        session_id: sessionId,
        email: email,
        file_type: fileType
      }));
    };

    let accumulatedContent = '';
    let currentResponseType = null;
    let currentPayload = null;
    let currentExplanation = '';

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const messageType = data.type;

        if (messageType === 'session_id') {
          if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
          }
        } else if (messageType === 'response_type') {
          currentResponseType = data.type;
          setMessages([{
            type: 'bot',
            content: accumulatedContent,
            streaming: true,
            responseType: currentResponseType
          }]);
        } else if (messageType === 'text' && data.type) {
          currentResponseType = data.type;
          setMessages([{
            type: 'bot',
            content: accumulatedContent,
            streaming: true,
            responseType: currentResponseType
          }]);
        } else if (messageType === 'text_chunk') {
          accumulatedContent += data.chunk || '';
          setMessages([{
            type: 'bot',
            content: accumulatedContent,
            streaming: true,
            responseType: currentResponseType || 'text',
            payload: accumulatedContent
          }]);
        } else if (messageType === 'explanation_chunk') {
          currentExplanation += data.chunk || '';
          setMessages([{
            type: 'bot',
            content: accumulatedContent,
            streaming: true,
            responseType: currentResponseType || 'text',
            explanation: currentExplanation
          }]);
        } else if (messageType === 'complete') {
          if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
          }

          // Finalize the summary message
          let finalContent = '';
          if (currentResponseType === 'text' || !currentResponseType) {
            finalContent = accumulatedContent;
          }

          const finalMessage = finalContent || accumulatedContent || '{"answer": "Data loaded successfully. How can I help you analyze it?"}';

          setMessages([{
            type: 'bot',
            content: finalMessage,
            streaming: false
          }]);

          // Cache the summary in localStorage
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              content: finalMessage,
              timestamp: new Date().toISOString(),
              filename: filename
            }));
          } catch (error) {
            console.error('Error caching summary:', error);
          }

          // Dispatch usage update event
          window.dispatchEvent(new Event('usage_updated'));

          ws.close();
          setLoadingSummary(false);
        } else if (messageType === 'error') {
          setMessages([{
            type: 'bot',
            content: '{"answer": "Hello! Your data has been loaded. How can I assist you today?"}',
            streaming: false
          }]);
          ws.close();
          setLoadingSummary(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages([{
        type: 'bot',
        content: '{"answer": "Hello! Your data has been loaded. How can I assist you today?"}',
        streaming: false
      }]);
      setLoadingSummary(false);
    };

    ws.onclose = () => {
      setLoadingSummary(false);
    };
  }, [filename, email, fileType, sessionId, loadingSummary]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submissionLock.current || isLoading || loadingSummary) return;
    if (!message.trim()) return;

    submissionLock.current = true; // LOCK

    const userMessage = message;
    setMessage('');

    // Add user message and placeholder bot message for streaming
    setMessages(prev => {
      return [...prev, {
        type: 'user',
        content: userMessage,
        question: true,
        isLoading: false
      }, {
        type: 'bot',
        content: '',
        streaming: true,
        responseType: null,
        payload: null,
        explanation: ''
      }];
    });

    setIsLoading(true);

    // SAP mode uses dedicated SAP endpoint and bypasses normal explore/file routes.
    if (isSapMode) {
      try {
        let responseData;
        if (sapType === 's4') {
          // S4: use existing backend API
          const response = await axios.post(`${akkiourl}/sap/query`, {
            input: userMessage,
            email: email
          });
          responseData = response.data;
        } else {
          // BTP or Batch: use backend API that fetches data + LLM query
          const response = await axios.post(`${akkiourl}/sap/query-external`, {
            input: userMessage,
            mode: sapType,
            email: email
          });
          responseData = response.data;
        }

        const botResponse = {
          type: 'bot',
          content: '',
          sapResponse: responseData,
          streaming: false
        };

        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? botResponse : msg
        ));
      } catch (error) {
        console.error('SAP query error:', error);
        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? {
            type: 'bot',
            content: '{"answer": "Sorry, there was an error processing your SAP request."}',
            streaming: false
          } : msg
        ));
      } finally {
        setIsLoading(false);
        submissionLock.current = false;
      }
      return;
    }

    // Simple routing: if selected type is image -> use image chat API (keep HTTP for now)
    const selectedType = (localStorage.getItem('selectedFileType') || localStorage.getItem('file_type') || '').toLowerCase();
    const isImage = selectedType.includes('image');

    // For image classification, keep using HTTP POST (can be migrated later)
    if (isImage) {
      try {
        const img = (() => {
          try { return JSON.parse(localStorage.getItem('image_classification_data') || 'null'); }
          catch { return null; }
        })();

        const fname = img?.filename || filename;
        const modelName = img?.modelName || img?.model_name || localStorage.getItem('model_name');
        const userEmail = (img?.userEmail || email) || 'admin@gmail.com';

        const formData = new FormData();
        formData.append('query', userMessage);
        if (fname) formData.append('filename', fname);
        if (modelName) formData.append('model_name', modelName);
        if (userEmail) formData.append('user_email', userEmail);

        const response = await axios.post(`${akkiourl}/image/chat`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const botResponse = {
          type: 'bot',
          content: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data,
          streaming: false
        };

        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? botResponse : msg
        ));
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? {
            type: 'bot',
            content: '{"answer": "Sorry, there was an error processing your request."}',
            streaming: false
          } : msg
        ));
      } finally {
        setIsLoading(false);
        submissionLock.current = false;
      }
      return;
    }

    // For URL type, keep using HTTP POST (can be migrated later)
    if (fileType === 'url') {
      try {
        const formData = new FormData();
        formData.append('query', userMessage);
        formData.append('filename', filename);
        formData.append('email', email);
        formData.append('file_type', 'url');
        if (sessionId) {
          formData.append('session_id', sessionId);
        }

        const response = await axios.post(`${akkiourl}/vector_chat`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        let newSessionId = sessionId;
        if (response.data && typeof response.data === 'object' && response.data.session_id) {
          newSessionId = response.data.session_id;
          if (newSessionId !== sessionId) {
            setSessionId(newSessionId);
          }
        }

        const botResponse = {
          type: 'bot',
          content: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data,
          streaming: false
        };

        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? botResponse : msg
        ));
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => prev.map((msg, idx) =>
          idx === (prev.length - 1) ? {
            type: 'bot',
            content: '{"answer": "Sorry, there was an error processing your request."}',
            streaming: false
          } : msg
        ));
      } finally {
        setIsLoading(false);
        submissionLock.current = false;
      }
      return;
    }

    // Use WebSocket for Explore API
    const wsUrl = akkiourl.replace('http://', 'ws://').replace('https://', 'wss://') + '/Explore/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send query data
      ws.send(JSON.stringify({
        query: userMessage,
        filename: filename,
        session_id: sessionId,
        email: email,
        file_type: fileType
      }));
    };

    let accumulatedContent = '';
    let currentResponseType = null;
    let currentPayload = null;
    let currentExplanation = '';

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const messageType = data.type;

        if (messageType === 'session_id') {
          if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
          }
        } else if (messageType === 'response_type') {
          currentResponseType = data.type;
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                responseType: currentResponseType
              } : msg
            );
          });
        } else if (messageType === 'text' && data.type) {
          // Handle legacy format where backend sends {"type":"text"} directly
          // This should be treated as a response_type message
          currentResponseType = data.type;
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                responseType: currentResponseType
              } : msg
            );
          });
        } else if (messageType === 'text_chunk') {
          accumulatedContent += data.chunk || '';
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                content: accumulatedContent,
                payload: accumulatedContent
              } : msg
            );
          });
        } else if (messageType === 'explanation_chunk') {
          currentExplanation += data.chunk || '';
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                explanation: currentExplanation
              } : msg
            );
          });
        } else if (messageType === 'plotly_data') {
          currentPayload = data.figure;
          currentResponseType = 'plotly'; // Update response type when plotly data arrives
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                responseType: 'plotly',
                payload: currentPayload
              } : msg
            );
          });
        } else if (messageType === 'table_data') {
          currentPayload = data.rows;
          currentResponseType = 'table'; // Update response type when table data arrives
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                responseType: 'table',
                payload: currentPayload
              } : msg
            );
          });
        } else if (messageType === 'report_data') {
          currentPayload = {
            report: data.report,
            title: data.title,
            description: data.description
          };
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                ...msg,
                responseType: 'report',
                payload: currentPayload,
                content: JSON.stringify({ report: data.report })
              } : msg
            );
          });
        } else if (messageType === 'complete') {
          if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
          }

          // Finalize the message
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) => {
              if (idx === botIdx) {
                // Format final content based on response type
                let finalContent = '';
                if (currentResponseType === 'text' || !currentResponseType) {
                  finalContent = accumulatedContent;
                } else if (currentResponseType === 'plotly') {
                  finalContent = JSON.stringify({ type: 'plotly', payload: currentPayload, explanation: currentExplanation });
                } else if (currentResponseType === 'table') {
                  finalContent = JSON.stringify({ type: 'table', payload: currentPayload, explanation: currentExplanation });
                } else if (currentResponseType === 'report') {
                  finalContent = JSON.stringify({ report: currentPayload?.report || {}, title: currentPayload?.title, description: currentPayload?.description });
                }

                return {
                  ...msg,
                  streaming: false,
                  content: finalContent || msg.content
                };
              }
              return msg;
            });
          });

          // Dispatch usage update event
          window.dispatchEvent(new Event('usage_updated'));

          ws.close();
          setIsLoading(false);
          submissionLock.current = false;
        } else if (messageType === 'error') {
          setMessages(prev => {
            const botIdx = prev.length - 1;
            return prev.map((msg, idx) =>
              idx === botIdx ? {
                type: 'bot',
                content: JSON.stringify({ answer: data.message || 'An error occurred' }),
                streaming: false
              } : msg
            );
          });
          ws.close();
          setIsLoading(false);
          submissionLock.current = false;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => {
        const botIdx = prev.length - 1;
        return prev.map((msg, idx) =>
          idx === botIdx ? {
            type: 'bot',
            content: JSON.stringify({ answer: 'Connection error. Please try again.' }),
            streaming: false
          } : msg
        );
      });
      setIsLoading(false);
      submissionLock.current = false;
    };

    ws.onclose = () => {
      setIsLoading(false);
      submissionLock.current = false;
    };
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch file data when component loads
  useEffect(() => {
    const fetchFileData = async () => {
      if (!filename || !email) {
        return;
      }

      // Don't call /get_file for multi-model - we handle file previews separately
      const selectedType = localStorage.getItem('selectedFileType');
      if (selectedType === 'multi-model') {
        return;
      }

      setLoadingFile(true);
      setFileError(null);
      try {
        const response = await axios.get(`${akkiourl}/get_file`, {
          params: {
            email: email,
            filename: filename
          }
        });
        setFileData(response.data);
      } catch (error) {
        console.error('Error fetching file data:', error);
        setFileError(error.response?.data?.detail || 'Failed to load file preview');
      } finally {
        setLoadingFile(false);
      }
    };

    fetchFileData();
  }, [filename, email]);

  // Fetch Multi-Model Files
  useEffect(() => {
    const fetchMultiModelFiles = async () => {
      const selectedType = localStorage.getItem('selectedFileType');
      const mSessionId = localStorage.getItem('multiModelSessionId');

      if (selectedType === 'multi-model' && mSessionId) {
        setLoadingMultiFiles(true);
        try {
          const response = await axios.get(`${akkiourl}/multi-model/files`, {
            params: {
              session_id: mSessionId,
              user_email: email
            }
          });
          if (response.data.status === 'success') {
            setMultiModelFiles(response.data.files || []);
          }
        } catch (error) {
          console.error('Error fetching multi-model files:', error);
        } finally {
          setLoadingMultiFiles(false);
        }
      } else {
        setMultiModelFiles([]);
      }
    };

    fetchMultiModelFiles();
  }, [sessionId, email]);

  // Fetch data summary on page load - runs in parallel with file loading
  useEffect(() => {
    if (isSapMode) return;
    if (!filename || !email) return;

    // Track the last filename we fetched summary for
    const lastSummaryFilename = sessionStorage.getItem('last_summary_filename');

    // Only fetch if filename has changed or we haven't fetched yet
    if (lastSummaryFilename !== filename) {
      // Update tracking
      sessionStorage.setItem('last_summary_filename', filename);

      // Fetch summary (will use cache if available)
      fetchDataSummary();
    } else {
      // Same file - try to load from cache
      const cacheKey = `data_summary_${email}_${filename}`;
      const cachedSummary = localStorage.getItem(cacheKey);

      if (cachedSummary) {
        try {
          const parsedCache = JSON.parse(cachedSummary);
          setMessages([{
            type: 'bot',
            content: parsedCache.content,
            streaming: false
          }]);
        } catch (error) {
          console.error('Error loading cached summary:', error);
          // Fetch fresh if cache is invalid
          fetchDataSummary();
        }
      } else {
        // No cache available, fetch fresh
        fetchDataSummary();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename, email, isSapMode]);

  return (
    (!filename && !isSapMode) ? <EmptyState /> : <div style={{ display: 'flex', height: '100vh', gap: '1rem', position: 'relative' }}>
      {showPremiumOverlay && <PremiumOverlay />}
      {/* Main Chat Container - Keep original structure unchanged */}
      <div className="chat-container" style={{ flex: 1, minWidth: 0 }}>
        <div className="chat-window">
          <div className="chat-messages">
            {messages.length === 0 && loadingSummary && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "2rem"
              }}>
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading summary...</span>
                </Spinner>
                <span style={{ marginLeft: "1rem", color: "#6b7280" }}>Loading data summary...</span>
              </div>
            )}
            {messages.map((msg, index) => {
              console.log(msg, 'sdfd')
              return (
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
                      {(msg?.content || msg?.streaming || msg?.sapResponse) && (
                        <div style={{ width: '100%', overflow: 'auto' }}>
                          {msg.type === 'bot' ? (
                            msg.streaming ? (
                              // Handle streaming messages
                              (() => {
                                if (msg.responseType === 'plotly' && msg.payload) {
                                  // Ensure plotly figure has proper structure
                                  const figure = msg.payload && typeof msg.payload === 'object'
                                    ? (msg.payload.figure || msg.payload)
                                    : null;
                                  if (figure && (figure.data || figure.layout)) {
                                    return <AnswerPlotly figure={figure} explanation={msg.explanation} />;
                                  }
                                  return <div>Loading chart...</div>;
                                } else if (msg.responseType === 'table' && msg.payload) {
                                  // Ensure table payload is an array
                                  const rows = Array.isArray(msg.payload) ? msg.payload : [];
                                  if (rows.length > 0) {
                                    return <AnswerTable rows={rows} explanation={msg.explanation} />;
                                  }
                                  return <div>Loading table...</div>;
                                } else if (msg.responseType === 'report' && msg.payload) {
                                  return <ReportContent data={{ report: msg.payload.report, title: msg.payload.title, description: msg.payload.description }} />;
                                } else if (msg.content) {
                                  // Streaming text - display as HTML
                                  return <div dangerouslySetInnerHTML={{ __html: msg.content }} />;
                                } else {
                                  return <div>Thinking...</div>;
                                }
                              })()
                            ) : msg.sapResponse ? (
                              msg.sapResponse.answer != null ? (
                                <div style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  background: '#f9fafb',
                                  fontSize: '14px',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {msg.sapResponse.answer}
                                </div>
                              ) : (
                                <pre style={{
                                  margin: 0,
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  background: '#f9fafb',
                                  fontSize: '12px',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {JSON.stringify(msg.sapResponse, null, 2)}
                                </pre>
                              )
                            ) : (
                              <MessageContent content={msg.content || '{"answer": ""}'} />
                            )
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

          <form onSubmit={handleSubmit} className="chat-input-form" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', padding: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
            <div className="input-container3" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder={loadingSummary ? "Loading data summary..." : (isListening ? "Listening..." : "Ask something...")}
                rows={1}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  maxHeight: '200px',
                  padding: '12px 40px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  overflowY: 'auto',
                  outline: 'none',
                  lineHeight: '1.5',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
                disabled={loadingSummary || isLoading}
              />
              <div
                onClick={handleVoiceInput}
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '12px',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? '#fee2e2' : 'transparent',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                title="Voice Input"
              >
                <FaMicrophone size={16} />
              </div>
            </div>
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || loadingSummary || !message.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: (isLoading || loadingSummary || !message.trim()) ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (isLoading || loadingSummary || !message.trim()) ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                transition: 'background-color 0.2s',
                height: '44px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !loadingSummary && message.trim()) {
                  e.target.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && !loadingSummary && message.trim()) {
                  e.target.style.backgroundColor = '#2563eb';
                }
              }}
            >
              {(isLoading || loadingSummary) ? (
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

      {/* File Preview Panel - Right Side */}
      {!isSapMode && showFilePreview && (
        <div style={{
          width: '400px',
          minWidth: '300px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              margin: 0,
              color: '#1f2937'
            }}>
              {(loadingMultiFiles || multiModelFiles.length > 0)
                ? 'Model Data Sources'
                : 'File Preview'}
            </h2>
            <button
              onClick={() => setShowFilePreview(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#6b7280',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}
              title="Hide preview"
            >
              ×
            </button>
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#ffffff'
          }}>
            {/* Multi-Model Files List Logic */}
            {(loadingMultiFiles || multiModelFiles.length > 0) ? (
              loadingMultiFiles ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading sources...</span>
                  </Spinner>
                </div>
              ) : (
                <MultiModelFilesList
                  files={multiModelFiles}
                  sessionId={localStorage.getItem('multiModelSessionId')}
                  userEmail={email}
                />
              )
            ) : (
              /* Existing File Preview Logic */
              loadingFile ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading file...</span>
                  </Spinner>
                  <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Loading file preview...
                  </p>
                </div>
              ) : fileError ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626' }}>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>{fileError}</p>
                </div>
              ) : (
                <FilePreview fileData={fileData} filename={filename} />
              )
            )}
          </div>
        </div>
      )}

      {/* Show preview button when hidden */}
      {!isSapMode && !showFilePreview && (
        <button
          onClick={() => setShowFilePreview(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            fontSize: '1.25rem',
            zIndex: 1000
          }}
          title="Show file preview"
        >
          📄
        </button>
      )}
    </div>
  );
};

export default Reports;