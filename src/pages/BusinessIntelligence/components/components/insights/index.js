import React, { useState, useRef } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { akkiourl } from "../../../../../utils/const";
import { Spin, Button, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";

export const Insights = ({chartData,loading,handleClick}) => {
  // const [chartData, setChartData] = useState(null); // To store chart data
  // const [loading, setLoading] = useState(false); // To manage loading state
  const [savingStates, setSavingStates] = useState({}); // To manage save loading state for each chart
  const plotRefs = useRef({}); // Store references to plot elements
  
  // Function to wait for element to be ready
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkForElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkForElement, 100);
        } else {
          resolve(null);
        }
      };
      checkForElement();
    });
  };

  // Function to clean and validate base64 string
  const cleanBase64String = (base64String) => {
    if (!base64String) return null;
    
    // Remove data URL prefix if present
    let cleanBase64 = base64String;
    if (base64String.startsWith('data:image/')) {
      const base64Index = base64String.indexOf('base64,');
      if (base64Index !== -1) {
        cleanBase64 = base64String.substring(base64Index + 7);
      }
    }
    
    // Add proper padding if needed
    const padding = cleanBase64.length % 4;
    if (padding) {
      cleanBase64 += '='.repeat(4 - padding);
    }
    
    // Validate base64 string
    try {
      atob(cleanBase64);
      return cleanBase64;
    } catch (err) {
      console.error('Invalid base64 string:', err);
      return null;
    }
  };

  // Function to convert specific chart to base64 using multiple methods
  const convertChartToBase64 = async (chartIndex) => {
    try {
      console.log('Converting chart to base64 for index:', chartIndex);
      
      // Wait for plot container to be ready
      const plotContainer = await waitForElement(`.plot-container-${chartIndex}`);
      
      if (!plotContainer) {
        console.error('Plot container not found for index:', chartIndex);
        return null;
      }

      console.log('Plot container found:', plotContainer);

      // Method 1: Try to find plotly div and use window.Plotly
      const plotlyDiv = plotContainer.querySelector('.js-plotly-plot');
      console.log('Plotly div found:', !!plotlyDiv);
      
      if (plotlyDiv && window.Plotly) {
        try {
          console.log('Attempting window.Plotly.toImage...');
          const base64 = await window.Plotly.toImage(plotlyDiv, {
            format: 'png',
            width: 800,
            height: 600,
            scale: 1
          });
          console.log('Base64 conversion successful using window.Plotly.toImage');
          const cleanBase64 = cleanBase64String(base64);
          if (cleanBase64) {
            console.log('Cleaned base64 string length:', cleanBase64.length);
            return cleanBase64;
          }
        } catch (plotlyErr) {
          console.log('window.Plotly.toImage failed:', plotlyErr);
        }
      }

      // Method 2: Try all canvas elements
      const allCanvases = plotContainer.querySelectorAll('canvas');
      console.log('Found canvases:', allCanvases.length);
      
      if (allCanvases.length > 0) {
        // Try each canvas
        for (let i = 0; i < allCanvases.length; i++) {
          try {
            const canvas = allCanvases[i];
            console.log(`Trying canvas ${i}:`, canvas.width, 'x', canvas.height);
            
            // Check if canvas has content
            if (canvas.width > 0 && canvas.height > 0) {
              const base64 = canvas.toDataURL('image/png');
              if (base64 && base64.length > 100) { // Make sure we have actual content
                console.log('Base64 conversion successful using canvas method');
                const cleanBase64 = cleanBase64String(base64);
                if (cleanBase64) {
                  console.log('Cleaned base64 string length:', cleanBase64.length);
                  return cleanBase64;
                }
              }
            }
          } catch (canvasErr) {
            console.log(`Canvas ${i} failed:`, canvasErr);
          }
        }
      }

      // Method 3: Try SVG if available
      const svg = plotContainer.querySelector('svg');
      if (svg) {
        try {
          console.log('Attempting SVG conversion...');
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          return new Promise((resolve) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const base64 = canvas.toDataURL('image/png');
              console.log('SVG conversion successful');
              const cleanBase64 = cleanBase64String(base64);
              if (cleanBase64) {
                console.log('Cleaned base64 string length:', cleanBase64.length);
                resolve(cleanBase64);
              } else {
                resolve(null);
              }
            };
            img.onerror = () => {
              console.log('SVG conversion failed');
              resolve(null);
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
          });
        } catch (svgErr) {
          console.log('SVG method failed:', svgErr);
        }
      }

      console.error('All conversion methods failed');
      return null;
      
    } catch (err) {
      console.error('Error converting chart to base64:', err);
      return null;
    }
  };

  // Function to save individual chart
  const handleSaveChart = async (chartIndex) => {
    console.log('Save clicked for chart:', chartIndex);
    
    if (!chartData || chartData.length === 0) {
      message.error('No chart to save');
      return;
    }

    // Set saving state for this specific chart
    setSavingStates(prev => ({ ...prev, [chartIndex]: true }));
    
    try {
      // Wait longer for chart to be fully rendered
      console.log('Waiting for chart to render...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const base64Image = await convertChartToBase64(chartIndex);
      console.log('Base64 image result:', !!base64Image);
      
      if (!base64Image) {
        message.error('Failed to convert chart to image. Chart may not be fully loaded.');
        return;
      }

      // Get email from localStorage
      let userEmail = 'rangamrammohan123@gmail.com'; // fallback email
      try {
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
          const user = JSON.parse(userFromStorage);
          if (user.email) {
            userEmail = user.email;
          }
        }
      } catch (err) {
        console.error('Error getting user email from localStorage:', err);
      }

      // Extract only chart data and layout for API
      const chartItem = chartData[chartIndex];
      const chartDataForAPI = {
        data: chartItem?.chart_data?.data || [],
        layout: chartItem?.chart_data?.layout || {}
      };

      // Prepare form data for single chart
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('json_data', JSON.stringify(chartDataForAPI));
      formData.append('image_base64', base64Image);

      console.log('FormData prepared for API call');

      // Make API call
      console.log('Making API call to:', `${akkiourl}/save_reports`);
      const response = await axios.post(`${akkiourl}/save_reports`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API response:', response.data);

      if (response.data.status === 'Report updated' || response.data.status === 'Report inserted') {
        message.success('Chart saved successfully!');
      } else {
        message.error('Failed to save chart');
      }
    } catch (err) {
      console.error('Error saving chart:', err);
      message.error('Error saving chart: ' + (err.response?.data?.message || err.message));
    } finally {
      // Remove saving state for this specific chart
      setSavingStates(prev => ({ ...prev, [chartIndex]: false }));
    }
  };

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

  if (loading) return <div style={{display:'flex',justifyContent:'center',width:'100%'}}>
  <Spin className="spinner" size={"large"} />
</div>; // Show loading indicator
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
              width: "100%",
              overflow: "hidden",
              height:'480px',
              cursor: "pointer",
              backgroundColor: "transparent",
              position: "relative",
              border: "none",
              boxShadow: "none",
              outline: "none"
            }}>
              {/* Individual Save button for each chart */}
              <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 1000
              }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveChart(index);
                  }}
                  loading={savingStates[index] || false}
                  disabled={savingStates[index] || false}
                  style={{
                    backgroundColor: "#4f46e5",
                    borderColor: "#4f46e5",
                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
                  }}
                >
                  {savingStates[index] ? 'Saving...' : 'Save'}
                </Button>
              </div>

              <div onClick={()=>handleClick(index+1)} style={{
                width: "100%",
                height: "100%",
                border: "none",
                boxShadow: "none",
                outline: "none",
                backgroundColor: "transparent"
              }}>
                <Plot
                  ref={(el) => {
                    if (el) plotRefs.current[index] = el;
                  }}
                  data={item?.chart_data?.data.map(trace => ({
                    ...trace,
                    showlegend: false
                  }))}
                  layout={{
                    ...item?.chart_data?.layout,
                    showlegend: false,
                    autosize: true,
                    margin: { l: 0, r: 50, t: 100, b: 40 },
                    title: {
                      ...(item?.chart_data?.layout?.title || {}),
                      text: item?.chart_data?.layout?.title?.text || '',
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
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent'
                  }}
                  config={{
                    responsive: true,
                    displayModeBar: false,
                    toImageButtonOptions: {
                      format: 'png',
                      filename: 'chart',
                      height: 600,
                      width: 800,
                      scale: 1
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "440px",
                    padding: "0",
                    margin: "0",
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    outline: "none"
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
  );
};
