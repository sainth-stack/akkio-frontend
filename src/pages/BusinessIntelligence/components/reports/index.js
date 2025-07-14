import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Button, Modal, Box, CircularProgress, Alert } from "@mui/material";
import Plot from 'react-plotly.js';
import { akkiourl } from "../../../../utils/const";
import ChatDataPrep from "../components/popups/chatdataprep";

export const ReportsGenBI = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  // ChatDataPrep states
  const [showModel, setShowModel] = useState(false);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user email from localStorage or context
        const userEmail =JSON.parse(localStorage.getItem("user")).email;
      
      const formData = new FormData();
      formData.append("email", userEmail);

      const response = await fetch(`${akkiourl}/get_reports`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert the response to an array format for easier handling
      const reportsArray = Array.isArray(data) ? data : [data];
      
      // Process reports to include plotly_json if available
      const processedReports = reportsArray.map(report => ({
        ...report,
        plotly_json: report.plotly_json || null
      }));
      
      setReports(processedReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareToEmail = async () => {
    try {
      setEmailLoading(true);
      setEmailSuccess(false);
      setError(null);
      
      // Get user email from localStorage or context
      const userEmail = JSON.parse(localStorage.getItem("user")).email;
      
      const formData = new FormData();
      formData.append("email", userEmail);

      const response = await fetch(`${akkiourl}/email_reports`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "Email sent successfully.") {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000); // Hide success message after 3 seconds
      }
    } catch (err) {
      console.error("Error sharing reports via email:", err);
      setError("Failed to send email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleReportClick = (report, index) => {
    setSelectedReport(report);
    setSelectedReportIndex(index);
    setShowModel(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedReport(null);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const parsePlotlyJson = (plotlyJsonString) => {
    try {
      return JSON.parse(plotlyJsonString);
    } catch (error) {
      console.error("Error parsing plotly_json:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: "20px" }}>
          Loading reports...
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Typography variant="h4">
          Reports
        </Typography>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button 
            variant="outlined" 
            onClick={handleShareToEmail} 
            disabled={emailLoading || loading}
          >
            {emailLoading ? <CircularProgress size={20} /> : "Share to Email"}
          </Button>
          <Button variant="contained" onClick={handleRefresh} disabled={loading}>
            Refresh Reports
          </Button>
        </div>
      </div>

      {error && (
        <Alert severity="error" style={{ marginBottom: "20px" }}>
          {error}
        </Alert>
      )}

      {emailSuccess && (
        <Alert severity="success" style={{ marginBottom: "20px" }}>
          Email sent successfully! Check your inbox for the reports.
        </Alert>
      )}

      {reports.length === 0 && !loading ? (
        <Typography variant="body1">No reports available.</Typography>
      ) : (
        <Grid container spacing={2}>
          {reports.map((report, index) => (
            <Grid item xs={12} sm={6} md={6} key={report.id || index}>
              <Card
                style={{
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  padding: "10px",
                  width: "100%",
                }}
              >
                <div onClick={() => handleReportClick(report, index)} style={{ cursor: "pointer" }}>
                  {report.plotly_json ? (
                    (() => {
                      const plotlyData = parsePlotlyJson(report.plotly_json);
                      return plotlyData ? (
                        <Plot
                          data={plotlyData.data}
                          layout={{
                            ...plotlyData.layout,
                            width: undefined,
                            height: 330,
                            autosize: true,
                            margin: { l: 40, r: 40, t: 40, b: 40 }
                          }}
                          config={{
                            displayModeBar: false,
                            responsive: true
                          }}
                          style={{
                            width: "100%",
                            height: "330px"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "330px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "4px"
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Invalid chart data
                          </Typography>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "330px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px"
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        No chart data available
                      </Typography>
                    </div>
                  )}
                </div>
                <CardContent style={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(report.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Full View Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "90%",
            height: "90%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {selectedReport && (
            <>
              <Typography variant="h6" gutterBottom>
                Report Details
              </Typography>
              {selectedReport.plotly_json ? (
                (() => {
                  const plotlyData = parsePlotlyJson(selectedReport.plotly_json);
                  return plotlyData ? (
                    <Plot
                      data={plotlyData.data}
                      layout={{
                        ...plotlyData.layout,
                        width: undefined,
                        height: undefined,
                        autosize: true
                      }}
                      config={{
                        displayModeBar: true,
                        responsive: true
                      }}
                      style={{
                        width: "100%",
                        height: "80%"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "80%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px"
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        Invalid chart data
                      </Typography>
                    </div>
                  );
                })()
              ) : (
                <div style={{
                  width: "100%",
                  height: "80%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px"
                }}>
                  <Typography variant="body1" color="text.secondary">
                    No chart data available
                  </Typography>
                </div>
              )}
              <Button
                variant="contained"
                onClick={handleClose}
                style={{ marginTop: "20px" }}
              >
                Close
              </Button>
            </>
          )}
        </Box>
      </Modal>

      {/* ChatDataPrep Component */}
      <ChatDataPrep
        showModel={showModel}
        setShowModel={setShowModel}
        index={selectedReportIndex}
        chartData={reports}
        isReportMode={true}
      />
    </div>
  );
};
