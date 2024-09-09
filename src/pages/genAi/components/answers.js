import React, { useState } from 'react';
import styles from '../styles/AnswersAccordion.module.css';
import { CircularProgress } from '@mui/material';

const AnswersAccordion = ({ question, answer, loading,type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = answer;
  return (
    <div className={styles.accordionItem}>
      <div className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <span>{isOpen ? '-' : '+'}</span>
      </div>
      {isOpen && (
        <div className={styles.accordionContent}>
          <>{loading ? <div style={{display:'flex',width:'100%',justifyContent:'center'}}><CircularProgress size={24}/></div> : <div>
            {(type =="Text") ?answer : <img src={imageUrl} width={700} height={500} alt=''/>}
            </div>}</>
        </div>
      )}
    </div>
  );
};

export default AnswersAccordion;
