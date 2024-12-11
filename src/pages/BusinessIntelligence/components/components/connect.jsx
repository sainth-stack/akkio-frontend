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
  const [selectedOption, setSelectedOption] = useState('new');

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
      const endpoint = selectedOption === 'new'
        ? `${akkiourl}/synthetic_data`
        : `${akkiourl}/synthetic_data_extended`;

      const response = await axios.post(endpoint, formData, {
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
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                id="new"
                name="dataType"
                value="new"
                checked={selectedOption === 'new'}
                style={{ marginLeft: '15px', width: '30px' }}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <label htmlFor="new" className='p-0 m-0' style={{ marginLeft: '5px', width: '130px' }}>New Data</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                id="extend"
                name="dataType"
                value="extend"
                checked={selectedOption === 'extend'}
                onChange={(e) => setSelectedOption(e.target.value)}
                style={{ marginLeft: '15px', width: '30px' }}
              />
              <label htmlFor="extend" className='p-0 m-0' style={{ marginLeft: '5px', width: '150px' }}>Extend Data</label>
            </div>
          </div>
       {selectedOption !== 'new' &&   <input type='file' onChange={handleFileChange} />}
          <textarea
            placeholder={selectedOption !== 'new' ? "Enter your prompt for synthetic data extension..." : "Enter your prompt for synthetic data generation..."}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            style={{ width: '100%', marginTop: '10px',padding:'10px' }}
          />
        </Modal>
      )}
    </>
  );
}

export default Connect