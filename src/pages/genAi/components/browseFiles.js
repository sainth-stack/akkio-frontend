import React from 'react';
import styles from '../styles/FileUpload.module.css';

const FileUpload = ({ handleFileChange, handleUpload }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Upload Your Data</h2>
      <div className={styles.uploadSection}>
        <input type="file" onChange={(e) => handleFileChange(e)} className={styles.fileInput} />
        <button
          type="submit"
          className={styles.uploadButton}
          onClick={() => handleUpload()}
        >
          Start Chat
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
