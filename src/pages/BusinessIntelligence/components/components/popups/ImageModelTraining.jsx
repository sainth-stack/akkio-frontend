import React, { useState, useRef } from 'react';
import { Modal, Input, Button, Upload, message, Select, Tag, Space, Radio, Alert } from 'antd';
import { InboxOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import axios from 'axios';
import { akkiourl } from '../../../../../utils/const';

const { Dragger } = Upload;

export const ImageModelTraining = ({ isOpen, onClose, onTrainingComplete }) => {
  const [modelName, setModelName] = useState('');
  const [fileList, setFileList] = useState([]);
  const [labels, setLabels] = useState({});
  const [isTraining, setIsTraining] = useState(false);
  const [epochs, setEpochs] = useState(5);
  const [uploadMode, setUploadMode] = useState('folder'); // 'folder' or 'files'
  const [autoDetectedClasses, setAutoDetectedClasses] = useState({});
  const folderInputRef = useRef(null);

  const handleFolderSelect = (event) => {
    const allFiles = Array.from(event.target.files);
    if (allFiles.length === 0) return;

    // Filter out system files like .DS_Store, Thumbs.db, etc.
    const files = allFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      return !fileName.startsWith('.ds_store') && 
             !fileName.startsWith('thumbs.db') && 
             !fileName.startsWith('desktop.ini') &&
             !fileName.startsWith('.');
    });

    if (files.length === 0) {
      message.error('No valid image files found in the selected folder');
      return;
    }

    if (allFiles.length > files.length) {
      message.info(`Filtered out ${allFiles.length - files.length} system files`);
    }

    // Auto-detect labels from folder structure
    const detectedLabels = {};
    const detectedClasses = {};
    
    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      // Format: FolderName/ClassName/image.jpg
      if (pathParts.length >= 3) {
        const className = pathParts[pathParts.length - 2]; // Parent folder name
        detectedLabels[file.name] = className;
        if (!detectedClasses[className]) {
          detectedClasses[className] = [];
        }
        detectedClasses[className].push(file.name);
      } else if (pathParts.length === 2) {
        // If direct upload: FolderName/image.jpg, use folder name as class
        const className = pathParts[0];
        detectedLabels[file.name] = className;
        if (!detectedClasses[className]) {
          detectedClasses[className] = [];
        }
        detectedClasses[className].push(file.name);
      }
    });

    setAutoDetectedClasses(detectedClasses);

    // Create file list with auto-detected labels
    const newFileList = files.map((file, index) => ({
      uid: `${file.name}-${index}`,
      name: file.name,
      status: 'done',
      originFileObj: file
    }));

    setFileList(newFileList);
    
    // Set labels based on file names
    const labelMap = {};
    newFileList.forEach(file => {
      labelMap[file.uid] = detectedLabels[file.name] || '';
    });
    setLabels(labelMap);

    message.success(`Loaded ${files.length} images from ${Object.keys(detectedClasses).length} classes`);
  };

  const handleFileChange = (info) => {
    // Filter out system files
    const filteredFileList = info.fileList.filter(file => {
      const fileName = file.name.toLowerCase();
      return !fileName.startsWith('.ds_store') && 
             !fileName.startsWith('thumbs.db') && 
             !fileName.startsWith('desktop.ini') &&
             !fileName.startsWith('.');
    });

    const newFileList = filteredFileList.map(file => ({
      ...file,
      status: 'done'
    }));
    setFileList(newFileList);
    
    // Initialize labels for new files
    newFileList.forEach(file => {
      if (!labels[file.uid]) {
        setLabels(prev => ({ ...prev, [file.uid]: '' }));
      }
    });
  };

  const handleLabelChange = (fileUid, value) => {
    setLabels(prev => ({ ...prev, [fileUid]: value }));
  };

  const handleRemoveFile = (file) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
    setLabels(prev => {
      const newLabels = { ...prev };
      delete newLabels[file.uid];
      return newLabels;
    });
  };

  const handleTrain = async () => {
    // Validation
    if (!modelName.trim()) {
      message.error('Please enter a model name');
      return;
    }

    if (fileList.length < 2) {
      message.error('Please upload at least 2 images');
      return;
    }

    // Check if all files have labels
    const unlabeledFiles = fileList.filter(f => !labels[f.uid] || !labels[f.uid].trim());
    if (unlabeledFiles.length > 0) {
      message.error('Please assign labels to all images');
      return;
    }

    // Check for at least 2 different classes
    const uniqueLabels = new Set(Object.values(labels).filter(l => l.trim()));
    if (uniqueLabels.size < 2) {
      message.error('Please use at least 2 different class labels');
      return;
    }

    setIsTraining(true);

    try {
      const formData = new FormData();
      formData.append('model_name', modelName.trim());
      formData.append('user_email', localStorage.getItem('user_email') || 'admin@gmail.com');
      formData.append('epochs', epochs);

      // Add files
      fileList.forEach(file => {
        formData.append('files', file.originFileObj || file);
      });

      // Add labels as JSON
      const labelArray = fileList.map(file => labels[file.uid].trim());
      formData.append('labels', JSON.stringify(labelArray));

      const response = await axios.post(`${akkiourl}/image/train`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      if (response.data.status === 'success') {
        message.success(`Model "${modelName}" trained successfully!`);
        
        // Reset form
        setModelName('');
        setFileList([]);
        setLabels({});
        setEpochs(5);
        setAutoDetectedClasses({});
        setUploadMode('folder');

        if (onTrainingComplete) {
          onTrainingComplete(response.data);
        }

        onClose();
      } else {
        message.error(response.data.message || 'Training failed');
      }
    } catch (error) {
      console.error('Training error:', error);
      message.error(error.response?.data?.detail || 'Failed to train model. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const getUniqueLabelOptions = () => {
    const usedLabels = Object.values(labels).filter(l => l.trim());
    return [...new Set(usedLabels)];
  };

  return (
    <Modal
      title="Train Image Classification Model"
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isTraining}>
          Cancel
        </Button>,
        <Button
          key="train"
          type="primary"
          loading={isTraining}
          onClick={handleTrain}
          disabled={fileList.length < 2 || !modelName.trim()}
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </Button>
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Model Name */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Model Name <span style={{ color: 'red' }}>*</span>
          </label>
          <Input
            placeholder="e.g., defect_detector, quality_checker"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            size="large"
            disabled={isTraining}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            Choose a descriptive name for your model
          </div>
        </div>

        {/* Epochs */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Training Epochs
          </label>
          <Select
            value={epochs}
            onChange={setEpochs}
            style={{ width: '100%' }}
            size="large"
            disabled={isTraining}
          >
            <Select.Option value={3}>3 (Fast)</Select.Option>
            <Select.Option value={5}>5 (Recommended)</Select.Option>
            <Select.Option value={10}>10 (Better Accuracy)</Select.Option>
            <Select.Option value={15}>15 (Best Quality)</Select.Option>
          </Select>
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            More epochs = better accuracy but longer training time
          </div>
        </div>

        {/* Upload Mode Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Upload Method
          </label>
          <Radio.Group
            value={uploadMode}
            onChange={(e) => {
              setUploadMode(e.target.value);
              setFileList([]);
              setLabels({});
              setAutoDetectedClasses({});
            }}
            disabled={isTraining}
          >
            <Radio.Button value="folder">
              <FolderOpenOutlined /> Upload Folder (Auto-detect classes)
            </Radio.Button>
            <Radio.Button value="files">
              <InboxOutlined /> Upload Files (Manual labels)
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* File Upload */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Upload Images <span style={{ color: 'red' }}>*</span>
          </label>

          {uploadMode === 'folder' ? (
            <>
              <div
                style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: 4,
                  padding: 40,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fafafa'
                }}
                onClick={() => folderInputRef.current?.click()}
              >
                <p style={{ fontSize: 48, margin: 0, color: '#999' }}>
                  <FolderOpenOutlined />
                </p>
                <p style={{ fontSize: 16, marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                  Click to select folder with images
                </p>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
                  Folder structure: ParentFolder/ClassName/images.jpg
                </p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Class names will be auto-detected from folder names
                </p>
              </div>
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                accept="image/*"
                onChange={handleFolderSelect}
                style={{ display: 'none' }}
                disabled={isTraining}
              />
              
              {Object.keys(autoDetectedClasses).length > 0 && (
                <Alert
                  message={`Auto-detected ${Object.keys(autoDetectedClasses).length} classes`}
                  description={
                    <div>
                      {Object.entries(autoDetectedClasses).map(([className, files]) => (
                        <div key={className}>
                          <strong>{className}</strong>: {files.length} images
                        </div>
                      ))}
                    </div>
                  }
                  type="success"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          ) : (
            <Dragger
              multiple
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              accept="image/*"
              disabled={isTraining}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag images to upload</p>
              <p className="ant-upload-hint">
                Upload images for training (minimum 2 images, at least 2 different classes)
              </p>
            </Dragger>
          )}
        </div>

        {/* File List with Labels */}
        {fileList.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              {uploadMode === 'folder' ? 'Detected Labels' : 'Assign Labels to Images'} ({fileList.length} images)
            </label>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {fileList.slice(0, 10).map(file => (
                  <div
                    key={file.uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 8,
                      background: '#f5f5f5',
                      borderRadius: 4
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    {uploadMode === 'folder' ? (
                      <Tag color="blue">{labels[file.uid]}</Tag>
                    ) : (
                      <Select
                        placeholder="Select or type class name"
                        style={{ width: 200 }}
                        value={labels[file.uid]}
                        onChange={(value) => handleLabelChange(file.uid, value)}
                        disabled={isTraining}
                        showSearch
                        allowClear
                        dropdownRender={menu => (
                          <>
                            {menu}
                            <div style={{ padding: '8px', borderTop: '1px solid #d9d9d9' }}>
                              <Input
                                placeholder="Type new class name"
                                onPressEnter={(e) => {
                                  const value = e.target.value.trim();
                                  if (value) {
                                    handleLabelChange(file.uid, value);
                                  }
                                }}
                              />
                            </div>
                          </>
                        )}
                      >
                        {getUniqueLabelOptions().map(label => (
                          <Select.Option key={label} value={label}>
                            {label}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFile(file)}
                      disabled={isTraining}
                    />
                  </div>
                ))}
                {fileList.length > 10 && (
                  <div style={{ textAlign: 'center', padding: 8, color: '#666', fontSize: 12 }}>
                    ... and {fileList.length - 10} more images
                  </div>
                )}
              </Space>
            </div>
            
            {/* Show class distribution */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Class Distribution:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.from(new Set(Object.values(labels).filter(l => l.trim()))).map(label => {
                  const count = Object.values(labels).filter(l => l === label).length;
                  return (
                    <Tag key={label} color="blue">
                      {label}: {count}
                    </Tag>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div style={{ 
          background: '#e6f7ff', 
          border: '1px solid #91d5ff', 
          borderRadius: 4, 
          padding: 12,
          fontSize: 13
        }}>
          <strong>Quick Guide:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            {uploadMode === 'folder' ? (
              <>
                <li><strong>Folder Upload</strong>: Organize images in folders by class name</li>
                <li>Example: Tomato_Dataset/Tomato___Bacterial_spot/, Tomato___Early_blight/, etc.</li>
                <li>Class names are auto-detected from folder names</li>
                <li>Perfect for large datasets (1000s of images)</li>
                <li><strong>Training images will be deleted after model is trained</strong> (only model stored)</li>
              </>
            ) : (
              <>
                <li>Upload images and manually assign class labels</li>
                <li>Assign the same label to images of the same class</li>
                <li>At least 2 different classes with minimum 2 images required</li>
                <li>More images per class = better accuracy</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ImageModelTraining;

