import React from 'react';
import styles from '../styles/FileUpload.module.css';

const FileUpload = ({ handleFileChange, handleUpload, fileName }) => {
  return (
    // <div className={styles.container}>
    //   <h2 className={styles.heading}>Upload Your Data</h2>
    //   <div className={styles.uploadSection}>
    //     <input
    //       type="file"
    //       onChange={handleFileChange}
    //       className={styles.fileInput}
    //       id="file-upload"
    //       accept=".xlsx, .xls, .csv" // Adjust the accepted file types as needed
    //     />
    //     <label htmlFor="file-upload" className={styles.fileLabel}>
    //       {fileName ? fileName : 'Choose a file...'}
    //     </label>
    //     <button
    //       type="button"
    //       className={styles.uploadButton}
    //       onClick={handleUpload}
    //       disabled={!fileName} // Disable the button if no file is selected
    //     >
    //       Start Chat
    //     </button>
    //   </div>
    // </div>
    <div className={styles.container}>
      <h3>Selected File</h3>
      <label htmlFor="file-upload" className={styles.fileLabel}>
        {fileName ? fileName : 'No File Selected'}
      </label>
    </div>
  );
};

export default FileUpload;
