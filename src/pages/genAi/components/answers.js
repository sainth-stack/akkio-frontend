import React, { useEffect, useState } from "react";
import styles from "../styles/AnswersAccordion.module.css"; // CSS for professional styling
import { CircularProgress, Button } from "@mui/material";

import botImage from "../../../assets/images/botImage.jpg"
const AnswersChat = ({
  question,
  answer,
  loading,
  type,
  name = "savedImages",
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const imageUrl = answer;

  useEffect(() => {
    const savedImages = JSON.parse(localStorage.getItem(name) || "[]");
    setIsSaved(savedImages.includes(imageUrl));
  }, [imageUrl, name]);

  const saveImage = () => {
    let savedImages = JSON.parse(localStorage.getItem(name) || "[]");
    if (!savedImages.includes(imageUrl)) {
      savedImages.push(imageUrl);
      localStorage.setItem(name, JSON.stringify(savedImages));
      setIsSaved(true);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Question Section */}
      {/* <div className={`${styles.chatMessage} ${styles.question}`}>
        <strong>{question}</strong>
      </div> */}

      {/* Answer Section */}
      

      {loading ? (
        <div className={styles.loadingContainer}>
          <CircularProgress size={32} color="primary" />
        </div>
      ) : (
        <div className={`${styles.chatMessage} ${styles.answer}`}>
          {type === "Text" ? (
            <div>
              <img
                src={botImage}
                width={30} // Adjusted size for better appearance
                height={30}
                alt="Bot"
                style={{
                  borderRadius: "50%", // Makes the image circular
                  background: "none",
                  margin: ".3rem",
                  boxShadow:"1px gray"// Removes any background
                }}
              />
              {answer}
            </div>
          ) : (
            <div className={styles.imageContainer}>
              <img src={imageUrl} alt="Generated" className={styles.image} />
              {!isSaved ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveImage}
                  className={styles.saveButton}
                >
                  Save Image
                </Button>
              ) : (
                <div className={styles.savedText}>✅ Image already saved</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswersChat;
