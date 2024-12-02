import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { AiFillPlusCircle } from "react-icons/ai"
import { useNavigate } from 'react-router-dom';
import { IoArrowBackSharp } from 'react-icons/io5';
import { akkiourl } from '../../../../utils/const';
import axios from 'axios';



const Connect = (datas) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');

  // Functions
  const showModal = () => {
    navigate('/data-source')
  };


  const handleBack = () => {
    navigate('/data-source')
  }

  const handleSyntheticData = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleOk = async () => {
    setConfirmLoading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_prompt', userPrompt);

    try {
      const response = await axios.post(`${akkiourl}/synthetic_data`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response)
      if (response.status === 200) {
        const data = response?.data?.data;
        
        // Create blob and download link
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'synthetic_data.csv';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setUserPrompt('')
        setOpen(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      {/* <Navbar /> */}
      <div className='p-3'>
        <button className='btn ' onClick={() => handleBack()}><IoArrowBackSharp /> Back</button>
      </div>
      {<div className="container">
        <div className="upload-section">
          <div className="upload-container" onClick={showModal}>
            <AiFillPlusCircle size={45} />
            {datas?.datasource === 'csv' ? <p>Upload Dataset</p> : <p>Data Source</p>}
          </div>
        </div>

        <div className="upload-section">
          <div className="upload-container" onClick={handleSyntheticData}>
            <AiFillPlusCircle size={45} />
            {<p>Synthetic Data</p>}
          </div>
        </div>
      </div>}

      {open && (
        <Modal
          title="Generate Synthetic Data"
          open={open}
          onOk={handleOk}
          confirmLoading={confirmLoading}
          onCancel={handleCancel}
          okText="Generate"
        >
          <input type='file' onChange={handleFileChange} />
          <textarea
            placeholder="Enter your prompt for synthetic data generation..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            style={{ width: '100%', marginTop: '10px' }}
          />
        </Modal>
      )}
    </>
  );
}

export default Connect