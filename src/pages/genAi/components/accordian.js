import React, { useState } from 'react';
import styles from '../styles/Accordion.module.css';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.accordion}>
      <div className={styles.header} onClick={toggleAccordion}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.icon}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default Accordion;
