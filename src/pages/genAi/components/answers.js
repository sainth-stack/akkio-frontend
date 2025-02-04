import React, { useEffect, useState } from "react";
import styles from "../styles/AnswersAccordion.module.css"; // New CSS file for styling chat messages
import { CircularProgress, Button } from "@mui/material";

const AnswersChat = ({
  question,
  answer,
  loading,
  type,
  name = "savedImages",
}) => {
  const [isSaved, setIsSaved] = useState(false); // To manage save status
  const imageUrl = answer;

  useEffect(() => {
    // Check if the image is already saved in localStorage
    const savedImages = JSON.parse(localStorage.getItem(name) || "[]");
    setIsSaved(savedImages.includes(imageUrl));
  }, [imageUrl]);

  const saveImage = () => {
    let savedImages = JSON.parse(localStorage.getItem(name) || "[]");

    // Add the new image URL if it doesn't already exist
    if (!savedImages.includes(imageUrl)) {
      savedImages.push(imageUrl);
      localStorage.setItem(name, JSON.stringify(savedImages));
      setIsSaved(true); // Mark the image as saved
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Question Bubble */}
      <div
        className={styles.chatMessage}
        style={{ backgroundColor: "#f1f1f1", textAlign: "left" }}
      >
        <strong>{question}</strong>
      </div>

      {/* Answer Bubble */}
      {loading ? (
        <div
          style={{ display: "flex", width: "100%", justifyContent: "center" }}
        >
          <CircularProgress size={24} />
        </div>
      ) : (
        <div className={styles.answerBubble}>
          {type === "Text" ? (
            <div>{answer}</div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                      alignItems: "center",
                  flexDirection:"column"
                }}
              >
                <img src={imageUrl} width={200} height={150} alt="" />
                {!isSaved && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveImage}
                    style={{ marginTop: "10px" }}
                  >
                    Save Image
                  </Button>
                )}
              </div>
              {isSaved && (
                <div style={{ marginTop: "10px" }}>
                  Image already saved to Dashboard
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswersChat;
