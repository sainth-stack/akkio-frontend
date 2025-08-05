import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackSharp } from "react-icons/io5";
import axios from "axios";
import { useDataAPI } from "../BusinessIntelligence/components/contexts/GetDataApi";
import { adminUrl, akkiourl, arrayToCSV, transformData } from "../../utils/const";
import { CircularProgress } from "@mui/material";
import { useQuery } from "react-query";
import { FaTrashAlt } from "react-icons/fa";
import { useFileUpload } from "../BusinessIntelligence/components/components/useApi";
import './index.css';

const Projects = () => {
  const { uploadedData, showContent, handleUpload } = useDataAPI();
  const [postgresOpen, setPostgresOpen] = useState(false);
  // const [fetchedData, setFetchedData] = useState([])
  const navigate = useNavigate();
  const location = useLocation();
  const [datas, setDatas] = useState({
    datasource: location?.state?.datasource || "",
  });
  const { uploadFile } = useFileUpload();
  const [loadingCards, setLoadingCards] = useState({});
  const email = JSON.parse(localStorage.getItem("user"))?.email;
  const [fetchedData, setFetchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const result = response.data.result || []; // Ensure it's an array
      setFetchedData(result.map((file) => JSON.stringify(file)));
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false); // Ensures loading state resets on success or failure
    }
  }, [email]); // Dependencies ensure function re-creation only when email changes
  
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]); // Dependency ensures useEffect only runs when fetchFiles changes
  

  const handleBack = () => {
    if (datas.datasource == "csv" || !postgresOpen) {
      navigate("/data-source");
    } else {
      setPostgresOpen(false);
      navigate("/projects");
    }
  };

  const handleNavigate = async (finalValue) => {
    await handleGetData(finalValue);
  };

  const handleGetData = async (finalValue) => {
    setLoadingCards((prev) => ({ ...prev, [finalValue]: true }));
    try {
      const formData = new FormData();
      formData.append("tablename", finalValue);
      formData.append("schemaname", "postgres");
      const response = await axios.post(`${akkiourl}/tabledata`, formData);
      console.log(response,'respondsfdsse')
      if (response.status === 200) {
        localStorage.setItem("filename", finalValue);
        // localStorage.setItem("prepData", JSON.stringify(response?.data));
        navigate("/discover");
        // await showContent({
        //   filename: finalValue,
        //   headers: Object.keys(response?.data),
        //   data: transformData(response?.data),
        // });
        console.log(response?.data,'response?.data')
        const csvData = arrayToCSV(response?.data);
        console.log(csvData)
        // Create the Blob with proper line endings and BOM for Excel compatibility
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvData], { 
          type: "text/csv;charset=utf-8-sig"
        });
        
        // Create a File object from the Blob with .csv extension
        const file = new File([blob], `${finalValue}.csv`, { type: "text/csv;charset=utf-8-sig" });
        
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
      <div className="file-grid">
        {isLoading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
            <CircularProgress />
          </div>
        ) : fetchedData?.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#888' }}>
            <h4>No data found</h4>
            <p>Please upload data to get started</p>
          </div>
        ) : (
          fetchedData?.map((finalField, index) => {
            const finalValue = finalField ? JSON.parse(finalField) : "";
            return fetchedData && finalValue !== "" ? (
              <div
                className="file-card"
                key={index}
                onClick={() => handleNavigate(finalValue)}
                style={{ position: 'relative', cursor: 'pointer' }}
                tabIndex={0}
              >
                {loadingCards[finalValue] ? (
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
                      <img
                        src="/dataThumbnail.jpeg"
                        alt={finalValue}
                        className="file-thumbnail"
                      />
                    </div>
                    <div className="file-name">{finalValue}</div>
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
                      onClick={(e) => handleDelete(e, email, finalValue)}
                    />
                  </>
                )}
              </div>
            ) : (
              <></>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Projects;
