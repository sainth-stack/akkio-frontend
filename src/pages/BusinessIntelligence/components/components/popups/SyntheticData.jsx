import { useState } from "react";
import { Modal, Input, Select, message, Typography, Card, Checkbox, Button, Tabs, Upload } from "antd";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { akkiourl } from "../../../../../utils/const";
import SampleDataTable from "../../../../genAi/components/sampleData";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const { Text } = Typography;
const { Dragger } = Upload;

const GENERATE_EXAMPLE_PROMPTS = [
  "Generate a table with 25 rows of sales data with columns: Order ID, Product Name, Quantity, Unit Price, Total Amount, Customer Name, Order Date",
  "Create 50 rows of employee data with columns: Employee ID, Name, Department, Salary, Join Date, Email",
  "Generate 100 rows of inventory data with columns: Item ID, Item Name, Category, Stock, Price, Supplier"
];

const EXTEND_EXAMPLE_PROMPTS = {
  excel: [
    "Extend 1000 rows for the given dataset",
    "Add more realistic data following the same pattern",
    "Generate additional columns with related data"
  ],
  csv: [
    "Extend 500 rows for the given dataset",
    "Add more realistic data following the same pattern",
    "Generate additional columns with related data"
  ]
};

function parseDataframeString(dfStr) {
  // This is a parser for pandas dataframe string representation
  try {
    // First, identify the header row and data rows
    const lines = dfStr.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return null;
    
    // Check if this is a pandas DataFrame string representation
    // Look for patterns like index headers or DataFrame summary lines
    const isPandasDF = lines.some(line => 
      line.includes('dtype:') || 
      line.includes('Name:') || 
      line.includes('Length:') ||
      line.match(/^\s*\d+\s+\S/) ||
      line.includes('[') && line.includes('rows') && line.includes('columns')
    );
    
    if (!isPandasDF) {
      console.error("Not a pandas DataFrame string representation");
      return null;
    }
    
    // Find the header line - it's usually the first line that doesn't contain summary info
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && 
           (lines[headerLineIndex].includes('[') || 
            lines[headerLineIndex].includes('dtype:') || 
            lines[headerLineIndex].trim() === '')) {
      headerLineIndex++;
    }
    
    if (headerLineIndex >= lines.length) {
      console.error("Could not find header line");
      return null;
    }
    
    const headerLine = lines[headerLineIndex].trim();
    
    // Parse header - handle multi-word column names with spaces
    // This regex matches words or word groups separated by 2+ spaces
    const headerMatches = headerLine.match(/([\w\s\-\.\(\)\[\]\+\/%]+?)(?=\s{2,}|$)/g) || [];
    const headerParts = headerMatches.map(part => part.trim()).filter(part => part !== '');
    
    if (headerParts.length === 0) {
      console.error("Could not parse header parts");
      return null;
    }
    
    // Create a structured object for the data
    const result = {};
    headerParts.forEach(header => {
      result[header] = [];
    });
    
    // Check if the format includes row indices
    const hasIndices = lines.slice(headerLineIndex + 1).some(line => /^\s*\d+\s/.test(line.trim()));
    
    // Process data rows
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and summary lines (usually at the end of DataFrame output)
      if (!line || 
          line.includes('dtype:') || 
          line.includes('Name:') || 
          line.includes('Length:') ||
          (line.includes('[') && line.includes('rows') && line.includes('columns'))) {
        continue;
      }
      
      // Handle row with index
      let rowData = line;
      let rowIndex = null;
      
      if (hasIndices) {
        // Extract the index and the rest of the data
        const indexMatch = line.match(/^\s*(\d+)\s+(.*)$/);
        if (indexMatch) {
          rowIndex = indexMatch[1];
          rowData = indexMatch[2];
        }
      }
      
      // Split the row data by position to match headers
      let columnValues = [];
      let currentPos = 0;
      
      // For each header, try to extract a corresponding value
      for (let j = 0; j < headerParts.length; j++) {
        // Skip the first column if it's just the row index and we already extracted it
        if (j === 0 && hasIndices && rowIndex !== null) {
          columnValues.push(rowIndex);
          continue;
        }
        
        // Find the next value
        let nextValue;
        
        // If this is the last column, take the rest of the line
        if (j === headerParts.length - 1) {
          nextValue = rowData.substring(currentPos).trim();
        } else {
          // Try to find where the next column starts (usually after 2+ spaces)
          const nextColumnMatch = rowData.substring(currentPos).match(/([^\s].*?)(?=\s{2,}|$)/);
          if (nextColumnMatch) {
            nextValue = nextColumnMatch[0].trim();
            currentPos += nextColumnMatch[0].length + (nextColumnMatch.index || 0);
          } else {
            nextValue = '';
          }
        }
        
        columnValues.push(nextValue);
      }
      
      // Add values to the result object
      headerParts.forEach((header, idx) => {
        if (idx < columnValues.length) {
          result[header].push(columnValues[idx]);
        } else {
          result[header].push(''); // Add empty string for missing values
        }
      });
    }
    
    // Check if we actually parsed any data
    const hasData = Object.values(result).some(arr => arr.length > 0);
    if (!hasData) {
      console.error("No data rows were parsed");
      return null;
    }
    
    return result;
  } catch (e) {
    console.error("Error parsing dataframe string:", e);
    return null;
  }
}

const SyntheticData = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("excel");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [imageData, setImageData] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setImageData([]);
    setSelectedImages([]);
    const formData = new FormData();
    
    if (activeTab === "generate") {
      formData.append("prompt", prompt);
      formData.append("data_type", type);
    } else {
      // For extend tab, append files
      if (uploadedFiles.length === 0) {
        message.error("Please upload at least one file to extend");
        setLoading(false);
        return;
      }
      
      uploadedFiles.forEach(file => {
        formData.append("files", file.originFileObj || file);
      });
      formData.append("user_prompt", prompt);
    }

    try {
      const endpoint = activeTab === "generate" ? "/data_scout" : "/generate_synthetic_data";
      
      if (activeTab === "generate" && type === "image") {
        const response = await axios.post(
          `${akkiourl}${endpoint}`,
          formData
        );
        
        if (response.data && response.data.images) {
          const images = response.data.images.map((img, idx) => ({ 
            id: idx, 
            path: img.path, 
            base64: img.base64 
          }));
          setImageData(images);
          message.success("Images generated successfully! Select images to download.");
        } else {
          message.error("No images returned. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Handle PDF generation for generate tab
      if (activeTab === "generate" && type === "pdf") {
        try {
          const jsonResponse = await axios.post(
            `${akkiourl}${endpoint}`,
            formData
          );
          
          if (jsonResponse.data && (jsonResponse.data.title || jsonResponse.data.sections)) {
            const pdf = generatePDFFromJSON(jsonResponse.data);
            pdf.save(`synthetic_document_${Date.now()}.pdf`);
            message.success("PDF generated and downloaded successfully!");
            setLoading(false);
            return;
          }
        } catch (jsonError) {
          console.log("JSON response failed, trying blob response...");
        }
        
        try {
          const blobResponse = await axios.post(
            `${akkiourl}${endpoint}`,
            formData,
            {
              responseType: 'blob'
            }
          );
          
          const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `synthetic_data.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          message.success("PDF downloaded successfully!");
          setLoading(false);
          return;
        } catch (blobError) {
          throw blobError;
        }
      }

      if (activeTab === "generate" && type === "excel") {
        try {
          const response = await axios.post(
            `${akkiourl}${endpoint}`,
            formData
          );
          
          // Handle the new response format with data, shape, and columns
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            try {
              // Convert the array of objects to the format expected by convertJSONToExcel
              const jsonData = {};
              
              // Initialize columns from the first object or from columns array if provided
              const columns = response.data.columns || Object.keys(response.data.data[0] || {});
              
              // Initialize arrays for each column
              columns.forEach(column => {
                jsonData[column] = [];
              });
              
              // Populate data for each column
              response.data.data.forEach(row => {
                columns.forEach(column => {
                  jsonData[column].push(row[column] || '');
                });
              });
              
              const workbook = convertJSONToExcel(jsonData);
              const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
              const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `synthetic_data_${Date.now()}.xlsx`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
              message.success("Excel file generated and downloaded successfully!");
              setLoading(false);
              return;
            } catch (parseError) {
              console.error("Error processing data array:", parseError);
            }
          }
          
          // Handle the legacy response format: "('data_output.xlsx', dataframe)"
          if (response.data && response.data.message) {
            // Check if the message is a string that contains the filename and data
            if (typeof response.data.message === 'string') {
              // Try to parse the string to extract filename and data
              try {
                const match = response.data.message.match(/^\((.*?),\s*(.*)\)$/);
                if (match) {
                  const fileName = match[1].replace(/'/g, '');
                  const dataStr = match[2];
                  
                  // If the data is already a JSON object in string form
                  let data;
                  try {
                    data = JSON.parse(dataStr);
                  } catch (e) {
                    // If not JSON, try to handle as pandas dataframe string representation
                    data = parseDataframeString(dataStr);
                  }
                  
                  if (data) {
                    const workbook = convertJSONToExcel(data);
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', fileName || `synthetic_data_${Date.now()}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    message.success("Excel file generated and downloaded successfully!");
                    setLoading(false);
                    return;
                  }
                }
              } catch (parseError) {
                console.error("Error parsing response message:", parseError);
              }
            }
          }
          
          // Fallback to blob response handling
          try {
            const blobResponse = await axios.post(
              `${akkiourl}${endpoint}`,
              formData,
              {
                responseType: 'blob'
              }
            );
            
            const contentDisposition = blobResponse.headers['content-disposition'];
            let fileName = `synthetic_data_${Date.now()}.xlsx`;
            
            if (contentDisposition && contentDisposition.includes('filename=')) {
              fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }
            
            const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success("Excel file generated and downloaded successfully!");
            setLoading(false);
            return;
          } catch (blobError) {
            throw blobError;
          }
        } catch (error) {
          throw error;
        }
      }

      // Handle extend tab response
      if (activeTab === "extend") {
        const response = await axios.post(
          `${akkiourl}${endpoint}`,
          formData
        );

        // Check if response contains images
        if (response.data && response.data.images) {
          const images = response.data.images.map((img, idx) => ({ 
            id: idx, 
            path: img.path, 
            base64: img.base64 
          }));
          setImageData(images);
          message.success("Images generated successfully! Select images to download.");
          setLoading(false);
          return;
        }

        // Check if response contains structured document data for PDF
        if (response.data && response.data.structured_document && 
            (response.data.content_type === 'pdf' || 
             (uploadedFiles[0] && uploadedFiles[0].name.toLowerCase().endsWith('.pdf')))) {
          try {
            const pdf = generatePDFFromJSON(response.data.structured_document);
            pdf.save(`extended_document_${Date.now()}.pdf`);
            message.success("PDF extended and downloaded successfully!");
            setLoading(false);
            return;
          } catch (pdfError) {
            console.error("Error generating PDF from structured data:", pdfError);
            // Fall through to blob handling
          }
        }
        
        // Handle file downloads for extend tab as blob
        try {
          const blobResponse = await axios.post(
            `${akkiourl}${endpoint}`,
            formData,
            {
              responseType: 'blob'
            }
          );
          
          const contentDisposition = blobResponse.headers['content-disposition'];
          let fileName = 'extended_file';
          
          if (contentDisposition && contentDisposition.includes('filename=')) {
            fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
          } else {
            // Determine file extension based on uploaded file type
            const uploadedFile = uploadedFiles[0];
            if (uploadedFile) {
              const originalName = uploadedFile.name.toLowerCase();
              if (originalName.endsWith('.pdf')) {
                fileName = 'extended_document.pdf';
              } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
                fileName = 'extended_data.xlsx';
              } else if (originalName.endsWith('.csv')) {
                fileName = 'extended_data.csv';
              }
            }
          }

          const blob = new Blob([blobResponse.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          message.success("File extended and downloaded successfully!");
        } catch (blobError) {
          console.error("Error downloading extended file:", blobError);
          message.error("Failed to download extended file. Please try again.");
        }
      }

      message.success("Data generated successfully!");
    } catch (error) {
      console.error("Error generating data:", error);
      message.error("Failed to generate data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
  };

  const handleImageSelection = (imageId, checked) => {
    if (checked) {
      setSelectedImages(prev => [...prev, imageId]);
    } else {
      setSelectedImages(prev => prev.filter(id => id !== imageId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedImages(imageData.map(img => img.id));
    } else {
      setSelectedImages([]);
    }
  };

  const generateSafeFileName = (baseName, index, extension = 'png') => {
    const sanitized = baseName.replace(/[<>:"/\\|?*]/g, '_');
    const timestamp = Date.now();
    return `${sanitized}_${index}_${timestamp}.${extension}`;
  };

  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) {
      message.error("Please select at least one image to download");
      return;
    }

    const selectedImageData = imageData.filter(img => selectedImages.includes(img.id));

    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await window.showDirectoryPicker();
        let successCount = 0;
        
        for (let i = 0; i < selectedImageData.length; i++) {
          const img = selectedImageData[i];
          try {
            const fileName = generateSafeFileName('synthetic_image', img.id + 1);
            
            let finalFileName = fileName;
            let counter = 1;
            
            while (true) {
              try {
                await directoryHandle.getFileHandle(finalFileName);
                const nameParts = fileName.split('.');
                const extension = nameParts.pop();
                const baseName = nameParts.join('.');
                finalFileName = `${baseName}_${counter}.${extension}`;
                counter++;
              } catch (error) {
                break;
              }
            }
            
            const fileHandle = await directoryHandle.getFileHandle(finalFileName, {
              create: true
            });
            
            const writable = await fileHandle.createWritable();
            
            const response = await fetch(`data:image/png;base64,${img.base64}`);
            if (!response.ok) {
              throw new Error('Failed to process image data');
            }
            const blob = await response.blob();
            
            await writable.write(blob);
            await writable.close();
            successCount++;
            
          } catch (fileError) {
            console.error(`Error saving image ${img.id + 1}:`, fileError);
          }
        }
        
        if (successCount === selectedImageData.length) {
          message.success(`All ${successCount} image(s) saved successfully to the selected directory!`);
        } else if (successCount > 0) {
          message.success(`${successCount} image(s) saved successfully to the selected directory!`);
        } else {
          downloadImagesRegular(selectedImageData);
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        } else {
          console.error('Error with directory access:', error);
          downloadImagesRegular(selectedImageData);
        }
      }
    } else {
      downloadImagesRegular(selectedImageData);
    }
  };

  const downloadImagesRegular = (selectedImageData) => {
    selectedImageData.forEach((img) => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${img.base64}`;
      link.setAttribute('download', `synthetic_image_${img.id + 1}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
    message.success(`${selectedImageData.length} image(s) downloaded successfully!`);
  };

  const generatePDFFromJSON = (jsonData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    const addWrappedText = (text, x, y, maxWidth, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      const lineHeight = fontSize * 0.4;
      
      lines.forEach((line, index) => {
        const currentY = y + (index * lineHeight);
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, x, y + (index * lineHeight));
      });
      
      return y + (lines.length * lineHeight) + 8;
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(jsonData.title || 'Generated Document', margin, yPosition);
    yPosition += 20;

    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    jsonData.sections?.forEach((section, sectionIndex) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(`${sectionIndex + 1}. ${section.heading}`, margin, yPosition);
      yPosition += 15;

      section.subsections?.forEach((subsection, subIndex) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(`${sectionIndex + 1}.${subIndex + 1} ${subsection.subheading}`, margin + 10, yPosition);
        yPosition += 12;

        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(subsection.content, margin + 10, yPosition, maxWidth - 10, 11);
        yPosition += 8;
      });
      
      yPosition += 5;
    });

    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, pageHeight - 10);
    }

    return pdf;
  };

  const convertJSONToExcel = (jsonData) => {
    const workbook = XLSX.utils.book_new();
    
    const columns = Object.keys(jsonData);
    const maxRows = Math.max(...columns.map(col => Array.isArray(jsonData[col]) ? jsonData[col].length : 0));
    
    const worksheetData = [];
    
    for (let i = 0; i < maxRows; i++) {
      const row = {};
      columns.forEach(col => {
        if (Array.isArray(jsonData[col]) && i < jsonData[col].length) {
          row[col] = jsonData[col][i];
        } else {
          row[col] = '';
        }
      });
      worksheetData.push(row);
    }
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    return workbook;
  };

  const handleFileUpload = (info) => {
    const { fileList } = info;
    setUploadedFiles(fileList);
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const removeFile = (file) => {
    const newFileList = uploadedFiles.filter(item => item.uid !== file.uid);
    setUploadedFiles(newFileList);
  };

  const getFileTypeFromUploaded = () => {
    if (uploadedFiles.length === 0) return null;
    
    const file = uploadedFiles[0].originFileObj || uploadedFiles[0];
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) return 'image';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) return 'excel';
    
    return null;
  };

  const resetState = () => {
    setPrompt("");
    setPreviewData(null);
    setImageData([]);
    setSelectedImages([]);
    setUploadedFiles([]);
  };

  const tabItems = [
    {
      key: 'generate',
      label: 'Generate',
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ marginBottom: "8px", fontWeight: "500" }}>Prompt</div>
            <Input.TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Generate a table with 25 rows of realistic synthetic data..."
              rows={4}
            />
          </div>
          
          {imageData.length === 0 && (
            <div>
              <Text type="secondary">Example prompts (click to use):</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {GENERATE_EXAMPLE_PROMPTS.map((example, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                    onClick={() => handleExampleClick(example)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <Text>{example}</Text>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <div style={{ marginBottom: "8px", fontWeight: "500" }}>Output Type</div>
            <Select
              value={type}
              onChange={setType}
              style={{ width: "100%" }}
              options={[
                { value: "excel", label: "Excel" },
                { value: "csv", label: "CSV" },
              ]}
            />
          </div>
        </div>
      )
    },
    {
      key: 'extend',
      label: 'Extend',
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ marginBottom: "8px", fontWeight: "500" }}>Upload Files</div>
            <Dragger
              multiple
              beforeUpload={() => false}
              onChange={handleFileUpload}
              fileList={uploadedFiles}
              accept=".xlsx,.xls,.csv"
              style={{ backgroundColor: '#fafafa' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#40a9ff' }} />
              </p>
              <p className="ant-upload-text">Click or drag files to this area to upload</p>
              <p className="ant-upload-hint">
                Support for Excel and CSV files
              </p>
            </Dragger>
          </div>

          {uploadedFiles.length > 0 && (
            <div>
              <div style={{ marginBottom: "8px", fontWeight: "500" }}>Uploaded Files:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {uploadedFiles.map((file) => (
                  <div key={file.uid} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "12px", 
                    border: "1px solid #d9d9d9", 
                    borderRadius: "6px",
                    backgroundColor: "#fafafa"
                  }}>
                    <span style={{ fontWeight: "500" }}>{file.name}</span>
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeFile(file)}
                      size="small"
                      danger
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <div style={{ marginBottom: "8px", fontWeight: "500" }}>Prompt</div>
            <Input.TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to extend the uploaded files..."
              rows={4}
            />
          </div>
          
          {uploadedFiles.length > 0 && imageData.length === 0 && (
            <div>
              <Text type="secondary">Example prompts for {getFileTypeFromUploaded() || 'your file type'} (click to use):</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {(EXTEND_EXAMPLE_PROMPTS[getFileTypeFromUploaded()] || EXTEND_EXAMPLE_PROMPTS.excel).map((example, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                    onClick={() => handleExampleClick(example)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <Text>{example}</Text>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Modal
      title="Generate Synthetic Data"
      open={isOpen}
      onCancel={() => {
        resetState();
        onClose();
      }}
      onOk={handleGenerate}
      okText={activeTab === "generate" ? "Generate" : "Extend"}
      confirmLoading={loading}
      width={800}
      destroyOnClose={true}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          setActiveTab(key);
          resetState();
        }}
        items={tabItems}
        style={{ marginBottom: "16px" }}
      />
      
      {previewData && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ marginBottom: "8px", fontWeight: "500" }}>Preview</div>
          <div style={{ maxHeight: "300px", overflow: "auto", border: "1px solid #d9d9d9", borderRadius: "6px" }}>
            <SampleDataTable data={previewData} />
          </div>
        </div>
      )}
      
      {imageData.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "16px" 
          }}>
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              Generated Images
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Checkbox
                checked={selectedImages.length === imageData.length}
                indeterminate={selectedImages.length > 0 && selectedImages.length < imageData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                Select All
              </Checkbox>
              <Button 
                type="primary" 
                disabled={selectedImages.length === 0}
                onClick={downloadSelectedImages}
              >
                Download Selected ({selectedImages.length})
              </Button>
            </div>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
            gap: "16px" 
          }}>
            {imageData.map((img) => (
              <div key={img.id} style={{ 
                border: '1px solid #eee', 
                borderRadius: '8px', 
                padding: '12px',
                backgroundColor: selectedImages.includes(img.id) ? '#f0f8ff' : 'white',
                transition: "background-color 0.2s"
              }}>
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <Checkbox
                    checked={selectedImages.includes(img.id)}
                    onChange={(e) => handleImageSelection(img.id, e.target.checked)}
                  >
                    Select Image {img.id + 1}
                  </Checkbox>
                </div>
                <img
                  src={`data:image/png;base64,${img.base64}`}
                  alt={`Generated ${img.id + 1}`}
                  style={{ 
                    width: "100%", 
                    maxHeight: 200, 
                    objectFit: "contain",
                    borderRadius: "4px"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SyntheticData;