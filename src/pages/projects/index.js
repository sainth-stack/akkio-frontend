import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackSharp } from "react-icons/io5";
import axios from "axios";
import { akkiourl, arrayToCSV } from "../../utils/const";
import { CircularProgress } from "@mui/material";
import { FaTrashAlt, FaCheckCircle } from "react-icons/fa";
import './index.css';

const Projects = () => {
  const [postgresOpen, setPostgresOpen] = useState(false);
  // const [fetchedData, setFetchedData] = useState([])
  const navigate = useNavigate();
  const location = useLocation();
  const [datas] = useState({
    datasource: location?.state?.datasource || "",
  });
  const [loadingCards, setLoadingCards] = useState({});
  const email = JSON.parse(localStorage.getItem("user"))?.email;
  const [fetchedData, setFetchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState({
    name: localStorage.getItem("filename") || "",
    type:
      (localStorage.getItem("selectedFileType") ||
        localStorage.getItem("file_type") ||
        localStorage.getItem("filetype") ||
        "")?.toLowerCase(),
  });

  useEffect(() => {
    if (location?.state?.datasource === "postgresql") {
      setPostgresOpen(true);
    }
  }, [location.state]);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!email) {
        throw new Error("User email is not found in localStorage.");
      }

      const formData = new FormData();
      formData.append("email", email);

      const response = await axios.post(`${akkiourl}/get_user_data`, formData);
      console.log(response, 'response.data.result')
      const result = response.data || []; // Ensure it's an array
      // Expecting shape like: [{ name: string, type: string, subtype?: string }]
      setFetchedData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false); // Ensures loading state resets on success or failure
    }
  }, [email]); // Dependencies ensure function re-creation only when email changes

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);


  const handleBack = () => {
    if (datas.datasource === "csv" || !postgresOpen) {
      navigate("/data-source");
    } else {
      setPostgresOpen(false);
      navigate("/projects");
    }
  };

  const handleNavigate = async (finalValue, fileType, fileItem) => {
    try {
      // Persist selected file type for Sidebar filtering
      if (fileType) {
        const normalizedType = String(fileType).toLowerCase();
        localStorage.setItem('selectedFileType', normalizedType);
        localStorage.setItem('file_type', normalizedType);
        localStorage.removeItem('filetype');
        setSelected({ name: finalValue, type: normalizedType });
      } else {
        localStorage.removeItem('selectedFileType');
        localStorage.removeItem('filetype');
        localStorage.removeItem('file_type');
        setSelected({ name: finalValue, type: "" });
      }
      localStorage.setItem('filename', finalValue);

      // Handle image classification - if image has a model (subtype), set up for classification
      if (fileType === 'image' && fileItem?.subtype && fileItem?.image_data_url) {
        const imageData = {
          filename: finalValue,
          fileType: 'image',
          imageBase64: fileItem.image_data_url,
          modelName: fileItem.subtype, // Model name stored in subtype
          uploadedAt: new Date().toISOString(),
          userEmail: email
        };

        // Store for interactive chat
        localStorage.setItem('image_classification_data', JSON.stringify(imageData));
        localStorage.setItem('selectedFileType', 'image_classification');

        console.log('📸 Image classification mode activated:', imageData);
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
    const normalized = String(fileType || '').toLowerCase();
    if (['csv', 'excel', 'json'].includes(normalized)) {
      await handleGetData(finalValue);
    } else {
      // For non-tabular types (including images, audio, pdf, url), go to Explore/Automate
      navigate('/explore');
    }
  };

  const handleGetData = async (finalValue) => {
    setLoadingCards((prev) => ({ ...prev, [finalValue]: true }));
    try {
      const formData = new FormData();
      formData.append("tablename", finalValue);
      formData.append("schemaname", "postgres");
      const response = await axios.post(`${akkiourl}/tabledata`, formData);
      console.log(response, 'respondsfdsse')
      if (response.status === 200) {
        localStorage.setItem("filename", finalValue);
        // localStorage.setItem("prepData", JSON.stringify(response?.data));
        navigate("/discover");
        // await showContent({
        //   filename: finalValue,
        //   headers: Object.keys(response?.data),
        //   data: transformData(response?.data),
        // });
        console.log(response?.data, 'response?.data')
        const csvData = arrayToCSV(response?.data);
        console.log(csvData)
        navigate("/discover");
        // const result = await uploadFile(file, handleUpload, {
        //   file: file,  // Use the File object instead of blob
        //   database: true,
        //   data: response?.data,
        //   tableName: finalValue,
        //   sap: false
        // });
      }
    } catch (error) {
      console.error("Failed to get data", error);
    } finally {
      setLoadingCards((prev) => ({ ...prev, [finalValue]: false }));
    }
  };

  const handleDelete = async (e, email, tableNames) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("table_names", tableNames);
      const response = await axios.post(
        `${akkiourl}/delete_selected_tables`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        console.log(response.data.message);
        fetchFiles(email);
      } else {
        console.error("Failed to delete the tables");
      }
    } catch (error) {
      console.error("Error deleting the tables:", error);
    }
  };


  return (
    <div className="data-source-container">
      <div className="p-3">
        <button className="btn " onClick={() => handleBack()}>
          <IoArrowBackSharp />
          Back
        </button>
      </div>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CircularProgress />
        </div>
      ) : fetchedData?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <h4>No data found</h4>
          <p>Please upload data to get started</p>
        </div>
      ) : (
        <>
          {[
            { key: 'data', title: 'Tabular Data (CSV, Excel, JSON)', types: ['csv', 'excel', 'json'] },
            { key: 'docs', title: 'Documents (PDF, Word, XML)', types: ['pdf', 'word', 'doc', 'docx', 'xml'] },
            { key: 'urls', title: 'URLs & Web Pages', types: ['url'] },
            { key: 'images', title: 'Images', types: ['image'] },
            { key: 'audio', title: 'Audio', types: ['audio'] },
          ].map((section) => {
            const items = fetchedData.filter((f) =>
              section.types.includes(String(f?.type || '').toLowerCase())
            );
            if (items.length === 0) return <></>;
            const sectionHasSelected =
              !!selected?.name &&
              items.some((it) => (it?.name || "") === selected?.name);
            return (
              <div
                key={section.key}
                style={{
                  marginBottom: 24,
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 6px 16px rgba(2, 6, 23, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', margin: '0' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.12rem' }} >
                    {section.title} <span style={{ color: '#6b7280', fontWeight: 600 }}>({items.length})</span>
                  </h3>
                  {sectionHasSelected && (
                    <FaCheckCircle color="#22c55e" title="Selected in this section" />
                  )}
                </div>
                <div
                  className="file-grid"
                  role="grid"
                  aria-label={`${section.title} files`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                    padding: 16
                  }}
                >
                  {items.map((fileItem) => {
                    const fileName = fileItem?.name || "";
                    const fileType = String(fileItem?.type || "").toLowerCase();
                    if (!fileName) return <></>;
                    const isDataType = ['csv', 'excel', 'json'].includes(fileType);
                    const isSelected = selected?.name === fileName;
                    const thumbnail = isDataType ? (
                      <img
                        src="/dataThumbnail.jpeg"
                        alt={fileName}
                        className="file-thumbnail"
                      />
                    ) : (
                      fileType === 'url' ? (
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16/10',
                            borderRadius: 12,
                            background: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '18px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: '0 8px 20px rgba(2,6,23,0.18)',
                            padding: 12,
                            textAlign: 'center'
                          }}
                          aria-label="url placeholder"
                        >
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌐</div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>WEB PAGE</div>
                        </div>
                      ) : fileType === 'image' && fileItem?.image_data_url ? (
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/10',
                            background: '#f8fafc',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <img
                            src={fileItem.image_data_url}
                            alt={fileName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                          {fileItem?.subtype && (
                            <div style={{
                              position: 'absolute',
                              left: 8,
                              bottom: 8,
                              padding: '4px 8px',
                              background: 'rgba(16,185,129,0.95)',
                              color: 'white',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              boxShadow: '0 2px 6px rgba(2,6,23,0.18)',
                              backdropFilter: 'blur(2px)'
                            }}>
                              🤖 {fileItem.subtype}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16/10',
                            borderRadius: 12,
                            background:
                              fileType === 'image' ? 'linear-gradient(135deg,#f59e0b,#fcd34d)' :
                                fileType === 'pdf' ? 'linear-gradient(135deg,#ef4444,#f87171)' :
                                  fileType === 'xml' ? 'linear-gradient(135deg,#06b6d4,#67e8f9)' :
                                    fileType === 'audio' ? 'linear-gradient(135deg,#8b5cf6,#a78bfa)' :
                                      'linear-gradient(135deg,#64748b,#94a3b8)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '24px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: '0 8px 20px rgba(2,6,23,0.18)'
                          }}
                          aria-label={`${fileType || 'file'} placeholder`}
                        >
                          {(fileType === 'pdf' && 'PDF') ||
                            ((fileType === 'word' || fileType === 'doc' || fileType === 'docx') && 'DOC') ||
                            (fileType === 'image' && 'IMG') ||
                            (fileType === 'audio' && 'AUDIO') ||
                            (fileType === 'xml' && 'XML') ||
                            (fileType === 'url' && '🌐') ||
                            'FILE'}
                        </div>
                      )
                    );
                    return (
                      <div
                        className="file-card"
                        key={fileName}
                        onClick={() => handleNavigate(fileName, fileType, fileItem)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(2, 6, 23, 0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(2, 6, 23, 0.05)'; }}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          outline: isSelected ? '3px solid #22c55e' : 'none',
                          borderRadius: 12,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 10px rgba(2, 6, 23, 0.05)',
                          transition: 'transform .15s ease, box-shadow .2s ease'
                        }}
                        tabIndex={0}
                        role="gridcell"
                        aria-selected={isSelected}
                      >
                        {loadingCards[fileName] ? (
                          <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "200px"
                          }}>
                            <CircularProgress />
                          </div>
                        ) : (
                          <>
                            <div className="thumbnail-wrapper">
                              {thumbnail}
                            </div>
                            <div className="file-name" style={{
                              padding: '10px 10px 40px 10px',
                              fontWeight: 600,
                              fontSize: 14,
                              color: '#111827',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {fileName}
                            </div>
                            {isSelected && (
                              <FaCheckCircle
                                title="Selected"
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  color: '#22c55e',
                                  background: 'white',
                                  borderRadius: '50%',
                                  padding: 2,
                                  fontSize: 26,
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                                }}
                              />
                            )}
                            <FaTrashAlt
                              className="delete-icon"
                              style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                color: '#e74c3c',
                                background: 'white',
                                borderRadius: '50%',
                                padding: 4,
                                fontSize: 22,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                cursor: 'pointer'
                              }}
                              title="Delete file"
                              onClick={(e) => handleDelete(e, email, fileName)}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Projects;
