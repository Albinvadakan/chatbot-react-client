import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadFile } from '../services/api';
import styles from '../styles/Upload.module.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sample file upload history data
  const [uploadHistory] = useState([
    {
      id: 1,
      fileName: 'sugar_test_report.pdf',
      uploadDate: '2025-10-04',
      uploadTime: '14:30:25'
    },
    {
      id: 2,
      fileName: 'endoscopy_results.pdf',
      uploadDate: '2025-10-03',
      uploadTime: '09:15:42'
    },
    {
      id: 3,
      fileName: 'blood_pressure_report.pdf',
      uploadDate: '2025-10-02',
      uploadTime: '16:45:10'
    },
    {
      id: 4,
      fileName: 'cholesterol_test.pdf',
      uploadDate: '2025-10-01',
      uploadTime: '11:20:33'
    },
    {
      id: 5,
      fileName: 'thyroid_function_test.pdf',
      uploadDate: '2025-09-30',
      uploadTime: '13:55:18'
    }
  ]);

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
        // Show specific server error message if available
        const errorMessage = response.message || 'Upload failed. Please try again.';
        const fileInfo = response.filename ? `File: ${response.filename}\n` : '';
        const sizeInfo = response.fileSize ? `Size: ${(response.fileSize / 1024 / 1024).toFixed(2)} MB\n` : '';
        const timestamp = response.uploadedAt ? `Uploaded at: ${new Date(response.uploadedAt).toLocaleString()}\n` : '';
        
        toast.error(
          `${errorMessage}\n` +
          `${fileInfo}` +
          `${sizeInfo}` +
          `${timestamp}`
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Check if error response contains server message
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.response && error.response.data) {
        const serverResponse = error.response.data;
        if (serverResponse.message) {
          errorMessage = serverResponse.message;
          const fileInfo = serverResponse.filename ? `\nFile: ${serverResponse.filename}` : '';
          const sizeInfo = serverResponse.fileSize ? `\nSize: ${(serverResponse.fileSize / 1024 / 1024).toFixed(2)} MB` : '';
          const timestamp = serverResponse.uploadedAt ? `\nUploaded at: ${new Date(serverResponse.uploadedAt).toLocaleString()}` : '';
          
          errorMessage += fileInfo + sizeInfo + timestamp;
        }
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
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
      
      {/* File Upload History Table */}
      <div className={styles.historySection}>
        <h3>Upload History</h3>
        <div className={styles.tableContainer}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
          </table>
          <div className={styles.tableBodyContainer}>
            <table className={styles.historyTable}>
              <tbody>
                {uploadHistory.map((record) => (
                  <tr key={record.id}>
                    <td className={styles.fileName}>{record.fileName}</td>
                    <td>{record.uploadDate}</td>
                    <td>{record.uploadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
