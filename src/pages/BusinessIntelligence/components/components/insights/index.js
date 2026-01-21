import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { akkiourl } from "../../../../../utils/const";
import { Spin, message } from "antd";
import { useQuery } from "react-query";
import { IconButton } from "@mui/material";
import { FaRobot, FaEye } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import ChatDataPrep from "../popups/chatdataprep";
import "../../styles/datasource.scss";
import "../../components/prediction/index.css";
import EmptyState from "../../../../../components/EmptyState";

export const Insights = () => {
  const filename = typeof window !== 'undefined' ? (localStorage.getItem('filename') || '') : '';
  const [showModel, setShowModel] = useState(false);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState("basic"); // "basic" or "advanced"

  // Fetch chart data with chartType
  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${akkiourl}/dashboard?type=${chartType}`);
      let charts = response.data.charts;

      if (typeof response?.data === "string") {
        try {
          const cleanedString = response.data.replace(/NaN/g, "null");
          charts = JSON.parse(cleanedString).charts;
        } catch (parseError) {
          console.warn("JSON parse failed, returning as-is:", parseError);
        }
      }

      // Parse chart_data if it's a string
      charts.forEach(chart => {
        if (typeof chart.chart_data === 'string') {
          try {
            chart.chart_data = JSON.parse(chart.chart_data);
          } catch (e) {
            console.error("Failed to parse chart_data", e);
          }
        }
      });

      return charts;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
        return null;
      }
      console.error("Failed to fetch chart data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // useQuery key includes chartType so it refetches on tab change
  const {
    data: chartData,
    isLoading,
    refetch,
  } = useQuery(["chartData", chartType], fetchChartData, {
    staleTime: Infinity,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    enabled: !!filename
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Tab click handler
  const handleTabChange = (type) => {
    setChartType(type);
  };

  // Save individual chart as image
  const handleSaveChart = async (chartIndex) => {
    try {
      const plotElement = document.querySelector(`.plot-container-${chartIndex}`);
      if (!plotElement) {
        message.error('Chart not found');
        return;
      }

      const svgElement = plotElement.querySelector('.js-plotly-plot .plot-container .svg-container svg');
      if (!svgElement) {
        message.error('Chart SVG not found');
        return;
      }

      message.loading({ content: 'Saving chart...', key: `saveChart-${chartIndex}` });

      await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          try {
            canvas.width = svgElement.getBoundingClientRect().width * 2;
            canvas.height = svgElement.getBoundingClientRect().height * 2;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);

            const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
            
            if (!savedImages.includes(imageData)) {
              savedImages.push(imageData);
              localStorage.setItem('savedImages', JSON.stringify(savedImages));
              message.success({ 
                content: 'Chart saved to reports!', 
                key: `saveChart-${chartIndex}`,
                duration: 2
              });
            } else {
              message.info({ 
                content: 'Chart already saved', 
                key: `saveChart-${chartIndex}`,
                duration: 2
              });
            }
            resolve();
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };

        img.src = url;
      });
    } catch (error) {
      console.error(`Error saving chart ${chartIndex}:`, error);
      message.error({ 
        content: 'Failed to save chart', 
        key: `saveChart-${chartIndex}`,
        duration: 2
      });
    }
  };

  const handleClick = (chartIndex) => {
    setIndex(chartIndex);
    setShowModel(true)
  };

  const handleChatprepData = () => {
    setShowModel(true);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refetch();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!filename ? (
        <EmptyState />
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Spin className="spinner" size={"large"} />
        </div>
      ) : !chartData ? (
        <div>No data available</div>
      ) : (
      <>
      {/* Tabs for Basic/Advance */}
      <div className="main-tabs" style={{marginTop: 16}}>
        <button
          className={`main-tab-button${chartType === "basic" ? " active" : ""}`}
          onClick={() => handleTabChange("basic")}
        >
          Basic
        </button>
        <button
          className={`main-tab-button${chartType === "advanced" ? " active" : ""}`}
          onClick={() => handleTabChange("advanced")}
        >
          Advance
        </button>
      </div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          margin: "12px",
          borderRadius: "14px",
          background:
            "linear-gradient(90deg, rgba(106,108,246,1) 0%, rgba(139,92,246,1) 100%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FaEye size={24} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>Visualizations</div>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.6)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <FiRefreshCw size={18} /> Refresh
        </button>
      </div>

      <div style={{ padding: "12px", maxWidth: "100%", overflow: "hidden" }}>
        {chartData?.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 600px), 1fr))",
              gap: "20px",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {chartData.map((item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "20px",
                  width: "100%",
                  overflow: "hidden",
                  height: "480px",
                  backgroundColor: "transparent",
                  position: "relative",
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                }}
              >
                {/* Save button positioned at top right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveChart(index);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 10,
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #3b82f6",
                    background: "white",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#3b82f6";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = "#3b82f6";
                  }}
                >
                  Save
                </button>
                <div
                  onClick={() => handleClick(index + 1)}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Plot
                    data={item?.chart_data?.data.map((trace) => ({
                      ...trace,
                      showlegend: false,
                    }))}
                    layout={{
                      ...item?.chart_data?.layout,
                      showlegend: false,
                      autosize: true,
                      margin: { l: 0, r: 50, t: 100, b: 40 },
                      title: {
                        ...(item?.chart_data?.layout?.title || {}),
                        text: item?.chart_data?.layout?.title?.text || "",
                        font: {
                          size: 18,
                          family: "Arial, sans-serif",
                        },
                        wrap: true,
                        xref: "paper",
                        y: 1.1,
                        xanchor: "left",
                        pad: { t: 20 },
                        width: "95%",
                      },
                      width: undefined,
                      height: undefined,
                      plot_bgcolor: "transparent",
                      paper_bgcolor: "transparent",
                    }}
                    config={{
                      responsive: true,
                      displayModeBar: false,
                      toImageButtonOptions: {
                        format: "png",
                        filename: "chart",
                        height: 600,
                        width: 800,
                        scale: 1,
                      },
                    }}
                    style={{
                      width: "100%",
                      height: "440px",
                      padding: "0",
                      margin: "0",
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      outline: "none",
                    }}
                    useResizeHandler={true}
                    className={`plot-container plot-container-${index}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No charts available</div>
        )}
      </div>

      <ChatDataPrep {...{ showModel, setShowModel, index, chartData }} />

      <IconButton
        onClick={handleChatprepData}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          backgroundColor: "#1976d2",
          color: "white",
          width: 56,
          height: 56,
          borderRadius: "50%",
          boxShadow: 4,
          transition: "background-color 0.3s, transform 0.2s",
          '&:hover': {
            backgroundColor: "#1565c0",
            transform: "scale(1.1)"
          }
        }}
      >
        <FaRobot size={28} />
      </IconButton>
      </>
      )}
    </>
  );
};
