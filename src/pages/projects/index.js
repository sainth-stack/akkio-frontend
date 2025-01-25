import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackSharp } from "react-icons/io5";
import axios from "axios";
import { useDataAPI } from "../BusinessIntelligence/components/contexts/GetDataApi";
import { adminUrl, akkiourl, transformData } from "../../utils/const";
import { CircularProgress } from "@mui/material";
import { useQuery } from "react-query";
import { MdDelete } from "react-icons/md";

const Projects = () => {
  const { uploadedData, showContent, handleUpload } = useDataAPI();
  const [postgresOpen, setPostgresOpen] = useState(false);
  // const [fetchedData, setFetchedData] = useState([])
  const navigate = useNavigate();
  const location = useLocation();
  const [datas, setDatas] = useState({
    datasource: location?.state?.datasource || "",
  });
  const [loadingCards, setLoadingCards] = useState({});
  const email = JSON.parse(localStorage.getItem("user"))?.email;
const [fetchedData,setFetchedData] = useState([])
const [isLoading,setIsLoading]= useState(false)
  useEffect(() => {
    if (location?.state?.datasource === "postgresql") {
      setPostgresOpen(true);
    }
  }, [location.state]);

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      if (!email) {
        throw new Error("User email is not found in localStorage.");
      }

      const formData = new FormData();
      formData.append("email", email);

      const response = await axios.post(`${akkiourl}/get_user_data`, formData);
      setFetchedData(response.data.result.map((file) => JSON.stringify(file)))
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      console.error("Error fetching files:", error);
      throw error; // Ensure the error is propagated to react-query
    }
  };


  useEffect(()=>{
    fetchFiles()
  },[])

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
      if (response.status === 200) {
        localStorage.setItem("filename", finalValue);
        // localStorage.setItem("file", finalValue)
        localStorage.setItem("prepData", JSON.stringify(response?.data));
        await showContent({
          filename: finalValue,
          headers: Object.keys(response?.data),
          data: transformData(response?.data),
        });
        navigate("/discover");
        handleUpload(null, true, response?.data, finalValue);
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
        "http://54.169.213.200:3001/api/delete_selected_tables",
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
    <>
      <div className="p-3">
        <button className="btn " onClick={() => handleBack()}>
          <IoArrowBackSharp />
          Back
        </button>
      </div>
      <div className="container">
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <CircularProgress />
          </div>
        ) : fetchedData?.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h4>No data found</h4>
            <p>Please upload data to get started</p>
          </div>
        ) : (
          fetchedData?.map((finalField, index) => {
            const finalValue = finalField ? JSON.parse(finalField) : "";
            return fetchedData && finalValue !== "" ? (
              <div
                className="csv-files"
                key={index}
                onClick={() => handleNavigate(finalValue)}
              >
                {loadingCards[finalValue] ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "2rem",
                    }}
                  >
                    <CircularProgress />
                  </div>
                ) : (
                  <>
                    <img
                      src="/dataThumbnail.jpeg"
                      alt={finalValue}
                      width={300}
                      className="data-img"
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <h5 className="filename">{finalValue}</h5>
                      <MdDelete
                        width={20}
                        onClick={(e) => handleDelete(e, email, finalValue)}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <></>
            );
          })
        )}
      </div>
    </>
  );
};

export default Projects;
