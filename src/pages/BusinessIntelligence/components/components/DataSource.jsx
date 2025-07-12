import "../styles/datasource.scss";
import tableSvg from "../../../../assets/svg/table.svg";
import googleSheet from "../../../../assets/svg/googlesheet.svg";
import { useNavigate } from "react-router-dom";
import { SiMysql } from "react-icons/si";
import { MdSettingsApplications } from "react-icons/md";
import { BiLogoPostgresql } from "react-icons/bi";
import { SiMongodb } from "react-icons/si";
import { SiMqtt } from "react-icons/si";
import PostgreSql from "./popups/postgresql";
import { useEffect, useState } from "react";
import { useDataAPI } from "../contexts/GetDataApi";
import { Modal } from "antd";
import {
  transformData2,
} from "../../../../utils/const";
import MqttConfig from "./popups/MqttConfig";
import SapConfig from "./popups/sap";
import { useFileUpload } from './useApi';
import { IconButton } from "@mui/material";
import { FaRobot } from "react-icons/fa";
import ChatDataPrep from "./popups/chatdataprep";
import SyntheticData from "./popups/SyntheticData";

export const DataSource = () => {
  const navigate = useNavigate();
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [connection, setConnection] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { uploadedData, handleUpload, showContent } = useDataAPI();
  const [file, setFile] = useState(null);
  const [fetchedData, setFetchedData] = useState([]);
  const [mqttOpen, setMqttOpen] = useState(false);
  const [sapOpen, setSapOpen] = useState(false);
  const { uploadFile, isLoading } = useFileUpload();
  const [uploadError, setUploadError] = useState(null);
  const [changed, setChanged] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [syntheticDataOpen, setSyntheticDataOpen] = useState(false);
  const handleCancel = () => {
    setOpen(false);
  };

  const handleChatprepData = () => {
    // localStorage.setItem("prepData", JSON.stringify(data));
    setShowModel(true);
  };

  const handleOk = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploadError(null);
    setConfirmLoading(true);
    
    const result = await uploadFile(file,handleUpload,{
      file:file,
      database: false,
        data: [],
        tableName: '',
        sap: false
    });
    
    if (result.success) {
      setChanged(!changed)
      setOpen(false);
    } else {
      setUploadError(result.error?.message || 'Failed to upload file. Please try again.');
    }
    
    setConfirmLoading(false);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleNavigate = async (finalValue) => {
    await showContent({
      filename: finalValue.filename,
      headers: Object.keys(finalValue.data[0]),
      data: finalValue.data,
    });

    localStorage.setItem("filename", finalValue.filename);
    localStorage.setItem(
      "prepData",
      JSON.stringify(transformData2(finalValue.data))
    );
    navigate("/discover");
  };

  const handleMqttData = async (mqttData) => {
    await showContent({
      filename: mqttData.filename,
      headers: Object.keys(mqttData.data[0]),
      data: mqttData.data,
    });

    localStorage.setItem("filename", mqttData.filename);
    localStorage.setItem("prepData", JSON.stringify(mqttData.data));
    navigate("/discover");
  };

  useEffect(() => {
    console.log(uploadedData , !open , file?.name)
    if (uploadedData.length > 0 && !open && file?.name) {
      handleNavigate(JSON.parse(uploadedData[0]));
    }
  }, [uploadedData]);

  return (
    <>
      {!postgresOpen && (
        <div className="mt-1">
          <h2 className="headerText"> Pick a data source to start</h2>
          <div className="mainConatiner">
            <div className="outerContainer" onClick={() => setOpen(true)}>
              <div className="cardContainer" style={{ display: "flex" }}>
                <div className="stepContainer">
                  <img
                    style={{ width: 24, height: 24, marginTop: "2px" }}
                    src={tableSvg}
                    class="step-tile-icon"
                  />
                  <div data-v-fa6956f7="" class="step-tile-text-container">
                    <div data-v-fa6956f7="" class="textHeader">
                      CSV
                    </div>
                    <div data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Upload and configure datasets{" "}
                    </div>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> CSV</span>
                  {/* <span className='footerText'> EXCEL</span>
                            <span className='footerText'> JSON</span> */}
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div className="cardContainer" onClick={() => setSapOpen(true)}>
                <div className="stepCommonContainer">
                  <MdSettingsApplications
                    color="blue"
                    width={30}
                    height={30}
                    style={{ width: 30, height: 30, marginTop: "2px" }}
                    src={googleSheet}
                    class="step-tile-icon"
                  />
                  <span class="textHeader">SAP</span>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> Not Connected</span>
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div className="cardContainer">
                <div className="stepCommonContainer">
                  <SiMysql size={50} />
                  <div>
                    <span class="textHeader">MySQL</span>
                    <span data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Import{" "}
                    </span>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> Not Connected</span>
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div className="cardContainer">
                <div className="stepCommonContainer">
                  <SiMongodb size={40} />
                  <div>
                    <span class="textHeader">MongoDB</span>
                    <span data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Import{" "}
                    </span>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> Not Connected</span>
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div
                className="cardContainer"
                onClick={() => setPostgresOpen(true)}
              >
                <div className="stepCommonContainer">
                  <BiLogoPostgresql size={40} />
                  <div>
                    <span class="textHeader">PostgreSQL</span>
                    <span data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Import{" "}
                    </span>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> Not Connected</span>
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div className="cardContainer" onClick={() => setMqttOpen(true)}>
                <div className="stepCommonContainer">
                  <SiMqtt size={40} />
                  <div>
                    <span class="textHeader">IOT</span>
                    <span data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Import{" "}
                    </span>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText"> Not Connected</span>
                </div>
              </div>
            </div>
            <div className="outerContainer">
              <div className="cardContainer" onClick={() => setSyntheticDataOpen(true)}>
                <div className="stepCommonContainer">
                  <FaRobot size={40} />
                  <div>
                    <span class="textHeader">Build Data</span>
                    <span data-v-fa6956f7="" class="textDesc">
                      {" "}
                      Generate{" "}
                    </span>
                  </div>
                </div>
                <div className="footerContainer">
                  <span className="footerText">AI-Generated Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {postgresOpen && (
        <PostgreSql
          setPostgresOpen={setPostgresOpen}
          setConnection={setConnection}
        />
      )}
      {open && (
        <Modal
          title="Upload File"
          open={open}
          onOk={handleOk}
          confirmLoading={confirmLoading || isLoading}
          onCancel={handleCancel}
          okText="Upload"
        >
          <input type="file" onChange={handleFileChange} />
          {uploadError && (
            <div style={{ color: 'red', marginTop: '8px' }}>{uploadError}</div>
          )}
        </Modal>
      )}

{/* <ChatDataPrep {...{ showModel, setShowModel }} />

<IconButton
  onClick={handleChatprepData}
  sx={{
    position: "fixed",
    bottom: 24,
    right: 24,
    backgroundColor: "#1976d2",
    color: "white",
    width: 56,
    height: 56,
    borderRadius: "50%",
    boxShadow: 4,
    transition: "background-color 0.3s, transform 0.2s",
    '&:hover': {
      backgroundColor: "#1565c0",
      transform: "scale(1.1)"
    }
  }}
>
  <FaRobot size={28} />
</IconButton> */}

      {mqttOpen && (
        <MqttConfig setMqttOpen={setMqttOpen} onDataReceived={handleMqttData} />
      )}
      {sapOpen && (
        <SapConfig setSapOpen={setSapOpen} onDataReceived={handleNavigate} />
      )}
      <SyntheticData 
        isOpen={syntheticDataOpen} 
        onClose={() => setSyntheticDataOpen(false)} 
      />
    </>
  );
};
