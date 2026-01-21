import React, { useEffect, useState } from "react";
import styles from "../../../../genAi/styles/AnswersAccordion.module.css"; // CSS for professional styling
import { CircularProgress, Button } from "@mui/material";
import Plot from "react-plotly.js";

import botImage from "../../../../../assets/images/botImage.jpg"
const AnswersChat2 = ({
  question,
  answer,
  loading,
  type,
  name = "savedImages",
  plotData = null,
  data = null,
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

              <span dangerouslySetInnerHTML={{ __html: answer }} />

              {/* Render forecast/prediction plot if available */}
              {plotData && (() => {
                try {
                  console.log('[AnswersChat2] plotData received:', plotData);
                  const parsedPlot = typeof plotData === 'string' ? JSON.parse(plotData) : plotData;
                  console.log('[AnswersChat2] Parsed plot:', parsedPlot);
                  
                  if (!parsedPlot || !parsedPlot.data || !Array.isArray(parsedPlot.data) || parsedPlot.data.length === 0) {
                    console.warn('[AnswersChat2] Invalid plot data structure');
                    return null;
                  }
                  
                  return (
                    <div style={{ marginTop: '16px', width: '100%', height: '400px', minHeight: '400px' }}>
                      <Plot
                        data={parsedPlot.data}
                        layout={{
                          ...parsedPlot.layout,
                          autosize: true,
                          paper_bgcolor: '#ffffff',
                          plot_bgcolor: '#ffffff',
                          margin: { l: 60, r: 40, t: 60, b: 60 },
                        }}
                        config={{ 
                          responsive: true,
                          displaylogo: false,
                          displayModeBar: true
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  );
                } catch (e) {
                  console.error('[AnswersChat2] Error rendering plot:', e, 'plotData:', plotData);
                  return (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      backgroundColor: '#fee', 
                      borderRadius: '4px',
                      color: '#c33'
                    }}>
                      Error rendering chart: {e.message}
                    </div>
                  );
                }
              })()}

              {/* Render forecast data table if available */}
              {data && data.date && data.forecasted_value && (
                <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={{
                          padding: '8px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e2e8f0'
                        }}>Date</th>
                        <th style={{
                          padding: '8px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e2e8f0'
                        }}>Forecasted Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(data.date).map((key) => (
                        <tr key={key}>
                          <td style={{
                            padding: '8px',
                            borderBottom: '1px solid #f1f5f9'
                          }}>{data.date[key]}</td>
                          <td style={{
                            padding: '8px',
                            borderBottom: '1px solid #f1f5f9'
                          }}>{data.forecasted_value[key].toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

export default AnswersChat2;
