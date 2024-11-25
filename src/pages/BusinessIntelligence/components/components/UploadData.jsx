import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { AiFillPlusCircle } from "react-icons/ai"
import { useDataAPI } from '../contexts/GetDataApi';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackSharp } from 'react-icons/io5';
import PostgreSql from './popups/postgresql';



const UploadData = (datas) => {
  const { uploadedData, handleUpload, showContent } = useDataAPI()
  const [open, setOpen] = useState(false);
  const [postgresOpen, setPostgresOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState([])
  const [connection,setConnection] = useState(false)
  const [file, setFile] = useState(null);
  const navigate = useNavigate()


  // useEffects Hooks
  useEffect(() => {
    const updateData=uploadedData.map((item) => {
      return item
    })
    setFetchedData(updateData)
    if (datas?.datasource !== 'csv' && uploadedData.length>0 && connection) {
      handleNavigate(JSON.parse(updateData[0]))
    }
  }, [uploadedData])


  // Functions
  const showModal = () => {
    if (datas.datasource == 'csv') {
      setOpen(true);
    } else if (datas.datasource === 'postgresql') {
      setPostgresOpen(true)
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleOk = () => {
    handleUpload(file)
    setOpen(false)
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
    }
  }


  const handleNavigate = async (finalValue) => {
    await showContent({
      filename: finalValue.filename, headers: Object.keys(finalValue.data
      [0]), data: finalValue.data
    })

    // Uploaded Data is storing the localstorage  
    localStorage.setItem("filename", finalValue.filename)
    localStorage.setItem('prepData', JSON.stringify(finalValue.data));
    navigate("/discover")
  }

  return (
    <>
      {/* <Navbar /> */}
      <div className='p-3'>
        <button className='btn ' onClick={() => handleBack()}><IoArrowBackSharp /> Back</button>
      </div>
      {!postgresOpen && <div className="container">
        <div className="upload-section">
          <div className="upload-container" onClick={showModal}>
            <AiFillPlusCircle size={45} />
            {datas?.datasource === 'csv' ? <p>Upload Dataset</p> : <p>Connect Dataset</p>}
          </div>
          {datas?.datasource === 'csv' && open && <Modal
            title=""
            open={open}
            onOk={handleOk}
            confirmLoading={confirmLoading}
            onCancel={handleCancel}
            okText="upload"
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

      {datas?.datasource === 'postgresql' && postgresOpen && <PostgreSql setPostgresOpen={setPostgresOpen} setConnection={setConnection}/>}


    </>
  );
}

export default UploadData