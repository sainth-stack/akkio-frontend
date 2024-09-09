import React from 'react';
import styles from '../styles/SampleQuestion.module.css';

const SampleQuestion = ({ question, onClick }) => {
  return (
    <button className={styles.questionBox} onClick={() => onClick(question)}>
      {question}
    </button>
  );
};

export default SampleQuestion;
