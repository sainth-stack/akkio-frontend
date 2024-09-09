import React from 'react';
import styles from '../styles/columnDescription.module.css';

const ColumnDescriptions = ({ descriptions }) => {
  const descriptionItems = descriptions.split('\n').filter(desc => desc.trim() !== '');

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.heading}>Column Descriptions</h2> */}
      <p className={styles.description}>The Topic below gives you a general fell of the dataset.</p>
      <ul className={styles.list}>
        {descriptionItems.map((item, index) => (
          <li key={index} className={styles.listItem}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default ColumnDescriptions;
