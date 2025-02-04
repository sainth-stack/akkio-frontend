import React, { useEffect, useState } from "react";
import styles from "../styles/AnswersAccordion.module.css"; // New CSS file for styling chat messages
import { CircularProgress, Button } from "@mui/material";
import botImage from "../../../assets/images/ChatbotImg.jpg"
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
        style={{
          backgroundColor: "#f5f5f5",
          textAlign: "left",
          padding: ".3rem",
          marginBottom: ".3rem",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "80%",
        }}
      >
        <img
          src={botImage}
          width={30} // Adjusted size for better appearance
          height={30}
          alt="Bot"
          style={{
            borderRadius: "50%", // Makes the image circular
            background: "none", // Removes any background
          }}
        />
        <div>
          <strong>{question}</strong>
        </div>
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
                  flexDirection: "column",
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
