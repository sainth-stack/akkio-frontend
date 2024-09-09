import React from 'react';
import styles from '../styles/SampleDataTable.module.css';

const SampleDataTable = ({ data }) => {
  // Assume `data` is an array of objects, so we need to map through it
  const parsedData = Array.isArray(data) ? data : [data]; // Ensure data is an array

  // Extract column headers from the keys of the first object in the array
  const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.heading}>Sample Data</h2> */}
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className={styles.headerCell}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsedData.map((row, index) => (
            <tr key={index} className={styles.row}>
              {columns.map((col) => (
                <td key={col} className={styles.cell}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SampleDataTable;
