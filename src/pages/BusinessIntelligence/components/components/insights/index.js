import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { akkiourl } from "../../../../../utils/const";
import { Spin } from "antd";
import { useQuery } from "react-query";
import { IconButton } from "@mui/material";
import { FaRobot, FaEye } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import ChatDataPrep from "../popups/chatdataprep";

export const Insights = () => {
  const [showModel, setShowModel] = useState(false);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${akkiourl}/dashboard`);
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

  const {
    data: chartData,
    isLoading,
    refetch,
  } = useQuery(["chartData"], fetchChartData, {
    staleTime: Infinity,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handleClick = (chartIndex) => {
    setIndex(chartIndex);
    setShowModel(true)
  };

  const handleChatprepData = () => {
    // localStorage.setItem("prepData", JSON.stringify(chartData));
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

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Spin className="spinner" size={"large"} />
      </div>
    );
  if (!chartData) return <div>No data available</div>;

  return (
    <>
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
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  position: "relative",
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                }}
              >
                <div
                  onClick={() => handleClick(index + 1)}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                    backgroundColor: "transparent",
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
  );
};
