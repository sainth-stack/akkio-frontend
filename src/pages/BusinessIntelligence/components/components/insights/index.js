import React, { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { akkiourl } from "../../../../../utils/const";

export const Insights = () => {
  const [chartData, setChartData] = useState(null); // To store chart data
  const [loading, setLoading] = useState(false); // To manage loading state
  const [error, setError] = useState(null); // To handle errors

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.post(`${akkiourl}/dashboard`);
        console.log(response.data);
        setChartData(response.data.charts); // Set the charts data
      } catch (err) {
        setError(err.message); // Handle any error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchChartData(); // Fetch chart data on component mount
  }, []);

  if (loading) return <div>Loading...</div>; // Show loading indicator
  if (error) return <div>Error: {error}</div>; // Show error message
  if (!chartData) return <div>No data available</div>; // Handle no data case

  return (
    <div style={{ padding: "12px" }}>
      {/* <h1>Insights</h1> */}
      {chartData?.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {chartData.map((item, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              {/* <h2>{item.layout?.title?.text || `Chart ${index + 1}`}</h2> */}
              <Plot
                data={item.data}
                layout={item.layout}
                config={{ responsive: true }}
                style={{
                  width: "100%",
                  height: "60vh",
                  padding: "15px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  // boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  // transition: "box-shadow 0.3s ease",
                }}
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
