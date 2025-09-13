import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadFile } from '../services/api';
import styles from '../styles/Upload.module.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Validate file type (PDF only)
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file only.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    // Get JWT token from localStorage (assuming it's stored there after login)
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please login first.');
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadFile(file, token);
      
      if (response.success) {
        toast.success(
          `${response.message}\n` +
          `File: ${response.filename}\n` +
          `Size: ${(response.fileSize / 1024 / 1024).toFixed(2)} MB\n` +
          `Text extracted: ${response.extracted_text_length} characters\n` +
          `Chunks created: ${response.chunks_created}`
        );
        
        // Reset form
        setFile(null);
        // Reset file input
        e.target.reset();
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <h2>Upload PDF File</h2>
      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className={styles.fileInput}
          disabled={isUploading}
        />
        <button 
          type="submit" 
          className={styles.uploadBtn}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {file && (
        <div className={styles.fileInfo}>
          <p>Selected file: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
};

export default Upload;
