import { useState } from "react";
import { Modal, Input, Select, message, Typography, Card, Checkbox, Button } from "antd";
import axios from "axios";
import { akkiourl } from "../../../../../utils/const";
import SampleDataTable from "../../../../genAi/components/sampleData";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const EXAMPLE_PROMPTS = [
  "Generate a table with 25 rows of sales data with columns: Order ID, Product Name, Quantity, Unit Price, Total Amount, Customer Name, Order Date",
  "Generate 2 images related to X-ray of a human.",
  "Create a PDF with 3 pages about Artificial Intelligence with sections: Introduction, Methodology, Conclusion"
];

const SyntheticData = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("excel");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [imageData, setImageData] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setImageData([]);
    setSelectedImages([]);
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("type", type);

    try {
      if (type === "image") {
        const response = await axios.post(
          `${akkiourl}/data_scout`,
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

      // Handle PDF generation differently - first try to get JSON response
      if (type === "pdf") {
        try {
          // Try to get JSON response first
          const jsonResponse = await axios.post(
            `${akkiourl}/data_scout`,
            formData
          );
          
          // Check if response is JSON with document structure
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
        
        // Fallback to blob response if JSON fails
        try {
          const blobResponse = await axios.post(
            `${akkiourl}/data_scout`,
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

      // Handle Excel files - try JSON response
      if (type === "excel") {
        try {
          const jsonResponse = await axios.post(
            `${akkiourl}/data_scout`,
            formData
          );
          
          // Check if response has the expected structure with message[1] containing data
          if (jsonResponse.data && 
              jsonResponse.data.message && 
              Array.isArray(jsonResponse.data.message) && 
              jsonResponse.data.message.length > 1 && 
              typeof jsonResponse.data.message[1] === 'object') {
            
            const fileName = jsonResponse.data.message[0] || `synthetic_data_${Date.now()}.xlsx`;
            const excelData = jsonResponse.data.message[1];
            const workbook = convertJSONToExcel(excelData);
            
            // Generate Excel file and download
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
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
          }
          
          // If the structure doesn't match, fallback to blob response
          throw new Error("Unexpected response structure");
        } catch (jsonError) {
          console.log("JSON response failed, trying blob response...", jsonError);
          
          // Fallback to blob response if JSON fails
          try {
            const blobResponse = await axios.post(
              `${akkiourl}/data_scout`,
              formData,
              {
                responseType: 'blob'
              }
            );
            
            const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `synthetic_data.xlsx`);
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
    // Remove any invalid characters and ensure safe naming
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

    // Check if File System Access API is supported
    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await window.showDirectoryPicker();
        let successCount = 0;
        let failedFiles = [];
        
        for (let i = 0; i < selectedImageData.length; i++) {
          const img = selectedImageData[i];
          try {
            // Generate a safe, unique filename
            const fileName = generateSafeFileName('synthetic_image', img.id + 1);
            
            // Check if file already exists and create a unique name if needed
            let finalFileName = fileName;
            let counter = 1;
            
            while (true) {
              try {
                // Try to get existing file handle
                await directoryHandle.getFileHandle(finalFileName);
                // If we get here, file exists, so create a new name
                const nameParts = fileName.split('.');
                const extension = nameParts.pop();
                const baseName = nameParts.join('.');
                finalFileName = `${baseName}_${counter}.${extension}`;
                counter++;
              } catch (error) {
                // File doesn't exist, we can use this name
                break;
              }
            }
            
            const fileHandle = await directoryHandle.getFileHandle(finalFileName, {
              create: true
            });
            
            const writable = await fileHandle.createWritable();
            
            // Convert base64 to blob with proper error handling
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
            failedFiles.push(`Image ${img.id + 1}`);
          }
        }
        
                 if (successCount === selectedImageData.length) {
           // All files saved successfully
           message.success(`All ${successCount} image(s) saved successfully to the selected directory!`);
         } else if (successCount > 0) {
           // Some files saved successfully
           message.success(`${successCount} image(s) saved successfully to the selected directory!`);
         } else {
           // No files saved, fallback to regular download
           downloadImagesRegular(selectedImageData);
         }
        
             } catch (error) {
         if (error.name === 'AbortError') {
           // User cancelled directory selection
           return;
         } else {
           console.error('Error with directory access:', error);
           // Fallback to regular download silently
           downloadImagesRegular(selectedImageData);
         }
       }
    } else {
      // Fallback for browsers that don't support File System Access API
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
  };

  const generatePDFFromJSON = (jsonData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with word wrapping
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

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(jsonData.title || 'Generated Document', margin, yPosition);
    yPosition += 20;

    // Add a line under the title
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Process sections
    jsonData.sections?.forEach((section, sectionIndex) => {
      // Section heading
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(`${sectionIndex + 1}. ${section.heading}`, margin, yPosition);
      yPosition += 15;

      // Process subsections
      section.subsections?.forEach((subsection, subIndex) => {
        // Subsection heading
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(`${sectionIndex + 1}.${subIndex + 1} ${subsection.subheading}`, margin + 10, yPosition);
        yPosition += 12;

        // Subsection content
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(subsection.content, margin + 10, yPosition, maxWidth - 10, 11);
        yPosition += 8;
      });
      
      yPosition += 5; // Extra space between sections
    });

    // Add page numbers
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, pageHeight - 10);
    }

    return pdf;
  };

  // Helper function to convert JSON data to Excel workbook
  const convertJSONToExcel = (jsonData) => {
    const workbook = XLSX.utils.book_new();
    
    // Get all column names
    const columns = Object.keys(jsonData);
    
    // Find the maximum length among all arrays to determine number of rows
    const maxRows = Math.max(...columns.map(col => Array.isArray(jsonData[col]) ? jsonData[col].length : 0));
    
    // Create array of objects for the worksheet
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
    
    // Create worksheet from array of objects
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    return workbook;
  };

  return (
    <Modal
      title="Generate Synthetic Data"
      open={isOpen}
      onCancel={() => {
        setPreviewData(null);
        setImageData([]);
        setSelectedImages([]);
        onClose();
      }}
      onOk={handleGenerate}
      okText="Generate"
      confirmLoading={loading}
      width={800}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div style={{ marginBottom: "8px" }}>Prompt</div>
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Generate a table with 25 rows of realistic synthetic data..."
            rows={4}
          />
        </div>
        
        {/* Hide example prompts when images are generated */}
        {imageData.length === 0 && (
          <div>
            <Text type="secondary">Example prompts (click to use):</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleExampleClick(example)}
                >
                  <Text>{example}</Text>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <div style={{ marginBottom: "8px" }}>Output Type</div>
          <Select
            value={type}
            onChange={setType}
            style={{ width: "100%" }}
            options={[
              { value: "excel", label: "Excel" },
              { value: "image", label: "Image" },
              { value: "pdf", label: "PDF" },
            ]}
          />
        </div>
        
        {previewData && (
          <div>
            <div style={{ marginBottom: "8px" }}>Preview</div>
            <div style={{ maxHeight: "300px", overflow: "auto" }}>
              <SampleDataTable data={previewData} />
            </div>
          </div>
        )}
        
        {imageData.length > 0 && (
          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "16px" 
            }}>
              <div style={{ marginBottom: "8px", fontSize: "16px", fontWeight: "500" }}>
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
                  backgroundColor: selectedImages.includes(img.id) ? '#f0f8ff' : 'white'
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
                      // border: '1px solid #ddd',
                      // borderRadius: '4px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SyntheticData;