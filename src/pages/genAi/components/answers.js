import React, { useEffect, useState } from 'react';
import styles from '../styles/AnswersAccordion.module.css';
import { CircularProgress, Button } from '@mui/material';

const AnswersAccordion = ({ question, answer, loading, type ,name='savedImages'}) => {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = answer;
  const [isSaved, setIsSaved] = useState(false); // To manage save status

  useEffect(() => {
    // Check if the image is already saved in localStorage
    const savedImages = JSON.parse(localStorage.getItem(name) || '[]');
    setIsSaved(savedImages.includes(imageUrl));
  }, [imageUrl]);

  const saveImage = () => {
    let savedImages = JSON.parse(localStorage.getItem(name) || '[]');

    // Add the new image URL if it doesn't already exist
    if (!savedImages.includes(imageUrl)) {
      savedImages.push(imageUrl);
      localStorage.setItem(name, JSON.stringify(savedImages));
      setIsSaved(true); // Mark the image as saved
    }
  };

  return (
    <div className={styles.accordionItem}>
      <div className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <span>{isOpen ? '-' : '+'}</span>
      </div>
      {isOpen && (
        <div className={styles.accordionContent}>
          {loading ? (
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </div>
          ) : (
            <div>
              {type === 'Text' ? (
                <div>{answer}</div>
              ) : (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                    <img src={imageUrl} width={700} height={500} alt='' />
                    {!isSaved && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={saveImage}
                        style={{ marginTop: '10px' }}
                      >
                        Save Image
                      </Button>
                    )}
                  </div>
                  {isSaved && <div style={{ marginTop: '10px' }}>Image already to Dashboard</div>}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswersAccordion;
