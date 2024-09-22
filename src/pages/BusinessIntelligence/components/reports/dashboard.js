import React, { useEffect, useState } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, Button, Modal, Box, IconButton } from '@mui/material';
import { IoCloudDownload } from "react-icons/io5";
export const DashboardReports = () => {
  const [savedImages, setSavedImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Get the saved images from localStorage
    const images = JSON.parse(localStorage.getItem('savedImages') || '[]');
    setSavedImages(images);
  }, []);

  const handleRemoveImage = (index) => {
    // Remove the selected image from savedImages and update localStorage
    const updatedImages = [...savedImages];
    updatedImages.splice(index, 1);
    setSavedImages(updatedImages);
    localStorage.setItem('savedImages', JSON.stringify(updatedImages));
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedImage(null);
  };

  const handleDownloadImage = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'report_image'; // You can customize the filename
    link.click();
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Image Reports
      </Typography>
      {savedImages.length === 0 ? (
        <Typography variant="body1">No images saved yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {savedImages.map((imageUrl, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={imageUrl}
                  alt={`Report Image ${index + 1}`}
                  onClick={() => handleImageClick(imageUrl)}
                  style={{ cursor: 'pointer' }}
                />
                <CardContent style={{ padding: '16px', textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Report Image {index + 1}
                  </Typography>
                  <IconButton onClick={() => handleDownloadImage(imageUrl)} color="primary">
                    <IoCloudDownload />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleRemoveImage(index)}
                    style={{ marginTop: '10px' }}
                  >
                    Remove
                  </Button>
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
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img src={selectedImage} alt="Full view" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
        </Box>
      </Modal>
    </div>
  );
};
