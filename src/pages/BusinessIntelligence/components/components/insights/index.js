import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { akkiourl } from "../../../../../utils/const";

export const Insights = ({chartData,loading}) => {
  // const [chartData, setChartData] = useState(null); // To store chart data
  // const [loading, setLoading] = useState(false); // To manage loading state
  const [error, setError] = useState(null); // To handle errors

  // useEffect(() => {
  //   const fetchChartData = async () => {
  //     setLoading(true); // Start loading
  //     try {
  //       const response = await axios.post(`${akkiourl}/dashboard`);
  //       console.log(response.data);
  //       setChartData(response.data.charts); // Set the charts data
  //     } catch (err) {
  //       setError(err.message); // Handle any error
  //     } finally {
  //       setLoading(false); // Stop loading
  //     }
  //   };

  //   fetchChartData(); // Fetch chart data on component mount
  // }, []);

  if (loading) return <div>Loading...</div>; // Show loading indicator
  if (error) return <div>Error: {error}</div>; // Show error message
  if (!chartData) return <div>No data available</div>; // Handle no data case

  return (
    <div style={{ padding: "12px", maxWidth: "100%", overflow: "hidden" }}>
      {/* <h1>Insights</h1> */}
      {chartData?.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 600px), 1fr))",
            gap: "20px",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {chartData.map((item, index) => (
            <div key={index} style={{
              marginBottom: "20px",
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
              width: "100%",
              overflow: "hidden",
            }}>
              <Plot
                data={item.data.map(trace => ({
                  ...trace,
                  showlegend: false
                }))}
                layout={{
                  ...item.layout,
                  showlegend: false,
                  autosize: true,
                  margin: { l: 0, r: 50, t: 100, b: 40 },
                  title: {
                    ...(item.layout.title || {}),
                    text: item.layout.title?.text || '',
                    font: {
                      size: 18,
                      family: 'Arial, sans-serif'
                    },
                    wrap: true,
                    xref: 'paper',
                    y: 1.1,
                    xanchor: 'left',
                    pad: { t: 20 },
                    width: '95%'
                  },
                  width: undefined,
                  height: undefined,
                }}
                config={{
                  responsive: true,
                  displayModeBar: false
                }}
                style={{
                  width: "100%",
                  height: "400px", // Reduced height for better responsiveness
                  padding: "10px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                }}
                useResizeHandler={true}
                className="plot-container"
              />
            </div>
          ))}
        </div>
      ) : (
        <div>No charts available</div>
      )}
    </div>
  );
};
