import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Grid, Card, CardContent, Typography, Button, Modal, Box } from "@mui/material";

export const ReportsGenBI = () => {
  const [savedPlots, setSavedPlots] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);

  useEffect(() => {
    // Get the saved plots from localStorage
    const plots = JSON.parse(localStorage.getItem("genbi") || "[]");
    setSavedPlots(plots);
  }, []);

  const handleRemovePlot = (index) => {
    // Remove the selected plot from savedPlots and update localStorage
    const updatedPlots = [...savedPlots];
    updatedPlots.splice(index, 1);
    setSavedPlots(updatedPlots);
    localStorage.setItem("genbi", JSON.stringify(updatedPlots));
  };

  const handlePlotClick = (plotData) => {
    setSelectedPlot(plotData);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPlot(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      {savedPlots.length === 0 ? (
        <Typography variant="body1">No reports saved yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {savedPlots.map((plotData, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                style={{
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  padding: "10px",
                }}
              >
                <div onClick={() => handlePlotClick(plotData)} style={{ cursor: "pointer" }}>
                  <Plot
                    data={plotData?.chartData?.data}
                    layout={{ ...plotData?.chartData?.layout, autosize: true }}
                    config={{ responsive: true }}
                    style={{ width: "100%", height: "250px" }}
                    className="plot-container"
                  />
                </div>
                <CardContent style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleRemovePlot(index)}
                      style={{ marginTop: "10px" }}
                    >
                      Remove
                    </Button>
                  </div>
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
          {selectedPlot && (
            <Plot
              data={selectedPlot?.chartData?.data}
              layout={{ ...selectedPlot?.chartData?.layout, autosize: true }}
              config={{ responsive: true }}
              style={{ width: "100%", height: "60vh" }}
              className="plot-container"
            />
          )}
        </Box>
      </Modal>
    </div>
  );
};
