import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { AiFillPlusCircle } from "react-icons/ai"
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBackSharp } from 'react-icons/io5';
import { useDataAPI } from '../BusinessIntelligence/components/contexts/GetDataApi';
import PostgreSql from '../BusinessIntelligence/components/components/popups/postgresql';
import { akkiourl } from '../../utils/const';
import axios from 'axios';
import { toast } from 'react-toastify';

const Projects = () => {
  const { uploadedData, handleUpload, showContent } = useDataAPI()
  const [open, setOpen] = useState(false);
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState([])
  const [connection, setConnection] = useState(false)
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [datas, setDatas] = useState({ datasource: location?.state?.datasource || '' })
  const [training, setTraining] = useState(false)

  useEffect(() => {
    if (location?.state?.datasource === 'postgresql') {
      setPostgresOpen(true)
    }
  }, [location.state])

  // useEffects Hooks
  useEffect(() => {
    const updateData = uploadedData.map((item) => {
      return item
    })
    setFetchedData(updateData)
    if (datas?.datasource !== 'csv' && uploadedData.length > 0 && connection) {
      handleNavigate(JSON.parse(updateData[0]))
    }
  }, [uploadedData])


  // Functions
  const showModal = (csv) => {
    if (csv) {
      setOpen(true)
    } else {
      navigate('/data-source')
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleUpload2 = async () => {
    var formData = new FormData();
    formData.append('file', file);  // Append CSV file to formData
    setConfirmLoading(true)
    try {
      await axios.post(`${akkiourl}/upload`, formData)
        .then((response) => {
          // handleTrainData()
          setOpen(false)
          setConfirmLoading(false)
        });
    } catch (err) {
      setConfirmLoading(false)
      console.log(err);
    }
  };

  const handleOk = () => {
    handleUpload(file)
    console.log(uploadedData)
    handleUpload2()
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };
  const handleBack = () => {
    if (datas.datasource == 'csv' || !postgresOpen) {
      navigate('/data-source')
    } else {
      setPostgresOpen(false)
      navigate('/projects')
    }
  }


  const handleNavigate = async (finalValue) => {
    await showContent({
      filename: finalValue.filename, headers: Object.keys(finalValue.data
      [0]), data: finalValue.data
    })

    // Uploaded Data is storing the localstorage  
    localStorage.setItem("filename", finalValue.filename)
    localStorage.setItem("file", finalValue)
    localStorage.setItem('prepData', JSON.stringify(finalValue.data));
    navigate("/discover")
  }
  console.log(datas?.datasource, 'postgresql', postgresOpen)
  return (
    <>
      {/* <Navbar /> */}
      <div className='p-3'>
        <button className='btn ' onClick={() => handleBack()}><IoArrowBackSharp /> Back</button>
      </div>
      {!postgresOpen && <div className="container">
        <div className="upload-section">
          <div className="upload-container" onClick={() => showModal(datas?.datasource === 'csv')}>
            <AiFillPlusCircle size={45} />
            {datas?.datasource === 'csv' ? <p>Upload Dataset</p> : <p>New Data Source</p>}
          </div>
          {datas?.datasource === 'csv' && open && <Modal
            title=""
            open={open}
            onOk={handleOk}
            confirmLoading={confirmLoading}
            onCancel={handleCancel}
            okText={training ? "Training" : "upload"}
          >

            <input type='file' onChange={handleFileChange} />
          </Modal>}
        </div>

        {/* FetchedData is map to get an JSON format of the Data */}
        {
          fetchedData.map((finalField, index) => {
            const finalValue = finalField ? JSON.parse(finalField) : ""
            return uploadedData && finalValue !== "" ? <div className="csv-files" key={index} onClick={() => handleNavigate(finalValue)}>

              <img src="/dataThumbnail.jpeg" alt={finalValue.filename} width={300} className='data-img' />
              <h5 className='filename'>{finalValue.filename}</h5>
            </div> : <></>
          })
        }
      </div>}

      {datas?.datasource === 'postgresql' && postgresOpen && <PostgreSql setPostgresOpen={setPostgresOpen} setConnection={setConnection} />}
    </>
  );
}

export default Projects